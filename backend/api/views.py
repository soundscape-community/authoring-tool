# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.
# Copyright (c) Soundscape Community Contributors.

from django.contrib.auth import get_user_model
from django.conf import settings
from django.db.models import Q as UserQ
from django.http import HttpResponse
from django.core.files.base import ContentFile
from django.db import models, transaction
from django.utils import timezone
from users.models import Team, TeamMembership

from rest_framework.viewsets import ModelViewSet, GenericViewSet
from rest_framework.mixins import ListModelMixin
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView

from .models import (
    Activity,
    Folder,
    FolderTeamPermission,
    FolderPermissionAccess,
    FolderUserPermission,
    MediaType,
    Waypoint,
    WaypointGroup,
    WaypointGroupType,
    WaypointMedia,
)
from .permissions import can_manage_team, can_write_activity, get_accessible_folder_ids, resolve_folder_access
from .serializers import (
    ActivityListSerializer,
    ActivityDetailSerializer,
    FolderPermissionSerializer,
    FolderSerializer,
    TeamMembershipSerializer,
    TeamSerializer,
    UserSerializer,
    WaypointGroupSerializer,
    WaypointSerializer,
    WaypointMediaSerializer,
)
from .model_utils import duplicate_activity, shift_waypoints_after_delete
from .gpx_utils import activity_to_gpx, gpx_to_activity


class ActivityWritePermissionMixin:
    """Shared helper that raises ValidationError when the user lacks write access."""

    def _check_activity_write_permission(self, activity):
        if not can_write_activity(self.request.user, activity):
            raise ValidationError("No write access to activity")


def gpx_response(content, filename):
    response = HttpResponse(content, content_type='application/gpx+xml')
    response['Content-Disposition'] = 'attachment; filename="{0}.gpx"'.format(filename)
    return response


def get_accessible_activity_queryset(user):
    if not user or not user.is_authenticated:
        return Activity.objects.none()
    if user.is_staff:
        return Activity.objects.all()
    accessible_folder_ids = get_accessible_folder_ids(user)
    return Activity.objects.filter(
        models.Q(author_id=str(user.id)) | models.Q(folder_id__in=accessible_folder_ids)
    ).distinct()


class RuntimeConfigView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                'show_beta_warning': settings.TESTING_WARNING_ENABLED,
                'beta_warning_message': settings.TESTING_WARNING_MESSAGE,
            }
        )


class ActivityViewSet(ModelViewSet):
    queryset = Activity.objects.all()

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Activity.objects.none()

        user_id = str(user.id)
        folder_id = self.request.query_params.get("folder_id")
        accessible_folder_ids = get_accessible_folder_ids(user)
        accessible_folder_ids_str = {str(folder_id) for folder_id in accessible_folder_ids}

        if folder_id:
            if folder_id == "none":
                if user.is_staff:
                    return Activity.objects.filter(folder__isnull=True)
                return Activity.objects.filter(author_id=user_id, folder__isnull=True)
            if folder_id in accessible_folder_ids_str:
                return Activity.objects.filter(folder_id=folder_id)
            return Activity.objects.none()

        return get_accessible_activity_queryset(user)

    def get_serializer_class(self):
        if self.action == 'list':
            return ActivityListSerializer
        return ActivityDetailSerializer

    def perform_create(self, serializer):
        # Make sure the user id is valid and append it to the activity
        user_id = self.request.user.id
        if user_id is None:
            raise ValidationError('Missing user id')

        with transaction.atomic():
            folder = serializer.validated_data.get("folder")
            if folder:
                access = resolve_folder_access(self.request.user, folder)
                if not access.can_write:
                    raise ValidationError("No write access to folder")
            instance = serializer.save(author_id=user_id)
            # Create default empty waypoint groups
            WaypointGroup(activity=instance, name='Default', type=WaypointGroupType.ORDERED).save()
            WaypointGroup(activity=instance, name='Points of Interest', type=WaypointGroupType.UNORDERED).save()

    def perform_update(self, serializer):
        current_folder = serializer.instance.folder
        if current_folder:
            current_access = resolve_folder_access(self.request.user, current_folder)
            if not current_access.can_write:
                raise PermissionDenied("No write access to folder")

        folder = serializer.validated_data.get("folder")
        if folder and folder != current_folder:
            access = resolve_folder_access(self.request.user, folder)
            if not access.can_write:
                raise PermissionDenied("No write access to folder")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if instance.folder:
            access = resolve_folder_access(user, instance.folder)
            if not access.can_write:
                raise PermissionDenied("No write access to folder")
        elif not user or not user.is_authenticated or str(instance.author_id) != str(user.id):
            raise PermissionDenied("No permission to delete activity")
        instance.delete()

    @action(detail=True, methods=['POST'], name='Duplicate')
    def duplicate(self, request, pk=None):
        activity = self.get_object()
        duplicated = duplicate_activity(activity)

        queryset = Activity.objects.get(id=duplicated.id)
        serializer = self.get_serializer(queryset, many=False)
        return Response(serializer.data)

    @action(detail=True, methods=['POST'], name='Publish')
    def publish(self, request, pk=None):
        activity: Activity = self.get_object()
        if not can_write_activity(request.user, activity):
            raise ValidationError("No write access to activity")

        content = activity_to_gpx(activity)
        content_bytes = bytes(content, 'utf-8')
        content_file = ContentFile(content_bytes)

        activity.storePublishedFile(content_file)

        activity.last_published = timezone.now()
        activity.unpublished_changes = False
        activity.save(update_fields=['last_published', 'unpublished_changes'])

        queryset = Activity.objects.get(id=activity.id)
        serializer = self.get_serializer(queryset, many=False)
        return Response(serializer.data)

    @action(detail=True, methods=['GET'], name='Export GPX')
    def export_gpx(self, request, pk=None):
        activity = self.get_object()
        content = activity_to_gpx(activity)
        return gpx_response(content, activity.name)

    @action(detail=False, methods=['POST'], name='Import GPX')
    def import_gpx(self, request):
        gpx = request.FILES.get('gpx')
        if gpx is None:
            raise ValidationError('Missing GPX file')

        user = self.request.user
        if user is None:
            raise ValidationError('Missing user')

        try:
            activity: Activity = gpx_to_activity(gpx, user)
        except Exception as e:
            raise ValidationError(
                'Invalid activity. Please use a previously exported GPX file containing the activity.')

        serializer = self.get_serializer(activity, many=False)
        return Response(serializer.data)


class WaypointGroupViewSet(ActivityWritePermissionMixin, ModelViewSet):
    queryset = WaypointGroup.objects.all()
    serializer_class = WaypointGroupSerializer

    def get_queryset(self):
        return WaypointGroup.objects.filter(activity__in=get_accessible_activity_queryset(self.request.user))

    def perform_create(self, serializer):
        self._check_activity_write_permission(serializer.validated_data["activity"])
        serializer.save()

    def perform_update(self, serializer):
        self._check_activity_write_permission(serializer.instance.activity)
        serializer.save()

    def perform_destroy(self, instance):
        self._check_activity_write_permission(instance.activity)
        instance.delete()


class WaypointViewSet(ActivityWritePermissionMixin, ModelViewSet):
    queryset = Waypoint.objects.all()
    serializer_class = WaypointSerializer

    def get_queryset(self):
        return Waypoint.objects.filter(
            group__activity__in=get_accessible_activity_queryset(self.request.user)
        )

    # Lifecycle

    def perform_create(self, serializer):
        with transaction.atomic():
            group: WaypointGroup = serializer.validated_data['group']
            self._check_activity_write_permission(group.activity)
            if group.type == WaypointGroupType.ORDERED:
                newWaypointIndex = group.newWaypointIndex
                serializer.save(index=newWaypointIndex)
            else:
                serializer.save()

            self.save_media(serializer=serializer)

    def save_media(self, serializer):
        # Images
        images = self.request.FILES.getlist('images[]')
        image_alts = self.request.data.getlist('image_alts[]')

        if len(image_alts) < len(images):
            raise ValidationError("image_alts[] length must match the number of uploaded images")

        for i, image in enumerate(images):
            image_alt = image_alts[i]
            WaypointMedia(waypoint=serializer.instance,
                          media=image,
                          type=MediaType.IMAGE,
                          mime_type=image.content_type,
                          description=image_alt,
                          index=i).save()

        # Audio clips
        audio_clips = self.request.FILES.getlist('audio_clips[]')
        audio_clip_texts = self.request.data.getlist('audio_clip_texts[]')

        if len(audio_clip_texts) < len(audio_clips):
            raise ValidationError("audio_clip_texts[] length must match the number of uploaded audio clips")

        for i, audio_clip in enumerate(audio_clips):
            audio_clip_text = audio_clip_texts[i]
            WaypointMedia(waypoint=serializer.instance,
                          media=audio_clip,
                          type=MediaType.AUDIO,
                          mime_type=audio_clip.content_type,
                          description=audio_clip_text,
                          index=i).save()

    @transaction.atomic
    def perform_update(self, serializer):
        group = serializer.instance.group
        self._check_activity_write_permission(group.activity)

        if group.type == WaypointGroupType.UNORDERED:
            # No need to update index, save.
            serializer.save()
            self.save_media(serializer=serializer)
            return

        current_index = serializer.instance.index
        updated_index = serializer.validated_data['index']

        if current_index == updated_index:
            # No need to update index, save.
            serializer.save()
            self.save_media(serializer=serializer)
            return

        if updated_index < 0:
            raise ValidationError("Waypoint index cannot be lower than 0")

        if abs(current_index - updated_index) != 1:
            raise ValidationError("At the moment a waypoint index can only be increased or decreased by 1")

        try:
            other_waypoint = Waypoint.objects.get(group=group, index=updated_index)
        except Waypoint.DoesNotExist:
            serializer.save()
            self.save_media(serializer=serializer)
            return

        # Swap between waypoint indexes
        # Temporarily set the other waypoint to -1 to avoid the error:
        # django.db.utils.IntegrityError: duplicate key value violates unique constraint "unique_group_index"
        other_waypoint.index = -1
        other_waypoint.save()

        serializer.save()
        self.save_media(serializer=serializer)

        other_waypoint.index = current_index
        other_waypoint.save()

    def perform_destroy(self, instance):
        group: WaypointGroup = instance.group
        self._check_activity_write_permission(group.activity)
        deleted_index = instance.index

        instance.delete()

        if group.type == WaypointGroupType.ORDERED:
            shift_waypoints_after_delete(group, deleted_index)


class WaypointMediaViewSet(ActivityWritePermissionMixin, ModelViewSet):
    queryset = WaypointMedia.objects.all()
    serializer_class = WaypointMediaSerializer

    def get_queryset(self):
        return WaypointMedia.objects.filter(
            waypoint__group__activity__in=get_accessible_activity_queryset(self.request.user)
        )

    def perform_create(self, serializer):
        waypoint_id = self.request.data.get("waypoint")
        if not waypoint_id:
            raise ValidationError("Missing waypoint")
        try:
            waypoint = Waypoint.objects.get(pk=waypoint_id)
        except Waypoint.DoesNotExist:
            raise ValidationError("Waypoint not found")
        self._check_activity_write_permission(waypoint.group.activity)
        serializer.save(waypoint=waypoint)

    def perform_update(self, serializer):
        self._check_activity_write_permission(serializer.instance.waypoint.group.activity)
        serializer.save()

    def perform_destroy(self, instance):
        self._check_activity_write_permission(instance.waypoint.group.activity)
        instance.delete()


class FolderViewSet(ModelViewSet):
    queryset = Folder.objects.all()
    serializer_class = FolderSerializer

    def _validate_parent(self, folder, parent):
        if not parent:
            return
        if folder and parent.id == folder.id:
            raise ValidationError("Folder cannot be its own parent")
        current = parent
        depth = 0
        seen_ids = set()
        while current is not None and depth < 100:
            if current.id in seen_ids:
                break
            if folder and current.id == folder.id:
                raise ValidationError("Folder cannot be moved under its descendant")
            seen_ids.add(current.id)
            current = current.parent
            depth += 1

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Folder.objects.none()
        if user.is_staff:
            return Folder.objects.all()
        accessible_ids = get_accessible_folder_ids(user)
        # Follow-up: replace ancestor traversal with a recursive CTE if needed for larger hierarchies.
        return Folder.objects.filter(id__in=accessible_ids)

    def perform_create(self, serializer):
        parent = serializer.validated_data.get("parent")
        if parent:
            access = resolve_folder_access(self.request.user, parent)
            if not access.can_write:
                raise ValidationError("No write access to parent folder")
        self._validate_parent(None, parent)
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        parent = serializer.validated_data.get("parent")
        if parent:
            access = resolve_folder_access(self.request.user, parent)
            if not access.can_write:
                raise ValidationError("No write access to parent folder")
        self._validate_parent(serializer.instance, parent)
        access = resolve_folder_access(self.request.user, serializer.instance)
        if not access.can_write:
            raise ValidationError("No write access to folder")
        serializer.save()

    def perform_destroy(self, instance):
        access = resolve_folder_access(self.request.user, instance)
        if not access.can_write:
            raise ValidationError("No write access to folder")
        instance.delete()


class FolderPermissionViewSet(GenericViewSet):
    serializer_class = FolderPermissionSerializer

    def _get_writable_folder_ids(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return set()
        if user.is_staff:
            return set(Folder.objects.values_list("id", flat=True))

        # Owned folders are always writable.
        owned_ids = set(Folder.objects.filter(owner=user).values_list("id", flat=True))

        # Folders with explicit WRITE permission for this user or their teams.
        team_ids = list(TeamMembership.objects.filter(user_id=user.id).values_list("team_id", flat=True))
        user_write_ids = set(
            FolderUserPermission.objects.filter(user_id=user.id, access=FolderPermissionAccess.WRITE)
            .values_list("folder_id", flat=True)
        )
        team_write_ids = set(
            FolderTeamPermission.objects.filter(team_id__in=team_ids, access=FolderPermissionAccess.WRITE)
            .values_list("folder_id", flat=True)
        )
        write_perm_folder_ids = user_write_ids | team_write_ids

        writable_ids = owned_ids | write_perm_folder_ids

        # Include descendants that inherit write access.
        frontier = set(writable_ids)
        while frontier:
            child_ids = set(
                Folder.objects.filter(parent_id__in=frontier)
                .exclude(id__in=writable_ids)
                .values_list("id", flat=True)
            )
            if not child_ids:
                break
            writable_ids |= child_ids
            frontier = child_ids

        return writable_ids

    def get_queryset(self):
        writable_ids = self._get_writable_folder_ids()
        user_qs = FolderUserPermission.objects.filter(folder_id__in=writable_ids).select_related("folder", "user")
        team_qs = FolderTeamPermission.objects.filter(folder_id__in=writable_ids).select_related("folder", "team")
        return list(user_qs) + list(team_qs)

    def _get_permission_object(self, permission_id):
        try:
            return FolderUserPermission.objects.select_related("folder", "user").get(pk=permission_id)
        except FolderUserPermission.DoesNotExist:
            try:
                return FolderTeamPermission.objects.select_related("folder", "team").get(pk=permission_id)
            except FolderTeamPermission.DoesNotExist as exc:
                raise ValidationError("Folder permission not found") from exc

    def list(self, request):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        instance = self._get_permission_object(pk)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_create(self, serializer):
        folder = serializer.validated_data["folder"]
        access = resolve_folder_access(self.request.user, folder)
        if not access.can_write:
            raise ValidationError("No permission to modify folder sharing")
        access_value = serializer.validated_data["access"]
        user = serializer.validated_data.get("user")
        team = serializer.validated_data.get("team")
        if user is not None:
            return FolderUserPermission.objects.create(
                folder=folder,
                user=user,
                access=access_value,
            )
        if team is None:
            raise ValidationError("Folder permission must specify a user or team principal")
        return FolderTeamPermission.objects.create(
            folder=folder,
            team=team,
            access=access_value,
        )

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = self.perform_create(serializer)
        response_serializer = self.get_serializer(instance)
        return Response(response_serializer.data, status=201)

    def perform_update(self, serializer):
        folder = serializer.instance.folder
        access = resolve_folder_access(self.request.user, folder)
        if not access.can_write:
            raise ValidationError("No permission to modify folder sharing")
        serializer.instance.access = serializer.validated_data.get("access", serializer.instance.access)
        serializer.instance.save(update_fields=["access", "updated"])

    def update(self, request, pk=None):
        instance = self._get_permission_object(pk)
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(self.get_serializer(instance).data)

    def partial_update(self, request, pk=None):
        instance = self._get_permission_object(pk)
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(self.get_serializer(instance).data)

    def perform_destroy(self, instance):
        folder = instance.folder
        access = resolve_folder_access(self.request.user, folder)
        if not access.can_write:
            raise ValidationError("No permission to modify folder sharing")
        instance.delete()

    def destroy(self, request, pk=None):
        instance = self._get_permission_object(pk)
        self.perform_destroy(instance)
        return Response(status=204)


class TeamViewSet(ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Team.objects.none()
        if user.is_staff:
            return Team.objects.all()
        return Team.objects.filter(
            models.Q(owner=user)
            | models.Q(memberships__user=user, memberships__role=TeamMembership.Role.ADMIN)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        if not can_manage_team(self.request.user, serializer.instance):
            raise ValidationError("No permission to manage this team")
        serializer.save()

    def perform_destroy(self, instance):
        if not can_manage_team(self.request.user, instance):
            raise ValidationError("No permission to manage this team")
        instance.delete()


class TeamMembershipViewSet(ModelViewSet):
    queryset = TeamMembership.objects.all()
    serializer_class = TeamMembershipSerializer

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return TeamMembership.objects.none()
        if user.is_staff:
            return TeamMembership.objects.all()
        return TeamMembership.objects.filter(
            models.Q(team__owner=user)
            | models.Q(team__memberships__user=user, team__memberships__role=TeamMembership.Role.ADMIN)
        ).distinct()

    def perform_create(self, serializer):
        team = serializer.validated_data["team"]
        if not can_manage_team(self.request.user, team):
            raise ValidationError("No permission to manage team memberships")
        serializer.save()

    def perform_update(self, serializer):
        team = serializer.instance.team
        if not can_manage_team(self.request.user, team):
            raise ValidationError("No permission to manage team memberships")
        serializer.save()

    def perform_destroy(self, instance):
        if not can_manage_team(self.request.user, instance.team):
            raise ValidationError("No permission to manage team memberships")
        instance.delete()


User = get_user_model()


class UserViewSet(ListModelMixin, GenericViewSet):
    """Read-only list of users with search support.

    Returns ``{id, username}`` for all users.  Accepts an optional
    ``?search=`` query parameter that filters by username (case-insensitive
    substring match).  Results are capped at 25 rows.
    """

    serializer_class = UserSerializer
    queryset = User.objects.all()

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return User.objects.none()
        qs = User.objects.order_by("username")
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(UserQ(username__icontains=search))
        return qs[:25]

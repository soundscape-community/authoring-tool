# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.
# Copyright (c) Soundscape Community Contributors.

from rest_framework import serializers

from django.contrib.auth import get_user_model
from users.models import Team, TeamMembership

from .models import (
    Activity,
    Folder,
    FolderTeamPermission,
    FolderPermissionAccess,
    FolderUserPermission,
    WaypointGroup,
    Waypoint,
    WaypointMedia,
)

User = get_user_model()


class WaypointMediaSerializer(serializers.ModelSerializer):
    media_url = serializers.URLField(read_only=True)

    class Meta:
        model = WaypointMedia
        fields = ['id', 'media_url', 'type', 'mime_type', 'description', 'index']


class WaypointSerializer(serializers.ModelSerializer):
    images = WaypointMediaSerializer(many=True, read_only=True)
    audio_clips = WaypointMediaSerializer(many=True, read_only=True)

    class Meta:
        model = Waypoint
        fields = ['id', 'latitude', 'longitude', 'group', 'type', 'index',
                  'name', 'description', 'departure_callout', 'arrival_callout', 'images', 'audio_clips']

    def get_validators(self):
        # Exclude the auto-generated UniqueTogetherValidator for (group, index).
        # The uniqueness constraint is enforced by the database and the view's
        # perform_update handles index swapping atomically.
        return [
            v for v in super().get_validators()
            if not (
                isinstance(v, serializers.UniqueTogetherValidator)
                and set(v.fields) == {'group', 'index'}
            )
        ]


class WaypointGroupSerializer(serializers.ModelSerializer):
    waypoints = WaypointSerializer(many=True, read_only=True)

    class Meta:
        model = WaypointGroup
        fields = ['id', 'activity', 'name', 'type', 'waypoints']


class ActivityListSerializer(serializers.ModelSerializer):
    image_url = serializers.URLField(read_only=True)

    class Meta:
        model = Activity
        fields = ['id', 'author_id', 'author_name', 'author_email', 'name', 'description',
                  'type', 'start', 'end', 'expires', 'image', 'image_url', 'image_alt', 'folder']
        extra_kwargs = {
            'image': {'write_only': True},
            'image_url': {'read_only': True},
        }


class ActivityDetailSerializer(serializers.ModelSerializer):
    waypoints_group = WaypointGroupSerializer(read_only=True)
    pois_group = WaypointGroupSerializer(read_only=True)

    image_url = serializers.URLField(read_only=True)

    class Meta:
        model = Activity
        fields = ['id', 'author_id', 'author_name', 'author_email', 'name', 'description', 'type',
                  'start', 'end', 'expires', 'unpublished_changes', 'can_link', 'image', 'image_url', 'image_alt', 'waypoints_group', 'pois_group', 'folder']
        extra_kwargs = {
            'image': {'write_only': True},
            'image_url': {'read_only': True},
        }


class FolderSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(read_only=True)

    def validate(self, attrs):
        name = attrs.get("name")
        parent = attrs.get("parent")
        instance = getattr(self, "instance", None)

        if instance and name is None:
            name = instance.name
        if instance and "parent" not in attrs:
            parent = instance.parent

        if name and parent is None:
            existing = Folder.objects.filter(parent__isnull=True, name=name)
            if instance:
                existing = existing.exclude(id=instance.id)
            if existing.exists():
                raise serializers.ValidationError("Root folder names must be globally unique.")

        return attrs

    class Meta:
        model = Folder
        fields = ['id', 'name', 'owner', 'parent', 'created', 'updated']


class FolderPermissionSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    folder = serializers.PrimaryKeyRelatedField(queryset=Folder.objects.all())
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False, allow_null=True)
    team = serializers.PrimaryKeyRelatedField(queryset=Team.objects.all(), required=False, allow_null=True)
    access = serializers.ChoiceField(choices=FolderPermissionAccess.choices)
    created = serializers.DateTimeField(read_only=True)
    updated = serializers.DateTimeField(read_only=True)
    user_detail = serializers.SerializerMethodField(read_only=True)
    team_detail = serializers.SerializerMethodField(read_only=True)

    def get_user_detail(self, obj):
        user = getattr(obj, 'user', None)
        if user:
            return {'id': user.id, 'username': user.username}
        return None

    def get_team_detail(self, obj):
        team = getattr(obj, 'team', None)
        if team:
            return {'id': team.id, 'name': team.name}
        return None

    def validate(self, attrs):
        user = attrs.get("user")
        team = attrs.get("team")

        if self.instance:
            if isinstance(self.instance, FolderUserPermission):
                if user is None and "user" not in attrs:
                    user = self.instance.user
                team = None
            elif isinstance(self.instance, FolderTeamPermission):
                if team is None and "team" not in attrs:
                    team = self.instance.team
                user = None
            if isinstance(self.instance, FolderUserPermission) and user is None:
                raise serializers.ValidationError("User permission requires user.")
            if isinstance(self.instance, FolderTeamPermission) and team is None:
                raise serializers.ValidationError("Team permission requires team.")
            return attrs

        if (user is None and team is None) or (user is not None and team is not None):
            raise serializers.ValidationError("Provide exactly one principal: user or team.")

        return attrs

    def to_representation(self, instance):
        is_user_permission = isinstance(instance, FolderUserPermission)
        user = instance.user if is_user_permission else None
        team = instance.team if not is_user_permission else None

        return {
            'id': instance.id,
            'folder': instance.folder_id,
            'user': user.id if user else None,
            'team': team.id if team else None,
            'access': instance.access,
            'created': instance.created,
            'updated': instance.updated,
            'user_detail': {'id': user.id, 'username': user.username} if user else None,
            'team_detail': {'id': team.id, 'name': team.name} if team else None,
        }


class TeamSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Team
        fields = ['id', 'name', 'owner', 'created', 'updated']


class TeamMembershipSerializer(serializers.ModelSerializer):
    user_detail = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = TeamMembership
        fields = ['id', 'team', 'user', 'role', 'created', 'updated', 'user_detail']

    def get_user_detail(self, obj):
        if obj.user:
            return {'id': obj.user.id, 'username': obj.user.username}
        return None


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']
        read_only_fields = ['id', 'username']

# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

from rest_framework import serializers

from .models import (
    Activity,
    Folder,
    FolderPermission,
    Group,
    GroupMembership,
    WaypointGroup,
    Waypoint,
    WaypointMedia,
)


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


class FolderPermissionSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        principal_type = attrs.get("principal_type")
        user = attrs.get("user")
        group = attrs.get("group")

        if self.instance:
            principal_type = principal_type or self.instance.principal_type
            if user is None and "user" not in attrs:
                user = self.instance.user
            if group is None and "group" not in attrs:
                group = self.instance.group

        if principal_type == FolderPermission.PrincipalType.USER:
            if user is None or group is not None:
                raise serializers.ValidationError(
                    "User principal requires user set and group unset."
                )
        elif principal_type == FolderPermission.PrincipalType.GROUP:
            if group is None or user is not None:
                raise serializers.ValidationError(
                    "Group principal requires group set and user unset."
                )
        elif user is not None or group is not None:
            raise serializers.ValidationError(
                "Folder permission must specify a user or group principal."
            )

        return attrs

    class Meta:
        model = FolderPermission
        fields = ['id', 'folder', 'principal_type', 'user', 'group', 'access', 'created', 'updated']


class GroupSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Group
        fields = ['id', 'name', 'owner', 'created', 'updated']


class GroupMembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupMembership
        fields = ['id', 'group', 'user', 'role', 'created', 'updated']

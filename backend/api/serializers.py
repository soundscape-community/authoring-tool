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

    class Meta:
        model = Folder
        fields = ['id', 'name', 'owner', 'parent', 'created', 'updated']


class FolderPermissionSerializer(serializers.ModelSerializer):
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

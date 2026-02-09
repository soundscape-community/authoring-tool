# Copyright (c) Soundscape Community Contributors.
from decimal import Decimal
from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import Activity, Folder, FolderPermission, Group, GroupMembership, Waypoint, WaypointGroup, WaypointGroupType


class WaypointAccessTests(APITestCase):
    def setUp(self):
        self.User = get_user_model()
        self.owner = self.User.objects.create_user(username="owner", password="pass")
        self.member = self.User.objects.create_user(username="member", password="pass")

        self.group = Group.objects.create(name="Editors", owner=self.owner)
        GroupMembership.objects.create(user=self.member, group=self.group)

        self.folder = Folder.objects.create(name="Root", owner=self.owner)
        self.activity = Activity.objects.create(
            author_id=str(self.owner.id),
            author_name="Owner",
            description="Shared activity",
            name="Shared Activity",
            folder=self.folder,
        )
        self.group_ordered = WaypointGroup.objects.create(
            activity=self.activity,
            name="Route",
            type=WaypointGroupType.ORDERED,
        )

    def test_read_access_blocks_waypoint_create(self):
        FolderPermission.objects.create(
            folder=self.folder,
            principal_type=FolderPermission.PrincipalType.GROUP,
            group=self.group,
            access=FolderPermission.Access.READ,
        )

        self.client.force_authenticate(user=self.member)
        response = self.client.post(
            "/api/v1/waypoints/",
            {
                "group": str(self.group_ordered.id),
                "name": "Waypoint",
                "description": "Test",
                "latitude": Decimal("1.000000"),
                "longitude": Decimal("2.000000"),
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_write_access_allows_waypoint_create(self):
        FolderPermission.objects.create(
            folder=self.folder,
            principal_type=FolderPermission.PrincipalType.GROUP,
            group=self.group,
            access=FolderPermission.Access.WRITE,
        )

        self.client.force_authenticate(user=self.member)
        response = self.client.post(
            "/api/v1/waypoints/",
            {
                "group": str(self.group_ordered.id),
                "name": "Waypoint",
                "description": "Test",
                "latitude": Decimal("1.000000"),
                "longitude": Decimal("2.000000"),
            },
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def _create_waypoint(self):
        """Helper to create a waypoint in the test activity."""
        return Waypoint.objects.create(
            group=self.group_ordered,
            name="WP1",
            description="Test waypoint",
            latitude=Decimal("1.000000"),
            longitude=Decimal("2.000000"),
            index=0,
        )

    def test_read_access_blocks_media_create(self):
        FolderPermission.objects.create(
            folder=self.folder,
            principal_type=FolderPermission.PrincipalType.GROUP,
            group=self.group,
            access=FolderPermission.Access.READ,
        )
        waypoint = self._create_waypoint()
        self.client.force_authenticate(user=self.member)

        fake_image = SimpleUploadedFile("img.png", b"\x89PNG\r\n", content_type="image/png")
        response = self.client.post(
            "/api/v1/waypoints_media/",
            {"waypoint": str(waypoint.id), "media": fake_image, "type": "image", "mime_type": "image/png"},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_write_access_allows_media_create(self):
        FolderPermission.objects.create(
            folder=self.folder,
            principal_type=FolderPermission.PrincipalType.GROUP,
            group=self.group,
            access=FolderPermission.Access.WRITE,
        )
        waypoint = self._create_waypoint()
        self.client.force_authenticate(user=self.member)

        fake_image = SimpleUploadedFile("img.png", b"\x89PNG\r\n", content_type="image/png")
        response = self.client.post(
            "/api/v1/waypoints_media/",
            {"waypoint": str(waypoint.id), "media": fake_image, "type": "image", "mime_type": "image/png"},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

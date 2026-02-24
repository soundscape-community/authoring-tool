# Copyright (c) Soundscape Community Contributors.
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

from api.models import FolderPermission, Waypoint, WaypointGroup, WaypointGroupType
from api.tests.base import FolderAPITestCase


class WaypointAccessTests(FolderAPITestCase):
    def setUp(self):
        super().setUp()
        self.folder = self.root
        self.activity = self._create_activity_in_folder(self.folder)
        self.group_ordered = WaypointGroup.objects.create(
            activity=self.activity,
            name="Route",
            type=WaypointGroupType.ORDERED,
        )

    def test_read_access_blocks_waypoint_create(self):
        self._grant_access(self.folder, team=self.team, access=FolderPermission.Access.READ)

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
        self._grant_access(self.folder, team=self.team, access=FolderPermission.Access.WRITE)

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
        self._grant_access(self.folder, team=self.team, access=FolderPermission.Access.READ)
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
        self._grant_access(self.folder, team=self.team, access=FolderPermission.Access.WRITE)
        waypoint = self._create_waypoint()
        self.client.force_authenticate(user=self.member)

        fake_image = SimpleUploadedFile("img.png", b"\x89PNG\r\n", content_type="image/png")
        response = self.client.post(
            "/api/v1/waypoints_media/",
            {"waypoint": str(waypoint.id), "media": fake_image, "type": "image", "mime_type": "image/png"},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_read_access_blocks_waypoint_update(self):
        self._grant_access(self.folder, team=self.team, access=FolderPermission.Access.READ)
        waypoint = self._create_waypoint()
        self.client.force_authenticate(user=self.member)

        response = self.client.patch(
            f"/api/v1/waypoints/{waypoint.id}/",
            {"name": "New Name"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_read_access_blocks_waypoint_delete(self):
        self._grant_access(self.folder, team=self.team, access=FolderPermission.Access.READ)
        waypoint = self._create_waypoint()
        self.client.force_authenticate(user=self.member)

        response = self.client.delete(f"/api/v1/waypoints/{waypoint.id}/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_write_access_allows_waypoint_update(self):
        self._grant_access(self.folder, team=self.team, access=FolderPermission.Access.WRITE)
        waypoint = self._create_waypoint()
        self.client.force_authenticate(user=self.member)

        response = self.client.patch(
            f"/api/v1/waypoints/{waypoint.id}/",
            {"name": "New Name", "index": 0},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_write_access_allows_waypoint_delete(self):
        self._grant_access(self.folder, team=self.team, access=FolderPermission.Access.WRITE)
        waypoint = self._create_waypoint()
        self.client.force_authenticate(user=self.member)

        response = self.client.delete(f"/api/v1/waypoints/{waypoint.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class UnauthenticatedAccessTests(FolderAPITestCase):
    """Verify all API endpoints reject unauthenticated requests."""

    def test_activities_requires_auth(self):
        response = self.client.get("/api/v1/activities/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_folders_requires_auth(self):
        response = self.client.get("/api/v1/folders/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_waypoints_requires_auth(self):
        response = self.client.get("/api/v1/waypoints/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teams_requires_auth(self):
        response = self.client.get("/api/v1/teams/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_folder_permissions_requires_auth(self):
        response = self.client.get("/api/v1/folder_permissions/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

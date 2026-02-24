# Copyright (c) Soundscape Community Contributors.
from django.contrib.auth import get_user_model
from rest_framework import status

from api.models import Activity, FolderPermission
from api.tests.base import FolderAPITestCase, User


class ActivitySharingTests(FolderAPITestCase):
    def setUp(self):
        super().setUp()
        self.staff = User.objects.create_user(username="staff", password="pass", is_staff=True)

        self.folder = self.root  # alias for readability
        self.activity = self._create_activity_in_folder(self.folder)

    def test_read_access_allows_list_and_detail(self):
        self._grant_access(self.folder, team=self.team, access=FolderPermission.Access.READ)

        self.client.force_authenticate(user=self.member)

        list_response = self.client.get("/api/v1/activities/")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        activity_ids = {item["id"] for item in list_response.data}
        self.assertIn(str(self.activity.id), activity_ids)

        detail_response = self.client.get(f"/api/v1/activities/{self.activity.id}/")
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.data["name"], "Test Activity")

    def test_read_access_denies_update_and_delete(self):
        self._grant_access(self.folder, team=self.team, access=FolderPermission.Access.READ)

        self.client.force_authenticate(user=self.member)

        update_response = self.client.patch(
            f"/api/v1/activities/{self.activity.id}/",
            {"name": "Not Allowed"},
        )
        self.assertEqual(update_response.status_code, status.HTTP_400_BAD_REQUEST)

        delete_response = self.client.delete(f"/api/v1/activities/{self.activity.id}/")
        self.assertEqual(delete_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_write_access_allows_update_and_delete(self):
        self._grant_access(self.folder, team=self.team, access=FolderPermission.Access.WRITE)

        self.client.force_authenticate(user=self.member)

        update_response = self.client.patch(
            f"/api/v1/activities/{self.activity.id}/",
            {"name": "Allowed"},
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["name"], "Allowed")

        delete_response = self.client.delete(f"/api/v1/activities/{self.activity.id}/")
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)

    def test_staff_can_view_activity(self):
        self.client.force_authenticate(user=self.staff)
        list_response = self.client.get("/api/v1/activities/")

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        activity_ids = {item["id"] for item in list_response.data}
        self.assertIn(str(self.activity.id), activity_ids)

    def test_staff_can_edit_unfoldered_activity(self):
        activity = Activity.objects.create(
            author_id=str(self.owner.id),
            author_name="Owner",
            description="Unfoldered",
            name="Unfoldered Activity",
        )

        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(
            f"/api/v1/activities/{activity.id}/",
            {"name": "Staff Updated"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Staff Updated")

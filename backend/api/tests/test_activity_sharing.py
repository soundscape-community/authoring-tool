from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import Activity, Folder, FolderPermission, Group, GroupMembership


class ActivitySharingTests(APITestCase):
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

    def test_read_access_allows_list_and_detail(self):
        FolderPermission.objects.create(
            folder=self.folder,
            principal_type=FolderPermission.PrincipalType.GROUP,
            group=self.group,
            access=FolderPermission.Access.READ,
        )

        self.client.force_authenticate(user=self.member)

        list_response = self.client.get("/api/v1/activities/")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        activity_ids = {item["id"] for item in list_response.data}
        self.assertIn(str(self.activity.id), activity_ids)

        detail_response = self.client.get(f"/api/v1/activities/{self.activity.id}/")
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.data["name"], "Shared Activity")

    def test_read_access_denies_update_and_delete(self):
        FolderPermission.objects.create(
            folder=self.folder,
            principal_type=FolderPermission.PrincipalType.GROUP,
            group=self.group,
            access=FolderPermission.Access.READ,
        )

        self.client.force_authenticate(user=self.member)

        update_response = self.client.patch(
            f"/api/v1/activities/{self.activity.id}/",
            {"name": "Not Allowed"},
        )
        self.assertEqual(update_response.status_code, status.HTTP_400_BAD_REQUEST)

        delete_response = self.client.delete(f"/api/v1/activities/{self.activity.id}/")
        self.assertEqual(delete_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_write_access_allows_update_and_delete(self):
        FolderPermission.objects.create(
            folder=self.folder,
            principal_type=FolderPermission.PrincipalType.GROUP,
            group=self.group,
            access=FolderPermission.Access.WRITE,
        )

        self.client.force_authenticate(user=self.member)

        update_response = self.client.patch(
            f"/api/v1/activities/{self.activity.id}/",
            {"name": "Allowed"},
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["name"], "Allowed")

        delete_response = self.client.delete(f"/api/v1/activities/{self.activity.id}/")
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)

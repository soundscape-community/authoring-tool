# Copyright (c) Soundscape Community Contributors.
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import Group, GroupMembership

from api.models import Activity, Folder, FolderPermission


class FolderApiTests(APITestCase):
    def setUp(self):
        self.User = get_user_model()
        self.owner = self.User.objects.create_user(username="owner", password="pass")
        self.member = self.User.objects.create_user(username="member", password="pass")

    def test_owner_can_create_folder(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post("/api/v1/folders/", {"name": "Root"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Root")
        self.assertEqual(self.owner.id, response.data["owner"])

    def test_group_permission_allows_read(self):
        group = Group.objects.create(name="Editors", owner=self.owner)
        GroupMembership.objects.create(user=self.member, group=group)

        root = Folder.objects.create(name="Root", owner=self.owner)
        FolderPermission.objects.create(
            folder=root,
            principal_type=FolderPermission.PrincipalType.GROUP,
            group=group,
            access=FolderPermission.Access.READ,
        )

        self.client.force_authenticate(user=self.member)
        response = self.client.get("/api/v1/folders/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        folder_ids = {item["id"] for item in response.data}
        self.assertIn(str(root.id), folder_ids)

    def test_owner_can_manage_group_membership(self):
        self.client.force_authenticate(user=self.owner)
        group_response = self.client.post("/api/v1/groups/", {"name": "Team"}, format="json")

        self.assertEqual(group_response.status_code, status.HTTP_201_CREATED)
        group_id = group_response.data["id"]

        membership_response = self.client.post(
            "/api/v1/group_memberships/",
            {"group": group_id, "user": str(self.member.id), "role": "member"},
            format="json",
        )

        self.assertEqual(membership_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(membership_response.data["user"], self.member.id)

    def test_unfoldered_filter_returns_only_unfoldered(self):
        Activity.objects.create(
            author_id=str(self.owner.id),
            author_name="Owner",
            description="Unfoldered",
            name="Unfoldered Activity",
        )
        folder = Folder.objects.create(name="Root", owner=self.owner)
        Activity.objects.create(
            author_id=str(self.owner.id),
            author_name="Owner",
            description="Foldered",
            name="Foldered Activity",
            folder=folder,
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.get("/api/v1/activities/?folder_id=none")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        activity_names = {item["name"] for item in response.data}
        self.assertIn("Unfoldered Activity", activity_names)
        self.assertNotIn("Foldered Activity", activity_names)

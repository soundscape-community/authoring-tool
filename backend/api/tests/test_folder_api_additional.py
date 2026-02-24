# Copyright (c) Soundscape Community Contributors.
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import Team, TeamMembership

from api.models import Activity, Folder, FolderPermission
from api.permissions import can_manage_team


class FolderApiAdditionalTests(APITestCase):
    def setUp(self):
        self.User = get_user_model()
        self.owner = self.User.objects.create_user(username="owner", password="pass")
        self.member = self.User.objects.create_user(username="member", password="pass")
        self.other = self.User.objects.create_user(username="other", password="pass")
        self.staff = self.User.objects.create_user(username="staff", password="pass", is_staff=True)

        self.team = Team.objects.create(name="Editors", owner=self.owner)
        TeamMembership.objects.create(user=self.member, team=self.team)

        self.root = Folder.objects.create(name="Root", owner=self.owner)
        self.child = Folder.objects.create(name="Child", owner=self.owner, parent=self.root)

    def test_folder_list_requires_access(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.get("/api/v1/folders/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_folder_list_inherits_access(self):
        FolderPermission.objects.create(
            folder=self.root,
            team=self.team,
            access=FolderPermission.Access.READ,
        )

        self.client.force_authenticate(user=self.member)
        response = self.client.get("/api/v1/folders/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        folder_ids = {item["id"] for item in response.data}
        self.assertIn(str(self.root.id), folder_ids)
        self.assertIn(str(self.child.id), folder_ids)

    def test_folder_list_child_permission_only(self):
        FolderPermission.objects.create(
            folder=self.child,
            team=self.team,
            access=FolderPermission.Access.READ,
        )

        self.client.force_authenticate(user=self.member)
        response = self.client.get("/api/v1/folders/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        folder_ids = {item["id"] for item in response.data}
        self.assertIn(str(self.child.id), folder_ids)
        self.assertNotIn(str(self.root.id), folder_ids)

    def test_create_folder_requires_write_on_parent(self):
        FolderPermission.objects.create(
            folder=self.root,
            team=self.team,
            access=FolderPermission.Access.READ,
        )

        self.client.force_authenticate(user=self.member)
        response = self.client.post("/api/v1/folders/", {"name": "Nope", "parent": str(self.root.id)})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        FolderPermission.objects.filter(folder=self.root).update(access=FolderPermission.Access.WRITE)
        response = self.client.post("/api/v1/folders/", {"name": "OK", "parent": str(self.root.id)})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_folder_requires_write(self):
        FolderPermission.objects.create(
            folder=self.root,
            team=self.team,
            access=FolderPermission.Access.READ,
        )

        self.client.force_authenticate(user=self.member)
        response = self.client.patch(f"/api/v1/folders/{self.root.id}/", {"name": "Rename"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        FolderPermission.objects.filter(folder=self.root).update(access=FolderPermission.Access.WRITE)
        response = self.client.patch(f"/api/v1/folders/{self.root.id}/", {"name": "Rename"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_folder_parent_requires_write(self):
        other_root = Folder.objects.create(name="Other", owner=self.owner)
        FolderPermission.objects.create(
            folder=self.root,
            team=self.team,
            access=FolderPermission.Access.WRITE,
        )

        self.client.force_authenticate(user=self.member)
        response = self.client.patch(
            f"/api/v1/folders/{self.child.id}/",
            {"parent": str(other_root.id)},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        FolderPermission.objects.create(
            folder=other_root,
            team=self.team,
            access=FolderPermission.Access.WRITE,
        )
        response = self.client.patch(
            f"/api/v1/folders/{self.child.id}/",
            {"parent": str(other_root.id)},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_folder_requires_write(self):
        FolderPermission.objects.create(
            folder=self.root,
            team=self.team,
            access=FolderPermission.Access.READ,
        )

        self.client.force_authenticate(user=self.member)
        response = self.client.delete(f"/api/v1/folders/{self.root.id}/")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        FolderPermission.objects.filter(folder=self.root).update(access=FolderPermission.Access.WRITE)
        response = self.client.delete(f"/api/v1/folders/{self.root.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_update_folder_rejects_cycles(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.patch(
            f"/api/v1/folders/{self.root.id}/",
            {"parent": str(self.child.id)},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.patch(
            f"/api/v1/folders/{self.root.id}/",
            {"parent": str(self.root.id)},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_activity_folder_filter(self):
        Activity.objects.create(
            author_id=str(self.owner.id),
            author_name="Owner",
            description="Root",
            name="Rooted Activity",
            folder=self.root,
        )
        Activity.objects.create(
            author_id=str(self.owner.id),
            author_name="Owner",
            description="Child",
            name="Child Activity",
            folder=self.child,
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/v1/activities/?folder_id={self.root.id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        activity_names = {item["name"] for item in response.data}
        self.assertIn("Rooted Activity", activity_names)
        self.assertNotIn("Child Activity", activity_names)

    def test_root_folder_name_unique_globally(self):
        other_owner = self.User.objects.create_user(username="other-owner", password="pass")
        self.client.force_authenticate(user=other_owner)
        response = self.client.post("/api/v1/folders/", {"name": "Root"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class FolderPermissionApiTests(APITestCase):
    def setUp(self):
        self.User = get_user_model()
        self.owner = self.User.objects.create_user(username="owner", password="pass")
        self.member = self.User.objects.create_user(username="member", password="pass")
        self.other = self.User.objects.create_user(username="other", password="pass")

        self.team = Team.objects.create(name="Editors", owner=self.owner)
        TeamMembership.objects.create(user=self.member, team=self.team)

        self.root = Folder.objects.create(name="Root", owner=self.owner)

    def test_permissions_list_only_writable(self):
        FolderPermission.objects.create(
            folder=self.root,
            user=self.member,
            access=FolderPermission.Access.READ,
        )

        self.client.force_authenticate(user=self.member)
        response = self.client.get("/api/v1/folder_permissions/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_permissions_create_requires_write_or_owner(self):
        FolderPermission.objects.create(
            folder=self.root,
            user=self.member,
            access=FolderPermission.Access.READ,
        )

        self.client.force_authenticate(user=self.member)
        response = self.client.post(
            "/api/v1/folder_permissions/",
            {
                "folder": str(self.root.id),
                "user": str(self.other.id),
                "access": FolderPermission.Access.READ,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        FolderPermission.objects.filter(folder=self.root, user=self.member).update(
            access=FolderPermission.Access.WRITE
        )
        response = self.client.post(
            "/api/v1/folder_permissions/",
            {
                "folder": str(self.root.id),
                "user": str(self.other.id),
                "access": FolderPermission.Access.READ,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_owner_can_manage_permissions(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(
            "/api/v1/folder_permissions/",
            {
                "folder": str(self.root.id),
                "team": str(self.team.id),
                "access": FolderPermission.Access.WRITE,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        permission_id = response.data["id"]

        response = self.client.patch(
            f"/api/v1/folder_permissions/{permission_id}/",
            {
                "access": FolderPermission.Access.READ,
                "team": str(self.team.id),
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.delete(f"/api/v1/folder_permissions/{permission_id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class TeamMembershipApiTests(APITestCase):
    def setUp(self):
        self.User = get_user_model()
        self.owner = self.User.objects.create_user(username="owner", password="pass")
        self.member = self.User.objects.create_user(username="member", password="pass")
        self.admin = self.User.objects.create_user(username="admin", password="pass")

        self.team = Team.objects.create(name="Team", owner=self.owner)
        TeamMembership.objects.create(user=self.admin, team=self.team, role=TeamMembership.Role.ADMIN)

    def test_team_list_visible_to_admins(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.get("/api/v1/teams/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/teams/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_membership_requires_owner(self):
        self.assertTrue(can_manage_team(self.admin, self.team))
        self.client.force_authenticate(user=self.member)
        response = self.client.post(
            "/api/v1/team_memberships/",
            {"team": str(self.team.id), "user": str(self.member.id), "role": "member"},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/api/v1/team_memberships/",
            {"team": str(self.team.id), "user": str(self.member.id), "role": "member"},
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify a non-manager cannot add a *different* user (tests authorization, not uniqueness).
        other_user = self.User.objects.create_user(username="other", password="pass")
        self.client.force_authenticate(user=self.member)
        response = self.client.post(
            "/api/v1/team_memberships/",
            {"team": str(self.team.id), "user": str(other_user.id), "role": "member"},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class StaffVisibilityTests(APITestCase):
    def setUp(self):
        self.User = get_user_model()
        self.owner = self.User.objects.create_user(username="owner", password="pass")
        self.staff = self.User.objects.create_user(username="staff", password="pass", is_staff=True)

        self.folder = Folder.objects.create(name="Root", owner=self.owner)

    def test_staff_can_see_all_folders(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.get("/api/v1/folders/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        folder_ids = {item["id"] for item in response.data}
        self.assertIn(str(self.folder.id), folder_ids)

    def test_staff_can_edit_folder(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(
            f"/api/v1/folders/{self.folder.id}/",
            {"name": "Renamed"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ActivityFolderAccessTests(APITestCase):
    def setUp(self):
        self.User = get_user_model()
        self.owner = self.User.objects.create_user(username="owner", password="pass")
        self.member = self.User.objects.create_user(username="member", password="pass")

        self.team = Team.objects.create(name="Editors", owner=self.owner)
        TeamMembership.objects.create(user=self.member, team=self.team)

        self.root = Folder.objects.create(name="Root", owner=self.owner)
        self.other = Folder.objects.create(name="Other", owner=self.owner)

    def _create_activity_payload(self, folder_id=None):
        payload = {
            "name": "Activity",
            "description": "Sample",
            "author_name": "Author",
            "type": "Orienteering",
            "author_id": str(self.member.id),
        }
        if folder_id is not None:
            payload["folder"] = str(folder_id)
        return payload

    def test_create_activity_requires_folder_write(self):
        FolderPermission.objects.create(
            folder=self.root,
            team=self.team,
            access=FolderPermission.Access.READ,
        )

        self.client.force_authenticate(user=self.member)
        response = self.client.post("/api/v1/activities/", self._create_activity_payload(self.root.id))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        FolderPermission.objects.filter(folder=self.root).update(access=FolderPermission.Access.WRITE)
        response = self.client.post("/api/v1/activities/", self._create_activity_payload(self.root.id))

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(str(response.data["folder"]), str(self.root.id))

    def test_update_activity_requires_write_on_current_and_target(self):
        activity = Activity.objects.create(
            author_id=str(self.member.id),
            author_name="Member",
            description="Root",
            name="Rooted Activity",
            folder=self.root,
        )
        FolderPermission.objects.create(
            folder=self.root,
            team=self.team,
            access=FolderPermission.Access.READ,
        )
        FolderPermission.objects.create(
            folder=self.other,
            team=self.team,
            access=FolderPermission.Access.WRITE,
        )

        self.client.force_authenticate(user=self.member)
        response = self.client.patch(
            f"/api/v1/activities/{activity.id}/",
            {"folder": str(self.other.id)},
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        FolderPermission.objects.filter(folder=self.root).update(access=FolderPermission.Access.WRITE)
        response = self.client.patch(
            f"/api/v1/activities/{activity.id}/",
            {"folder": str(self.other.id)},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(str(response.data["folder"]), str(self.other.id))

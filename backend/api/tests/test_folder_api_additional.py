from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import Activity, Folder, FolderPermission, Group, GroupMembership
from api.permissions import can_manage_group


class FolderApiAdditionalTests(APITestCase):
    def setUp(self):
        self.User = get_user_model()
        self.owner = self.User.objects.create_user(username="owner", password="pass")
        self.member = self.User.objects.create_user(username="member", password="pass")
        self.other = self.User.objects.create_user(username="other", password="pass")
        self.staff = self.User.objects.create_user(username="staff", password="pass", is_staff=True)

        self.group = Group.objects.create(name="Editors", owner=self.owner)
        GroupMembership.objects.create(user=self.member, group=self.group)

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
            principal_type=FolderPermission.PrincipalType.GROUP,
            group=self.group,
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
            principal_type=FolderPermission.PrincipalType.GROUP,
            group=self.group,
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
            principal_type=FolderPermission.PrincipalType.GROUP,
            group=self.group,
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
            principal_type=FolderPermission.PrincipalType.GROUP,
            group=self.group,
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
            principal_type=FolderPermission.PrincipalType.GROUP,
            group=self.group,
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
            principal_type=FolderPermission.PrincipalType.GROUP,
            group=self.group,
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
            principal_type=FolderPermission.PrincipalType.GROUP,
            group=self.group,
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

        self.group = Group.objects.create(name="Editors", owner=self.owner)
        GroupMembership.objects.create(user=self.member, group=self.group)

        self.root = Folder.objects.create(name="Root", owner=self.owner)

    def test_permissions_list_only_writable(self):
        FolderPermission.objects.create(
            folder=self.root,
            principal_type=FolderPermission.PrincipalType.USER,
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
            principal_type=FolderPermission.PrincipalType.USER,
            user=self.member,
            access=FolderPermission.Access.READ,
        )

        self.client.force_authenticate(user=self.member)
        response = self.client.post(
            "/api/v1/folder_permissions/",
            {
                "folder": str(self.root.id),
                "principal_type": FolderPermission.PrincipalType.USER,
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
                "principal_type": FolderPermission.PrincipalType.USER,
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
                "principal_type": FolderPermission.PrincipalType.GROUP,
                "group": str(self.group.id),
                "access": FolderPermission.Access.WRITE,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        permission_id = response.data["id"]

        response = self.client.patch(
            f"/api/v1/folder_permissions/{permission_id}/",
            {
                "access": FolderPermission.Access.READ,
                "principal_type": FolderPermission.PrincipalType.GROUP,
                "group": str(self.group.id),
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.delete(f"/api/v1/folder_permissions/{permission_id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class GroupMembershipApiTests(APITestCase):
    def setUp(self):
        self.User = get_user_model()
        self.owner = self.User.objects.create_user(username="owner", password="pass")
        self.member = self.User.objects.create_user(username="member", password="pass")
        self.admin = self.User.objects.create_user(username="admin", password="pass")

        self.group = Group.objects.create(name="Team", owner=self.owner)
        GroupMembership.objects.create(user=self.admin, group=self.group, role=GroupMembership.Role.ADMIN)

    def test_group_list_only_owner(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.get("/api/v1/groups/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/groups/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_membership_requires_owner(self):
        self.assertTrue(can_manage_group(self.admin, self.group))
        self.client.force_authenticate(user=self.member)
        response = self.client.post(
            "/api/v1/group_memberships/",
            {"group": str(self.group.id), "user": str(self.member.id), "role": "member"},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/api/v1/group_memberships/",
            {"group": str(self.group.id), "user": str(self.member.id), "role": "member"},
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(user=self.owner)
        response = self.client.post(
            "/api/v1/group_memberships/",
            {"group": str(self.group.id), "user": str(self.member.id), "role": "member"},
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

        self.group = Group.objects.create(name="Editors", owner=self.owner)
        GroupMembership.objects.create(user=self.member, group=self.group)

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
            principal_type=FolderPermission.PrincipalType.GROUP,
            group=self.group,
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
            principal_type=FolderPermission.PrincipalType.GROUP,
            group=self.group,
            access=FolderPermission.Access.READ,
        )
        FolderPermission.objects.create(
            folder=self.other,
            principal_type=FolderPermission.PrincipalType.GROUP,
            group=self.group,
            access=FolderPermission.Access.WRITE,
        )

        self.client.force_authenticate(user=self.member)
        response = self.client.patch(
            f"/api/v1/activities/{activity.id}/",
            {"folder": str(self.other.id)},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        FolderPermission.objects.filter(folder=self.root).update(access=FolderPermission.Access.WRITE)
        response = self.client.patch(
            f"/api/v1/activities/{activity.id}/",
            {"folder": str(self.other.id)},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(str(response.data["folder"]), str(self.other.id))

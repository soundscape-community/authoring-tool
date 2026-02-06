from django.contrib.auth import get_user_model
from django.test import TestCase

from api.models import Folder, FolderPermission, Group, GroupMembership
from api.permissions import resolve_folder_access


class FolderPermissionTests(TestCase):
    def setUp(self):
        self.User = get_user_model()
        self.owner = self.User.objects.create_user(username="owner", password="pass")
        self.member = self.User.objects.create_user(username="member", password="pass")
        self.other = self.User.objects.create_user(username="other", password="pass")

        self.group = Group.objects.create(name="Editors", owner=self.owner)
        GroupMembership.objects.create(user=self.member, group=self.group)

        self.root = Folder.objects.create(name="Root", owner=self.owner)
        self.child = Folder.objects.create(name="Child", owner=self.owner, parent=self.root)

    def test_group_permission_inherited(self):
        FolderPermission.objects.create(
            folder=self.root,
            principal_type=FolderPermission.PrincipalType.GROUP,
            group=self.group,
            access=FolderPermission.Access.READ,
        )

        access = resolve_folder_access(self.member, self.child)

        self.assertTrue(access.can_read)
        self.assertFalse(access.can_write)

    def test_user_permission_overrides(self):
        FolderPermission.objects.create(
            folder=self.root,
            principal_type=FolderPermission.PrincipalType.GROUP,
            group=self.group,
            access=FolderPermission.Access.READ,
        )
        FolderPermission.objects.create(
            folder=self.child,
            principal_type=FolderPermission.PrincipalType.USER,
            user=self.member,
            access=FolderPermission.Access.WRITE,
        )

        access = resolve_folder_access(self.member, self.child)

        self.assertTrue(access.can_read)
        self.assertTrue(access.can_write)

    def test_no_permission(self):
        access = resolve_folder_access(self.other, self.child)

        self.assertFalse(access.can_read)
        self.assertFalse(access.can_write)

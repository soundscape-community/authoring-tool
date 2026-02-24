# Copyright (c) Soundscape Community Contributors.
from django.contrib.auth import get_user_model
from django.test import TestCase

from api.models import Folder, FolderPermission
from api.permissions import resolve_folder_access
from api.tests.base import FolderTestMixin, User


class FolderPermissionTests(FolderTestMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.other = User.objects.create_user(username="other", password="pass")
        self.child = Folder.objects.create(name="Child", owner=self.owner, parent=self.root)

    def test_team_permission_inherited(self):
        FolderPermission.objects.create(
            folder=self.root,
            team=self.team,
            access=FolderPermission.Access.READ,
        )

        access = resolve_folder_access(self.member, self.child)

        self.assertTrue(access.can_read)
        self.assertFalse(access.can_write)

    def test_user_permission_overrides(self):
        FolderPermission.objects.create(
            folder=self.root,
            team=self.team,
            access=FolderPermission.Access.READ,
        )
        FolderPermission.objects.create(
            folder=self.child,
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

    def test_owner_always_has_access(self):
        """Owner can read and write to any of their own folders."""
        access = resolve_folder_access(self.owner, self.child)

        self.assertTrue(access.can_read)
        self.assertTrue(access.can_write)

    def test_staff_override(self):
        """Staff users get full access even without explicit permission."""
        staff = User.objects.create_user(username="admin", password="pass", is_staff=True)

        access = resolve_folder_access(staff, self.child)

        self.assertTrue(access.can_read)
        self.assertTrue(access.can_write)

    def test_three_level_nested_inheritance(self):
        """Permissions propagate through 3+ levels of nesting."""
        grandchild = Folder.objects.create(name="Grandchild", owner=self.owner, parent=self.child)
        great_grandchild = Folder.objects.create(
            name="GreatGrandchild", owner=self.owner, parent=grandchild
        )
        FolderPermission.objects.create(
            folder=self.root,
            team=self.team,
            access=FolderPermission.Access.READ,
        )

        for folder in [self.child, grandchild, great_grandchild]:
            access = resolve_folder_access(self.member, folder)
            self.assertTrue(access.can_read, f"Expected read on {folder.name}")
            self.assertFalse(access.can_write, f"Unexpected write on {folder.name}")

    def test_child_override_trumps_parent(self):
        """A WRITE perm on child overrides READ on parent."""
        FolderPermission.objects.create(
            folder=self.root,
            team=self.team,
            access=FolderPermission.Access.READ,
        )
        FolderPermission.objects.create(
            folder=self.child,
            team=self.team,
            access=FolderPermission.Access.WRITE,
        )

        access = resolve_folder_access(self.member, self.child)
        self.assertTrue(access.can_read)
        self.assertTrue(access.can_write)

    def test_delete_folder_cascades(self):
        """Deleting a parent folder also deletes children and their permissions."""
        FolderPermission.objects.create(
            folder=self.child,
            team=self.team,
            access=FolderPermission.Access.READ,
        )
        child_id = self.child.id

        self.root.delete()

        self.assertFalse(Folder.objects.filter(id=child_id).exists())
        self.assertEqual(FolderPermission.objects.count(), 0)

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

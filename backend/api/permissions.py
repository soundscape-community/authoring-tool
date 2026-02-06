# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Optional

from .models import Folder, FolderPermission, GroupMembership


@dataclass(frozen=True)
class FolderAccess:
    can_read: bool
    can_write: bool


def _iter_folder_ancestors(folder: Folder) -> Iterable[Folder]:
    current: Optional[Folder] = folder
    while current is not None:
        yield current
        current = current.parent


def _access_from_permissions(permissions: Iterable[FolderPermission]) -> FolderAccess:
    can_read = False
    can_write = False
    for permission in permissions:
        if permission.access == FolderPermission.Access.WRITE:
            can_write = True
            can_read = True
        elif permission.access == FolderPermission.Access.READ:
            can_read = True
    return FolderAccess(can_read=can_read, can_write=can_write)


def resolve_folder_access(user, folder: Folder) -> FolderAccess:
    if not user or not user.is_authenticated:
        return FolderAccess(can_read=False, can_write=False)

    if folder.owner_id == user.id:
        return FolderAccess(can_read=True, can_write=True)

    group_ids = GroupMembership.objects.filter(user_id=user.id).values_list("group_id", flat=True)

    permissions = FolderPermission.objects.filter(folder__in=list(_iter_folder_ancestors(folder)))
    user_permissions = permissions.filter(principal_type=FolderPermission.PrincipalType.USER, user_id=user.id)
    group_permissions = permissions.filter(
        principal_type=FolderPermission.PrincipalType.GROUP, group_id__in=group_ids
    )

    user_access = _access_from_permissions(user_permissions)
    group_access = _access_from_permissions(group_permissions)

    return FolderAccess(
        can_read=user_access.can_read or group_access.can_read,
        can_write=user_access.can_write or group_access.can_write,
    )

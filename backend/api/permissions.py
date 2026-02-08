# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Optional

from django.db import models

from .models import Folder, FolderPermission, GroupMembership


@dataclass(frozen=True)
class FolderAccess:
    can_read: bool
    can_write: bool


def _iter_folder_ancestors(folder: Folder, max_depth: int = 100) -> Iterable[Folder]:
    current: Optional[Folder] = folder
    seen_ids = set()
    depth = 0
    while current is not None and depth < max_depth:
        if current.id in seen_ids:
            break
        seen_ids.add(current.id)
        yield current
        current = current.parent
        depth += 1


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


def can_write_activity(user, activity) -> bool:
    if not user or not user.is_authenticated:
        return False
    if activity.folder:
        return resolve_folder_access(user, activity.folder).can_write
    return str(activity.author_id) == str(user.id)


def get_accessible_folder_ids(user, max_depth: int = 100) -> set:
    if not user or not user.is_authenticated:
        return set()

    folders = list(Folder.objects.all().select_related("parent", "owner"))
    if not folders:
        return set()

    ancestor_map = {}
    all_ancestor_ids = set()

    for folder in folders:
        ancestors = []
        current = folder
        depth = 0
        seen_ids = set()
        while current is not None and depth < max_depth:
            if current.id in seen_ids:
                break
            seen_ids.add(current.id)
            ancestors.append(current.id)
            current = current.parent
            depth += 1
        ancestor_map[folder.id] = ancestors
        all_ancestor_ids.update(ancestors)

    group_ids = list(GroupMembership.objects.filter(user_id=user.id).values_list("group_id", flat=True))
    permissions = FolderPermission.objects.filter(folder_id__in=all_ancestor_ids).filter(
        models.Q(principal_type=FolderPermission.PrincipalType.USER, user_id=user.id)
        | models.Q(principal_type=FolderPermission.PrincipalType.GROUP, group_id__in=group_ids)
    )
    perm_map = {}
    for permission in permissions:
        perm_map.setdefault(permission.folder_id, []).append(permission)

    accessible_ids = set()
    for folder in folders:
        if folder.owner_id == user.id:
            accessible_ids.add(folder.id)
            continue
        ancestors = ancestor_map.get(folder.id, [])
        if any(ancestor_id in perm_map for ancestor_id in ancestors):
            accessible_ids.add(folder.id)

    return accessible_ids

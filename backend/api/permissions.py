# Copyright (c) Soundscape Community Contributors.
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

    if user.is_staff:
        return FolderAccess(can_read=True, can_write=True)

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
    if user.is_staff:
        return True
    if activity.folder:
        return resolve_folder_access(user, activity.folder).can_write
    return str(activity.author_id) == str(user.id)


def can_manage_group(user, group) -> bool:
    if not user or not user.is_authenticated:
        return False
    if user.is_staff:
        return True
    if group.owner_id == user.id:
        return True
    return GroupMembership.objects.filter(
        group_id=group.id,
        user_id=user.id,
        role=GroupMembership.Role.ADMIN,
    ).exists()


def is_group_admin(user, group_id) -> bool:
    if not user or not user.is_authenticated:
        return False
    return GroupMembership.objects.filter(
        group_id=group_id,
        user_id=user.id,
        role=GroupMembership.Role.ADMIN,
    ).exists()


def get_accessible_folder_ids(user, max_depth: int = 100) -> set:
    """Return IDs of all folders the user may access (read or write).

    Instead of loading every folder in the database, we start from the
    known "roots" of access (owned folders + folders with explicit
    permissions) and walk *down* to collect descendants.
    """
    if not user or not user.is_authenticated:
        return set()

    if user.is_staff:
        return set(Folder.objects.values_list("id", flat=True))

    # Folders directly owned by the user.
    owned_ids = set(Folder.objects.filter(owner=user).values_list("id", flat=True))

    # Folders that have an explicit permission for this user or their groups.
    group_ids = list(GroupMembership.objects.filter(user_id=user.id).values_list("group_id", flat=True))
    perm_folder_ids = set(
        FolderPermission.objects.filter(
            models.Q(principal_type=FolderPermission.PrincipalType.USER, user_id=user.id)
            | models.Q(principal_type=FolderPermission.PrincipalType.GROUP, group_id__in=group_ids)
        ).values_list("folder_id", flat=True)
    )

    accessible = owned_ids | perm_folder_ids

    # Walk down the folder tree to collect all descendants of accessible folders.
    frontier = set(accessible)
    depth = 0
    while frontier and depth < max_depth:
        child_ids = set(
            Folder.objects.filter(parent_id__in=frontier)
            .exclude(id__in=accessible)
            .values_list("id", flat=True)
        )
        if not child_ids:
            break
        accessible |= child_ids
        frontier = child_ids
        depth += 1

    return accessible

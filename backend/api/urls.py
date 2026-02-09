# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.
# Copyright (c) Soundscape Community Contributors.

from django.urls import path, include
from rest_framework import routers
from .views import (
    ActivityViewSet,
    FolderPermissionViewSet,
    FolderViewSet,
    GroupMembershipViewSet,
    GroupViewSet,
    WaypointGroupViewSet,
    WaypointMediaViewSet,
    WaypointViewSet,
)

router = routers.DefaultRouter()
router.register(r'activities', ActivityViewSet)
router.register(r'waypoint_groups', WaypointGroupViewSet)
router.register(r'waypoints', WaypointViewSet)
router.register(r'waypoints_media', WaypointMediaViewSet)
router.register(r'folders', FolderViewSet)
router.register(r'folder_permissions', FolderPermissionViewSet)
router.register(r'groups', GroupViewSet)
router.register(r'group_memberships', GroupMembershipViewSet)

urlpatterns = [
    path('v1/', include(router.urls)),
]

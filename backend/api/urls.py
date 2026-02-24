# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.
# Copyright (c) Soundscape Community Contributors.

from django.urls import path, include
from rest_framework import routers
from .views import (
    ActivityViewSet,
    FolderPermissionViewSet,
    FolderViewSet,
    TeamMembershipViewSet,
    TeamViewSet,
    RuntimeConfigView,
    UserViewSet,
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
router.register(r'folder_permissions', FolderPermissionViewSet, basename='folder_permission')
router.register(r'teams', TeamViewSet)
router.register(r'team_memberships', TeamMembershipViewSet)
router.register(r'users', UserViewSet)

urlpatterns = [
    path('v1/runtime-config/', RuntimeConfigView.as_view()),
    path('v1/', include(router.urls)),
]

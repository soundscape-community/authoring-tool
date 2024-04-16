# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

from django.urls import path, include
from rest_framework import routers
from .views import ActivityViewSet, WaypointGroupViewSet, WaypointMediaViewSet, WaypointViewSet, WaypointMediaViewSet, get_whitelisted_emails, get_registered_emails

router = routers.DefaultRouter()
router.register(r'activities', ActivityViewSet)
router.register(r'waypoint_groups', WaypointGroupViewSet)
router.register(r'waypoints', WaypointViewSet)
router.register(r'waypoints_media', WaypointMediaViewSet)

urlpatterns = [
    path('v1/', include(router.urls)),
    path('whitelisted-emails/', get_whitelisted_emails, name='whitelisted-emails'),
    path('registered-emails', get_registered_emails, name='registered-emails')
]

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from api.models import Activity, Waypoint, WaypointGroup, WaypointGroupType


class WaypointReorderTests(TestCase):
    """Verify that reordering waypoints via the API does not fail with
    a UniqueTogetherValidator error on (group, index)."""

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="testuser",
            password="testpass123",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.activity = Activity.objects.create(
            author_id="author-1",
            author_email="author@example.com",
            author_name="Author",
            name="Test Activity",
            description="Activity for reorder test",
        )
        self.group = WaypointGroup.objects.create(
            activity=self.activity,
            name="Main route",
            type=WaypointGroupType.ORDERED,
        )
        self.wp0 = Waypoint.objects.create(
            group=self.group,
            index=0,
            name="First",
            latitude=Decimal("1.000000"),
            longitude=Decimal("2.000000"),
        )
        self.wp1 = Waypoint.objects.create(
            group=self.group,
            index=1,
            name="Second",
            latitude=Decimal("3.000000"),
            longitude=Decimal("4.000000"),
        )

    def test_move_waypoint_up(self):
        """Moving the second waypoint up (index 1 → 0) should swap indices."""
        url = f"/api/v1/waypoints/{self.wp1.id}/"
        response = self.client.put(url, {
            "group": str(self.group.id),
            "index": 0,
            "name": "Second",
            "latitude": "3.000000",
            "longitude": "4.000000",
        })
        self.assertEqual(response.status_code, 200, response.data)
        self.wp0.refresh_from_db()
        self.wp1.refresh_from_db()
        self.assertEqual(self.wp1.index, 0)
        self.assertEqual(self.wp0.index, 1)

    def test_move_waypoint_down(self):
        """Moving the first waypoint down (index 0 → 1) should swap indices."""
        url = f"/api/v1/waypoints/{self.wp0.id}/"
        response = self.client.put(url, {
            "group": str(self.group.id),
            "index": 1,
            "name": "First",
            "latitude": "1.000000",
            "longitude": "2.000000",
        })
        self.assertEqual(response.status_code, 200, response.data)
        self.wp0.refresh_from_db()
        self.wp1.refresh_from_db()
        self.assertEqual(self.wp0.index, 1)
        self.assertEqual(self.wp1.index, 0)

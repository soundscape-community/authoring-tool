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
            author_id=str(self.user.id),
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

    def test_reverse_waypoint_order(self):
        """Reversing an ordered waypoint group should remap indexes contiguously."""
        wp2 = Waypoint.objects.create(
            group=self.group,
            index=2,
            name="Third",
            latitude=Decimal("5.000000"),
            longitude=Decimal("6.000000"),
        )
        wp3 = Waypoint.objects.create(
            group=self.group,
            index=3,
            name="Fourth",
            latitude=Decimal("7.000000"),
            longitude=Decimal("8.000000"),
        )
        self.activity.unpublished_changes = False
        self.activity.save(update_fields=["unpublished_changes"])

        url = f"/api/v1/waypoint_groups/{self.group.id}/reverse_order/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, 200, response.data)
        self.wp0.refresh_from_db()
        self.wp1.refresh_from_db()
        wp2.refresh_from_db()
        wp3.refresh_from_db()
        self.activity.refresh_from_db()

        self.assertEqual(self.wp0.index, 3)
        self.assertEqual(self.wp1.index, 2)
        self.assertEqual(wp2.index, 1)
        self.assertEqual(wp3.index, 0)
        self.assertEqual(
            list(Waypoint.objects.filter(group=self.group).values_list("name", flat=True)),
            ["Fourth", "Third", "Second", "First"],
        )
        self.assertTrue(self.activity.unpublished_changes)

    def test_reverse_waypoint_order_noops_for_single_waypoint(self):
        self.wp1.delete()
        self.activity.unpublished_changes = False
        self.activity.save(update_fields=["unpublished_changes"])

        url = f"/api/v1/waypoint_groups/{self.group.id}/reverse_order/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, 200, response.data)
        self.wp0.refresh_from_db()
        self.activity.refresh_from_db()
        self.assertEqual(self.wp0.index, 0)
        self.assertFalse(self.activity.unpublished_changes)

    def test_reverse_waypoint_order_noops_for_empty_group(self):
        empty_group = WaypointGroup.objects.create(
            activity=self.activity,
            name="Empty route",
            type=WaypointGroupType.ORDERED,
        )
        self.activity.unpublished_changes = False
        self.activity.save(update_fields=["unpublished_changes"])

        url = f"/api/v1/waypoint_groups/{empty_group.id}/reverse_order/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, 200, response.data)
        self.activity.refresh_from_db()
        self.assertFalse(self.activity.unpublished_changes)

    def test_reverse_waypoint_order_rejects_unordered_group(self):
        unordered_group = WaypointGroup.objects.create(
            activity=self.activity,
            name="Points of Interest",
            type=WaypointGroupType.UNORDERED,
        )

        url = f"/api/v1/waypoint_groups/{unordered_group.id}/reverse_order/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, 400, response.data)

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.test import TestCase
from rest_framework.test import APIClient

from api.models import Activity, MediaType, Waypoint, WaypointGroup, WaypointGroupType, WaypointMedia


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

    def test_make_return_route_appends_reversed_waypoints_without_last_waypoint(self):
        self.wp0.description = "First description"
        self.wp0.departure_callout = "Depart first"
        self.wp0.arrival_callout = "Arrive first"
        self.wp0.save()
        wp2 = Waypoint.objects.create(
            group=self.group,
            index=2,
            name="Third",
            description="Third description",
            departure_callout="Depart third",
            arrival_callout="Arrive third",
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

        url = f"/api/v1/waypoint_groups/{self.group.id}/make_return_route/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, 200, response.data)
        self.activity.refresh_from_db()
        route = list(Waypoint.objects.filter(group=self.group))

        self.assertEqual(
            [waypoint.name for waypoint in route],
            ["First", "Second", "Third", "Fourth", "Third", "Second", "First"],
        )
        self.assertEqual([waypoint.index for waypoint in route], list(range(7)))
        self.assertNotEqual(route[4].id, wp2.id)
        self.assertNotEqual(route[5].id, self.wp1.id)
        self.assertNotEqual(route[6].id, self.wp0.id)
        self.assertEqual(route[4].description, "Third description")
        self.assertEqual(route[4].departure_callout, "Depart third")
        self.assertEqual(route[4].arrival_callout, "Arrive third")
        self.assertEqual(route[6].description, "First description")
        self.assertEqual(route[6].departure_callout, "Depart first")
        self.assertEqual(route[6].arrival_callout, "Arrive first")
        self.assertTrue(self.activity.unpublished_changes)
        wp3.refresh_from_db()
        self.assertEqual(wp3.index, 3)

    def test_make_return_route_shares_media_files_and_keeps_files_until_final_reference_is_deleted(self):
        original_media = WaypointMedia.objects.create(
            waypoint=self.wp0,
            media=ContentFile(b"image", name="first.jpg"),
            type=MediaType.IMAGE,
            mime_type="image/jpeg",
            description="First image",
            index=0,
        )
        media_name = original_media.media.name
        self.assertTrue(default_storage.exists(media_name))

        url = f"/api/v1/waypoint_groups/{self.group.id}/make_return_route/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, 200, response.data)
        media_items = list(WaypointMedia.objects.filter(media=media_name).order_by("created"))
        self.assertEqual(len(media_items), 2)
        self.assertNotEqual(media_items[0].waypoint_id, media_items[1].waypoint_id)

        media_items[0].delete()
        self.assertTrue(default_storage.exists(media_name))

        media_items[1].delete()
        self.assertFalse(default_storage.exists(media_name))

    def test_make_return_route_noops_for_single_waypoint(self):
        self.wp1.delete()
        self.activity.unpublished_changes = False
        self.activity.save(update_fields=["unpublished_changes"])

        url = f"/api/v1/waypoint_groups/{self.group.id}/make_return_route/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, 200, response.data)
        self.wp0.refresh_from_db()
        self.activity.refresh_from_db()
        self.assertEqual(self.wp0.index, 0)
        self.assertEqual(Waypoint.objects.filter(group=self.group).count(), 1)
        self.assertFalse(self.activity.unpublished_changes)

    def test_make_return_route_noops_for_empty_group(self):
        empty_group = WaypointGroup.objects.create(
            activity=self.activity,
            name="Empty route",
            type=WaypointGroupType.ORDERED,
        )
        self.activity.unpublished_changes = False
        self.activity.save(update_fields=["unpublished_changes"])

        url = f"/api/v1/waypoint_groups/{empty_group.id}/make_return_route/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, 200, response.data)
        self.activity.refresh_from_db()
        self.assertEqual(Waypoint.objects.filter(group=empty_group).count(), 0)
        self.assertFalse(self.activity.unpublished_changes)

    def test_make_return_route_rejects_unordered_group(self):
        unordered_group = WaypointGroup.objects.create(
            activity=self.activity,
            name="Points of Interest",
            type=WaypointGroupType.UNORDERED,
        )

        url = f"/api/v1/waypoint_groups/{unordered_group.id}/make_return_route/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, 400, response.data)

from decimal import Decimal

from django import forms
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.test import TestCase
from django.test.utils import override_settings
from django.urls import reverse

from api.models import (
    Activity,
    ActivityType,
    Waypoint,
    WaypointGroup,
    WaypointMedia,
    MediaType,
    Locale,
)
from api.admin import ActivityAdminForm


@override_settings(STATICFILES_STORAGE='django.contrib.staticfiles.storage.StaticFilesStorage')
class AdminSmokeTests(TestCase):
    def setUp(self):
        self.admin_user = get_user_model().objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="testpass123",
        )
        self.client.force_login(self.admin_user)

        self.activity = Activity.objects.create(
            author_id="author-1",
            author_email="author@example.com",
            author_name="Author",
            name="Sample Activity",
            description="A sample activity",
        )
        self.group = WaypointGroup.objects.create(
            activity=self.activity,
            name="Primary route",
        )
        self.waypoint = Waypoint.objects.create(
            group=self.group,
            index=0,
            name="Waypoint 1",
            description="Start",
            latitude=Decimal("1.000000"),
            longitude=Decimal("2.000000"),
        )
        media_content = ContentFile(b"test", name="test.wav")
        self.media = WaypointMedia.objects.create(
            waypoint=self.waypoint,
            media=media_content,
            type=MediaType.AUDIO,
            mime_type="audio/wav",
            index=0,
        )

    def tearDown(self):
        # Ensure stored files are cleaned up deterministically
        self.media.delete()
        super().tearDown()

    def test_admin_changelists_load(self):
        changelist_names = [
            "admin:api_activity_changelist",
            "admin:api_waypointgroup_changelist",
            "admin:api_waypoint_changelist",
            "admin:api_waypointmedia_changelist",
        ]
        for name in changelist_names:
            with self.subTest(name=name):
                response = self.client.get(reverse(name))
                self.assertEqual(response.status_code, 200)

    def test_admin_change_views_load(self):
        change_views = [
            ("admin:api_activity_change", self.activity.pk),
            ("admin:api_waypointgroup_change", self.group.pk),
            ("admin:api_waypoint_change", self.waypoint.pk),
            ("admin:api_waypointmedia_change", self.media.pk),
        ]
        for name, pk in change_views:
            with self.subTest(name=name):
                response = self.client.get(reverse(name, args=[pk]))
                self.assertEqual(response.status_code, 200)

    def test_activity_admin_author_dropdown(self):
        form = ActivityAdminForm(
            data={
                "author_id": "",
                "author_user": str(self.admin_user.pk),
                "author_email": "",
                "author_name": "",
                "name": "Admin Created Activity",
                "description": "Created via admin form",
                "type": ActivityType.ORIENTEERING,
                "locale": Locale.EN_US,
                "expires": False,
                "unpublished_changes": False,
            }
        )
        self.assertIsInstance(form.fields["author_user"], forms.ModelChoiceField)
        self.assertTrue(form.fields["author_user"].queryset.filter(pk=self.admin_user.pk).exists())
        self.assertTrue(form.is_valid(), form.errors)
        activity = form.save()
        self.assertEqual(activity.author_id, str(self.admin_user.pk))
        self.assertEqual(activity.author_email, self.admin_user.email)
        expected_name = self.admin_user.get_full_name() or self.admin_user.username
        self.assertEqual(activity.author_name, expected_name)
        activity.delete()

    def test_activity_admin_updates_persist(self):
        form = ActivityAdminForm(
            instance=self.activity,
            data={
                "id": str(self.activity.pk),
                "author_id": "",
                "author_user": str(self.admin_user.pk),
                "author_email": "new-email@example.com",
                "author_name": "New Author Name",
                "name": "Renamed Activity",
                "description": "Updated description",
                "type": ActivityType.GUIDED_TOUR,
                "locale": Locale.EN_US,
                "expires": True,
                "unpublished_changes": True,
            }
        )
        self.assertTrue(form.is_valid(), form.errors)
        activity = form.save()
        activity.refresh_from_db()
        self.assertEqual(activity.name, "Renamed Activity")
        self.assertEqual(activity.author_email, "new-email@example.com")
        self.assertEqual(activity.author_name, "New Author Name")
        self.assertTrue(activity.expires)

    def test_activity_admin_change_view_post_persists(self):
        url = reverse("admin:api_activity_change", args=[self.activity.pk])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        post_data = {
            "id": str(self.activity.pk),
            "author_id": "",
            "author_user": str(self.admin_user.pk),
            "author_email": "admin-updated@example.com",
            "author_name": "Admin Updated",
            "name": "Activity Via POST",
            "description": "Updated through admin POST",
            "type": ActivityType.GUIDED_TOUR,
            "locale": Locale.EN_US,
            "start": "",
            "end": "",
            "expires": "on",
            "image": "",
            "image_alt": "",
            "unpublished_changes": "on",
            "_save": "Save",
        }

        response = self.client.post(url, post_data, follow=True)
        self.assertEqual(response.status_code, 200)
        self.activity.refresh_from_db()
        self.assertEqual(self.activity.name, "Activity Via POST")
        self.assertEqual(self.activity.author_email, "admin-updated@example.com")
        self.assertEqual(self.activity.author_name, "Admin Updated")
        self.assertTrue(self.activity.expires)

    def test_activity_admin_accepts_existing_author_id(self):
        form = ActivityAdminForm(
            instance=self.activity,
            data={
                "id": str(self.activity.pk),
                "author_id": self.activity.author_id,  # leave legacy value untouched
                "author_user": "",
                "author_email": self.activity.author_email,
                "author_name": self.activity.author_name,
                "name": self.activity.name,
                "description": self.activity.description,
                "type": self.activity.type,
                "locale": self.activity.locale,
                "expires": self.activity.expires,
                "unpublished_changes": self.activity.unpublished_changes,
            },
        )
        self.assertTrue(form.is_valid(), form.errors)
        activity = form.save()
        self.assertEqual(activity.author_id, "author-1")

    def test_activity_admin_requires_author_id_when_blank(self):
        form = ActivityAdminForm(
            instance=self.activity,
            data={
                "id": str(self.activity.pk),
                "author_id": "",
                "author_user": "",
                "author_email": self.activity.author_email,
                "author_name": self.activity.author_name,
                "name": self.activity.name,
                "description": self.activity.description,
                "type": self.activity.type,
                "locale": self.activity.locale,
                "expires": self.activity.expires,
                "unpublished_changes": self.activity.unpublished_changes,
            },
        )
        self.assertFalse(form.is_valid())
        self.assertIn("author_id", form.errors)

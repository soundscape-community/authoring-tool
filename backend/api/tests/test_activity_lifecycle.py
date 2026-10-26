# Copyright (c) Soundscape Community Contributors.

from decimal import Decimal
from io import BytesIO
from tempfile import TemporaryDirectory

import gpxpy
from PIL import Image
from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from api.models import Activity, ActivityType, Waypoint


class ActivityLifecycleTests(APITestCase):
    def setUp(self):
        media_root = TemporaryDirectory()
        self.addCleanup(media_root.cleanup)
        storage_settings = override_settings(MEDIA_ROOT=media_root.name)
        storage_settings.enable()
        self.addCleanup(storage_settings.disable)
        self.user = get_user_model().objects.create_user(username='author')
        self.client.force_authenticate(self.user)

    def test_featured_image_upload_accepts_png_and_rejects_invalid_image(self):
        image = BytesIO()
        Image.new('RGB', (2, 2), 'red').save(image, format='PNG')
        response = self.client.post('/api/v1/activities/', {
            'author_id': str(self.user.pk),
            'author_name': self.user.username,
            'name': 'Image activity',
            'description': 'An activity with an image',
            'image': SimpleUploadedFile('image.png', image.getvalue(), 'image/png'),
        }, format='multipart')
        self.assertEqual(response.status_code, 201, response.data)
        activity = Activity.objects.get(pk=response.data['id'])
        with activity.image.open('rb') as stored_image:
            self.assertEqual(Image.open(stored_image).size, (2, 2))

        response = self.client.patch(f'/api/v1/activities/{activity.pk}/', {
            'image': SimpleUploadedFile('invalid.png', b'not an image', 'image/png'),
        }, format='multipart')
        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn('image', response.data)

    def test_create_export_import_publish_and_edit(self):
        for activity_type in ActivityType.values:
            with self.subTest(activity_type=activity_type):
                response = self.client.post('/api/v1/activities/', {
                    'author_id': str(self.user.pk),
                    'author_name': self.user.username,
                    'name': 'Route & garden',
                    'description': 'Turn <left> & continue',
                    'type': activity_type,
                }, format='json')
                self.assertEqual(response.status_code, 201, response.data)
                activity = Activity.objects.get(pk=response.data['id'])
                group = activity.waypoints_group
                Waypoint.objects.create(
                    group=group, name='Gate & entrance', description='Start <here>',
                    latitude=Decimal('51.500001'), longitude=Decimal('-0.120001'), index=0,
                )
                url = f'/api/v1/activities/{activity.pk}/'
                exported = self.client.get(f'{url}export_gpx/')
                self.assertEqual(exported.status_code, 200)
                parsed = gpxpy.parse(exported.content.decode())
                self.assertEqual(parsed.name, activity.name)

                imported = self.client.post('/api/v1/activities/import_gpx/', {
                    'gpx': SimpleUploadedFile('route.gpx', exported.content, 'application/gpx+xml'),
                }, format='multipart')
                self.assertEqual(imported.status_code, 200, imported.data)
                copy = Activity.objects.get(pk=imported.data['id'])
                self.assertNotEqual(copy.pk, activity.pk)
                self.assertEqual(copy.description, activity.description)
                self.assertEqual(copy.type, activity_type)
                waypoint = copy.waypoints_group.waypoints.get()
                self.assertEqual(waypoint.name, 'Gate & entrance')
                self.assertEqual(waypoint.latitude, Decimal('51.500001'))

                published = self.client.post(f'{url}publish/')
                self.assertEqual(published.status_code, 200, published.data)
                activity.refresh_from_db()
                self.assertTrue(activity.can_link)
                self.assertFalse(activity.unpublished_changes)
                with default_storage.open(activity.gpx_file_path) as stored_gpx:
                    self.assertEqual(gpxpy.parse(stored_gpx).name, activity.name)

                edited = self.client.patch(url, {'name': 'Updated route'}, format='json')
                self.assertEqual(edited.status_code, 200, edited.data)
                activity.refresh_from_db()
                self.assertTrue(activity.unpublished_changes)

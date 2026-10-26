# Copyright (c) Soundscape Community Contributors.

from django.conf import settings
from django.contrib.auth import SESSION_KEY, get_user_model
from rest_framework.test import APIClient, APITestCase
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

from api.models import Activity


class RestAuthTokenTests(APITestCase):
    def test_login_issues_valid_access_token_and_session(self):
        user = get_user_model().objects.create_user(
            username='token-user', password='testpass123',
        )
        response = self.client.post('/dj-rest-auth/login/', {
            'username': user.username, 'password': 'testpass123',
        }, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(str(AccessToken(response.data['access'])['user_id']), str(user.pk))
        self.assertEqual(response.data['refresh'], '')  # Hidden by the HttpOnly policy.
        self.assertIn('AUTHORING_AUTH', response.cookies)
        self.assertTrue(response.cookies['AUTHORING_AUTH']['httponly'])
        self.assertEqual(self.client.session[SESSION_KEY], str(user.pk))
        activity = Activity.objects.create(
            author_id=str(user.pk), author_name=user.username,
            name='Owned activity', description='Session access',
        )

        session_client = APIClient()
        session_client.cookies[settings.SESSION_COOKIE_NAME] = response.cookies[settings.SESSION_COOKIE_NAME].value
        self.assertNotIn('AUTHORING_AUTH', session_client.cookies)
        activities = session_client.get('/api/v1/activities/')
        self.assertEqual(activities.status_code, 200, activities.data)
        self.assertEqual([item['id'] for item in activities.data], [str(activity.pk)])

    def test_refresh_endpoint_accepts_valid_token(self):
        user = get_user_model().objects.create_user(username='refresh-user')
        # No refresh cookie is configured: exercise this endpoint independently of login.
        refreshed = self.client.post('/dj-rest-auth/token/refresh/', {
            'refresh': str(RefreshToken.for_user(user)),
        }, format='json')
        self.assertEqual(refreshed.status_code, 200, refreshed.data)
        self.assertEqual(str(AccessToken(refreshed.data['access'])['user_id']), str(user.pk))

    def test_refresh_rejects_tampered_token(self):
        user = get_user_model().objects.create_user(username='tampered-token-user')
        token = str(RefreshToken.for_user(user))
        header, payload, signature = token.split('.')
        signature = ('A' if signature[0] != 'A' else 'B') + signature[1:]
        response = self.client.post('/dj-rest-auth/token/refresh/', {
            'refresh': f'{header}.{payload}.{signature}',
        }, format='json')
        self.assertEqual(response.status_code, 401, response.data)

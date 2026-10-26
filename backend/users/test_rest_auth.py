# Copyright (c) Soundscape Community Contributors.

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken


class RestAuthTokenTests(APITestCase):
    def test_login_and_refresh_issue_valid_tokens_and_session(self):
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
        self.assertEqual(self.client.get('/api/v1/activities/').status_code, 200)

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

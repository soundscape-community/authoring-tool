# Copyright (c) Soundscape Community Contributors.
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase


class RuntimeConfigApiTests(APITestCase):
    @override_settings(
        TESTING_WARNING_ENABLED=False,
        TESTING_WARNING_MESSAGE='Testing environment — all changes will be lost.',
    )
    def test_runtime_config_returns_warning_disabled(self):
        response = self.client.get('/api/v1/runtime-config/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {
                'show_beta_warning': False,
                'beta_warning_message': 'Testing environment — all changes will be lost.',
            },
        )

    @override_settings(
        TESTING_WARNING_ENABLED=True,
        TESTING_WARNING_MESSAGE='Testing only — all changes are temporary.',
    )
    def test_runtime_config_returns_warning_enabled(self):
        response = self.client.get('/api/v1/runtime-config/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {
                'show_beta_warning': True,
                'beta_warning_message': 'Testing only — all changes are temporary.',
            },
        )

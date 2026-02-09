# Copyright (c) Soundscape Community Contributors.
"""Tests for the /api/v1/users/ endpoint."""

from django.contrib.auth import get_user_model

from rest_framework.test import APITestCase

User = get_user_model()


class UserSearchTests(APITestCase):
    """Tests for the read-only user list/search endpoint."""

    def setUp(self):
        self.alice = User.objects.create_user(username="alice", password="pass")
        self.bob = User.objects.create_user(username="bob", password="pass")
        self.carol = User.objects.create_user(username="carol", password="pass")

    def test_unauthenticated_returns_empty(self):
        response = self.client.get("/api/v1/users/")
        # DRF returns 403 or empty depending on auth setup; at minimum no data
        self.assertIn(response.status_code, [200, 401, 403])
        if response.status_code == 200:
            self.assertEqual(response.data, [])

    def test_list_all_users(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.get("/api/v1/users/")
        self.assertEqual(response.status_code, 200)
        usernames = {u["username"] for u in response.data}
        self.assertIn("alice", usernames)
        self.assertIn("bob", usernames)
        self.assertIn("carol", usernames)

    def test_search_by_username(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.get("/api/v1/users/", {"search": "bo"})
        self.assertEqual(response.status_code, 200)
        usernames = [u["username"] for u in response.data]
        self.assertEqual(usernames, ["bob"])

    def test_search_case_insensitive(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.get("/api/v1/users/", {"search": "AL"})
        self.assertEqual(response.status_code, 200)
        usernames = [u["username"] for u in response.data]
        self.assertEqual(usernames, ["alice"])

    def test_search_no_results(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.get("/api/v1/users/", {"search": "zzz"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_response_fields(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.get("/api/v1/users/", {"search": "alice"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        user_data = response.data[0]
        self.assertIn("id", user_data)
        self.assertIn("username", user_data)
        self.assertEqual(user_data["username"], "alice")
        # Should NOT expose sensitive fields
        self.assertNotIn("password", user_data)
        self.assertNotIn("email", user_data)

    def test_results_capped_at_25(self):
        # Create 30 users with a common prefix
        for i in range(30):
            User.objects.create_user(username=f"testuser{i:03d}", password="pass")
        self.client.force_authenticate(user=self.alice)
        response = self.client.get("/api/v1/users/", {"search": "testuser"})
        self.assertEqual(response.status_code, 200)
        self.assertLessEqual(len(response.data), 25)

# Copyright (c) Soundscape Community Contributors.
"""Shared test utilities for the API test suite."""

from django.contrib.auth import get_user_model

from rest_framework.test import APITestCase
from users.models import Team, TeamMembership

from api.models import (
    Activity,
    Folder,
    FolderPermission,
)

User = get_user_model()


class FolderTestMixin:
    """Common setUp for tests that need owner, member, team & root folder.

    Subclasses may call ``super().setUp()`` and then add their own fixtures.
    """

    def setUp(self):
        super().setUp()
        self.owner = User.objects.create_user(username="owner", password="pass")
        self.member = User.objects.create_user(username="member", password="pass")

        self.team = Team.objects.create(name="Editors", owner=self.owner)
        TeamMembership.objects.create(user=self.member, team=self.team)

        self.root = Folder.objects.create(name="Root", owner=self.owner)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _grant_access(self, folder, *, team=None, user=None, access=FolderPermission.Access.READ):
        """Create a FolderPermission and return it."""
        if team is not None:
            return FolderPermission.objects.create(
                folder=folder,
                team=team,
                access=access,
            )
        if user is not None:
            return FolderPermission.objects.create(
                folder=folder,
                user=user,
                access=access,
            )
        raise ValueError("Provide either team= or user=")

    def _create_activity_in_folder(self, folder, owner=None):
        """Create a minimal Activity linked to *folder*."""
        owner = owner or self.owner
        return Activity.objects.create(
            author_id=str(owner.id),
            author_name=owner.username,
            description="Test activity",
            name="Test Activity",
            folder=folder,
        )


class FolderAPITestCase(FolderTestMixin, APITestCase):
    """Convenience base that combines FolderTestMixin with DRF's APITestCase."""
    pass

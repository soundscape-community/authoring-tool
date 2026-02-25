# Copyright (c) Soundscape Community Contributors.
# Licensed under the MIT License.

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from api.models import Activity, Folder, WaypointGroup, WaypointGroupType


class Command(BaseCommand):
    help = "Seed dummy activities (and optional folders) for development."

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=20, help="Number of activities to create.")
        parser.add_argument("--with-folders", action="store_true", help="Create a folder tree and assign activities.")
        parser.add_argument("--folders", type=int, default=3, help="Root folder count when --with-folders is set.")
        parser.add_argument("--children", type=int, default=2, help="Child folders per parent when --with-folders is set.")
        parser.add_argument("--depth", type=int, default=2, help="Folder depth when --with-folders is set.")
        parser.add_argument(
            "--hot-folder-name",
            type=str,
            default=None,
            help="Folder name to receive a concentrated set of activities.",
        )
        parser.add_argument(
            "--hot-count",
            type=int,
            default=0,
            help="Number of activities to place in the hot folder.",
        )
        parser.add_argument(
            "--user",
            type=str,
            default=None,
            help="User id, username, or email to own seeded data. Defaults to the first user.",
        )

    def handle(self, *args, **options):
        count = max(0, options["count"])
        with_folders = options["with_folders"]
        root_folders = max(0, options["folders"])
        children = max(0, options["children"])
        depth = max(0, options["depth"])
        hot_folder_name = options["hot_folder_name"]
        hot_count = min(max(0, options["hot_count"]), count)
        user_lookup = options["user"]

        user = self._resolve_user(user_lookup)
        if user is None:
            raise CommandError("No users found. Create a user or provide --user.")

        folder_targets = [None]
        created_folders = []
        if with_folders and root_folders > 0 and depth > 0:
            created_folders = self._create_folder_tree(
                owner=user,
                root_count=root_folders,
                children=children,
                depth=depth,
            )
            folder_targets = [None] + created_folders

        hot_folder = None
        if hot_folder_name:
            hot_folder = self._get_or_create_root_folder(user, hot_folder_name)

        author_name = user.get_full_name() or user.username or user.email or "Demo Author"
        author_email = user.email or ""

        sample_names = [
            "City Walk",
            "Historic Core",
            "Waterfront Loop",
            "Market District",
            "River Trail",
            "Garden Promenade",
            "Museum Mile",
            "Old Town Highlights",
            "Campus Stroll",
            "Arts Quarter",
        ]
        sample_desc = [
            "A short route with points of interest.",
            "An easy loop with a few stops.",
            "A guided walk with landmarks.",
            "A scenic route with narration.",
            "A calm stroll suitable for testing.",
        ]

        created_count = 0
        created_count += self._create_activities(
            user=user,
            author_name=author_name,
            author_email=author_email,
            folders=[hot_folder] if hot_folder else [],
            count=hot_count,
            sample_names=sample_names,
            sample_desc=sample_desc,
            start_index=0,
        )

        remaining = max(0, count - hot_count)
        created_count += self._create_activities(
            user=user,
            author_name=author_name,
            author_email=author_email,
            folders=folder_targets,
            count=remaining,
            sample_names=sample_names,
            sample_desc=sample_desc,
            start_index=hot_count,
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {created_count} activities for {author_name}. "
                f"Folders created: {len(created_folders)}. "
                f"Hot folder: {hot_folder.name if hot_folder else 'none'}."
            )
        )

    def _resolve_user(self, lookup):
        User = get_user_model()
        if lookup:
            try:
                user = User.objects.filter(id=int(lookup)).first()
                if user:
                    return user
            except (TypeError, ValueError):
                pass
            user = User.objects.filter(username=lookup).first()
            if user:
                return user
            user = User.objects.filter(email__iexact=lookup).first()
            if user:
                return user
            raise CommandError(f"No user found for '{lookup}'.")
        return User.objects.order_by("id").first()

    def _create_folder_tree(self, owner, root_count, children, depth):
        created = []

        def unique_name(base, parent):
            name = base
            suffix = 1
            while self._folder_name_exists(name, parent):
                suffix += 1
                name = f"{base} {suffix}"
            return name

        def build(parent, current_depth):
            if current_depth <= 0:
                return
            for index in range(children):
                base = f"{parent.name} {index + 1}"
                name = unique_name(base, parent)
                folder = Folder.objects.create(name=name, owner=owner, parent=parent)
                created.append(folder)
                build(folder, current_depth - 1)

        for index in range(root_count):
            base = f"Demo Folder {index + 1}"
            name = unique_name(base, None)
            folder = Folder.objects.create(name=name, owner=owner, parent=None)
            created.append(folder)
            build(folder, depth - 1)

        return created

    def _get_or_create_root_folder(self, owner, name):
        folder = Folder.objects.filter(parent__isnull=True, name=name).first()
        if folder:
            return folder
        return Folder.objects.create(name=name, owner=owner, parent=None)

    def _create_activities(
        self,
        user,
        author_name,
        author_email,
        folders,
        count,
        sample_names,
        sample_desc,
        start_index,
    ):
        if count <= 0:
            return 0
        targets = folders or [None]
        created = 0
        for offset in range(count):
            index = start_index + offset
            folder = targets[index % len(targets)]
            name = f"{sample_names[index % len(sample_names)]} {index + 1}"
            description = sample_desc[index % len(sample_desc)]

            activity = Activity.objects.create(
                author_id=str(user.id),
                author_email=author_email,
                author_name=author_name,
                name=name,
                description=description,
                folder=folder,
            )

            WaypointGroup.objects.create(
                activity=activity,
                name="Default",
                type=WaypointGroupType.ORDERED,
            )
            WaypointGroup.objects.create(
                activity=activity,
                name="Points of Interest",
                type=WaypointGroupType.UNORDERED,
            )
            created += 1

        return created

    def _folder_name_exists(self, name, parent):
        if parent is None:
            return Folder.objects.filter(parent__isnull=True, name=name).exists()
        return Folder.objects.filter(parent=parent, name=name).exists()

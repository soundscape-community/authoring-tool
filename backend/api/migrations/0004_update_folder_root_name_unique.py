# Copyright (c) Soundscape Community Contributers.
# Licensed under the MIT License.

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0003_remove_folder_unique_folder_name_per_parent_and_more"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="folder",
            name="unique_root_folder_name_per_owner",
        ),
        migrations.AddConstraint(
            model_name="folder",
            constraint=models.UniqueConstraint(
                fields=("name",),
                condition=models.Q(("parent__isnull", True)),
                name="unique_root_folder_name_global",
            ),
        ),
    ]

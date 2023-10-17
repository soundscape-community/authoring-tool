# Generated by Django 4.0.8 on 2023-10-02 20:27

import api.models
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Activity',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('updated', models.DateTimeField(auto_now=True)),
                ('author_id', models.CharField(max_length=36)),
                ('author_email', models.EmailField(blank=True, max_length=254, null=True)),
                ('author_name', models.TextField()),
                ('name', models.TextField()),
                ('description', models.TextField()),
                ('type', models.CharField(choices=[('Orienteering', 'Orienteering'), ('GuidedTour', 'Guided Tour')], default='Orienteering', max_length=20)),
                ('locale', models.CharField(choices=[('en_US', 'English (United States)')], default='en_US', max_length=20)),
                ('start', models.DateTimeField(blank=True, null=True)),
                ('end', models.DateTimeField(blank=True, null=True)),
                ('expires', models.BooleanField(default=False)),
                ('image', models.ImageField(blank=True, null=True, upload_to=api.models.activityImageStorageName)),
                ('image_alt', models.TextField(blank=True, null=True)),
                ('last_published', models.DateTimeField(blank=True, null=True)),
                ('unpublished_changes', models.BooleanField(default=False)),
            ],
            options={
                'ordering': ['-created'],
            },
        ),
        migrations.CreateModel(
            name='UserPermissions',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('user_email', models.EmailField(max_length=254, unique=True)),
                ('allow_app', models.BooleanField(default=False)),
                ('allow_api', models.BooleanField(default=False)),
            ],
        ),
        migrations.CreateModel(
            name='Waypoint',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('updated', models.DateTimeField(auto_now=True)),
                ('latitude', models.DecimalField(decimal_places=6, max_digits=9)),
                ('longitude', models.DecimalField(decimal_places=6, max_digits=9)),
                ('index', models.IntegerField(blank=True, null=True)),
                ('name', models.TextField()),
                ('description', models.TextField(blank=True, null=True)),
                ('departure_callout', models.TextField(blank=True, null=True)),
                ('arrival_callout', models.TextField(blank=True, null=True)),
            ],
            options={
                'ordering': ['index'],
            },
        ),
        migrations.CreateModel(
            name='WaypointMedia',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('updated', models.DateTimeField(auto_now=True)),
                ('media', models.FileField(upload_to=api.models.waypointMediaStorageName)),
                ('type', models.CharField(choices=[('image', 'Image'), ('audio', 'Audio'), ('video', 'Video')], max_length=20)),
                ('mime_type', models.TextField()),
                ('description', models.TextField(blank=True, null=True)),
                ('index', models.IntegerField(blank=True, null=True)),
                ('waypoint', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.waypoint')),
            ],
            options={
                'ordering': ['index'],
            },
        ),
        migrations.CreateModel(
            name='WaypointGroup',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('updated', models.DateTimeField(auto_now=True)),
                ('name', models.TextField(blank=True, null=True)),
                ('type', models.CharField(choices=[('ordered', 'Ordered'), ('unordered', 'Unordered'), ('geofence', 'Geofence')], default='ordered', max_length=50)),
                ('activity', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.activity')),
            ],
            options={
                'ordering': ['-created'],
            },
        ),
        migrations.AddField(
            model_name='waypoint',
            name='group',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.waypointgroup'),
        ),
        migrations.AddConstraint(
            model_name='waypoint',
            constraint=models.UniqueConstraint(fields=('group', 'index'), name='unique_group_index'),
        ),
    ]

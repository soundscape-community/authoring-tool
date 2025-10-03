# Copyright (c) Soundscape Community Contributors.
# Licensed under the MIT License.
# This is AI generated.

from __future__ import annotations

from typing import Iterable
import logging

from django import forms
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.db.models import Max
from django.forms.models import BaseInlineFormSet
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from .models import (
    Activity,
    Waypoint,
    WaypointGroup,
    WaypointMedia,
    WaypointGroupType,
    MediaType,
)


def _ensure_waypoint_index(instance: Waypoint) -> None:
    """Populate the waypoint index for ordered groups when left blank."""
    if (
        isinstance(instance, Waypoint)
        and instance.group_id
        and instance.index is None
        and instance.group.type == WaypointGroupType.ORDERED
    ):
        max_index = (
            Waypoint.objects.filter(group=instance.group).aggregate(Max("index"))["index__max"]
        )
        instance.index = 0 if max_index is None else max_index + 1


def _render_media_preview(media_obj, max_height: str = "200px"):
    """Render media preview HTML for admin display."""
    if media_obj and getattr(media_obj, "media", None):
        url = media_obj.media.url
        if getattr(media_obj, "type", None) == MediaType.IMAGE:
            return format_html(
                '<img src="{}" style="max-height: {}; object-fit: contain;" />',
                url,
                max_height,
            )
        return format_html('<a href="{}" target="_blank">{}</a>', url, media_obj.media.name)
    return _("No media uploaded")


class LoggingInlineFormSet(BaseInlineFormSet):
    """Inline formset that logs validation errors."""

    def is_valid(self):  # type: ignore[override]
        valid = super().is_valid()
        if not valid:
            logger = logging.getLogger(__name__)
            logger.warning(
                "Inline formset %s invalid. non_form_errors=%s errors=%s",
                self.__class__.__name__,
                self.non_form_errors(),
                [form.errors for form in self.forms],
            )
        return valid


class ReadonlyOnChangeMixin:
    """Adds common readonly fields when an object already exists."""

    readonly_when_existing: Iterable[str] = ("id", "created", "updated")

    def get_readonly_fields(self, request, obj=None):  # type: ignore[override]
        readonly_fields = list(super().get_readonly_fields(request, obj))  # type: ignore[misc]
        if obj:
            for field in self.readonly_when_existing:
                if field not in readonly_fields:
                    readonly_fields.append(field)
        return tuple(readonly_fields)


class WaypointMediaInline(admin.TabularInline):
    model = WaypointMedia
    formset = LoggingInlineFormSet
    extra = 0
    fields = ("index", "type", "mime_type", "description", "media", "media_preview")
    readonly_fields = ("media_preview",)
    ordering = ("index",)
    show_change_link = True

    @admin.display(description=_("Preview"))
    def media_preview(self, obj):
        return _render_media_preview(obj, max_height="160px")


class WaypointInline(admin.TabularInline):
    model = Waypoint
    formset = LoggingInlineFormSet
    extra = 0
    fields = ("index", "name", "display_group_type", "latitude", "longitude", "updated")
    readonly_fields = ("display_group_type", "updated")
    ordering = ("index",)
    show_change_link = True

    @admin.display(description=_("Group type"))
    def display_group_type(self, obj):
        if obj and obj.group:
            return obj.group.type
        return "-"


class WaypointGroupInline(admin.TabularInline):
    model = WaypointGroup
    formset = LoggingInlineFormSet
    extra = 0
    fields = ("name", "type", "created", "updated")
    readonly_fields = ("created", "updated")
    ordering = ("name",)
    show_change_link = True


class ActivityAdminForm(forms.ModelForm):
    author_user = forms.ModelChoiceField(
        label=_("Author account"),
        queryset=get_user_model().objects.none(),
        required=False,
        help_text=_('Optional shortcut: choose a user to populate the author fields.'),
    )

    class Meta:
        model = Activity
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user_model = get_user_model()
        queryset = user_model.objects.all().order_by("username")
        self.fields["author_user"].queryset = queryset
        if "author_name" in self.fields:
            self.fields["author_name"].required = False
        if "id" in self.fields:
            self.fields["id"].required = False

        instance = self.instance
        if instance and instance.author_id:
            try:
                self.initial["author_user"] = queryset.get(pk=instance.author_id)
            except (user_model.DoesNotExist, ValueError, TypeError):
                self.fields["author_user"].help_text = _(
                    "Stored author id %(value)s is not linked to a user. You can keep it or select a user to replace it."
                ) % {"value": instance.author_id}
        self.fields["author_id"].help_text = _(
            "Required numeric id of the author account. Use the selector above to auto-fill."
        )

    def full_clean(self):
        """Ensure author_id is populated from the selector before field validation."""
        if self.data:
            author_id_key = self.add_prefix("author_id")
            author_user_key = self.add_prefix("author_user")
            if not self.data.get(author_id_key) and self.data.get(author_user_key):
                mutable_data = self.data.copy()
                mutable_data[author_id_key] = self.data.get(author_user_key)
                if hasattr(mutable_data, "_mutable"):
                    mutable_data._mutable = False
                self.data = mutable_data
        super().full_clean()

    def clean(self):
        cleaned_data = super().clean()
        user = cleaned_data.get("author_user")
        author_id = cleaned_data.get("author_id")
        logger = logging.getLogger(__name__)
        logger.debug(
            "ActivityAdminForm clean initial author_id=%r user=%r", author_id, user
        )

        if user:
            cleaned_data["author_id"] = str(user.pk)
        if not cleaned_data.get("author_id"):
            self.add_error("author_id", _("Author id is required. Choose an author account or enter the id."))

        logger.debug(
            "ActivityAdminForm errors after validation: %s", self.errors.as_data()
        )

        return cleaned_data

    def save(self, commit=True):
        instance = super().save(commit=False)
        user = self.cleaned_data.get("author_user")
        if user:
            instance.author_id = str(user.pk)
            if not instance.author_email:
                instance.author_email = user.email
            if not instance.author_name:
                full_name = user.get_full_name()
                instance.author_name = full_name if full_name else user.username
        if commit:
            instance.save()
            self.save_m2m()
        return instance


@admin.register(Activity)
class ActivityAdmin(ReadonlyOnChangeMixin, admin.ModelAdmin):
    form = ActivityAdminForm
    list_display = (
        "name",
        "author_name",
        "author_email",
        "type",
        "locale",
        "last_published",
        "unpublished_changes",
    )
    list_filter = ("type", "locale", "expires", "unpublished_changes")
    search_fields = ("name", "author_name", "author_email")
    ordering = ("-created",)
    list_per_page = 25
    inlines: tuple = ()
    readonly_fields = (
        "last_published",
        "file_directory_path",
        "gpx_file_path",
        "waypoints_media_directory_path",
        "featured_image_preview",
    )
    fieldsets = (
        (
            _("Activity"),
            {
                "fields": (
                    "id",
                    "name",
                    "description",
                    "type",
                    "locale",
                    "author_user",
                    "author_id",
                    "author_name",
                    "author_email",
                    "created",
                    "updated",
                )
            },
        ),
        (
            _("Schedule"),
            {
                "fields": (
                    "start",
                    "end",
                    "expires",
                )
            },
        ),
        (
            _("Publishing"),
            {
                "fields": (
                    "last_published",
                    "unpublished_changes",
                    "file_directory_path",
                    "gpx_file_path",
                    "waypoints_media_directory_path",
                )
            },
        ),
        (
            _("Media"),
            {
                "fields": (
                    "image",
                    "image_alt",
                    "featured_image_preview",
                )
            },
        ),
    )

    @admin.display(description=_("Featured image"))
    def featured_image_preview(self, obj):
        if obj and obj.image:
            return format_html(
                '<img src="{}" style="max-height: 220px; object-fit: contain;" />',
                obj.image.url,
            )
        return _("No image uploaded")


@admin.register(WaypointGroup)
class WaypointGroupAdmin(ReadonlyOnChangeMixin, admin.ModelAdmin):
    list_display = ("name", "activity", "type", "created")
    list_filter = ("type", "activity")
    search_fields = ("name", "activity__name")
    ordering = ("activity__name", "name")
    list_per_page = 50
    list_select_related = ("activity",)
    raw_id_fields = ("activity",)
    inlines = (WaypointInline,)

    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for instance in instances:
            if isinstance(instance, Waypoint):
                _ensure_waypoint_index(instance)
            instance.save()
        for obj in formset.deleted_objects:
            obj.delete()
        formset.save_m2m()


@admin.register(Waypoint)
class WaypointAdmin(ReadonlyOnChangeMixin, admin.ModelAdmin):
    list_display = (
        "index",
        "name",
        "group",
        "display_activity",
        "latitude",
        "longitude",
    )
    list_filter = ("group__activity", "group__type")
    search_fields = (
        "name",
        "description",
        "group__name",
        "group__activity__name",
    )
    ordering = ("group__activity__name", "index")
    list_per_page = 50
    list_select_related = ("group", "group__activity")
    raw_id_fields = ("group",)
    inlines = (WaypointMediaInline,)

    @admin.display(description=_("Activity"))
    def display_activity(self, obj):
        if obj and obj.group:
            return obj.group.activity
        return "-"

    def save_model(self, request, obj, form, change):
        _ensure_waypoint_index(obj)
        super().save_model(request, obj, form, change)


@admin.register(WaypointMedia)
class WaypointMediaAdmin(ReadonlyOnChangeMixin, admin.ModelAdmin):
    list_display = ("index", "type", "waypoint", "display_activity", "description")
    list_filter = ("type", "waypoint__group__activity")
    search_fields = (
        "description",
        "waypoint__name",
        "waypoint__group__activity__name",
    )
    ordering = ("waypoint__group__activity__name", "index")
    list_select_related = ("waypoint", "waypoint__group", "waypoint__group__activity")
    raw_id_fields = ("waypoint",)
    readonly_fields = ("media_preview",)
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "id",
                    "waypoint",
                    "type",
                    "mime_type",
                    "description",
                    "index",
                    "media",
                    "media_preview",
                    "created",
                    "updated",
                )
            },
        ),
    )

    @admin.display(description=_("Activity"))
    def display_activity(self, obj):
        if obj and obj.waypoint and obj.waypoint.group:
            return obj.waypoint.group.activity
        return "-"

    @admin.display(description=_("Preview"))
    def media_preview(self, obj):
        return _render_media_preview(obj, max_height="200px")



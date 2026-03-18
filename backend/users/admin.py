# Copyright (c) Soundscape Community Contributors.
from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.action(description='Approve selected users')
def approve_selected_users(modeladmin, request, queryset):
    approved_count = queryset.filter(is_active=False).update(is_active=True)
    modeladmin.message_user(
        request,
        f'Approved {approved_count} user(s).',
        level=messages.SUCCESS,
    )


@admin.register(User)
class ApprovalUserAdmin(UserAdmin):
    actions = [approve_selected_users]
    list_display = (
        'username',
        'email',
        'first_name',
        'last_name',
        'is_active',
        'is_staff',
        'date_joined',
        'last_login',
    )
    list_filter = UserAdmin.list_filter + ('date_joined',)
    search_fields = ('username', 'email', 'first_name', 'last_name')

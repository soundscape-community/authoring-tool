# Copyright (c) Soundscape Community Contributors.

from django.conf import settings
from django.http import HttpResponseRedirect
from django.shortcuts import resolve_url

from allauth.account.adapter import DefaultAccountAdapter
from allauth.account.models import EmailAddress
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter


class ApprovalAccountAdapter(DefaultAccountAdapter):
    def is_open_for_signup(self, request):
        return False

    def respond_user_inactive(self, request, user):
        return HttpResponseRedirect(
            resolve_url(getattr(settings, 'PENDING_APPROVAL_REDIRECT_URL', '/pending-approval/'))
        )


class ApprovalSocialAccountAdapter(DefaultSocialAccountAdapter):
    def is_open_for_signup(self, request, sociallogin):
        return sociallogin.account.provider == 'google'

    def pre_social_login(self, request, sociallogin):
        verified_email = getattr(sociallogin, '_did_authenticate_by_email', None)
        if verified_email and sociallogin.user and sociallogin.user.pk:
            email_address = EmailAddress.objects.filter(
                user=sociallogin.user,
                email__iexact=verified_email,
            ).first()
            has_primary = EmailAddress.objects.filter(user=sociallogin.user, primary=True).exists()

            if email_address is None:
                EmailAddress.objects.create(
                    user=sociallogin.user,
                    email=verified_email,
                    verified=True,
                    primary=not has_primary,
                )
            else:
                updated_fields = []
                if not email_address.verified:
                    email_address.verified = True
                    updated_fields.append('verified')
                if not has_primary and not email_address.primary:
                    email_address.primary = True
                    updated_fields.append('primary')
                if updated_fields:
                    email_address.save(update_fields=updated_fields)

        return super().pre_social_login(request, sociallogin)

    def save_user(self, request, sociallogin, form=None):
        if sociallogin.account.provider == 'google':
            sociallogin.user.is_active = False
        return super().save_user(request, sociallogin, form=form)
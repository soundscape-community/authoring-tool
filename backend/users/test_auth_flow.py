# Copyright (c) Soundscape Community Contributors.

from types import SimpleNamespace

from django.conf import settings
from django.contrib.auth import SESSION_KEY, get_user_model
from django.contrib.auth.models import AnonymousUser
from django.contrib.messages import get_messages
from django.contrib.messages.storage.fallback import FallbackStorage
from django.contrib.sessions.middleware import SessionMiddleware
from django.test import RequestFactory, TestCase
from django.urls import reverse

from allauth.account.models import EmailAddress
from allauth.core import context
from allauth.socialaccount.adapter import get_adapter as get_socialaccount_adapter
from allauth.socialaccount.helpers import complete_social_login
from allauth.socialaccount.models import SocialAccount

User = get_user_model()


class GoogleApprovalFlowTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def _build_request(self, path='/accounts/google/login/callback/'):
        request = self.factory.get(path)
        session_middleware = SessionMiddleware(lambda req: None)
        session_middleware.process_request(request)
        request.session.save()
        request.user = AnonymousUser()
        request.allauth = SimpleNamespace()
        setattr(request, '_messages', FallbackStorage(request))
        return request

    def _build_sociallogin(self, request, *, email, uid, given_name='Google', family_name='User'):
        provider = get_socialaccount_adapter(request).get_provider(request, 'google')
        return provider.sociallogin_from_response(
            request,
            {
                'sub': uid,
                'email': email,
                'email_verified': True,
                'given_name': given_name,
                'family_name': family_name,
                'name': f'{given_name} {family_name}',
            },
        )

    def test_first_google_sign_in_creates_inactive_user_and_redirects_to_pending(self):
        request = self._build_request()
        sociallogin = self._build_sociallogin(
            request,
            email='pending@example.com',
            uid='google-pending-user',
        )

        with context.request_context(request):
            response = complete_social_login(request, sociallogin)

        user = User.objects.get(email='pending@example.com')

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, settings.PENDING_APPROVAL_REDIRECT_URL)
        self.assertFalse(user.is_active)
        self.assertFalse(request.user.is_authenticated)
        self.assertNotIn(SESSION_KEY, request.session)
        self.assertTrue(
            SocialAccount.objects.filter(user=user, provider='google', uid='google-pending-user').exists()
        )

    def test_approved_google_user_can_sign_in_normally_after_pending_signup(self):
        first_request = self._build_request()
        first_login = self._build_sociallogin(
            first_request,
            email='approved@example.com',
            uid='google-approved-user',
        )

        with context.request_context(first_request):
            first_response = complete_social_login(first_request, first_login)

        user = User.objects.get(email='approved@example.com')
        self.assertEqual(first_response.url, settings.PENDING_APPROVAL_REDIRECT_URL)

        user.is_active = True
        user.save(update_fields=['is_active'])

        second_request = self._build_request()
        second_login = self._build_sociallogin(
            second_request,
            email='approved@example.com',
            uid='google-approved-user',
        )

        with context.request_context(second_request):
            second_response = complete_social_login(second_request, second_login)

        self.assertEqual(second_response.status_code, 302)
        self.assertEqual(second_response.url, settings.LOGIN_REDIRECT_URL)
        self.assertEqual(second_request.session.get(SESSION_KEY), str(user.pk))
        self.assertTrue(second_request.user.is_authenticated)

    def test_verified_email_login_links_existing_user_without_wiping_password(self):
        user = User.objects.create_user(
            username='existing-user',
            email='existing@example.com',
            password='testpass123',
        )

        request = self._build_request()
        sociallogin = self._build_sociallogin(
            request,
            email='existing@example.com',
            uid='google-existing-user',
            given_name='Existing',
        )

        with context.request_context(request):
            response = complete_social_login(request, sociallogin)

        user.refresh_from_db()

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, settings.LOGIN_REDIRECT_URL)
        self.assertEqual(User.objects.filter(email='existing@example.com').count(), 1)
        self.assertTrue(user.check_password('testpass123'))
        self.assertTrue(request.user.is_authenticated)
        self.assertEqual(request.session.get(SESSION_KEY), str(user.pk))
        self.assertTrue(
            SocialAccount.objects.filter(user=user, provider='google', uid='google-existing-user').exists()
        )
        self.assertTrue(
            EmailAddress.objects.filter(user=user, email='existing@example.com', verified=True).exists()
        )


class UserAdminApprovalTests(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='testpass123',
        )
        self.pending_user = User.objects.create_user(
            username='pending-user',
            email='pending-admin@example.com',
            password='testpass123',
            is_active=False,
        )
        self.client.force_login(self.admin_user)

    def test_admin_action_approves_selected_users(self):
        response = self.client.post(
            reverse('admin:users_user_changelist'),
            {
                'action': 'approve_selected_users',
                '_selected_action': [str(self.pending_user.pk)],
                'select_across': '0',
            },
            follow=True,
        )

        self.pending_user.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(self.pending_user.is_active)
        self.assertTrue(
            any('Approved 1 user(s).' in str(message) for message in get_messages(response.wsgi_request))
        )


class LocalSignupClosedTests(TestCase):
    def test_allauth_local_signup_cannot_create_a_user(self):
        response = self.client.post(
            reverse('account_signup'),
            {
                'email': 'local@example.com',
                'username': 'local-user',
                'password1': 'testpass123',
                'password2': 'testpass123',
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'account/signup_closed.html')
        self.assertFalse(User.objects.filter(email='local@example.com').exists())


class CsrfBootstrapTests(TestCase):
    def test_frontend_csrf_bootstrap_sets_csrf_cookie(self):
        response = self.client.get(reverse('frontend_csrf_cookie'))

        self.assertEqual(response.status_code, 200)
        self.assertIn('csrftoken', response.cookies)
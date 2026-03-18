# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

from django.urls import path
from .views import AppView, CsrfCookieView

urlpatterns = [
    path('api/auth/csrf/', CsrfCookieView.as_view(), name='frontend_csrf_cookie'),
    path('', AppView.as_view()),
    path('pending-approval/', AppView.as_view()),
]

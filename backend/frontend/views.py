# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.generic import TemplateView
from django.views.decorators.csrf import ensure_csrf_cookie


@method_decorator(ensure_csrf_cookie, name='dispatch')
class AppView(TemplateView):
    template_name = 'index.html'

    def get(self, request, *args, **kwargs):
        # Make sure logged-in
        context = self.get_context_data(**kwargs)
        return self.render_to_response(context)


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CsrfCookieView(View):
    def get(self, request, *args, **kwargs):
        return JsonResponse({'detail': 'CSRF cookie set'})

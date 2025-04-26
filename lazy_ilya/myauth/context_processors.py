import os

from django.conf import settings


def vite_mode(request):
    return {
        'VITE_DEV_MODE': settings.DEBUG
    }
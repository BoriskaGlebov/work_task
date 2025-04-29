import os
from django.conf import settings
from django.http import HttpRequest
from typing import Dict


def vite_mode(request: HttpRequest) -> Dict[str, bool]:
    """
    Контекстный процессор для передачи информации о режиме разработки Vite в шаблоны Django.

    Args:
        request (HttpRequest): Объект HTTP-запроса Django.

    Returns:
        Dict[str, bool]: Словарь с флагом 'VITE_DEV_MODE', равным значению settings.DEBUG.
                         Используется в шаблонах для подключения Vite в режиме разработки.
    """
    return {
        'VITE_DEV_MODE': settings.DEBUG
    }

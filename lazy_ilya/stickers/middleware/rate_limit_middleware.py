import time

from django.core.cache import cache
from django.http import JsonResponse
from django.urls import reverse


class SimpleRateLimitMiddleware:
    """
    Пример примитивного rate limiting по IP:
    - max_requests: максимум запросов
    - window_seconds: окно времени в секундах
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.max_requests = 5  # максимум запросов
        self.window_seconds = 60  # окно в 60 секунд
        self.limited_path = [
            reverse("stickers:tasks"),
            reverse("stickers:stickers"),
        ]  # путь ручки, которую ограничиваем

    def __call__(self, request):
        if request.method == "POST" and request.path in self.limited_path:
            ip = self.get_client_ip(request)
            if not ip:
                # Если IP получить не удалось — пропускаем
                return self.get_response(request)

            cache_key = f"rl:{ip}"
            request_times = cache.get(cache_key, [])

            now = time.time()
            # Оставляем только запросы из текущего окна времени
            request_times = [t for t in request_times if now - t < self.window_seconds]

            if len(request_times) >= self.max_requests:
                # Превышение лимита
                retry_after = self.window_seconds - (now - request_times[0])
                error_response = {
                    "errors": {
                        "__all__": [
                            f"Превышено максимальное количество POST-запросов к этому API. Подожди {int(retry_after)} секунд"
                        ]
                    },
                    "retry_after_seconds": int(retry_after),
                }
                return JsonResponse(error_response, status=429)

            # Добавляем текущее время запроса в список
            request_times.append(now)
            cache.set(cache_key, request_times, timeout=self.window_seconds)

        return self.get_response(request)

    def get_client_ip(self, request):
        # Попытка получить IP клиента (учитывая возможные прокси)
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0].strip()
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip

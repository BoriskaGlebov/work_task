import json
from typing import Callable
from django.http import HttpResponse
from lazy_ilya.utils.settings_for_app import logger


class StickyNoteActionLoggingMiddleware:
    """
    Middleware для логирования действий пользователей в приложении sticky_notes.
    """

    def __init__(self, get_response: Callable):
        self.get_response = get_response

    def __call__(self, request) -> HttpResponse:
        path = request.path
        method = request.method
        user = request.user
        ip = request.META.get("REMOTE_ADDR")
        user_name = user.username if user.is_authenticated else "Аноним"
        body_data = None

        if method in ["POST", "PATCH", "PUT"]:
            try:
                if request.content_type == "application/json":
                    body_data = json.loads(request.body.decode())
                else:
                    body_data = f"[Неподдерживаемый тип контента: {request.content_type}]"
            except Exception as e:
                body_data = f"[Не удалось прочитать тело запроса: {str(e)}]"

        # Фильтр по пути — можно заменить на свой путь, например "/sticky-notes/"
        if path=="/" and user.is_authenticated:
            logger.bind(user=user_name).info(
                f"➡️ {method}-запрос от пользователя {user_name} на {path} с IP {ip}. Тело: {body_data}"
            )

        try:
            response = self.get_response(request)
        except Exception as e:
            logger.bind(user=user_name).exception(
                f"❌ Ошибка при обработке запроса {method} {path} с IP {ip}: {str(e)}"
            )
            raise

        if path=="/"  and user.is_authenticated:
            self.log_response(response, user_name, method, path, ip)

        return response

    def log_response(
        self, response: HttpResponse, user_name: str, method: str, path: str, ip: str
    ) -> None:
        if response.status_code >= 400:
            # Для всех ошибок логируем подробности
            body = ""
            content_type = response.get("Content-Type", "")
            if "application/json" in content_type or "text" in content_type:
                try:
                    body = response.content.decode(errors="ignore")
                    if "application/json" in content_type:
                        body = json.loads(body)
                except Exception as e:
                    body = f"[Ошибка при чтении тела ответа: {str(e)}]"

            logger.bind(user=user_name).warning(
                f"⚠️ {user_name} получил ошибку {response.status_code} на {method} {path} с IP {ip}. "
                f"Ответ сервера: {body}"
            )
        else:
            # Для успешных ответов:
            if method == "GET":
                logger.bind(user=user_name).info(
                    f"✅ {user_name} успешно выполнил GET-запрос на {path} с IP {ip}. Статус: {response.status_code}"
                )
            else:
                # Для других методов можно залогировать тело ответа
                body = ""
                content_type = response.get("Content-Type", "")
                if "application/json" in content_type or "text" in content_type:
                    try:
                        body = response.content.decode(errors="ignore")
                        if "application/json" in content_type:
                            body = json.loads(body)
                    except Exception as e:
                        body = f"[Ошибка при чтении тела ответа: {str(e)}]"

                logger.bind(user=user_name).info(
                    f"✅ {user_name} успешно выполнил {method}-запрос на {path} с IP {ip}. "
                    f"Статус: {response.status_code}. Ответ: {body}"
                )


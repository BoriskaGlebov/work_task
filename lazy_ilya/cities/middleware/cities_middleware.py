import json
from typing import Callable
from django.http import HttpResponse
from lazy_ilya.utils.settings_for_app import logger


class CitiesActionLoggingMiddleware:
    """
    Middleware для логирования действий пользователей в приложении cities.
    """

    def __init__(self, get_response: Callable):
        self.get_response = get_response

    def __call__(self, request) -> HttpResponse:
        path = request.path
        method = request.method
        user = request.user
        ip = request.META.get('REMOTE_ADDR')
        user_name = user.username if user.is_authenticated else "Аноним"
        file_names = [f.name for f in request.FILES.getlist("cityFile")] if request.FILES else []
        body_data = None
        if method in ['POST', 'PUT']:
            try:
                if request.content_type == 'application/json':
                    body_data = json.loads(request.body.decode())
                elif 'multipart/form-data' in request.content_type or 'application/x-www-form-urlencoded' in request.content_type:
                    body_data = request.POST.dict()
            except Exception as e:
                body_data = f"[Не удалось прочитать тело запроса: {str(e)}]"
        # Только для адресов, связанных с file_creator
        if path == '/cities/' and user.is_authenticated:
            if method == 'GET':
                logger.bind(user=user_name).info(
                    f"📄 GET-запрос на страницу поиска городов {path} с IP {ip}"
                )
        elif path == '/cities/admin/city-info/' and user.is_authenticated:
            if method == 'GET':
                logger.bind(user=user_name).info(
                    f"📄 GET-запрос на админ страницу получение имен таблиц  {path} с IP {ip}"
                )
        elif path == '/cities/admin/' and user.is_authenticated:
            if method == 'GET':
                logger.bind(user=user_name).info(
                    f"📄 GET-запрос на админ страницу работы с городами {path} с IP {ip}"
                )
        if path.startswith('/cities/cities/') and user.is_authenticated and method in ['PUT', 'DELETE']:
            logger.bind(user=user_name).info(
                f"{'📤' if method == 'PUT' else '💾'} {method}-запрос от {user_name} на {path} с IP {ip}. "
                f"Отправленные данные: {body_data}"
            )
        elif path.startswith('/cities/admin/') and method in ['POST']:
            files = f"Загруженные файлы: {file_names}"
            logger.bind(user=user_name, filename=','.join(file_names)).info(
                f"{'📤' if method == 'PUT' else '💾'} {method}-запрос от {user_name} на {path} с IP {ip}. "
                f"Отправленные данные: {body_data} {files if file_names else ''} "
            )
        elif path.startswith('/cities/admin/city-info/') and user.is_authenticated and method in ['POST', 'PUT']:
            logger.bind(user=user_name).info(
                f"{'📤' if method == 'PUT' else '💾'} {method}-запрос на создание/обновление от {user_name} на {path} с IP {ip}. "
                f"Отправленные данные: {body_data}"
            )

        try:
            response = self.get_response(request)
        except Exception as e:
            logger.bind(user=user_name).exception(
                f"❌ Ошибка при обработке запроса {method} {path} с IP {ip}: {str(e)}"
            )
            raise
        if path == '/cities/' and user.is_authenticated:
            logger.bind(user=user_name).info(
                f"✅ {user_name} успешно выполнил {method}-запрос на {path} "
                f"с IP {ip}. Статус: {response.status_code}"
            )
        elif path.startswith('/cities/cities/') and user.is_authenticated and method in ['PUT', 'DELETE']:
            self.log_response(response, user_name, method, path, ip)
        elif path.startswith('/cities/admin/') and user.is_authenticated and method in ['POST']:
            self.log_response(response, user_name, method, path, ip)
        elif path.startswith('/cities/admin/city-info/') and user.is_authenticated and method in ['POST', 'PUT']:
            self.log_response(response, user_name, method, path, ip)

        return response

    def log_response(self, response: HttpResponse, user_name: str, method: str, path: str, ip: str) -> None:
        """
        Подробное логирование ответа сервера.
        """
        content_type = response.get('Content-Type', '')
        body = ''
        if 'application/json' in content_type or 'text' in content_type:
            try:
                body = response.content.decode(errors='ignore')
                if 'application/json' in content_type:
                    body = json.loads(body)
            except Exception as e:
                body = f"[Ошибка при чтении тела ответа: {str(e)}]"

        if response.status_code >= 400:
            logger.bind(user=user_name).warning(
                f"⚠️ {user_name} получил ошибку {response.status_code} на {method} {path} с IP {ip}. "
                f"Ответ сервера: {body}"
            )
        else:
            logger.bind(user=user_name).info(
                f"✅ {user_name} успешно выполнил {method}-запрос на {path} с IP {ip}. "
                f"Статус: {response.status_code}. Ответ: {body}"
            )

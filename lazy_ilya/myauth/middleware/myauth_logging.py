import json
from django.http import HttpResponse
from django.contrib.auth.views import LoginView
from lazy_ilya.utils.settings_for_app import logger
from typing import Callable


class UserActionLoggingMiddleware:
    """
    Middleware для логирования действий пользователя, включая попытки входа, регистрации, сброса пароля
    и аутентифицированные действия. Логирует успешные и неуспешные запросы с дополнительной информацией
    о статусах ответа и контенте ошибок.

    Атрибуты:
        get_response (Callable): Функция для получения ответа на запрос.
    """

    def __init__(self, get_response: Callable):
        """
        Инициализация middleware.

        Args:
            get_response (Callable): Функция для получения ответа на запрос.
        """
        self.get_response = get_response

    def __call__(self, request) -> HttpResponse:
        """
        Обрабатывает запрос, логирует действия пользователя и передает запрос дальше.

        Логирует запросы для аутентифицированных пользователей и анонимных
        пользователей, например, попытки входа, регистрации и сброса пароля.

        Args:
            request: Объект запроса.

        Returns:
            HttpResponse: Ответ на запрос после его обработки.
        """
        user = request.user
        path = request.path
        method = request.method
        ip = request.META.get('REMOTE_ADDR')

        if 'registration' in path.lower() and method == 'GET':
            logger.info(f"Загрузка формы регистрации в приложение по адресу {path} from IP {ip}")
        elif 'reset-password' in path.lower() and method == 'GET':
            logger.info(f"Загрузка формы сброса пароля в приложение по адресу {path} from IP {ip}")
        elif 'login' in path.lower() and method == 'GET':
            logger.info(f"Загрузка формы входа в приложение по адресу {path} from IP {ip}")

        try:
            # Получаем ответ от следующего обработчика
            response = self.get_response(request)
        except Exception as e:
            # Логируем ошибку при обработке запроса
            logger.exception(f"❗ Ошибка при обработке запроса {method} {path} с IP {ip}: {str(e)}")
            raise

        # Логируем успешные и неуспешные запросы
        if 'registration' in path.lower() and method == 'POST':
            logger.info(f"🔐 Анонимная попытка регистрации через {path} с IP {ip} (Статус: {response.status_code})")
            self.custom_message(response, user, method, path, ip)
        elif 'reset-password' in path.lower() and method == 'POST':
            logger.info(f"🔐 Анонимная попытка сброса пароля через {path} с IP {ip} (Статус: {response.status_code})")
            self.custom_message(response, user, method, path, ip)
        elif 'login' in path.lower() and method == 'POST':
            logger.info(f"🔐 Анонимная попытка входа через {path} с IP {ip} (Статус: {response.status_code})")
            self.custom_message(response, user, method, path, ip)

        return response

    def custom_message(self, response: HttpResponse, user, method: str, path: str, ip: str) -> None:
        """
        Логирует сообщение об ошибках или успешных запросах с деталями ответа.

        Если запрос вернул ошибку (статус >= 400), логируется тело ответа, если оно доступно.

        Args:
            response (HttpResponse): Ответ на запрос.
            user: Пользователь, сделавший запрос.
            method (str): Метод HTTP-запроса (например, 'GET', 'POST').
            path (str): Путь, по которому был сделан запрос.
            ip (str): IP-адрес клиента, сделавшего запрос.
        """
        if response.status_code >= 400:
            # Пытаемся получить тело ответа в случае ошибки
            content_type = response.get('Content-Type', '')
            body = ''
            if 'application/json' in content_type:
                try:
                    body = json.loads(response.content.decode())
                except Exception:
                    body = response.content.decode(errors='ignore')
            elif 'text' in content_type:
                body = response.content.decode(errors='ignore')

            # Логируем ошибку с подробным ответом
            logger.warning(
                f"⚠️ {user} получил ошибку {response.status_code} на {method} {path} с IP {ip}. "
                f"Ответ сервера: {body}"
            )
        elif response.status_code == 200:
            # Логируем успешный запрос
            logger.info(
                f"⚠️ {user} получил успешный статус {response.status_code} на {method} {path} с IP {ip}."
            )

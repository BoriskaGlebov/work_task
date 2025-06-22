from django.apps import AppConfig


class StickersConfig(AppConfig):
    """
    Конфигурация приложения 'stickers'.

    Определяет параметры настройки для встроенной регистрации в проекте Django:
    - `default_auto_field` — тип поля автоинкрементного первичного ключа (по умолчанию BigAutoField).
    - `name` — имя приложения, соответствующее пути к модулю.
    - `verbose_name` — человекочитаемое имя приложения для отображения в админке.
    """

    default_auto_field: str = "django.db.models.BigAutoField"
    name: str = "stickers"
    verbose_name: str = "Стикеры/заметки"

from django.apps import AppConfig


class MyauthConfig(AppConfig):
    """
    Конфигурация приложения 'myauth', отвечающего за функциональность
    аутентификации и авторизации пользователей в проекте.

    Атрибуты:
        default_auto_field (str): Тип поля, используемый Django по умолчанию для автоматических первичных ключей.
        name (str): Полное имя приложения в проекте Django.
        verbose_name (str): Человекочитаемое имя приложения, отображаемое в админке.
    """

    default_auto_field: str = "django.db.models.BigAutoField"
    name: str = "myauth"
    verbose_name: str = "Авторизация"

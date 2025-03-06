from django.apps import AppConfig


class FileCreatorConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "file_creator"
    verbose_name = "Конвертер файлов"

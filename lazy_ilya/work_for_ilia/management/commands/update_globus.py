import os

from django.core.management import BaseCommand
from work_for_ilia.utils.my_settings.settings_for_app import logger
from work_for_ilia.views import Cities


class Command(BaseCommand):
    """
    Команда обновления данных в таблице с городами.

    Эта команда обрабатывает файл, содержащий данные о городах, и обновляет
    соответствующую таблицу в базе данных.

    Attributes:
        help (str): Описание команды, которое отображается при вызове помощи.
    """

    help: str = "Обновляет данные таблиц"

    @logger.catch(message="Непредвиденное исключение")
    def handle(self, *args: str, **options: dict) -> None:
        """
        Обрабатывает команду обновления данных.

        Выводит сообщения о начале и завершении процесса обновления базы данных.

        Args:
            *args (str): Необязательные аргументы командной строки.
            **options (dict): Необязательные параметры командной строки.
        """
        self.stdout.write("Начинаю обновление")
        try:
            # Путь к файлу с данными о городах
            file_path: str = os.path.abspath(
                "D:\\SkillBox\\work_task\\lazy_ilya\\work_for_ilia\\utils\\test_dir\\globus.docx"
            )

            # Обработка файла и обновление базы данных
            Cities.process_file(file_path)

            self.stdout.write(self.style.SUCCESS("БД обновлена"))
        except Exception as e:
            logger.error("sdf")
            self.stdout.write(
                self.style.ERROR(f"БД не обновлена, непрдвиденная ошибка - {e}")
            )

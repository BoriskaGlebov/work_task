import os
import re

# Укажите путь к настройкам вашего проекта
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "lazy_ilya.settings")
import django

# Настройка Django
django.setup()

from typing import List, Dict, Optional

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from docx import Document

from work_for_ilia.models import SomeTables, SomeDataFromSomeTables
from work_for_ilia.utils.my_settings.settings_for_app import ProjectSettings, logger


# from work_for_ilia.utils.my_settings.settings_for_app import ProjectSettings


class GlobusParser:
    """
    Класс обрабатывает содержимое файла с Городами
    """

    @staticmethod
    def process_file(file_path: str) -> None:
        """
        Обрабатывает загруженный файл с данными о городах.
        Обновляет названия таблиц на основе номера раздела.

        Args:
            file_path (str): Путь к загруженному файлу.
        """
        doc = Document(os.path.join(ProjectSettings.tlg_dir, file_path))
        paragraphs = doc.paragraphs
        processed_ids = []  # Список ID обработанных разделов

        for paragraph in paragraphs[1:]:
            pattern = r"^Раздел (\d+)\s*(.*)"  # Группировка номера и названия
            text = paragraph.text.strip()

            match = re.match(pattern, text)
            if match:
                section_number = match.group(1)  # Номер раздела
                section_name = text  # Полное название раздела

                try:
                    # Поиск таблицы по номеру раздела (в table_name)
                    table: Optional[SomeTables] = SomeTables.objects.filter(
                        table_name__istartswith=f"Раздел {section_number}").first()  # Ищем по началу строки
                    if table:
                        # Обновление существующей таблицы
                        if table.table_name != section_name:
                            table.table_name = section_name
                            table.save()
                            logger.info(f"Обновлено название таблицы '{table.table_name}' (ID: {table.id})")
                            processed_ids.append(table.id)  # Запоминаем ID
                        elif table and table.table_name == section_name:
                            processed_ids.append(table.id)  # Запоминаем ID
                            # logger.info(f"Ничего не обновлял '{table.table_name}' (ID: {table.id})")

                    else:
                        # Создание новой таблицы
                        table = SomeTables(table_name=section_name)
                        table.save()
                        logger.info(f"Создана новая таблица '{table.table_name}' (ID: {table.id})")
                        processed_ids.append(table.id)  # Запоминаем ID

                except Exception as e:
                    logger.error(f"Ошибка при обработке раздела '{section_name}': {e}")

        # Удаление устаревших таблиц
        tables_to_delete = SomeTables.objects.exclude(id__in=processed_ids)  # Исключаем обработанные
        deleted_count = tables_to_delete.count()
        tables_to_delete.delete()
        if deleted_count > 0:
            logger.info(f"Удалено {deleted_count} устаревших таблиц.")

    # channel_layer = get_channel_layer()

    # for num, table in enumerate(zip(tables_id, tables)):
    #     progress: int = int((num / len(tables)) * 100)
    #     logger.info(f"Отправка прогресса: {progress}%")
    #
    #     async_to_sync(channel_layer.group_send)(
    #         "progress_updates",
    #         {
    #             "type": "send_progress",
    #             "progress": progress,
    #         },
    #     )
    #
    #     for row in table[1].rows[3:]:
    #         res: Dict[str, any] = {
    #             "table_id": 0,
    #             "location": "",
    #             "name_organ": "",
    #             "pseudonim": "",
    #             "letters": False,
    #             "writing": False,
    #             "ip_address": "",
    #             "some_number": 0,
    #             "work_timme": "",
    #         }
    #         for key, cell in zip(res.keys(), row.cells):
    #             if key == "table_id":
    #                 res[key] = table[0]
    #             elif key in ["letters", "writing"]:
    #                 value_corrector = {"+": True, "-": False}
    #                 res[key] = value_corrector.get(
    #                     cell.text.strip(), False
    #                 )  # Default to False if not found
    #             else:
    #                 res[key] = cell.text.strip()
    #
    #         SomeDataFromSomeTables.objects.update_or_create(**res)
    #
    # # Получите обновленный список городов
    # all_rows = SomeDataFromSomeTables.objects.select_related("table_id").all()
    # updated_cities = [
    #     el.to_dict() for el in all_rows
    # ]  # Предполагается, что у вас есть метод to_dict()
    #
    # logger.info("Обработка завершена")
    #
    # # Отправьте финальное сообщение с прогрессом и обновленным списком городов
    # async_to_sync(channel_layer.group_send)(
    #     "progress_updates",
    #     {
    #         "type": "send_progress",
    #         "progress": 100,
    #         "cities": updated_cities,  # Отправляем обновленный список городов
    #     },
    # )


if __name__ == '__main__':
    GlobusParser.process_file('globus.docx')

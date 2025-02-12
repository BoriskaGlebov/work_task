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

    def __init__(self):
        self.model_inf = {
            "table_id": '',
            "dock_num": '',
            "location": '',
            "name_organ": '',
            "pseudonim": '',
            "letters": '',
            "writing": '',
            "ip_address": '',
            "some_number": '',
            "work_timme": '',
        }

    @classmethod
    def process_file(cls, file_path: str) -> None:
        """
        Обрабатывает загруженный файл с данными о городах.
        Обновляет названия таблиц на основе номера раздела.

        Args:
            file_path (str): Путь к загруженному файлу.
        """
        doc = Document(os.path.join(ProjectSettings.tlg_dir, file_path))
        tables = doc.tables
        paragraphs = doc.paragraphs
        processed_tables_ids = []  # Список ID обработанных разделов
        processed_cities_ids = []

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
                            processed_tables_ids.append(table.id)  # Запоминаем ID
                        elif table and table.table_name == section_name:
                            processed_tables_ids.append(table.id)  # Запоминаем ID
                            # logger.info(f"Ничего не обновлял '{table.table_name}' (ID: {table.id})")

                    else:
                        # Создание новой таблицы
                        table = SomeTables(table_name=section_name)
                        table.save()
                        logger.info(f"Создана новая таблица '{table.table_name}' (ID: {table.id})")
                        processed_tables_ids.append(table.id)  # Запоминаем ID

                except Exception as e:
                    logger.error(f"Ошибка при обработке раздела '{section_name}': {e}")

        # Удаление устаревших таблиц
        tables_to_delete = SomeTables.objects.exclude(id__in=processed_tables_ids)  # Исключаем обработанные
        deleted_count = tables_to_delete.count()
        tables_to_delete.delete()
        if deleted_count > 0:
            logger.info(f"Удалено {deleted_count} устаревших таблиц.")

        channel_layer = get_channel_layer()
        tables_id = SomeTables.objects.all()
        for num, table_zip in enumerate(zip(tables_id, tables)):
            progress: int = int((num / len(tables)) * 100)
            logger.info(f"Отправка прогресса: {progress}%")
            async_to_sync(channel_layer.group_send)(
                "progress_updates",
                {
                    "type": "send_progress",
                    "progress": progress,
                },
            )
            for row_num, row in enumerate(table_zip[1].rows[3:]):
                cells = [cell.text.strip().replace('\n', '<br>') for cell in row.cells]
                try:

                    # print(cells[1])
                    # input()
                    value_corrector = {"+": True, "-": False}
                    cls.model_inf: Dict[str, any] = {
                        "table_id": table_zip[0],
                        "dock_num": row_num+1,
                        "location": cells[1],
                        "name_organ": cells[2],
                        "pseudonim": cells[3],
                        "letters": value_corrector.get(cells[4]),
                        "writing": value_corrector.get(cells[5]),
                        "ip_address": cells[6] if cells[6] not in ['+', '-'] else cells[7],
                        "some_number": cells[7] if cells[6] not in ['+', '-'] else cells[8],
                        "work_timme": cells[8] if cells[6] not in ['+', '-'] else cells[9],
                    }

                    cr_or_upd_row = SomeDataFromSomeTables.objects.update_or_create(
                        table_id=table_zip[0], dock_num=cls.model_inf["dock_num"], defaults=cls.model_inf
                    )
                    processed_cities_ids.append(cr_or_upd_row[0].id)
                    if cr_or_upd_row[1]:
                        logger.info(f"Добавил новую запись {str(cr_or_upd_row[0])}")

                except Exception as e:
                    logger.error(
                        f"Ошибка при обработке записи Раздел {table_zip[0].table_name} -  Запись № {cells[0].text}")

        # Получите обновленный список городов
        delete_cities_ids = SomeDataFromSomeTables.objects.exclude(id__in=processed_cities_ids)
        delete_cities_ids_count = delete_cities_ids.count()
        delete_cities_ids.delete()
        if delete_cities_ids_count > 0:
            logger.info(f"Удалено {delete_cities_ids_count} устаревших записей городов.")

        all_rows = SomeDataFromSomeTables.objects.select_related("table_id").all()
        updated_cities = [
            el.to_dict() for el in all_rows
        ]  # Предполагается, что у вас есть метод to_dict()

        logger.info("Обработка завершена")

        # Отправьте финальное сообщение с прогрессом и обновленным списком городов
        async_to_sync(channel_layer.group_send)(
            "progress_updates",
            {
                "type": "send_progress",
                "progress": 100,
                "cities": updated_cities,  # Отправляем обновленный список городов
            },
        )


if __name__ == '__main__':
    GlobusParser.process_file('globus.docx')

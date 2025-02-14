import os
import re
from pprint import pprint

from django.db.models import Q

# Укажите путь к настройкам вашего проекта
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "lazy_ilya.settings")
import django

# Настройка Django
django.setup()

from typing import Dict, List, Optional

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from docx import Document
from work_for_ilia.models import SomeDataFromSomeTables, SomeTables
from work_for_ilia.utils.my_settings.settings_for_app import ProjectSettings, logger


# from work_for_ilia.utils.my_settings.settings_for_app import ProjectSettings


class GlobusParser:
    """
    Класс обрабатывает содержимое файла с Городами
    """

    def __init__(self):
        self.model_inf = {
            "table_id": "",
            "dock_num": "",
            "location": "",
            "name_organ": "",
            "pseudonim": "",
            "letters": "",
            "writing": "",
            "ip_address": "",
            "some_number": "",
            "work_timme": "",
        }

    @classmethod
    @logger.catch(message="Непредвиденное исключение")
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
        processed_tables = []  # Список обработанных разделов
        tables_to_add = []
        tables_to_update = []

        processed_cities = []
        cities_to_add = []
        cities_to_update = []

        for paragraph in paragraphs[1:]:
            pattern = r"^Раздел (\d+)\s*(.*)"  # Группировка номера и названия
            text = paragraph.text.strip()

            match = re.match(pattern, text)

            if match:
                section_number = match.group(1)  # Номер раздела
                section_name = text  # Полное название раздела
                # Поиск таблицы по номеру раздела (в table_name)
                table: Optional[SomeTables] = SomeTables.objects.filter(
                    Q(table_name__startswith=f"Раздел {section_number}")
                    & Q(table_name__regex=rf"^Раздел {section_number}(?!\d)")
                ).first()  # Ищем по началу строки
                if table:
                    # Обновление существующей таблицы
                    if table.table_name != section_name:
                        table.table_name = section_name
                        tables_to_update.append(table)
                        processed_tables.append(table)  # Запоминаем раздел
                    elif table and table.table_name == section_name:
                        processed_tables.append(table)  # Запоминаем раздел
                else:
                    # Создание новой таблицы
                    table = SomeTables(table_name=section_name)
                    tables_to_add.append(table)
                    processed_tables.append(table)  # Запоминаем ID
        try:
            if tables_to_add:
                res = SomeTables.objects.bulk_create(tables_to_add)
                for el in res:
                    logger.info(
                        f"Создана новая таблица '{el.table_name}' (ID: {el.id})"
                    )
            if tables_to_update:
                res2 = SomeTables.objects.bulk_update(
                    tables_to_update,
                    [
                        "table_name",
                    ],
                )
                for el in tables_to_update:
                    logger.info(
                        f"Обновлено название таблицы '{el.table_name}' (ID: {el.id})"
                    )
            # Удаление устаревших таблиц
            tables_to_delete = SomeTables.objects.exclude(
                id__in=[table.id for table in processed_tables]
            )  # Исключаем обработанные
            deleted_count = tables_to_delete.count()
            tables_to_delete.delete()
            if deleted_count > 0:
                logger.info(f"Удалено {deleted_count} устаревших таблиц.")
        except Exception as e:
            logger.error(f"Ошибка при обработке раздела {e}")

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
                cells = [cell.text.strip().replace("\n", "<br>") for cell in row.cells]
                row_in_db = (
                    SomeDataFromSomeTables.objects.select_related("table_id")
                    .filter(table_id=table_zip[0].id, dock_num=row_num + 1)
                    .first()
                )

                value_corrector = {"+": True, "-": False}
                cls.model_inf: Dict[str, any] = {
                    "table_id": table_zip[0],
                    "dock_num": row_num + 1,
                    "location": cells[1],
                    "name_organ": cells[2],
                    "pseudonim": cells[3],
                    "letters": (
                        value_corrector.get(cells[4])
                        if value_corrector.get(cells[4])
                        else False
                    ),
                    "writing": (
                        value_corrector.get(cells[5])
                        if value_corrector.get(cells[5])
                        else False
                    ),
                    "ip_address": (
                        cells[6] if cells[6] not in ["+", "-"] else cells[7]
                    ),
                    "some_number": (
                        cells[7] if cells[6] not in ["+", "-"] else cells[8]
                    ),
                    "work_timme": (
                        cells[8] if cells[6] not in ["+", "-"] else cells[9]
                    ),
                }

                # cr_or_upd_row = SomeDataFromSomeTables(**cls.model_inf)
                # processed_cities.append(cr_or_upd_row)
                if row_in_db:
                    needs_update = False
                    for key, value in cls.model_inf.items():
                        if getattr(row_in_db, key) != value:
                            setattr(row_in_db, key, value)
                            needs_update = True

                    if needs_update:
                        cities_to_update.append(
                            row_in_db
                        )  # Добавляем в список для обновления только если были изменения
                    processed_cities.append(
                        row_in_db
                    )  # Добавляем в список обработанных в любом случае

                else:
                    cr_or_upd_row = SomeDataFromSomeTables(**cls.model_inf)
                    cities_to_add.append(cr_or_upd_row)
                    processed_cities.append(cr_or_upd_row)
            # if cr_or_upd_row[1]:
            #     logger.info(f"Добавил новую запись {str(cr_or_upd_row[0])}")

            # except Exception as e:
            #     logger.error(
            #         f"Ошибка при обработке записи Раздел {table_zip[0].table_name} -  Запись № {cells[0].text}"
            #     )
        try:
            if cities_to_add:
                res = SomeDataFromSomeTables.objects.bulk_create(cities_to_add)
                for row in res:
                    logger.info(f"Добавил новую запись id = '{row.id}' - {row.location}")
            if cities_to_update:
                SomeDataFromSomeTables.objects.bulk_update(
                    cities_to_update,
                    [
                        "location",
                        "name_organ",
                        "pseudonim",
                        "letters",
                        "writing",
                        "ip_address",
                        "some_number",
                        "work_timme",
                    ],
                )
                for el in cities_to_update:
                    logger.info(f"Обновил запись id = '{el.id}' - {el.location}")
            # Получите обновленный список городов
            delete_cities_ids = SomeDataFromSomeTables.objects.select_related(
                "table_id"
            ).exclude(id__in=[row.id for row in processed_cities])
            delete_cities_ids_count = delete_cities_ids.count()
            delete_cities_ids.delete()
            if delete_cities_ids_count > 0:
                logger.info(
                    f"Удалено {delete_cities_ids_count} устаревших записей городов."
                )
        except Exception as e:
            logger.error(f"Произошла ошибка при работе со строками таблицы {e}")

        all_rows = SomeDataFromSomeTables.objects.select_related("table_id").exclude(
            Q(location__isnull=True) | Q(location__exact=''))
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

        #
        #


if __name__ == "__main__":
    GlobusParser.process_file("globus.docx")

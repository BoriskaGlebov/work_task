import json
import os.path
import threading
import traceback
from typing import Dict, List

from django.contrib.auth.decorators import user_passes_test
from django.db.models import Sum, Q
from django.db.models.functions import TruncDate
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render
from django.utils.decorators import method_decorator
from django.views import View
from work_for_ilia.models import Counter, SomeDataFromSomeTables, SomeTables
from work_for_ilia.utils.custom_converter.converter_to_docx import Converter
from work_for_ilia.utils.my_settings.settings_for_app import ProjectSettings, logger
from work_for_ilia.utils.parser_word.globus_parser import GlobusParser
from work_for_ilia.utils.parser_word.my_parser import (
    Parser,
    replace_unsupported_characters,
)
from work_for_ilia.utils.storage import OverwritingFileSystemStorage


# Create your views here.
class Greater(View):
    """
    Класс для обработки загрузки документов и их парсинга.

    Этот класс обрабатывает HTTP-запросы для загрузки файлов,
    их конвертации в нужный формат и парсинга содержимого.
    """

    def get(self, request: HttpRequest) -> HttpResponse:
        """
        Отображает форму для загрузки документов.

        Args:
            request (HttpRequest): Объект запроса.

        Returns:
            HttpResponse: Ответ с загруженной формой.
        """
        logger.debug("Загрузил страницу")
        return render(request=request, template_name="work_for_ilia/index.html")

    def post(self, request: HttpRequest) -> JsonResponse:
        """
        Обрабатывает загрузку документов и создает отредактированные файлы.

        Args:
            request (HttpRequest): Объект запроса.

        Returns:
            JsonResponse: Ответ с информацией о загруженных файлах и их содержимом.
        """
        uploaded_files = request.FILES.getlist("file")
        document_number = int(request.POST.get("document_number", 0))
        fs = OverwritingFileSystemStorage(
            location=ProjectSettings.tlg_dir, allow_overwrite=True
        )

        if not uploaded_files:
            return JsonResponse({"error": "Нет загруженных файлов"}, status=400)

        if document_number <= 0:
            return JsonResponse(
                {"error": "Номер документа должен быть больше нуля"}, status=400
            )

        new_files: List[str] = []  # Список для хранения имен новых файлов

        try:
            for index, uploaded_file in enumerate(uploaded_files):
                # Сохраните файл и получите его имя
                filename = fs.save(f"{index + 1}{uploaded_file.name}", uploaded_file)
                new_files.append(
                    f"{index + document_number}_{str(os.path.splitext(filename)[0])[1:]}.txt"
                )

            # Конвертация файлов в .docx и парсинг содержимого
            Converter(ProjectSettings.tlg_dir).convert_files()
            content = Parser(
                ProjectSettings.tlg_dir, document_number
            ).create_file_parsed()

            # Удаляем все файлы, кроме .txt
            for file in os.listdir(ProjectSettings.tlg_dir):
                file_path = os.path.join(ProjectSettings.tlg_dir, file)
                if os.path.isfile(file_path) and not file_path.endswith(".txt"):
                    os.remove(file_path)
            logger.debug(f"{new_files} - отправил названние новых файлов")
            return JsonResponse({"content": content, "new_files": new_files})

        except ValueError as ve:
            logger.error(f"ValueError: {str(ve)}")
            return JsonResponse({"error": "Неверный номер документа."}, status=400)

        except FileNotFoundError as fnfe:
            logger.error(f"FileNotFoundError: {str(fnfe)}")
            return JsonResponse({"error": "Файл не найден."}, status=404)

        except Exception as e:
            logger.error(str(e))
            return JsonResponse({"error": str(e)}, status=500)

    def put(self, request: HttpRequest) -> JsonResponse:
        """
        Обновляет содержимое документов на основе полученных данных.

        Args:
            request (HttpRequest): Объект запроса.

        Returns:
            JsonResponse: Ответ с информацией о статусе операции.
        """
        counter: int = 0  # Счетчик сохраненных файлов
        try:
            data = json.loads(request.body)

            for file_data in data:
                document_number = file_data.get("document_number")
                new_content = replace_unsupported_characters(file_data.get("content"))
                new_file_name: str = file_data.get(
                    "new_file_name"
                )  # Получаем новое имя файла

                if not new_file_name.endswith(".txt"):
                    continue

                # Определяем путь к файлу для сохранения
                file_path = os.path.join(ProjectSettings.tlg_dir, new_file_name)

                # Сохраняем новое содержимое в файл
                with open(file_path, "w", encoding="cp866") as file:
                    file.write(new_content)

                counter += 1
                logger.info(f"Сохранил файл {new_file_name}")

            res = Counter.objects.create(num_files=counter)
            res.save()
            return JsonResponse(
                {"status": "success", "message": "Все файлы успешно сохранены."}
            )

        except json.JSONDecodeError:
            logger.error(str("error") + "Неверный формат данных")
            return JsonResponse(
                {"status": "error", "message": "Неверный формат данных."}, status=400
            )

        except Exception as e:
            logger.error(str(e))
            return JsonResponse({"error": str(e)}, status=500)


class Cities(View):
    """
    Класс для обработки запросов, связанных с городами.
    """

    @method_decorator(user_passes_test(lambda u: u.is_superuser))
    def post(self, request: HttpRequest) -> JsonResponse:
        """
        Обрабатывает загрузку файла с данными о городах.

        Args:
            request (HttpRequest): Объект запроса.

        Returns:
            JsonResponse: Ответ с сообщением об успешной загрузке файла или ошибкой.
        """
        try:
            uploaded_file = request.FILES.get("cityFile")
            if not uploaded_file:
                return JsonResponse({"error": "No file uploaded"}, status=400)
            fs = OverwritingFileSystemStorage(location=ProjectSettings.tlg_dir, allow_overwrite=True)
            file_path = fs.save(uploaded_file.name, uploaded_file)

            logger.info("Запуск обработки файла в отдельном потоке")

            #  Здесь вызываем process_file в отдельном потоке
            threading.Thread(
                target=GlobusParser.process_file, args=(file_path,)
            ).start()

            return JsonResponse({"message": "File uploaded successfully"}, status=200)

        except Exception as e:
            # Если возникает исключение, логируем его и возвращаем сообщение об ошибке
            traceback_str = traceback.format_exc()  # Получаем полный traceback
            logger.error(f"Ошибка при загрузке или обработке файла: {e}\n{traceback_str}")
            return JsonResponse({"error": str(e), "traceback": traceback_str}, status=500)

    def get(self, request: HttpRequest) -> HttpResponse:
        """
        Получает список всех городов.

        Args:
            request (HttpRequest): Объект запроса.

        Returns:
            HttpResponse: Ответ с HTML-шаблоном и данными о городах в формате JSON.
        """
        is_admin: bool = request.user.is_superuser
        all_rows = SomeDataFromSomeTables.objects.select_related("table_id").exclude(
            Q(location__isnull=True) | Q(location__exact=''))
        cities: List[dict] = [row.to_dict() for row in all_rows]

        cities_json: str = json.dumps(cities, ensure_ascii=False)

        return render(
            request=request,
            template_name="work_for_ilia/cities.html",
            context={"cities_json": cities_json, "is_admin": is_admin},
        )


class Statistic(View):
    """
    Класс для обработки запросов статистики.

    Этот класс обрабатывает HTTP-запросы для получения статистики по обработанным файлам,
    включая общее количество файлов, количество кофе, выпитого на основе статистики,
    и день с максимальным количеством обработанных файлов.
    """

    def get(self, request: HttpRequest) -> HttpResponse:
        """
        Получает статистику по обработанным файлам.

        Args:
            request (HttpRequest): Объект запроса.

        Returns:
            HttpResponse: Ответ с HTML-шаблоном и статистикой.
        """
        total_files: int = (
                Counter.objects.aggregate(total=Sum("num_files"))["total"] or 0
        )
        coffee: int = (
                total_files // 2
        )  # Количество кофе, выпитого на основе общего числа файлов

        # Группируем записи по дате и подсчитываем сумму обработанных файлов за каждый день
        daily_totals = (
            Counter.objects.annotate(date=TruncDate("processed_at"))
            .values("date")
            .annotate(total=Sum("num_files"))
            .order_by("-total")
        )

        # Получаем день с максимальным количеством обработанных файлов
        if daily_totals:
            max_day = daily_totals[0]  # Первый элемент будет с максимальным значением
            max_date = max_day["date"]
            max_total_files = max_day["total"]
        else:
            max_date = None
            max_total_files = 0

        # Форматируем дату
        formatted_date: str = (
            max_date.strftime("%d - %m - %Y") if max_date else "Нет данных"
        )

        context: Dict[str, any] = {
            "converted_files": str(total_files),
            "hard_day": {
                "max_date": formatted_date,
                "max_day_files": str(max_total_files),
            },
            "coffee_drunk": {"amount": str(coffee), "note": "(1 кружка на 2 файла)"},
        }

        logger.info(f"Контекст для статистики {context}")
        return render(
            request=request,
            template_name="work_for_ilia/statistics.html",
            context=context,
        )

# TODO тут нужно вывести прогресс бар что б видно было весь процесс так как файл долго парсится либо сделать это в другом процессе? так же вопрос блокировки БД

import json
import os.path
import threading
import traceback
from pprint import pprint
from typing import Any, Callable, Dict, List, Optional

from django import forms
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.forms import UserCreationForm, PasswordResetForm
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.views import PasswordResetView
from django.contrib.sites.shortcuts import get_current_site
from django.core import serializers
from django.db.models import Max, Q, Sum, F
from django.db.models.functions import TruncDate
from django.http import FileResponse, HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.template.loader import render_to_string
from django.urls import reverse_lazy
from django.utils.decorators import method_decorator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.views import View
from django.views.generic import CreateView
from work_for_ilia.forms import CitiesForm, CustomUserCreationForm, CustomPasswordResetForm
from work_for_ilia.models import Counter, SomeDataFromSomeTables, SomeTables, CounterCities
from work_for_ilia.utils.custom_converter.converter_to_docx import Converter
from work_for_ilia.utils.my_settings.settings_for_app import (ProjectSettings,
                                                              logger, settings)
from work_for_ilia.utils.parser_word.globus_parser import GlobusParser
from work_for_ilia.utils.parser_word.my_parser import (
    Parser, replace_unsupported_characters)
from work_for_ilia.utils.storage import OverwritingFileSystemStorage


# Create your views here.
class Greater(LoginRequiredMixin, View):
    """
    Класс для обработки загрузки документов и их парсинга.

    Этот класс обрабатывает HTTP-запросы для загрузки файлов,
    их конвертации в нужный формат и парсинга содержимого.
    """
    login_url = reverse_lazy('work_for_ilia:login')

    def get(self, request: HttpRequest) -> HttpResponse:
        """
        Отображает форму для загрузки документов.

        Args:
            request (HttpRequest): Объект запроса.

        Returns:
            HttpResponse: Ответ с загруженной формой.
        """
        logger.bind(user=request.user.username).debug("Загрузил страницу")
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
            logger.bind(user=request.user.username).debug(f"{new_files} - отправил названние новых файлов")
            return JsonResponse({"content": content, "new_files": new_files})

        except ValueError as ve:
            logger.bind(user=request.user.username).error(f"ValueError: {str(ve)}")
            return JsonResponse({"error": "Неверный номер документа."}, status=400)

        except FileNotFoundError as fnfe:
            logger.bind(user=request.user.username).error(f"FileNotFoundError: {str(fnfe)}")
            return JsonResponse({"error": "Файл не найден."}, status=404)

        except Exception as e:
            logger.bind(user=request.user.username).error(str(e))
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
                logger.bind(user=request.user.username,filename=new_file_name).info(f"Сохранил файл ")

            res = Counter.objects.create(num_files=counter)
            res.save()
            return JsonResponse(
                {"status": "success", "message": "Все файлы успешно сохранены."}
            )

        except json.JSONDecodeError:
            logger.bind(user=request.user.username).error(str("error") + "Неверный формат данных")
            return JsonResponse(
                {"status": "error", "message": "Неверный формат данных."}, status=400
            )

        except Exception as e:
            logger.bind(user=request.user.username).error(str(e))
            return JsonResponse({"error": str(e)}, status=500)


def group_or_superuser_required(group_name: str) -> Callable:
    """
    Разрешает доступ к представлению только суперпользователям или пользователям,
    состоящим в указанной группе.

    Аргументы:
        group_name (str): Название группы, которой разрешен доступ.

    Возвращает:
        Callable: Декоратор, который проверяет, является ли пользователь
                  суперпользователем или состоит в указанной группе.
    """

    def check_user(user: User) -> bool:
        """
        Проверяет, является ли пользователь суперпользователем или состоит в указанной группе.

        Аргументы:
            user (User): Объект пользователя Django.

        Возвращает:
            bool: True, если пользователь является суперпользователем или состоит в группе,
                  иначе False.
        """
        return user.is_superuser or user.groups.filter(name=group_name).exists()

    return user_passes_test(check_user)


class Cities(LoginRequiredMixin,View):
    """
    Класс для обработки запросов, связанных с городами.

    Этот класс обрабатывает загрузку файлов с данными о городах, получение списка городов,
    обновление и удаление информации о городах.
    """
    login_url = reverse_lazy("work_for_ilia:login")
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
                logger.bind(user=request.user.username).error("Файл не загружен")
                logger.bind(user=request.user.username).error(f"FILES: {request.FILES}")
                return JsonResponse({"error": "Файл не загружен"}, status=400)

            fs = OverwritingFileSystemStorage(
                location=ProjectSettings.tlg_dir, allow_overwrite=True
            )
            file_path = fs.save(uploaded_file.name, uploaded_file)

            logger.bind(user=request.user.username).info("Запуск обработки файла в отдельном потоке")

            # Запускаем обработку файла в отдельном потоке
            threading.Thread(
                target=GlobusParser.process_file, args=(file_path,)
            ).start()

            return JsonResponse({"message": "Файл загружен успешно"}, status=200)

        except Exception as e:
            # Если возникает исключение, логируем его и возвращаем сообщение об ошибке
            traceback_str = traceback.format_exc()  # Получаем полный traceback
            logger.bind(user=request.user.username).error(
                f"Ошибка при загрузке или обработке файла: {e}\n{traceback_str}"
            )
            return JsonResponse(
                {"error": str(e), "traceback": traceback_str}, status=500
            )

    def get(self, request: HttpRequest) -> HttpResponse:
        """
        Получает список всех городов.

        Args:
            request (HttpRequest): Объект запроса.

        Returns:
            HttpResponse: Ответ с HTML-шаблоном и данными о городах в формате JSON.
        """
        is_admin: bool = request.user.is_superuser
        is_ilia: bool = False
        # Если не администратор, проверяем, состоит ли в группе
        if not is_admin:
            is_admin = request.user.groups.filter(name="admins").exists()
            is_ilia = request.user.groups.filter(name="ilia-group").exists()
        all_rows = SomeDataFromSomeTables.objects.select_related("table_id").exclude(
            Q(location__isnull=True) | Q(location__exact="")
        )

        # Преобразуем данные в словарь для каждого города
        cities: List[Dict[str, Any]] = [row.to_dict() for row in all_rows]

        # Преобразуем данные в JSON
        cities_json: str = json.dumps(cities, ensure_ascii=False)

        return render(
            request=request,
            template_name="work_for_ilia/cities.html",
            context={
                "cities_json": cities_json,
                "is_admin": is_admin,
                "is_ilia": is_ilia,
            },
        )

    def put(self, request: HttpRequest, table_id: int, dock_num: int) -> JsonResponse:
        """
        Обновляет информацию о городе.

        Args:
            request (HttpRequest): Объект запроса.
            table_id (int): ID таблицы.
            dock_num (int): Номер доки.

        Returns:
            JsonResponse: Ответ с сообщением об успехе или ошибке.
        """
        try:
            # Получаем город по ID таблицы и номеру доки
            city = get_object_or_404(
                SomeDataFromSomeTables, table_id=table_id, dock_num=dock_num
            )

            # Загружаем данные из тела запроса
            data = json.loads(request.body)

            # Обновляем поля города
            city.location = data.get("location", city.location)
            city.name_organ = data.get("name_organ", city.name_organ)
            city.pseudonim = data.get("pseudonim", city.pseudonim)
            city.ip_address = data.get("ip_address", city.ip_address)
            city.work_timme = data.get("work_time", city.work_timme)
            city.save()

            return JsonResponse({"status": "success"})

        except SomeDataFromSomeTables.DoesNotExist:
            return JsonResponse(
                {"status": "error", "message": "Город не найден"}, status=404
            )

        except json.JSONDecodeError:
            return JsonResponse(
                {"status": "error", "message": "Неверный формат JSON"}, status=400
            )

        except Exception as e:
            logger.bind(user=request.user.username).error(f"Ошибка при обновлении города: {e}")
            return JsonResponse({"status": "error", "message": str(e)}, status=500)

    def delete(
            self, request: HttpRequest, table_id: int, dock_num: int
    ) -> JsonResponse:
        """
        Удаляет город.

        Args:
            request (HttpRequest): Объект запроса.
            table_id (int): ID таблицы.
            dock_num (int): Номер доки.

        Returns:
            JsonResponse: Ответ с сообщением об успехе или ошибке.
        """
        try:
            # Получаем город по ID таблицы и номеру доки
            city = get_object_or_404(
                SomeDataFromSomeTables, table_id=table_id, dock_num=dock_num
            )

            if city:
                try:
                    counter_city = CounterCities.objects.get(
                        dock_num=city)  # changed name to the name u have in related model
                    counter_city.delete()  # Удаляем запись CounterCities
                except CounterCities.DoesNotExist:
                    # Если CounterCities не существует, ничего страшного, продолжаем
                    pass
                # Очищаем поля города
                city.location = ""
                city.name_organ = ""
                city.pseudonim = ""
                city.letters = False
                city.writing = False
                city.ip_address = ""
                city.some_number = ""
                city.work_timme = ""
                city.save()

            return JsonResponse({"status": "success"})

        except SomeDataFromSomeTables.DoesNotExist:
            return JsonResponse(
                {"status": "error", "message": "Город не найден"}, status=404
            )

        except Exception as e:
            logger.bind(user=request.user.username).error(f"Ошибка при удалении города: {e}")
            return JsonResponse({"status": "error", "message": str(e)}, status=500)


def download_file(request: HttpRequest) -> FileResponse:
    """
    Предоставляет файл для скачивания.

    Args:
        request (HttpRequest): Объект HTTP-запроса.

    Returns:
        FileResponse: HTTP-ответ, содержащий файл для скачивания.
    """
    file_path: str = os.path.join(ProjectSettings.tlg_dir, "globus_new.docx")
    logger.info(f"Запрос на скачивание файла: {file_path}")
    return FileResponse(
        open(file_path, "rb"), as_attachment=True, filename="globus_new.docx"
    )


def is_ajax(request: HttpRequest) -> bool:
    """
    Проверяет, является ли HTTP-запрос AJAX-запросом.

    Args:
        request (HttpRequest): Объект HTTP-запроса.

    Returns:
        bool: True, если запрос является AJAX-запросом, иначе False.
    """
    return request.META.get("HTTP_X_REQUESTED_WITH") == "XMLHttpRequest"


@group_or_superuser_required("admins")
def city_form_view(request: HttpRequest) -> HttpResponse:
    """
    Обрабатывает запросы для создания и обновления информации о городе.

    Этот view обрабатывает как GET-запросы для отображения формы, так и POST-запросы
    для сохранения данных формы. Доступ разрешен только администраторам или суперпользователям.

    Args:
        request (HttpRequest): Объект HTTP-запроса.

    Returns:
        HttpResponse: HTTP-ответ, содержащий HTML-страницу с формой или JSON-ответ
                      в случае AJAX-запроса.
    """
    instance: Optional[SomeDataFromSomeTables] = None
    button_text: str = "Сохранить изменения"
    form: CitiesForm = CitiesForm()  # Initialize form here

    if request.method == "POST":
        form = CitiesForm(request.POST, instance=instance)

        # Если такая запись уже существует, заполняем форму данными из БД
        try:
            table_id: str = request.POST.get("table_id")
            dock_num: str = request.POST.get("dock_num")
            instance = SomeDataFromSomeTables.objects.get(
                table_id=table_id, dock_num=dock_num
            )
            form = CitiesForm(request.POST, instance=instance)
            button_text = "Обновить"
        except SomeDataFromSomeTables.DoesNotExist:
            logger.bind(user=request.user.username).info("Запись не существует, форма для создания новой записи")

        if form.is_valid():
            form.save()
            logger.bind(user=request.user.username).info("Форма успешно сохранена")
            return redirect(reverse_lazy("work_for_ilia:cities"))
        else:
            logger.bind(user=request.user.username).error(f"Форма не валидна. Ошибки: {form.errors}")
    else:
        # Если это GET-запрос, проверяем параметры
        table_id: Optional[str] = request.GET.get("table_id")
        dock_num: Optional[str] = request.GET.get("dock_num")

        if table_id and dock_num:
            try:
                instance = SomeDataFromSomeTables.objects.get(
                    table_id=table_id, dock_num=dock_num
                )
                form = CitiesForm(instance=instance)
                button_text = "Обновить"
            except SomeDataFromSomeTables.DoesNotExist:
                logger.bind(user=request.user.username).info("Запись не существует")

    tables: SomeTables = SomeTables.objects.all()

    context: Dict[str, Any] = {
        "form": form,
        "tables": tables,
        "button_text": button_text,
        "instance": instance,
    }

    # Если это AJAX запрос, возвращаем данные в формате JSON
    if is_ajax(request):
        if instance:
            return JsonResponse(
                {
                    "instance": {
                        "location": instance.location,
                        "name_organ": instance.name_organ,
                        "pseudonim": instance.pseudonim,
                        "letters": instance.letters,
                        "writing": instance.writing,
                        "ip_address": instance.ip_address,
                        "some_number": instance.some_number,
                        "work_time": instance.work_timme,
                    }
                }
            )
        else:
            logger.bind(user=request.user.username).warning("Отправка пустого JSON ответа, т.к. instance не найден")
            return JsonResponse({})

    return render(request, "work_for_ilia/city_create_or_update.html", context)


def check_record_exists(request: HttpRequest) -> JsonResponse:
    """
    Проверяет, существует ли запись о городе с указанными table_id и dock_num.

    Args:
        request (HttpRequest): Объект HTTP-запроса, содержащий table_id и dock_num в GET-параметрах.

    Returns:
        JsonResponse: JSON-ответ, указывающий, существует ли запись и содержащий её данные, если она существует.
                      Возвращает {'exists': True, 'data': serialized_data} если запись существует,
                      иначе {'exists': False}.
    """
    table_id: str = request.GET.get("table_id")
    dock_num: str = request.GET.get("dock_num")

    try:
        instance: SomeDataFromSomeTables = SomeDataFromSomeTables.objects.get(
            table_id=table_id, dock_num=dock_num
        )
        # Serialize the instance data
        serialized_data: str = serializers.serialize(
            "json",
            [
                instance,
            ],
        )
        return JsonResponse({"exists": True, "data": serialized_data}, safe=False)
    except SomeDataFromSomeTables.DoesNotExist:
        return JsonResponse({"exists": False})


def get_next_dock_num(request: HttpRequest) -> JsonResponse:
    """
    Возвращает следующий доступный dock_num для указанного table_id.

    Args:
        request (HttpRequest): Объект HTTP-запроса, содержащий table_id в GET-параметрах.

    Returns:
        JsonResponse: JSON-ответ, содержащий следующий доступный dock_num или пустую строку, если table_id не указан.
    """
    table_id: str = request.GET.get("table_id")
    if table_id:
        aggregate_result: Dict[str, Optional[int]] = (
            SomeDataFromSomeTables.objects.filter(table_id=table_id).aggregate(
                Max("dock_num")
            )
        )
        last_dock_num: Optional[int] = aggregate_result["dock_num__max"]
        next_dock_num: int = 1 if last_dock_num is None else last_dock_num + 1
        return JsonResponse({"next_dock_num": next_dock_num})
    else:
        return JsonResponse({"next_dock_num": ""})


# Be careful with disabling CSRF protection in production! Consider using @method_decorator(csrf_protect, name='dispatch') in a class-based view instead.
def track_city(request: HttpRequest) -> JsonResponse:
    """
    Представление для подсчета запросов по городам к каким городам чаще делаются запросы
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            table_id = data.get('table_id')
            dock_num = data.get('dock_num')
            some_data = get_object_or_404(SomeDataFromSomeTables, table_id=table_id, dock_num=dock_num)
            #  Do something with the data (e.g., save to the database)
            #  Example (assuming you have a CitySelection model):
            #  CitySelection.objects.create(city_id=city_id, city_name=city_name)

            # Получаем или создаем запись для данного dock_num
            counter_city, created = CounterCities.objects.get_or_create(
                dock_num_id=some_data.id,
                defaults={'count_responses': 0}
            )

            # Увеличиваем счетчик запросов
            counter_city.count_responses = F('count_responses') + 1
            counter_city.save()

            print(f"City selected: tableID={table_id}, dock_num={dock_num}")  # For debugging

            return JsonResponse({'status': 'success'}, status=200)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            print(e)
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)


class Statistic(LoginRequiredMixin,View):
    """
    Класс для обработки запросов статистики.

    Этот класс обрабатывает HTTP-запросы для получения статистики по обработанным файлам,
    включая общее количество файлов, количество кофе, выпитого на основе статистики,
    и день с максимальным количеством обработанных файлов.
    """
    login_url = reverse_lazy("work_for_ilia:login")
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
        popular_city = CounterCities.objects.order_by('-count_responses')[:3]
        context: Dict[str, any] = {
            "statistics_json": json.dumps({
                "converted_files": str(total_files),
                "coffee_drunk": {
                    "amount": str(coffee),
                    "note": "(1 кружка на 2 файла)"
                },
                "hard_day": {
                    "max_day_files": str(max_total_files),
                    "max_date": formatted_date
                },
                "popular_cities": {f"city{num + 1}": {'name': el.dock_num.location,
                                                      'amount': str(el.count_responses)} for num, el in
                                   enumerate(popular_city)} if popular_city else ""
            })
        }

        logger.bind(user=request.user.username).info(f"Контекст для статистики {context}")
        return render(
            request=request,
            template_name="work_for_ilia/statistics.html",
            context=context,
        )


def register(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            logger.bind(user=request.user.username).info(f"Создал нового пользователя {request.user.username}")
            return redirect(reverse_lazy("work_for_ilia:index"))
    else:
        logger.bind(user=request.user.username).warning(f"Попытка создать нового пользователя {request.user.username}")
        form = CustomUserCreationForm()
    return render(request, 'work_for_ilia/register.html', {'form': form})


def custom_password_reset(request):
    if request.method == 'POST':
        form = CustomPasswordResetForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            user = User.objects.get(username=username)
            new_password1 = form.cleaned_data['new_password1']
            user.set_password(new_password1)
            user.save()
            logger.bind(user=request.user.username).info(f"Сброс пароля для пользователя {request.user.username}")
            return redirect(reverse_lazy('work_for_ilia:password_reset_complete'))

    else:
        logger.bind(user=request.user.username).warning(f"Попытка Сброса пароля для пользователя {request.user.username}")
        form = CustomPasswordResetForm()
    return render(request, 'work_for_ilia/password_reset.html', {'form': form})

import json
import threading
import traceback
from typing import Any, Dict

from cities.forms import CityDataForm, CityInfoDoForm
from cities.models import CityData, CityInfoDO, CounterCities
from cities.utils.common_func.get_city_context import (
    get_all_cities, get_context_admin_cities)
from cities.utils.parser_word.globus_parser import GlobusParser
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.views import redirect_to_login
from django.http import (FileResponse, Http404, HttpRequest, HttpResponse,
                         HttpResponseForbidden, HttpResponseNotFound,
                         JsonResponse)
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse_lazy
from django.views import View
from file_creator.utils.storage import OverwritingFileSystemStorage

from lazy_ilya.settings import MEDIA_ROOT
from lazy_ilya.utils.settings_for_app import ProjectSettings, logger

# Create your views here.


def base_view(request):
    return render(request=request, template_name="cities/admin-cities.html")


class Cities(View):
    """
    Класс для обработки запросов, связанных с городами.

    Этот класс обрабатывает загрузку файлов с данными о городах, получение списка городов,
    обновление и удаление информации о городах.
    """

    login_url = reverse_lazy("myauth:login")

    def dispatch(self, request, *args, **kwargs):
        if request.method in ["PUT", "DELETE"]:
            if not request.user.is_authenticated:
                # Для обычного запроса — редирект
                if request.content_type == "text/html":
                    return redirect_to_login(request.get_full_path(), self.login_url)
                # Для JS/AJAX — 403 Forbidden
                return JsonResponse(
                    {"status": "error", "message": "Authentication required"},
                    status=403,
                )
        return super().dispatch(request, *args, **kwargs)

    def get(self, request: HttpRequest) -> HttpResponse:
        """
        Получает список всех городов.

        Args:
            request (HttpRequest): Объект запроса.

        Returns:
            HttpResponse: Ответ с HTML-шаблоном и данными о городах в формате JSON.
        """
        context = get_all_cities(request=request)
        return render(
            request=request,
            template_name="cities/cities.html",
            context={**context},
        )

    def put(
        self, request: HttpRequest, table_id: int, dock_num: int | None = None
    ) -> JsonResponse:
        """
        Обновляет информацию о городе.

        Args:
            request (HttpRequest): Объект запроса.
            table_id (int): ID таблицы.
            dock_num (int|None): Номер доки| None.

        Returns:
            JsonResponse: Ответ с сообщением об успехе или ошибке.
        """
        try:
            # Загружаем данные из тела запроса
            data = json.loads(request.body)
            if "pseudonim" in data:
                # Получаем город по ID таблицы и номеру доки
                city = get_object_or_404(CityData, table_id=table_id, dock_num=dock_num)
                form = CityDataForm(data, instance=city)
                if form.is_valid():
                    form.save()
                    logger.bind(user=request.user.username).info(
                        f"Произошло обновление города {city.name_organ} - {city.location}"
                    )
                    return JsonResponse({"status": "success"})
                else:
                    logger.bind(user=request.user.username).error(
                        f"Ошибка при создании города: {json.dumps(form.errors.get_json_data(), ensure_ascii=False, indent=2)}"
                    )
                    return JsonResponse({"errors": form.errors}, status=400)
            elif "korr" in data:
                city_do = get_object_or_404(CityInfoDO, pk=table_id)
                form_do = CityInfoDoForm(data, instance=city_do)
                if form_do.is_valid():
                    form_do.save()
                    logger.bind(user=request.user.username).info(
                        f"Произошло обновление города {city_do.pk} - {city_do.korr}"
                    )
                    return JsonResponse({"status": "success"})
                else:
                    logger.bind(user=request.user.username).error(
                        f"Ошибка при создании города: {json.dumps(form_do.errors.get_json_data(), ensure_ascii=False, indent=2)}"
                    )
                    return JsonResponse({"errors": form_do.errors}, status=400)

        except Http404:
            logger.bind(user=request.user.username).error(f"Город не найден")
            return JsonResponse(
                {"status": "error", "message": "Город не найден"}, status=404
            )

        except json.JSONDecodeError:
            logger.bind(user=request.user.username).error(f"Неверный формат JSON")
            return JsonResponse(
                {"status": "error", "message": "Неверный формат JSON"}, status=400
            )

        except Exception as e:
            logger.bind(user=request.user.username).error(
                f"Ошибка при обновлении города: {e}"
            )
            return JsonResponse({"status": "error", "message": str(e)}, status=500)

    def delete(
        self, request: HttpRequest, table_id: int, dock_num: int | None = None
    ) -> JsonResponse:
        """
        Удаляет город.

        Args:
            request (HttpRequest): Объект запроса.
            table_id (int): ID таблицы.
            dock_num (int|None): Номер доки. или Nonr

        Returns:
            JsonResponse: Ответ с сообщением об успехе или ошибке.
        """
        try:
            if dock_num is not None:
                try:
                    # Получаем город по ID таблицы и номеру доки
                    city = CityData.objects.get(table_id=table_id, dock_num=dock_num)
                    logger.bind(user=request.user.username).info(
                        f"Проиcходит удаление города {city.name_organ} - {city.location}"
                    )
                    if city:
                        try:
                            counter_city = CounterCities.objects.get(
                                dock_num=city
                            )  # changed name to the name u have in related model
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
                except CityData.DoesNotExist:
                    pass
            # Пытаемся удалить CityInfoDO, если dock_num не передан или CityData не найден
            try:
                city_do = CityInfoDO.objects.get(pk=table_id)
                logger.bind(user=request.user.username).info(
                    f"Удаление CityInfoDO: ID {city_do.pk}, korr: {city_do.korr}"
                )
                city_do.delete()
                return JsonResponse({"status": "success"})

            except CityInfoDO.DoesNotExist:
                # Ни CityData, ни CityInfoDO не найдены
                raise Http404("Город не найден")

        except Http404:
            logger.bind(user=request.user.username).error(f"Город не найден")
            return JsonResponse(
                {"status": "error", "message": "Город не найден"}, status=404
            )

        except Exception as e:
            logger.bind(user=request.user.username).error(
                f"Ошибка при удалении города: {e}"
            )
            return JsonResponse({"status": "error", "message": str(e)}, status=500)


class CitiesAdmin(LoginRequiredMixin, UserPassesTestMixin, View):
    """
    Класс для обработки запросов, связанных с обновлением городов через админ панель

    """

    login_url = reverse_lazy("myauth:login")

    def test_func(self):
        # Проверяем, что пользователь в группе admin
        return (
            self.request.user.groups.filter(name="admins").exists()
            or self.request.user.is_superuser
        )

    def handle_no_permission(self):
        if not self.request.user.is_authenticated:
            # Если не залогинен — редиректим на страницу логина
            return redirect(self.login_url)
        # Возвращаем 403 вместо редиректа
        from django.http import HttpResponseForbidden

        return HttpResponseForbidden(
            "Доступ запрещён, только админ может сюда заходить"
        )

    def get(self, request: HttpRequest) -> HttpResponse:
        """
        Получает список названий таблиц для городов

        Args:
            request (HttpRequest): Объект запроса.

        Returns:
            HttpResponse: Ответ с HTML-шаблоном и данными о городах в формате JSON.
        """
        context = get_context_admin_cities()
        return render(
            request=request,
            template_name="cities/admin-cities.html",
            context={**context},
        )

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

            logger.bind(user=request.user.username).info(
                "Запуск обработки файла в отдельном потоке"
            )

            # Запускаем обработку файла в отдельном потоке
            threading.Thread(
                target=GlobusParser.process_file, args=(file_path,)
            ).start()
            logger.bind(user=request.user.username).info(f"Файл загружен успешно")
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


class CityInfoView(LoginRequiredMixin, UserPassesTestMixin, View):
    """
    Представление для работы с данными о городах (CityData).
    Поддерживает методы:
    - GET: получение информации о городе по номеру документа (dock_num) и ID таблицы (table_id)
    - POST: создание новой записи
    - PUT: обновление существующей записи
    """

    login_url = reverse_lazy("myauth:login")

    def test_func(self):
        # Проверяем, что пользователь в группе admin
        return (
            self.request.user.groups.filter(name__in=["admins", "ilia-group"]).exists()
            or self.request.user.is_superuser
        )

    def handle_no_permission(self):
        if not self.request.user.is_authenticated:
            # Если не залогинен — редиректим на страницу логина
            return redirect(self.login_url)
        # Возвращаем 403 вместо редиректа
        from django.http import HttpResponseForbidden

        return HttpResponseForbidden(
            "Доступ запрещён, только админ может сюда заходить"
        )

    def get(self, request: HttpRequest) -> JsonResponse:
        """
        Обрабатывает GET-запрос:
        - если передан dock_num, возвращает данные соответствующей записи
        - иначе возвращает следующий доступный номер документа

        :param request: объект запроса
        :return: JSON-ответ с найденными данными или следующим номером
        """
        dock_num = request.GET.get("dock_num")
        table_id = request.GET.get("table_id")

        if dock_num:
            try:
                obj: CityData = CityData.objects.get(
                    dock_num=dock_num, table_id=table_id
                )
                data: Dict[str, Any] = {
                    "location": obj.location,
                    "name_organ": obj.name_organ,
                    "pseudonim": obj.pseudonim,
                    "letters": obj.letters,
                    "writing": obj.writing,
                    "ip_address": obj.ip_address,
                    "some_number": obj.some_number,
                    "work_time": obj.work_time,
                }
                return JsonResponse({"found": True, "data": data})
            except CityData.DoesNotExist:
                return JsonResponse({"found": False})
        else:
            latest: CityData = (
                CityData.objects.filter(table_id=table_id).order_by("-dock_num").first()
            )
            next_num: int = latest.dock_num + 1 if latest else 1
            return JsonResponse({"last_num": next_num})

    def post(self, request: HttpRequest) -> JsonResponse:
        """
        Обрабатывает POST-запрос:
        - валидирует и сохраняет новые данные

        :param request: объект запроса
        :return: JSON-ответ с результатом создания или ошибками валидации
        """
        data = json.loads(request.body)
        if "pseudonim" in data:
            form = CityDataForm(data)
            if form.is_valid():
                obj: CityData = form.save()
                logger.bind(user=request.user.username).info(
                    f"Город успешно создан: {obj.id}"
                )
                return JsonResponse({"created": True, "id": obj.id})
            else:
                logger.bind(user=request.user.username).error(
                    f"Ошибка при создании города: {json.dumps(form.errors.get_json_data(), ensure_ascii=False, indent=2)}"
                )
                return JsonResponse({"errors": form.errors}, status=400)

        elif "korr" in data:
            form = CityInfoDoForm(data)
            if form.is_valid():
                obj = form.save()
                logger.bind(user=request.user.username).info(
                    f"Город успешно создан: {obj.id}"
                )
                return JsonResponse({"created": True, "id": obj.id})
            else:
                logger.bind(user=request.user.username).error(
                    f"Ошибка при создании города: {json.dumps(form.errors.get_json_data(), ensure_ascii=False, indent=2)}"
                )
                return JsonResponse({"errors": form.errors}, status=400)

    def put(self, request: HttpRequest) -> JsonResponse:
        """
        Обрабатывает PUT-запрос:
        - обновляет существующую запись по dock_num и table_id

        :param request: объект запроса
        :return: JSON-ответ с результатом обновления или ошибками
        """
        data = json.loads(request.body)
        try:
            obj: CityData = CityData.objects.get(
                dock_num=data["dock_num"], table_id=data["table_id"]
            )
        except CityData.DoesNotExist:
            return JsonResponse({"errors": "А я такой город не нашел!"}, status=404)

        form = CityDataForm(data, instance=obj)
        if form.is_valid():
            form.save()
            logger.bind(user=request.user.username).info(
                f"Город успешно обновлён: {obj.id}"
            )
            return JsonResponse({"updated": True})
        else:
            logger.bind(user=request.user.username).error(
                f"Ошибка при обновлении города: {json.dumps(form.errors.get_json_data(), ensure_ascii=False, indent=2)}"
            )
            return JsonResponse({"errors": form.errors}, status=400)


# @csrf_exempt
def increment_city_counters(request: HttpRequest) -> JsonResponse:
    """
    Обрабатывает POST-запрос для увеличения счетчиков запросов к городам.

    Ожидает JSON-тело запроса следующего вида:
        {
            "table_ids": [1, 2, 3],
            "dock_num": ["A1", "B2", "C3"]
        }

    Каждая пара (table_id, dock_num) используется для поиска записи CityData.
    Если такая запись найдена, увеличивается соответствующий счетчик в модели CounterCities.

    Returns:
        JsonResponse:
            - {"status": "ok"} с HTTP 200 — если операция прошла успешно.
            - {"error": "..."} с HTTP 400 — в случае ошибки обработки.
            - {"error": "Only POST allowed"} с HTTP 405 — если метод не POST.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Only POST allowed"}, status=405)

    try:
        data = json.loads(request.body)
        table_ids = data.get("table_ids", [])
        dock_nums = data.get("dock_num", [])

        # Проверка на соответствие количества элементов
        if len(table_ids) != len(dock_nums):
            return JsonResponse(
                {"error": "table_ids и dock_num должны быть одинаковой длины"},
                status=400,
            )

        for table_id, dock_num in zip(table_ids, dock_nums):
            try:
                city = CityData.objects.get(table_id=table_id, dock_num=dock_num)
                counter, created = CounterCities.objects.get_or_create(dock_num=city)
                counter.count_responses += 1
                counter.save()
            except CityData.DoesNotExist:
                continue  # Запись не найдена — пропускаем

        logger.bind(user=getattr(request.user, "username", "Anonymous")).info(
            "Обновлены счетчики запросов к городам"
        )
        return JsonResponse({"status": "ok"}, status=200)

    except Exception as e:
        logger.bind(user=getattr(request.user, "username", "Anonymous")).error(
            f"Ошибка при обновлении счетчиков: {str(e)}"
        )
        return JsonResponse({"error": str(e)}, status=400)


class CityDownload(LoginRequiredMixin, UserPassesTestMixin, View):
    """
    View для запуска фонового создания файла с данными города.

    Доступ разрешён только администраторам и суперпользователям.
    """

    login_url = reverse_lazy("myauth:login")

    def test_func(self) -> bool:
        """
        Проверяет, входит ли пользователь в группу 'admins' или является суперпользователем.

        Returns:
            bool: True, если пользователь администратор или суперпользователь, иначе False.
        """
        return (
            self.request.user.groups.filter(name="admins").exists()
            or self.request.user.is_superuser
        )

    def handle_no_permission(self) -> HttpResponse:
        """
        Обрабатывает отказ в доступе. Если пользователь не авторизован, редиректит на логин.
        Если авторизован, но не имеет прав — возвращает 403 Forbidden.

        Returns:
            HttpResponse: Редирект или сообщение об ошибке 403.
        """
        if not self.request.user.is_authenticated:
            return redirect(self.login_url)

        from django.http import HttpResponseForbidden

        return HttpResponseForbidden(
            "Доступ запрещён, только админ может сюда заходить"
        )

    def get(self, request: HttpRequest) -> JsonResponse:
        """
        Обрабатывает GET-запрос, запускает создание файла в отдельном потоке.

        Args:
            request (HttpRequest): Объект запроса от клиента.

        Returns:
            JsonResponse: Ответ об успешном запуске задачи.
        """
        logger.bind(user=request.user.username).info(
            "Запуск создания файла в отдельном потоке"
        )
        threading.Thread(target=GlobusParser.create_globus).start()
        logger.bind(user=request.user.username).info("Файл начал создание успешно")
        return JsonResponse({"status": "success"}, status=200)


@login_required
def download_file(
    request: HttpRequest, filename: str
) -> HttpResponseForbidden | FileResponse | HttpResponseNotFound:
    """
    Позволяет администратору или суперпользователю скачать файл по имени.

    Args:
        request (HttpRequest): Объект HTTP-запроса.
        filename (str): Имя файла для скачивания.

    Returns:
        HttpResponse: Ответ с файлом для загрузки или сообщение об ошибке:
            - 403 Forbidden, если у пользователя нет прав.
            - 404 Not Found, если файл не найден.
    """
    user = request.user
    if not (user.is_superuser or user.groups.filter(name="admins").exists()):
        return HttpResponseForbidden("Доступ запрещён")

    file_path = MEDIA_ROOT / filename
    if file_path.exists() and file_path.is_file():
        response = FileResponse(open(file_path, "rb"))
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
    else:
        return HttpResponseNotFound("Файл не найден")

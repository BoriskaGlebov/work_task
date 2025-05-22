import json
import traceback
from typing import List, Dict, Any

from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Q
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render, get_object_or_404
from django.urls import reverse_lazy
from django.views import View

from cities.models import CityData
from cities.utils.common_func.get_city_context import get_all_cities
from file_creator.utils.storage import OverwritingFileSystemStorage
from lazy_ilya.utils.settings_for_app import logger, ProjectSettings


# Create your views here.

def base_view(request):
    return render(request=request, template_name="cities/admin-cities.html")


class Cities(LoginRequiredMixin, View):
    """
    Класс для обработки запросов, связанных с городами.

    Этот класс обрабатывает загрузку файлов с данными о городах, получение списка городов,
    обновление и удаление информации о городах.
    """
    login_url = reverse_lazy("cities:base_template")

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
                CityData, table_id=table_id, dock_num=dock_num
            )
            # Загружаем данные из тела запроса
            data = json.loads(request.body)
            logger.info(data)
            # Обновляем поля города
            city.location = data.get("location", city.location)
            city.name_organ = data.get("name_organ", city.name_organ)
            city.pseudonim = data.get("pseudonim", city.pseudonim)
            city.ip_address = data.get("ip_address", city.ip_address)
            city.work_time = data.get("work_time", city.work_time)
            city.some_number = data.get("some_number", city.some_number)
            city.save()
            logger.bind(user=request.user.username).info(
                f"Произошло обновление города {city.name_organ} - {city.location}")
            return JsonResponse({"status": "success"})

        except CityData.DoesNotExist:
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
                CityData, table_id=table_id, dock_num=dock_num
            )

            if city:
                # try:
                #     counter_city = CounterCities.objects.get(
                #         dock_num=city)  # changed name to the name u have in related model
                #     counter_city.delete()  # Удаляем запись CounterCities
                # except CounterCities.DoesNotExist:
                #     # Если CounterCities не существует, ничего страшного, продолжаем
                #     pass
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
            return JsonResponse(
                {"status": "error", "message": "Город не найден"}, status=404
            )

        except Exception as e:
            logger.bind(user=request.user.username).error(f"Ошибка при удалении города: {e}")
            return JsonResponse({"status": "error", "message": str(e)}, status=500)

    # def post(self, request: HttpRequest) -> JsonResponse:
    #     """
    #     Обрабатывает загрузку файла с данными о городах.
    #
    #     Args:
    #         request (HttpRequest): Объект запроса.
    #
    #     Returns:
    #         JsonResponse: Ответ с сообщением об успешной загрузке файла или ошибкой.
    #     """
    #     try:
    #         uploaded_file = request.FILES.get("cityFile")
    #         if not uploaded_file:
    #             logger.bind(user=request.user.username).error("Файл не загружен")
    #             logger.bind(user=request.user.username).error(f"FILES: {request.FILES}")
    #             return JsonResponse({"error": "Файл не загружен"}, status=400)
    #
    #         fs = OverwritingFileSystemStorage(
    #             location=ProjectSettings.tlg_dir, allow_overwrite=True
    #         )
    #         file_path = fs.save(uploaded_file.name, uploaded_file)
    #
    #         logger.bind(user=request.user.username).info("Запуск обработки файла в отдельном потоке")
    #
    #         # Запускаем обработку файла в отдельном потоке
    #         threading.Thread(
    #             target=GlobusParser.process_file, args=(file_path,)
    #         ).start()
    #
    #         return JsonResponse({"message": "Файл загружен успешно"}, status=200)
    #
    #     except Exception as e:
    #         # Если возникает исключение, логируем его и возвращаем сообщение об ошибке
    #         traceback_str = traceback.format_exc()  # Получаем полный traceback
    #         logger.bind(user=request.user.username).error(
    #             f"Ошибка при загрузке или обработке файла: {e}\n{traceback_str}"
    #         )
    #         return JsonResponse(
    #             {"error": str(e), "traceback": traceback_str}, status=500
    #         )


class CitiesAdmin(LoginRequiredMixin, View):
    """
    Класс для обработки запросов, связанных с обновлением городов.

    """
    login_url = reverse_lazy("cities:admin_city")

    def get(self, request: HttpRequest) -> HttpResponse:
        """
        Получает список всех городов.

        Args:
            request (HttpRequest): Объект запроса.

        Returns:
            HttpResponse: Ответ с HTML-шаблоном и данными о городах в формате JSON.
        """
        context=get_all_cities(request=request)
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

            logger.bind(user=request.user.username).info("Запуск обработки файла в отдельном потоке")

            # Запускаем обработку файла в отдельном потоке
            # threading.Thread(
            #     target=GlobusParser.process_file, args=(file_path,)
            # ).start()

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

    # def put(self, request: HttpRequest, table_id: int, dock_num: int) -> JsonResponse:
    #     """
    #     Обновляет информацию о городе.
    #
    #     Args:
    #         request (HttpRequest): Объект запроса.
    #         table_id (int): ID таблицы.
    #         dock_num (int): Номер доки.
    #
    #     Returns:
    #         JsonResponse: Ответ с сообщением об успехе или ошибке.
    #     """
    #     try:
    #         # Получаем город по ID таблицы и номеру доки
    #         city = get_object_or_404(
    #             CityData, table_id=table_id, dock_num=dock_num
    #         )
    #         # Загружаем данные из тела запроса
    #         data = json.loads(request.body)
    #         logger.info(data)
    #         # Обновляем поля города
    #         city.location = data.get("location", city.location)
    #         city.name_organ = data.get("name_organ", city.name_organ)
    #         city.pseudonim = data.get("pseudonim", city.pseudonim)
    #         city.ip_address = data.get("ip_address", city.ip_address)
    #         city.work_time = data.get("work_time", city.work_time)
    #         city.some_number = data.get("some_number", city.some_number)
    #         city.save()
    #         logger.bind(user=request.user.username).info(
    #             f"Произошло обновление города {city.name_organ} - {city.location}")
    #         return JsonResponse({"status": "success"})
    #
    #     except CityData.DoesNotExist:
    #         return JsonResponse(
    #             {"status": "error", "message": "Город не найден"}, status=404
    #         )
    #
    #     except json.JSONDecodeError:
    #         return JsonResponse(
    #             {"status": "error", "message": "Неверный формат JSON"}, status=400
    #         )
    #
    #     except Exception as e:
    #         logger.bind(user=request.user.username).error(f"Ошибка при обновлении города: {e}")
    #         return JsonResponse({"status": "error", "message": str(e)}, status=500)
    #
    # def delete(
    #         self, request: HttpRequest, table_id: int, dock_num: int
    # ) -> JsonResponse:
    #     """
    #     Удаляет город.
    #
    #     Args:
    #         request (HttpRequest): Объект запроса.
    #         table_id (int): ID таблицы.
    #         dock_num (int): Номер доки.
    #
    #     Returns:
    #         JsonResponse: Ответ с сообщением об успехе или ошибке.
    #     """
    #     try:
    #         # Получаем город по ID таблицы и номеру доки
    #         city = get_object_or_404(
    #             CityData, table_id=table_id, dock_num=dock_num
    #         )
    #
    #         if city:
    #             # try:
    #             #     counter_city = CounterCities.objects.get(
    #             #         dock_num=city)  # changed name to the name u have in related model
    #             #     counter_city.delete()  # Удаляем запись CounterCities
    #             # except CounterCities.DoesNotExist:
    #             #     # Если CounterCities не существует, ничего страшного, продолжаем
    #             #     pass
    #             # Очищаем поля города
    #             city.location = ""
    #             city.name_organ = ""
    #             city.pseudonim = ""
    #             city.letters = False
    #             city.writing = False
    #             city.ip_address = ""
    #             city.some_number = ""
    #             city.work_timme = ""
    #             city.save()
    #
    #         return JsonResponse({"status": "success"})
    #
    #     except CityData.DoesNotExist:
    #         return JsonResponse(
    #             {"status": "error", "message": "Город не найден"}, status=404
    #         )
    #
    #     except Exception as e:
    #         logger.bind(user=request.user.username).error(f"Ошибка при удалении города: {e}")
    #         return JsonResponse({"status": "error", "message": str(e)}, status=500)



# def download_file(request: HttpRequest) -> FileResponse:
#     """
#     Предоставляет файл для скачивания.
#
#     Args:
#         request (HttpRequest): Объект HTTP-запроса.
#
#     Returns:
#         FileResponse: HTTP-ответ, содержащий файл для скачивания.
#     """
#     file_path: str = os.path.join(ProjectSettings.tlg_dir, "globus_new.docx")
#     logger.info(f"Запрос на скачивание файла: {file_path}")
#     return FileResponse(
#         open(file_path, "rb"), as_attachment=True, filename="globus_new.docx"
#     )


# def is_ajax(request: HttpRequest) -> bool:
#     """
#     Проверяет, является ли HTTP-запрос AJAX-запросом.
#
#     Args:
#         request (HttpRequest): Объект HTTP-запроса.
#
#     Returns:
#         bool: True, если запрос является AJAX-запросом, иначе False.
#     """
#     return request.META.get("HTTP_X_REQUESTED_WITH") == "XMLHttpRequest"
#
#
# @group_or_superuser_required("admins")
# def city_form_view(request: HttpRequest) -> HttpResponse:
#     """
#     Обрабатывает запросы для создания и обновления информации о городе.
#
#     Этот view обрабатывает как GET-запросы для отображения формы, так и POST-запросы
#     для сохранения данных формы. Доступ разрешен только администраторам или суперпользователям.
#
#     Args:
#         request (HttpRequest): Объект HTTP-запроса.
#
#     Returns:
#         HttpResponse: HTTP-ответ, содержащий HTML-страницу с формой или JSON-ответ
#                       в случае AJAX-запроса.
#     """
#     instance: Optional[SomeDataFromSomeTables] = None
#     button_text: str = "Сохранить изменения"
#     form: CitiesForm = CitiesForm()  # Initialize form here
#
#     if request.method == "POST":
#         form = CitiesForm(request.POST, instance=instance)
#
#         # Если такая запись уже существует, заполняем форму данными из БД
#         try:
#             table_id: str = request.POST.get("table_id")
#             dock_num: str = request.POST.get("dock_num")
#             instance = SomeDataFromSomeTables.objects.get(
#                 table_id=table_id, dock_num=dock_num
#             )
#             form = CitiesForm(request.POST, instance=instance)
#             button_text = "Обновить"
#         except SomeDataFromSomeTables.DoesNotExist:
#             logger.bind(user=request.user.username).info("Запись не существует, форма для создания новой записи")
#
#         if form.is_valid():
#             form.save()
#             logger.bind(user=request.user.username).info("Форма успешно сохранена")
#             return redirect(reverse_lazy("work_for_ilia:cities"))
#         else:
#             logger.bind(user=request.user.username).error(f"Форма не валидна. Ошибки: {form.errors}")
#     else:
#         # Если это GET-запрос, проверяем параметры
#         table_id: Optional[str] = request.GET.get("table_id")
#         dock_num: Optional[str] = request.GET.get("dock_num")
#
#         if table_id and dock_num:
#             try:
#                 instance = SomeDataFromSomeTables.objects.get(
#                     table_id=table_id, dock_num=dock_num
#                 )
#                 form = CitiesForm(instance=instance)
#                 button_text = "Обновить"
#             except SomeDataFromSomeTables.DoesNotExist:
#                 logger.bind(user=request.user.username).info("Запись не существует")
#
#     tables: SomeTables = SomeTables.objects.all()
#
#     context: Dict[str, Any] = {
#         "form": form,
#         "tables": tables,
#         "button_text": button_text,
#         "instance": instance,
#     }
#
#     # Если это AJAX запрос, возвращаем данные в формате JSON
#     if is_ajax(request):
#         if instance:
#             return JsonResponse(
#                 {
#                     "instance": {
#                         "location": instance.location,
#                         "name_organ": instance.name_organ,
#                         "pseudonim": instance.pseudonim,
#                         "letters": instance.letters,
#                         "writing": instance.writing,
#                         "ip_address": instance.ip_address,
#                         "some_number": instance.some_number,
#                         "work_time": instance.work_timme,
#                     }
#                 }
#             )
#         else:
#             logger.bind(user=request.user.username).warning("Отправка пустого JSON ответа, т.к. instance не найден")
#             return JsonResponse({})
#
#     return render(request, "work_for_ilia/city_create_or_update.html", context)
#
#
# def check_record_exists(request: HttpRequest) -> JsonResponse:
#     """
#     Проверяет, существует ли запись о городе с указанными table_id и dock_num.
#
#     Args:
#         request (HttpRequest): Объект HTTP-запроса, содержащий table_id и dock_num в GET-параметрах.
#
#     Returns:
#         JsonResponse: JSON-ответ, указывающий, существует ли запись и содержащий её данные, если она существует.
#                       Возвращает {'exists': True, 'data': serialized_data} если запись существует,
#                       иначе {'exists': False}.
#     """
#     table_id: str = request.GET.get("table_id")
#     dock_num: str = request.GET.get("dock_num")
#
#     try:
#         instance: SomeDataFromSomeTables = SomeDataFromSomeTables.objects.get(
#             table_id=table_id, dock_num=dock_num
#         )
#         # Serialize the instance data
#         serialized_data: str = serializers.serialize(
#             "json",
#             [
#                 instance,
#             ],
#         )
#         return JsonResponse({"exists": True, "data": serialized_data}, safe=False)
#     except SomeDataFromSomeTables.DoesNotExist:
#         return JsonResponse({"exists": False})
#
#
# def get_next_dock_num(request: HttpRequest) -> JsonResponse:
#     """
#     Возвращает следующий доступный dock_num для указанного table_id.
#
#     Args:
#         request (HttpRequest): Объект HTTP-запроса, содержащий table_id в GET-параметрах.
#
#     Returns:
#         JsonResponse: JSON-ответ, содержащий следующий доступный dock_num или пустую строку, если table_id не указан.
#     """
#     table_id: str = request.GET.get("table_id")
#     if table_id:
#         aggregate_result: Dict[str, Optional[int]] = (
#             SomeDataFromSomeTables.objects.filter(table_id=table_id).aggregate(
#                 Max("dock_num")
#             )
#         )
#         last_dock_num: Optional[int] = aggregate_result["dock_num__max"]
#         next_dock_num: int = 1 if last_dock_num is None else last_dock_num + 1
#         return JsonResponse({"next_dock_num": next_dock_num})
#     else:
#         return JsonResponse({"next_dock_num": ""})
#
#
# # Be careful with disabling CSRF protection in production! Consider using @method_decorator(csrf_protect, name='dispatch') in a class-based view instead.
# def track_city(request: HttpRequest) -> JsonResponse:
#     """
#     Представление для подсчета запросов по городам к каким городам чаще делаются запросы
#     """
#     if request.method == 'POST':
#         try:
#             data = json.loads(request.body)
#             table_id = data.get('table_id')
#             dock_num = data.get('dock_num')
#             some_data = get_object_or_404(SomeDataFromSomeTables, table_id=table_id, dock_num=dock_num)
#             #  Do something with the data (e.g., save to the database)
#             #  Example (assuming you have a CitySelection model):
#             #  CitySelection.objects.create(city_id=city_id, city_name=city_name)
#
#             # Получаем или создаем запись для данного dock_num
#             counter_city, created = CounterCities.objects.get_or_create(
#                 dock_num_id=some_data.id,
#                 defaults={'count_responses': 0}
#             )
#
#             # Увеличиваем счетчик запросов
#             counter_city.count_responses = F('count_responses') + 1
#             counter_city.save()
#
#             print(f"City selected: tableID={table_id}, dock_num={dock_num}")  # For debugging
#
#             return JsonResponse({'status': 'success'}, status=200)
#         except json.JSONDecodeError:
#             return JsonResponse({'error': 'Invalid JSON'}, status=400)
#         except Exception as e:
#             print(e)
#             return JsonResponse({'error': str(e)}, status=500)
#     else:
#         return JsonResponse({'error': 'Invalid request method'}, status=405)
#
#
# def group_or_superuser_required(group_name: str) -> Callable:
#     """
#     Разрешает доступ к представлению только суперпользователям или пользователям,
#     состоящим в указанной группе.
#
#     Аргументы:
#         group_name (str): Название группы, которой разрешен доступ.
#
#     Возвращает:
#         Callable: Декоратор, который проверяет, является ли пользователь
#                   суперпользователем или состоит в указанной группе.
#     """
#
#     def check_user(user: User) -> bool:
#         """
#         Проверяет, является ли пользователь суперпользователем или состоит в указанной группе.
#
#         Аргументы:
#             user (User): Объект пользователя Django.
#
#         Возвращает:
#             bool: True, если пользователь является суперпользователем или состоит в группе,
#                   иначе False.
#         """
#         return user.is_superuser or user.groups.filter(name=group_name).exists()
#
#     return user_passes_test(check_user)

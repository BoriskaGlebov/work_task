from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render
from django.urls import reverse_lazy
from django.views import View


# Create your views here.
@login_required
def base_template(request: HttpRequest) -> HttpResponse:
    context = {}
    return render(request, "file_creator/file_creator.html", context)


# Create your views here.
# class Greater(LoginRequiredMixin, View):
#     """
#     Класс для обработки загрузки документов и их парсинга.
#
#     Этот класс обрабатывает HTTP-запросы для загрузки файлов,
#     их конвертации в нужный формат и парсинга содержимого.
#     """
#     login_url = reverse_lazy('myauth:login')
#
#     def get(self, request: HttpRequest) -> HttpResponse:
#         """
#         Отображает форму для загрузки документов.
#
#         Args:
#             request (HttpRequest): Объект запроса.
#
#         Returns:
#             HttpResponse: Ответ с загруженной формой.
#         """
#         logger.bind(user=request.user.username).debug("Загрузил страницу")
#         return render(request=request, template_name="work_for_ilia/index.html")
#
#     def post(self, request: HttpRequest) -> JsonResponse:
#         """
#         Обрабатывает загрузку документов и создает отредактированные файлы.
#
#         Args:
#             request (HttpRequest): Объект запроса.
#
#         Returns:
#             JsonResponse: Ответ с информацией о загруженных файлах и их содержимом.
#         """
#         uploaded_files = request.FILES.getlist("file")
#         document_number = int(request.POST.get("document_number", 0))
#         fs = OverwritingFileSystemStorage(
#             location=ProjectSettings.tlg_dir, allow_overwrite=True
#         )
#
#         if not uploaded_files:
#             return JsonResponse({"error": "Нет загруженных файлов"}, status=400)
#
#         if document_number <= 0:
#             return JsonResponse(
#                 {"error": "Номер документа должен быть больше нуля"}, status=400
#             )
#
#         new_files: List[str] = []  # Список для хранения имен новых файлов
#
#         try:
#             for index, uploaded_file in enumerate(uploaded_files):
#                 # Сохраните файл и получите его имя
#                 filename = fs.save(f"{index + 1}{uploaded_file.name}", uploaded_file)
#                 new_files.append(
#                     f"{index + document_number}_{str(os.path.splitext(filename)[0])[1:]}.txt"
#                 )
#
#             # Конвертация файлов в .docx и парсинг содержимого
#             Converter(ProjectSettings.tlg_dir).convert_files()
#             content = Parser(
#                 ProjectSettings.tlg_dir, document_number
#             ).create_file_parsed()
#
#             # Удаляем все файлы, кроме .txt
#             for file in os.listdir(ProjectSettings.tlg_dir):
#                 file_path = os.path.join(ProjectSettings.tlg_dir, file)
#                 if os.path.isfile(file_path) and not file_path.endswith(".txt"):
#                     os.remove(file_path)
#             logger.bind(user=request.user.username).debug(f"{new_files} - отправил названние новых файлов")
#             return JsonResponse({"content": content, "new_files": new_files})
#
#         except ValueError as ve:
#             logger.bind(user=request.user.username).error(f"ValueError: {str(ve)}")
#             return JsonResponse({"error": "Неверный номер документа."}, status=400)
#
#         except FileNotFoundError as fnfe:
#             logger.bind(user=request.user.username).error(f"FileNotFoundError: {str(fnfe)}")
#             return JsonResponse({"error": "Файл не найден."}, status=404)
#
#         except Exception as e:
#             logger.bind(user=request.user.username).error(str(e))
#             return JsonResponse({"error": str(e)}, status=500)
#
#     def put(self, request: HttpRequest) -> JsonResponse:
#         """
#         Обновляет содержимое документов на основе полученных данных.
#
#         Args:
#             request (HttpRequest): Объект запроса.
#
#         Returns:
#             JsonResponse: Ответ с информацией о статусе операции.
#         """
#         counter: int = 0  # Счетчик сохраненных файлов
#         try:
#             data = json.loads(request.body)
#
#             for file_data in data:
#                 document_number = file_data.get("document_number")
#                 new_content = replace_unsupported_characters(file_data.get("content"))
#                 new_file_name: str = file_data.get(
#                     "new_file_name"
#                 )  # Получаем новое имя файла
#
#                 if not new_file_name.endswith(".txt"):
#                     continue
#
#                 # Определяем путь к файлу для сохранения
#                 file_path = os.path.join(ProjectSettings.tlg_dir, new_file_name)
#
#                 # Сохраняем новое содержимое в файл
#                 with open(file_path, "w", encoding="cp866") as file:
#                     file.write(new_content)
#
#                 counter += 1
#                 logger.bind(user=request.user.username, filename=new_file_name).info(f"Сохранил файл ")
#
#             res = Counter.objects.create(num_files=counter)
#             res.save()
#             return JsonResponse(
#                 {"status": "success", "message": "Все файлы успешно сохранены."}
#             )
#
#         except json.JSONDecodeError:
#             logger.bind(user=request.user.username).error(str("error") + "Неверный формат данных")
#             return JsonResponse(
#                 {"status": "error", "message": "Неверный формат данных."}, status=400
#             )
#
#         except Exception as e:
#             logger.bind(user=request.user.username).error(str(e))
#             return JsonResponse({"error": str(e)}, status=500)

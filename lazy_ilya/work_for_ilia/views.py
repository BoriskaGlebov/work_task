import json
import os.path
from http.client import HTTPResponse

from django.core.files.storage import FileSystemStorage
from django.http import HttpRequest, JsonResponse
from django.shortcuts import render
from django.views import View

from work_for_ilia.utils.custom_converter.converter_to_docx import Converter
from work_for_ilia.utils.my_settings.disrs_for_app import ProjectSettings
from work_for_ilia.utils.parser_word.my_parser import Parser


# Create your views here.
class Greater(View):
    """
    Класс для отображения формы для сохранения документов
    """

    def get(self, request: HttpRequest) -> HTTPResponse:
        """
        Старт, загрузка
        :param request:
        :return:
        """
        return render(request=request, template_name='work_for_ilia/index.html')

    def post(self, request: HttpRequest) -> JsonResponse:
        """
        Обновление поля с документом
        :param request:
        :return:
        """
        uploaded_file = request.FILES['file']
        document_number = request.POST.get('document_number')
        fs = FileSystemStorage(location=ProjectSettings.tlg_dir, allow_overwrite=True)

        # Сохраните файл и получите его имя
        filename = fs.save(uploaded_file.name, uploaded_file)
        Converter(ProjectSettings.tlg_dir).convert_files()
        content = Parser(ProjectSettings.tlg_dir, int(document_number)).create_file_parsed()
        # content_with_line_breaks = content.replace('\n', '<br>')
        files = os.listdir(ProjectSettings.tlg_dir)
        for file in files:
            file_path = os.path.join(ProjectSettings.tlg_dir, file)
            if os.path.isfile(file_path):
                os.remove(file_path)
        return JsonResponse({'content': f'<pre>{content}</content>'})
        # with open(os.path.join(ProjectSettings.tlg_dir,
        #                        f'{document_number}_{os.path.splitext(uploaded_file.name)[0]}.txt'), 'r',
        #           encoding='utf-8') as file:
        #     s = file.read()
        #     Получите URL сохранённого файла (если нужно)
        # file_url = fs.url(filename)
        #
        # content = s
        # content_with_line_breaks = content.replace('\n', '<br>')
        # return JsonResponse({'content': content_with_line_breaks})
        # return render(request=request, template_name='work_for_ilia/index.html')
        #

    def put(self, request: HttpRequest) -> JsonResponse:
        """
        Обновление содержимого документа
        :param request:
        :return:
        """
        try:
            data = json.loads(request.body)
            document_number = data.get('document_number')
            new_content = data.get('content')
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Неверный формат данных.'}, status=400)

            # Определяем путь к файлу для сохранения
        file_path = os.path.join(ProjectSettings.tlg_dir, f"{document_number}.txt")

        # Сохраняем новое содержимое в файл
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(new_content)

        return JsonResponse({'status': 'success', 'message': 'Файл успешно сохранен.'})

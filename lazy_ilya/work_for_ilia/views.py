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
        uploaded_files = request.FILES.getlist('file')
        document_number = int(request.POST.get('document_number'))
        fs = FileSystemStorage(location=ProjectSettings.tlg_dir, allow_overwrite=True)
        if not uploaded_files:
            return JsonResponse({'error': 'Нет загруженных файлов'}, status=400)
        if not document_number or int(document_number) <= 0:
            return JsonResponse({'error': 'Номер документа должен быть больше нуля'}, status=400)
        new_files = []  # Список для хранения имен новых файлов
        try:
            for index, uploaded_file in enumerate(uploaded_files):
                # Сохраните файл и получите его имя
                filename = fs.save(uploaded_file.name, uploaded_file)
                new_files.append(
                    f'{index + document_number}_{os.path.splitext(filename)[0]}.txt')  # Добавляем имя файла в список новых файлов
            Converter(ProjectSettings.tlg_dir).convert_files()
            content = Parser(ProjectSettings.tlg_dir, document_number).create_file_parsed()
            print(new_files)
            files = os.listdir(ProjectSettings.tlg_dir)
            print(files)
            for file in files:
                file_path = os.path.join(ProjectSettings.tlg_dir, file)
                if os.path.isfile(file_path) and not file_path.endswith('.txt'):
                    os.remove(file_path)
            return JsonResponse({'content': content,
                                 'new_files': new_files})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

        # Сохраните файл и получите его имя
        # filename = fs.save(uploaded_file.name, uploaded_file)
        # Converter(ProjectSettings.tlg_dir).convert_files()s
        # content = Parser(ProjectSettings.tlg_dir, int(document_number)).create_file_parsed()
        # # content_with_line_breaks = content.replace('\n', '<br>')
        # files = os.listdir(ProjectSettings.tlg_dir)
        # for file in files:
        #     file_path = os.path.join(ProjectSettings.tlg_dir, file)
        #     if os.path.isfile(file_path):
        #         os.remove(file_path)
        # return JsonResponse({'content': f'<pre>{content}</content>'})
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
        # return render(request=request, template_name='work_for_ilia/index_rename.html')
        #

    def put(self, request: HttpRequest) -> JsonResponse:
        """
        Обновление содержимого документов
        :param request:
        :return:
        """
        try:
            data = json.loads(request.body)
            for file_data in data:
                document_number = file_data.get('document_number')
                new_content = file_data.get('content')
                if new_content == '':
                    continue
                new_file_name = file_data.get('new_file_name')  # Получаем новое имя файла
                # Определяем путь к файлу для сохранения
                file_path = os.path.join(ProjectSettings.tlg_dir, f"{new_file_name}")  # Используем новое имя файла

                # Сохраняем новое содержимое в файл
                with open(file_path, 'w', encoding='utf-8') as file:
                    file.write(new_content)

            return JsonResponse({'status': 'success', 'message': 'Все файлы успешно сохранены.'})

        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Неверный формат данных.'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

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
    def get(self, request: HttpRequest) -> HTTPResponse:
        return render(request=request, template_name='work_for_ilia/index.html')

    def post(self, request: HttpRequest) -> JsonResponse:
        uploaded_file = request.FILES['file']
        document_number = request.POST.get('document_number')

        fs = FileSystemStorage(location=ProjectSettings.tlg_dir,allow_overwrite=True)
        print(ProjectSettings.tlg_dir)

        # Сохраните файл и получите его имя
        filename = fs.save(uploaded_file.name, uploaded_file)
        conv = Converter(ProjectSettings.tlg_dir).convert_files()
        pars = Parser(ProjectSettings.tlg_dir, int(document_number)).create_file_parsed()

        with open(os.path.join(ProjectSettings.tlg_dir, f'{document_number}_{os.path.splitext(uploaded_file.name)[0]}.txt'), 'r', encoding='utf-8') as file:
            s = file.read()
            # Получите URL сохранённого файла (если нужно)
            file_url = fs.url(filename)

            content = s
            content_with_line_breaks = content.replace('\n', '<br>')
            return JsonResponse({'content': content_with_line_breaks})
            # return render(request=request, template_name='work_for_ilia/index.html')
#

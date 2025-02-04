from django.core.management import BaseCommand
from docx import Document

from work_for_ilia.models import SomeDataFromSomeTables, SomeTables
from work_for_ilia.utils.my_settings.disrs_for_app import ProjectSettings
from work_for_ilia.utils.parser_word.my_parser import Parser


class Command(BaseCommand):
    """
    Команда обновления данных в таблице сгородами
    """
    help = 'Обновляет данные таблиц'

    def handle(self, *args, **options):
        self.stdout.write("Начинаю обновление")
        start_numm = 123
        s = Parser(ProjectSettings.tlg_dir, start_numm)
        doc = Document('D:\SkillBox\work_task\lazy_ilya\work_for_ilia\\utils\\test_dir\globus.docx')
        print(s.globus_parser(doc))
        # self.stdout.write(f"Созадн продукт {product.name}")
        self.stdout.write(self.style.SUCCESS("БД ОБновлена"))

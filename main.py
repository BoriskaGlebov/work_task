import os

from custom_converter.converter_to_docx import Converter
from parser_word.my_parser import Parser
from settings.main_settings import ProjectSettings

if __name__ == '__main__':
    # start_num = input("С какого номера начнем: ")
    start_num = 123
    print(ProjectSettings.tlg_dir)
    conv = Converter(ProjectSettings.tlg_dir).convert_files()
    print(conv)
    parser = Parser(ProjectSettings.tlg_dir, int(start_num))
    parser.create_file_parsed()
    # for file in conv:
    #     os.remove(file)

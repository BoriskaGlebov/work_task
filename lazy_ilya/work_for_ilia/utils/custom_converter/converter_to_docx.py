import os

from spire.doc import Document, FileFormat

from work_for_ilia.utils.my_settings.disrs_for_app import ProjectSettings


class Converter:
    """
    Конвертирует из любого .rtf .doc формата в .docx
    """

    def __init__(self, directory: str):
        self.dir = directory

    def all_files(self) -> list:
        """Получает список файлов в директории для обработки"""
        files = [file for file in os.listdir(self.dir) if
                 os.path.isfile(os.path.join(self.dir, file)) and not file.endswith(('.txt', '.docx'))]
        return files

    def convert_files(self) -> list:
        """Конвертирует файлы в нужный формат"""
        out_list = list()
        for file_name in self.all_files():
            n_name = os.path.splitext(file_name)[0]
            new_file_name = os.path.join(self.dir, f'{n_name}.docx')
            document = Document()
            document.LoadFromFile(os.path.join(self.dir, file_name))
            document.SaveToFile(new_file_name, FileFormat.Docx)
            out_list.append(new_file_name)
        return out_list


if __name__ == '__main__':
    print(ProjectSettings.tlg_dir)
    s = Converter(ProjectSettings.tlg_dir)
    print(s.all_files())
    print(s.convert_files())

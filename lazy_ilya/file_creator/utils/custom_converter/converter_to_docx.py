import os
from typing import List

from spire.doc import Document, FileFormat
from lazy_ilya.utils.settings_for_app import logger, ProjectSettings


class Converter:
    """
    Конвертирует файлы из форматов .rtf и .doc в .docx.

    Attributes:
        dir (str): Путь к директории, содержащей файлы для конвертации.
    """

    def __init__(self, directory: str):
        """
        Инициализирует экземпляр класса Converter.

        Args:
            directory (str): Путь к директории для обработки файлов.
        """
        self.dir = directory

    def all_files(self) -> List[str]:
        """
        Получает список файлов в директории для обработки.

        Returns:
            list[str]: Список имен файлов, которые будут конвертированы,
            исключая файлы с расширениями .txt и .docx.
        """
        files = [
            file
            for file in os.listdir(self.dir)
            if os.path.isfile(os.path.join(self.dir, file))
            and not file.endswith((".txt", ".docx"))
        ]
        return files

    def convert_files(self) -> List[str]:
        """
        Конвертирует файлы в формат .docx.

        Returns:
            list[str]: Список полных путей к новым .docx файлам после конвертации.
        """
        out_list = []
        for file_name in self.all_files():
            n_name = os.path.splitext(file_name)[0]
            new_file_name = os.path.join(self.dir, f"{n_name}.docx")
            document = Document()
            document.LoadFromFile(os.path.join(self.dir, file_name))
            document.SaveToFile(new_file_name, FileFormat.Docx)
            out_list.append(new_file_name)
            logger.bind(filename=file_name).info("Конвертирован файл - ")
        return out_list


if __name__ == "__main__":
    print(ProjectSettings.tlg_dir)
    s = Converter(ProjectSettings.tlg_dir)
    print(s.all_files())
    print(s.convert_files())

from django.core.files.storage import FileSystemStorage
from django.core.files.uploadedfile import UploadedFile
from typing import Any

class OverwritingFileSystemStorage(FileSystemStorage):
    """
    Кастомная файловая система хранения, позволяющая перезаписывать существующие файлы.

    Атрибуты:
        allow_overwrite (bool): Если True, разрешает перезапись файлов с одинаковыми именами.
    """

    def __init__(self, *args: Any, allow_overwrite: bool = False, **kwargs: Any) -> None:
        """
        Инициализация OverwritingFileSystemStorage.

        Аргументы:
            *args: Позиционные аргументы, передаваемые родительскому классу.
            allow_overwrite (bool): Флаг, разрешающий перезапись существующих файлов.
            **kwargs: Ключевые аргументы, передаваемые родительскому классу.
        """
        self.allow_overwrite = allow_overwrite
        super().__init__(*args, **kwargs)

    def _save(self, name: str, content: UploadedFile) -> str:
        """
        Сохраняет файл с заданным именем и содержимым.

        Если allow_overwrite равно True и файл с таким же именем уже существует,
        существующий файл будет удален перед сохранением нового.

        Аргументы:
            name (str): Имя файла для сохранения.
            content (UploadedFile): Содержимое файла для сохранения.

        Возвращает:
            str: Имя сохраненного файла.
        """
        if self.allow_overwrite and self.exists(name):
            self.delete(name)  # Удаляем существующий файл перед перезаписью
        return super()._save(name, content)

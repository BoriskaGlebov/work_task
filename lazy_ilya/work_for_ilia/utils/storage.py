from django.core.files.storage import FileSystemStorage
from typing import Optional

class OverwritingFileSystemStorage(FileSystemStorage):
    """
    Кастомная файловая система хранения, позволяющая перезаписывать существующие файлы.

    Attributes:
        allow_overwrite (bool): Если True, разрешает перезапись существующих файлов.
    """

    def __init__(self, *args: str, allow_overwrite: bool = False, **kwargs: Optional[dict]):
        """
        Инициализация OverwritingFileSystemStorage.

        Args:
            allow_overwrite (bool): Если True, разрешает перезапись существующих файлов.
            *args: Позиционные аргументы для родительского класса.
            **kwargs: Ключевые аргументы для родительского класса.
        """
        self.allow_overwrite: bool = allow_overwrite
        super().__init__(*args, **kwargs)

    def get_available_name(self, name: str, max_length: Optional[int] = None) -> str:
        """
        Возвращает доступное имя для сохранения файла.

        Если allow_overwrite=True и файл с таким именем существует,
        он будет удалён перед сохранением нового файла.

        Args:
            name (str): Имя файла, которое нужно проверить.
            max_length (Optional[int]): Максимальная длина имени файла (необязательный параметр).

        Returns:
            str: Доступное имя файла для сохранения.
        """
        if self.allow_overwrite and self.exists(name):
            self.delete(name)  # Удаляем существующий файл
        return name  # Возвращаем исходное имя без изменений

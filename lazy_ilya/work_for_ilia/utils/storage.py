from django.core.files.storage import FileSystemStorage

class OverwritingFileSystemStorage(FileSystemStorage):
    """
    Кастомная файловая система хранения, позволяющая перезаписывать существующие файлы.
    """

    def __init__(self, *args, allow_overwrite=False, **kwargs):
        """
        Инициализация OverwritingFileSystemStorage.

        :param allow_overwrite: Если True, разрешает перезапись существующих файлов.
        """
        self.allow_overwrite = allow_overwrite
        super().__init__(*args, **kwargs)

    def get_available_name(self, name, max_length=None):
        """
        Возвращает доступное имя для сохранения файла.

        Если allow_overwrite=True и файл с таким именем существует,
        он будет удалён перед сохранением нового файла.
        """
        if self.allow_overwrite and self.exists(name):
            self.delete(name)  # Удаляем существующий файл
        return name  # Возвращаем исходное имя без изменений

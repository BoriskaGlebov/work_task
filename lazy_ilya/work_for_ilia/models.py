from tkinter.constants import CASCADE

from django.db import models


class Counter(models.Model):
    """
    Модель для учета обработанных файлов.

    Атрибуты:
        processed_at (DateTimeField): Дата и время, когда файлы были обработаны.
                                       Автоматически устанавливается при создании записи.
        num_files (IntegerField): Количество обработанных файлов.

    Методы:
        __str__(): Возвращает строковое представление объекта,
                    показывающее дату обработки и количество файлов.
    """

    processed_at = models.DateTimeField(auto_now_add=True)
    num_files = models.IntegerField()

    def __str__(self):
        return f"Processed on {self.processed_at} = {self.num_files}"


class SomeTables(models.Model):
    processed_at = models.DateTimeField(auto_now_add=True)
    table_name = models.CharField(max_length=30, null=False, unique=True)

    def __str__(self):
        return f"Processed on {self.processed_at} = {self.table_name}"


class SomeDataFromSomeTables(models.Model):
    processed_at = models.DateTimeField(auto_now_add=True)
    table_id = models.ForeignKey(SomeTables, on_delete=models.CASCADE)
    location = models.CharField(max_length=255)
    name_organ = models.CharField(max_length=255)
    pseudonim = models.CharField(max_length=255)
    letters = models.BooleanField(default=False)
    writing = models.BooleanField(default=False)
    ip_address = models.CharField(max_length=255)
    some_number = models.CharField(max_length=255)
    work_timme = models.CharField(max_length=255)

    def to_dict(self):
        """Преобразует объект в словарь."""
        return {
            'table_id': self.table_id.id,
            'location': self.location,
            'name_organ': self.name_organ,
            'pseudonim': self.pseudonim,
            'letters': self.letters,
            'writing': self.writing,
            'ip_address': self.ip_address,
            'some_number': self.some_number,
            'work_time': self.work_timme
        }

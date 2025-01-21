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

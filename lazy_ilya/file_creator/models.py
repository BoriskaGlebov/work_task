from django.db import models

# Create your models here.


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

    processed_at: models.DateTimeField = models.DateTimeField(
        auto_now=True, verbose_name="Дата создания/обновления"
    )
    num_files: models.IntegerField = models.IntegerField(
        verbose_name="Количество обработанных файлов"
    )

    class Meta:
        ordering = ["pk"]
        verbose_name = "Счетчик сообщений"
        verbose_name_plural = "Счетчики сообщений"

    def __str__(self) -> str:
        return f"Processed on {self.processed_at.strftime('%d.%m.%Y %H:%M')} = {self.num_files}"

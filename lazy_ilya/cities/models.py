import os

from django.db import models



# Create your models here.

class TableNames(models.Model):
    """
    Модель, которая хранит названия таблиц с адресами.

    Атрибуты:
        processed_at (DateTimeField): Дата и время создания записи.
        table_name (CharField): Название таблицы, уникальное значение.

    Методы:
        __str__(): Возвращает строковое представление объекта,
                    показывающее дату создания и название таблицы.
    """

    processed_at: models.DateTimeField = models.DateTimeField(
        auto_now_add=True, verbose_name="Дата создания/обновления"
    )
    table_name: models.CharField = models.CharField(
        max_length=30, null=False, unique=True, verbose_name="Название таблицы"
    )

    class Meta:
        ordering = ["pk"]
        verbose_name = "Название для таблиц"
        verbose_name_plural = "Названия для таблиц"

    def __str__(self) -> str:
        return f"Processed on {self.processed_at.strftime('%d.%m.%Y %H:%M')} = {self.table_name}"


class CityData(models.Model):
    """
    Модель с адресами.

    Атрибуты:
        processed_at (DateTimeField): Дата и время создания записи.
        table_id (ForeignKey): Внешний ключ на модель SomeTables.
        dock_num (IntegerField): Порядковый номер в таблицe word
        location (CharField): Название города.
        name_organ (CharField): Название органа.
        pseudonim (CharField): Псевдоним.
        letters (BooleanField): Флаг наличия писем.
        writing (BooleanField): Флаг наличия записей.
        ip_address (CharField): Адрес IP.
        some_number (CharField): Специальный номер.
        work_time (CharField): Рабочее время.

    Методы:
        to_dict(): Преобразует объект в словарь для удобства работы с данными.
    """

    processed_at: models.DateTimeField = models.DateTimeField(
        auto_now_add=True, verbose_name="Дата создания/обновления"
    )
    table_id: models.ForeignKey = models.ForeignKey(
        TableNames, on_delete=models.CASCADE, verbose_name="Таблица"
    )
    dock_num: models.IntegerField = models.IntegerField(
        verbose_name="№ п/п",
        null=False,
        default=9999,
        blank=True,
    )
    location: models.CharField = models.CharField(
        max_length=255,
        verbose_name="Город",
        null=True,
        blank=True,
    )
    name_organ: models.CharField = models.CharField(
        max_length=255,
        verbose_name="Название органа",
        null=True,
        blank=True,
    )
    pseudonim: models.CharField = models.CharField(
        max_length=255,
        verbose_name="Псевдоним",
        null=True,
        blank=True,
    )
    letters: models.BooleanField = models.BooleanField(
        default=False,
        verbose_name="Письма",
        null=True,
        blank=True,
    )
    writing: models.BooleanField = models.BooleanField(
        default=False,
        verbose_name="Записи",
        null=True,
        blank=True,
    )
    ip_address: models.CharField = models.CharField(
        max_length=255,
        verbose_name="Адрес IP",
        null=True,
        blank=True,
    )
    some_number: models.CharField = models.CharField(
        max_length=255,
        verbose_name="Спец номер",
        null=True,
        blank=True,
    )
    work_time: models.CharField = models.CharField(
        max_length=255,
        verbose_name="Рабочее время",
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["pk", "table_id", "dock_num"]
        verbose_name = "Таблица городов"
        verbose_name_plural = "Таблицы городов"
        unique_together = (("table_id", "dock_num"),)

    def to_dict(self) -> dict:
        """Преобразует объект в словарь."""
        return {
            "table_id": self.table_id.id,
            "table_name": self.table_id.table_name,
            "dock_num": self.dock_num,
            "location": self.location,
            "name_organ": self.name_organ,
            "pseudonim": self.pseudonim,
            "letters": self.letters,
            "writing": self.writing,
            "ip_address": self.ip_address,
            "some_number": self.some_number,
            "work_time": self.work_time,
        }

    def __str__(self):
        return f"Раздел - {self.table_id.table_name} - № - {self.dock_num} - {self.location}"

    def save(self, *args, **kwargs):
        """
        Переопределяем метод save, чтобы автоматически устанавливать dock_num.
        """
        if not self.pk:  # Проверяем, что это новая запись
            # Получаем последний dock_num для данного table_id
            last_dock_num = CityData.objects.filter(
                table_id=self.table_id
            ).aggregate(models.Max("dock_num"))["dock_num__max"]
            # Если записей для данного table_id еще нет, начинаем с 1
            if last_dock_num is None:
                self.dock_num = 1
            else:
                self.dock_num = last_dock_num + 1

        super().save(*args, **kwargs)

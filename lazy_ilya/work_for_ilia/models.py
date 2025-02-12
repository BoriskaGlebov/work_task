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

    processed_at: models.DateTimeField = models.DateTimeField(
        auto_now_add=True, verbose_name="Дата создания/обновления"
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


class SomeTables(models.Model):
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


class SomeDataFromSomeTables(models.Model):
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
        SomeTables, on_delete=models.CASCADE, verbose_name="Таблица"
    )
    dock_num: models.IntegerField = models.IntegerField(verbose_name='№ п/п', null=False, default=9999)
    location: models.CharField = models.CharField(max_length=255, verbose_name="Город", null=True)
    name_organ: models.CharField = models.CharField(
        max_length=255, verbose_name="Название органа", null=True
    )
    pseudonim: models.CharField = models.CharField(
        max_length=255, verbose_name="Псевдоним", null=True, unique=True
    )
    letters: models.BooleanField = models.BooleanField(
        default=False, verbose_name="Письма", null=True
    )
    writing: models.BooleanField = models.BooleanField(
        default=False, verbose_name="Записи", null=True
    )
    ip_address: models.CharField = models.CharField(
        max_length=255, verbose_name="Адрес IP", null=True
    )
    some_number: models.CharField = models.CharField(
        max_length=255, verbose_name="Спец номер", null=True
    )
    work_timme: models.CharField = models.CharField(
        max_length=255, verbose_name="Рабочее время", null=True
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
            "dock_num": self.dock_num,
            "location": self.location,
            "name_organ": self.name_organ,
            "pseudonim": self.pseudonim,
            "letters": self.letters,
            "writing": self.writing,
            "ip_address": self.ip_address,
            "some_number": self.some_number,
            "work_time": self.work_timme,
        }

    def __str__(self):
        return f"Раздел - {self.table_id.table_name} - № - {self.dock_num} - {self.location}"
# TODO я поменял тут кое что  про пустые записи но здесь не сделал
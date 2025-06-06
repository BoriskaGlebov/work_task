from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class StickyNote(models.Model):
    """
    Модель StickyNote представляет собой стикер (заметку), размещаемую на доске пользователя.

    Атрибуты:
        owner (ForeignKey): Пользователь, к которому относится заметка.
        text (TextField): Основной текст заметки. По умолчанию содержит 'Новая заметка...'.
        color (CharField): Цвет фона заметки в HEX-формате. По умолчанию '#FFEB3B' (жёлтый).
        width (PositiveIntegerField): Ширина заметки.
        height (PositiveIntegerField): Высота заметки.
        order (PositiveIntegerField): Позиция среди других заметок.
        author_name (CharField): Автор или адресат заметки (например, 'Всем!', 'Для себя' и т.д.).
        created_at (DateTimeField): Дата и время создания заметки.
        updated_at (DateTimeField): Дата и время последнего обновления заметки.

    Метаданные:
        ordering: Сортировка заметок по последовательности на экране от самого первого.

    Пример использования:
        note = StickyNote.objects.create(owner=some_user, text='Напомнить о встрече')

    """
    text = models.TextField(default='Новая заметка...', blank=True, verbose_name="Текст заметки")
    color = models.CharField(max_length=20, default='#FFEB3B', verbose_name="Цвет заметки")
    author_name = models.CharField(max_length=500, blank=True, verbose_name="Автор")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sticky_notes',
                              verbose_name="Пользователь")
    width = models.PositiveIntegerField(default=300, verbose_name="Ширина")  # в пикселях
    height = models.PositiveIntegerField(default=200, verbose_name="Высота")  # в пикселях
    order = models.PositiveIntegerField(default=0)  # позиция среди других заметок

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата изменения")

    class Meta:
        ordering = ['order']
        verbose_name = "Таблица стикеров заметок"

    def __str__(self):
        return f"Заметка пользователя {self.owner.username} (id={self.id})"

    def save(self, *args, **kwargs):
        if not self.owner:
            if self.user.first_name:
                self.author = self.user.first_name
            else:
                self.author = self.owner.username
        super().save(*args, **kwargs)

    def to_dict(self) -> dict:
        """Преобразует объект в словарь."""
        return {
            "id": self.id,
            "owner": self.owner.first_name if self.owner.first_name else self.owner.username,
            "text": self.text,
            "color": self.color,
            "width": self.width,
            "height": self.height,
            "author_name": self.author_name,
            "order": self.order,

        }

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class StickyNote(models.Model):
    """
    Модель StickyNote представляет собой стикер (заметку), размещаемую на доске пользователя.

    Атрибуты:
        user (ForeignKey): Пользователь, к которому относится заметка.
        text (TextField): Основной текст заметки. По умолчанию содержит 'Новая заметка...'.
        color (CharField): Цвет фона заметки в HEX-формате. По умолчанию '#FFEB3B' (жёлтый).
        position_top (FloatField): Вертикальная позиция заметки на доске (в пикселях или %).
        position_left (FloatField): Горизонтальная позиция заметки на доске.
        author (CharField): Автор или адресат заметки (например, 'Всем!', 'Для себя' и т.д.).
        created_at (DateTimeField): Дата и время создания заметки.
        updated_at (DateTimeField): Дата и время последнего обновления заметки.

    Метаданные:
        ordering: Сортировка заметок по дате создания (сначала последние).

    Пример использования:
        note = StickyNote.objects.create(user=some_user, text='Напомнить о встрече')

    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sticky_notes',
                             verbose_name="Пользователь")
    text = models.TextField(default='Новая заметка...', blank=True, verbose_name="Текст заметки")
    color = models.CharField(max_length=20, default='#FFEB3B', verbose_name="Цвет заметки")
    position_top = models.FloatField(default=0, verbose_name="Y")
    position_left = models.FloatField(default=0, verbose_name="X")
    author = models.CharField(max_length=500, blank=True, verbose_name="Автор")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата изменения")

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Таблица стикеров заметок"

    def __str__(self):
        return f"Заметка пользователя {self.user.username} (id={self.id})"

    def save(self, *args, **kwargs):
        if not self.author:
            if self.user.first_name:
                self.author = self.user.first_name
            else:
                self.author = self.user.username
        super().save(*args, **kwargs)

    def to_dict(self) -> dict:
        """Преобразует объект в словарь."""
        return {
            "id": self.id,
            "user": self.user.username,
            "text": self.text,
            "color": self.color,
            "position_top": self.position_top,
            "position_left": self.position_left,
            "author": self.author,

        }

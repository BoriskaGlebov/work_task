from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class StickyNote(models.Model):
    """
    Стикер (заметка), размещаемый пользователем на своей доске.

    Атрибуты:
        owner (User): Пользователь, которому принадлежит заметка.
        text (str): Содержимое заметки.
        color (str): Цвет фона в HEX-формате.
        width (int): Ширина заметки в пикселях.
        height (int): Высота заметки в пикселях.
        order (int): Порядковый номер для сортировки.
        author_name (str): Кому адресована заметка.
        created_at (datetime): Дата создания.
        updated_at (datetime): Последнее обновление.
    """

    text: str = models.TextField(
        default="Новая заметка...", blank=True, verbose_name="Текст заметки"
    )
    color: str = models.CharField(
        max_length=20, default="#FFEB3B", verbose_name="Цвет заметки"
    )
    author_name: str = models.CharField(
        max_length=500, blank=True, verbose_name="Кому назначена"
    )
    owner: User = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sticky_notes",
        verbose_name="Автор заметки",
    )
    width: int = models.PositiveIntegerField(default=300, verbose_name="Ширина (px)")
    height: int = models.PositiveIntegerField(default=200, verbose_name="Высота (px)")
    order: int = models.PositiveIntegerField(
        default=0, verbose_name="Порядок отображения"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата изменения")

    class Meta:
        ordering = ["order"]
        verbose_name = "Стикер"
        verbose_name_plural = "Стикеры"

    def __str__(self) -> str:
        return f"Заметка пользователя {self.owner.username} (id={self.id})"

    def save(self, *args, **kwargs) -> None:
        if not self.author_name and self.owner:
            self.author_name = self.owner.first_name or self.owner.username
        super().save(*args, **kwargs)

    def to_dict(self) -> dict:
        owner_name = (
            f"{self.owner.first_name} {self.owner.last_name}".strip()
            if self.owner.first_name and self.owner.last_name
            else self.owner.first_name or self.owner.username
        )

        return {
            "id": self.id,
            "owner": owner_name,
            "text": self.text,
            "color": self.color,
            "width": self.width,
            "height": self.height,
            "author_name": self.author_name,
            "order": self.order,
        }


class StickyNoteVisibility(models.Model):
    """
    Видимость стикера для конкретного пользователя.

    Атрибуты:
        sticky_note (StickyNote): Ссылка на стикер.
        user (User): Пользователь, для которого задана видимость.
        is_visible (bool): Статус видимости стикера для пользователя.
                           True — стикер виден,
                           False — стикер "удален" для этого пользователя (скрыт).
    """

    sticky_note = models.ForeignKey(
        StickyNote,
        on_delete=models.CASCADE,
        related_name="visibilities",
        verbose_name="Стикер",
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sticky_note_visibilities",
        verbose_name="Пользователь",
    )
    is_visible = models.BooleanField(
        default=True,
        verbose_name="Видимость",
        help_text="True — стикер виден пользователю, False — скрыт (удален для себя)",
    )

    class Meta:
        unique_together = ("sticky_note", "user")
        verbose_name = "Видимость стикера"
        verbose_name_plural = "Видимости стикеров"

    def __str__(self):
        status = "Виден" if self.is_visible else "Скрыт"
        return f"Видимость стикера {self.sticky_note.id} для пользователя {self.user.username}: {status}"


class Task(models.Model):
    """
    Задача пользователя с возможностью назначения, тегов и приоритета.

    Атрибуты:
        title (str): Заголовок задачи.
        desc (str): Описание.
        deadline (date): Срок исполнения.
        priority (str): Приоритет ('low', 'medium', 'high').
        done (bool): Отметка выполнения.
        author (User): Создатель задачи.
        assignee (User | None): Назначенный исполнитель.
        tags (ManyToMany): Теги задачи.
        created_at (datetime): Дата создания.
        updated_at (datetime): Последнее обновление.
    """

    PRIORITY_CHOICES = [
        ("low", "🟢 Низкий"),
        ("medium", "🟡 Средний"),
        ("high", "🔴 Высокий"),
    ]

    title: str = models.CharField(max_length=255, verbose_name="Заголовок задачи")
    desc: str = models.TextField(blank=True, verbose_name="Содержание задачи")
    deadline = models.DateField(null=True, blank=True, verbose_name="Срок исполнения")
    priority: str = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default="medium",
        verbose_name="Приоритет",
    )
    done: bool = models.BooleanField(
        default=False, verbose_name="Отметка об исполнении"
    )

    author: User = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="tasks_author",
        verbose_name="Автор",
    )
    assignee: User = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
        verbose_name="Исполнитель",
    )

    tags = models.ManyToManyField(
        "Tag", blank=True, related_name="tasks", verbose_name="Теги"
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")
    deleted = models.BooleanField(default=False, verbose_name="Удалена")
    deleted_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="deleted_tasks",
        verbose_name="Удалена пользователем",
    )

    class Meta:
        verbose_name = "Задача"
        verbose_name_plural = "Задачи"

    def __str__(self) -> str:
        return self.title

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "desc": self.desc,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "priority": self.priority,
            "done": self.done,
            "author": self.author.username,
            "assignee": self.assignee.username if self.assignee else None,
            "tags": [{"id": tag.id, "name": tag.name} for tag in self.tags.all()],
            "created_at": self.created_at.isoformat(),
            "deleted": self.deleted,
            "deleted_by": self.deleted_by.username if self.deleted_by else None,
        }


class Tag(models.Model):
    """
    Тег для группировки и фильтрации задач.

    Атрибуты:
        name (str): Название тега, уникальное.
    """

    name: str = models.CharField(
        max_length=50, unique=True, verbose_name="Название тега"
    )

    class Meta:
        verbose_name = "Тег"
        verbose_name_plural = "Теги"

    def __str__(self) -> str:
        return self.name

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
        }

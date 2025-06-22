from django.contrib import admin

# Register your models here.
# admin.py
from django.contrib import admin
from .models import StickyNote, Tag, Task
from .forms import StickyNoteForm


@admin.register(StickyNote)
class StickyNoteAdmin(admin.ModelAdmin):
    """
    Конфигурация отображения модели StickyNote в административной панели Django.
    """

    # Кастомная форма, если требуется валидация или настройка интерфейса.
    form = StickyNoteForm

    # Отображаемые колонки в списке объектов.
    list_display = (
        'id',  # ID записи
        'owner',  # Владелец стикера (пользователь)
        'short_text',  # Сокращённый текст стикера
        'color',  # Цвет стикера
        'author_name',  # Имя автора (возможно, свободный ввод)
        'created_at',  # Дата создания
        'updated_at'  # Дата последнего изменения
    )

    # Фильтры в списке объектов.
    list_filter = (
        'color',  # По цвету
        'created_at',  # По дате создания
        'author_name',  # По имени автора
    )

    # Поля для поиска.
    search_fields = (
        'text',  # По полному тексту
        'author_name',  # По имени автора
        'owner__username',  # По имени пользователя владельца
    )

    # Только для чтения (не редактируются).
    readonly_fields = (
        'created_at',
        'updated_at',
    )

    # Группировка полей на форме редактирования объекта.
    fieldsets = (
        (None, {
            'fields': ('owner', 'text', 'color', 'author_name')
        }),
        ('Позиционирование', {
            'fields': ('width', 'height', 'order')
        }),
        ('Системные поля', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    def short_text(self, obj: StickyNote) -> str:
        """
        Возвращает сокращённую версию текста стикера (до 30 символов).

        :param obj: Объект StickyNote
        :return: Строка с усечённым текстом и троеточием, если длина > 30
        """
        return (obj.text[:30] + '...') if len(obj.text) > 30 else obj.text

    short_text.short_description = 'Текст'


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    """
    Админ-интерфейс для модели Tag.
    """

    # Отображаемое поле в списке тегов.
    list_display = ("name",)

    # Поля, по которым будет осуществляться поиск.
    search_fields = ("name",)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """
    Админ-интерфейс для модели Task.
    """

    # Отображаемые поля в списке задач.
    list_display = (
        "title",  # Название задачи
        "assignee",  # Назначенный исполнитель
        "priority",  # Приоритет
        "deadline",  # Срок выполнения
        "done",  # Завершена ли задача
        "display_tags",  # Отображение тегов
        "author",  # Автор задачи
    )

    # Фильтры для боковой панели.
    list_filter = (
        "priority",  # Фильтрация по приоритету
        "done",  # По статусу выполнения
        "tags",  # По тегам
        "assignee",  # По назначенному исполнителю
    )

    # Поиск по полям.
    search_fields = (
        "title",  # По названию задачи
        "desc",  # По описанию задачи
    )

    # Включение автозаполнения для связанных моделей.
    autocomplete_fields = ("tags", "assignee")

    # Отображение множественного выбора с тегами в виде двойного списка.
    filter_horizontal = ("tags",)

    # Добавляет иерархию по дате — навигацию по годам/месяцам.
    date_hierarchy = "deadline"

    # Сортировка по дате дедлайна (по убыванию).
    ordering = ("-deadline",)

    def display_tags(self, obj: Task) -> str:
        """
        Отображает список тегов задачи в виде строки, разделённой запятыми.

        :param obj: Объект задачи (Task)
        :return: Строка с названиями тегов
        """
        return ", ".join(tag.name for tag in obj.tags.all())

    display_tags.short_description = "Теги"

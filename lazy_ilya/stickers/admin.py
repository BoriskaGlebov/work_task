from django.contrib import admin

# Register your models here.
# admin.py
from django.contrib import admin
from django.db.models import Prefetch
from django.utils.html import format_html

from .models import StickyNote, Tag, Task, StickyNoteVisibility
from .forms import StickyNoteForm


@admin.register(StickyNote)
class StickyNoteAdmin(admin.ModelAdmin):
    """
    Конфигурация отображения модели StickyNote в административной панели Django.
    """

    form = StickyNoteForm

    list_display = (
        "id",
        "owner",
        "short_text",
        "color",
        "author_name",
        "created_at",
        "updated_at",
        "visible_to_admin",  # Добавлено: видимость для текущего пользователя
    )

    list_filter = (
        "color",
        "created_at",
        "author_name",
        "visibilities__is_visible",  # Добавлено: фильтр по видимости
    )

    search_fields = (
        "text",
        "author_name",
        "owner__username",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    fieldsets = (
        (None, {"fields": ("owner", "text", "color", "author_name")}),
        ("Позиционирование", {"fields": ("width", "height", "order")}),
        ("Системные поля", {"fields": ("created_at", "updated_at")}),
    )

    def short_text(self, obj: StickyNote) -> str:
        """
        Возвращает сокращённую версию текста стикера (до 30 символов).
        """
        return (obj.text[:30] + "...") if len(obj.text) > 30 else obj.text

    short_text.short_description = "Текст"

    def visible_to_admin(self, obj: StickyNote) -> str:
        """
        Показывает, видит ли стикер текущий администратор.

        Если пользователь не авторизован в админке или нет записи видимости — показывает "Неизвестно".
        """
        user = getattr(self.request, 'user', None)
        if not user or user.is_anonymous:
            return "Неизвестно"
        visibility = obj.visibilities.filter(user=user).first()
        if visibility is None:
            return "Неизвестно"
        return "Да" if visibility.is_visible else "Нет"

    visible_to_admin.short_description = "Видимость для вас"
    visible_to_admin.admin_order_field = "visibilities__is_visible"

    def get_queryset(self, request):
        """
        Расширяем queryset, чтобы предзагружать связанные записи видимости для текущего пользователя.
        """
        qs = super().get_queryset(request)
        self.request = request  # Сохраняем request для использования в visible_to_admin
        return qs.prefetch_related(
            Prefetch(
                "visibilities",
                queryset=StickyNoteVisibility.objects.filter(user=request.user)
            )
        )



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
        "is_deleted",  # Добавляем поле для отображения удаления
    )

    # Фильтры для боковой панели.
    list_filter = (
        "priority",  # Фильтрация по приоритету
        "done",  # По статусу выполнения
        "tags",  # По тегам
        "assignee",  # По назначенному исполнителю
        "deleted",  # Добавим фильтр по удалению тоже
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

    def is_deleted(self, obj: Task) -> str:
        # Выводим цветной статус: красный - удалено, зеленый - нет
        if obj.deleted:
            return format_html(
                '<span style="color: red; font-weight: bold;">Удалено</span>'
            )
        return format_html('<span style="color: green;">Активна</span>')

    is_deleted.short_description = "Статус удаления"
    is_deleted.admin_order_field = "deleted"  # Позволяет сортировать по этому полю

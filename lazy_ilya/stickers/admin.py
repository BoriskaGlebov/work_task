# Register your models here.
# admin.py
from django.contrib import admin
from django.db.models import Case, Count, IntegerField, Prefetch, Value, When
from django.utils.html import format_html

from .forms import StickyNoteForm
from .models import StickyNote, StickyNoteVisibility, Tag, Task


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
        "deleted_for_users_display",
    )

    def deleted_for_users_display(self, obj: StickyNote) -> str:
        """
        Показывает пользователей, для которых заметка скрыта (удалена).
        """
        deleted_visibilities = obj.visibilities.filter(is_visible=False).select_related(
            "user"
        )

        if not deleted_visibilities.exists():
            return "Удалений нет"

        users = [v.user.username for v in deleted_visibilities]

        # Для красоты выводим через <br>
        return ",<br>".join(users)

    deleted_for_users_display.short_description = "Удалено у пользователей"
    deleted_for_users_display.allow_tags = True  # для Django < 2.0

    # Для современных версий Django (3.0+) достаточно:
    deleted_for_users_display.admin_order_field = "visibilities__is_visible"
    deleted_for_users_display.allow_tags = True  # устарело, но не мешает
    fieldsets = (
        (None, {"fields": ("owner", "text", "color", "author_name")}),
        ("Позиционирование", {"fields": ("width", "height", "order")}),
        (
            "Информация о видимости",
            {"fields": ("deleted_for_users_display",)},
        ),  # новое поле
        ("Системные поля", {"fields": ("created_at", "updated_at")}),
    )

    def short_text(self, obj: StickyNote) -> str:
        """
        Возвращает сокращённую версию текста стикера (до 30 символов).
        """
        return (obj.text[:30] + "...") if len(obj.text) > 30 else obj.text

    short_text.short_description = "Текст"

    def visible_to_admin(self, obj: StickyNote) -> str:
        user = getattr(self.request, "user", None)
        if not user or user.is_anonymous:
            return "Неизвестно"

        visibility = getattr(obj, "visibilities_for_admin", [])
        if not visibility:
            return "Неизвестно"

        return "Да" if visibility[0].is_visible else "Нет"

    visible_to_admin.short_description = "Видимость для вас"
    visible_to_admin.admin_order_field = "visibilities__is_visible"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        self.request = request  # сохраняем для visible_to_admin

        return qs.prefetch_related(
            Prefetch(
                "visibilities",
                queryset=StickyNoteVisibility.objects.all(),  # <-- ВСЕ ВИДИМОСТИ для deleted_for_users_display
            ),
            Prefetch(
                "visibilities",
                queryset=StickyNoteVisibility.objects.filter(
                    user=request.user
                ),  # <-- для visible_to_admin
                to_attr="visibilities_for_admin",
            ),
        )


class TaskInline(admin.TabularInline):
    model = Task.tags.through  # Через промежуточную таблицу
    extra = 0
    verbose_name = "Задача"
    verbose_name_plural = "Связанные задачи"
    readonly_fields = ("task_title", "assignee", "priority", "done")

    def task_title(self, obj):
        return obj.task.title

    task_title.short_description = "Заголовок"

    def assignee(self, obj):
        return obj.task.assignee

    assignee.short_description = "Исполнитель"

    def priority(self, obj):
        return obj.task.get_priority_display()

    priority.short_description = "Приоритет"

    def done(self, obj):
        return "✅" if obj.task.done else "❌"

    done.short_description = "Выполнено"

    def has_add_permission(self, request, obj):
        return False  # запрет на добавление через Inline

    def has_change_permission(self, request, obj):
        return False  # запрет на изменение

    def has_delete_permission(self, request, obj):
        return False  # запрет на удаление


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    """
    Админ-интерфейс для модели Tag.
    """

    # Отображаемое поле в списке тегов.
    list_display = ("name", "task_count")

    # Поля, по которым будет осуществляться поиск.
    search_fields = ("name",)
    inlines = (TaskInline,)

    def get_queryset(self, request):
        # аннотируем количество связанных задач
        qs = super().get_queryset(request)
        return qs.annotate(_task_count=Count("tasks"))

    @admin.display(description="Количество задач")
    def task_count(self, obj):
        return obj._task_count


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
    ordering = []

    def get_queryset(self, request):
        qs = super().get_queryset(request)

        # Annotate псевдополе: приоритет high=3, medium=2, low=1
        qs = qs.annotate(
            priority_order=Case(
                When(priority="high", then=Value(3)),
                When(priority="medium", then=Value(2)),
                When(priority="low", then=Value(1)),
                default=Value(0),
                output_field=IntegerField(),
            )
        )

        # Сортировка:
        # - сначала невыполненные (done=False)
        # - потом не удалённые (deleted=False)
        # - по приоритету: high > medium > low
        # - по дедлайну (ближе — выше)
        return qs.order_by("done", "deleted", "-priority_order", "deadline")

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


@admin.register(StickyNoteVisibility)
class StickyNoteVisibilityAdmin(admin.ModelAdmin):
    list_display = (
        "sticky_note",
        "user",
        "is_visible",
    )

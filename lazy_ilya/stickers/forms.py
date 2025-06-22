# forms.py
from typing import Type

from django import forms
from .models import StickyNote, Tag, Task


class StickyNoteForm(forms.ModelForm):
    """
    Форма для создания и редактирования заметок (StickyNote).

    Используется в админке или пользовательских интерфейсах для валидации и
    визуального отображения полей модели StickyNote.

    Включённые поля:
    - text: основной текст заметки.
    - color: цвет стикера (например, жёлтый, синий и т. д.).
    - width: ширина заметки (целое число).
    - height: высота заметки (целое число).
    - author_name: отображаемое имя автора заметки.
    - order: порядок сортировки или позиционирования на доске.

    Исключённое поле:
    - owner: устанавливается автоматически в коде (например, текущим пользователем),
      и не отображается в форме.
    """

    class Meta:
        model: Type[StickyNote] = StickyNote
        fields: list[str] = ['text', 'color', 'width', 'height', 'author_name', 'order']
        # exclude = ['owner']  # Можно использовать вместо `fields`, если необходимо исключить поле


class TagForm(forms.ModelForm):
    """
    Форма для создания и редактирования тега.

    Поля:
    - name (CharField): Название тега. Должно быть уникальным без учёта регистра.
    """

    class Meta:
        model: Type[Tag] = Tag
        fields: list[str] = ["name"]

    def clean_name(self) -> str:
        """
        Гарантирует уникальность имени тега без учёта регистра.
        Удаляет пробелы по краям и проверяет наличие дубликатов в базе.

        :return: Очищенное и проверенное имя тега.
        :raises ValidationError: Если тег с таким именем уже существует.
        """
        name: str = self.cleaned_data["name"].strip()
        if Tag.objects.filter(name__iexact=name).exists():
            raise forms.ValidationError("Тег с таким именем уже существует.")
        return name


class TaskForm(forms.ModelForm):
    """
    Форма для создания и редактирования задачи.

    Поля формы:
    - title: заголовок задачи (обязателен).
    - desc: описание задачи (необязательно).
    - deadline: срок выполнения задачи с виджетом выбора даты.
    - priority: приоритет задачи.
    - assignee: назначенный пользователь.
    - tags: список тегов с поддержкой выбора нескольких значений.
    - done: флаг выполнения задачи.
    """

    tags: forms.ModelMultipleChoiceField = forms.ModelMultipleChoiceField(
        queryset=Tag.objects.all(),
        required=False,
        widget=forms.SelectMultiple(
            attrs={
                "class": "choices-multiple w-full rounded border p-2",
            }
        ),
        label="Теги",
    )

    deadline: forms.DateField = forms.DateField(
        required=False,
        widget=forms.DateInput(
            attrs={"type": "date", "class": "w-full rounded border p-2"},
        ),
        label="Срок исполнения",
    )

    done: forms.BooleanField = forms.BooleanField(
        required=False,
        label="Выполнено",
        widget=forms.CheckboxInput(attrs={"class": "mr-2"}),
    )

    class Meta:
        model: Type[Task] = Task
        fields: list[str] = [
            "title",
            "desc",
            "deadline",
            "priority",
            "assignee",
            "tags",
            "done",
        ]

    def clean_title(self) -> str:
        """
        Удаляет пробелы по краям из заголовка задачи.

        :return: Очищенный заголовок.
        """
        return self.cleaned_data["title"].strip()

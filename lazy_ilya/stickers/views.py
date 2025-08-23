import json
from datetime import datetime
from typing import Optional, Union

from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import (Case, Exists, IntegerField, OuterRef, Q, Value,
                              When)
from django.http import (HttpRequest, HttpResponse, HttpResponseBadRequest,
                         JsonResponse)
from django.shortcuts import render
from django.urls import reverse_lazy
from django.views import View
from myauth.models import CustomUser

from lazy_ilya.utils.settings_for_app import logger

from .forms import StickyNoteForm
from .models import StickyNote, StickyNoteVisibility, Tag, Task


class StickyNoteView(LoginRequiredMixin, View):
    """
    Представление для работы с заметками (StickyNote).
    Поддерживает отображение, создание, обновление и удаление заметок.
    Доступ разрешён только аутентифицированным пользователям.
    """

    login_url = reverse_lazy("myauth:login")

    def get(self, request: HttpRequest) -> HttpResponse:
        """
        Отображает HTML-страницу со списком заметок и пользователей.
        """
        visibility_qs = StickyNoteVisibility.objects.filter(
            sticky_note=OuterRef("pk"),
            user=request.user,
        )
        notes = (
            StickyNote.objects.annotate(
                visibility_record=Exists(visibility_qs.filter(is_visible=False))
            )
            .filter(
                Q(owner=request.user)
                | Q(
                    author_name__in=[
                        "Всем!",
                        f"{request.user.first_name} {request.user.last_name}",
                        request.user.first_name,
                        request.user.username,
                    ]
                )
            )
            .exclude(Q(author_name="Всем!") & Q(visibility_record=True))
        )
        users = list(
            CustomUser.objects.filter(is_active=True).values(
                "username", "first_name", "last_name"
            )
        )

        notes_data = [note.to_dict() for note in notes]

        # Условие для фильтрации задач по полю deleted
        if request.user.is_superuser or request.user.is_staff:
            # Админ видит все задачи, включая удалённые
            tasks_queryset = Task.objects.all()
        else:
            # Обычный пользователь видит только не удалённые задачи
            tasks_queryset = Task.objects.filter(deleted=False)
        user = request.user
        if user.is_superuser or user.groups.filter(name="managers"):
            tasks = (
                tasks_queryset.annotate(
                    priority_order=Case(
                        When(priority="high", then=Value(0)),
                        When(priority="medium", then=Value(1)),
                        When(priority="low", then=Value(2)),
                        default=Value(3),
                        output_field=IntegerField(),
                    ),
                    done_order=Case(
                        When(done=True, then=Value(1)),
                        default=Value(0),
                        output_field=IntegerField(),
                    ),
                    deleted_order=Case(
                        When(deleted=True, then=Value(1)),
                        default=Value(0),
                        output_field=IntegerField(),
                    ),
                )
                .select_related("assignee")
                .prefetch_related("tags")
                .order_by("deleted_order", "done_order", "priority_order", "deadline")
            )
        else:
            tasks = (
                tasks_queryset.filter(
                    (Q(assignee__isnull=True) | Q(assignee=user)) | Q(author=user)
                )
                .annotate(
                    priority_order=Case(
                        When(priority="high", then=Value(0)),
                        When(priority="medium", then=Value(1)),
                        When(priority="low", then=Value(2)),
                        default=Value(3),
                        output_field=IntegerField(),
                    ),
                    done_order=Case(
                        When(done=True, then=Value(1)),
                        default=Value(0),
                        output_field=IntegerField(),
                    ),
                    deleted_order=Case(
                        When(deleted=True, then=Value(1)),
                        default=Value(0),
                        output_field=IntegerField(),
                    ),
                )
                .select_related("assignee")
                .prefetch_related("tags")
                .order_by("deleted_order", "done_order", "priority_order", "deadline")
            )

        tasks_list = [task.to_dict() for task in tasks]

        tags = Tag.objects.all()
        tags_list = [tag.to_dict() for tag in tags]

        return render(
            request,
            "stickers/stickers.html",
            {
                "notes_data": json.dumps(notes_data, ensure_ascii=False),
                "username_list": json.dumps(users, ensure_ascii=False),
                "tasks_list": json.dumps(tasks_list, ensure_ascii=False),
                "tags_list": json.dumps(tags_list, ensure_ascii=False),
                "user_id": request.user.id,
            },
        )

    def post(self, request: HttpRequest) -> JsonResponse:
        """
        Создаёт новую заметку.
        """
        data = self._parse_json(request)
        if isinstance(data, JsonResponse):
            logger.bind(user=request.user.username).error("Невалидный JSON")
            return data

        form = StickyNoteForm(data)
        if form.is_valid():
            note = form.save(commit=False)
            note.owner = request.user
            note.save()
            logger.bind(user=request.user.username).info(f"Создана заметка #{note.id}")
            return JsonResponse({"success": True, "data": note.to_dict()}, status=201)

        logger.bind(user=request.user.username).error(f"Ошибки формы: {form.errors}")
        return self._form_error_response(form)

    def patch(self, request: HttpRequest) -> JsonResponse:
        """
        Обновляет существующую заметку по ID.
        """
        data = self._parse_json(request)
        if isinstance(data, JsonResponse):
            logger.bind(user=request.user.username).error("Невалидный JSON")
            return data

        note_id = data.get("id")
        if not note_id:
            logger.bind(user=request.user.username).error("Не передан ID заметки")
            return JsonResponse(
                {"success": False, "errors": {"id": ["ID заметки обязателен"]}},
                status=400,
            )

        try:
            note = StickyNote.objects.get(id=note_id)
        except StickyNote.DoesNotExist:
            logger.bind(user=request.user.username).error(
                f"Заметка #{note_id} не найдена"
            )
            return JsonResponse(
                {"success": False, "errors": {"id": ["Заметка не найдена"]}}, status=404
            )

        form = StickyNoteForm(data, instance=note)
        if form.is_valid():
            updated_note = form.save()
            logger.bind(user=request.user.username).info(
                f"Обновлена заметка #{updated_note.id}"
            )
            return JsonResponse({"success": True, "data": updated_note.to_dict()})

        logger.bind(user=request.user.username).error(f"Ошибки формы: {form.errors}")
        return self._form_error_response(form)

    def delete(self, request: HttpRequest, note_id: int) -> JsonResponse:
        """
        Удаляет заметку по её ID.
        """
        try:
            note = StickyNote.objects.get(id=note_id)
            user = request.user
            # Проверяем условия
            is_owner = note.owner == user
            is_assigned_to_user = note.author_name in [
                f"{user.first_name} {user.last_name}",
                user.first_name,
                user.username,
            ]
            is_assigned_to_all = note.author_name == "Всем!"

            if is_owner or is_assigned_to_user:
                # Пользователь владелец или назначен — удаляем заметку полностью
                note.delete()
                logger.bind(user=user.username).info(f"Удалена заметка #{note_id}")
                return JsonResponse(
                    {"success": True, "data": {"message": f"Заметка {note_id} удалена"}}
                )
            elif is_assigned_to_all and not is_owner:
                # Заметка назначена "Всем!", но пользователь не владелец — скрываем
                # Обновляем или создаём запись видимости с is_visible=False
                pass

                visibility_obj, created = StickyNoteVisibility.objects.update_or_create(
                    sticky_note=note,
                    user=user,
                    defaults={"is_visible": False},
                )
                logger.bind(user=user.username).info(
                    f"Заметка #{note_id} скрыта для пользователя {user.username}"
                )
                return JsonResponse(
                    {"success": True, "data": {"message": f"Заметка {note_id} скрыта"}}
                )
            else:
                # Если не подходит ни одно условие — запрещаем удалять
                logger.bind(user=user.username).warning(
                    f"Попытка удалить заметку #{note_id} без прав"
                )
                return JsonResponse(
                    {
                        "success": False,
                        "errors": {"permission": ["Нет прав на удаление"]},
                    },
                    status=403,
                )
        except StickyNote.DoesNotExist:
            logger.bind(user=request.user.username).error(
                f"Заметка #{note_id} не найдена"
            )
            return JsonResponse(
                {"success": False, "errors": {"id": ["Заметка не найдена"]}}, status=404
            )

    # Вспомогательные методы

    def _parse_json(self, request: HttpRequest) -> Union[dict, JsonResponse]:
        """
        Распарсивает JSON из тела запроса.
        """
        try:
            return json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse(
                {"success": False, "errors": {"json": ["Невалидный JSON"]}}, status=400
            )

    def _form_error_response(self, form: StickyNoteForm) -> JsonResponse:
        """
        Формирует JSON-ответ с ошибками формы.
        """
        errors = {
            field: [e["message"] for e in error.get_json_data()]
            for field, error in form.errors.items()
        }
        return JsonResponse({"success": False, "errors": errors}, status=400)


class TaskView(LoginRequiredMixin, View):
    """
    Вью для управления задачами: создание (POST), обновление (PATCH), удаление (DELETE).
    Требуется аутентификация пользователя.
    """

    login_url = reverse_lazy("myauth:login")

    def get(self, request: HttpRequest) -> HttpResponse:
        """
        Пока не реализован (заглушка).
        """
        return HttpResponse(status=204)  # No Content

    def post(self, request: HttpRequest) -> JsonResponse | HttpResponseBadRequest:
        """
        Создание новой задачи.

        Ожидается JSON с полями:
        - title (str, обязательное)
        - desc (str, опционально)
        - deadline (str в формате ISO, опционально)
        - priority (str, опционально, по умолчанию "medium")
        - done (bool, опционально)
        - assignee (str - username или first_name пользователя, опционально)
        - tags (список или строка с тегами, опционально)

        Возвращает:
        - 201 с созданной задачей при успехе
        - 400 с ошибками валидации
        - 400 при неверном формате JSON
        """
        try:
            data: dict = json.loads(request.body)
        except json.JSONDecodeError:
            logger.bind(user=request.user.username).error(
                "Невалидный JSON в POST /task от пользователя"
            )
            return HttpResponseBadRequest(
                json.dumps({"errors": {"__all__": ["Неверный формат JSON"]}}),
                content_type="application/json",
            )

        errors = {}

        title: Optional[str] = data.get("title")
        if not title:
            logger.bind(user=request.user.username).error(
                "POST /task: отсутствует обязательное поле title"
            )
            errors["title"] = ["Поле title обязательно"]

        deadline_str: Optional[str] = data.get("deadline")
        deadline: Optional[datetime.date] = None
        if deadline_str:
            try:
                deadline = datetime.fromisoformat(deadline_str).date()
            except ValueError:
                logger.bind(user=request.user.username).error(
                    "POST /task: неверный формат даты deadline"
                )
                errors["deadline"] = ["Неверный формат даты deadline"]

        assignee_identifier: Optional[str] = data.get("assignee")
        assignee: Optional[CustomUser] = None
        if assignee_identifier:
            assignee = CustomUser.objects.filter(username=assignee_identifier).first()
            if not assignee:
                assignee = CustomUser.objects.filter(
                    first_name=assignee_identifier
                ).first()
            if not assignee:
                logger.bind(user=request.user.username).error(
                    f"POST /task: пользователь для назначения задачи не найден: '{assignee_identifier}'"
                )
                errors["assignee"] = [
                    f"Пользователь с username или именем '{assignee_identifier}' не найден"
                ]

        if errors:
            return JsonResponse({"errors": errors}, status=400)

        task = Task.objects.create(
            title=title,
            desc=data.get("desc", ""),
            deadline=deadline,
            priority=data.get("priority", "medium"),
            done=bool(data.get("done", False)),
            assignee=assignee,
            author=request.user,
        )

        tags_names: Union[list[str], str] = data.get("tags", [])
        if isinstance(tags_names, str):
            tags_names = [
                name.strip() for name in tags_names.split(",") if name.strip()
            ]

        for tag_name in tags_names:
            tag, _ = Tag.objects.get_or_create(name=tag_name)
            task.tags.add(tag)

        task.save()
        logger.bind(user=request.user.username).info(
            f"POST /task: задача {task.pk} создана успешно"
        )
        return JsonResponse(task.to_dict(), status=201)

    def patch(
        self, request: HttpRequest, task_id: int
    ) -> HttpResponseBadRequest | JsonResponse:
        """
        Частичное обновление задачи по ID.

        Принимает JSON с любыми из полей:
        title, desc, deadline, priority, done, assignee, tags.

        Возвращает:
        - 200 и обновленную задачу при успехе
        - 400 с ошибками валидации
        - 404, если задача не найдена
        - 400 при неверном формате JSON
        """
        try:
            task = Task.objects.get(pk=task_id)
        except Task.DoesNotExist:
            logger.bind(user=request.user.username).error(
                f"PATCH /task/{task_id}: задача не найдена"
            )
            return JsonResponse(
                {"errors": {"__all__": ["Задача не найдена"]}}, status=404
            )

        try:
            data: dict = json.loads(request.body)
        except json.JSONDecodeError:
            logger.bind(user=request.user.username).error(
                f"PATCH /task/{task_id}: неверный JSON"
            )
            return HttpResponseBadRequest(
                json.dumps({"errors": {"__all__": ["Неверный формат JSON"]}}),
                content_type="application/json",
            )

        errors = {}

        if "title" in data:
            title = data.get("title")
            if not title:
                logger.bind(user=request.user.username).error(
                    f"PATCH /task/{task_id}: пустое поле title"
                )
                errors["title"] = ["Поле title не может быть пустым"]
            else:
                task.title = title

        if "desc" in data:
            task.desc = data["desc"]

        if "deadline" in data:
            deadline_str = data.get("deadline")
            if deadline_str:
                try:
                    task.deadline = datetime.fromisoformat(deadline_str).date()
                except ValueError:
                    logger.bind(user=request.user.username).error(
                        f"PATCH /task/{task_id}: неверный формат даты deadline"
                    )
                    errors["deadline"] = ["Неверный формат даты deadline"]
            else:
                task.deadline = None

        if "priority" in data:
            task.priority = data["priority"]

        if "done" in data:
            task.done = bool(data["done"])

        if "assignee" in data:
            assignee_identifier = data.get("assignee")
            assignee = None
            if assignee_identifier:
                assignee = CustomUser.objects.filter(
                    username=assignee_identifier
                ).first()
                if not assignee:
                    assignee = CustomUser.objects.filter(
                        first_name=assignee_identifier
                    ).first()
                if not assignee:
                    logger.bind(user=request.user.username).error(
                        f"PATCH /task/{task_id}: пользователь для назначения задачи не найден - '{assignee_identifier}'"
                    )
                    errors["assignee"] = [
                        f"Пользователь '{assignee_identifier}' не найден"
                    ]
            task.assignee = assignee

        if "tags" in data:
            tags_names = data["tags"]
            if isinstance(tags_names, str):
                tags_names = [
                    name.strip() for name in tags_names.split(",") if name.strip()
                ]

            tag_objs = []
            for tag_name in tags_names:
                tag, _ = Tag.objects.get_or_create(name=tag_name)
                tag_objs.append(tag)

            task.tags.set(tag_objs)

        if errors:
            return JsonResponse({"errors": errors}, status=400)

        task.save()
        logger.bind(user=request.user.username).info(
            f"PATCH /task/{task_id}: задача обновлена"
        )
        return JsonResponse(task.to_dict(), status=200)

    def delete(self, request: HttpRequest, task_id: int) -> JsonResponse:
        """
        Логическое удаление задачи по ID:
        - ставит deleted=True
        - записывает пользователя, который удалил
        """
        try:
            task = Task.objects.get(pk=task_id)
        except Task.DoesNotExist:
            logger.bind(user=request.user.username).error(
                f"DELETE /task/{task_id}: задача не найдена"
            )
            return JsonResponse(
                {"errors": {"__all__": ["Задача не найдена"]}}, status=404
            )

        task.deleted = True
        task.deleted_by = request.user
        task.save(update_fields=["deleted", "deleted_by", "updated_at"])

        logger.bind(user=request.user.username).info(
            f"DELETE /task/{task_id}: задача логически удалена"
        )
        return JsonResponse({"success": f"Задача {task_id} удалена"}, status=200)

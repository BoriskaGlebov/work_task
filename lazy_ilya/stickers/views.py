import json
from datetime import datetime
from pprint import pprint
from typing import Union

from django.http import JsonResponse, HttpRequest, HttpResponse, HttpResponseBadRequest
from django.shortcuts import render
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.db.models import Q, Case, When, Value, IntegerField

from myauth.models import CustomUser
from .models import StickyNote, Task, Tag
from .forms import StickyNoteForm
from lazy_ilya.utils.settings_for_app import logger


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

        :param request: Объект HTTP-запроса
        :return: HttpResponse с HTML-шаблоном
        """
        notes = StickyNote.objects.filter(
            Q(owner=request.user) |
            Q(author_name="Всем!") |
            Q(author_name=request.user.first_name) |
            Q(author_name=request.user.username)
        )
        users = list(CustomUser.objects.filter(is_active=True).values('username', 'first_name'))
        notes_data = [note.to_dict() for note in notes]
        tasks = Task.objects.annotate(
            priority_order=Case(
                When(priority='high', then=Value(0)),
                When(priority='medium', then=Value(1)),
                When(priority='low', then=Value(2)),
                default=Value(3),
                output_field=IntegerField()
            ),
            done_order=Case(
                When(done=True, then=Value(1)),
                default=Value(0),
                output_field=IntegerField()
            )
        ).select_related("assignee").prefetch_related("tags") \
            .order_by('done_order', 'priority_order', 'deadline')
        tasks_list = [task.to_dict() for task in tasks]
        tags = Tag.objects.all()
        tags_list = [tag.to_dict() for tag in tags]
        return render(request, "stickers/stickers.html", {
            "notes_data": json.dumps(notes_data, ensure_ascii=False),
            "username_list": json.dumps(users, ensure_ascii=False),
            "tasks_list": json.dumps(tasks_list, ensure_ascii=False),
            "tags_list": json.dumps(tags_list, ensure_ascii=False),
        })

    def post(self, request: HttpRequest) -> JsonResponse:
        """
        Создаёт новую заметку.

        :param request: Объект HTTP-запроса
        :return: JsonResponse с данными новой заметки или ошибками формы
        """
        data = self._parse_json(request)
        if isinstance(data, JsonResponse):
            logger.bind(user=request.user.username).error(f"Невалидный JSON от {request.user.username}")
            return data

        form = StickyNoteForm(data)
        if form.is_valid():
            note = form.save(commit=False)
            note.owner = request.user
            note.save()
            logger.bind(user=request.user.username).info(
                f"Пользователь {request.user.username} создал заметку #{note.id}")
            return JsonResponse({'success': True, 'data': note.to_dict()}, status=201)

        logger.bind(user=request.user.username).error(f"Ошибки формы от {request.user.username}: {form.errors}")
        return self._form_error_response(form)

    def patch(self, request: HttpRequest) -> JsonResponse:
        """
        Обновляет существующую заметку по ID.

        :param request: Объект HTTP-запроса
        :return: JsonResponse с обновлённой заметкой или ошибками
        """
        data = self._parse_json(request)
        if isinstance(data, JsonResponse):
            logger.bind(user=request.user.username).error(f"Невалидный JSON от {request.user.username}")
            return data

        note_id = data.get("id")
        if not note_id:
            logger.bind(user=request.user.username).error(f"Не передан ID от {request.user.username}")
            return JsonResponse({'success': False, 'errors': {'id': ['ID заметки обязателен']}}, status=400)

        try:
            note = StickyNote.objects.get(id=note_id)
        except StickyNote.DoesNotExist:
            logger.bind(user=request.user.username).error(
                f"Заметка #{note_id} не найдена (пользователь: {request.user.username})")
            return JsonResponse({'success': False, 'errors': {'id': ['Заметка не найдена']}}, status=404)

        form = StickyNoteForm(data, instance=note)
        if form.is_valid():
            updated_note = form.save()
            logger.bind(user=request.user.username).info(
                f"Пользователь {request.user.username} обновил заметку #{updated_note.id}")
            return JsonResponse({'success': True, 'data': updated_note.to_dict()})

        logger.bind(user=request.user.username).error(f"Ошибки формы от {request.user.username}: {form.errors}")
        return self._form_error_response(form)

    def delete(self, request: HttpRequest, note_id: int) -> JsonResponse:
        """
        Удаляет заметку по её ID.

        :param request: Объект HTTP-запроса
        :param note_id: Идентификатор заметки
        :return: JsonResponse с результатом операции
        """
        try:
            note = StickyNote.objects.get(id=note_id)
            note.delete()
            logger.bind(user=request.user.username).info(
                f"Пользователь {request.user.username} удалил заметку #{note_id}")
            return JsonResponse({'success': True, 'data': {'message': f'Заметка {note_id} удалена'}})
        except StickyNote.DoesNotExist:
            logger.bind(user=request.user.username).error(
                f"Заметка #{note_id} не найдена (пользователь: {request.user.username})")
            return JsonResponse({'success': False, 'errors': {'id': ['Заметка не найдена']}}, status=404)

    # Вспомогательные методы

    def _parse_json(self, request: HttpRequest) -> Union[dict, JsonResponse]:
        """
        Распарсивает JSON из тела запроса.

        :param request: Объект HTTP-запроса
        :return: Словарь с данными или JsonResponse с ошибкой
        """
        try:
            return json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'errors': {'json': ['Невалидный JSON']}}, status=400)

    def _form_error_response(self, form: StickyNoteForm) -> JsonResponse:
        """
        Формирует JSON-ответ с ошибками формы.

        :param form: Форма Django с ошибками
        :return: JsonResponse с ошибками по полям
        """
        errors = {
            field: [e['message'] for e in error.get_json_data()]
            for field, error in form.errors.items()
        }
        return JsonResponse({'success': False, 'errors': errors}, status=400)


class TaskView(LoginRequiredMixin, View):
    login_url = reverse_lazy("myauth:login")

    def get(self, request: HttpRequest):
        pass

    def post(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            logger.bind(user=request.user.username).error(f"Невалидный JSON от {request.user.username}")
            return HttpResponseBadRequest(json.dumps({
                "errors": {"__all__": ["Неверный формат JSON"]}
            }), content_type="application/json")

        errors = {}

        title = data.get("title")
        if not title:
            logger.bind(user=request.user.username).error(f"Поле title обязательно")
            errors["title"] = ["Поле title обязательно"]

        deadline_str = data.get("deadline")
        deadline = None
        if deadline_str:
            try:
                deadline = datetime.fromisoformat(deadline_str).date()
            except ValueError:
                logger.bind(user=request.user.username).error(f"Неверно указан deadline")
                errors["deadline"] = ["Неверный формат даты deadline"]

        assignee_identifier = data.get("assignee")
        assignee = None
        if assignee_identifier:
            assignee = CustomUser.objects.filter(username=assignee_identifier).first()
            if not assignee:
                assignee = CustomUser.objects.filter(first_name=assignee_identifier).first()
            if not assignee:
                logger.bind(user=request.user.username).error(
                    f"Тот кому назначена задача не найдет - '{assignee_identifier}'")
                errors["assignee"] = [f"Пользователь с username или именем '{assignee_identifier}' не найден"]

        if errors:
            return JsonResponse({"errors": errors}, status=400)

        task = Task.objects.create(
            title=title,
            desc=data.get("desc", ""),
            deadline=deadline,
            priority=data.get("priority", "medium"),
            done=bool(data.get("done", False)),
            assignee=assignee,
        )

        tags_names = data.get("tags", [])
        if isinstance(tags_names, str):
            tags_names = [name.strip() for name in tags_names.split(",") if name.strip()]

        for tag_name in tags_names:
            tag, _ = Tag.objects.get_or_create(name=tag_name)
            task.tags.add(tag)

        task.save()
        logger.bind(user=request.user.username).info("Создал задачу успешно")
        return JsonResponse(task.to_dict(), status=201)

    def patch(self, request, task_id):
        try:
            task = Task.objects.get(pk=task_id)
        except Task.DoesNotExist:
            logger.bind(user=request.user.username).error(f"Такой задачи не найдено")
            return JsonResponse({"errors": {"__all__": ["Задача не найдена"]}}, status=404)

        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            logger.bind(user=request.user.username).error(f"Невалидный JSON от {request.user.username}")
            return HttpResponseBadRequest(json.dumps({
                "errors": {"__all__": ["Неверный формат JSON"]}
            }), content_type="application/json")

        errors = {}

        if "title" in data:
            title = data.get("title")
            if title is None or title == "":
                logger.bind(user=request.user.username).error(f"Поле title обязательно")
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
                    logger.bind(user=request.user.username).error(f"Неверно указан deadline")
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
                assignee = CustomUser.objects.filter(username=assignee_identifier).first()
                if not assignee:
                    assignee = CustomUser.objects.filter(first_name=assignee_identifier).first()
                if not assignee:
                    logger.bind(user=request.user.username).error(
                        f"Тот кома назначена задача не найдет - '{assignee_identifier}'")
                    errors["assignee"] = [f"Пользователь '{assignee_identifier}' не найден"]
            task.assignee = assignee

        if "tags" in data:
            tags_names = data["tags"]
            if isinstance(tags_names, str):
                tags_names = [name.strip() for name in tags_names.split(",") if name.strip()]

            tag_objs = []
            for tag_name in tags_names:
                tag, _ = Tag.objects.get_or_create(name=tag_name)
                tag_objs.append(tag)

            task.tags.set(tag_objs)

        if errors:
            return JsonResponse({"errors": errors}, status=400)

        task.save()
        logger.bind(user=request.user.username).info(f"Обновлена задача {task.pk}")
        return JsonResponse(task.to_dict(), status=200)

    def delete(self, request, task_id):
        try:
            task = Task.objects.get(pk=task_id)
        except Task.DoesNotExist:
            logger.bind(user=request.user.username).error(f"Такой задачи не найдено - {task_id}")
            return JsonResponse({"errors": {"__all__": ["Задача не найдена"]}}, status=404)

        task.delete()
        # Обычно при успешном удалении 204 No Content возвращает пустой ответ,
        # но можно вернуть сообщение, если нужно.
        logger.bind(user=request.user.username).info(f"Запись удалена")
        return JsonResponse({"success": f"Задача {task_id} удалена"}, status=200)

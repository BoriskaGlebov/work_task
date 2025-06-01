import json
import logging
from django.http import JsonResponse, HttpRequest
from django.shortcuts import render
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.db.models import Q
from .models import StickyNote
from .forms import StickyNoteForm
from lazy_ilya.utils.settings_for_app import logger


class StickyNoteView(LoginRequiredMixin, View):
    login_url = reverse_lazy("myauth:login")

    def get(self, request: HttpRequest):
        notes = StickyNote.objects.filter(
            Q(user=request.user) | Q(author="Всем!") | Q(author=request.user.first_name)
        )
        notes_data = [note.to_dict() for note in notes]
        return render(request, "stickers/stickers.html", {
            "notes_data": json.dumps(notes_data, ensure_ascii=False)
        })

    def post(self, request: HttpRequest):
        data = self._parse_json(request)
        if isinstance(data, JsonResponse):
            logger.bind(user=request.user.username).error(f"Невалидный JSON от {request.user.username}")
            return data

        form = StickyNoteForm(data)
        if form.is_valid():
            note = form.save(commit=False)
            note.user = request.user
            note.save()
            logger.bind(user=request.user.username).info(f"Пользователь {request.user.username} создал заметку #{note.id}")
            return JsonResponse({
                'success': True,
                'data': self._note_data(note)
            }, status=201)
        logger.bind(user=request.user.username).error(f"Ошибки формы от {request.user.username}: {form.errors}")
        return self._form_error_response(form)

    def patch(self, request: HttpRequest):
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
            logger.bind(user=request.user.username).error(f"Заметка #{note_id} не найдена (пользователь: {request.user.username})")
            return JsonResponse({'success': False, 'errors': {'id': ['Заметка не найдена']}}, status=404)

        form = StickyNoteForm(data, instance=note)
        if form.is_valid():
            updated_note = form.save()
            logger.bind(user=request.user.username).info(f"Пользователь {request.user.username} обновил заметку #{updated_note.id}")
            return JsonResponse({
                'success': True,
                'data': self._note_data(updated_note)
            })
        logger.bind(user=request.user.username).error(f"Ошибки формы от {request.user.username}: {form.errors}")
        return self._form_error_response(form)

    def delete(self, request: HttpRequest, note_id: int):
        try:
            note = StickyNote.objects.get(id=note_id)
            note.delete()
            logger.bind(user=request.user.username).error(f"Пользователь {request.user.username} удалил заметку #{note_id}")
            return JsonResponse({'success': True, 'data': {'message': f'Заметка {note_id} удалена'}})
        except StickyNote.DoesNotExist:
            logger.bind(user=request.user.username).error(f"Заметка #{note_id} не найдена (пользователь: {request.user.username})")
            return JsonResponse({'success': False, 'errors': {'id': ['Заметка не найдена']}}, status=404)

    # Вспомогательные методы

    def _parse_json(self, request: HttpRequest):
        try:
            return json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'errors': {'json': ['Невалидный JSON']}}, status=400)

    def _form_error_response(self, form):
        errors = {field: [e['message'] for e in error.get_json_data()] for field, error in form.errors.items()}
        return JsonResponse({'success': False, 'errors': errors}, status=400)

    def _note_data(self, note):
        return {
            'id': note.id,
            'text': note.text,
            'color': note.color,
            'position_top': note.position_top,
            'position_left': note.position_left,
            'author': note.author,
            'user': note.user,
        }

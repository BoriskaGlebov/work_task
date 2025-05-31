import json
from pprint import pprint

from django.contrib.auth.mixins import LoginRequiredMixin
from django.db import models
from django.http import HttpRequest, JsonResponse, HttpResponseBadRequest
from django.shortcuts import render
from django.urls import reverse_lazy
from django.views import View

from stickers.forms import StickyNoteForm
from stickers.models import StickyNote
from lazy_ilya.utils.settings_for_app import logger


# Create your views here.
def base_view(request: HttpRequest):
    return render(request, template_name="stickers/stickers.html")


class StickyNoteView(LoginRequiredMixin, View):
    login_url = reverse_lazy("myauth:login")

    def get(self, request: HttpRequest):
        # Получаем все стикеры пользователя и "всем"
        sticky_notes = StickyNote.objects.filter(
            models.Q(user=request.user) | models.Q(author='Всем!') | models.Q(author=request.user.first_name)
        )

        notes_data: str = json.dumps([note.to_dict() for note in sticky_notes], ensure_ascii=False)
        return render(request, "stickers/stickers.html", {
            "notes_data": notes_data
        })

    def post(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            logger.bind(user=request.user.username).error('Невалидный JSON')
            return JsonResponse({'error': 'Невалидный JSON'}, status=400)

        form = StickyNoteForm(data)
        if form.is_valid():
            new_note = form.save(commit=False)
            new_note.user = request.user  # ← обязательно, если поле user обязательное
            new_note.save()
            logger.bind(user=request.user.username).info(f"Создана заметка № {new_note.id}")
            return JsonResponse({
                'success': True,
                'note': {
                    'id': new_note.id,
                    'text': new_note.text,
                    'color': new_note.color,
                    'position_top': new_note.position_top,
                    'position_left': new_note.position_left,
                    'author': new_note.author
                }
            }, status=201)
        else:
            logger.bind(user=request.user.username).error(f"Ошибка формы {form.errors}")
            return JsonResponse({'errors': form.errors}, status=400)

    def patch(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'errors': 'Невалидный JSON'})
        except AttributeError as e:
            return JsonResponse({'errors': str(type(e))})
        note_id = data.get('id')
        if not note_id:
            logger.bind(user=request.user.username).error(f"Не указан id заметки ")
            return JsonResponse({'errors': 'Не указан ID заметки'})
        try:
            note = StickyNote.objects.get(id=note_id)
        except StickyNote.DoesNotExist:
            logger.bind(user=request.user.username).error(f"Заметка не найдена с id= {note_id} ")
            return JsonResponse({'errors': 'Заметка не найдена'}, status=404)
        form = StickyNoteForm(data, instance=note)
        if form.is_valid():
            updated_note = form.save()
            logger.bind(user=request.user.username).info(f"Обновлена заметка {updated_note.id} ")
            return JsonResponse({
                'success': True,
                'note': {
                    'id': updated_note.id,
                    'text': updated_note.text,
                    'color': updated_note.color,
                    'position_top': updated_note.position_top,
                    'position_left': updated_note.position_left,
                    'author': updated_note.author if updated_note.author else None
                }
            })
        else:
            errors = {field: error.get_json_data() for field, error in form.errors.items()}
            logger.bind(user=request.user.username).error(f"Ошибки валидации формы {errors}")
            return JsonResponse({'success': False, 'errors': f'Ошибки валидации формы {errors}'}, status=400)

    def delete(self, request: HttpRequest, note_id):
        try:
            note = StickyNote.objects.get(id=int(note_id))
            note.delete()
            logger.bind(user=request.user.username).info(f"Заметка с № {note_id} удалена")
            return JsonResponse({'success': True, 'message': f'Заметка {note_id} Удалена'})
        except StickyNote.DoesNotExist:
            logger.bind(user=request.user.username).error(f"Заметка с № {note_id} не найдена")
            return JsonResponse({'success': False, 'error': f"Заметка с № {note_id} не найдена"}, status=404)

# serializer_class = StickyNoteSerializer
# permission_classes = [permissions.IsAuthenticated]
#
# def get_queryset(self):
#     return StickyNote.objects.filter(user=self.request.user)
#
# def perform_create(self, serializer):
#     serializer.save(user=self.request.user)

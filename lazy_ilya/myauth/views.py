from django.contrib.auth import login
from django.contrib.auth.views import LoginView
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render
from django.urls import reverse_lazy
from django.views.generic import CreateView

from myauth.forms import CustomUserCreationForm
from myauth.models import CustomUser


class LoginAjaxView(LoginView):
    """
    Представление для входа пользователя с поддержкой AJAX.

    Атрибуты:
        template_name (str): Шаблон для отображения формы логина.
        success_url (str): URL перенаправления после успешного входа.
    """

    template_name = 'myauth/login.html'
    success_url = reverse_lazy('file_creator:file-creator-start')

    def form_invalid(self, form) -> HttpResponse:
        """
        Обработка невалидной формы.

        Если запрос сделан через AJAX, возвращает JSON с ошибками.
        Иначе — использует стандартную реализацию.

        Args:
            form: Форма логина.

        Returns:
            HttpResponse | JsonResponse: Ответ с ошибками или обычный ответ.
        """
        if self.request.headers.get('x-requested-with') == 'XMLHttpRequest':
            errors = form.errors.get_json_data()
            return JsonResponse({'success': False, 'errors': errors}, status=400)
        return super().form_invalid(form)

    def form_valid(self, form) -> HttpResponse:
        """
        Обработка валидной формы.

        Если запрос AJAX — возвращает JSON с URL для редиректа.
        Иначе — обычный редирект.

        Args:
            form: Форма логина.

        Returns:
            HttpResponse | JsonResponse
        """
        response = super().form_valid(form)
        if self.request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': True, 'redirect_url': self.get_success_url()})
        return response


class RegisterView(CreateView):
    """
    Представление регистрации пользователя с AJAX-обработкой.

    Атрибуты:
        model (Model): Модель пользователя.
        form_class (Form): Форма регистрации.
        template_name (str): Путь к HTML-шаблону.
        success_url (str): URL перенаправления после успешной регистрации.
    """

    model = CustomUser
    form_class = CustomUserCreationForm
    template_name = 'myauth/registration.html'
    success_url = reverse_lazy('file_creator:file-creator-start')

    def form_valid(self, form) -> JsonResponse:
        """
        Обработка валидной формы регистрации.

        Возвращает JSON с успехом и URL редиректа.

        Args:
            form: Форма регистрации.

        Returns:
            JsonResponse
        """
        self.object = form.save()
        return JsonResponse({'success': True, 'redirect_url': self.get_success_url()})

    def form_invalid(self, form) -> JsonResponse:
        """
        Обработка невалидной формы.

        Возвращает JSON с ошибками для отображения на фронте.

        Args:
            form: Форма регистрации.

        Returns:
            JsonResponse
        """
        errors = {field: error[0] for field, error in form.errors.items()}
        return JsonResponse({'success': False, 'errors': errors}, status=400)

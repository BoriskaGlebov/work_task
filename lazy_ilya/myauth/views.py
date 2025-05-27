from pprint import pprint

from django.contrib.auth import login
from django.contrib.auth.models import Group
from django.contrib.auth.views import LoginView
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render
from django.urls import reverse_lazy
from django.views import View
from django.views.generic import CreateView, TemplateView, FormView

from myauth.forms import CustomUserCreationForm, PasswordResetForm
from myauth.models import CustomUser
from lazy_ilya.utils.settings_for_app import logger


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
        response = super().form_valid(form)
        group = Group.objects.filter(name="ilia-group").first()
        if group:
            self.object.groups.add(group)

        login(self.request, self.object)
        if self.request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': True, 'redirect_url': self.get_success_url()})
        return response

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
        logger.warning(errors)
        if self.request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'errors': errors}, status=400)
        return super().form_invalid(form)


class CustomPasswordResetView(FormView):
    """
    Кастомное представление для сброса пароля пользователя.

    Атрибуты:
        template_name (str): Путь к шаблону HTML.
        form_class (Form): Класс формы, используемой для валидации данных.
        success_url (str): URL, на который будет перенаправлен пользователь после успешного сброса пароля.

    Методы:
        form_valid(form): Обрабатывает успешную валидацию формы. Устанавливает новый пароль и возвращает JSON-ответ при AJAX-запросе.
        form_invalid(form): Обрабатывает неуспешную валидацию формы. Возвращает ошибки в JSON-формате при AJAX-запросе.
    """

    template_name: str = 'myauth/reset_password.html'
    form_class = PasswordResetForm
    success_url = reverse_lazy('myauth:login')

    def form_valid(self, form: PasswordResetForm) -> HttpResponse:
        """
        Вызывается, если форма прошла валидацию. Устанавливает новый пароль для пользователя.

        Args:
            form (PasswordResetForm): Валидная форма.

        Returns:
            HttpResponse: JSON-ответ при AJAX-запросе или стандартный редирект.
        """
        user = form.user
        user.set_password(form.cleaned_data['password1'])
        user.save()

        # login(self.request, user)  # Автоматический вход (если нужен)

        if self.request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': True, 'redirect_url': str(self.get_success_url())})

        return super().form_valid(form)

    def form_invalid(self, form: PasswordResetForm) -> HttpResponse:
        """
        Вызывается, если форма не прошла валидацию. Возвращает ошибки в формате JSON при AJAX-запросе.

        Args:
            form (PasswordResetForm): Невалидная форма.

        Returns:
            HttpResponse: JSON с ошибками или стандартный ответ.
        """
        if self.request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'errors': form.errors}, status=400)

        return super().form_invalid(form)

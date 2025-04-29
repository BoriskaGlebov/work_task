from django.contrib.auth import login
from django.contrib.auth.views import LoginView
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render
from django.urls import reverse_lazy
from django.views.generic import CreateView

from myauth.forms import CustomUserCreationForm
from myauth.models import CustomUser


class LoginAjaxView(LoginView):
    template_name = 'myauth/login.html'  # Ваш шаблон для логина
    success_url = reverse_lazy('file_creator:file-creator-start')  # куда редиректить после успеха

    def form_invalid(self, form):
        if self.request.headers.get('x-requested-with') == 'XMLHttpRequest':
            # Если запрос AJAX и форма неверная (например, неправильный логин/пароль)
            errors = form.errors.get_json_data()
            return JsonResponse({'success': False, 'errors': errors}, status=400)
        else:
            return super().form_invalid(form)

    def form_valid(self, form):
        response = super().form_valid(form)
        if self.request.headers.get('x-requested-with') == 'XMLHttpRequest':
            # Если запрос AJAX и всё хорошо
            return JsonResponse({'success': True, 'redirect_url': self.get_success_url()})
        else:
            return response


class RegisterView(CreateView):
    model = CustomUser
    form_class = CustomUserCreationForm
    template_name = 'myauth/registration.html'  # это твой шаблон
    success_url = reverse_lazy('file_creator:file-creator-start')  # куда перенаправлять после успешной регистрации

    def form_valid(self, form):
        self.object = form.save()
        return JsonResponse(
            {'success': True, 'redirect_url': self.get_success_url()})  # <-- возвращаем JSON вместо редиректа

    def form_invalid(self, form):
        print(form.errors.as_json())
        errors = {field: error[0] for field, error in form.errors.items()}
        print(errors)
        return JsonResponse({'success': False, 'errors': errors}, status=400)

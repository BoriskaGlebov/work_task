from django.contrib.auth import login
from django.contrib.auth.views import LoginView
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render
from django.urls import reverse_lazy


class LoginAjaxView(LoginView):
    template_name = 'myauth/login.html'  # Ваш шаблон для логина
    success_url = reverse_lazy('file_creator:file-creator-start')  # куда редиректить после успеха

    def form_invalid(self, form):
        if self.request.headers.get('x-requested-with') == 'XMLHttpRequest':
            # Если запрос AJAX и форма неверная (например, неправильный логин/пароль)
            errors = form.errors.get_json_data()
            print(errors)
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


def registration_form(request: HttpRequest) -> HttpResponse:
    if request.method == "POST":
        print('ТУТ')
        return None

    else:
        context = {}
        return render(request, "myauth/registration.html", context)

from django.http import HttpRequest, HttpResponse
from django.shortcuts import render


# Create your views here.
def login_template(request: HttpRequest) -> HttpResponse:
    context = {}
    return render(request, "myauth/login.html", context)


def registration_template(request: HttpRequest) -> HttpResponse:
    context = {}
    return render(request, "myauth/registration.html", context)

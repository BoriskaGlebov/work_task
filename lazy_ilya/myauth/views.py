from django.http import HttpRequest, HttpResponse
from django.shortcuts import render


def registration_form(request: HttpRequest) -> HttpResponse:
    if request.method=="POST":
        print('ТУТ')
        return None

    else:
        context = {}
        return render(request, "myauth/registration.html", context)

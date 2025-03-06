from django.http import HttpRequest, HttpResponse
from django.shortcuts import render


# Create your views here.
def base_template(request: HttpRequest) -> HttpResponse:
    context={}
    return render(request, "file_creator/index.html",context )

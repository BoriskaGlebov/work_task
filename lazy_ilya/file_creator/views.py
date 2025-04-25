from django.contrib.auth.decorators import login_required
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render


# Create your views here.
@login_required
def base_template(request: HttpRequest) -> HttpResponse:
    context={}
    return render(request, "file_creator/index.html",context )

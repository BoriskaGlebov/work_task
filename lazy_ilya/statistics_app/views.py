from django.http import HttpRequest
from django.shortcuts import render

# Create your views here.
def base_view(request:HttpRequest):
    return render(request,'statistics_app/statistics_app.html')
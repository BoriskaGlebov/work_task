from django.shortcuts import render

# Create your views here.

def base_view(request):
    return render(request=request,template_name="cities/cities.html")
from django.urls import path

from myauth.views import base_template

app_name = "myauth"
urlpatterns = [
    path("", base_template, name="index"),

]

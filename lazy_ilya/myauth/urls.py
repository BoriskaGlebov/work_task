from channels.auth import login
from django.urls import path

from myauth.views import login_template, registration_template

app_name = "myauth"
urlpatterns = [
    path("", login_template, name="login"),
    path("registration/", registration_template, name="registration"),

]

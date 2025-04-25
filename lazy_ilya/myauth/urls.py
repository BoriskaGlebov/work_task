from channels.auth import login
from django.contrib.auth.views import LoginView, LogoutView
from django.urls import path

from myauth.views import registration_form

app_name = "myauth"
urlpatterns = [
    path("", LoginView.as_view(template_name='myauth/login.html'), name="login"),
    path("registration/", registration_form, name="registration"),
    path(
        "logout/",
        LogoutView.as_view(next_page="myauth:login"),
        name="logout",
    ),

]

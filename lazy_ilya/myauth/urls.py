from channels.auth import login
from django.contrib.auth.views import LogoutView
from django.urls import path

from myauth.views import registration_form, LoginAjaxView

app_name = "myauth"
urlpatterns = [
    path("", LoginAjaxView.as_view(), name="login"),
    path("registration/", registration_form, name="registration"),
    path(
        "logout/",
        LogoutView.as_view(next_page="myauth:login"),
        name="logout",
    ),

]

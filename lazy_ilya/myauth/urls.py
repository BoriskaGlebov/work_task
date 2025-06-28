from channels.auth import login
from django.contrib.auth.views import LogoutView
from django.urls import path

from myauth.views import RegisterView, LoginAjaxView, CustomPasswordResetView

app_name = "myauth"
urlpatterns = [
    path("", LoginAjaxView.as_view(), name="login"),
    path("registration/", RegisterView.as_view(), name="registration"),
    path(
        "logout/",
        LogoutView.as_view(next_page="myauth:login"),
        name="logout",
    ),
    path(
        "reset-password/",
        CustomPasswordResetView.as_view(),
        name="reset-password",
    ),
]

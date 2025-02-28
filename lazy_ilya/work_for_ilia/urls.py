from django.contrib.auth.views import LoginView, LogoutView
from django.urls import path
from work_for_ilia.views import (Cities, Greater, Statistic,
                                 check_record_exists, city_form_view,
                                 download_file, get_next_dock_num, track_city)

app_name = "work_for_ilia"
urlpatterns = [
    path("", Greater.as_view(), name="index"),
    path("update/", Greater.as_view(), name="update"),
    path("cities/", Cities.as_view(), name="cities"),
    path("cities/track", track_city, name="track_cities"),
    path("cities/<int:table_id>/<int:dock_num>/", Cities.as_view(), name="edit_city"),
    path("cities/download/", download_file, name="download_file"),
    path(
        "delete-city/<int:table_id>/<int:dock_num>/",
        Cities.as_view(),
        name="delete_city",
    ),
    path("citi-create-or-update/", city_form_view, name="city_cr_or_upd"),
    path(
        "check-record-exists/", check_record_exists, name="check_record_exists"
    ),  # URL для AJAX запроса
    path("get-next-dock-num/", get_next_dock_num, name="get_next_dock_num"),
    path("statistics/", Statistic.as_view(), name="statistics"),
    path(
        "login/",
        LoginView.as_view(
            template_name="work_for_ilia/login.html", redirect_authenticated_user=True
        ),
        name="login",
    ),
    path(
        "logout",
        LogoutView.as_view(template_name="work_for_ilia/index.html"),
        name="logout",
    ),
]

from django.contrib.auth.views import LoginView, LogoutView
from django.urls import path
from work_for_ilia.views import Cities, Greater, Statistic, CitiesCreateView, get_next_dock_num

app_name = "work_for_ilia"
urlpatterns = [
    path("", Greater.as_view(), name="index"),
    path("update/", Greater.as_view(), name="update"),  # Добавьте этот маршру
    path("cities/", Cities.as_view(), name="cities"),
    path('cities/create', CitiesCreateView.as_view(), name="cities-create"),
    path('get_next_dock_num/', get_next_dock_num, name='get_next_dock_num'),
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

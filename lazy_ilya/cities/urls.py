from django.urls import path

from cities.views import (
    base_view,
    Cities,
    CitiesAdmin,
    CityInfoView,
    increment_city_counters,
)

app_name = "cities"
urlpatterns = [
    path("", Cities.as_view(), name="base_template"),
    path("cities/<int:table_id>/<int:dock_num>/", Cities.as_view(), name="edit_city"),
    path(
        "cities/delete/<int:table_id>/<int:dock_num>/",
        Cities.as_view(),
        name="delete_city",
    ),
    path("admin/", CitiesAdmin.as_view(), name="admin_city"),
    path("admin/city-info/", CityInfoView.as_view(), name="city_info"),
    path("api/city-counter/", increment_city_counters, name="city-counter"),
]

from cities.views import (Cities, CitiesAdmin, CityDownload, CityInfoView,
                          download_file, increment_city_counters)
from django.urls import path

app_name = "cities"
urlpatterns = [
    path("", Cities.as_view(), name="base_template"),
    path("cities/<int:table_id>/", Cities.as_view(), name="edit_city_no_doc_num"),
    path("cities/<int:table_id>/<int:dock_num>/", Cities.as_view(), name="edit_city"),
    path(
        "cities/delete/<int:table_id>/",
        Cities.as_view(),
        name="delete_city_no_doc_num",
    ),
    path(
        "cities/delete/<int:table_id>/<int:dock_num>/",
        Cities.as_view(),
        name="delete_city",
    ),
    path("admin/", CitiesAdmin.as_view(), name="admin_city"),
    path("admin/city-info/", CityInfoView.as_view(), name="city_info"),
    path("api/city-counter/", increment_city_counters, name="city-counter"),
    path("admin/city-download/", CityDownload.as_view(), name="city-download"),
    path("admin/media/<str:filename>/", download_file, name="download_file"),
]

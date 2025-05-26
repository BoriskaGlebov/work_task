from django.urls import path

from statistics_app.views import base_view

app_name = "statistics_app"
urlpatterns = [
    path("", base_view, name="statistics_app"),
    # path("cities/<int:table_id>/<int:dock_num>/", Cities.as_view(), name="edit_city"),
    # path("cities/delete/<int:table_id>/<int:dock_num>/", Cities.as_view(), name="delete_city"),
    # path("admin/", CitiesAdmin.as_view(), name="admin_city"),
    # path("admin/city-info/", CityInfoView.as_view(), name="city_info"),

]

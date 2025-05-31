from django.urls import path

from stickers.views import base_view, StickyNoteView

app_name = "stickers"
urlpatterns = [
    path("", StickyNoteView.as_view(), name="stickers"),
    path("<int:note_id>/",StickyNoteView.as_view(), name="delete_stickers")
    # path("cities/<int:table_id>/<int:dock_num>/", Cities.as_view(), name="edit_city"),
    # path(
    #     "cities/delete/<int:table_id>/<int:dock_num>/",
    #     Cities.as_view(),
    #     name="delete_city",
    # ),
    # path("admin/", CitiesAdmin.as_view(), name="admin_city"),
    # path("admin/city-info/", CityInfoView.as_view(), name="city_info"),
    # path("api/city-counter/", increment_city_counters, name="city-counter"),
]

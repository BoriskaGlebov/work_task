from django.urls import path

from cities.views import base_view, Cities

app_name = "cities"
urlpatterns = [
    path("", Cities.as_view(), name="base_template"),
    path("cities/<int:table_id>/<int:dock_num>/", Cities.as_view(), name="edit_city"),
    path("cities/delete/<int:table_id>/<int:dock_num>/", Cities.as_view(), name="delete_city"),
    # path("registration/", RegisterView.as_view(), name="registration"),
    # path(
    #     "logout/",
    #     LogoutView.as_view(next_page="myauth:login"),
    #     name="logout",
    # ),
    # path(
    #     "reset-password/",
    #     CustomPasswordResetView.as_view(),
    #     name="reset-password",
    # ),

]

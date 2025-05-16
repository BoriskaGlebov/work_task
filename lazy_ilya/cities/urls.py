
from django.urls import path


from cities.views import base_view, Cities

app_name = "cities"
urlpatterns = [
    path("", Cities.as_view(), name="base_template"),
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

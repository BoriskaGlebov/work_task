from django.urls import path

from file_creator.views import UploadView

app_name = "file_creator"
urlpatterns = [
    path("", UploadView.as_view(), name="file-creator-start"),

    # Другие URL-шаблоны...
]

from django.urls import path

from file_creator.views import base_template, UploadView

app_name = "file_creator"
urlpatterns = [
    path("", UploadView.as_view(), name="file-creator-start"),

    # Другие URL-шаблоны...
]

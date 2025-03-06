from django.urls import path

from file_creator.views import base_template

app_name = "file_creator"
urlpatterns = [
    path("", base_template, name="file-creator-start"),

    # Другие URL-шаблоны...
]

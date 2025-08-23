from django.urls import path
from stickers.views import StickyNoteView, TaskView

app_name = "stickers"
urlpatterns = [
    path("", StickyNoteView.as_view(), name="stickers"),
    path("<int:note_id>/", StickyNoteView.as_view(), name="delete_stickers"),
    path("tasks/", TaskView.as_view(), name="tasks"),
    path("tasks/<int:task_id>/", TaskView.as_view(), name="tasks_edit"),
    path("tasks/delete/<int:task_id>/", TaskView.as_view(), name="tasks_delete"),
]

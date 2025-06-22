import '../../css/base.css';
// import 'choices.js/public/assets/styles/choices.min.css';
import {toggleAccentClasses} from "../../cities/js/toggleAccent.js";
import {KanbanStickyNotes} from "./notes.js";
import {KanbanTasks, TaskFilter} from "./task.js";

// import {toggleAccentClasses} from "./toggleAccent.js";
// import {CityAutocomplete} from "./city-search.js";
// import {CityModalHandler} from "./update-cities.js";

document.addEventListener('DOMContentLoaded', () => {
    toggleAccentClasses('a-main', 'a-main-mob');

    const kanban = new KanbanStickyNotes({
        addButtonId: 'add-card',
        boardId: 'note-board',
        colors: ['#FFEB3B', '#FFCDD2', '#C8E6C9', '#BBDEFB'],
    });
    // ВАЖНО: вызываем загрузку начальных заметок после инициализации
    kanban.loadInitialNotes();

    const kanbanTask = new KanbanTasks({addButtonId: 'btn-tasks', boardId: 'task-board', modalId: 'task-modal'});
    const taskFilter = new TaskFilter({tasksContainerId: 'task-board'});
    kanbanTask.setTaskFilterInstance(taskFilter);

});
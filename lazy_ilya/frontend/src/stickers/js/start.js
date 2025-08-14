// Импорт базовых стилей
import '../../css/base.css';

// Импорт утилит и компонентов Kanban-доски
import {toggleAccentClasses} from "../../cities/js/toggleAccent.js";
import {KanbanStickyNotes} from "./notes.js";
import {KanbanTasks, TaskCounter, TaskFilter} from "./task.js";

// Обработчик событий, срабатывающий после полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    /**
     * Переключает акцентные классы у элементов навигации.
     * Используется для выделения текущего пункта меню в зависимости от ширины экрана.
     * @param {string} desktopId - ID элемента для десктопной версии.
     * @param {string} mobileId - ID элемента для мобильной версии.
     */
    toggleAccentClasses('a-main', 'a-main-mob');

    /**
     * Инициализация Kanban-доски с заметками (sticky notes).
     * @type {KanbanStickyNotes}
     */
    const kanban = new KanbanStickyNotes({
        addButtonId: 'add-card',      // ID кнопки для добавления заметки
        boardId: 'note-board',        // ID элемента доски заметок
        colors: ['#FFEB3B', '#FFCDD2', '#C8E6C9', '#BBDEFB'], // Возможные цвета заметок
    });

    // Загрузка заметок с сервера или из локального хранилища
    kanban.loadInitialNotes();

    /**
     * Инициализация Kanban-доски с задачами.
     * @type {KanbanTasks}
     */
    const kanbanTask = new KanbanTasks({
        addButtonId: 'btn-tasks',     // ID кнопки для добавления задачи
        boardId: 'task-board',        // ID доски задач
        modalId: 'task-modal',        // ID модального окна для создания/редактирования задач
    });

    /**
     * Инициализация фильтра задач.
     * Позволяет фильтровать задачи по признакам (дата, автор, статус и т.д.)
     * @type {TaskFilter}
     */
    const taskFilter = new TaskFilter({
        tasksContainerId: 'task-board', // ID контейнера, в котором находятся задачи
    });

    const taskCounter = new TaskCounter('#counter-tasks', '#tasks-popup', kanbanTask.tasks || []);
    // Устанавливаем связь между фильтром и Kanban-доской задач
    kanbanTask.setTaskFilterInstance(taskFilter);
    taskFilter.setKanbanTasksInstance(kanbanTask);
    kanbanTask.setTaskCounterInstance(taskCounter);
});

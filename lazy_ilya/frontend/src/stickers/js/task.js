import Choices from 'choices.js';
import {showError} from "./utils.js";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import {Russian} from "flatpickr/dist/l10n/ru.js";

/**
 * Class representing a Kanban board for task management
 * @class
 */
export class KanbanTasks {
    /**
     * Create a KanbanTasks instance
     * @constructor
     * @param {Object} config - Configuration object
     * @param {string} config.addButtonId - ID of the "Add Task" button
     * @param {string} config.boardId - ID of the task board container
     * @param {string} config.modalId - ID of the task modal
     */
    constructor({addButtonId, boardId, modalId}) {
        this.tasks = {};  // храним задачи в объекте {id: taskData}
        this.addTaskBtn = document.getElementById(addButtonId);
        this.taskBoard = document.getElementById(boardId);
        this.taskModal = document.getElementById(modalId);
        this.taskForm = this.taskModal.querySelector('#task-form');
        this.cancelBtn = this.taskModal.querySelector('#cancel-btn');
        this.closeBtn = this.taskModal.querySelector('#close-modal');
        this.csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        this.currentEditId = null; // id задачи в редактировании, null если новая

        // Открыть модалку при добавлении
        this.addTaskBtn.addEventListener('click', () => this.openModal());

        // Закрыть модалку при клике на отмену или крестик
        this.cancelBtn.addEventListener('click', () => this.closeModal());
        this.closeBtn.addEventListener('click', () => this.closeModal());

        // Отправка формы
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });
        // Инициализация Choices.js
        const select = this.taskForm.querySelector('select[name="tags"]'); // <-- исправлено, берём select из формы
        if (!select) {
            throw new Error('Select с name="tags" не найден в форме');
        }
        // this.taskModal.addEventListener('click', (e) => {
        //     if (!this.taskForm.contains(e.target)) {
        //         this.taskModal.classList.add('hidden');
        //     }
        // });

        this.tagsSelect = new Choices(select, {
            removeItemButton: true,
            duplicateItemsAllowed: false,
            addItems: true,
            addItemFilter: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return false;
                if (trimmed.length > 20) {
                    showError('Тег не должен быть длиннее 20 символов', "server-error2");
                    return false;
                }
                return true;
            },
            addChoices: true,
            searchEnabled: true,
            shouldSort: false,
            placeholderValue: 'Введите или выберите теги...',
            choices: window.tags_list.map(tag => ({
                value: tag.name,
                label: tag.name
            })),
        });

        // Клик по карточке открывает модалку для редактирования
        this.taskBoard.addEventListener('click', (e) => {
            const card = e.target.closest('.task-card');
            if (card) {
                const id = card.dataset.cardId;
                this.openModal(id);
            }
        });
        this.loadTasksFromBackend(tasks_data || []);
        this.deadlinePicker = flatpickr("#deadline-input", {
            locale: Russian,
            dateFormat: "Y-m-d",
            minDate: "2024-01-01",
            maxDate: "2029-12-31",
            allowInput: true,
            onReady: function (selectedDates, dateStr, instance) {
                const btn = document.createElement('button');
                btn.textContent = "Сегодня";
                btn.type = "button";
                btn.classList.add('flatpickr-today-btn');
                btn.style.marginLeft = '10px';
                btn.addEventListener('click', () => {
                    const today = new Date();
                    instance.setDate(today, true);
                    instance.close();
                });

                instance.calendarContainer.appendChild(btn);
            }
        });

    }


    /**
     * Устанавливает экземпляр фильтра задач для дальнейшего использования.
     *
     * @param {Object} taskFilterInstance Экземпляр фильтра задач.
     */
    setTaskFilterInstance(taskFilterInstance) {
        this.taskFilterInstance = taskFilterInstance;
    }

    ensureScrollFilled() {
        let iterations = 0;
        const MAX_ITERATIONS = 10;

        const tryRender = () => {
            const hasScrollbar = document.documentElement.scrollHeight > window.innerHeight;

            if (hasScrollbar || this.loadedCount >= this.allTaskIds.length || iterations >= MAX_ITERATIONS) {
                return;
            }

            const prevCount = this.loadedCount;
            this.renderNextTasks();
            iterations++;

            // Даем браузеру "вдохнуть" перед следующей проверкой
            requestAnimationFrame(tryRender);
        };

        tryRender();
    }


    /**
     * Загружает задачи из массива, полученного с бэкенда, сохраняет их в локальном хранилище
     * и отображает каждую задачу в виде карточки.
     *
     * @param {Array<Object>} tasksArray - Массив объектов задач, полученных с сервера.
     * Каждый объект задачи должен содержать следующие свойства:
     *   @property {string|number} id - Уникальный идентификатор задачи.
     *   @property {string} title - Заголовок задачи.
     *   @property {string} desc - Описание задачи.
     *   @property {string} deadline - Дедлайн задачи (например, в формате ISO).
     *   @property {string} priority - Приоритет задачи.
     *   @property {Array<Object>} tags - Массив тегов, где каждый тег имеет поле `name`.
     *   @property {boolean} done - Статус выполнения задачи.
     *   @property {string} created_at - Дата и время создания задачи (строка).
     *   @property {string} author - Автор задачи.
     */
    loadTasksFromBackend(tasksArray) {
        this.allTaskIds = []; // список id в порядке получения

        tasksArray.forEach(task => {
            const id = task.id;

            // Сохраняем задачу в локальном объекте tasks
            this.tasks[id] = {
                title: task.title,
                desc: task.desc,
                deadline: task.deadline,
                priority: task.priority,
                assignee: task.assignee,
                tags: task.tags.map(tag => tag.name).join(','),  // Преобразуем массив тегов в строку через запятую
                done: task.done,
                createdAt: task.created_at,  // Можно преобразовать в Date: new Date(task.created_at)
                author: task.author,         // Добавлен автор задачи
                deleted: task.deleted || false,        // Добавляем поле deleted, по умолчанию false
                deleted_by: task.deleted_by || null,   // Кто удалил, если есть
            };
            // Отрисовываем карточку задачи в интерфейсе
            // this.renderTaskCard(id, this.tasks[id]);
            this.allTaskIds.push(id);

        });

        this.PAGE_SIZE = 3;
        this.loadedCount = 0;


        this.renderNextTasks(); // первая порция
        this.ensureScrollFilled();

        if (this.taskBoard && !this._scrollBound) {
            window.addEventListener('scroll', () => this.onScroll());
            this._scrollBound = true; // защита от повторного бинда
        }
    }


    renderNextTasks() {
        let rendered = 0;
        while (this.loadedCount < this.allTaskIds.length && rendered < this.PAGE_SIZE) {
            const id = this.allTaskIds[this.loadedCount];
            const task = this.tasks[id];
            this.loadedCount++;

            if (!this.taskFilterInstance || this.taskFilterInstance.isTaskPassingFilters(task)) {
                this.renderTaskCard(id, task);
                rendered++;
            }
        }
    }


    onScroll() {
        const scrollTop = window.scrollY || window.pageYOffset;
        const windowHeight = window.innerHeight;
        const fullHeight = document.documentElement.scrollHeight;

        const nearBottom = scrollTop + windowHeight >= fullHeight - 100;  // 100px до низа


        if (nearBottom && this.loadedCount < this.allTaskIds.length) {
            console.log("Loading more tasks...");
            this.renderNextTasks();

        }
    }

    getPriorityOrder(priority) {
        switch ((priority || '').toLowerCase()) {
            case 'high':
                return 0;
            case 'medium':
                return 1;
            case 'low':
                return 2;
            default:
                return 3;
        }
    }

    getTaskSortKey(task) {
        return [
            task.deleted ? 1 : 0,
            task.done ? 1 : 0,
            this.getPriorityOrder(task.priority),
            task.deadline ? new Date(task.deadline).getTime() : Infinity
        ];
    }

    sortTaskIdsByBackendLogic() {
        this.allTaskIds.sort((a, b) => {
            const taskA = this.tasks[a];
            const taskB = this.tasks[b];
            const keyA = this.getTaskSortKey(taskA);
            const keyB = this.getTaskSortKey(taskB);

            for (let i = 0; i < keyA.length; i++) {
                if (keyA[i] !== keyB[i]) return keyA[i] - keyB[i];
            }
            return 0;
        });
    }


    resetAndRender() {
        this.sortTaskIdsByBackendLogic();
        this.loadedCount = 0;
        this.taskBoard.innerHTML = '';  // Очищаем контейнер от всех карточек
        this.renderNextTasks();         // Запускаем ленивую отрисовку с нуля, с фильтрами
    }

    /**
     * Открывает модальное окно для создания новой задачи или редактирования существующей.
     *
     * Если передан `taskId` и соответствующая задача существует,
     * форма заполняется данными задачи для редактирования.
     * В противном случае форма очищается для создания новой задачи.
     * Также обновляется список исполнителей и теги.
     *
     * @param {string|null} [taskId=null] - Идентификатор задачи для редактирования. Если не указан или не существует, открывается форма для новой задачи.
     */
    openModal(taskId = null) {
        console.log('openModal вызвана с taskId =', taskId);
        this.currentEditId = taskId;
        const saveBtn = this.taskForm.querySelector('button[type="submit"]');
        const input = this.taskModal.querySelector('input.choices__input.choices__input--cloned');
        if (input) {
            input.setAttribute('maxlength', '20');
        }
        if (taskId && this.tasks[taskId]) {
            if (taskId && this.tasks[taskId]?.deleted) {
                // Задача удалена — отключаем кнопку
                if (saveBtn) saveBtn.disabled = true;
            } else {
                // Задача не удалена или новая — включаем кнопку
                if (saveBtn) saveBtn.disabled = false;
            }
            // Заполнение формы данными существующей задачи
            const task = this.tasks[taskId];
            this.taskForm.title.value = task.title;
            this.taskForm.desc.value = task.desc;
            this.taskForm.deadline.value = task.deadline;
            this.taskForm.priority.value = task.priority;
            this.taskForm.done.checked = task.done;

            const deadlineInput = document.getElementById('deadline-input');
            if (task.deadline) {
                this.deadlinePicker.setDate(task.deadline, false); // false чтобы не вызывал событие onchange
            } else {
                this.deadlinePicker.clear();
            }

            // Обновление тегов с использованием Choices.js / Tom Select
            if (this.tagsSelect) {
                const tagsArray = Array.isArray(task.tags)
                    ? task.tags.map(tag => tag.name)
                    : (typeof task.tags === 'string'
                        ? task.tags.split(',').map(t => t.trim()).filter(Boolean)
                        : []);

                this.tagsSelect.removeActiveItems();
                tagsArray.forEach(tag => {
                    this.tagsSelect.setChoiceByValue(tag);
                });
                this.tagsSelect.setValue(tagsArray.map(tag => ({value: tag, label: tag})));
            }
        } else {
            // Очистка формы для создания новой задачи
            this.taskForm.reset();

            // Очистка тегов, если используется Tom Select
            if (this.tagsSelect) {
                this.tagsSelect.removeActiveItems();
            }
        }

        // Отображение модального окна
        this.taskModal.classList.remove('hidden');

        // Обновление списка исполнителей в селекте
        const select = this.taskForm.querySelector('select[name="assignee"]');
        if (select) {
            // Очищаем текущие опции и добавляем базовую пустую
            select.innerHTML = '<option value="">-- Выберите исполнителя --</option>';

            window.username_data.forEach(user => {
                const option = document.createElement('option');
                const labelParts = [];
                if (user.first_name?.trim()) labelParts.push(user.first_name.trim());
                if (user.last_name?.trim()) labelParts.push(user.last_name.trim());

                const label = labelParts.length > 0 ? labelParts.join(' ') : user.username;

                option.value = user.username;
                option.textContent = label;

                // Если редактируем задачу и исполнитель совпадает — выбираем опцию
                if (taskId && this.tasks[taskId]?.assignee === user.username) {
                    option.selected = true;
                }

                select.appendChild(option);
            });

            if (!taskId) {
                select.value = '';
            }
        }

        // Если редактируем задачу — устанавливаем исполнителя
        if (taskId && this.tasks[taskId]) {
            this.taskForm.assignee.value = this.tasks[taskId].assignee;
        }
    }


    /**
     * Закрывает модальное окно задачи и применяет текущие фильтры задач.
     *
     * Метод скрывает модальное окно редактирования или создания задачи
     * и вызывает метод `applyFilters` у экземпляра фильтра задач,
     * чтобы обновить отображение списка задач согласно текущим фильтрам.
     */
    closeModal() {
        this.taskModal.classList.add('hidden');
        let tagsVal = this.tagsSelect.getValue().map(tag => tag.value);
        // Даем время DOMу обновиться (например, после renderTaskCard)
        setTimeout(() => {
            this.taskFilterInstance.applyFilters();
            this.taskFilterInstance.populateTagOptions(tagsVal);
        }, 100);
    }


    /**
     * Отрисовывает или обновляет карточку задачи на доске.
     *
     * Если карточка с указанным ID уже существует — обновляет её содержимое,
     * иначе создаёт новую карточку и добавляет её в DOM.
     *
     * Добавляет данные в атрибуты `data-*` для фильтрации, а также
     * наполняет карточку заголовком, сроком исполнения, приоритетом,
     * исполнителем, автором, датой создания, тегами и статусом выполнения.
     * Также добавляется кнопка удаления задачи с подтверждением.
     *
     * @param {string} id - Уникальный идентификатор задачи.
     * @param {Object} taskData - Объект с данными задачи.
     * @param {string} [taskData.title] - Заголовок задачи.
     * @param {string} [taskData.assignee] - Логин исполнителя задачи.
     * @param {string} [taskData.author] - Логин автора задачи.
     * @param {string} [taskData.priority] - Приоритет задачи ('low', 'medium', 'high').
     * @param {string} [taskData.deadline] - Дата срока исполнения в формате ISO или строка.
     * @param {boolean} [taskData.done] - Статус выполнения задачи.
     * @param {Array<{name: string}>|string} [taskData.tags] - Теги задачи.
     * @param {string|Date} [taskData.createdAt] - Дата создания задачи.
     * @param {boolean} [isUpdate=false] - Флаг, указывающий, что карточка обновляется.
     */
    renderTaskCard(id, taskData, isUpdate = false) {
        let card = this.taskBoard.querySelector(`[data-card-id="${id}"]`);

        if (!card) {
            // Карточка отсутствует — создаём новую
            card = document.createElement('div');
            card.className = 'task-card';
            card.dataset.cardId = id;
            this.taskBoard.appendChild(card);
        } else {
            // Обновляем существующую карточку — очищаем содержимое
            card.innerHTML = '';
            card.className = 'task-card';
            card.dataset.id = id;
        }

        // Добавляем data-атрибуты для фильтрации
        card.dataset.assignee = taskData.assignee || '';
        card.dataset.priority = taskData.priority || '';
        card.dataset.deadline = taskData.deadline || '';
        card.dataset.done = taskData.done === true ? 'true' : 'false';
        card.dataset.deleted = taskData.deleted === true ? 'true' : 'false'; // новое

        // Обработка тегов: массив объектов или строка
        if (Array.isArray(taskData.tags)) {
            card.dataset.tags = taskData.tags.map(t => t.name).join(',');
        } else if (typeof taskData.tags === 'string') {
            card.dataset.tags = taskData.tags;
        } else {
            card.dataset.tags = '';
        }

        // Кнопка удаления задачи с подтверждением
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.title = 'Удалить заметку';
        deleteBtn.className = 'delete-btn';
        card.appendChild(deleteBtn);

        deleteBtn.addEventListener('click', async (event) => {
            event.stopPropagation();
            const confirmed = await this.showDeleteConfirmation({taskTitle: taskData.title || 'эту задачу'});
            if (confirmed) {
                this.deleteTaskCard(id);
            }
        });

        // Карта цвета бордера по приоритету и статусу выполнения
        const priorityBorderMap = {
            low: 'border-l-success dark:border-l-success-dark',
            medium: 'border-l-warning dark:border-l-warning-dark',
            high: 'border-l-error dark:border-l-error-dark',
            done: 'border-l-green-900 dark:border-l-green-700',
        };
        // Если задача удалена — красный пунктирный бордер и светлый красный фон
        if (taskData.deleted) {
            card.classList.add('border-l-4', 'border-l-red-700', 'border-dashed', '!bg-red-100', 'dark:!bg-red-900/30');
        } else {
            const borderClass = taskData.done
                ? priorityBorderMap.done
                : (priorityBorderMap[taskData.priority] || 'border-l-gray-300');
            borderClass.split(' ').forEach(cls => card.classList.add(cls));
        }

        // Например, после вывода других данных добавим отображение удаления
        if (taskData.deleted) {
            const deletedEl = document.createElement('div');
            deletedEl.className = 'text-xs text-red-700 font-semibold mb-1';
            deletedEl.textContent = `Удалено${taskData.deleted_by ? ` пользователем ${taskData.deleted_by}` : ''}`;
            card.appendChild(deletedEl);
        }

        // Заголовок задачи
        const titleEl = document.createElement('h3');
        titleEl.className = 'mb-1 truncate font-semibold text-lg';
        titleEl.textContent = taskData.title || 'Без названия';
        card.appendChild(titleEl);

        // Срок исполнения (с подсветкой просрочки или приближения срока)
        if (taskData.deadline && !taskData.done) {
            const deadlineEl = document.createElement('div');
            deadlineEl.className = 'text-xs md:text-sm xl:text-base text-text dark:text-text-dark mb-1';
            const today = new Date();
            const deadlineDate = new Date(taskData.deadline);
            // Форматируем дату в ДД.ММ.ГГГГ
            const formattedDeadline = deadlineDate.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
            deadlineEl.textContent = 'Срок исполнения: ' + formattedDeadline;


            if (deadlineDate < today.setHours(0, 0, 0, 0)) {
                // Просрочено
                deadlineEl.classList.add('!text-red-600', '!font-semibold');
                card.classList.add('!bg-red-200', 'dark:!bg-red-900/20');
                deadlineEl.textContent += ' !!!ПРОСРОЧЕНО!!!';
            } else {
                // Осталось <= 3 дней
                const diffInDays = Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24));
                if (diffInDays <= 3) {
                    deadlineEl.classList.add('!text-yellow-600', '!font-medium');
                    card.classList.add('!bg-yellow-200', 'dark:!bg-yellow-600/20');
                    deadlineEl.textContent += ' !!!Менее 3 дней осталось!!!';
                }
            }
            card.appendChild(deadlineEl);
        }

        // Отображение приоритета задачи с цветом и иконкой
        if (taskData.priority) {
            const priorityMap = {
                low: '\u{1F7E9} Низкий',
                medium: '🟡 Средний',
                high: '🔴 Высокий',
            };
            const priorityColorMap = {
                low: 'text-green-600',
                medium: 'text-yellow-600',
                high: 'text-red-700'
            };

            const priorityEl = document.createElement('div');
            priorityEl.className = 'text-xs md:text-sm xl:text-base mb-1';
            const colorClass = priorityColorMap[taskData.priority] || 'text-gray-500';
            const priorityText = priorityMap[taskData.priority] || taskData.priority;

            priorityEl.innerHTML = `<span class="${colorClass} font-medium">Приоритет: ${priorityText}</span>`;
            card.appendChild(priorityEl);
        }

        // Исполнитель задачи с отображением полного имени, если доступно
        if (taskData.assignee) {
            const assigneeEl = document.createElement('div');
            assigneeEl.className = 'text-xs md:text-sm xl:text-base text-text dark:text-text-dark mb-1';

            const userData = window.username_data.find(user => user.username === taskData.assignee);
            let displayName;
            if (userData) {
                const parts = [];
                if (userData.first_name?.trim()) parts.push(userData.first_name.trim());
                if (userData.last_name?.trim()) parts.push(userData.last_name.trim());
                displayName = parts.length > 0 ? parts.join(' ') : taskData.assignee;
            } else {
                displayName = taskData.assignee;
            }

            assigneeEl.textContent = 'Исполнитель: ' + displayName;
            card.appendChild(assigneeEl);
        }

        // Автор задачи с отображением полного имени, если доступно
        if (taskData.author) {
            const authorEl = document.createElement('div');
            authorEl.className = 'text-xs md:text-sm xl:text-base text-text dark:text-text-dark mb-1';

            const authorData = window.username_data.find(user => user.username === taskData.author);
            let authorName;
            if (authorData) {
                const parts = [];
                if (authorData.first_name?.trim()) parts.push(authorData.first_name.trim());
                if (authorData.last_name?.trim()) parts.push(authorData.last_name.trim());
                authorName = parts.length > 0 ? parts.join(' ') : authorData.username;
            } else {
                authorName = taskData.author;
            }

            authorEl.textContent = 'Автор: ' + authorName;
            card.appendChild(authorEl);
        }

        // Дата создания задачи с форматированием "Сегодня" или датой
        const createdAtEl = document.createElement('div');
        createdAtEl.className = 'text-xs md:text-sm xl:text-base text-gray-500 dark:text-gray-400 mb-1';

        let date = taskData.createdAt ? new Date(taskData.createdAt) : new Date();

        if (isNaN(date.getTime())) {
            date = new Date();
        }

        const today = new Date();
        const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

        const formattedDate = isToday
            ? 'Сегодня'
            : date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });

        createdAtEl.textContent = 'Создано: ' + formattedDate;
        card.appendChild(createdAtEl);

        // Отображение тегов с иконкой и цветами
        if (taskData.tags) {
            const tagsEl = document.createElement('div');
            tagsEl.className = 'text-xs md:text-sm xl:text-base mb-1 flex flex-wrap items-center gap-1';

            const icon = document.createElement('span');
            icon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                 viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                 class="w-4 h-4 text-accent dark:text-accent-dark">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
            </svg>`;
            tagsEl.appendChild(icon);

            const tagColors = ['text-red-500', 'text-green-500', 'text-blue-500', 'text-yellow-600', 'text-purple-500'];

            const tagsArray = Array.isArray(taskData.tags)
                ? taskData.tags.map(tag => tag.name)
                : (typeof taskData.tags === 'string' ? taskData.tags.split(',') : []);

            tagsArray.filter(Boolean).forEach((tag, index) => {
                const tagSpan = document.createElement('span');
                tagSpan.textContent = `#${tag}`;
                tagSpan.className = tagColors[index % tagColors.length];
                tagsEl.appendChild(tagSpan);
            });

            card.appendChild(tagsEl);
        }

        // Статус выполнения задачи с иконкой и цветом
        const doneEl = document.createElement('div');
        doneEl.className = 'text-xs md:text-sm xl:text-base font-semibold flex items-center gap-1 ' + (taskData.done ? 'text-green-700' : 'text-red-600');

        const statusIcon = document.createElement('span');
        statusIcon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 md:size-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
            </svg>
            `;

        const statusText = document.createElement('span');
        statusText.textContent = taskData.done ? 'Выполнено' : 'В процессе';

        doneEl.appendChild(statusIcon);

        doneEl.appendChild(document.createTextNode(taskData.done ? 'Выполнено' : 'В процессе'));
        card.appendChild(doneEl);
    }


    /**
     * Сохраняет задачу на сервере.
     * Если редактируется существующая задача (this.currentEditId установлен),
     * выполняет PATCH-запрос, иначе — POST-запрос для создания новой задачи.
     * После успешного ответа обновляет локальный кэш задач и отображение.
     * Обрабатывает ошибки сети и ошибки сервера.
     *
     * @async
     * @function saveTask
     * @returns {Promise<void>}
     */
    async saveTask() {
        const formData = new FormData(this.taskForm);
        const taskData = {
            title: formData.get('title'),
            desc: formData.get('desc'),
            deadline: formData.get('deadline'),
            priority: formData.get('priority'),
            assignee: formData.get('assignee'),
            tags: this.tagsSelect ? this.tagsSelect.getValue(true).join(',') : '',
            done: formData.get('done') === 'on',
        };

        try {
            const isUpdate = !!this.currentEditId;
            const url = isUpdate ? `tasks/${this.currentEditId}/` : 'tasks/';
            const method = isUpdate ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken,
                },
                body: JSON.stringify(taskData),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('Ошибка при сохранении задачи:', result);
                this.handleServerError(result);
                return;
            }

            if (isUpdate) {
                this.tasks[this.currentEditId] = result;
                this.sortTaskIdsByBackendLogic();      // Переупорядочить
                this.renderTaskCard(this.currentEditId, result, true);
                // this.showSuccessMessage(`Задача успешно обновлена ${result.id}`);
            } else {
                const id = result.id;
                this.tasks[id] = result;
                // Добавляем ID в начало или в конец массива, в зависимости от логики
                this.allTaskIds.unshift(id);
                this.sortTaskIdsByBackendLogic();      // Сортируем по бэку
                // this.renderTaskCard(id, result);
                this.showSuccessMessage(`Задача успешно создана ${result.id}`);
            }
            this.resetAndRender();

            this.closeModal();

        } catch (error) {
            console.error('Ошибка сети:', error);
            this.handleServerError('Ошибка сети при сохранении задачи!');
        }
    }

    /**
     * Удаляет задачу с указанным идентификатором.
     * Отправляет DELETE-запрос на сервер, при успешном ответе
     * удаляет карточку задачи из DOM и из локального кэша задач.
     * Обрабатывает ошибки сети и сервера.
     *
     * @async
     * @function deleteTaskCard
     * @param {string|number} id - Идентификатор задачи для удаления.
     * @returns {Promise<void>}
     */
    async deleteTaskCard(id) {
        try {
            const response = await fetch(`tasks/delete/${id}/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken,
                },
            });

            if (response.ok) {
                const card = this.taskBoard.querySelector(`[data-card-id="${id}"]`);
                if (card) {
                    card.remove();
                }
                if (this.tasks[id]) {
                    delete this.tasks[id];
                }
                this.showSuccessMessage('Задача успешно удалена');

            } else {
                const errorText = await response.text();
                console.error(`Ошибка при удалении задачи ${id}:`, errorText);
                this.handleServerError(`Ошибка при удалении: ${errorText}`);
            }
        } catch (error) {
            console.error('Ошибка при удалении задачи:', error);
            this.handleServerError('Сетевая ошибка при удалении задачи!');
        }
    }


    /**
     * Отображает всплывающее сообщение об успешном действии.
     *
     * @param {string} message
     */
    showSuccessMessage(message) {
        const serverInfo = document.getElementById('server-info');
        const messageParagraph = serverInfo.querySelector('p');
        // this.setTaskFilterInstance.applyFilters();
        // Очистка предыдущего таймера, если он ещё активен
        if (this.successMessageTimeout) {
            clearTimeout(this.successMessageTimeout);
        }

        // Показываем сообщение
        serverInfo.classList.remove('hidden', 'animate-popup-reverse');
        serverInfo.classList.add('flex', 'animate-popup');
        messageParagraph.textContent = message;
        serverInfo.scrollIntoView({behavior: 'smooth', block: 'start'});

        // Устанавливаем новый таймер скрытия
        this.successMessageTimeout = setTimeout(() => {
            serverInfo.classList.remove('animate-popup');
            serverInfo.classList.add('animate-popup-reverse');
            setTimeout(() => {
                serverInfo.classList.add('hidden');
                serverInfo.classList.remove('flex', 'animate-popup-reverse');
            }, 1000);
            this.successMessageTimeout = null; // очищаем
        }, 5000);
    }

    /**
     * Обрабатывает ошибки сервера и отображает соответствующие сообщения.
     *
     * @param {Object} errorData
     * @param {string} fallbackMessage
     */
    handleServerError(errorData, fallbackMessage) {
        console.error(fallbackMessage, errorData);
        if (errorData?.errors) {
            for (const [field, messages] of Object.entries(errorData.errors)) {
                messages.forEach(message => {
                    showError(`Ошибка в поле "${field}" - "${message}"`, 'server-error2');
                });
                const fieldError = document.querySelector(`input[name="${field}"]`);
                if (fieldError) {
                    fieldError.classList.remove("correct_input");
                    fieldError.classList.add("error_input");
                    setTimeout(() => {
                        fieldError.classList.remove("error_input");
                        fieldError.classList.add("correct_input");
                        fieldError.focus();
                    }, 4000);
                }

            }
        } else {
            showError(fallbackMessage, 'server-error2');
        }
    }

    /**
     * Отображает модальное окно с подтверждением удаления задачи.
     * Возвращает Promise, который резолвится в:
     * - true, если пользователь подтвердил удаление,
     * - false, если пользователь отменил или прошло 30 секунд без ответа.
     *
     * @async
     * @function showDeleteConfirmation
     * @param {Object} data - Данные задачи для подтверждения.
     * @param {string} data.taskTitle - Название задачи, которое будет показано в сообщении.
     * @returns {Promise<boolean>} Результат подтверждения (true - подтвердил, false - отменил или таймаут).
     */
    async showDeleteConfirmation(data) {
        return new Promise((resolve) => {
            const serverInfo = document.getElementById('server-info');
            serverInfo.classList.remove('hidden', 'animate-popup-reverse');
            serverInfo.classList.add('flex', 'animate-popup');
            serverInfo.querySelector('h3').textContent = 'Подтверждение удаления задачи';
            serverInfo.querySelector('p').textContent =
                `Вы уверены, что хотите удалить "${data.taskTitle}"?`;
            serverInfo.scrollIntoView({behavior: 'smooth', block: 'start'});

            const divBtn = document.getElementById('btn-div');
            divBtn.innerHTML = '';

            const confirmBtn = document.createElement('button');
            confirmBtn.id = 'confirm-delete';
            confirmBtn.textContent = 'Удалить';
            confirmBtn.classList.add('btn-submit', '!p-1', '!font-medium');

            const cancelBtn = document.createElement('button');
            cancelBtn.id = 'cancel-delete';
            cancelBtn.textContent = 'Отмена';
            cancelBtn.classList.add('btn-cancel', '!p-1', '!font-medium');

            divBtn.appendChild(confirmBtn);
            divBtn.appendChild(cancelBtn);

            let resolved = false;

            /**
             * Выполняет скрытие модального окна с анимацией и очистку содержимого.
             * @returns {Promise<void>} Промис, который резолвится после завершения анимации.
             */
            const cleanup = () => {
                return new Promise((res) => {
                    serverInfo.classList.remove('animate-popup');
                    serverInfo.classList.add('animate-popup-reverse');
                    setTimeout(() => {
                        divBtn.innerHTML = '';
                        serverInfo.querySelector('h3').textContent = '';
                        serverInfo.querySelector('p').textContent = '';
                        serverInfo.classList.add('hidden');
                        res();
                    }, 1000); // время анимации скрытия
                });
            };

            // Таймаут автоматического отказа через 30 секунд
            const timeoutId = setTimeout(() => {
                if (resolved) return;
                resolved = true;
                cleanup().then(() => resolve(false));
            }, 30000);

            // Обработчик подтверждения удаления
            confirmBtn.addEventListener('click', () => {
                if (resolved) return;
                resolved = true;
                clearTimeout(timeoutId);
                cleanup().then(() => resolve(true));
            });

            // Обработчик отмены удаления
            cancelBtn.addEventListener('click', () => {
                if (resolved) return;
                resolved = true;
                clearTimeout(timeoutId);
                cleanup().then(() => resolve(false));
            });
        });
    }


}


/**
 * Класс TaskFilter реализует фильтрацию карточек задач по множеству критериев:
 * назначенный пользователь, приоритет, срок выполнения, статус выполнения и теги.
 */
export class TaskFilter {
    /**
     * @param {Object} config - Конфигурация фильтрации.
     * @param {string} config.tasksContainerId - ID контейнера с карточками задач.
     */
    constructor({tasksContainerId}) {
        /** @type {HTMLElement} */
        this.container = document.getElementById(tasksContainerId);
        /** @type {HTMLElement[]} */
        this.cards = Array.from(this.container.querySelectorAll('.task-card'));

        /** @type {Object<string, HTMLSelectElement>} */
        this.filters = {
            assignee: document.getElementById('filter-assignee'),
            priority: document.getElementById('filter-priority'),
            date: document.getElementById('filter-deadline'),
            status: document.getElementById('filter-status'), // '' | 'true' | 'false'
        };

        /** @type {HTMLElement} */
        this.tagContainer = document.querySelector('#dropdownMenu .p-2');
        /** @type {HTMLElement} */
        this.dropdownToggle = document.getElementById('dropdownToggle');
        /** @type {HTMLElement} */
        this.dropdownMenu = document.getElementById('dropdownMenu');

        this.populateAssigneeOptions();
        this.populateTagOptions();
        this.attachEvents();
        this.initTagDropdown();
        this.restoreFiltersFromStorage(); // <--- ДОБАВЛЕНО

    }

    setKanbanTasksInstance(KanbanTasksInstance) {
        this.kanbanTasksInstance = KanbanTasksInstance;
    }

    /**
     * Заполняет селектор с пользователями, основываясь на данных из `window.username_data`.
     */
    populateAssigneeOptions() {
        const assigneeSelect = this.filters.assignee;
        if (!assigneeSelect || !window.username_data) return;

        while (assigneeSelect.options.length > 1) {
            assigneeSelect.remove(1);
        }

        window.username_data.forEach(user => {
            const option = document.createElement('option');
            option.value = user.username;

            const nameParts = [];
            if (user.first_name?.trim()) nameParts.push(user.first_name.trim());
            if (user.last_name?.trim()) nameParts.push(user.last_name.trim());

            option.textContent = nameParts.length > 0
                ? nameParts.join(' ')
                : user.username;

            assigneeSelect.appendChild(option);
        });
    }

    /**
     * Заполняет выпадающий список тегов из `window.tags_list`.
     */
    populateTagOptions(tagsVal = []) {
        if (!this.tagContainer || !window.tags_list) return;
        // Получить имена существующих тегов
        const existingTagNames = window.tags_list.map(tag => tag.name);

        // Добавить новые теги в window.tags_list, если их ещё нет
        tagsVal.forEach(tagName => {
            if (!existingTagNames.includes(tagName)) {
                const maxId = window.tags_list.reduce((max, tag) => Math.max(max, tag.id), 0);
                const newTag = {
                    id: maxId + 1, // временный ID
                    name: tagName
                };
                window.tags_list.push(newTag);
            }
        });

        // Повторно собрать имена всех тегов
        const allTags = window.tags_list.map(tag => tag.name);

        // Очистить контейнер перед созданием новых чекбоксов
        this.tagContainer.innerHTML = '';

        allTags.forEach(tag => {
            const label = document.createElement('label');
            label.className = 'correct_label flex items-center space-x-2 mb-3';

            const checkbox = document.createElement('input');

            checkbox.type = 'checkbox';
            checkbox.value = tag;
            checkbox.className = 'tag-checkbox correct_icon rounded-full text-xl';

            // Отметить чекбокс, если он есть в tagsVal
            if (tagsVal.includes(tag)) {
                checkbox.checked = false;
            }

            const span = document.createElement('span');
            span.textContent = tag;

            label.appendChild(checkbox);
            label.appendChild(span);
            this.tagContainer.appendChild(label);
        });

        this.tagCheckboxes = Array.from(this.tagContainer.querySelectorAll('.tag-checkbox'));
        this.tagCheckboxes.forEach(cb =>
            cb.addEventListener('change', () => this.applyFilters())
        );
    }


    /**
     * Назначает обработчики событий на элементы фильтров и чекбоксы тегов.
     */
    attachEvents() {
        Object.values(this.filters).forEach(filter =>
            filter?.addEventListener('change', () => this.applyFilters())
        );

        this.tagCheckboxes?.forEach(cb =>
            cb.addEventListener('change', () => this.applyFilters())
        );

        const clearBtn = document.getElementById('clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                Object.values(this.filters).forEach(filter => {
                    if (filter) filter.value = '';
                });

                this.tagCheckboxes.forEach(cb => cb.checked = false);
                localStorage.removeItem('taskFilters');  // <--- ДОБАВЬ ЭТО
                this.applyFilters();
            });
        }
    }

    /**
     * Получает список выбранных тегов в нижнем регистре.
     * @returns {string[]}
     */
    getSelectedTags() {
        return this.tagCheckboxes
            .filter(cb => cb.checked)
            .map(cb => cb.value.toLowerCase());
    }

    /**
     * Сохранение данных для фильтрации в локальное хранилище
     */
    saveFiltersToStorage() {
        const filtersState = {
            assignee: this.filters.assignee?.value || '',
            priority: this.filters.priority?.value || '',
            date: this.filters.date?.value || '',
            status: this.filters.status?.value || '',
            tags: this.getSelectedTags()
        };
        localStorage.setItem('taskFilters', JSON.stringify(filtersState));
    }

    restoreFiltersFromStorage() {
        const saved = localStorage.getItem('taskFilters');
        if (!saved) return;

        try {
            const {assignee, priority, date, status, tags} = JSON.parse(saved);

            if (this.filters.assignee) this.filters.assignee.value = assignee;
            if (this.filters.priority) this.filters.priority.value = priority;
            if (this.filters.date) this.filters.date.value = date;
            if (this.filters.status) this.filters.status.value = status;

            this.populateTagOptions(tags || []);
            setTimeout(() => {
                this.tagCheckboxes?.forEach(cb => {
                    cb.checked = tags.includes(cb.value.toLowerCase());
                });
                this.applyFilters();
            }, 0);
        } catch (e) {
            console.error('Ошибка восстановления фильтров:', e);
        }
    }


    /**
     * Применяет фильтрацию и сортировку карточек в соответствии с выбранными значениями.
     */
    applyFilters() {
        const assigneeVal = this.filters.assignee?.value.trim().toLowerCase() || '';
        const priorityVal = this.filters.priority?.value.trim().toLowerCase() || '';
        const dateVal = this.filters.date?.value || '';
        const statusVal = this.filters.status?.value || '';
        this.saveFiltersToStorage();  // <--- ДОБАВЬ ЭТО
        if (this.kanbanTasksInstance) {
            this.kanbanTasksInstance.resetAndRender();
        }
        const selectedTags = this.getSelectedTags();

        // Проверяем, есть ли активные фильтры (кроме статуса)
        const otherFiltersActive = Boolean(
            assigneeVal || priorityVal || dateVal || selectedTags.length > 0
        );

        this.cards = Array.from(this.container.querySelectorAll('.task-card'));

        let filteredCards = this.cards.filter(card => {
            const cardAssignee = (card.dataset.assignee || '').toLowerCase();
            const cardPriority = (card.dataset.priority || '').toLowerCase();
            const cardDone = (card.dataset.done || 'false').toLowerCase();
            const cardDeleted = (card.dataset.deleted || 'false').toLowerCase();
            const cardTags = (card.dataset.tags || '')
                .toLowerCase()
                .split(',')
                .map(t => t.trim())
                .filter(Boolean);

            const matchAssignee = !assigneeVal || cardAssignee === assigneeVal;
            const matchPriority = !priorityVal || cardPriority === priorityVal;
            const matchTags = selectedTags.length === 0 || selectedTags.every(tag => cardTags.includes(tag));

            let matchStatus = false;

            if (statusVal === 'deleted') {
                matchStatus = cardDeleted === 'true';
            } else if (!otherFiltersActive && !statusVal) {
                // Нет фильтров — показываем все, включая удалённые
                matchStatus = true;
            } else {
                if (cardDeleted === 'true') return false;

                if (!statusVal) {
                    matchStatus = true;
                } else if (statusVal === 'true') {
                    matchStatus = cardDone === 'true';
                } else if (statusVal === 'false') {
                    matchStatus = cardDone !== 'true';
                }
            }

            return matchAssignee && matchPriority && matchTags && matchStatus;
        });

        // Сортируем

        if (dateVal === 'asc' || dateVal === 'desc') {
            filteredCards.sort((a, b) => {
                const dateA = new Date(a.dataset.deadline);
                const dateB = new Date(b.dataset.deadline);

                if (isNaN(dateA)) return 1;
                if (isNaN(dateB)) return -1;

                return dateVal === 'asc' ? dateA - dateB : dateB - dateA;
            });
        } else {
            const priorityOrder = {high: 1, medium: 2, low: 3};

            filteredCards.sort((a, b) => {
                const prioA = priorityOrder[a.dataset.priority?.toLowerCase()] || 99;
                const prioB = priorityOrder[b.dataset.priority?.toLowerCase()] || 99;

                if (prioA !== prioB) return prioA - prioB;

                const dateA = new Date(a.dataset.deadline);
                const dateB = new Date(b.dataset.deadline);

                if (isNaN(dateA)) return 1;
                if (isNaN(dateB)) return -1;

                return dateA - dateB;
            });
        }

        // Сортируем по выполненным задачам, чтобы выполненные были ниже

        filteredCards.sort((a, b) => {
            const doneA = (a.dataset.done || 'false').toLowerCase();
            const doneB = (b.dataset.done || 'false').toLowerCase();

            if (doneA === 'true' && doneB !== 'true') return 1;
            if (doneA !== 'true' && doneB === 'true') return -1;
            return 0;
        });

        // **Новое:** при отсутствии фильтров - отправляем удалённые задачи в конец списка
        if (!otherFiltersActive && !statusVal) {
            filteredCards.sort((a, b) => {
                const delA = (a.dataset.deleted || 'false').toLowerCase() === 'true';
                const delB = (b.dataset.deleted || 'false').toLowerCase() === 'true';

                if (delA && !delB) return 1;  // удалённые — ниже
                if (!delA && delB) return -1; // не удалённые — выше
                return 0;
            });
        }

        this.cards.forEach(card => card.classList.add('hidden'));
        filteredCards.forEach(card => card.classList.remove('hidden'));
        filteredCards.forEach(card => this.container.appendChild(card));

    }

    // В твоём фильтрующем классе
    isTaskPassingFilters(taskObj) {
        const assigneeVal = this.filters.assignee?.value.trim().toLowerCase() || '';
        const priorityVal = this.filters.priority?.value.trim().toLowerCase() || '';
        const dateVal = this.filters.date?.value || '';
        const statusVal = this.filters.status?.value || '';
        const selectedTags = this.getSelectedTags();

        const cardAssignee = (taskObj.assignee || '').toLowerCase();
        const cardPriority = (taskObj.priority || '').toLowerCase();
        const cardDone = (taskObj.done ? 'true' : 'false').toLowerCase();
        const cardDeleted = (taskObj.deleted ? 'true' : 'false').toLowerCase();
        let cardTags = [];

        if (Array.isArray(taskObj.tags)) {
            // Массив объектов или строк
            cardTags = taskObj.tags.map(tag =>
                typeof tag === 'string' ? tag.toLowerCase().trim() : (tag.name || '').toLowerCase().trim()
            ).filter(Boolean);
        } else if (typeof taskObj.tags === 'string') {
            // Строка тегов через запятую
            cardTags = taskObj.tags.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
        }


        const matchAssignee = !assigneeVal || cardAssignee === assigneeVal;
        const matchPriority = !priorityVal || cardPriority === priorityVal;
        const matchTags = selectedTags.length === 0 || selectedTags.every(tag => cardTags.includes(tag));

        let matchStatus = false;

        if (statusVal === 'deleted') {
            matchStatus = cardDeleted === 'true';
        } else if (!assigneeVal && !priorityVal && !dateVal && selectedTags.length === 0 && !statusVal) {
            matchStatus = true;
        } else {
            if (cardDeleted === 'true') return false;
            if (!statusVal) {
                matchStatus = true;
            } else if (statusVal === 'true') {
                matchStatus = cardDone === 'true';
            } else if (statusVal === 'false') {
                matchStatus = cardDone !== 'true';
            }
        }

        return matchAssignee && matchPriority && matchTags && matchStatus;
    }


    /**
     * Инициализирует поведение выпадающего меню тегов.
     */
    initTagDropdown() {
        if (!this.dropdownToggle || !this.dropdownMenu) return;

        this.dropdownToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.dropdownMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!this.dropdownMenu.contains(e.target) && !this.dropdownToggle.contains(e.target)) {
                this.dropdownMenu.classList.add('hidden');
            }
        });
    }
}








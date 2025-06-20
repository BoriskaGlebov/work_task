import Choices from 'choices.js';
import 'choices.js/public/assets/styles/choices.min.css';
import {showError} from "./utils.js";


export class KanbanTasks {
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
        this.taskModal.addEventListener('click', (e) => {
            if (!this.taskForm.contains(e.target)) {
                this.taskModal.classList.add('hidden');
            }
        });

        this.tagsSelect = new Choices(select, {
            removeItemButton: true,
            duplicateItemsAllowed: false,
            addItems: true,
            addItemFilter: value => value.trim().length > 0,
            addChoices: true,
            searchEnabled: true,
            shouldSort: false,
            placeholderValue: 'Введите или выберите теги...',
            choices: window.tags_list.map(tag => ({
                value: tag.name,
                label: tag.name
            }))
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

    }

    setTaskFilterInstance(taskFilterInstance) {
        this.taskFilterInstance = taskFilterInstance;
    }

    loadTasksFromBackend(tasksArray) {
        tasksArray.forEach(task => {
            const id = task.id;
            // Сохраняем задачу
            this.tasks[id] = {
                title: task.title,
                desc: task.desc,
                deadline: task.deadline,
                priority: task.priority,
                assignee: task.assignee,
                tags: task.tags.map(tag => tag.name).join(','),  // <-- важно!
                done: task.done,
                createdAt: task.created_at,  // или new Date(task.created_at)
                author: task.author,         // <-- добавили автора
            };
            // console.log(this.tasks[id]);
            // Отрисовываем карточку
            this.renderTaskCard(id, this.tasks[id]);
        });
    }

    openModal(taskId = null) {
        this.currentEditId = taskId;

        if (taskId && this.tasks[taskId]) {
            // Заполнить форму данными для редактирования
            const task = this.tasks[taskId];
            this.taskForm.title.value = task.title;
            this.taskForm.desc.value = task.desc;
            this.taskForm.deadline.value = task.deadline;
            this.taskForm.priority.value = task.priority;
            this.taskForm.done.checked = task.done;

            // Обновляем теги через Choices.js
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
            // Новая задача — очистить форму
            this.taskForm.reset();

            // Очистить теги в Tom Select, если он есть
            if (this.tagsSelect) {
                this.tagsSelect.removeActiveItems();
            }
        }

        // Показываем модалку
        this.taskModal.classList.remove('hidden');

        // Получаем select исполнителя
        const select = this.taskForm.querySelector('select[name="assignee"]');
        if (select) {
            // Очищаем и заполняем select
            select.innerHTML = '<option value="">-- Выберите исполнителя --</option>';

            window.username_data.forEach(user => {
                const option = document.createElement('option');
                const labelParts = [];
                if (user.first_name?.trim()) labelParts.push(user.first_name.trim());
                if (user.last_name?.trim()) labelParts.push(user.last_name.trim());

                const label = labelParts.length > 0 ? labelParts.join(' ') : user.username;

                option.value = user.username;
                option.textContent = label;

                if (taskId && this.tasks[taskId]?.assignee === user.username) {
                    option.selected = true;
                }

                select.appendChild(option);
            });

            if (!taskId) {
                select.value = '';
            }
        }

        // Если редактирование — выставляем значение assignee
        if (taskId && this.tasks[taskId]) {
            this.taskForm.assignee.value = this.tasks[taskId].assignee;
        }
    }


    closeModal() {
        this.taskModal.classList.add('hidden');
        this.taskFilterInstance.applyFilters();
    }

    renderTaskCard(id, taskData, isUpdate = false) {
        let card = this.taskBoard.querySelector(`[data-card-id="${id}"]`);
        if (!card) {
            // Карточки ещё нет — создаём
            card = document.createElement('div');
            card.className = 'task-card';
            card.dataset.cardId = id;
            this.taskBoard.appendChild(card);
        } else {
            // Очистим содержимое, если обновляем
            card.innerHTML = '';
            card.className = 'task-card';
            card.dataset.id = id;
        }
        // Добавляем data-* атрибуты для фильтрации
        card.dataset.assignee = taskData.assignee || '';
        card.dataset.priority = taskData.priority || '';
        card.dataset.deadline = taskData.deadline || '';
        card.dataset.done = taskData.done === true ? 'true' : 'false';
        // Для тегов — передаём строку с тегами через запятую
        if (Array.isArray(taskData.tags)) {
            // Если tags — массив объектов с name
            card.dataset.tags = taskData.tags.map(t => t.name).join(',');
        } else if (typeof taskData.tags === 'string') {
            card.dataset.tags = taskData.tags;
        } else {
            card.dataset.tags = '';
        }
        // --- Удаление ---
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.title = 'Удалить заметку';
        deleteBtn.className = 'delete-btn';
        card.appendChild(deleteBtn)
        deleteBtn.addEventListener('click', async (event) => {
            event.stopPropagation();
            const confirmed = await this.showDeleteConfirmation({taskTitle: taskData.title || 'эту задачу'});
            if (confirmed) {
                this.deleteTaskCard(id);
            }
        });
        // Если задача выполнена — отображаем только статус
        if (taskData.done) {
            const doneEl = document.createElement('div');
            doneEl.className = 'text-xs font-semibold text-green-700';
            doneEl.textContent = 'Выполнено';
            card.appendChild(doneEl);
            return;
        }

        // Цвет бордера в зависимости от приоритета
        const priorityBorderMap = {
            low: 'border-l-success dark:border-l-success-dark',
            medium: 'border-l-warning dark:border-l-warning-dark',
            high: 'border-l-error dark:border-l-error-dark',
        };
        const borderClass = priorityBorderMap[taskData.priority] || 'border-l-gray-300';
        borderClass.split(' ').forEach(cls => card.classList.add(cls));

        // Заголовок
        const titleEl = document.createElement('h3');
        titleEl.className = 'mb-1 truncate font-semibold text-lg';
        titleEl.textContent = taskData.title || 'Без названия';
        card.appendChild(titleEl);

        // Срок исполнения
        if (taskData.deadline) {
            const deadlineEl = document.createElement('div');
            deadlineEl.className = 'text-xs text-text dark:text-text-dark mb-1';
            deadlineEl.textContent = 'Срок исполнения: ' + taskData.deadline;
            const today = new Date();
            const deadlineDate = taskData.deadline ? new Date(taskData.deadline) : null;
            // Истёк срок
            if (deadlineDate < today.setHours(0, 0, 0, 0)) {
                deadlineEl.classList.add('!text-red-600', '!font-semibold');
                card.classList.add('!bg-red-200', 'dark:!bg-red-900/20');
            } else {
                // Осталось <= 3 дней
                const diffInDays = Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24));
                if (diffInDays <= 3) {
                    deadlineEl.classList.add('!text-yellow-600', '!font-medium');
                    card.classList.add('!bg-yellow-200', 'dark:!bg-yellow-600/20');
                }
            }
            card.appendChild(deadlineEl);
        }

        // Приоритет
        if (taskData.priority) {
            const priorityMap = {
                low: '‍🦼 Низкий',
                medium: '🚶‍♂️ Средний',
                high: '🔥🏃‍♂️Высокий'
            };
            const priorityColorMap = {
                low: 'text-green-600',
                medium: 'text-yellow-600',
                high: 'text-red-700'
            };

            const priorityEl = document.createElement('div');
            priorityEl.className = 'text-xs mb-1';
            const colorClass = priorityColorMap[taskData.priority] || 'text-gray-500';
            const priorityText = priorityMap[taskData.priority] || taskData.priority;

            priorityEl.innerHTML = `<span class="${colorClass} font-medium">Приоритет: ${priorityText}</span>`;
            card.appendChild(priorityEl);
        }
        // Исполнитель
        if (taskData.assignee) {
            const assigneeEl = document.createElement('div');
            assigneeEl.className = 'text-xs text-text dark:text-text-dark mb-1';

            // Найдём пользователя в списке по username
            const userData = window.username_data.find(user => user.username === taskData.assignee);

            const displayName = userData && userData.first_name ? userData.first_name : taskData.assignee;

            assigneeEl.textContent = 'Исполнитель: ' + displayName;
            card.appendChild(assigneeEl);
        }
        // Автор задачи
        if (taskData.author) {
            const authorEl = document.createElement('div');
            authorEl.className = 'text-xs text-text dark:text-text-dark mb-1';

            // Найдём пользователя в списке по username
            const authorData = window.username_data.find(user => user.username === taskData.author);
            const authorName = authorData
                ? [authorData.first_name, authorData.second_name].filter(Boolean).join(' ').trim() || authorData.username
                : taskData.author;

            authorEl.textContent = 'Автор: ' + authorName;
            card.appendChild(authorEl);
        }
        // Дата создания
        const createdAtEl = document.createElement('div');
        createdAtEl.className = 'text-xs text-gray-500 dark:text-gray-400 mb-1';

        let date = taskData.createdAt ? new Date(taskData.createdAt) : new Date();

// Если дата некорректна — ставим сегодня
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


        // Теги
        if (taskData.tags) {
            const tagsEl = document.createElement('div');
            tagsEl.className = 'text-xs mb-1 flex flex-wrap gap-1';

            const tagColors = ['text-red-500', 'text-green-500', 'text-blue-500', 'text-yellow-600', 'text-purple-500'];

            // Проверим: tags — это массив объектов с name
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

        // Статус выполнения
        const doneEl = document.createElement('div');
        doneEl.className = 'text-xs font-semibold ' + (taskData.done ? 'text-green-700' : 'text-red-600');
        doneEl.textContent = taskData.done ? 'Выполнено' : 'В процессе';
        card.appendChild(doneEl);
    }

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
            let response;
            let isUpdate = !!this.currentEditId;

            const url = isUpdate ? `tasks/${this.currentEditId}/` : 'tasks/';
            const method = isUpdate ? 'PATCH' : 'POST';

            response = await fetch(url, {
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
                this.renderTaskCard(this.currentEditId, result, true);
                // this.showSuccessMessage(`Задача успешно обновлена ${result.id}`);
            } else {
                const id = result.id;
                this.tasks[id] = result;
                this.renderTaskCard(id, result);
                this.showSuccessMessage(`Задача успешно создана ${result.id}`);
            }

            this.closeModal();

        } catch (error) {
            console.error('Ошибка сети:', error);
            this.handleServerError('Ошибка сети при сохранении задачи!');
        }
    }


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
                    }, 1000);
                });
            };

            const timeoutId = setTimeout(() => {
                if (resolved) return;
                resolved = true;
                cleanup().then(() => resolve(false));
            }, 30000); // 30 секунд

            confirmBtn.addEventListener('click', () => {
                if (resolved) return;
                resolved = true;
                clearTimeout(timeoutId);
                cleanup().then(() => resolve(true));
            });

            cancelBtn.addEventListener('click', () => {
                if (resolved) return;
                resolved = true;
                clearTimeout(timeoutId);
                cleanup().then(() => resolve(false));
            });
        });
    }


}


export class TaskFilter {
    constructor({tasksContainerId}) {
        this.container = document.getElementById(tasksContainerId);
        this.cards = Array.from(this.container.querySelectorAll('.task-card'));

        this.filters = {
            assignee: document.getElementById('filter-assignee'),
            priority: document.getElementById('filter-priority'),
            date: document.getElementById('filter-deadline'),
            status: document.getElementById('filter-status'),  // новый фильтр
        };

        this.tagContainer = document.querySelector('#dropdownMenu .p-2');
        this.dropdownToggle = document.getElementById('dropdownToggle');
        this.dropdownMenu = document.getElementById('dropdownMenu');

        this.populateAssigneeOptions();
        this.populateTagOptions();
        this.attachEvents();
        this.initTagDropdown();  // <--- вызываем здесь
    }

    populateAssigneeOptions() {
        const assigneeSelect = this.filters.assignee;
        if (!assigneeSelect || !window.username_data) return;

        // Удаляем все, кроме первого "все"
        while (assigneeSelect.options.length > 1) {
            assigneeSelect.remove(1);
        }

        window.username_data.forEach(user => {
            const option = document.createElement('option');
            option.value = user.username || user.first_name;
            option.textContent = user.first_name || user.username;
            assigneeSelect.appendChild(option);
        });
    }

    populateTagOptions() {
        if (!this.tagContainer || !window.tags_list) return;

        this.tagContainer.innerHTML = ''; // очистим контейнер

        window.tags_list.forEach(tag => {
            const label = document.createElement('label');
            label.className = 'flex items-center space-x-2 mb-1';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = tag.name || tag;
            checkbox.classList.add('tag-checkbox');

            const span = document.createElement('span');
            span.textContent = tag.name || tag;

            label.appendChild(checkbox);
            label.appendChild(span);
            this.tagContainer.appendChild(label);
        });

        // Обновим ссылку на чекбоксы тегов
        this.tagCheckboxes = Array.from(this.tagContainer.querySelectorAll('.tag-checkbox'));

    }

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

                this.applyFilters();
            });
        }
    }

    getSelectedTags() {
        return this.tagCheckboxes
            .filter(cb => cb.checked)
            .map(cb => cb.value.toLowerCase());
    }

    applyFilters() {
        const assigneeVal = this.filters.assignee?.value.trim().toLowerCase() || '';
        const priorityVal = this.filters.priority?.value.trim().toLowerCase() || '';
        const dateVal = this.filters.date?.value || '';  // asc/desc/пусто
        const statusVal = this.filters.status?.value || ''; // '' | 'true' | 'false'

        const selectedTags = this.getSelectedTags();

        // Фильтрация карточек по параметрам, включая статус по data-done
        let filteredCards = this.cards.filter(card => {
            const cardAssignee = (card.dataset.assignee || '').toLowerCase();
            const cardPriority = (card.dataset.priority || '').toLowerCase();
            const cardDone = (card.dataset.done || 'false').toLowerCase(); // ожидаем 'true' или 'false' как строки
            const cardTags = (card.dataset.tags || '').toLowerCase().split(',').map(t => t.trim()).filter(Boolean);

            const matchAssignee = !assigneeVal || cardAssignee === assigneeVal;
            const matchPriority = !priorityVal || cardPriority === priorityVal;
            const matchTags = selectedTags.length === 0 || selectedTags.every(t => cardTags.includes(t));
            // фильтр статуса по data-done: completed = done === 'true', pending = done !== 'true'
            const matchStatus = !statusVal ||
                (statusVal === 'true' ? cardDone === 'true' : cardDone !== 'true');

            return matchAssignee && matchPriority && matchTags && matchStatus;
        });

        // Сортировка по дате (если выбрана)
        if (dateVal === 'asc' || dateVal === 'desc') {
            filteredCards.sort((a, b) => {
                const dateA = new Date(a.dataset.deadline);
                const dateB = new Date(b.dataset.deadline);

                if (isNaN(dateA)) return 1;
                if (isNaN(dateB)) return -1;

                return dateVal === 'asc' ? dateA - dateB : dateB - dateA;
            });
        } else {
            // Сортировка по приоритету по умолчанию (например, от высокого к низкому)
            // Приоритеты: high > medium > low
            const priorityOrder = {'high': 1, 'medium': 2, 'low': 3};

            filteredCards.sort((a, b) => {
                const prioA = priorityOrder[a.dataset.priority?.toLowerCase()] || 99;
                const prioB = priorityOrder[b.dataset.priority?.toLowerCase()] || 99;

                if (prioA !== prioB) {
                    return prioA - prioB; // чем меньше значение, тем выше приоритет
                }

                // Если приоритет одинаковый — сортируем по дате дедлайна по возрастанию
                const dateA = new Date(a.dataset.deadline);
                const dateB = new Date(b.dataset.deadline);

                if (isNaN(dateA)) return 1;
                if (isNaN(dateB)) return -1;

                return dateA - dateB;
            });
        }
        // Перемещаем выполненные задачи в конец
        filteredCards.sort((a, b) => {
            const doneA = (a.dataset.done || 'false').toLowerCase();
            const doneB = (b.dataset.done || 'false').toLowerCase();

            if (doneA === 'true' && doneB !== 'true') return 1;
            if (doneA !== 'true' && doneB === 'true') return -1;
            return 0;
        });
        // Обновляем отображение карточек
        this.cards.forEach(card => card.classList.add('hidden'));
        filteredCards.forEach(card => card.classList.remove('hidden'));

        // Обновляем порядок карточек в контейнере
        filteredCards.forEach(card => this.container.appendChild(card));
    }


    initTagDropdown() {
        if (!this.dropdownToggle || !this.dropdownMenu) return;

        this.dropdownToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.dropdownMenu.classList.toggle('hidden');
        });

        // Закрыть меню, если клик вне его
        document.addEventListener('click', (e) => {
            if (!this.dropdownMenu.contains(e.target) && !this.dropdownToggle.contains(e.target)) {
                this.dropdownMenu.classList.add('hidden');
            }
        });
    }
}







import Choices from 'choices.js';
import 'choices.js/public/assets/styles/choices.min.css';


export class KanbanTasks {
    constructor({addButtonId, boardId, modalId}) {
        this.taskIdCounter = 1;
        this.tasks = {};  // храним задачи в объекте {id: taskData}

        this.addTaskBtn = document.getElementById(addButtonId);
        this.taskBoard = document.getElementById(boardId);
        this.taskModal = document.getElementById(modalId);
        this.taskForm = this.taskModal.querySelector('#task-form');
        this.cancelBtn = this.taskModal.querySelector('#cancel-btn');
        this.closeBtn = this.taskModal.querySelector('#close-modal');

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

        this.tagsSelect = new Choices(select, {
            removeItemButton: true,
            duplicateItemsAllowed: false,
            addItems: true,
            addItemFilter: value => value.trim().length > 0,
            addChoices: true,
            searchEnabled: true,
            shouldSort: false,
            placeholderValue: 'Введите или выберите теги...',
            choices: [
                {value: 'frontend', label: 'frontend'},
                {value: 'backend', label: 'backend'},
                {value: 'urgent', label: 'urgent'}
            ]
        });


        // Клик по карточке открывает модалку для редактирования
        this.taskBoard.addEventListener('click', (e) => {
            const card = e.target.closest('.task-card');
            if (card) {
                const id = card.dataset.cardId;
                this.openModal(id);
            }
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
                const tagsArray = task.tags ? task.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
                // Удаляем выбранные теги в виджете
                this.tagsSelect.removeActiveItems();

                // Добавляем выбранные теги
                tagsArray.forEach(tag => {
                    this.tagsSelect.setChoiceByValue(tag);
                });
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
                const label = user.first_name?.trim() ? user.first_name : user.username;

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
    }

    saveTask() {
        const formData = new FormData(this.taskForm);
        const taskData = {
            title: formData.get('title'),
            desc: formData.get('desc'),
            deadline: formData.get('deadline'),
            priority: formData.get('priority'),
            assignee: formData.get('assignee'),
            tags: this.tagsSelect ? this.tagsSelect.getValue(true).join(',') : '', // getValue(true) — вернёт массив строк значений
            done: formData.get('done') === 'on',
        };

        if (this.currentEditId) {

            // Обновить задачу
            this.tasks[this.currentEditId] = taskData;
            this.renderTaskCard(this.currentEditId, taskData, true);

        } else {
            // Создать новую задачу
            const id = this.taskIdCounter++;
            this.tasks[id] = taskData;
            this.renderTaskCard(id, taskData);
        }

        this.closeModal();
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
            assigneeEl.textContent = 'Исполнитель: ' + taskData.assignee;
            card.appendChild(assigneeEl);
        }

        // Теги
        if (taskData.tags) {
            const tagsEl = document.createElement('div');
            tagsEl.className = 'text-xs mb-1 flex flex-wrap gap-1';

            const tagColors = ['text-red-500', 'text-green-500', 'text-blue-500', 'text-yellow-600', 'text-purple-500'];
            const tagsArray = taskData.tags.split(',').map(tag => tag.trim()).filter(Boolean);

            tagsArray.forEach((tag, index) => {
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


}

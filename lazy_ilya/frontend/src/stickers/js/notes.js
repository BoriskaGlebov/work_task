import Sortable from 'sortablejs';
import {showError} from "./utils.js";

/**
 * Класс для управления стикерами (заметками) в стиле Kanban.
 * Поддерживает создание, редактирование, удаление и сортировку заметок с синхронизацией с сервером.
 */
export class KanbanStickyNotes {
    /**
     * @param {Object} config
     * @param {string} config.addButtonId - ID кнопки для добавления новой заметки.
     * @param {string} config.boardId - ID контейнера доски, куда добавляются заметки.
     * @param {string[]} [config.colors=[]] - Список цветов для новых заметок.
     */
    constructor({addButtonId, boardId, colors = []}) {
        this.addCardBtn = document.getElementById(addButtonId);
        this.noteBoard = document.getElementById(boardId);
        this.csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        this.colors = colors.length ? colors : ['#FFEB3B', '#FFCDD2', '#C8E6C9', '#BBDEFB', '#FFF9C4', '#FFE0B2'];

        this.addCardBtn.addEventListener('click', () => this.showColorPicker());

        this.authors = [
            username,
            ...username_data
                .filter(user => user.username !== username && user.first_name !== username)
                .map(user => user.first_name.trim() !== '' ? user.first_name : user.username),
            'Всем!'
        ];
        this.currentAuthorIndex = 0;
        this.noteData = notes_data;

        this.initSortable();
    }

    /**
     * Инициализирует drag-and-drop сортировку с помощью библиотеки Sortable.js.
     */
    initSortable() {
        Sortable.create(this.noteBoard, {
            animation: 500,
            handle: '.note-card',
            ghostClass: 'opacity-50',
            onEnd: () => this.updateNoteOrders(),
        });
    }

    /**
     * Загружает заметки из переданных данных при инициализации.
     */
    loadInitialNotes() {
        if (Array.isArray(this.noteData)) {
            this.noteData.forEach(note => this.buildNoteCard(note));
        }
    }

    /**
     * Показывает всплывающее меню выбора цвета для новой заметки.
     */
    showColorPicker() {
        if (document.getElementById('color-picker')) return;

        const picker = document.createElement('div');
        picker.id = 'color-picker';
        picker.className = 'fixed bottom-25 right-7 bg-white p-2.5 rounded-lg shadow-md flex gap-2.5 z-[9999]';

        this.colors.forEach(color => {
            const colorBtn = document.createElement('div');
            colorBtn.style.backgroundColor = color;
            colorBtn.className = 'w-7.5 h-7.5 rounded-md cursor-pointer';
            colorBtn.title = color;

            colorBtn.addEventListener('click', () => {
                this.buildNoteCard({color});
                picker.remove();
            });

            picker.appendChild(colorBtn);
        });

        document.body.appendChild(picker);

        const onClickOutside = (e) => {
            if (!picker.contains(e.target)) {
                picker.remove();
                document.removeEventListener('click', onClickOutside);
            }
        };
        setTimeout(() => document.addEventListener('click', onClickOutside), 0);
    }

    /**
     * Создаёт HTML-элемент заметки и добавляет его на доску.
     *
     * @param {Object} noteData - Данные заметки.
     * @param {string} [currentUser=username] - Текущий пользователь.
     * @returns {HTMLElement} Созданная заметка.
     */
    buildNoteCard(noteData, currentUser = username) {
    const {
        id,
        text = 'Новая заметка...',
        color = '#FFEB3B',
        author_name = this.authors[0],
        owner = username,
        order,
        width,
        height,
    } = noteData;

    const noteCard = document.createElement('div');
    noteCard.className = `note-card`;
    noteCard.style.backgroundColor = color;
    if (width) noteCard.style.width = `${width}px`;
    if (height) noteCard.style.height = `${height}px`;

    if (id !== undefined) noteCard.setAttribute('data-id', id);
    if (owner !== undefined) noteCard.setAttribute('data-user', owner);
    noteCard.setAttribute('data-order', order ?? [...this.noteBoard.children].length);

    // Автор
    const authorBtn = document.createElement('button');
    authorBtn.className = 'relative author-btn';
    authorBtn.textContent = author_name;

    let authorIndex = this.authors.indexOf(author_name);
    if (authorIndex === -1) authorIndex = 0;

    const dropdown = document.createElement('div');
    dropdown.className = `dropdown absolute z-50 bg-white border rounded-xl shadow transition-all duration-200 origin-top opacity-0 scale-y-0 invisible`;
    document.body.appendChild(dropdown);

    // Авто-скрытие через 10 сек
    let authorDropdownTimeout;

    const resetAuthorDropdownTimeout = () => {
        clearTimeout(authorDropdownTimeout);
        authorDropdownTimeout = setTimeout(() => {
            hideDropdown();
        }, 5000);
    };

    const showDropdown = () => {
        const rect = authorBtn.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom + 4 + window.scrollY}px`;
        dropdown.style.left = `${rect.right - dropdown.offsetWidth + window.scrollX}px`;

        dropdown.classList.remove('opacity-0', 'scale-y-0', 'invisible');
        dropdown.classList.add('opacity-100', 'scale-y-100', 'visible');

        resetAuthorDropdownTimeout();
    };

    const hideDropdown = () => {
        clearTimeout(authorDropdownTimeout);
        dropdown.classList.add('opacity-0', 'scale-y-0', 'invisible');
        dropdown.classList.remove('opacity-100', 'scale-y-100', 'visible');
    };

    this.authors.forEach(name => {
        const option = document.createElement('div');
        option.className = 'px-2 py-1 hover:bg-gray-200 cursor-pointer';
        option.textContent = name;
        option.addEventListener('click', () => {
            authorBtn.textContent = name;
            authorIndex = this.authors.indexOf(name);
            hideDropdown();
            this.sendNoteUpdate(noteCard);
        });
        dropdown.appendChild(option);
    });

    if (currentUser === owner) {
        authorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const hidden = dropdown.classList.contains('invisible');
            hidden ? showDropdown() : hideDropdown();
            resetAuthorDropdownTimeout();
        });
    } else {
        authorBtn.disabled = true;
        authorBtn.title = 'Вы не можете менять автора этой заметки';
    }

    dropdown.addEventListener('mouseenter', resetAuthorDropdownTimeout);

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !authorBtn.contains(e.target)) {
            hideDropdown();
        }
    });

    const authorContainer = document.createElement('div');
    authorContainer.className = 'flex justify-end mb-1';
    authorContainer.appendChild(authorBtn);

    // Контент
    const contentDiv = document.createElement('div');
    contentDiv.setAttribute('contenteditable', 'true');
    contentDiv.setAttribute('spellcheck', 'false');
    contentDiv.className = 'content-area flex-1 overflow-y-auto outline-none max-h-[1000px] overflow-y-auto';
    contentDiv.innerHTML = text;

    contentDiv.addEventListener('blur', () => {
        this.sendNoteUpdate(noteCard);
    });

    // Удаление
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Удалить заметку';
    deleteBtn.className = 'delete-btn';

    if (currentUser === owner || currentUser === author_name) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const noteId = noteCard.getAttribute('data-id');
            if (noteId) {
                this.deleteNoteFromServer(noteId);
                noteCard.remove();
            } else {
                noteCard.remove();
            }
        });
    } else {
        deleteBtn.disabled = true;
        deleteBtn.title = 'Вы не можете удалить заметку, вы ее не создавали';
    }

    // Сборка карточки
    noteCard.appendChild(authorContainer);
    noteCard.appendChild(contentDiv);
    noteCard.appendChild(deleteBtn);

    noteCard.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-btn')) contentDiv.focus();
    });

    contentDiv.addEventListener('input', () => {
        noteCard.style.height = ''; // убираем фиксированный размер
        noteCard.style.width = '';
    });

    this.noteBoard.appendChild(noteCard);

    if (!id) {
        this.sendNoteCreate(noteCard, {
            text: contentDiv.innerHTML,
            color: noteCard.style.backgroundColor,
            author_name: authorBtn.textContent
        });
    }

    return noteCard;
}


    /**
     * Отправляет запрос на создание новой заметки.
     *
     * @param {HTMLElement} noteCard
     * @param {Object} data
     */
    async sendNoteCreate(noteCard, data) {
        const payload = {
            text: data.text,
            color: data.color,
            author_name: data.author_name,
            width: noteCard.offsetWidth,
            height: noteCard.offsetHeight,
            order: [...this.noteBoard.children].indexOf(noteCard),
        };

        try {
            const response = await fetch('', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken,
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (!response.ok) throw result;

            const createdNote = result.data ?? result;
            noteCard.setAttribute('data-id', createdNote.id);
            noteCard.setAttribute('data-user', username);

            this.showSuccessMessage(`Заметка создана: ${createdNote.id}`);
        } catch (errorData) {
            this.handleServerError(errorData, 'Не удалось создать заметку');
        }
    }

    /**
     * Отправляет PATCH-запрос на обновление заметки.
     *
     * @param {HTMLElement} noteCard
     */
    async sendNoteUpdate(noteCard) {
        const noteId = noteCard.getAttribute('data-id');
        if (!noteId) return;

        const contentDiv = noteCard.querySelector('[contenteditable]');
        const authorBtn = noteCard.querySelector('.author-btn');
        const order = [...this.noteBoard.children].indexOf(noteCard);

        const payload = {
            id: noteId,
            text: contentDiv.innerHTML,
            color: noteCard.style.backgroundColor,
            author_name: authorBtn.textContent,
            width: noteCard.offsetWidth,
            height: noteCard.offsetHeight,
            order,
        };

        try {
            const response = await fetch(``, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken,
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (!response.ok) throw result;

            noteCard.setAttribute('data-order', order);
            // this.showSuccessMessage(`Заметка ${noteId} обновлена`);
        } catch (errorData) {
            this.handleServerError(errorData, 'Не удалось обновить заметку');
        }
    }

    /**
     * Удаляет заметку с сервера по ID.
     *
     * @param {string} noteId
     */
    async deleteNoteFromServer(noteId) {
        try {
            const response = await fetch(`${noteId}/`, {
                method: 'DELETE',
                headers: {'X-CSRFToken': this.csrfToken},
            });

            if (!response.ok) throw await response.json();

            const noteCard = this.noteBoard.querySelector(`[data-id="${noteId}"]`);
            if (noteCard) noteCard.remove();

            this.showSuccessMessage(`Заметка ${noteId} удалена`);
        } catch (errorData) {
            this.handleServerError(errorData, 'Не удалось удалить заметку');
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
     * Обновляет порядок заметок на доске и отправляет обновления на сервер.
     */
    updateNoteOrders() {
        [...this.noteBoard.children].forEach((noteCard, index) => {
            const currentOrder = parseInt(noteCard.getAttribute('data-order'));
            if (currentOrder !== index) {
                noteCard.setAttribute('data-order', index);
                this.sendNoteUpdate(noteCard);
            }
        });
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
                    showError(`Ошибка в поле "${field}" - "${message}"`);
                });
            }
        } else {
            showError(fallbackMessage);
        }
    }
}


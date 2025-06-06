import Sortable from 'sortablejs';
import {showError} from "./utils.js";

export class KanbanStickyNotes {
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

    initSortable() {
        Sortable.create(this.noteBoard, {
            animation: 500,
            handle: '.note-card',
            ghostClass: 'opacity-50',
        });
    }

    loadInitialNotes() {
        if (Array.isArray(this.noteData)) {
            this.noteData.forEach(note => this.buildNoteCard(note));
        }
    }

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
        noteCard.classList.add('note-card');
        noteCard.style.backgroundColor = color;
        if (width) noteCard.style.width = `${width}px`;
        if (height) noteCard.style.height = `${height}px`;

        if (id !== undefined) noteCard.setAttribute('data-id', id);
        if (owner !== undefined) noteCard.setAttribute('data-user', owner);

        const authorBtn = document.createElement('button');
        authorBtn.className = 'author-btn';
        authorBtn.textContent = author_name;

        let authorIndex = this.authors.indexOf(author_name);
        if (authorIndex === -1) authorIndex = 0;

        if (currentUser === owner) {
            authorBtn.addEventListener('click', () => {
                authorIndex = (authorIndex + 1) % this.authors.length;
                authorBtn.textContent = this.authors[authorIndex];
            });
        } else {
            authorBtn.disabled = true;
            authorBtn.title = 'Вы не можете менять автора этой заметки';
        }

        const authorContainer = document.createElement('div');
        authorContainer.className = 'flex justify-end mb-1';
        authorContainer.appendChild(authorBtn);

        const contentDiv = document.createElement('div');
        contentDiv.setAttribute('contenteditable', 'true');
        contentDiv.setAttribute('spellcheck', 'false');
        contentDiv.className = 'outline-none';
        contentDiv.innerHTML = text;

        contentDiv.addEventListener('blur', () => {
            this.sendNoteUpdate(noteCard);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.title = 'Удалить заметку';
        deleteBtn.className = 'delete-btn';

        if (currentUser === owner || currentUser === author_name) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const noteId = noteCard.getAttribute('data-id');
                if (noteId) this.deleteNoteFromServer(noteId);
                noteCard.remove();
            });
        } else {
            deleteBtn.disabled = true;
            deleteBtn.title = 'Вы не можете удалить заметку, вы ее не создавали';
        }

        noteCard.appendChild(authorContainer);
        noteCard.appendChild(contentDiv);
        noteCard.appendChild(deleteBtn);

        noteCard.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-btn')) contentDiv.focus();
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
            if (!response.ok) {
                // Ошибка с бэка, пробрасываем объект
                throw result;
            }
            const createdNote = result.data ?? result;

            noteCard.setAttribute('data-id', createdNote.id);
            noteCard.setAttribute('data-user', username); // сохранить владельца

            this.showSuccessMessage(`Заметка создана: ${createdNote.id}`);
            console.log('Заметка создана:', createdNote);

        } catch (errorData) {
            console.error('Ошибка при создании заметки:', errorData);

            if (errorData?.errors) {
                for (const [field, messages] of Object.entries(errorData.errors)) {
                    messages.forEach(message => {
                        showError(`Ошибка в поле "${field}" - "${message}"`);
                    });
                }
            } else {
                showError('Не удалось создать заметку');
            }
        }
    }


    sendNoteUpdate(noteCard) {
        // Здесь будет отправка на сервер
        console.log('Обновить заметку:', noteCard);
    }

    deleteNoteFromServer(noteId) {
        // Здесь будет удаление на сервере
        console.log('Удалить заметку с ID:', noteId);
    }

    /**
     * Показывает временное всплывающее сообщение на странице (например, об успешном действии).
     *
     * Сообщение плавно появляется с анимацией, отображается 5 секунд и затем исчезает.
     * Используются классы TailwindCSS и анимации: `flex`, `hidden`, `animate-popup`, `animate-popup-reverse`.
     *
     * @param {string} message - Текст сообщения, который будет показан в блоке `#server-info`.
     */
    showSuccessMessage(message) {
        const serverInfo = document.getElementById('server-info');
        serverInfo.classList.remove('hidden', 'animate-popup-reverse');
        serverInfo.classList.add('flex', 'animate-popup');
        serverInfo.querySelector('p').textContent = message;
        serverInfo.scrollIntoView({behavior: 'smooth', block: 'start'});

        setTimeout(() => {
            serverInfo.classList.remove('animate-popup');
            serverInfo.classList.add('animate-popup-reverse');
            setTimeout(() => {
                serverInfo.classList.add('hidden');
                serverInfo.classList.remove('flex', 'animate-popup-reverse');
            }, 1000);
        }, 5000);
    }
}

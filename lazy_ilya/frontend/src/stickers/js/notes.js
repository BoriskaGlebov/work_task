import Sortable from 'sortablejs';
import { showError } from "./utils.js";

export class KanbanStickyNotes {
    constructor({ addButtonId, boardId, colors = [] }) {
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
                this.buildNoteCard({ color });
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

    buildNoteCard(noteData, onCreate, currentUser = username) {
        const {
            id,
            text = 'Новая заметка...',
            color = '#FFEB3B',
            author = this.authors[0],
            user = username,
        } = noteData;

        const noteCard = document.createElement('div');
        noteCard.classList.add('note-card');
        noteCard.style.backgroundColor = color;

        if (id !== undefined) noteCard.setAttribute('data-id', id);
        if (user !== undefined) noteCard.setAttribute('data-user', user);

        const authorBtn = document.createElement('button');
        authorBtn.className = 'author-btn';
        authorBtn.textContent = author;

        let authorIndex = this.authors.indexOf(author);
        if (authorIndex === -1) authorIndex = 0;

        if (currentUser === user) {
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

        if (currentUser === user || currentUser === author) {
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

        if (typeof onCreate === 'function') {
            onCreate(noteCard, {
                text: contentDiv.innerHTML,
                color: noteCard.style.backgroundColor,
                author: authorBtn.textContent
            });
        }

        return noteCard;
    }

    sendNoteUpdate(noteCard) {
        // Здесь будет отправка на сервер
        console.log('Обновить заметку:', noteCard);
    }

    deleteNoteFromServer(noteId) {
        // Здесь будет удаление на сервере
        console.log('Удалить заметку с ID:', noteId);
    }
}

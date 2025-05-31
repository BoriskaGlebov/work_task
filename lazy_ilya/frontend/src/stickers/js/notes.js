import {showError} from "../../file_creator/js/utils.js";

/**
 * Класс для управления доской стикеров Kanban с возможностью создания,
 * перетаскивания, редактирования и удаления заметок.
 */
export class KanbanStickyNotes {
    /**
     * @param {Object} options
     * @param {string} options.addButtonId - ID кнопки добавления новой заметки
     * @param {string} options.boardId - ID контейнера доски заметок
     * @param {string[]} [options.colors] - Массив цветов для заметок (опционально)
     */
    constructor({addButtonId, boardId, colors = []}) {
        /** Счётчик ID для заметок */
        this.noteIdCounter = 1;

        /** Кнопка добавления новой заметки */
        this.addCardBtn = document.getElementById(addButtonId);

        /** Контейнер доски заметок */
        this.noteBoard = document.getElementById(boardId);
        /** @type {string} */
        this.csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        /** Цвета заметок. Если не заданы, используются дефолтные */
        this.colors = colors.length
            ? colors
            : ['#FFEB3B', '#FFCDD2', '#C8E6C9', '#BBDEFB', '#FFF9C4', '#FFE0B2'];

        // Устанавливаем relative позиционирование доски для абсолютного позиционирования карточек
        this.noteBoard.classList.add('relative');

        // Назначаем обработчик клика на кнопку добавления новой заметки
        this.addCardBtn.addEventListener('click', () => this.showColorPicker());

        /** Переменная для хранения текущей перетаскиваемой заметки */
        this.draggedNote = null;

        /** Смещение курсора по X при перетаскивании */
        this.dragOffsetX = 0;

        /** Смещение курсора по Y при перетаскивании */
        this.dragOffsetY = 0;
        // Добавим список имён и индекс для поочередного переключения
        this.authors = [username, 'Всем!'];
        this.currentAuthorIndex = 0;
        this.noteData = notes_data;

        // Привязываем методы для обработки движения мыши и отпускания кнопки к контексту
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

    }

    loadInitialNotes() {
        if (Array.isArray(this.noteData)) {
            this.noteData.forEach(note => this.createNoteFromData(note));
        }
    }


    /**
     * Показывает палитру выбора цвета для новой заметки.
     * При выборе цвета создаётся новая заметка нужного цвета.
     */
    showColorPicker() {
        // Если палитра уже открыта, ничего не делаем
        if (document.getElementById('color-picker')) return;

        // Создаём контейнер палитры
        const picker = document.createElement('div');
        picker.id = 'color-picker';

        // Классы Tailwind для внешнего вида палитры
        picker.className = 'fixed bottom-25 right-7 bg-white p-2.5 rounded-lg shadow-md flex gap-2.5 z-[9999]';

        // Создаём кнопки для каждого цвета
        this.colors.forEach(color => {
            const colorBtn = document.createElement('div');
            colorBtn.style.backgroundColor = color;
            colorBtn.className = 'w-7.5 h-7.5 rounded-md cursor-pointer'; // 30px × 30px
            colorBtn.title = color;

            // При клике создаём заметку нужного цвета и закрываем палитру
            colorBtn.addEventListener('click', () => {
                this.addNoteCard(color);
                picker.remove();
            });

            picker.appendChild(colorBtn);
        });

        document.body.appendChild(picker);

        // Закрываем палитру, если кликнули вне неё
        const onClickOutside = (e) => {
            if (!picker.contains(e.target)) {
                picker.remove();
                document.removeEventListener('click', onClickOutside);
            }
        };
        // Добавляем слушатель с задержкой, чтобы не сразу закрывать палитру при клике по кнопке
        setTimeout(() => document.addEventListener('click', onClickOutside), 0);
    }

    /**
     * Отслеживает изменение размера заметки и при необходимости увеличивает
     * высоту доски, чтобы заметка не выходила за её пределы.
     * @param {HTMLElement} noteCard - элемент заметки
     */
    observeNoteResize(noteCard) {
        const observer = new ResizeObserver(() => {
            const noteBottom = noteCard.offsetTop + noteCard.offsetHeight;
            const boardHeight = this.noteBoard.offsetHeight;

            if (noteBottom + 20 > boardHeight) {
                this.noteBoard.style.height = `${noteBottom + 20}px`;
            }
        });

        observer.observe(noteCard);
    }


    /**
     * Обработчик начала перетаскивания заметки.
     * Позволяет перемещать заметку по доске, если курсор не в правом нижнем углу.
     * @param {MouseEvent} e - событие мыши
     * @param {HTMLElement} noteCard - заметка, которую перетаскиваем
     */
    onMouseDown(e, noteCard) {
        // Если кликнули по кнопке удаления — не перетаскиваем
        if (e.target.classList.contains('delete-btn')) return;

        // Определяем позицию клика относительно заметки
        const noteRect = noteCard.getBoundingClientRect();
        const offsetX = e.clientX - noteRect.left;
        const offsetY = e.clientY - noteRect.top;

        // Если курсор в правом нижнем углу (зона resize 20x20 px), не перетаскиваем
        const isNearBottomRightCorner =
            offsetX > noteRect.width - 20 && offsetY > noteRect.height - 20;

        if (isNearBottomRightCorner) return;

        e.preventDefault();

        // Запоминаем, что мы перетаскиваем эту заметку и смещение курсора внутри неё
        this.draggedNote = noteCard;
        this.dragOffsetX = offsetX;
        this.dragOffsetY = offsetY;

        // Добавляем слушатели движения мыши и отпускания кнопки
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);

        noteCard.classList.add('dragging');
    }

    /**
     * Обработчик движения мыши во время перетаскивания заметки.
     * Обновляет позицию заметки, ограничивая её доской.
     * @param {MouseEvent} e - событие мыши
     */
    onMouseMove(e) {
        if (!this.draggedNote) return;

        e.preventDefault();

        // Получаем размеры доски
        const boardRect = this.noteBoard.getBoundingClientRect();

        // Вычисляем новые координаты заметки относительно доски
        let newLeft = e.clientX - boardRect.left - this.dragOffsetX;
        let newTop = e.clientY - boardRect.top - this.dragOffsetY;

        // Ограничиваем движение заметки по доске
        const maxLeft = boardRect.width - this.draggedNote.offsetWidth;
        const maxTop = boardRect.height - this.draggedNote.offsetHeight;

        newLeft = Math.min(Math.max(0, newLeft), maxLeft);
        newTop = Math.min(Math.max(0, newTop), maxTop);

        // Обновляем позицию заметки
        this.draggedNote.style.left = `${newLeft}px`;
        this.draggedNote.style.top = `${newTop}px`;
    }

    /**
     * Обработчик отпускания кнопки мыши — завершает перетаскивание.
     * Убирает слушатели и класс перетаскивания.
     * @param {MouseEvent} e - событие мыши
     */
    onMouseUp(e) {
        if (!this.draggedNote) return;

        // Убираем слушатели движения и отпускания мыши
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);

        // Убираем класс, указывающий на перетаскивание
        this.draggedNote.classList.remove('dragging');

        // Отправляем обновление позиции на сервер
        this.sendNoteUpdate(this.draggedNote);

        // Сбрасываем текущую перетаскиваемую заметку
        this.draggedNote = null;
    }

    /**
     * Создаёт DOM-элемент заметки и добавляет его на доску.
     * Используется как для новых, так и для существующих заметок.
     * @param {Object} noteData - данные заметки
     * @param {number} [noteData.id] - ID заметки (если есть)
     * @param {string} noteData.text - Текст заметки
     * @param {string} noteData.color - Цвет заметки
     * @param {number} noteData.position_top - Положение сверху
     * @param {number} noteData.position_left - Положение слева
     * @param {string} noteData.author - Имя автора
     * @param {Function} [onCreate] - Колбэк при создании (например, когда сервер возвращает ID)
     * @param currentUser
     */
    buildNoteCard(noteData, onCreate, currentUser) {
        const {
            id,
            text = 'Новая заметка...',
            color = '#FFEB3B',
            position_top = 100,
            position_left = 100,
            author = this.authors[0]
        } = noteData;

        const noteCard = document.createElement('div');
        noteCard.classList.add('note-card');
        noteCard.style.backgroundColor = color;
        noteCard.style.position = 'absolute';
        noteCard.style.top = `${position_top}px`;
        noteCard.style.left = `${position_left}px`;

        if (id !== undefined) {
            noteCard.setAttribute('data-id', id);
        }

        // Автор
        const authorBtn = document.createElement('button');
        authorBtn.className = 'author-btn';
        authorBtn.textContent = author;

        let authorIndex = this.authors.indexOf(author);
        if (authorIndex === -1) authorIndex = 0;
        console.log(author);
        console.log(currentUser);
        if (author === currentUser) {
            authorBtn.addEventListener('click', () => {
                authorIndex = (authorIndex + 1) % this.authors.length;
                authorBtn.textContent = this.authors[authorIndex];
            });
        } else {
            // Сделать кнопку неактивной, чтобы было видно, что менять нельзя
            authorBtn.disabled = true;
            authorBtn.title = 'Вы не можете менять автора этой заметки';
        }

        // authorBtn.addEventListener('click', () => {
        //     authorIndex = (authorIndex + 1) % this.authors.length;
        //     authorBtn.textContent = this.authors[authorIndex];
        // });

        const authorContainer = document.createElement('div');
        authorContainer.style.display = 'flex';
        authorContainer.style.justifyContent = 'flex-end';
        authorContainer.style.marginBottom = '4px';
        authorContainer.appendChild(authorBtn);

        // Текст
        const contentDiv = document.createElement('div');
        contentDiv.setAttribute('contenteditable', 'true');
        contentDiv.setAttribute('spellcheck', 'false');
        contentDiv.classList.add('outline-none');
        contentDiv.textContent = text;

        contentDiv.addEventListener('blur', () => {
            this.sendNoteUpdate(noteCard); // отправка обновлений
        });

        // Удаление
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.title = 'Удалить заметку';
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-btn';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const noteId = noteCard.getAttribute('data-id');
            if (noteId) {
                this.deleteNoteFromServer(noteId);
            }
            noteCard.remove();
        });

        noteCard.appendChild(authorContainer);
        noteCard.appendChild(contentDiv);
        noteCard.appendChild(deleteBtn);

        noteCard.addEventListener('mousedown', (e) => this.onMouseDown(e, noteCard));
        noteCard.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-btn')) {
                contentDiv.focus();
            }
        });

        this.noteBoard.appendChild(noteCard);
        this.observeNoteResize(noteCard);

        // Передаём наружу, если нужен ID после отправки
        if (typeof onCreate === 'function') {
            onCreate(noteCard, {
                text: contentDiv.textContent,
                color: noteCard.style.backgroundColor,
                position_top: parseFloat(noteCard.style.top),
                position_left: parseFloat(noteCard.style.left),
                author: authorBtn.textContent
            });
        }
        return noteCard;
    }


    /**
     * Создаёт и добавляет новую заметку на доску.
     * @param {string} [color] - Цвет заметки (по умолчанию жёлтый)
     */
    addNoteCard(color) {
        const rect = this.noteBoard.getBoundingClientRect();
        const position_top = rect.height / 2 - 50;
        const position_left = rect.width / 2 - 140;

        const noteCard = this.buildNoteCard({
            text: 'Новая заметка...',
            color: color || '#FFEB3B',
            position_top,
            position_left,
            author: this.authors[this.currentAuthorIndex]
        }, (noteCard, dataToSend) => {
            this.sendNoteToServer(dataToSend, (createdNote) => {
                noteCard.setAttribute('data-id', createdNote.id);
            });
        },username);

        // Фокус на текст сразу
        noteCard.querySelector('[contenteditable]').focus();
    }

    /**
     * Создаёт заметку из данных (например, полученных с сервера)
     * @param {Object} noteData - данные заметки
     * @param {number} noteData.id - уникальный ID заметки
     * @param {string} noteData.text - содержимое заметки
     * @param {string} noteData.color - цвет заметки
     * @param {number} noteData.position_top - позиция сверху
     * @param {number} noteData.position_left - позиция слева
     * @param {string} noteData.author - автор заметки
     */
    createNoteFromData(noteData) {
        this.buildNoteCard(noteData,undefined,username);
    }

    /**
     * Отправляет изменения заметки на сервер
     * @param {HTMLElement} noteCard
     */
    sendNoteUpdate(noteCard) {
        const id = noteCard.getAttribute('data-id');
        const text = noteCard.querySelector('[contenteditable]').textContent;
        const color = noteCard.style.backgroundColor;
        const position_top = parseInt(noteCard.style.top, 10);
        const position_left = parseInt(noteCard.style.left, 10);
        const author = noteCard.querySelector("button").textContent;

        const data = {
            id,
            text,
            color,
            position_top,
            position_left,
            author
        };

        // Пример отправки через fetch
        fetch('', {
            method: 'PATCH', // или 'PUT'
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.csrfToken,
            },
            body: JSON.stringify(data)
        })
            .then(async response => {
                const responseData = await response.json();

                if (!response.ok) {
                    // Если сервер вернул ошибку, выбрасываем исключение с сообщением из тела
                    console.log(responseData)
                    throw new Error(responseData.error || JSON.stringify(responseData.errors) || 'Ошибка при обновлении заметки');
                }

                return responseData;
            })
            .then(result => {
                console.log('Заметка обновлена:', result);
                this.showSuccessMessage(`Заметка с текстом "${result.note.text}" обновлена`);
            })
            .catch(error => {
                console.error('Ошибка:', error.message);
                showError(error.message);  // тут вызывай свою функцию показа ошибки
            });

    }

    sendNoteToServer(noteData, onSuccess) {
        fetch('', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.csrfToken, // если Django
            },
            body: JSON.stringify(noteData)
        })
            .then(response => {
                if (!response.ok) throw new Error('Ошибка при создании заметки');
                return response.json();
            })
            .then(createdNote => {
                console.log('Заметка создана:', createdNote);
                if (typeof onSuccess === 'function') {
                    onSuccess(createdNote.note);
                }
                this.showSuccessMessage(`Заметка создана: ${createdNote.note.text} `);
            })
            .catch(error => {
                console.error('Ошибка отправки:', error);
            });
    }

    /**
     * Отправляет DELETE-запрос на сервер для удаления заметки.
     * @param {number|string} id - ID заметки
     */
    deleteNoteFromServer(id) {
        fetch(`${id}`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': this.csrfToken, // если Django
            },
        })
            .then(response => {
                return response.json().then(data => {
                    if (!response.ok) {
                        // Если ошибка, выбрасываем исключение с сообщением из data
                        throw new Error(data.error || 'Ошибка при удалении заметки');
                    }
                    return data;
                });
            })
            .then(data => {
                // Здесь data — это распарсенный JSON от сервера
                this.showSuccessMessage(data.message || `Заметка с ID ${id} успешно удалена с сервера`);
                console.log(`Заметка с ID ${id} успешно удалена с сервера`);
            })
            .catch(error => {
                console.error('Ошибка при удалении:', error.message);
                showError(error);
            });
    }


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

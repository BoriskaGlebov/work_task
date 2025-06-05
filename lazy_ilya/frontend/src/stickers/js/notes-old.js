import {showError} from "./utils.js";


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
        // window.addEventListener('resize', () => this.adjustNotesInsideBoard());
        /** Переменная для хранения текущей перетаскиваемой заметки */
        this.draggedNote = null;

        /** Смещение курсора по X при перетаскивании */
        this.dragOffsetX = 0;

        /** Смещение курсора по Y при перетаскивании */
        this.dragOffsetY = 0;
        // Добавим список имён и индекс для поочередного переключения
        this.authors = [
            username,
            ...username_data
                .filter(user => user.username !== username && user.first_name !== username)
                .map(user => user.first_name.trim() !== '' ? user.first_name : user.username),
            'Всем!'
        ];
        this.currentAuthorIndex = 0;
        this.noteData = notes_data;

        // Привязываем методы для обработки движения мыши и отпускания кнопки к контексту
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

    }

    /**
     * Загружает начальные заметки с данными из `this.noteData`.
     *
     * Метод проверяет, является ли `this.noteData` массивом, и если да —
     * создает DOM-элементы для каждой заметки, используя метод `createNoteFromData`.
     * Предполагается, что `noteData` уже содержит валидные объекты заметок с нужными полями.
     *
     * Этот метод можно вызывать при инициализации доски, чтобы отобразить
     * все сохранённые или загруженные заметки.
     */
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

        const boardRect = this.noteBoard.getBoundingClientRect();
        const cardRect = this.draggedNote.getBoundingClientRect();

        let newLeft = e.clientX - boardRect.left - this.dragOffsetX;
        let newTop = e.clientY - boardRect.top - this.dragOffsetY;

        // Ограничения в пикселях
        const maxLeft = boardRect.width - cardRect.width;
        const maxTop = boardRect.height - cardRect.height;

        newLeft = Math.min(Math.max(0, newLeft), maxLeft);
        newTop = Math.min(Math.max(0, newTop), maxTop);

        // 🔥 Вычисляем %, ограничивая так, чтобы весь блок оставался в пределах
        const leftPercent = (newLeft / (boardRect.width - cardRect.width)) * (100 - (cardRect.width / boardRect.width) * 100);
        const topPercent = (newTop / (boardRect.height - cardRect.height)) * (100 - (cardRect.height / boardRect.height) * 100);

        this.draggedNote.style.left = `${leftPercent}%`;
        this.draggedNote.style.top = `${topPercent}%`;
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
            author = this.authors[0],
            user,
        } = noteData;

        const noteCard = document.createElement('div');
        noteCard.classList.add('note-card');
        noteCard.style.backgroundColor = color;
        noteCard.style.position = 'absolute';
        noteCard.style.top = `${position_top}%`;
        noteCard.style.left = `${position_left}%`;

        if (id !== undefined) {
            noteCard.setAttribute('data-id', id);
        }
        if (user !== undefined) {
            noteCard.setAttribute('data-user', user);
        }

        // Автор
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
        contentDiv.innerHTML = text;

        contentDiv.addEventListener('blur', () => {
            this.sendNoteUpdate(noteCard); // отправка обновлений
        });

        // Удаление
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.title = 'Удалить заметку';
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-btn';
        if (currentUser === user || currentUser === author) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const noteId = noteCard.getAttribute('data-id');
                if (noteId) {
                    this.deleteNoteFromServer(noteId);
                }
                noteCard.remove();
            });
        } else {
            // Сделать кнопку неактивной, чтобы было видно, что менять нельзя
            deleteBtn.disabled = true;
            deleteBtn.title = 'Вы не можете удалить заметку, вы ее не создавали';
        }


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
                text: contentDiv.innerHTML,
                color: noteCard.style.backgroundColor,
                position_top: parseFloat(noteCard.style.top) || 0,
                position_left: parseFloat(noteCard.style.left) || 0,
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
        const position_top = ((rect.height / 2 - 50) / rect.height) * 100;
        const position_left = ((rect.width / 2 - 140) / rect.width) * 100;

        const noteCard = this.buildNoteCard({
            text: 'Новая заметка...',
            color: color || '#FFEB3B',
            position_top,
            position_left,
            author: this.authors[this.currentAuthorIndex]
        }, (noteCard, dataToSend) => {
            this.sendNoteToServer(dataToSend, (createdNote) => {
                noteCard.setAttribute('data-id', createdNote.id);
                noteCard.setAttribute('data-user', createdNote.user);
                // ⬇️ После получения данных пересоздаём или активируем кнопки
                this.refreshNoteCardPermissions(noteCard, createdNote.user);
            });
        }, username);

        // Фокус на текст сразу
        noteCard.querySelector('[contenteditable]').focus();
    }

    /**
     * Обновляет права доступа к карточке заметки для текущего пользователя.
     *
     * Этот метод проверяет, является ли текущий пользователь автором заметки.
     * Если да — активирует кнопки редактирования автора и удаления заметки,
     * иначе блокирует их и отображает поясняющие всплывающие подсказки.
     *
     * @param {HTMLElement} noteCard - DOM-элемент карточки заметки.
     * @param {string} createdUser - Имя пользователя, создавшего заметку.
     */
    refreshNoteCardPermissions(noteCard, createdUser) {
        const currentUser = username;
        const authorBtn = noteCard.querySelector('.author-btn');
        const deleteBtn = noteCard.querySelector('.delete-btn');

        if (authorBtn && deleteBtn) {
            if (currentUser === createdUser) {
                authorBtn.disabled = false;
                authorBtn.title = '';
                let authorIndex = this.authors.indexOf(authorBtn.textContent);
                if (authorIndex === -1) authorIndex = 0;
                authorBtn.onclick = () => {
                    authorIndex = (authorIndex + 1) % this.authors.length;
                    authorBtn.textContent = this.authors[authorIndex];
                };

                deleteBtn.disabled = false;
                deleteBtn.title = 'Удалить заметку';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    const noteId = noteCard.getAttribute('data-id');
                    if (noteId) {
                        this.deleteNoteFromServer(noteId);
                    }
                    noteCard.remove();
                };
            } else {
                authorBtn.disabled = true;
                authorBtn.title = 'Вы не можете менять автора этой заметки';
                deleteBtn.disabled = true;
                deleteBtn.title = 'Вы не можете удалить заметку, вы ее не создавали';
            }
        }
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
        this.buildNoteCard(noteData, undefined, username);
    }

    /**
     * Отправляет изменения заметки на сервер
     * @param {HTMLElement} noteCard
     */
    sendNoteUpdate(noteCard) {
        const id = noteCard.getAttribute('data-id');
        const text = noteCard.querySelector('[contenteditable]').innerHTML;
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
                    throw responseData;
                }

                return responseData;
            })
            .then(result => {
                console.log('Заметка обновлена:', result);
                this.showSuccessMessage(`Заметка с текстом "${result.data.text}" обновлена`);
            })
            .catch(error => {
                console.error('Ошибка обноавления:', error);
                if (error?.errors) {
                    // Можно пройтись по всем полям и показать все ошибки
                    for (const [field, messages] of Object.entries(error.errors)) {
                        messages.forEach(message => {
                            showError(`Ошибка в поле "${field}" - "${message}`);
                        });
                    }
                } else {
                    showError('Произошла ошибка');
                }
            });

    }

    /**
     * Отправляет новую заметку на сервер методом POST.
     *
     * Выполняет запрос с JSON-данными заметки и CSRF-токеном, ожидает ответ в формате JSON.
     * При успешном ответе вызывает переданную функцию `onSuccess` и отображает сообщение.
     * При ошибке выводит соответствующие сообщения об ошибках, включая ошибки валидации.
     *
     * @param {Object} noteData - Объект с данными заметки (например, текст, цвет, автор и т.д.).
     * @param {Function} [onSuccess] - Необязательная функция обратного вызова, вызываемая при успешном создании заметки.
     */
    sendNoteToServer(noteData, onSuccess) {
        fetch('', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.csrfToken,
            },
            body: JSON.stringify(noteData)
        })
            .then(async response => {
                const data = await response.json();  // парсим ответ

                if (!response.ok) {
                    // Если статус не 2xx — бросаем ошибку с объектом
                    throw data;
                }

                return data;
            })
            .then(createdNote => {
                const note = createdNote.data;
                console.log('Заметка создана:', note);
                if (typeof onSuccess === 'function') {
                    onSuccess(note);
                }
                this.showSuccessMessage(`Заметка создана: ${note.id}`);
            })
            .catch(errorData => {
                console.error('Ошибка при создании:', errorData);
                if (errorData?.errors) {
                    // Можно пройтись по всем полям и показать все ошибки
                    for (const [field, messages] of Object.entries(errorData.errors)) {
                        messages.forEach(message => {
                            showError(`Ошибка в поле "${field}" - "${message}`);
                        });
                    }
                } else {
                    showError('Произошла ошибка');
                }
            });
    }


    /**
     * Отправляет DELETE-запрос на сервер для удаления заметки.
     * @param {number|string} id - ID заметки
     */
    deleteNoteFromServer(id) {
        fetch(`${id}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': this.csrfToken, // если Django
            },
        })
            .then(async response => {
                const data = await response.json();  // парсим ответ
                if (!response.ok) {
                    // Если статус не 2xx — бросаем ошибку с объектом
                    throw data;
                }

                return data;
            })
            .then(data => {
                // Здесь data — это распарсенный JSON от сервера
                this.showSuccessMessage(data.data.message || `Заметка с ID ${id} успешно удалена с сервера`);
                console.log(`Заметка с ID ${id} успешно удалена с сервера`);
            })
            .catch(error => {
                console.error('Ошибка при удалении:', error);
                if (error?.errors) {
                    // Можно пройтись по всем полям и показать все ошибки
                    for (const [field, messages] of Object.entries(error.errors)) {
                        messages.forEach(message => {
                            showError(`Ошибка в поле "${field}" - "${message}`);
                        });
                    }
                } else {
                    showError('Произошла ошибка');
                }
            });
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

    adjustNotesInsideBoard() {
        const boardRect = this.noteBoard.getBoundingClientRect();

        document.querySelectorAll('.note-card').forEach(noteCard => {
            const cardRect = noteCard.getBoundingClientRect();

            // Получаем относительное положение внутри noteBoard
            const noteLeft = parseFloat(noteCard.style.left);
            const noteTop = parseFloat(noteCard.style.top);

            const maxLeft = boardRect.width - noteCard.offsetWidth;
            const maxTop = boardRect.height - noteCard.offsetHeight;

            let adjusted = false;

            let newLeft = noteLeft;
            let newTop = noteTop;

            if (noteLeft > maxLeft) {
                newLeft = Math.max(0, maxLeft);
                adjusted = true;
            }
            if (noteTop > maxTop) {
                newTop = Math.max(0, maxTop);
                adjusted = true;
            }

            if (adjusted) {
                noteCard.style.left = `${newLeft}px`;
                noteCard.style.top = `${newTop}px`;
                this.sendNoteUpdate(noteCard); // обновим позицию на сервере
            }
        });
    }


}

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


        // Привязываем методы для обработки движения мыши и отпускания кнопки к контексту
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
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
     * Создаёт и добавляет новую заметку на доску.
     * @param {string} [color] - Цвет заметки (по умолчанию жёлтый)
     */
    addNoteCard(color) {
        const noteCard = document.createElement('div');
        noteCard.classList.add('note-card'); // стили есть в CSS

        noteCard.style.backgroundColor = color || '#FFEB3B';

        // Удаляем contenteditable с noteCard
        noteCard.removeAttribute('contenteditable');

        noteCard.setAttribute('data-id', this.noteIdCounter++);

        // Позиционируем заметку в центре доски
        const rect = this.noteBoard.getBoundingClientRect();
        noteCard.style.position = 'absolute';
        noteCard.style.top = `${rect.height / 2 - 50}px`;
        noteCard.style.left = `${rect.width / 2 - 140}px`;
        // Для каждой заметки своя текущая позиция автора
        let authorIndex = 0;
        // Добавляем спан с автором
        const authorBtn = document.createElement('button');
        authorBtn.className = 'author-btn';
        authorBtn.textContent = this.authors[this.currentAuthorIndex];

        // Обработчик клика на кнопку автора
        authorBtn.addEventListener('click', () => {
            // Меняем индекс для конкретной заметки
            authorIndex = (authorIndex + 1) % this.authors.length;
            // Обновляем текст кнопки только этой заметки
            authorBtn.textContent = this.authors[authorIndex];
        });


        // Создаём контейнер для пометки (автора), чтобы выровнять её справа
        const authorContainer = document.createElement('div');
        authorContainer.style.display = 'flex';
        authorContainer.style.justifyContent = 'flex-end'; // выравниваем вправо
        authorContainer.style.marginBottom = '4px'; // небольшой отступ снизу

        // Добавляем в контейнер автора
        authorContainer.appendChild(authorBtn);


        // Контейнер с редактируемым текстом
        const contentDiv = document.createElement('div');
        contentDiv.setAttribute('contenteditable', 'true');
        contentDiv.setAttribute('spellcheck', 'false');
        contentDiv.classList.add('outline-none');
        contentDiv.textContent = 'Новая заметка...';

        // Вставляем спан и контент
        noteCard.appendChild(authorContainer);
        noteCard.appendChild(contentDiv);

        // Обработчик для перетаскивания
        noteCard.addEventListener('mousedown', (e) => this.onMouseDown(e, noteCard));

        // При клике — фокус на редактируемый div
        noteCard.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-btn')) {
                contentDiv.focus();
            }
        });

        // Кнопка удаления
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.title = 'Удалить заметку';
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-btn';

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            noteCard.remove();
        });

        noteCard.appendChild(deleteBtn);

        this.noteBoard.appendChild(noteCard);

        contentDiv.focus();

        this.observeNoteResize(noteCard);
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

        // Сбрасываем текущую перетаскиваемую заметку
        this.draggedNote = null;
    }
}

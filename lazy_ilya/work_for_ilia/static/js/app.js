document.addEventListener('DOMContentLoaded', () => {
    // Получаем элементы интерфейса
    const splashScreen = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const saveBtn = document.getElementById('saveBtn');
    const clearBtn = document.getElementById('clearBtn');

    /**
     * Обрабатывает переход от экрана загрузки к основному контенту.
     * После задержки экран загрузки исчезает, а основной контент появляется.
     */
    const handleSplashScreen = () => {
        setTimeout(() => {
            // Плавно скрываем экран загрузки
            splashScreen.style.opacity = '0';
            splashScreen.style.transition = 'opacity 0.5s ease-out';

            setTimeout(() => {
                // Скрываем экран загрузки и показываем основной контент
                splashScreen.style.display = 'none';
                mainContent.style.display = 'block';
                mainContent.style.opacity = '0';
                mainContent.style.transition = 'opacity 0.5s ease-in';

                // Плавно показываем основной контент
                setTimeout(() => {
                    mainContent.style.opacity = '1';
                }, 50);
            }, 500); // Ждем завершения перехода
        }, 2000); // Начальная задержка перед началом перехода
    };

    /**
     * Обрабатывает изменения в состоянии файлового ввода.
     * Активирует или деактивирует кнопки в зависимости от того, выбраны ли файлы.
     */
    const handleFileInputChange = () => {
        const hasFiles = fileInput.files.length > 0; // Проверяем, выбраны ли файлы
        uploadBtn.disabled = !hasFiles; // Включаем/выключаем кнопку загрузки
        saveBtn.disabled = true;       // Блокируем кнопку сохранения, пока файлы не загружены
        clearBtn.disabled = !hasFiles; // Включаем/выключаем кнопку очистки
    };

    /**
     * Инициализирует приложение.
     */
    const initializeApp = () => {
        handleSplashScreen(); // Запускаем обработку экрана загрузки

        // Добавляем обработчик событий для изменения состояния файлового ввода
        fileInput.addEventListener('change', handleFileInputChange);
    };

    // Инициализация приложения
    initializeApp();
});


class DocumentConverter {
    /**
     * Конструктор класса FileUploader.
     * Инициализирует коллекции для хранения файлов и текстового содержимого,
     * а также вызывает методы для настройки интерфейса и событий.
     */
    constructor() {
        this.files = new Map(); // Хранит загруженные файлы
        this.textContents = new Map(); // Хранит содержимое текстовых полей
        this.initializeElements(); // Инициализация элементов интерфейса
        this.setupEventListeners(); // Настройка обработчиков событий
    }

    /**
     * Инициализирует элементы интерфейса.
     * Находит элементы DOM по их идентификаторам и сохраняет ссылки на них.
     */
    initializeElements() {
        this.fileInput = document.getElementById('fileInput');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.filesList = document.getElementById('filesList');
        this.docNumber = document.getElementById('docNumber');
        this.textPreview = document.getElementById('textPreview');
        this.saveBtn = document.getElementById('saveBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.uploadProgressBar = document.getElementById('uploadProgressBar');
        this.uploadProgressText = document.getElementById('uploadProgressText');
        this.saveProgress = document.getElementById('saveProgress');
        this.saveProgressBar = document.getElementById('saveProgressBar');
        this.saveProgressText = document.getElementById('saveProgressText');
    }

    /**
     * Настраивает обработчики событий для элементов интерфейса.
     */
    setupEventListeners() {
        // Обработчик выбора файлов
        this.fileInput.addEventListener('change', () => this.handleFileSelection());

        // Обработчики кнопок
        this.uploadBtn.addEventListener('click', () => this.uploadFiles());
        this.saveBtn.addEventListener('click', () => this.saveFiles());
        this.clearBtn.addEventListener('click', () => this.clearAll());

        // Обработчик изменения текста в текстовом поле
        this.textPreview.addEventListener('input', () => {
            if (this.currentFileName && this.files.has(this.currentFileName)) {
                const fileData = this.files.get(this.currentFileName);
                fileData.convertedText = this.textPreview.value; // Обновление содержимого файла
                this.files.set(this.currentFileName, fileData); // Сохранение изменений
            }
        });
    }

    /**
     * Обрабатывает выбор файлов из элемента input.
     * Добавляет выбранные файлы в коллекцию, если они имеют допустимый формат.
     */
    handleFileSelection() {
        const files = Array.from(this.fileInput.files);
        files.forEach(file => {
            if (this.isValidFileType(file)) {
                // Добавление файла в коллекцию
                this.files.set(file.name, {
                    file,
                    docNumber: '',
                    convertedText: ''
                });
            }
        });
        this.updateFilesList(); // Обновление списка файлов в интерфейсе
    }

    /**
     * Проверяет, является ли тип файла допустимым.
     * @param {File} file - Файл для проверки.
     * @returns {boolean} - true, если файл допустимого типа, иначе false.
     */
    isValidFileType(file) {
        const validTypes = ['.doc', '.docx', '.rtf'];
        return validTypes.some(type => file.name.toLowerCase().endsWith(type));
    }

    /**
     * Обновляет список загруженных файлов в интерфейсе.
     */
    updateFilesList() {
        const filesListContainer = document.getElementById('filesList');
        filesListContainer.innerHTML = ''; // Очистка предыдущего списка

        // Создание элементов списка для каждого файла
        this.files.forEach((fileData, fileName) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-preview-item';
            fileItem.innerText = fileName;

            // Добавление обработчика клика для отображения содержимого файла
            fileItem.addEventListener('click', () => {
                document.querySelectorAll('.file-preview-item').forEach(item => item.classList.remove('active'));
                fileItem.classList.add('active');
                this.showFilePreview(fileName);
            });

            filesListContainer.appendChild(fileItem);
            // Создание кнопки удаления
            const deleteButton = document.createElement('button');
            deleteButton.innerText = 'Удалить';
            deleteButton.className = 'delete-btn';  // Применение класса стиля

            // Добавление обработчика клика для кнопки удаления
            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation(); // Остановка всплытия события, чтобы не активировать элемент файла
                this.removeFile(fileName);
            });

            // Добавление кнопки удаления к элементу файла
            fileItem.appendChild(deleteButton);

            // Добавление элемента файла в контейнер
            filesListContainer.appendChild(fileItem);
        });
    }

    /**
     * Удаляет файл из списка загруженных файлов.
     * @param {string} fileName - Имя файла для удаления.
     */
    removeFile(fileName) {
        // Удаление файла из коллекции
        this.files.delete(fileName);

        // Обновление отображаемого списка файлов
        this.updateFilesList();

        // Очистка текстового поля и номера документа, если удалённый файл был выбран
        if (this.currentFileName === fileName) {
            this.textPreview.value = '';
            this.docNumber.value = '';
            this.currentFileName = null; // Сбрасываем текущее имя файла
            this.resetTextAreaHeight(); // Возвращаем размер textarea к исходному значению
        }

        // Проверяем количество файлов и отключаем кнопку "Сохранить", если нет файлов
        if (this.files.size === 0) {
            this.fileInput.value = ''; // Очистка значения
            this.saveBtn.disabled = true; // Отключаем кнопку "Сохранить"
            this.uploadBtn.disabled = true; // Отключаем кнопку "Загрузить"
            this.fileInput.disabled = false; // Активируем поле выбора файла
            this.docNumber.readOnly = false; // Разрешаем редактирование номера документа
        }
    }


    /**
     * Загружает файлы на сервер.
     * Проверяет наличие файлов и номер документа, отображает прогресс загрузки.
     */
    async uploadFiles() {
        // Проверка на наличие загруженных файлов
        if (this.files.size === 0) {
            alert('Пожалуйста, выберите файлы для загрузки');
            return;
        }

        const docNumberValue = this.docNumber.value;

        // Проверяем, является ли значение целым числом и больше нуля
        if (!Number.isInteger(Number(docNumberValue)) || Number(docNumberValue) <= 0) {
            alert('Пожалуйста, введите целое число больше нуля');
            return;
        }

        const formData = new FormData();
        this.files.forEach((fileData) => {
            formData.append('file', fileData.file); // Добавляем файл в FormData
        });

        formData.append('document_number', docNumberValue); // Добавляем номер документа

        const csrftoken = getCookie('csrftoken'); // Получаем CSRF-токен
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl, true); // Открываем соединение для отправки данных

        // Отображаем прогресс-бар
        document.getElementById('uploadProgress').style.display = 'block';

        // Обработчик прогресса загрузки
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 97; // Устанавливаем 97% при загрузке
                document.getElementById('uploadProgressBar').style.width = percentComplete + '%';
                document.getElementById('uploadProgressText').innerText = `Загрузка: ${Math.round(percentComplete)}%`;
            }
        };

        // Обработчик завершения загрузки
        xhr.onload = async () => {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status === 200) {

                this.files.clear(); // Очищаем старые данные

                // Обновляем данные о загруженных файлах
                data.new_files.forEach((fileName, index) => {
                    const content = data.content[index] || '';
                    this.files.set(fileName, {file: fileName, convertedText: content, docNumber: docNumberValue});
                    this.textContents.set(fileName, content); // Сохраняем текстовое содержимое
                });

                this.updateFilesList(); // Обновляем список загруженных файлов

                // Достигаем 100% после обработки
                document.getElementById('uploadProgressBar').style.width = '100%';
                document.getElementById('uploadProgressText').innerText = 'Загрузка завершена: 100%';


                // Скрываем прогресс-бар через некоторое время
                setTimeout(() => {
                    document.getElementById('uploadProgress').style.display = 'none';
                    document.getElementById('uploadProgressBar').style.width = '0%'; // Сбрасываем ширину
                    document.getElementById('uploadProgressText').innerText = ''; // Очищаем текст

                    if (this.files.size > 0) {
                        const fileName = Array.from(this.files.keys())[0];
                        this.showFilePreview(fileName); // Показываем предварительный просмотр первого файла
                        this.saveBtn.disabled = false; // Активируем кнопку сохранения
                        this.docNumber.readOnly = true;
                        this.uploadBtn.disabled = true; // Деактивируем кнопку загрузки
                        this.fileInput.disabled = true;   // Деактивируем поле выбора файла
                    }
                }, 2000); // Скрыть через 2 секунды


            } else {
                alert(data.error || 'Произошла ошибка при загрузке файлов');
                document.getElementById('uploadProgress').style.display = 'none';
            }
        };

        xhr.onerror = () => {
            alert('Произошла ошибка при загрузке файлов');
            document.getElementById('uploadProgress').style.display = 'none';
        };

        xhr.setRequestHeader('X-CSRFToken', csrftoken); // Устанавливаем CSRF-токен в заголовках запроса
        xhr.send(formData); // Отправляем данные на сервер
    }

    /**
     * Динамически изменяет высоту текстового поля в зависимости от содержимого.
     */
    adjustTextAreaHeight() {
        this.textPreview.style.height = 'auto'; // Сбрасываем высоту
        this.textPreview.style.height = this.textPreview.scrollHeight + 'px'; // Устанавливаем высоту в зависимости от содержимого
    }

    /**
     * Сбрасывает высоту текстового поля на фиксированное значение.
     */
    resetTextAreaHeight() {
        this.textPreview.style.height = '300px'; // Устанавливаем фиксированную высоту
    }

    /**
     * Отображает предварительный просмотр выбранного файла.
     * @param {string} fileName - Имя файла для отображения.
     */
    showFilePreview(fileName) {
        if (fileName && this.files.has(fileName)) {
            const fileData = this.files.get(fileName);

            this.currentFileName = fileName; // Устанавливаем текущий выбранный файл

            this.textPreview.value = fileData.convertedText; // Отображаем содержимое выбранного файла в текстовом поле

            this.textPreview.readOnly = false; // Разрешаем редактирование

            this.docNumber.value = fileData.docNumber; // Устанавливаем номер документа

            this.adjustTextAreaHeight(); // Корректируем высоту textarea
        } else {
            // Если файл не выбран, сбрасываем состояние
            this.currentFileName = null;
            this.textPreview.value = '';
            this.textPreview.readOnly = true;
            this.docNumber.value = '';
        }
    }


    /**
     * Сохраняет измененные файлы на сервере.
     * Проверяет наличие файлов и отправляет данные на сервер для сохранения.
     */
    async saveFiles() {
        // Проверка на наличие загруженных файлов
        if (this.files.size === 0) {
            alert('Пожалуйста, выберите файл для сохранения');
            return;
        }

        const dataToSend = [];

        // Собираем данные для отправки на сервер
        this.files.forEach((fileData, fileName) => {
            dataToSend.push({
                document_number: fileData.docNumber,
                content: fileData.convertedText || '',  // Используем текущее значение из textarea для каждого файла
                new_file_name: fileName
            });
        });

        const xhr = new XMLHttpRequest();
        xhr.open('PUT', updateUrl, true); // Указываем метод и URL

        // Отображаем прогресс-бар
        document.getElementById('uploadProgress').style.display = 'block';

        // Обработчик прогресса сохранения
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 97; // Устанавливаем до 97%
                document.getElementById('uploadProgressBar').style.width = percentComplete + '%'; // Обновляем ширину прогресс-бара
                document.getElementById('uploadProgressText').innerText = `Сохранение: ${Math.round(percentComplete)}%`; // Обновляем текст
            }
        };

        // Обработчик завершения сохранения
        xhr.onload = async () => {
            const responseData = JSON.parse(xhr.responseText);
            if (xhr.status === 200) {
                const responseData = JSON.parse(xhr.responseText);

                // Достигаем 100% после обработки
                document.getElementById('uploadProgressBar').style.width = '100%';
                document.getElementById('uploadProgressText').innerText = 'Сохранение завершено: 100%';

                this.clearAll(); // Очищаем все данные и сбрасываем интерфейс

                // Скрываем прогресс-бар через некоторое время
                setTimeout(() => {
                    document.getElementById('uploadProgress').style.display = 'none';
                    document.getElementById('uploadProgressBar').style.width = '0%'; // Сбрасываем ширину
                    document.getElementById('uploadProgressText').innerText = ''; // Очищаем текст
                }, 2000); // Скрыть через 2 секунды

            } else {
                alert(responseData.error() || 'Произошла ошибка при сохранении файлов');
                document.getElementById('uploadProgress').style.display = 'none';
            }
        };

        xhr.onerror = () => {
            alert('Произошла ошибка при сохранении файлов');
            document.getElementById('uploadProgress').style.display = 'none';
        };

        xhr.setRequestHeader('Content-Type', 'application/json'); // Устанавливаем заголовок типа контента
        xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken')); // Устанавливаем CSRF-токен

        xhr.send(JSON.stringify(dataToSend)); // Отправляем данные на сервер в формате JSON
    }

    /**
     * Очищает все данные и сбрасывает интерфейс.
     * Сбрасывает значения полей ввода, очищает список файлов и отключает кнопки.
     */
    clearAll() {
        this.files.clear(); // Очищаем коллекцию файлов
        this.fileInput.value = ''; // Очищаем поле выбора файлов
        this.docNumber.value = ''; // Очищаем поле номера документа
        this.textPreview.value = ''; // Очищаем текстовое поле

        this.textPreview.readOnly = true; // Устанавливаем текстовое поле в режим только для чтения
        this.docNumber.readOnly = false;
        this.filesList.innerHTML = ''; // Очищаем список загруженных файлов

        this.resetTextAreaHeight(); // Сбрасываем высоту текстового поля

        // Отключаем кнопки управления
        this.uploadBtn.disabled = true;
        this.fileInput.disabled = false;   // Деактивируем поле выбора файла
        this.saveBtn.disabled = true;
        this.clearBtn.disabled = true;
    }
}


/**
 * Получает значение cookie по его имени.
 *
 * @param {string} name - Имя cookie, значение которого нужно получить.
 * @returns {string|null} - Возвращает значение cookie, если оно найдено; иначе null.
 */
function getCookie(name) {
    let cookieValue = null; // Переменная для хранения значения cookie

    // Проверяем, существуют ли cookies и не пусты ли они
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';'); // Разделяем cookies по символу ';'

        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim(); // Убираем пробелы по краям

            // Проверяем, начинается ли cookie с нужного имени
            if (cookie.startsWith(name + '=')) {
                // Извлекаем значение cookie и декодируем его
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break; // Выходим из цикла, если нашли нужное значение
            }
        }
    }

    return cookieValue; // Возвращаем найденное значение или null
}

const converter = new DocumentConverter();


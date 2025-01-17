document.addEventListener('DOMContentLoaded', () => {
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
    const hasFiles = fileInput.files.length > 0;
    uploadBtn.disabled = !hasFiles; // Включаем/выключаем кнопку загрузки
    saveBtn.disabled = !hasFiles; // Включаем/выключаем кнопку сохранения
    clearBtn.disabled = !hasFiles; // Включаем/выключаем кнопку очистки
    fileInput.disabled = false; // Убедимся, что поле ввода файлов остается активным
  };

  // Запускаем функцию обработки экрана загрузки
  handleSplashScreen();

  // Добавляем обработчик событий для изменения состояния файлового ввода
  fileInput.addEventListener('change', handleFileInputChange);
});


class DocumentConverter {
  constructor() {
    this.files = new Map(); // Хранит загруженные файлы
    this.textContents = new Map(); // Хранит содержимое каждого текстового поля
    this.initializeElements(); // Инициализация элементов интерфейса
    this.setupEventListeners(); // Настройка обработчиков событий
  }

  /**
   * Инициализирует элементы интерфейса.
   */
  initializeElements() {
    this.fileInput = document.getElementById('fileInput');
    this.uploadBtn = document.getElementById('uploadBtn');
    this.filesList = document.getElementById('filesList');
    this.fileSelector = document.getElementById('fileSelector');
    this.docNumber = document.getElementById('docNumber');
    this.textPreview = document.getElementById('textPreview');
    this.saveBtn = document.getElementById('saveBtn');
    this.clearBtn = document.getElementById('clearBtn');
  }

  /**
   * Настраивает обработчики событий для элементов интерфейса.
   */
  setupEventListeners() {
    this.fileInput.addEventListener('change', () => this.handleFileSelection());
    this.uploadBtn.addEventListener('click', () => this.uploadFiles());
    this.fileSelector.addEventListener('change', () => this.showFilePreview());
    this.saveBtn.addEventListener('click', () => this.saveFiles());
    this.clearBtn.addEventListener('click', () => this.clearAll());

    // Обработчик для изменения текста в текстовом поле
    this.textPreview.addEventListener('input', () => {
      const selectedFile = this.fileSelector.value;
      if (selectedFile) {
        // Сохраняем текущее содержимое текстового поля
        this.textContents.set(selectedFile, this.textPreview.value);
      }
    });
  }

  /**
   * Обрабатывает выбор файлов из файлового ввода.
   */
  handleFileSelection() {
    const files = Array.from(this.fileInput.files);
    files.forEach(file => {
      if (this.isValidFileType(file)) {
        // Добавляем файл в коллекцию
        this.files.set(file.name, {
          file,
          docNumber: '',
          convertedText: ''
        });
        // Инициализируем содержимое для нового файла
        this.textContents.set(file.name, '');
      }
    });
    this.updateFilesList(); // Обновляем список загруженных файлов
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
    this.filesList.innerHTML = ''; // Очищаем текущий список файлов
    this.files.forEach((fileData, fileName) => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      fileItem.innerHTML = `
        <span>${fileName}</span>
        <button class="delete-btn" onclick="converter.removeFile('${fileName}')">
          Удалить
        </button>
      `;
      this.filesList.appendChild(fileItem); // Добавляем элемент файла в список
    });
  }

  /**
   * Обновляет выпадающий список файлов для просмотра.
   * @param {Array} newFiles - Массив новых файлов для добавления в селектор.
   */
  updateFileSelector(newFiles) {
    this.fileSelector.innerHTML = '<option value="">Выберите файл для просмотра</option>';
    newFiles.forEach((fileName) => {
      const option = document.createElement('option');
      option.value = fileName;
      option.textContent = fileName;
      this.fileSelector.appendChild(option); // Добавляем опцию в селектор
    });
  }

  /**
   * Удаляет файл из списка загруженных файлов.
   * @param {string} fileName - Имя файла для удаления.
   */
  removeFile(fileName) {
    this.files.delete(fileName); // Удаляем файл из коллекции
    this.updateFilesList(); // Обновляем список файлов
    this.updateFileSelector(); // Обновляем селектор файлов

    // Очищаем текстовое поле и номер документа, если удаленный файл был выбран
    if (this.fileSelector.value === fileName) {
      this.textPreview.value = '';
      this.docNumber.value = '';
    }
  }

  /**
   * Загружает файлы на сервер.
   */
  async uploadFiles() {
    if (this.files.size === 0) {
      alert('Пожалуйста, выберите файлы для загрузки');
      return;
    }

    const docNumberValue = this.docNumber.value; // Получаем номер документа

    // Проверка валидности номера документа
    if (!docNumberValue || docNumberValue <= 0) {
      alert('Пожалуйста, введите номер документа больше нуля');
      return;
    }

    const formData = new FormData(); // Создаем FormData для отправки на сервер

    // Добавляем файлы в FormData
    this.files.forEach((fileData) => {
      formData.append('file', fileData.file);
    });

    formData.append('document_number', docNumberValue); // Добавляем номер документа

    try {
      const csrftoken = getCookie('csrftoken'); // Получаем CSRF-токен

      const response = await fetch(uploadUrl, { // Укажите правильный URL для вашего API
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRFToken': csrftoken // Устанавливаем CSRF-токен в заголовок
        },
      });

      const data = await response.json();

      if (response.ok) {
        uploadBtn.disabled = true; // Деактивируем кнопку загрузки после успешной загрузки
        fileInput.disabled=true;
        this.updateFileSelector(data.new_files); // Обновляем выпадающий список новых файлов

        data.new_files.forEach((fileName, index) => {
          const content = data.content[index] || ''; // Получаем содержимое файла
          this.files.set(fileName, {
            file: fileName,
            convertedText: content, // Содержимое файла
            docNumber: docNumberValue
          });

          // Обновляем textContents с содержимым из ответа сервера
          this.textContents.set(fileName, content);
        });

        if (data.new_files.length > 0) {
          this.fileSelector.value = data.new_files[0]; // Выбираем первый файл по умолчанию
          this.showFilePreview(); // Отображаем содержимое первого файла
        }
      } else {
        alert(data.message || 'Произошла ошибка при загрузке файлов');
      }

    } catch (error) {
      alert('Произошла ошибка при загрузке файлов');
      console.error(error);
    }
  }

  /**
   * Отображает предварительный просмотр выбранного файла.
   */
  showFilePreview() {
    const selectedFile = this.fileSelector.value;

    if (selectedFile && this.files.has(selectedFile)) {
      const fileData = this.files.get(selectedFile);

      // Отображаем содержимое выбранного файла в текстовом поле
      this.textPreview.value =
        this.textContents.get(selectedFile) || fileData.convertedText;

      this.docNumber.value = fileData.docNumber;

    } else {
      // Очищаем текстовое поле и номер документа, если файл не выбран
      this.textPreview.value = '';
      this.docNumber.value = '';
    }
  }

  /**
   * Сохраняет измененные файлы на сервере.
   */
  async saveFiles() {
    if (this.files.size === 0) {
      alert('Пожалуйста, выберите файл для сохранения');
      return;
    }

    const dataToSend = [];

    // Собираем данные для отправки на сервер
    this.files.forEach((fileData, fileName) => {
      dataToSend.push({
        document_number: fileData.docNumber,
        content: this.textContents.get(fileName),
        new_file_name: fileName
      });
    });

    try {
      const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(dataToSend)
      });

      const responseData = await response.json();

      if (response.ok) {
        uploadBtn.disabled = false;
        fileInput.disabled=false;
        alert('Файлы успешно сохранены');
        this.clearAll();
      } else {
        alert(responseData.message || 'Произошла ошибка при сохранении файлов');
      }

    } catch (error) {
      alert('Произошла ошибка при сохранении файлов');
      console.error(error);

     }
  }


    /**
     * Очищает все данные и сбрасывает интерфейс.
     */
    clearAll() {
         this.files.clear();
         this.fileInput.value = '';
         this.fileSelector.innerHTML = '<option value="">Выберите файл для просмотра</option>';
         this.docNumber.value = '';
         this.textPreview.value = '';
         this.filesList.innerHTML = '';

         // Отключаем кнопки
         this.uploadBtn.disabled = true;
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
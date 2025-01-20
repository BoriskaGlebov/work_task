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
    saveBtn.disabled = true; // Включаем/выключаем кнопку сохранения
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

    const docNumberValue = this.docNumber.value;

    if (!docNumberValue || docNumberValue <= 0) {
        alert('Пожалуйста, введите номер документа больше нуля');
        return;
    }

    const formData = new FormData();
    this.files.forEach((fileData) => {
        formData.append('file', fileData.file);
    });

    formData.append('document_number', docNumberValue);

    const csrftoken = getCookie('csrftoken');
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);

    // Отображаем прогресс-бар
    document.getElementById('uploadProgress').style.display = 'block';

    xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 97; // Устанавливаем 97% при загрузке
            document.getElementById('uploadProgressBar').style.width = percentComplete + '%';
            document.getElementById('uploadProgressText').innerText = `Загрузка: ${Math.round(percentComplete)}%`;
        }
    };

    xhr.onload = async () => {
        // Имитация обработки на сервере
//        await new Promise(resolve => setTimeout(resolve, 2000)); // Задержка в 2 секунды

        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            uploadBtn.disabled = true;
            fileInput.disabled=true;
            this.updateFileSelector(data.new_files);

            data.new_files.forEach((fileName, index) => {
                const content = data.content[index] || '';
                this.files.set(fileName, { file: fileName, convertedText: content, docNumber: docNumberValue });
                this.textContents.set(fileName, content);
            });
            if (data.new_files.length > 0) {
                  this.fileSelector.value = data.new_files[0]; // Выбираем первый файл по умолчанию
                  this.showFilePreview(); // Отображаем содержимое первого файла
                }
            else {
                alert(data.message || 'Произошла ошибка при загрузке файлов');
              }
            // Достигаем 100% после обработки
            document.getElementById('uploadProgressBar').style.width = '100%';
            document.getElementById('uploadProgressText').innerText = 'Загрузка завершена: 100%';
            // Активируем кнопку сохранения
            saveBtn.disabled = false; // Активируем кнопку сохранения
            // Скрываем прогресс-бар через некоторое время
            setTimeout(() => {
                document.getElementById('uploadProgress').style.display = 'none';
                document.getElementById('uploadProgressBar').style.width = '0%'; // Сбрасываем ширину
                document.getElementById('uploadProgressText').innerText = ''; // Очищаем текст
            }, 2000); // Скрыть через 2 секунды
           const filesListContainer = document.querySelector('.files-list');
           filesListContainer.classList.add('hidden'); // Добавляем класс для скрытия
           setTimeout(() => {
                filesListContainer.style.display = 'none'; // Убираем элемент из потока после анимации
            }, 1500); // Задержка должна быть равна или больше времени анимации

            // Убедитесь, что класс удаляется перед следующим показом
        } else {
            alert(data.message || 'Произошла ошибка при загрузке файлов');
        }
    };

    xhr.onerror = () => {
        alert('Произошла ошибка при загрузке файлов');
        document.getElementById('uploadProgress').style.display = 'none';
    };

    xhr.setRequestHeader('X-CSRFToken', csrftoken);
    xhr.send(formData);
  }

  // Функция для динамического изменения высоты text area
  adjustTextAreaHeight() {
    this.textPreview.style.height = 'auto'; // Сбрасываем высоту
    this.textPreview.style.height = this.textPreview.scrollHeight + 'px'; // Устанавливаем высоту в зависимости от содержимого
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
      this.adjustTextAreaHeight();

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

    // Создаем новый XMLHttpRequest для отслеживания прогресса
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', updateUrl, true); // Указываем метод и URL

    // Отображаем прогресс-бар
    document.getElementById('uploadProgress').style.display = 'block';

    xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 97; // Устанавливаем до 97%
            document.getElementById('uploadProgressBar').style.width = percentComplete + '%'; // Обновляем ширину прогресс-бара
            document.getElementById('uploadProgressText').innerText = `Сохранение: ${Math.round(percentComplete)}%`; // Обновляем текст
        }
    };

    xhr.onload = async () => {
        // Имитация обработки на сервере
//        await new Promise(resolve => setTimeout(resolve, 2000)); // Задержка в 2 секунды для имитации обработки

        if (xhr.status === 200) {
            const responseData = JSON.parse(xhr.responseText);
            uploadBtn.disabled = false;
            fileInput.disabled=false;

            // Достигаем 100% после обработки
            document.getElementById('uploadProgressBar').style.width = '100%';
            document.getElementById('uploadProgressText').innerText = 'Сохранение завершено: 100%';

//            alert('Файлы успешно сохранены');
            this.clearAll();
            const filesListContainer = document.querySelector('.files-list');
            filesListContainer.classList.remove('hidden'); // Убираем класс скрытия
            filesListContainer.style.display = 'block'; // Устанавливаем стиль обратно на block или flex
            this.textPreview.value = ''; // Очищаем текстовое поле
            this.adjustTextAreaHeight(); // Корректируем высоту text area
        } else {
            alert(responseData.message || 'Произошла ошибка при сохранении файлов');
        }

        // Скрываем прогресс-бар через некоторое время
        setTimeout(() => {
            document.getElementById('uploadProgress').style.display = 'none';
            document.getElementById('uploadProgressBar').style.width = '0%'; // Сбрасываем ширину
            document.getElementById('uploadProgressText').innerText = ''; // Очищаем текст
        }, 2000); // Скрыть через 2 секунды
    };

    xhr.onerror = () => {
        alert('Произошла ошибка при сохранении файлов');
        document.getElementById('uploadProgress').style.display = 'none';
    };

    // Устанавливаем заголовки
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken'));

    // Отправляем данные на сервер
    xhr.send(JSON.stringify(dataToSend));
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
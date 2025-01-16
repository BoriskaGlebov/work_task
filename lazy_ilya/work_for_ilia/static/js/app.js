document.addEventListener('DOMContentLoaded', () => {
  const splashScreen = document.getElementById('splash-screen');
  const mainContent = document.getElementById('main-content');
  const fileInput = document.getElementById('fileInput');
  const uploadBtn = document.getElementById('uploadBtn');
  const saveBtn = document.getElementById('saveBtn');
  const clearBtn = document.getElementById('clearBtn');

  // Функция для обработки перехода от экрана загрузки к основному контенту
  const handleSplashScreen = () => {
    setTimeout(() => {
      splashScreen.style.opacity = '0';
      splashScreen.style.transition = 'opacity 0.5s ease-out';

      setTimeout(() => {
        splashScreen.style.display = 'none';
        mainContent.style.display = 'block';
        mainContent.style.opacity = '0';
        mainContent.style.transition = 'opacity 0.5s ease-in';

        setTimeout(() => {
          mainContent.style.opacity = '1';
        }, 50);
      }, 500);
    }, 3000);
  };

  // Функция для обработки изменения состояния файлового ввода
  const handleFileInputChange = () => {
    if (fileInput.files.length > 0) {
      uploadBtn.disabled = false; // Активируем кнопку "Загрузить"
      saveBtn.disabled = false; // Активируем кнопку "Сохранить"
      clearBtn.disabled = false; // Активируем кнопку "Очистить всё"
    } else {
      uploadBtn.disabled = true; // Деактивируем кнопку "Загрузить"
      saveBtn.disabled = true; // Деактивируем кнопку "Сохранить"
      clearBtn.disabled = true; // Деактивируем кнопку "Очистить всё"
    }
  };

  // Запуск функций
  handleSplashScreen();
  fileInput.addEventListener('change', handleFileInputChange);
});

class DocumentConverter {
  constructor() {
    this.files = new Map();
    this.initializeElements();
    this.setupEventListeners();
  }

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

  setupEventListeners() {
    this.fileInput.addEventListener('change', () => this.handleFileSelection());
    this.uploadBtn.addEventListener('click', () => this.uploadFiles());
    this.fileSelector.addEventListener('change', () => this.showFilePreview());
    this.saveBtn.addEventListener('click', () => this.saveFiles());
    this.clearBtn.addEventListener('click', () => this.clearAll());
  }

  handleFileSelection() {
    const files = Array.from(this.fileInput.files);
    files.forEach(file => {
      if(this.isValidFileType(file)) {
        this.files.set(file.name, {
          file,
          docNumber: '',
          convertedText: ''
        });
      }
    });
    this.updateFilesList();
//    this.updateFileSelector();
  }

  isValidFileType(file) {
    const validTypes = ['.doc', '.docx', '.rtf'];
    return validTypes.some(type => file.name.toLowerCase().endsWith(type));
  }

  updateFilesList() {
    this.filesList.innerHTML = '';
    this.files.forEach((fileData, fileName) => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      fileItem.innerHTML = `
        <span>${fileName}</span>
        <button class="delete-btn" onclick="converter.removeFile('${fileName}')">
          Удалить
        </button>
      `;
      this.filesList.appendChild(fileItem);
    });
  }

  updateFileSelector(newFiles) {
    this.fileSelector.innerHTML = '<option value="">Выберите файл для просмотра</option>';
    newFiles.forEach(( fileName) => {
      const option = document.createElement('option');
      option.value = fileName;
      option.textContent = fileName;
      this.fileSelector.appendChild(option);
    });
  }

  removeFile(fileName) {
    this.files.delete(fileName);
    this.updateFilesList();
    this.updateFileSelector();
    if(this.fileSelector.value === fileName) {
      this.textPreview.value = '';
      this.docNumber.value = '';
    }
  }


  async uploadFiles() {
    if (this.files.size === 0) {
        alert('Пожалуйста, выберите файлы для загрузки');
        return;
    }

    const docNumberValue = this.docNumber.value; // Получаем значение номера документа

    // Проверка на валидность номера документа
    if (!docNumberValue || docNumberValue <= 0) {
        alert('Пожалуйста, введите номер документа больше нуля');
        return;
    }

    // Создаем FormData для отправки файлов на сервер
    const formData = new FormData();

    // Добавляем файлы в FormData
    this.files.forEach((fileData) => {
        formData.append('file', fileData.file);
    });

    // Добавляем номер документа в FormData
    formData.append('document_number', docNumberValue);

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

        // Проверка успешности ответа
        if (response.ok) {
            // Обновляем выпадающий список с именами новых файлов
            this.updateFileSelector(data.new_files);

            // Сохраняем содержимое файлов в объекте files
            data.new_files.forEach((fileName, index) => {
                this.files.set(fileName, {
                    file: fileName,
                    convertedText: data.content[index], // Содержимое файла
                    docNumber: docNumberValue
                });
            });

            // Если есть хотя бы один файл, выбираем первый по умолчанию
            if (data.new_files.length > 0) {
                this.fileSelector.value = data.new_files[0]; // Выбираем первый файл
                this.showFilePreview(); // Отображаем содержимое первого файла
            }

            // Очищаем текстовое поле, если нужно
//            this.textPreview.value = '';

            console.log('Новые файлы:', data.new_files);
        } else {
            alert(data.message || 'Произошла ошибка при загрузке файлов');
        }

    } catch (error) {
        alert('Произошла ошибка при загрузке файлов');
        console.error(error);
    }
}



//  // Имитация конвертации файла
//  simulateConversion(file) {
//    return new Promise((resolve) => {
//      setTimeout(() => {
//        resolve(`Сконвертированное содержимое файла ${file.name}\n\nЭто пример текста, который будет получен после конвертации файла на сервере.`);
//      }, 1000);
//    });
//  }

  showFilePreview() {
    const selectedFile = this.fileSelector.value;

    if (selectedFile && this.files.has(selectedFile)) {
        const fileData = this.files.get(selectedFile);

        // Отображаем содержимое выбранного файла в текстовом поле
        this.textPreview.value = fileData.convertedText;
        this.docNumber.value = fileData.docNumber; // Отображаем номер документа (если нужно)

    } else {
        this.textPreview.value = ''; // Очищаем текстовое поле, если файл не выбран
        this.docNumber.value = ''; // Очищаем номер документа, если файл не выбран
    }
  }

async saveFiles() {
    if (this.files.size === 0) {
        alert('Пожалуйста, выберите файл для сохранения');
        return;
    }

    const dataToSend = []; // Массив для хранения данных обоих файлов

    // Собираем данные для каждого файла
    this.files.forEach((fileData, fileName) => {
        dataToSend.push({
            document_number: fileData.docNumber,
            content: fileData.convertedText,
            new_file_name: fileName // Новое имя файла
        });
    });

    try {
        const response = await fetch(updateUrl, { // Укажите правильный URL для вашего API
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken') // Устанавливаем CSRF-токен в заголовок
            },
            body: JSON.stringify(dataToSend) // Преобразуем данные в JSON
        });

        const responseData = await response.json();

        // Проверка успешности ответа
        if (response.ok) {
            alert('Файлы успешно сохранены');
            this.clearAll(); // Очищаем все поля после успешного сохранения
        } else {
            alert(responseData.message || 'Произошла ошибка при сохранении файлов');
        }
    } catch (error) {
        alert('Произошла ошибка при сохранении файлов');
        console.error(error);
    }
}




  // Имитация сохранения файлов
  simulateSaving(fileData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Сохранено:', fileData);
        resolve();
      }, 1000);
    });
  }

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

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Проверяем, начинается ли cookie с нужного имени
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const converter = new DocumentConverter();
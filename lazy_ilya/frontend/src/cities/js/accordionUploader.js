import {showError} from "./utils.js";

/**
 * Класс для обработки загрузки файла в аккордеоне с отображением прогресса через WebSocket.
 */
export class AccordionUploader {
    /**
     * @param {string} formId - ID формы загрузки.
     * @param {string} fileInputId - ID поля выбора файла.
     * @param {string} serverErrorId - ID элемента для отображения ошибок.
     */
    constructor(formId, fileInputId, serverErrorId) {
        /** @type {HTMLFormElement} */
        this.form = document.getElementById(formId);
        /** @type {HTMLInputElement} */
        this.fileInput = document.getElementById(fileInputId);
        /** @type {HTMLElement} */
        this.serverError = document.getElementById(serverErrorId);
        /** @type {HTMLElement} */
        this.infoMessage = document.getElementById('server-info');
        this.errorMessage = document.getElementById('errorMessage');

        this.initAccordion();
        this.initWebSocket();
        this.initFileUpload();
        this.initDownloadButton();  // <-- добавляем инициализацию кнопки скачивания
    }

    /**
     * Инициализация аккордеона с плавным раскрытием и поворотом иконки.
     */
    initAccordion() {
        document.querySelectorAll('.accordion-toggle').forEach(button => {
            button.addEventListener('click', () => {
                const content = button.nextElementSibling;
                const svg = button.querySelector('svg');

                const isOpen = content.classList.contains('max-h-600');

                // Закрыть все открытые аккордеоны
                document.querySelectorAll('.accordion-content').forEach(c => c.classList.remove('max-h-600'));
                document.querySelectorAll('.accordion-toggle svg').forEach(s => s.classList.remove('rotate-180'));

                // Открыть текущий, если он был закрыт
                setTimeout(() => {
                    if (!isOpen) {
                        content.classList.add('max-h-600');
                        svg.classList.add('rotate-180');
                    }
                }, 500);
            });
        });
    }

    /**
     * Устанавливает WebSocket-соединение и обрабатывает сообщения с прогрессом загрузки.
     */
    initWebSocket() {
        const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
        const socketUrl = `${wsScheme}://${window.location.host}/ws/upload/`;
        this.socket = new WebSocket(socketUrl);

        this.socket.onopen = () => {
            console.log("WebSocket подключен");
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Прогресс с сервера:", data);

            // Если данные содержат source, направляем в нужную функцию
            if (data.source === "download" && data.download_url) {
                this.triggerDownload(data.download_url);
                this.updateProgress(data.percent, "download");
            } else if (data.source === "download") {
                this.updateProgress(data.percent, "download");
            } else {
                // по умолчанию upload
                this.updateProgress(data.percent, "upload");
            }
        };


        this.socket.onclose = (event) => {
            console.log("WebSocket закрыт", event);
        };

        this.socket.onerror = (error) => {
            console.error("Ошибка WebSocket:", error);
        };
    }

    /**
     * Инициирует скачивание файла по переданному URL.
     * @param {string} url - Относительный путь к файлу (например, /media/globus_new.docx)
     */
    triggerDownload(url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = "globus_new.docx"; // можно задать имя файла, например: "globus.docx"
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }


    /**
     * Обновляет визуальный прогресс загрузки или скачивания.
     * @param {number} progress - Значение прогресса от 0 до 100.
     * @param {string} type - Тип прогресса: 'upload' или 'download'.
     */
    updateProgress(progress, type = "upload") {
        const container = document.getElementById(`${type}-progress-container`);
        const bar = document.getElementById(`${type}-progress-bar`);
        const text = document.getElementById(`${type}-progress-text`);

        if (container && bar && text) {
            container.classList.remove("hidden");
            bar.style.width = `${progress}%`;
            text.textContent = `Файл обработан на ${progress}%`;
        }

        if (progress >= 100) {
            this.showSuccessMessage(`${type === "download" ? "Загрузка" : "Обработка"} успешно завершена!`);
            this.fileInput.value = '';  // если нужно — только для upload

            setTimeout(() => {
                container.classList.add("hidden");
                bar.style.width = "0%";
                text.textContent = "0%";
            }, 2000);
        }
    }


    /**
     * Инициализирует обработку отправки формы и валидацию файла.
     */
    initFileUpload() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const file = this.fileInput.files[0];
            if (!file || file.name !== "globus.docx") {
                this.errorMessage.classList.remove("hidden");
                showError('Нужно добавить файл с названием globus.docx!!!');
                this.fileInput.classList.remove("correct_input");
                this.fileInput.classList.add("error_input");

                setTimeout(() => {
                    this.fileInput.classList.add("correct_input");
                    this.fileInput.classList.remove("error_input");
                    this.errorMessage.classList.add("hidden");
                }, 4000);
                return;
            } else {
                this.errorMessage.classList.add("hidden");
            }

            const formData = new FormData();
            formData.append("cityFile", file);  // Название поля должно совпадать с серверной логикой

            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

            try {
                const response = await fetch(this.form.action, {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": csrfToken,
                    },
                    body: formData,
                });

                const result = await response.json();

                if (response.ok) {
                    const message = result.message || "Файл успешно загружен";
                    console.log(message);
                    // Можно отобразить сообщение
                } else {
                    showError(result.error || "Ошибка загрузки файла");
                }

            } catch (err) {
                alert("Произошла ошибка при отправке файла");
                console.error(err);
            }
        });
    }

    /**
     * Показывает сообщение об успехе с анимацией.
     * @param {string} message - Текст сообщения.
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
     * Инициализация обработки кнопки "Скачать файл".
     */
    initDownloadButton() {
        const downloadBtn = document.getElementById('downloadFileBtn');
        if (!downloadBtn) return;

        downloadBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            try {
                const response = await fetch('city-download/'); // Укажи правильный URL для загрузки файла

                if (!response.ok) {
                    throw new Error(`Ошибка при запросе: ${response.status}`);
                }

                const data = await response.json();

                if (data.status === 'success') {
                    this.showSuccessMessage('Создание файла запущено. Следите за прогрессом.');
                    // Здесь можно запускать визуальный прогресс-бар или слушать WebSocket-сообщения
                } else {
                    this.showErrorMessage('Ошибка на сервере при запуске создания файла.');
                }
            } catch (error) {
                this.showErrorMessage(`Ошибка: ${error.message}`);
            }
        });
    }
}

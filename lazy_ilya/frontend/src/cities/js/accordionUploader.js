import {showError} from "../../file_creator/js/utils.js";
import * as timers from "node:timers";

export class AccordionUploader {
    constructor(formId, fileInputId, errorMessageId) {
        this.form = document.getElementById(formId);
        this.fileInput = document.getElementById(fileInputId);
        this.errorMessage = document.getElementById(errorMessageId);
        this.infoMessage = document.getElementById('server-info');

        this.initAccordion();
        this.initWebSocket();  // <-- Добавляем вызов инициализации WebSocket
        this.initFileUpload();

    }

    initAccordion() {
        document.querySelectorAll('.accordion-toggle').forEach(button => {
            button.addEventListener('click', () => {
                const content = button.nextElementSibling;
                const svg = button.querySelector('svg');

                const isOpen = content.classList.contains('max-h-96');

                document.querySelectorAll('.accordion-content').forEach(c => c.classList.remove('max-h-96'));
                document.querySelectorAll('.accordion-toggle svg').forEach(s => s.classList.remove('rotate-180'));

                setTimeout(() => {
                    if (!isOpen) {
                        content.classList.add('max-h-150');
                        svg.classList.add('rotate-180');
                    }
                }, 500);
            });
        });
    }

    initWebSocket() {
        const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
        const socketUrl = `${wsScheme}://${window.location.host}/ws/upload/`;  // поменяй на свой url если надо
        this.socket = new WebSocket(socketUrl);

        this.socket.onopen = () => {
            console.log("WebSocket подключен");
        };

        this.socket.onmessage = (event) => {
            // console.log(event)
            const data = JSON.parse(event.data);
            console.log("Прогресс с сервера:", data);
            this.updateProgress(data);
        };

        this.socket.onclose = (event) => {
            console.log("WebSocket закрыт", event);
        };

        this.socket.onerror = (error) => {
            console.error("Ошибка WebSocket:", error);
        };
    }

    updateProgress(progress) {
        const container = document.getElementById("upload-progress-container");
        const bar = document.getElementById("upload-progress-bar");
        const text = document.getElementById("upload-progress-text");

        if (container && bar && text) {
            container.classList.remove("hidden");
            bar.style.width = `${progress}%`;
            text.textContent = `${progress}%`;
        }

        if (progress >= 100) {
            // Показываем сообщение об успешном завершении
            this.showSuccessMessage("Обработка успешно завершена!");
            this.fileInput.value = '';
            setTimeout(() => {
                container.classList.add("hidden");
                bar.style.width = "0%";
                text.textContent = "0%";
            }, 2000); // скрываем через 2 сек после завершения
        }
    }

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
                }, 4000);
                return;
            } else {
                this.errorMessage.classList.add("hidden");
            }

            const formData = new FormData();
            formData.append("cityFile", file); // должно совпадать с request.FILES.get("cityFile")

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
                    // this.showSuccessMessage(message);

                } else {
                    // alert(result.error || "Ошибка загрузки файла");
                    showError(result.error || "Ошибка загрузки файла")
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
        serverInfo.classList.remove('hidden', 'animate-popup-reverse');
        serverInfo.classList.add('flex', 'animate-popup');
        serverInfo.querySelector('p').textContent = message;

        setTimeout(() => {
            serverInfo.classList.remove('animate-popup');
            serverInfo.classList.add('animate-popup-reverse');
            setTimeout(() => {
                serverInfo.classList.add('hidden');
                serverInfo.classList.remove('flex', 'animate-popup-reverse');
            }, 1000);
        }, 4000);
    }
}

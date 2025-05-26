import {showError} from "../../file_creator/js/utils.js";

export class CityFormHandler {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.dockInput = this.form.querySelector('#dock-num');
        this.tableSelect = this.form.querySelector('#table-name');
        this.closeModalBtn = document.getElementById('close-modal');
        this.saveCity = document.getElementById('save-city');
        this.isEditMode = false; // <--- флаг редактирования
        /** @type {string} */
        this.csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        this.infoMessage = document.getElementById('server-info');

        this.fields = {
            location: this.form.querySelector('#location'),
            name_organ: this.form.querySelector('#name-organ'),
            pseudonim: this.form.querySelector('#pseudonim'),
            letters: this.form.querySelector('#letters'),
            writing: this.form.querySelector('#writing'),
            ip_address: this.form.querySelector('#ip-address'),
            some_number: this.form.querySelector('#some-number'),
            work_time: this.form.querySelector('#work-time')
        };

        this.init();
        this.initCancelButton();
        this.initSaveButton(); // <--- добавим обработчик сохранения

    }

    init() {
        this.dockInput.addEventListener('input', () => this.handleDockNumInput(false));
        this.tableSelect.addEventListener('change', () => this.handleDockNumInput());
    }

    async handleDockNumInput(first = true) {
        const tableId = this.tableSelect.value;
        if (!tableId) {
            this.clearFields();
            return;
        }

        const dockNum = first ? '' : this.dockInput.value;

        // Если пользователь вводит вручную и поле пустое — очищаем поля и не запрашиваем
        if (!first && dockNum.trim() === '') {
            this.clearFields();
            return;
        }

        try {
            const response = await fetch(`city-info/?dock_num=${dockNum}&table_id=${tableId}`);
            const result = await response.json();

            if (result.found) {
                this.fillFields(result.data);
                this.saveCity.textContent = 'Сохранить изменения';
                this.isEditMode = true;
                if (first) {
                    this.dockInput.value = result.data.dock_num || '';
                }
            } else if (result.last_num) {
                if (first) {
                    this.dockInput.value = result.last_num;
                    this.clearFields();
                }
                this.saveCity.textContent = 'Создать запись';
                this.isEditMode = false;
            } else {
                this.saveCity.textContent = 'Создать запись';
                this.clearFields();
                this.isEditMode = false;
            }
        } catch (err) {
            console.error('Ошибка при получении данных:', err);
        }
    }

    initSaveButton() {
        this.saveCity.addEventListener('click', async () => {
            // Проверка выбора таблицы
            if (!this.tableSelect.value) {
                showError('Пожалуйста, выберите название таблицы')
                this.tableSelect.focus();
                return; // Останавливаем выполнение, форма не отправится
            }
            const method = this.isEditMode ? 'PUT' : 'POST';
            const url = 'city-info/'; // Укажи конечную точку Django
            const data = {
                dock_num: this.dockInput.value,
                table_id: this.tableSelect.value,
                location: this.fields.location.value,
                name_organ: this.fields.name_organ.value,
                pseudonim: this.fields.pseudonim.value,
                letters: this.fields.letters.checked,
                writing: this.fields.writing.checked,
                ip_address: this.fields.ip_address.value,
                some_number: this.fields.some_number.value,
                work_time: this.fields.work_time.value,
            };

            try {
                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': this.csrfToken,
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    // alert('Данные успешно сохранены')
                    this.showSuccessMessage(`Данные успешно сохранены для записи №
                    ${data.dock_num} ${data.name_organ ? '- ' + data.name_organ : ''} ${data.location ? '- ' + data.location : ''}`);
                    this.form.reset();
                    this.saveCity.textContent = 'Сохранить';
                    this.isEditMode = false;
                } else {
                    // Получаем тело ошибки в JSON
                    const errorData = await response.json();
                    // Примерно errorData.errors - это объект с ошибками
                    let errorMsg = '';
                    for (const field in errorData.errors) {
                        errorMsg += `${field}: ${errorData.errors[field].join(', ')}\n`;
                    }
                    showError('Ошибка при сохранении:\n' + errorMsg);
                }
            } catch (err) {
                console.error('Ошибка при отправке формы:', err);
            }
        });
    }


    fillFields(data) {
        this.fields.location.value = data.location || '';
        this.fields.name_organ.value = data.name_organ || '';
        this.fields.pseudonim.value = data.pseudonim || '';
        this.fields.letters.checked = data.letters ?? false;
        this.fields.writing.checked = data.writing ?? false;
        this.fields.ip_address.value = data.ip_address || '';
        this.fields.some_number.value = data.some_number || '';
        this.fields.work_time.value = data.work_time || '';
    }

    clearFields() {
        Object.entries(this.fields).forEach(([key, el]) => {
            if (el.type === 'checkbox') {
                el.checked = false;
            } else {
                el.value = '';
            }
        });
    }

    /**
     * Инициализирует обработчик кнопки отмены — сброс формы.
     */
    initCancelButton() {
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => {
                this.form.reset();
                this.saveCity.textContent = 'Сохранить';
                this.isEditMode = false;
            });
        }
    }

    /**
     * Показывает сообщение об успехе с анимацией.
     * @param {string} message - Текст сообщения.
     */
    showSuccessMessage(message) {
        const serverInfo = this.infoMessage;
        serverInfo.classList.remove('hidden', 'animate-popup-reverse');
        serverInfo.classList.add('flex', 'animate-popup');
        serverInfo.querySelector('p').textContent = message;
        serverInfo.scrollIntoView({behavior: 'smooth', block: 'start'});
        // Мягкий скролл к блоку ошибки


        setTimeout(() => {
            serverInfo.classList.remove('animate-popup');
            serverInfo.classList.add('animate-popup-reverse');
            serverInfo.scrollIntoView({behavior: 'smooth', block: 'start'});
            setTimeout(() => {
                serverInfo.classList.add('hidden');
                serverInfo.classList.remove('flex', 'animate-popup-reverse');
            }, 1000);
        }, 4000);
    }

}
import {showError} from "./utils.js";

/**
 * Обработчик модального окна редактирования и удаления карточек городов.
 */
export class CityModalHandler {
    /**
     * @param {string} modalId - ID модального окна.
     * @param {Array<Object>} citiesData - Массив объектов с данными о городах.
     */
    constructor(modalId, citiesData = []) {
        /** @type {HTMLElement|null} */
        this.modal = document.getElementById(modalId);
        /** @type {HTMLFormElement|null} */
        this.form = this.modal?.querySelector('form');
        this.saveBtn = this.modal?.querySelector('#save-city');
        this.deleteBtn = this.modal?.querySelector('#delete-city');
        this.closeBtn = this.modal?.querySelector('#close-modal');
        /** @type {string} */
        this.csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        /** @type {Object|null} */
        this.currentCity = null;
        /** @type {Array<Object>} */
        this.citiesData = citiesData;

        this.bindEvents();
        this.observeCards();
    }

    /**
     * Привязывает обработчики событий для кнопок модального окна и клавиш.
     */
    bindEvents() {
        this.closeBtn?.addEventListener('click', () => this.hideModal());

        this.saveBtn?.addEventListener('click', async () => {
            if (!this.currentCity) return;
            const updatedData = this.getFormData();
            await this.updateCity(this.currentCity, updatedData);
            this.hideModal();
        });

        this.deleteBtn?.addEventListener('click', async () => {
            if (!this.currentCity) return;
            await this.deleteCity(this.currentCity);
            this.hideModal();
        });

        window.addEventListener('click', (e) => {
            if (!this.modal || this.modal.classList.contains('hidden')) return;

            const isClickOutside = !this.modal.querySelector('form')?.contains(e.target);
            const isClickInsideModal = this.modal.contains(e.target);

            if (isClickOutside && isClickInsideModal) {
                this.hideModal();
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.hideModal();
            }
        });
    }

    /**
     * Отслеживает клики по карточкам и открывает модальное окно с данными города.
     */
    observeCards() {
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.card-style');
            if (!card) return;

            const cityData = card.dataset.city ? JSON.parse(card.dataset.city) : null;
            if ("pseudonim" in cityData && this.modal.querySelector('#modal-pseudonim')) {
                this.showModal(cityData);
            } else if ("korr" in cityData && this.modal.querySelector('#modal-korr')) {
                this.showModal(cityData);
            }

        });
    }

    /**
     * Открывает модальное окно с данными выбранного города.
     * @param {Object} city - Объект с данными города.
     */
    showModal(city) {
        this.currentCity = city;
        // console.log(this.currentCity);
        if (this.modal && "pseudonim" in this.currentCity) {
            this.modal.querySelector('#modal-location').value = city.location || '';
            this.modal.querySelector('#modal-name_organ').value = city.name_organ || '';
            this.modal.querySelector('#modal-pseudonim').value = city.pseudonim || '';
            this.modal.querySelector('#modal-work_time').value = city.work_time || '';
            this.modal.querySelector('#modal-table_name').value = city.table_name || '';
            this.modal.querySelector('#modal-number').value = city.dock_num || '';
            this.modal.querySelector('#modal-some_number').value = city.some_number || '';
            this.modal.querySelector('#modal-ip_address').value = city.ip_address || '';
            this.modal.classList.remove('hidden');
            this.form?.classList.add('animate-popup');

        } else if (this.modal && "korr" in this.currentCity) {
            console.log(city);
            this.modal.querySelector('#modal-korr').value = city.korr || '';
            this.modal.querySelector('#modal-m_b_number').value = city.m_b_number || '';
            this.modal.querySelector('#modal-cipa').value = city.cipa || '';
            this.modal.querySelector('#modal-globus').value = city.globus || '';
            this.modal.querySelector('#modal-recipient').value = city.recipient || '';
            this.modal.querySelector('#modal-phone_number').value = city.phone_number || '';
            this.modal.querySelector('#modal-ip_phone').value = city.ip_phone || '';
            this.modal.querySelector('#modal-notes').value = city.notes || '';
            this.modal.classList.remove('hidden');
            this.form?.classList.add('animate-popup');
        }
    }

    /**
     * Скрывает модальное окно и сбрасывает текущий выбранный город.
     */
    hideModal() {
        this.modal?.classList.add('hidden');
        this.currentCity = null;
    }

    /**
     * Получает данные из формы модального окна.
     * @returns {Object} Объект с обновлёнными данными города.
     */
    getFormData() {
        return {
            location: this.modal.querySelector('#modal-location').value.trim(),
            name_organ: this.modal.querySelector('#modal-name_organ').value.trim(),
            pseudonim: this.modal.querySelector('#modal-pseudonim').value.trim(),
            work_time: this.modal.querySelector('#modal-work_time').value.trim(),
            table_name: this.modal.querySelector('#modal-table_name').value.trim(),
            some_number: this.modal.querySelector('#modal-some_number').value.trim(),
            ip_address: this.modal.querySelector('#modal-ip_address').value.trim(),
            table_id: this.currentCity?.table_id || null
        };
    }

    /**
     * Отправляет PUT-запрос для обновления данных города.
     * @param {Object} currentCity - Объект текущего города.
     * @param {Object} data - Обновлённые данные города.
     */
    async updateCity(currentCity, data) {
        try {
            const response = await fetch(`cities/${currentCity.table_id}/${currentCity.dock_num}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken,
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                if (errorData && errorData.message === "Authentication required") {
                    window.location.href = "/login/?next=" + encodeURIComponent(window.location.pathname);
                    return;
                }
                let errorMsg = '';
                for (const field in errorData.errors) {
                    errorMsg += `${field}: ${errorData.errors[field].join(', ')}\n`;
                }
                showError('Ошибка при сохранении:\n' + errorMsg);
                return;
            }

            // Обновляем citiesData
            const index = this.citiesData.findIndex(city =>
                city.table_id === currentCity.table_id &&
                city.dock_num === currentCity.dock_num
            );

            if (index !== -1) {
                Object.assign(this.citiesData[index], data);
            }

            Object.assign(currentCity, data);

            // Обновляем DOM
            const container = document.getElementById('city-cards');
            const cards = container.querySelectorAll('.card-style');
            document.getElementById('default-search').value = '';
            for (const card of cards) {
                const cityData = JSON.parse(card.dataset.city || '{}');
                if (
                    cityData.table_id === currentCity.table_id &&
                    cityData.dock_num === currentCity.dock_num
                ) {
                    card.dataset.city = JSON.stringify(currentCity);

                    const props = [
                        ['Организация', currentCity.name_organ],
                        ['Псевдоним', currentCity.pseudonim],
                        ['Время работы', currentCity.work_time],
                        ['Название раздела', currentCity.table_name],
                        ['Номер в таблице', currentCity.some_number],
                        ['IP address', currentCity.ip_address],
                    ];

                    card.innerHTML = `<h3 class="text-lg font-semibold mb-2 text-center">${currentCity.location || 'Неизвестно'}</h3>` +
                        props
                            .filter(([_, val]) => val)
                            .map(([label, val]) => `<p><strong>${label}:</strong> ${val}</p>`)
                            .join('');

                    break;

                }
            }

            this.showSuccessMessage(`Город "${data.name_organ}" успешно обновлён`);
        } catch (error) {
            console.error('Ошибка PUT-запроса:', error);
            showError(error);
        }
    }

    /**
     * Удаляет город, отправляя DELETE-запрос, и обновляет DOM.
     * @param {Object} currentCity - Объект текущего города.
     */
    async deleteCity(currentCity) {
        // Показываем окно подтверждения
        const confirmed = await this.showDeleteConfirmation(currentCity);
        if (!confirmed) {
            return; // Пользователь отменил удаление
        }

        try {
            const response = await fetch(`cities/${currentCity.table_id}/${currentCity.dock_num}/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                if (errorData && errorData.message === "Authentication required") {
                    window.location.href = "/login/?next=" + encodeURIComponent(window.location.pathname);
                    return;
                }
                showError(errorData?.message || 'Ошибка при удалении города');
                return;
            }

            // Удаляем из локальных данных
            const index = this.citiesData.findIndex(city =>
                city.table_id === currentCity.table_id && city.dock_num === currentCity.dock_num
            );

            if (index !== -1) {
                this.citiesData.splice(index, 1);
            }

            // Удаляем карточку из DOM
            const container = document.getElementById('city-cards');
            const cards = container.querySelectorAll('.card-style');
            document.getElementById('default-search').value = '';

            for (const card of cards) {
                const cityData = JSON.parse(card.dataset.city || '{}');
                if (
                    cityData.table_id === currentCity.table_id &&
                    cityData.dock_num === currentCity.dock_num
                ) {
                    card.remove();
                    break;
                }
            }

            this.showSuccessMessage(`Город "${currentCity.name_organ}" успешно удалён`);
            this.hideModal();
        } catch (error) {
            console.error('Ошибка DELETE-запроса:', error);
            showError(error);
        }
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
     * Отображает модальное окно с подтверждением удаления города.
     * Возвращает Promise, который резолвится в true при подтверждении и false при отмене.
     *
     * @param {Object} cityToDelete - Объект города, который пользователь хочет удалить.
     * @param {string} cityToDelete.name_organ - Название организации (города), отображаемое в подтверждении.
     * @returns {Promise<boolean>} Promise, который возвращает true, если пользователь подтвердил удаление, и false — если отменил.
     */
    showDeleteConfirmation(cityToDelete) {
        return new Promise((resolve) => {
            const serverInfo = document.getElementById('server-info');
            serverInfo.classList.remove('hidden', 'animate-popup-reverse');
            serverInfo.classList.add('flex', 'animate-popup');
            serverInfo.querySelector('h3').textContent = 'Подтверждение удаления';
            serverInfo.querySelector('p').textContent = `Вы уверены, что хотите удалить "${cityToDelete.name_organ}"?`;
            serverInfo.scrollIntoView({behavior: 'smooth', block: 'start'});

            const divBtn = document.getElementById('btn-div');
            divBtn.innerHTML = '';

            const confirmBtn = document.createElement('button');
            confirmBtn.id = 'confirm-delete';
            confirmBtn.textContent = 'Удалить';
            confirmBtn.classList.add('btn-submit', '!p-1', '!font-medium');

            const cancelBtn = document.createElement('button');
            cancelBtn.id = 'cancel-delete';
            cancelBtn.textContent = 'Отмена';
            cancelBtn.classList.add('btn-cancel', '!p-1', '!font-medium');

            divBtn.appendChild(confirmBtn);
            divBtn.appendChild(cancelBtn);

            let resolved = false;  // 🔒 защита от двойного resolve

            const cleanup = () => {
                return new Promise((res) => {
                    serverInfo.classList.remove('animate-popup');
                    serverInfo.classList.add('animate-popup-reverse');
                    setTimeout(() => {
                        divBtn.innerHTML = '';
                        serverInfo.querySelector('h3').textContent = '';
                        serverInfo.querySelector('p').textContent = '';
                        serverInfo.classList.add('hidden');
                        res();
                    }, 1000);
                });
            };

            // Автоматическая отмена через 30 секунд
            const timeoutId = setTimeout(() => {
                if (resolved) return;
                resolved = true;
                cleanup().then(() => resolve(false));
            }, 5000); // ✅ 30 секунд

            confirmBtn.addEventListener('click', () => {
                if (resolved) return;
                resolved = true;
                clearTimeout(timeoutId);
                cleanup().then(() => resolve(true));
            });

            cancelBtn.addEventListener('click', () => {
                if (resolved) return;
                resolved = true;
                clearTimeout(timeoutId);
                cleanup().then(() => resolve(false));
            });
        });
    }


}

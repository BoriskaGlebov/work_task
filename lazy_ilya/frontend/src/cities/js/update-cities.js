import {showError} from "../../file_creator/js/utils.js";

export class CityModalHandler {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        this.form = this.modal?.querySelector('form');
        this.saveBtn = this.modal?.querySelector('#save-city');
        this.deleteBtn = this.modal?.querySelector('#delete-city');
        this.closeBtn = this.modal?.querySelector('#close-modal');
        // Получаем CSRF токен из скрытого поля в форме
        this.csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        this.currentCity = null;
        this.citiesData = citiesData;

        this.bindEvents();
        this.observeCards();
    }

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
            await this.deleteCity(this.currentCity.id);
            this.hideModal();
        });
        // 🖱 Закрытие по клику вне формы
        window.addEventListener('click', (e) => {
            if (!this.modal || this.modal.classList.contains('hidden')) return;

            // Проверка, что клик был вне модального окна
            const isClickOutside = !this.modal.querySelector('form')?.contains(e.target);
            const isClickInsideModal = this.modal.contains(e.target);

            if (isClickOutside && isClickInsideModal) {
                this.hideModal();
            }
        });

        // ⎋ Закрытие по клавише ESC
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.hideModal();
            }
        });
    }

    observeCards() {
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.card-style');
            if (!card) return;

            const cityData = card.dataset.city ? JSON.parse(card.dataset.city) : null;
            if (cityData) {
                this.showModal(cityData);
            }
        });
    }

    showModal(city) {
        this.currentCity = city;

        if (this.modal) {
            this.modal.querySelector('#modal-location').value = city.location || '';
            this.modal.querySelector('#modal-name_organ').value = city.name_organ || '';
            this.modal.querySelector('#modal-pseudonim').value = city.pseudonim || '';
            this.modal.querySelector('#modal-work_time').value = city.work_time || '';
            this.modal.querySelector('#modal-table_name').value = city.table_name || '';
            this.modal.querySelector('#modal-number').value = city.dock_num || '';
            this.modal.querySelector('#modal-some_number').value = city.some_number || '';
            this.modal.querySelector('#modal-ip_address').value = city.ip_address || '';
            this.modal.classList.remove('hidden');
        }
    }

    hideModal() {
        this.modal?.classList.add('hidden');
        this.currentCity = null;
    }

    getFormData() {
        return {
            location: this.modal.querySelector('#modal-location').value.trim(),
            name_organ: this.modal.querySelector('#modal-name_organ').value.trim(),
            pseudonim: this.modal.querySelector('#modal-pseudonim').value.trim(),
            work_time: this.modal.querySelector('#modal-work_time').value.trim(),
            table_name: this.modal.querySelector('#modal-table_name').value.trim(),
            some_number: this.modal.querySelector('#modal-some_number').value.trim(),
            ip_address: this.modal.querySelector('#modal-ip_address').value.trim(),
            table_id: this.currentCity?.table_id || null // ← вот здесь!
        };
    }

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

            // Обработка ошибки
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const message = errorData?.message || 'Ошибка при обновлении города';
                showError(message);
                return;
            }

            // alert('Город успешно обновлён');
            const serverInfo = document.getElementById('server-info');
            serverInfo.classList.remove('hidden');
            serverInfo.classList.add('flex', 'animate-popup');
            // serverInfo.querySelector('h3').textContent = `Успешное обновление "${data.name_organ}"`;
            serverInfo.querySelector('p').textContent = `Город "${data.name_organ}" Успешно обновлен`;
            setTimeout(() => {
                serverInfo.classList.remove('animate-popup');
                serverInfo.classList.add('animate-popup-reverse');

                setTimeout(() => {
                    serverInfo.classList.add('hidden');
                    serverInfo.classList.remove('flex', 'animate-popup-reverse');
                }, 1000);
            }, 4000);

            const index = this.citiesData.findIndex(city =>
                city.table_id === currentCity.table_id &&
                city.dock_num === currentCity.dock_num
            );

            if (index !== -1) {
                Object.assign(this.citiesData[index], data);
            }

            Object.assign(currentCity, data);

            // Обновление карточки в DOM
            const container = document.getElementById('city-cards');
            const cards = container.querySelectorAll('.card-style');

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

            this.modal.classList.add('hidden');

        } catch (error) {
            console.error('Ошибка PUT-запроса:', error);
            showError(error)
        }
    }


    async deleteCity(cityId) {
        try {
            const response = await fetch(`/api/cities/${cityId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                alert('Ошибка при удалении города');
            } else {
                alert('Город удалён');
                document.querySelector(`[data-city-id="${cityId}"]`)?.remove();
            }
        } catch (error) {
            console.error('Ошибка DELETE-запроса:', error);
        }
    }
}

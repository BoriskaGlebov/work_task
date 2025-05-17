export class CityModalHandler {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        this.form = this.modal?.querySelector('form');
        this.saveBtn = this.modal?.querySelector('#save-city');
        this.deleteBtn = this.modal?.querySelector('#delete-city');
        this.closeBtn = this.modal?.querySelector('#close-modal');

        this.currentCity = null;

        this.bindEvents();
        this.observeCards();
    }

    bindEvents() {
        this.closeBtn?.addEventListener('click', () => this.hideModal());

        this.saveBtn?.addEventListener('click', async () => {
            if (!this.currentCity) return;
            const updatedData = this.getFormData();
            await this.updateCity(this.currentCity.id, updatedData);
            this.hideModal();
        });

        this.deleteBtn?.addEventListener('click', async () => {
            if (!this.currentCity) return;
            await this.deleteCity(this.currentCity.id);
            this.hideModal();
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
            this.modal.querySelector('#modal-table_id').value = city.table_id || '';
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
            table_id: this.modal.querySelector('#modal-table_id').value.trim(),
            some_number: this.modal.querySelector('#modal-some_number').value.trim(),
            ip_address: this.modal.querySelector('#modal-ip_address').value.trim(),
        };
    }

    async updateCity(cityId, data) {
        try {
            const response = await fetch(`/api/cities/${cityId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                alert('Ошибка при обновлении города');
            } else {
                alert('Город успешно обновлён');
            }
        } catch (error) {
            console.error('Ошибка PUT-запроса:', error);
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

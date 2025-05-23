export class CityFormHandler {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.dockInput = this.form.querySelector('#dock-num');
        this.tableSelect = this.form.querySelector('#table-name');

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
                if (first) {
                    this.dockInput.value = result.data.dock_num || '';
                }
            } else if (result.last_num) {
                if (first) {
                    this.dockInput.value = result.last_num;
                    this.clearFields();
                }
            } else {
                this.clearFields();
            }
        } catch (err) {
            console.error('Ошибка при получении данных:', err);
        }
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
}
export class CityFormHandler {
    constructor(formSelector) {
        this.form = document.querySelector(formSelector);
        this.tableSelect = this.form.getElementById("table-name");
        this.dockInput = this.form.querySelector("#dock-num");

        this.initListeners();
    }

    initListeners() {
        if (this.tableSelect) {
            this.tableSelect.addEventListener("change", () => this.handleTableChange());
        }

        if (this.dockInput) {
            this.dockInput.addEventListener("input", () => this.handleDockInput());
        }
    }

    async handleTableChange() {
        const tableId = this.tableSelect.value;
        if (!tableId) return;

        try {
            const response = await fetch(`/api/last-dock-num/${tableId}/`);
            const data = await response.json();
            if (data.last_dock_num) {
                this.dockInput.value = data.last_dock_num;
                this.handleDockInput(); // подтянуть данные автоматически
            }
        } catch (err) {
            console.error("Ошибка при получении номера:", err);
        }
    }

    async handleDockInput() {
        const dockNum = this.dockInput.value;
        const tableId = this.tableSelect.value;
        if (!tableId || !dockNum) return;

        try {
            const response = await fetch(`/api/row/${tableId}/${dockNum}/`);
            const data = await response.json();
            if (data.error) return;

            this.fillFormFields(data);
        } catch (err) {
            console.error("Ошибка при получении строки:", err);
        }
    }

    fillFormFields(data) {
        this.setInputValue("location", data.location);
        this.setInputValue("name-organ", data.name_organ);
        this.setInputValue("pseudonim", data.pseudonim);
        this.setInputValue("ip-address", data.ip_address);
        this.setInputValue("some-number", data.some_number);
        this.setInputValue("work-time", data.work_time);
        // Добавляй остальные поля по аналогии
    }

    setInputValue(id, value) {
        const input = this.form.querySelector(`#${id}`);
        if (input) {
            input.value = value || "";
        }
    }
}

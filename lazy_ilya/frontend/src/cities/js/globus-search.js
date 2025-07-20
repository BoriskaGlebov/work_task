export class InlineGlobusAutocomplete {
    constructor(inputSelector, citiesData) {
        this.input = document.querySelector(inputSelector);
        this.wrapper = this.input.closest('.autocomplete-wrapper');
        this.hintBox = this.wrapper.querySelector('.autocomplete-hint');
        this.citiesData = citiesData;
        this.selectedPk = null;

        this.syncHintStyle();
        this.initEvents();
    }

    syncHintStyle() {
        // Копируем стили шрифта и паддинги в hintBox
        const inputStyle = window.getComputedStyle(this.input);
        this.hintBox.style.font = inputStyle.font;
        this.hintBox.style.padding = inputStyle.padding;
        this.hintBox.style.lineHeight = inputStyle.lineHeight;
        this.hintBox.style.height = inputStyle.height;
    }

    initEvents() {
        this.input.addEventListener('input', () => this.updateHint());
        this.input.addEventListener('keydown', (e) => {
            if ((e.key === 'ArrowRight' || e.key === 'Tab') && this.hintBox.textContent) {
                e.preventDefault();
                this.acceptHint();
            }
        });
    }

    updateHint() {
        const query = this.input.value;
        this.hintBox.textContent = '';
        this.selectedPk = null;

        if (!query) return;

        const match = this.citiesData.find(city =>
            city.pseudonim?.toLowerCase().startsWith(query.toLowerCase())
        );

        if (match) {
            // Показываем подсказку с текущим введенным текстом + дополнением
            this.hintBox.textContent = match.pseudonim;
            this.selectedPk = match.pk;
        }
    }

    acceptHint() {
        if (this.hintBox.textContent) {
            this.input.value = this.hintBox.textContent;
            this.hintBox.textContent = '';
        }
    }

    getSelectedPk() {
        return this.selectedPk;
    }
}

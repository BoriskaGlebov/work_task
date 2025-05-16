export class CityAutocomplete {
    constructor(inputId, suggestionsId, citiesData = []) {
        this.input = document.getElementById(inputId);
        this.suggestions = document.getElementById(suggestionsId);
        this.citiesData = citiesData;
        this.selectedIndex = -1;

        if (!this.input || !this.suggestions) {
            console.warn("CityAutocomplete: Элементы не найдены на странице.");
            return;
        }

        this.bindEvents();
    }

    bindEvents() {
        this.input.addEventListener('input', () => this.handleInput());
        this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('click', (e) => this.handleDocumentClick(e));
    }

    clearSelection() {
        const items = this.suggestions.querySelectorAll('li');
        items.forEach(item => item.classList.remove('bg-gray-300'));
        this.selectedIndex = -1;
    }

    highlightItem(index) {
        const items = this.suggestions.querySelectorAll('li');
        if (items.length === 0) return;

        this.clearSelection();

        if (index < 0) index = items.length - 1;
        if (index >= items.length) index = 0;

        const item = items[index];
        item.classList.add('bg-gray-300');
        this.selectedIndex = index;

        item.scrollIntoView({block: 'nearest'});
    }

    createCityCard(city) {
        const container = document.getElementById('city-cards');
        if (!container) return;

        const card = document.createElement('a');
        card.classList.add('card-style');

        card.innerHTML = `
            <h3 class="text-lg font-semibold mb-2 text-center">${city.location || 'Неизвестно'}</h3>
            ${city.name_organ ? `<p><strong>Организация:</strong> ${city.name_organ}</p>` : ''}
            ${city.pseudonim ? `<p><strong>Псевдоним:</strong> ${city.pseudonim}</p>` : ''}
            ${city.work_time ? `<p><strong>Время работы:</strong> ${city.work_time}</p>` : ''}
            ${city.table_id ? `<p><strong>Номер раздела:</strong> ${city.table_id}</p>` : ''}
            ${city.some_number ? `<p><strong>Номер в  таблице:</strong> ${city.some_number}</p>` : ''}
            ${city.ip_address ? `<p><strong>IP address:</strong> ${city.ip_address}</p>` : ''}`;

        container.appendChild(card);
    }

    clearCityCards() {
        const container = document.getElementById('city-cards');
        if (container) {
            container.innerHTML = '';
        }
    }

    async renderCardsWithDelay(cities, delay = 100) {
        for (const city of cities) {
            this.createCityCard(city);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }


    handleInput() {
        const query = this.input.value.toLowerCase().trim();
        this.suggestions.innerHTML = '';
        this.clearSelection();
        this.clearCityCards();

        if (!query) {
            this.suggestions.style.display = 'none';
            return;
        }

        const matched = this.citiesData
            .filter(city =>
                (city.location && city.location.toLowerCase().includes(query)) ||
                (city.name_organ && city.name_organ.toLowerCase().includes(query)) ||
                (city.pseudonim && city.pseudonim.toLowerCase().includes(query))
            )
            .slice(0, 20);

        if (matched.length === 0) {
            this.suggestions.style.display = 'none';
            return;
        }

        matched.forEach((city, index) => {
            const li = document.createElement('li');
            let text = city.location || '';
            if (city.name_organ) text += ` — ${city.name_organ}`;
            if (city.pseudonim) text += ` — (${city.pseudonim})`;

            li.textContent = text;
            li.classList.add('cursor-pointer', 'px-3', 'py-1', 'hover:bg-gray-200');

            li.addEventListener('click', () => {
                this.input.value = `${city.location} - ${city.name_organ} - ${city.pseudonim}`;
                this.suggestions.style.display = 'none';
                this.clearSelection();
                this.createCityCard(city);
            });

            this.suggestions.appendChild(li);
        });

        this.suggestions.style.display = 'block';
    }

    handleKeyDown(e) {
        const items = this.suggestions.querySelectorAll('li');
        if (!items.length) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.highlightItem(this.selectedIndex + 1);
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.highlightItem(this.selectedIndex - 1);
                break;

            case 'Enter':
                e.preventDefault();

                if (this.selectedIndex >= 0 && this.selectedIndex < items.length) {
                    items[this.selectedIndex].click();
                } else {
                    this.suggestions.style.display = 'none';
                    this.clearSelection();

                    const query = this.input.value.toLowerCase().trim();
                    if (!query) return;

                    const matched = this.citiesData
                        .filter(city =>
                            (city.location && city.location.toLowerCase().includes(query)) ||
                            (city.name_organ && city.name_organ.toLowerCase().includes(query)) ||
                            (city.pseudonim && city.pseudonim.toLowerCase().includes(query))
                        )
                        .slice(0, 20);

                    // Вызов асинхронной функции с задержкой
                    this.renderCardsWithDelay(matched, 100);
                }
                break;

            case 'Escape':
                this.suggestions.style.display = 'none';
                this.clearSelection();
                this.clearCityCards();
                break;

            case 'Backspace':
                if (this.input.value.trim() === '') {
                    this.suggestions.style.display = 'none';
                    this.clearSelection();
                    this.clearCityCards();

                }
                break;
        }
    }

    handleDocumentClick(e) {
        if (!this.input.contains(e.target) && !this.suggestions.contains(e.target)) {
            this.suggestions.style.display = 'none';
            this.clearSelection();
        }
    }
}

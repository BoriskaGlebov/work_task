/**
 * Автокомплит для поиска и отображения городов с возможностью ленивой загрузки карточек.
 */
export class CityAutocomplete {
    /**
     * @param {string} inputId - ID текстового поля ввода.
     * @param {string} suggestionsId - ID контейнера подсказок.
     * @param {Array<Object>} citiesData - Список данных по городам.
     */
    constructor(inputId, suggestionsId, citiesData = []) {
        this.input = document.getElementById(inputId);
        this.suggestions = document.getElementById(suggestionsId);
        this.counter = document.getElementById('counter');
        this.citiesData = citiesData;

        this.selectedIndex = -1;
        this.renderedCities = [];
        this.remainingCities = [];
        this.renderingCancelled = false;
        this.observer = null;

        if (!this.input || !this.suggestions) {
            console.warn("CityAutocomplete: Элементы не найдены на странице.");
            return;
        }

        this.bindEvents();
    }

    /** Привязка обработчиков событий */
    bindEvents() {
        this.input.addEventListener('input', () => this.handleInput());
        this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('click', (e) => this.handleDocumentClick(e));
    }

    /** Убирает выделение всех подсказок */
    clearSelection() {
        this.suggestions.querySelectorAll('li').forEach(item => item.classList.remove('bg-gray-300'));
        this.selectedIndex = -1;
    }

    /**
     * Лениво подгружает карточки
     * @param {number} batchSize - Количество карточек за раз
     * @param {number} delay - Задержка между карточками (мс)
     */
    async loadMoreCities(batchSize = 10, delay = 100) {
        const nextBatch = this.remainingCities.splice(0, batchSize);
        for (const city of nextBatch) {
            if (this.renderingCancelled) return;
            this.createCityCard(city);
            await new Promise(res => setTimeout(res, delay));
        }

        if (this.remainingCities.length === 0) {
            this.observer?.disconnect();
        }
    }

    /** Подключает IntersectionObserver для подгрузки карточек при скролле */
    observeScroll() {
        const container = document.getElementById('city-cards');
        if (!container || document.getElementById('scroll-sentinel')) return;

        const sentinel = document.createElement('div');
        sentinel.id = 'scroll-sentinel';
        container.appendChild(sentinel);

        this.observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && this.remainingCities.length) {
                this.loadMoreCities();
            }
        }, {root: null, threshold: 0.1});

        this.observer.observe(sentinel);
    }

    /**
     * Подсвечивает подсказку по индексу
     * @param {number} index
     */
    highlightItem(index) {
        const items = this.suggestions.querySelectorAll('li');
        if (!items.length) return;

        this.clearSelection();
        const normalizedIndex = (index + items.length) % items.length;

        items[normalizedIndex].classList.add('bg-gray-300');
        items[normalizedIndex].scrollIntoView({block: 'nearest'});
        this.selectedIndex = normalizedIndex;
    }

    /**
     * Создает и добавляет карточку города
     * @param {Object} city
     */
    createCityCard(city) {
        const container = document.getElementById('city-cards');
        if (!container) return;

        const card = document.createElement('div');
        card.classList.add('card-style');
        card.style.cursor = 'pointer'; // ✅ указатель "рука" для визуального отклика
        // ✅ Добавляем сериализованные данные города в data-атрибут
        card.dataset.city = JSON.stringify(city);

        const props = [
            ['Организация', city.name_organ],
            ['Псевдоним', city.pseudonim],
            ['Время работы', city.work_time],
            ['Номер раздела', city.table_id],
            ['Номер в таблице', city.some_number],
            ['IP address', city.ip_address]
        ];

        card.innerHTML = `<h3 class="text-lg font-semibold mb-2 text-center">${city.location || 'Неизвестно'}</h3>` +
            props.filter(([_, val]) => val).map(([label, val]) => `<p><strong>${label}:</strong> ${val}</p>`).join('');

        const sentinel = document.getElementById('scroll-sentinel');
        container.insertBefore(card, sentinel || null);
    }

    /** Очищает карточки */
    clearCityCards() {
        document.getElementById('city-cards')?.replaceChildren();
    }

    /**
     * Плавно отрисовывает карточки
     * @param {Array<Object>} cities
     * @param {number} delay
     */
    async renderCardsWithDelay(cities, delay = 100) {
        this.cancelRendering();
        this.clearCityCards();

        this.renderingCancelled = false;
        this.renderedCities = cities.slice(0, 10);
        this.remainingCities = cities.slice(10);

        for (const city of this.renderedCities) {
            if (this.renderingCancelled) return;
            this.createCityCard(city);
            await new Promise(res => setTimeout(res, delay));
        }

        this.observeScroll();
    }

    /** Отменяет текущую отрисовку и отслеживание */
    cancelRendering() {
        this.renderingCancelled = true;
        this.observer?.disconnect();
        document.getElementById('scroll-sentinel')?.remove();
    }

    /** Обработка ввода в поле */
    handleInput() {
        const query = this.input.value.trim().toLowerCase();
        this.cancelRendering();
        this.clearSelection();
        this.clearCityCards();
        this.suggestions.innerHTML = '';

        if (!query) {
            this.suggestions.style.display = 'none';
            this.counter?.classList.add('opacity-0');
            return;
        }

        const matches = this.citiesData.filter(city =>
            (city.location && city.location.toLowerCase().includes(query)) ||
            (city.name_organ && city.name_organ.toLowerCase().includes(query)) ||
            (city.pseudonim && city.pseudonim.toLowerCase().includes(query))
        );

        this.counter?.classList.remove('opacity-0');
        if (this.counter) this.counter.textContent = `Найдено совпадений: ${matches.length}`;

        if (!matches.length) {
            this.suggestions.style.display = 'none';
            return;
        }

        matches.slice(0, 20).forEach(city => {
            const li = document.createElement('li');
            li.classList.add('cursor-pointer', 'px-3', 'py-1', 'hover:bg-gray-200');
            li.textContent = `${city.location || ''}${city.name_organ ? ` — ${city.name_organ}` : ''}${city.pseudonim ? ` — (${city.pseudonim})` : ''}`;
            li.addEventListener('click', () => {
                this.input.value = `${city.location} - ${city.name_organ || ''} - ${city.pseudonim || ''}`;
                this.suggestions.style.display = 'none';
                this.clearCityCards();
                this.cancelRendering();
                this.createCityCard(city);
            });
            this.suggestions.appendChild(li);
        });

        this.suggestions.style.display = 'block';
    }

    /**
     * Обработка клавиатурных событий
     * @param {KeyboardEvent} e
     */
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
                if (this.selectedIndex >= 0) {
                    items[this.selectedIndex].click();
                } else {
                    const query = this.input.value.trim().toLowerCase();
                    if (!query) return;

                    const matches = this.citiesData.filter(city =>
                        (city.location && city.location.toLowerCase().includes(query)) ||
                        (city.name_organ && city.name_organ.toLowerCase().includes(query)) ||
                        (city.pseudonim && city.pseudonim.toLowerCase().includes(query))
                    );
                    this.renderCardsWithDelay(matches);
                    this.suggestions.style.display = 'none';
                }
                break;

            case 'Escape':
                this.cancelRendering();
                this.suggestions.style.display = 'none';
                this.clearSelection();
                this.clearCityCards();
                break;
        }
    }

    /**
     * Скрывает подсказки при клике вне поля
     * @param {MouseEvent} e
     */
    handleDocumentClick(e) {
        if (!this.input.contains(e.target) && !this.suggestions.contains(e.target)) {
            this.suggestions.style.display = 'none';
            this.clearSelection();
        }
    }
}

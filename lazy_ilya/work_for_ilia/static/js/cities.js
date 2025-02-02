class CitySearch {
    constructor() {
        this.cities = window.citiesData; // Используем данные из глобальной переменной
        this.searchInput = document.getElementById('citySearch');
        this.suggestionsList = document.getElementById('suggestionsList');
        this.citiesGrid = document.getElementById('citiesGrid');
        this.selectedIndex = -1; // Индекс выделенного элемента

        this.init();
    }

    init() {
        this.searchInput.addEventListener('input', () => this.handleSearch());
        this.searchInput.addEventListener('focus', () => this.showSuggestions());
        document.addEventListener('click', (e) => this.handleClickOutside(e));

        // Обработчик клавиш
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Предотвращает отправку формы
                this.handleEnter();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault(); // Предотвращает прокрутку страницы
                this.moveSelection(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault(); // Предотвращает прокрутку страницы
                this.moveSelection(-1);
            }
        });
    }

    handleSearch() {
        const searchTerm = this.searchInput.value.toLowerCase();
        if (searchTerm.length < 1) {
            this.suggestionsList.innerHTML = '';
            this.citiesGrid.innerHTML = '';
            return;
        }

        if (!this.cities || !Array.isArray(this.cities)) {
            console.error('Cities data is not defined or is not an array.');
            return;
        }

        const filteredCities = this.cities.filter(city =>
            city.location.toLowerCase().includes(searchTerm)
        );

        this.renderSuggestions(filteredCities);
    }


    renderSuggestions(cities) {
        // Обнуляем индекс выделенного элемента при новом поиске
        this.selectedIndex = -1;

        this.suggestionsList.innerHTML = cities.map((city, index) => `
            <div class="suggestion-item ${this.selectedIndex === index ? 'selected' : ''}" data-city="${city.location}">
                ${city.location}
            </div>
        `).join('');

        const suggestionItems = this.suggestionsList.querySelectorAll('.suggestion-item');

        // Добавляем обработчик клика для каждого элемента
        suggestionItems.forEach(item => {
            item.addEventListener('click', () => this.selectCity(item.dataset.city));
        });
    }

    selectCity(cityName) {
        const city = this.cities.find(c => c.location === cityName);
        if (city) {
            this.searchInput.value = cityName;
            this.suggestionsList.innerHTML = '';
            this.citiesGrid.innerHTML = ''; // Очищаем предыдущие карточки
            this.renderCityCard(city);
        }
    }

    renderCityCard(city) {
        this.citiesGrid.innerHTML += `
            <div class="city-card">
                <h3>${city.location}</h3>
                <div class="city-info">
                    <p><strong>Псевдоним:</strong> ${city.pseudonim}</p>
                    <p><strong>Адрес в глобусе:</strong> ${city.ip_address}</p>
                    <p><strong>НАзвание организации</strong> ${city.name_organ}</p>
                    <p><strong>Описание:</strong></p>
                    <p>${city.work_time}</p>
                </div>
            </div>
        `;
    }

    handleClickOutside(event) {
        if (!this.searchInput.contains(event.target) && !this.suggestionsList.contains(event.target)) {
            this.suggestionsList.innerHTML = '';
            this.selectedIndex = -1; // Сброс выделения
        }
    }

    showSuggestions() {
        if (this.searchInput.value.length > 0) {
            this.handleSearch();
        }
    }

    handleEnter() {
        const searchTerm = this.searchInput.value.toLowerCase();

        // Фильтруем города по текущему вводу
        const filteredCities = this.cities.filter(city =>
            city.location.toLowerCase().includes(searchTerm)
        );

        // Очищаем предыдущие карточки
        this.citiesGrid.innerHTML = '';

        // Отображаем карточки для всех подходящих городов
        filteredCities.forEach(city => {
            this.renderCityCard(city);
        });

        // Очищаем список предложений
        this.suggestionsList.innerHTML = '';
    }

    moveSelection(direction) {
        const suggestions = Array.from(this.suggestionsList.querySelectorAll('.suggestion-item'));

        if (suggestions.length === 0) return;

        // Убираем выделение с текущего элемента
        if (this.selectedIndex >= 0) {
            suggestions[this.selectedIndex].classList.remove('selected');
        }

        // Обновляем индекс выделенного элемента
        this.selectedIndex += direction;

        // Ограничиваем индекс в пределах массива
        if (this.selectedIndex < 0) {
            this.selectedIndex = suggestions.length - 1; // Перемещение к последнему элементу
        } else if (this.selectedIndex >= suggestions.length) {
            this.selectedIndex = 0; // Перемещение к первому элементу
        }

        // Добавляем выделение к новому элементу
        suggestions[this.selectedIndex].classList.add('selected');

        // Прокручиваем выделенный элемент в видимую область, если необходимо
        suggestions[this.selectedIndex].scrollIntoView({block: "nearest"});

        // Обновляем значение в поле ввода
        this.searchInput.value = suggestions[this.selectedIndex].dataset.city;
    }
}

// Инициализация класса CitySearch при загрузке страницы
const citySearch = new CitySearch();
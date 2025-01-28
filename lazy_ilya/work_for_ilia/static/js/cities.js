class CitySearch {
    constructor() {
        this.cities = [
            {
                name: 'Москва',
                population: '12506468',
                region: 'Московская область',
                description: 'Столица России, крупнейший город страны, политический, экономический и культурный центр. Расположен на реке Москве в центре Восточно-Европейской равнины.',
                founded: '1147'
            },
            {
                name: 'Москва Одинцево',
                population: '12506468',
                region: 'Московская область',
                description: 'Столица России, крупнейший город страны, политический, экономический и культурный центр. Расположен на реке Москве в центре Восточно-Европейской равнины.',
                founded: '1147'
            },
            {
                name: 'Санкт-Петербург',
                population: '5351935',
                region: 'Ленинградская область',
                description: 'Второй по численности населения город России. Город федерального значения. Важнейший экономический, научный и культурный центр страны.',
                founded: '1703'
            },
            {
                name: 'Новосибирск',
                population: '1620162',
                region: 'Новосибирская область',
                description: 'Третий по численности населения город России. Крупнейший торговый, деловой, культурный, транспортный, образовательный и научный центр Сибири.',
                founded: '1893'
            },
            {
                name: 'Екатеринбург',
                population: '1495066',
                region: 'Свердловская область',
                description: 'Крупный промышленный и культурный центр Урала. Известен своими музеями и театрами.',
                founded: '1723'
            },
            {
                name: 'Казань',
                population: '1257341',
                region: 'Татарстан',
                description: 'Столица Татарстана, известная своей богатой историей и культурным наследием.',
                founded: '1005'
            },
            {
                name: 'Нижний Новгород',
                population: '1244251',
                region: 'Нижегородская область',
                description: 'Крупный экономический и культурный центр России с уникальной архитектурой.',
                founded: '1221'
            },
            {
                name: 'Челябинск',
                population: '1187960',
                region: 'Челябинская область',
                description: 'Промышленный центр Южного Урала с развитой инфраструктурой.',
                founded: '1736'
            },
            {
                name: 'Самара',
                population: '1144759',
                region: 'Самарская область',
                description: 'Город на Волге, известный своими историческими памятниками и природными красотами.',
                founded: '1586'
            },
            {
                name: 'Омск',
                population: '1139897',
                region: 'Омская область',
                description: 'Крупный административный и культурный центр Сибири с разнообразными музеями.',
                founded: '1716'
            },
            {
                name: 'Ростов-на-Дону',
                population: '1137704',
                region: 'Ростовская область',
                description: 'Главный порт на Дону и важный транспортный узел юга России.',
                founded: '1749'
            },
            {
                name: 'Уфа',
                population: '1100000', // Приблизительное значение
                region: 'Башкортостан',
                description: 'Столица Башкортостана, известная своей многонациональной культурой и природными красотами.',
                founded: '1574'
            },
            {
                name: 'Владивосток',
                population: '605000',
                region: 'Приморский край',
                description: 'Главный порт Дальнего Востока России, известен своими красивыми пейзажами.',
                founded: '1860'
            },
            {
                name: 'Краснодар',
                population: '900000',
                region: 'Краснодарский край',
                description: 'Известен как "Южная столица" России с мягким климатом и развитым сельским хозяйством.',
                founded: '1793'
            }
        ];


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

        const filteredCities = this.cities.filter(city =>
            city.name.toLowerCase().includes(searchTerm)
        );

        this.renderSuggestions(filteredCities);
    }

    renderSuggestions(cities) {
        // Обнуляем индекс выделенного элемента при новом поиске
        this.selectedIndex = -1;

        this.suggestionsList.innerHTML = cities.map((city, index) => `
            <div class="suggestion-item ${this.selectedIndex === index ? 'selected' : ''}" data-city="${city.name}">
                ${city.name}
            </div>
        `).join('');

        const suggestionItems = this.suggestionsList.querySelectorAll('.suggestion-item');

        // Добавляем обработчик клика для каждого элемента
        suggestionItems.forEach(item => {
            item.addEventListener('click', () => this.selectCity(item.dataset.city));
        });
    }

    selectCity(cityName) {
        const city = this.cities.find(c => c.name === cityName);
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
                <h3>${city.name}</h3>
                <div class="city-info">
                    <p><strong>Население:</strong> ${parseInt(city.population).toLocaleString()} человек</p>
                    <p><strong>Регион:</strong> ${city.region}</p>
                    <p><strong>Год основания:</strong> ${city.founded}</p>
                    <p><strong>Описание:</strong></p>
                    <p>${city.description}</p>
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
            city.name.toLowerCase().includes(searchTerm)
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
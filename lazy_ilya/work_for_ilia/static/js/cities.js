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
      }
      // Add more cities as needed
    ];
    
    this.searchInput = document.getElementById('citySearch');
    this.suggestionsList = document.getElementById('suggestionsList');
    this.citiesGrid = document.getElementById('citiesGrid');
    
    this.init();
  }

  /**
   * Инициализация обработчиков событий.
   * Устанавливает обработчики для ввода в поле поиска и кликов вне списка предложений.
   */
  init() {
    this.searchInput.addEventListener('input', () => this.handleSearch());
    this.searchInput.addEventListener('focus', () => this.showSuggestions());
    document.addEventListener('click', (e) => this.handleClickOutside(e));
  }

  /**
   * Обрабатывает ввод в поле поиска.
   * Фильтрует список городов на основе введенного текста и отображает предложения.
   */
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

  /**
   * Отображает список предложений на основе отфильтрованных городов.
   * @param {Array} cities - Массив отфильтрованных городов.
   */
  renderSuggestions(cities) {
    this.suggestionsList.innerHTML = cities.map(city => `
      <div class="suggestion-item" data-city="${city.name}">
        ${city.name}
      </div>
    `).join('');

    const suggestionItems = this.suggestionsList.querySelectorAll('.suggestion-item');
    suggestionItems.forEach(item => {
      item.addEventListener('click', () => this.selectCity(item.dataset.city));
    });
  }

  /**
   * Обрабатывает выбор города из списка предложений.
   * Заполняет поле поиска выбранным городом и отображает информацию о городе.
   * @param {string} cityName - Название выбранного города.
   */
  selectCity(cityName) {
    const city = this.cities.find(c => c.name === cityName);
    this.searchInput.value = cityName;
    this.suggestionsList.innerHTML = '';
    this.renderCityCard(city);
  }

  /**
   * Отображает карточку с информацией о городе.
   * @param {Object} city - Объект города с его данными.
   */
  renderCityCard(city) {
    this.citiesGrid.innerHTML = `
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

  /**
   * Обрабатывает клик вне поля поиска и списка предложений.
   * Скрывает список предложений при клике вне этих элементов.
   * @param {Event} event - Событие клика.
   */
  handleClickOutside(event) {
    if (!this.searchInput.contains(event.target) && !this.suggestionsList.contains(event.target)) {
      this.suggestionsList.innerHTML = '';
    }
  }

  /**
   * Показывает предложения при фокусе на поле поиска.
   */
  showSuggestions() {
    if (this.searchInput.value.length > 0) {
      this.handleSearch();
    }
  }
}

// Инициализация класса CitySearch при загрузке страницы
const citySearch = new CitySearch();

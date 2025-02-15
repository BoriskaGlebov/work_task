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
    ];
    
    this.isAdmin = localStorage.getItem('isLoggedIn') === 'true';
    
    this.initElements();
    this.init();
  }

  initElements() {
    this.searchInput = document.getElementById('citySearch');
    this.suggestionsList = document.getElementById('suggestionsList');
    this.citiesGrid = document.getElementById('citiesGrid');
    this.fileInput = document.getElementById('cityFileInput');
    this.uploadBtn = document.getElementById('uploadCityFileBtn');
    this.uploadProgress = document.getElementById('cityUploadProgress');
    this.uploadProgressBar = document.getElementById('cityUploadProgressBar');
    this.uploadProgressText = document.getElementById('cityUploadProgressText');
    this.createCityBtn = document.getElementById('createCityBtn');
  }

  init() {
    this.searchInput.addEventListener('input', () => this.handleSearch());
    this.searchInput.addEventListener('focus', () => this.showSuggestions());
    document.addEventListener('click', (e) => this.handleClickOutside(e));
    this.uploadBtn.addEventListener('click', () => this.handleFileUpload());
    
    if (this.isAdmin) {
      this.createCityBtn.style.display = 'inline-block';
      this.createCityBtn.addEventListener('click', () => this.handleCreateCity());
    }
  }

  async trackUserAction(action, cityName) {
    try {
      const data = {
        action, 
        cityName,
        timestamp: new Date().toISOString(),
        userId: 'anonymous' 
      };

      await this.sendToServer('/api/analytics/track', data);
      
      console.log(`Tracked ${action} for city: ${cityName}`);
    } catch (error) {
      console.error('Failed to track user action:', error);
    }
  }

  async sendToServer(endpoint, data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Sent to server:', endpoint, data);
        resolve({ success: true });
      }, 100);
    });
  }

  async handleSearch() {
    const searchTerm = this.searchInput.value.toLowerCase();
    if (searchTerm.length < 1) {
      this.suggestionsList.innerHTML = '';
      this.citiesGrid.innerHTML = '';
      return;
    }

    await this.trackUserAction('search', searchTerm);

    const filteredCities = this.cities.filter(city => 
      city.name.toLowerCase().includes(searchTerm)
    );

    this.renderSuggestions(filteredCities);
  }

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

  async selectCity(cityName) {
    const city = this.cities.find(c => c.name === cityName);
    this.searchInput.value = cityName;
    this.suggestionsList.innerHTML = '';
    
    await this.trackUserAction('view', cityName);
    
    this.renderCityCard(city);
  }

  renderCityCard(city) {
    this.citiesGrid.innerHTML = `
      <div class="city-card" data-city='${JSON.stringify(city)}'>
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

    if (this.isAdmin) {
      const cityCard = this.citiesGrid.querySelector('.city-card');
      cityCard.style.cursor = 'pointer';
      cityCard.addEventListener('click', () => {
        const cityData = JSON.parse(cityCard.dataset.city);
        window.location.href = `city-edit.html?city=${encodeURIComponent(JSON.stringify(cityData))}`;
      });
    }
  }

  handleClickOutside(event) {
    if (!this.searchInput.contains(event.target) && !this.suggestionsList.contains(event.target)) {
      this.suggestionsList.innerHTML = '';
    }
  }

  showSuggestions() {
    if (this.searchInput.value.length > 0) {
      this.handleSearch();
    }
  }

  async handleFileUpload() {
    const file = this.fileInput.files[0];
    if (!file) {
      alert('Пожалуйста, выберите файл для загрузки');
      return;
    }

    try {
      this.uploadProgress.style.display = 'block';
      this.uploadProgressBar.style.width = '0%';
      this.uploadProgressText.textContent = 'Начало загрузки...';

      await this.trackUserAction('file_upload', file.name);

      await this.simulateFileProcessing();

      const newCities = [
        {
          name: 'Казань',
          population: '1257391',
          region: 'Республика Татарстан',
          description: 'Город в России, столица Республики Татарстан. Крупный порт на левом берегу реки Волги.',
          founded: '1005'
        },
        {
          name: 'Екатеринбург',
          population: '1495066',
          region: 'Свердловская область',
          description: 'Город в России, административный центр Уральского федерального округа и Свердловской области.',
          founded: '1723'
        }
      ];

      this.cities = [...this.cities, ...newCities];
      
      this.uploadProgressBar.style.width = '100%';
      this.uploadProgressText.textContent = 'Загрузка завершена!';
      
      setTimeout(() => {
        this.uploadProgress.style.display = 'none';
        this.uploadProgressBar.style.width = '0%';
        this.fileInput.value = '';
        alert('Список городов успешно загружен и обработан');
      }, 1000);

    } catch(error) {
      this.uploadProgress.style.display = 'none';
      alert('Произошла ошибка при загрузке файла');
      console.error(error);
    }
  }

  simulateFileProcessing() {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        this.uploadProgressBar.style.width = `${progress}%`;
        this.uploadProgressText.textContent = `Обработка файла... ${progress}%`;
        
        if(progress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, 500);
    });
  }

  handleCreateCity() {
    const emptyCity = {
      name: '',
      population: '',
      region: '',
      description: '',
      founded: ''
    };
    window.location.href = `city-edit.html?city=${encodeURIComponent(JSON.stringify(emptyCity))}`;
  }
}

const citySearch = new CitySearch();
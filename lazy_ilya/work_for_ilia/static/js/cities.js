class CitySearch {
    constructor() {
        this.cities = window.citiesData || []; // Используем данные из глобальной переменной или пустой массив
        this.searchInput = document.getElementById('citySearch');
        this.suggestionsList = document.getElementById('suggestionsList');
        this.citiesGrid = document.getElementById('citiesGrid');
        this.selectedIndex = -1;

        this.fileInput = document.getElementById('cityFileInput');
        this.uploadBtn = document.getElementById('uploadCityFileBtn');
        this.uploadProgress = document.getElementById('cityUploadProgress');
        this.uploadProgressBar = document.getElementById('cityUploadProgressBar');
        this.uploadProgressText = document.getElementById('cityUploadProgressText');

        this.init();
    }

    init() {
        this.searchInput.addEventListener('input', () => this.handleSearch());
        this.searchInput.addEventListener('focus', () => this.showSuggestions());
        document.addEventListener('click', (e) => this.handleClickOutside(e));

        this.uploadBtn.addEventListener('click', () => this.handleFileUpload());
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

    async handleFileUpload() {
        const file = this.fileInput.files[0];
        if (!file) {
            alert('Пожалуйста, выберите файл для загрузки');
            return;
        }

        // Проверка имени файла
        if (file.name !== 'globus.docx') {
            alert('Ошибка: файл должен называться "globus.docx"');
            return;
        }

        const formData = new FormData();
        formData.append('cityFile', file);

        try {
            // Отображаем прогресс-бар
            this.uploadProgress.style.display = 'block';
            this.uploadProgressBar.style.width = '0%';
            this.uploadProgressText.textContent = 'Начало загрузки...';

            // Функция для обновления прогресса
            const updateProgress = (percentage) => {
                this.uploadProgressBar.style.width = `${percentage}%`;
                this.uploadProgressText.textContent = `Загрузка ${percentage}%...`;
            };

            // Устанавливаем прогресс на 75% перед отправкой файла
            updateProgress(75);

            // Отправляем файл на сервер
            const response = await fetch(uploadUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrfToken // Добавляем CSRF-токен в заголовки
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке файла');
            }

            // Устанавливаем прогресс на 97% после отправки файла
            updateProgress(97);

            // Получаем данные от сервера
            const newCities = await response.json();
            this.cities = newCities; // Обновляем список городов

            // Устанавливаем прогресс на 100% после получения ответа
            updateProgress(100);

            setTimeout(() => {
                this.uploadProgress.style.display = 'none';
                this.uploadProgressBar.style.width = '0%';
                this.fileInput.value = '';
                alert('Список городов успешно загружен и обработан');
            }, 1000);

        } catch (error) {
            this.uploadProgress.style.display = 'none';
            alert('Произошла ошибка при загрузке файла');
            console.error(error);
        }
    }


    handleSearch() {
        const searchTerm = this.searchInput.value.toLowerCase();
        if (searchTerm.length < 1) {
            this.suggestionsList.innerHTML = '';
            return;
        }

        if (!this.cities || !Array.isArray(this.cities)) {
            console.error('Cities data is not defined or is not an array.');
            return;
        }

        // Фильтруем города по location и name_organ
        const filteredCities = this.cities.filter(city =>
            city.location.toLowerCase().includes(searchTerm) ||
            city.name_organ.toLowerCase().includes(searchTerm) // Условие для name_organ
        );

        this.renderSuggestions(filteredCities);
    }


    renderSuggestions(cities) {
    // Обнуляем индекс выделенного элемента при новом поиске
    this.selectedIndex = -1;

    if (cities.length === 0) {
        this.suggestionsList.innerHTML = '<div class="no-suggestions">Нет подходящих городов</div>';
        return;
    }

    this.suggestionsList.innerHTML = cities.map((city, index) => `
        <div class="suggestion-item ${this.selectedIndex === index ? 'selected' : ''}" data-city="${city.location}">
            ${city.location} (${city.name_organ}) <!-- Показываем оба поля -->
        </div>
    `).join('');

    const suggestionItems = this.suggestionsList.querySelectorAll('.suggestion-item');

    suggestionItems.forEach(item => {
        item.addEventListener('click', () => this.selectCity(item.dataset.city));
    });
}


    selectCity(cityName) {
    const city = this.cities.find(c => c.location === cityName || c.name_organ === cityName);
    if (city) {
        this.searchInput.value = cityName; // Устанавливаем название города в поле ввода
        this.suggestionsList.innerHTML = ''; // Очищаем список предложений
        this.renderCityCard(city); // Отображаем карточку выбранного города
    }
}


    renderCityCard(city) {
    // Проверяем, существует ли элемент перед добавлением карточек
    const existingCard = document.querySelector(`.city-card[data-city="${city.location}"]`);
    if (!existingCard) {
        const cityCardHTML = `
            <div class="city-card" data-city="${city.location}">
                <h3>${city.location}</h3>
                <div class="city-info">
                    <p><strong>Псевдоним:</strong> ${city.pseudonim}</p>
                    <p><strong>Адрес в глобусе:</strong> ${city.ip_address}</p>
                    <p><strong>Название организации:</strong> ${city.name_organ}</p>
                    <p><strong>Описание:</strong></p>
                    <p>${city.work_time}</p>
                </div>
            </div>
        `;

        // Добавляем новую карточку города на страницу
        this.citiesGrid.innerHTML += cityCardHTML;

        // Получаем ссылку на только что добавленную карточку
        const newCard = this.citiesGrid.lastElementChild;

        // Используем requestAnimationFrame для плавного появления
        requestAnimationFrame(() => {
            newCard.classList.add('show');
        });
    }
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

    // Фильтруем города по location и name_organ
    const filteredCities = this.cities.filter(city =>
        city.location.toLowerCase().includes(searchTerm) ||
        city.name_organ.toLowerCase().includes(searchTerm) // Условие для name_organ
    );

    // Очищаем предыдущие карточки
    this.citiesGrid.innerHTML = '';

    // Отображаем карточки для всех подходящих городов с задержкой
    filteredCities.forEach((city, index) => {
        setTimeout(() => {
            this.renderCityCard(city);
        }, index * 100); // Задержка в 100 мс между карточками
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

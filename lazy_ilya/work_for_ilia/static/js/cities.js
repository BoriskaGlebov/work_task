class CitySearch {
    constructor() {
        // Используем данные из глобальной переменной `window.citiesData` или пустой массив, если она не определена.
        // Это позволяет предварительно загружать данные о городах, например, из JSON-файла.
        this.cities = window.citiesData || [];

        // Получаем ссылки на элементы DOM, с которыми будем взаимодействовать.
        this.searchInput = document.getElementById('citySearch'); // Поле ввода для поиска города.
        this.suggestionsList = document.getElementById('suggestionsList'); // Список предложений, отображаемый под полем ввода.
        this.citiesGrid = document.getElementById('citiesGrid'); // Контейнер для отображения карточек городов.

        // Индекс выбранного элемента в списке предложений. Используется для навигации с помощью стрелок.
        this.selectedIndex = -1;

        // Элементы, связанные с загрузкой файла.
        this.fileInput = document.getElementById('cityFileInput'); // Поле выбора файла.
        this.uploadBtn = document.getElementById('uploadCityFileBtn'); // Кнопка загрузки файла.
        this.uploadProgress = document.getElementById('cityUploadProgress'); // Контейнер для отображения прогресса загрузки.
        this.uploadProgressBar = document.getElementById('cityUploadProgressBar'); // Индикатор прогресса загрузки.
        this.uploadProgressText = document.getElementById('cityUploadProgressText'); // Текст, отображающий прогресс загрузки.

        this.init(); // Вызываем метод инициализации, чтобы установить обработчики событий.
    }

    /**
     * Инициализация обработчиков событий для элементов DOM.
     */
    init() {
        // Обработчик события `input` для поля ввода.
        // Вызывается при каждом изменении значения поля ввода.
        this.searchInput.addEventListener('input', () => this.handleSearch());

        // Обработчик события `focus` для поля ввода.
        // Вызывается при получении фокуса полем ввода.
        this.searchInput.addEventListener('focus', () => this.showSuggestions());

        // Обработчик события `click` для всего документа.
        // Используется для скрытия списка предложений при клике за пределами поля ввода и списка.
        document.addEventListener('click', (e) => this.handleClickOutside(e));

        // Если кнопка загрузки файла существует, устанавливаем обработчик события `click`.
        if (this.uploadBtn) {
            this.uploadBtn.addEventListener('click', () => this.handleFileUpload());
        }

        // Обработчик события `keydown` для поля ввода.
        // Используется для обработки нажатий клавиш Enter, ArrowDown и ArrowUp.
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Предотвращает отправку формы.
                this.handleEnter(); // Вызываем метод обработки нажатия клавиши Enter.
            } else if (e.key === 'ArrowDown') {
                e.preventDefault(); // Предотвращает прокрутку страницы.
                this.moveSelection(1); // Вызываем метод перемещения выделения вниз.
            } else if (e.key === 'ArrowUp') {
                e.preventDefault(); // Предотвращает прокрутку страницы.
                this.moveSelection(-1); // Вызываем метод перемещения выделения вверх.
            }
        });
    }

    /**
     * Обрабатывает загрузку файла с данными о городах.
     * Отправляет файл на сервер и отображает прогресс загрузки.
     */
    async handleFileUpload() {
        const file = this.fileInput.files[0]; // Получаем первый файл из поля выбора файла.

        // Проверяем, был ли выбран файл.
        if (!file) {
            alert('Пожалуйста, выберите файл для загрузки');
            return; // Прерываем выполнение функции, если файл не выбран.
        }

        // Проверяем имя файла.
        if (file.name !== 'globus.docx') {
            alert('Ошибка: файл должен называться "globus.docx"');
            return; // Прерываем выполнение функции, если имя файла не соответствует ожидаемому.
        }

        const formData = new FormData(); // Создаем объект FormData для отправки файла на сервер.
        formData.append('cityFile', file); // Добавляем файл в объект FormData под ключом 'cityFile'.

        try {
            // Отображаем индикатор прогресса загрузки.
            this.uploadProgress.style.display = 'block';
            this.uploadProgressBar.style.width = '0%'; // Устанавливаем начальную ширину прогресс-бара.
            this.uploadProgressText.textContent = 'Начало загрузки...'; // Устанавливаем текст сообщения о начале загрузки.

            const socket = new WebSocket('ws://localhost:8000/ws/progress/'); // Создаем WebSocket соединение с сервером.
            let timeoutId; // Объявляем переменную для хранения ID таймаута.

            /**
             * Функция для установки таймаута ожидания ответа от сервера.
             * Если в течение заданного времени от сервера не приходит сообщение,
             * соединение закрывается и пользователю выводится сообщение об ошибке.
             */
            const setupTimeout = () => {
                timeoutId = setTimeout(() => {
                    console.error('WebSocket: No response from server. Closing connection.');
                    socket.close(); // Закрываем WebSocket соединение.
                    this.uploadProgress.style.display = 'none'; // Скрываем индикатор прогресса.
                    alert('Превышено время ожидания ответа от сервера.'); // Выводим сообщение об ошибке.
                }, 10000); // Устанавливаем таймаут в 10 секунд (10000 миллисекунд).
            };

            /**
             * Функция для сброса таймаута.
             * Используется для предотвращения срабатывания таймаута, когда сообщение от сервера получено вовремя.
             */
            const resetTimeout = () => {
                clearTimeout(timeoutId); // Очищаем предыдущий таймаут.
                setupTimeout(); // Устанавливаем новый таймаут.
            };

            /**
             * Обработчик события открытия WebSocket соединения.
             * Вызывается, когда соединение с сервером успешно установлено.
             */
            socket.onopen = () => {
                setupTimeout(); // Устанавливаем таймаут после открытия соединения.
            };

            /**
             * Обработчик события получения сообщения через WebSocket.
             * Вызывается при получении данных от сервера.
             */
            socket.onmessage = (event) => {
                resetTimeout(); // Сбрасываем таймаут при получении сообщения.

                const data = JSON.parse(event.data); // Преобразуем полученные данные из JSON-строки в объект.
                const progress = data.progress; // Извлекаем значение прогресса из данных.

                this.uploadProgressBar.style.width = `${progress}%`; // Обновляем ширину прогресс-бара.
                this.uploadProgressText.textContent = `Обработка: ${progress}%...`; // Обновляем текст сообщения о прогрессе.

                if (data.cities) {
                    // Если в данных есть список городов (обработка завершена).
                    clearTimeout(timeoutId); // Очищаем таймаут, так как процесс завершен.
                    this.cities = data.cities; // Сохраняем список городов в свойстве компонента.
                    socket.close(); // Закрываем WebSocket соединение.
                    setTimeout(() => {
                        // Задержка перед скрытием индикатора прогресса и выводом сообщения об успехе.
                        this.uploadProgress.style.display = 'none'; // Скрываем индикатор прогресса.
                        this.uploadProgressBar.style.width = '0%'; // Сбрасываем ширину прогресс-бара.
                        this.fileInput.value = ''; // Очищаем поле выбора файла.
                        alert('Список городов успешно загружен и обработан'); // Выводим сообщение об успехе.
                    }, 1000); // Задержка в 1 секунду.
                }
            };

            /**
             * Обработчик события закрытия WebSocket соединения.
             * Вызывается, когда соединение с сервером закрыто.
             */
            socket.onclose = () => {
                clearTimeout(timeoutId); // Очищаем таймаут при закрытии соединения.
            };

            /**
             * Обработчик события ошибки WebSocket соединения.
             * Вызывается, когда происходит ошибка при обмене данными с сервером.
             */
            socket.onerror = (error) => {
                clearTimeout(timeoutId); // Очищаем таймаут в случае ошибки.
                console.error('WebSocket error:', error); // Выводим сообщение об ошибке в консоль.
                alert('Произошла ошибка при получении обновлений о прогрессе.'); // Выводим сообщение об ошибке пользователю.
                this.uploadProgress.style.display = 'none'; // Скрываем индикатор прогресса.
            };

            // Отправляем файл на сервер с использованием HTTP POST запроса.
            const response = await fetch(uploadUrl, {
                method: 'POST', // Указываем метод запроса POST.
                body: formData, // Передаем данные файла в теле запроса.
                headers: {
                    'X-CSRFToken': csrfToken // Добавляем CSRF-токен в заголовки для защиты от CSRF атак.
                }
            });

            // Проверяем статус ответа от сервера.
            if (!response.ok) {
                throw new Error('Ошибка при загрузке файла'); // Выбрасываем исключение в случае ошибки.
            }

        } catch (error) {
            // Обрабатываем ошибки, возникшие в процессе загрузки файла.
            this.uploadProgress.style.display = 'none'; // Скрываем индикатор прогресса.
            alert('Произошла ошибка при загрузке файла'); // Выводим сообщение об ошибке пользователю.
            console.error(error); // Выводим сообщение об ошибке в консоль.
        }
    }


    /**
     * Обрабатывает ввод текста в поле поиска.
     * Фильтрует список городов на основе введенного текста и отображает предложения.
     */
    handleSearch() {
        this.citiesGrid.innerHTML = '';
        const searchTerm = this.searchInput.value.toLowerCase().trim(); // Получаем текст из поля ввода, приводим к нижнему регистру и удаляем пробелы в начале и конце.

        // Если поле поиска пустое
        if (searchTerm.length < 1) {
            this.suggestionsList.innerHTML = ''; // Очищаем список предложений.
            this.citiesGrid.innerHTML = ''; // Очищаем карточки городов.
            return;
        }

        // Проверяем, что данные о городах загружены и являются массивом.
        if (!this.cities || !Array.isArray(this.cities)) {
            console.error('Cities data is not defined or is not an array.');
            return;
        }

        // Фильтруем города по location, name_organ или их комбинации.
        const filteredCities = this.cities.filter(city => {
            const combinedName = `${city.location.toLowerCase()} [${city.name_organ.toLowerCase()}]`; // Создаем строку, содержащую название города и организации.
            return (
                city.location.toLowerCase().includes(searchTerm) || // Проверяем, содержит ли название города введенный текст.
                city.name_organ.toLowerCase().includes(searchTerm) || // Проверяем, содержит ли название организации введенный текст.
                combinedName.includes(searchTerm) // Проверяем, содержит ли комбинация "ГОРОД (Организация)" введенный текст.
            );
        });

        this.renderSuggestions(filteredCities); // Отображаем отфильтрованные города в списке предложений.
    }

    /**
     * Отображает список предложений городов.
     * @param {Array} cities - Массив городов для отображения.
     */
    renderSuggestions(cities) {
        this.selectedIndex = -1; // Сбрасываем индекс выделенного элемента.

        // Если нет подходящих городов, отображаем сообщение.
        if (cities.length === 0) {
            this.suggestionsList.innerHTML = '<div class="no-suggestions">Нет подходящих городов</div>';
            return;
        }

        // Создаем HTML для каждого города в списке предложений.
        this.suggestionsList.innerHTML = cities.map((city, index) => `
            <div class="suggestion-item ${this.selectedIndex === index ? 'selected' : ''}" data-city="${city.location} [${city.name_organ}]">
                ${city.location} [${city.name_organ}]
            </div>
        `).join('');

        const suggestionItems = this.suggestionsList.querySelectorAll('.suggestion-item'); // Получаем все элементы списка предложений.

        // Добавляем обработчик события `click` для каждого элемента списка предложений.
        suggestionItems.forEach(item => {
            item.addEventListener('click', () => this.selectCity(item.dataset.city));
        });
    }

    /**
     * Выбирает город из списка предложений.
     * @param {string} cityName - Название выбранного города.
     */
    selectCity(cityName) {
        const city = this.cities.find(c =>
            `${c.location} [${c.name_organ}]` === cityName // Сравниваем с форматом "ГОРОД (Организация)".
        );
        if (city) {
            this.searchInput.value = cityName; // Устанавливаем значение в поле ввода.
            this.suggestionsList.innerHTML = ''; // Очищаем список предложений.
            this.renderCityCard(city); // Отображаем карточку выбранного города.
        }
    }

    /**
     * Отображает карточку города.
     * @param {object} city - Объект города для отображения.
     */
    renderCityCard(city) {
        // Экранируем значения для корректного использования в селекторе.
        const escapedCityLocation = CSS.escape(city.location);
        const escapedCityNameOrgan = CSS.escape(city.name_organ);

        // Проверяем, существует ли уже карточка для данного города.
        const existingCard = document.querySelector(`.city-card[data-city="${escapedCityLocation} [${escapedCityNameOrgan}]"]`);

        // Если карточка не существует, создаем ее.
        if (!existingCard) {
            const cityCardHTML = `
                <div class="city-card" data-city="${city.location} [${city.name_organ}]">
                    <h3>${city.location}</h3>
                    <div class="city-info">
                        <p><strong>Псевдоним:</strong> ${city.pseudonim}</p>
                        <p><strong>IP-адрес:</strong> ${city.ip_address}</p>
                        <p><strong>Организация:</strong> ${city.name_organ}</p>
                        <p><strong>Рабочее время:</strong> ${city.work_time}</p>
                    </div>
                </div>
            `;

            this.citiesGrid.innerHTML += cityCardHTML; // Добавляем карточку города в контейнер.

            const newCard = this.citiesGrid.lastElementChild; // Получаем ссылку на только что добавленную карточку.

            // Добавляем класс `show` к карточке, чтобы анимировать ее появление.
            requestAnimationFrame(() => {
                newCard.classList.add('show');
            });
        }
    }

    /**
     * Обрабатывает клик за пределами поля ввода и списка предложений.
     * Скрывает список предложений.
     * @param {object} event - Объект события `click`.
     */
    handleClickOutside(event) {
        // Если клик был не по полю ввода и не по списку предложений, скрываем список.
        if (!this.searchInput.contains(event.target) && !this.suggestionsList.contains(event.target)) {
            this.suggestionsList.innerHTML = ''; // Очищаем список предложений.
            this.selectedIndex = -1; // Сброс выделения.
        }
    }

    /**
     * Отображает список предложений, если поле ввода не пустое.
     */
    showSuggestions() {
        // Если в поле ввода есть текст, отображаем список предложений.
        if (this.searchInput.value.length > 0) {
            this.handleSearch();
        }
    }

    /**
     * Обрабатывает нажатие клавиши Enter в поле ввода.
     * Отображает карточки для всех подходящих городов.
     */
    handleEnter() {
        const searchTerm = this.searchInput.value.toLowerCase().trim(); // Получаем текст из поля ввода, приводим к нижнему регистру и удаляем пробелы.

        // Фильтруем города по location, name_organ или их комбинации.
        const filteredCities = this.cities.filter(city => {
            const combinedName = `${city.location.toLowerCase()} [${city.name_organ.toLowerCase()}]`;
            return (
                city.location.toLowerCase().includes(searchTerm) ||
                city.name_organ.toLowerCase().includes(searchTerm) ||
                combinedName.includes(searchTerm)
            );
        });

        // Очищаем предыдущие карточки.
        this.citiesGrid.innerHTML = '';

        // Создаём карточки для всех подходящих городов с задержкой.
        filteredCities.forEach((city, index) => {
            setTimeout(() => {
                this.renderCityCard(city);
            }, index * 100); // Задержка в 100 мс между созданием карточек.
        });

        // Очищаем список предложений.
        this.suggestionsList.innerHTML = '';
    }

    /**
     * Перемещает выделение в списке предложений.
     * @param {number} direction - Направление перемещения (1 - вниз, -1 - вверх).
     */
    moveSelection(direction) {
        const suggestions = Array.from(this.suggestionsList.querySelectorAll('.suggestion-item')); // Получаем массив элементов списка предложений.

        if (suggestions.length === 0) return; // Если список предложений пуст, выходим из функции.

        // Убираем выделение с текущего элемента.
        if (this.selectedIndex >= 0) {
            suggestions[this.selectedIndex].classList.remove('selected');
        }

        // Обновляем индекс выделенного элемента.
        this.selectedIndex += direction;

        // Ограничиваем индекс в пределах массива.
        if (this.selectedIndex < 0) {
            this.selectedIndex = suggestions.length - 1; // Перемещение к последнему элементу.
        } else if (this.selectedIndex >= suggestions.length) {
            this.selectedIndex = 0; // Перемещение к первому элементу.
        }

        // Добавляем выделение к новому элементу.
        suggestions[this.selectedIndex].classList.add('selected');

        // Прокручиваем выделенный элемент в видимую область, если необходимо.
        suggestions[this.selectedIndex].scrollIntoView({block: "nearest"});

        // Обновляем значение в поле ввода.
        this.searchInput.value = suggestions[this.selectedIndex].dataset.city;
    }
}

// Инициализация класса CitySearch при загрузке страницы.
const citySearch = new CitySearch();

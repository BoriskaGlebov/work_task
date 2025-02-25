/**
 * Класс для поиска городов и управления их отображением.
 */
class CitySearch {
    /**
     * @param {boolean} isAdmin - Флаг, определяющий, является ли пользователь администратором.
     */
    constructor(isAdmin, isIlia) {
        /** @type {boolean} */
        this.isAdmin = isAdmin;
        /** @type {boolean} */
        this.isIlia = isIlia;

        // Вывод в консоль для отладки значений isAdmin и isIlia
        console.log('isAdmin:', this.isAdmin);
        console.log('isIlia:', this.isIlia);

        /** @type {Array<object>} */
        this.cities = window.citiesData || []; // Данные о городах, полученные из глобальной переменной
        /** @type {string} */
        this.csrfToken = "{{ csrf_token }}"; // CSRF-токен для защиты от CSRF-атак (предполагается, что он доступен в шаблоне Django)

        /** @type {HTMLInputElement} */
        this.searchInput = document.getElementById('citySearch'); // Поле ввода для поиска города
        /** @type {HTMLDivElement} */
        this.suggestionsList = document.getElementById('suggestionsList'); // Список предложений городов
        /** @type {HTMLDivElement} */
        this.citiesGrid = document.getElementById('citiesGrid'); // Сетка для отображения карточек городов
        /** @type {number} */
        this.selectedIndex = -1; // Индекс выбранного элемента в списке предложений (-1 означает, что ничего не выбрано)
        /** @type {HTMLInputElement} */
        this.fileInput = document.getElementById('cityFileInput'); // Поле ввода для выбора файла с данными о городах
        /** @type {HTMLButtonElement} */
        this.uploadBtn = document.getElementById('uploadCityFileBtn'); // Кнопка для загрузки файла
        /** @type {HTMLAnchorElement} */
        this.downloadBtn = document.getElementById('downloadCityFileBtn'); // Кнопка скачивания
        /** @type {HTMLDivElement} */
        this.uploadProgress = document.getElementById('cityUploadProgress'); // Контейнер прогресс-бара загрузки
        /** @type {HTMLDivElement} */
        this.uploadProgressBar = document.getElementById('cityUploadProgressBar'); // Прогресс-бар загрузки
        /** @type {HTMLSpanElement} */
        this.uploadProgressText = document.getElementById('cityUploadProgressText'); // Текст прогресса загрузки
        /** @type {HTMLDivElement} */
        this.downloadProgress = document.getElementById('cityUploadProgress');  // Прогресс скачивания
        /** @type {HTMLDivElement} */
        this.downloadProgressBar = document.getElementById('cityUploadProgressBar'); //  Прогресс бар скачивания
        /** @type {HTMLSpanElement} */
        this.downloadProgressText = document.getElementById('cityUploadProgressText');  // Текст прогресса скачивания
        /** @type {HTMLDivElement} */
        this.modal = document.getElementById('editCityModal'); // Модальное окно

        this.init(); // Инициализация обработчиков событий
    }

    /**
     * Инициализация обработчиков событий для элементов DOM.
     */
    init() {
        this.searchInput.addEventListener('input', () => this.handleSearch()); // Обработчик ввода текста в поле поиска
        this.searchInput.addEventListener('focus', () => this.showSuggestions()); // Обработчик получения фокуса полем поиска
        document.addEventListener('click', (e) => this.handleClickOutside(e)); // Обработчик клика за пределами поля ввода и списка предложений
        if (this.uploadBtn) {
            this.uploadBtn.addEventListener('click', () => this.handleFileUpload()); // Обработчик клика по кнопке загрузки файла
        }
        if (this.downloadBtn) { //  Добавляем прослушиватель для кнопки скачивания
            this.downloadBtn.addEventListener('click', () => this.handleFileDownload());
        }
        this.searchInput.addEventListener('keydown', (e) => { // Обработчик нажатия клавиш в поле поиска
            if (e.key === 'Enter') { // Если нажата клавиша Enter
                e.preventDefault(); // Предотвращаем отправку формы
                this.handleEnter(); // Обрабатываем нажатие Enter
            } else if (e.key === 'ArrowDown') { // Если нажата клавиша ArrowDown
                e.preventDefault(); // Предотвращаем прокрутку страницы
                this.moveSelection(1); // Перемещаем выделение вниз
            } else if (e.key === 'ArrowUp') { // Если нажата клавиша ArrowUp
                e.preventDefault(); // Предотвращаем прокрутку страницы
                this.moveSelection(-1); // Перемещаем выделение вверх
            }
        });
        // Используем делегирование событий для открытия модального окна и других действий
        this.citiesGrid.addEventListener('click', (event) => {
            const target = event.target.closest('.city-card'); // Клик произошел на карточке
            if (target) {
                event.stopPropagation();
                const cityData = target.dataset.city;
                console.log(cityData);
                if (this.isAdmin || this.isIlia) {
                    const city = this.getCityFromCard(target);
                    if (city) {
                        this.openEditModal(city);
                    }
                }
            }
        });
    }

    /**
     * Обрабатывает загрузку файла с данными о городах.
     * Отправляет файл на сервер и отображает прогресс загрузки.
     */
    async handleFileUpload() {
        const file = this.fileInput.files[0]; // Получаем выбранный файл

        if (!file) {
            alert('Пожалуйста, выберите файл для загрузки');
            return;
        }

        if (file.name !== 'globus.docx') {
            alert('Ошибка: файл должен называться "globus.docx"');
            return;
        }

        const formData = new FormData(); // Создаем объект FormData для отправки файла
        formData.append('cityFile', file); // Добавляем файл в FormData

        this.uploadProgress.style.display = 'block'; // Показываем прогресс-бар
        this.uploadProgressBar.style.width = '0%'; // Устанавливаем начальную ширину прогресс-бара
        this.uploadProgressText.textContent = 'Начало загрузки...'; // Устанавливаем текст прогресса

        const socket = new WebSocket('ws://localhost:8000/ws/progress/'); // Создаем WebSocket соединение для получения информации о прогрессе
        let timeoutId; // Идентификатор таймера

        const setupTimeout = () => {
            timeoutId = setTimeout(() => {
                console.error('WebSocket: No response from server. Closing connection.');
                socket.close();
                this.uploadProgress.style.display = 'none';
                alert('Превышено время ожидания ответа от сервера.');
            }, 10000);
        };

        const resetTimeout = () => {
            clearTimeout(timeoutId);
            setupTimeout();
        };

        socket.onopen = () => {
            setupTimeout();
        };

        socket.onmessage = (event) => {
            resetTimeout();
            const data = JSON.parse(event.data); // Парсим JSON-ответ от сервера
            const progress = data.progress; // Получаем значение прогресса

            this.uploadProgressBar.style.width = `${progress}%`; // Обновляем ширину прогресс-бара
            this.uploadProgressText.textContent = `Обработка: ${progress}%...`; // Обновляем текст прогресса

            if (data.cities) { // Если сервер вернул список городов
                clearTimeout(timeoutId);
                this.cities = data.cities; // Обновляем список городов
                socket.close(); // Закрываем WebSocket соединение
                setTimeout(() => {
                    this.uploadProgress.style.display = 'none'; // Скрываем прогресс-бар
                    this.uploadProgressBar.style.width = '0%'; // Сбрасываем ширину прогресс-бара
                    this.fileInput.value = ''; // Очищаем поле выбора файла
                    alert('Список городов успешно загружен и обработан');
                }, 1000);
            }

            if (data.error) { //  Обрабатываем ошибку, полученную от сервера
                clearTimeout(timeoutId);
                console.error('Ошибка на сервере:', data.error, data.traceback);
                alert(`Произошла ошибка: ${data.error}`);
                socket.close(); // закрываем сокет при получении ошибки с сервера
                this.uploadProgress.style.display = 'none'; // скрываем прогресс бар при получении ошибки
            }
        };

        socket.onclose = () => {
            clearTimeout(timeoutId);
            console.log('WebSocket connection closed');
        };

        socket.onerror = (error) => {
            clearTimeout(timeoutId);
            console.error('WebSocket error:', error);
            this.uploadProgress.style.display = 'none'; // скрываем прогресс бар в случае ошибки
            alert('Произошла ошибка при получении обновлений о прогрессе.');
            socket.close();
        };

        try {
            const response = await fetch(uploadUrl, { // Отправляем файл на сервер
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrfToken // Добавляем CSRF-токен в заголовок запроса
                }
            });

            if (!response.ok) { // Если сервер вернул ошибку

                let errorMessage = 'Произошла ошибка при загрузке файла';
                try {
                    const errorData = await response.json();
                    errorMessage = `Произошла ошибка при загрузке файла: ${errorData.error}`;
                    console.error(errorData);
                } catch (jsonError) {
                    console.error('Ошибка при загрузке файла, но не удалось прочитать детали.', response);
                }
                alert(errorMessage);
                socket.close(); // Закрываем WebSocket-соединение, если статус ответа не OK
            }

        } catch (error) { // Если произошла ошибка при выполнении запроса
            this.uploadProgress.style.display = 'none';
            console.error('Ошибка при выполнении запроса', error);
            alert('Произошла ошибка при загрузке файла');
        }
    }

    /**
     * Функция для скачивания файла с использованием WebSocket для отслеживания прогресса.
     */
    async handleFileDownload() {
        this.downloadProgress.style.display = 'block'; // Отображаем прогресс скачивания
        this.downloadProgressBar.style.width = '0%'; // Устанавливаем начальную ширину прогресс-бара
        this.downloadProgressText.textContent = 'Подготовка к скачиванию...'; // Устанавливаем текст прогресса

        const socket = new WebSocket('ws://localhost:8000/ws/download_progress/'); // Другой WebSocket URL для скачивания
        let timeoutId;

        const setupTimeout = () => {
            timeoutId = setTimeout(() => {
                console.error('WebSocket (Download): No response from server. Closing connection.');
                socket.close();
                this.downloadProgress.style.display = 'none';
                alert('Превышено время ожидания ответа от сервера.');
            }, 10000);
        };

        const resetTimeout = () => {
            clearTimeout(timeoutId);
            setupTimeout();
        };

        socket.onopen = () => {
            setupTimeout();
            socket.send(JSON.stringify({task: 'start_download'})); //  Отправляем команду серверу начать скачивание
        };

        socket.onmessage = (event) => {
            resetTimeout();
            console.log('Получено сообщение:', event.data); // Логирование полученных данных
            const data = JSON.parse(event.data); // Преобразуем данные из JSON
            const progress = data.progress; // Получаем процент прогресса из данных

            this.downloadProgressBar.style.width = `${progress}%`; // Обновляем ширину прогресс-бара
            this.downloadProgressText.textContent = `Скачивание: ${progress}%...`; // Обновляем текст с информацией о прогрессе

            if (data.file_url) { // Если получили URL файла
                clearTimeout(timeoutId);
                socket.close(); // Закрываем соединение WebSocket
                this.downloadProgress.style.display = 'none'; // Hide the progress bar

                // Trigger the file download using the URL received from the server
                this.downloadFile(data.file_url);
            }
            if (data.error) { //  Обрабатываем ошибку, полученную от сервера
                clearTimeout(timeoutId);
                console.error('Ошибка на сервере:', data.error, data.traceback);
                alert(`Произошла ошибка: ${data.error}`);
                socket.close(); // закрываем сокет при получении ошибки с сервера
                this.downloadProgress.style.display = 'none'; // скрываем прогресс бар при получении ошибки
            }
        };

        socket.onclose = () => {
            clearTimeout(timeoutId);
            console.log('WebSocket connection closed');
        };

        socket.onerror = (error) => {
            clearTimeout(timeoutId);
            console.error('WebSocket error:', error);
            this.downloadProgress.style.display = 'none'; // скрываем прогресс бар в случае ошибки
            alert('Произошла ошибка при получении обновлений о прогрессе.');
            socket.close();
        };
    }

    /**
     *  Метод для запуска скачивания файла.
     * @param {string} fileUrl
     */
    downloadFile(fileUrl) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', 'globus_new.docx'); // Укажите имя файла (или получите его из ответа сервера)
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }


    /**
     * Обрабатывает ввод текста в поле поиска.
     * Фильтрует список городов на основе введенного текста и отображает предложения.
     */
    handleSearch() {
        this.citiesGrid.innerHTML = ''; // Очищаем содержимое сетки городов
        const searchTerm = this.searchInput.value.toLowerCase().trim(); // Получаем поисковый запрос и приводим к нижнему регистру

        if (searchTerm.length < 1) { // Если поисковый запрос пустой
            this.suggestionsList.innerHTML = ''; // Очищаем список предложений
            this.citiesGrid.innerHTML = ''; // Очищаем сетку городов
            return; // Выходим из функции
        }

        if (!this.cities || !Array.isArray(this.cities)) { // Если данные о городах не определены или не являются массивом
            console.error('Cities data is not defined or is not an array.'); // Выводим сообщение об ошибке в консоль
            return; // Выходим из функции
        }

        const filteredCities = this.cities.reduce((acc, city) => {
            if (city.location.toLowerCase().includes(searchTerm)) {
                acc.push({city, match: city.location});
            }
            if (city.name_organ.toLowerCase().includes(searchTerm)) {
                acc.push({city, match: city.name_organ});
            }
            if (city.pseudonim.toLowerCase().includes(searchTerm)) {
                acc.push({city, match: city.pseudonim});
            }
            return acc;
        }, []);

        this.renderSuggestions(filteredCities);
    }


    /**
     * Отображает список предложений городов.
     * @param {Array} filteredCities - Массив городов для отображения.
     */
    renderSuggestions(filteredCities) {
        this.selectedIndex = -1; // Сбрасываем индекс выбранного элемента

        if (filteredCities.length === 0) { // Если нет подходящих городов
            this.suggestionsList.innerHTML = '<div class="no-suggestions">Нет подходящих городов</div>'; // Выводим сообщение об отсутствии предложений
            return; // Выходим из функции
        }

        this.suggestionsList.innerHTML = filteredCities.map((item, index) => `
            <div class="suggestion-item ${this.selectedIndex === index ? 'selected' : ''}" 
                data-city="${item.match}"
                data-type="${item.type}"
                data-location="${item.city.location}"
                data-name_organ="${item.city.name_organ}"
                data-pseudonim="${item.city.pseudonim}">
                ${item.match}
            </div>
        `).join(''); // Формируем HTML-код для списка предложений на основе массива городов

        const suggestionItems = this.suggestionsList.querySelectorAll('.suggestion-item'); // Получаем все элементы списка предложений

        suggestionItems.forEach(item => {
            item.addEventListener('click', () => this.selectCity(item)); // Добавляем обработчик клика для каждого элемента списка
        });
    }

    /**
     * Выбирает город из списка предложений.
     * @param {HTMLElement} item - Элемент списка предложений, представляющий выбранный город.
     */
    selectCity(item) {
        const city = this.cities.find(c =>
            c.location === item.dataset.location &&
            c.name_organ === item.dataset.name_organ &&
            c.pseudonim === item.dataset.pseudonim
        );
        if (city) {
            this.searchInput.value = item.dataset.city;
            this.suggestionsList.innerHTML = '';
            this.renderCityCard(city);
        }
    }


    /**
     * Обрабатывает клик за пределами поля ввода и списка предложений.
     * Скрывает список предложений.
     * @param {object} event - Объект события `click`.
     */
    handleClickOutside(event) {
        if (!this.searchInput.contains(event.target) && !this.suggestionsList.contains(event.target)) { // Если клик произошел за пределами поля ввода и списка предложений
            this.suggestionsList.innerHTML = ''; // Очищаем список предложений
            this.selectedIndex = -1; // Сбрасываем индекс выбранного элемента
        }
    }

    /**
     * Отображает список предложений, если поле ввода не пустое.
     */
    showSuggestions() {
        if (this.searchInput.value.length > 0) { // Если поле ввода не пустое
            this.handleSearch(); // Выполняем поиск
        }
    }

    /**
     * Получает данные о городе из карточки.
     * @param {HTMLElement} card - Карточка города.
     * @returns {object} - Данные о городе.
     */
    getCityFromCard(card) {
        const tableId = card.dataset.tableId;
        const dockNum = card.dataset.dockNum;

        if (!tableId || !dockNum) {
            console.error('tableId or dockNum is missing on the card.');
            return;
        }
        return this.cities.find(city =>
            city.table_id === tableId &&
            city.dock_num === dockNum
        );
    }

    /**
     * Обрабатывает нажатие клавиши Enter в поле ввода.
     * Отображает карточки для всех подходящих городов.
     */
    handleEnter() {
        const searchTerm = this.searchInput.value.toLowerCase().trim(); // Получаем текст из поля ввода и приводим к нижнему регистру
        if (searchTerm === '') { // Если текст пустой
            return; // Выходим из функции
        }
        const filteredCities = this.cities.filter(city => { // Фильтруем список городов
            const combinedName = `${city.location.toLowerCase()} [${city.name_organ.toLowerCase()}] [${city.pseudonim.toLowerCase()}]`;
            return (
                city.location.toLowerCase().includes(searchTerm) ||
                city.name_organ.toLowerCase().includes(searchTerm) ||
                city.pseudonim.toLowerCase().includes(searchTerm) ||
                combinedName.includes(searchTerm)
            );
        });

        this.citiesGrid.innerHTML = ''; // Очищаем сетку городов

        filteredCities.forEach((city, index) => { // Для каждого отфильтрованного города
            setTimeout(() => { // Используем setTimeout для анимации
                this.renderCityCard(city); // Отображаем карточку города
            }, index * 200); // Задержка для каждого города
        });
    }

    /**
     * Функция для открытия модального окна с формой редактирования города.
     * @param {object} city - Объект с данными города.
     */
    openEditModal(city) {
        // Получаем элементы модального окна
        const modal = document.getElementById('editCityModal');
        const cityIdInput = document.getElementById('cityId');
        const cityNameInput = document.getElementById('cityName');
        const cityDescriptionTextarea = document.getElementById('cityDescription');
        const saveCityButton = document.getElementById('saveCityButton');
        const deleteCityButton = document.getElementById('deleteCityButton');
        const closeButton = document.querySelector('.close-button');

        // Заполняем поля формы данными о городе
        cityIdInput.value = city.id; // city.id  Обязательно передать значение id, чтобы знать какой город сохранять.
        cityNameInput.value = city.location;
        cityDescriptionTextarea.value = city.description;

        // Добавляем обработчик события для кнопки "Сохранить"
        saveCityButton.onclick = () => {
            this.saveCity(city.id, cityNameInput.value, cityDescriptionTextarea.value);
            modal.style.display = 'none';
        };

        // Добавляем обработчик события для кнопки "Удалить"
        deleteCityButton.onclick = () => {
            this.deleteCity(city.id);
            modal.style.display = 'none';
        };

        // Добавляем обработчик события для кнопки "Закрыть"
        closeButton.onclick = () => {
            modal.style.display = 'none';
        };

        // Отображаем модальное окно
        modal.style.display = 'block';
    }

    /**
     * Функция для сохранения изменений города.
     * @param {string} cityId - ID города.
     * @param {string} newName - Новое имя города.
     * @param {string} newDescription - Новое описание города.
     */
    async saveCity(cityId, newName, newDescription) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        const formData = new FormData();
        formData.append('city_id', cityId);
        formData.append('new_name', newName);
        formData.append('new_description', newDescription);

        try {
            const response = await fetch(saveCityUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrfToken
                }
            });

            if (response.ok) {
                // Если сохранение прошло успешно, обновляем данные в citiesData и на странице
                const updatedCity = await response.json();

                // Обновляем данные в citiesData
                const index = this.cities.findIndex(city => city.id === cityId);
                if (index !== -1) {
                    this.cities[index] = updatedCity;
                }

                // Обновляем данные на странице
                const cityCard = document.querySelector(`.city-card[data-id="${cityId}"]`);
                if (cityCard) {
                    cityCard.querySelector('h3').textContent = newName;
                    cityCard.querySelector('.city-description').textContent = newDescription;
                }

                alert('Город успешно сохранен!');
            } else {
                console.error('Ошибка при сохранении города:', response.statusText);
                alert('Ошибка при сохранении города!');
            }
        } catch (error) {
            console.error('Произошла ошибка при отправке запроса:', error);
            alert('Произошла ошибка при отправке запроса!');
        }
    }

    /**
     * Функция для удаления города.
     * @param {string} cityId - ID города.
     */
    async deleteCity(cityId) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        const formData = new FormData();
        formData.append('city_id', cityId);

        try {
            const response = await fetch(deleteCityUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrfToken
                }
            });

            if (response.ok) {
                // Если удаление прошло успешно, обновляем данные в citiesData и на странице
                // Удаляем данные из citiesData
                this.cities = this.cities.filter(city => city.id !== cityId);

                // Удаляем карточку города со страницы
                const cityCard = document.querySelector(`.city-card[data-id="${cityId}"]`);
                if (cityCard) {
                    cityCard.remove();
                }

                alert('Город успешно удален!');
            } else {
                console.error('Ошибка при удалении города:', response.statusText);
                alert('Ошибка при удалении города!');
            }
        } catch (error) {
            console.error('Произошла ошибка при отправке запроса:', error);
            alert('Произошла ошибка при отправке запроса!');
        }
    }


    /**
     * @param {number} direction - 1 для перемещения вниз, -1 для перемещения вверх.
     */
    moveSelection(direction) {
        const suggestionItems = this.suggestionsList.querySelectorAll('.suggestion-item'); // Получаем все элементы списка предложений
        if (suggestionItems.length === 0) { // Если нет предложений
            return; // Выходим из функции
        }

        this.selectedIndex += direction; // Изменяем индекс выбранного элемента

        if (this.selectedIndex < 0) { // Если индекс стал меньше нуля
            this.selectedIndex = suggestionItems.length - 1; // Устанавливаем индекс на последний элемент
        } else if (this.selectedIndex >= suggestionItems.length) { // Если индекс стал больше или равен количеству предложений
            this.selectedIndex = 0; // Устанавливаем индекс на первый элемент
        }

        suggestionItems.forEach((item, index) => { // Для каждого элемента списка предложений
            if (index === this.selectedIndex) { // Если это выбранный элемент
                item.classList.add('selected'); // Добавляем класс 'selected'
            } else { // Если это не выбранный элемент
                item.classList.remove('selected'); // Удаляем класс 'selected'
            }
        });
    }

    /**
     * @param {object} city - Объект с данными города.
     */
    renderCityCard(city) {
        const card = document.createElement('div');

        card.className = 'city-card';

        card.dataset.tableId = city.table_id;

        card.dataset.dockNum = city.dock_num;

        card.dataset.id = city.id
        card.innerHTML = `
            <h3>${city.location}</h3>
            <div class="city-info">
                <p><strong>Название организации:</strong> ${city.name_organ}</p>
                <p><strong>Псевдоним:</strong> ${city.pseudonim}</p>
                <p class="city-description">${city.description}</p>
            </div>
        `;

        this.citiesGrid.appendChild(card);
        setTimeout(() => card.classList.add('show'), 50);
    }

}

// Инициализация класса CitySearch при загрузке страницы.
const citySearch = new CitySearch(isAdmin);

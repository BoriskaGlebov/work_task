class CitySearch {
    constructor(isAdmin, isIlia) {
        this.isAdmin = isAdmin;
        this.isIlia = isIlia;
        console.log('isAdmin:', this.isAdmin); // Добавлено для отладки
        console.log('isIlia:', this.isIlia); // Добавлено для отладки
        this.cities = window.citiesData || [];
        this.csrfToken = "{{ csrf_token }}"; // Предполагается, что CSRF-токен доступен в шаблоне Django
        this.searchInput = document.getElementById('citySearch');
        this.suggestionsList = document.getElementById('suggestionsList');
        this.citiesGrid = document.getElementById('citiesGrid');
        this.selectedIndex = -1;
        this.fileInput = document.getElementById('cityFileInput');
        this.uploadBtn = document.getElementById('uploadCityFileBtn');
        this.downloadBtn = document.getElementById('downloadCityFileBtn'); // Добавляем ссылку на кнопку скачивания
        this.uploadProgress = document.getElementById('cityUploadProgress');
        this.uploadProgressBar = document.getElementById('cityUploadProgressBar');
        this.uploadProgressText = document.getElementById('cityUploadProgressText');
        this.downloadProgress = document.getElementById('cityUploadProgress');  // прогресс скачивания
        this.downloadProgressBar = document.getElementById('cityUploadProgressBar'); //  прогресс бар скачивания
        this.downloadProgressText = document.getElementById('cityUploadProgressText');  // текст прогресса скачивания
        this.modal = document.getElementById('editCityModal'); // Добавляем ссылку на модальное окно

        this.init();
    }

    /**
     * Инициализация обработчиков событий для элементов DOM.
     */
    init() {
        this.searchInput.addEventListener('input', () => this.handleSearch());
        this.searchInput.addEventListener('focus', () => this.showSuggestions());
        document.addEventListener('click', (e) => this.handleClickOutside(e));
        if (this.uploadBtn) {
            this.uploadBtn.addEventListener('click', () => this.handleFileUpload());
        }
        if (this.downloadBtn) { //  Добавляем прослушиватель для кнопки скачивания
            this.downloadBtn.addEventListener('click', () => this.handleFileDownload());
        }
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleEnter();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.moveSelection(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.moveSelection(-1);
            }
        });
        // Используем делегирование событий для открытия модального окна и других действий
        this.citiesGrid.addEventListener('click', (event) => {
            const target = event.target.closest('.city-card');
            if (target) {
                event.stopPropagation();
                const cityData = target.dataset.city;
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
        const file = this.fileInput.files[0];

        if (!file) {
            alert('Пожалуйста, выберите файл для загрузки');
            return;
        }

        if (file.name !== 'globus.docx') {
            alert('Ошибка: файл должен называться "globus.docx"');
            return;
        }

        const formData = new FormData();
        formData.append('cityFile', file);

        this.uploadProgress.style.display = 'block';
        this.uploadProgressBar.style.width = '0%';
        this.uploadProgressText.textContent = 'Начало загрузки...';

        const socket = new WebSocket('ws://localhost:8000/ws/progress/');
        let timeoutId;

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

            const data = JSON.parse(event.data);
            const progress = data.progress;

            this.uploadProgressBar.style.width = `${progress}%`;
            this.uploadProgressText.textContent = `Обработка: ${progress}%...`;

            if (data.cities) {
                clearTimeout(timeoutId);
                this.cities = data.cities;
                socket.close();
                setTimeout(() => {
                    this.uploadProgress.style.display = 'none';
                    this.uploadProgressBar.style.width = '0%';
                    this.fileInput.value = '';
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
            const response = await fetch(uploadUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrfToken
                }
            });

            if (!response.ok) {

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

        } catch (error) {
            this.uploadProgress.style.display = 'none';
            console.error('Ошибка при выполнении запроса', error);
            alert('Произошла ошибка при загрузке файла');
        }
    }

    async handleFileDownload() {
        this.downloadProgress.style.display = 'block';
        this.downloadProgressBar.style.width = '0%';
        this.downloadProgressText.textContent = 'Подготовка к скачиванию...';

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
            const data = JSON.parse(event.data);
            const progress = data.progress;

            this.downloadProgressBar.style.width = `${progress}%`;
            this.downloadProgressText.textContent = `Скачивание: ${progress}%...`;

            if (data.file_url) {
                clearTimeout(timeoutId);
                socket.close();
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
        this.citiesGrid.innerHTML = '';
        const searchTerm = this.searchInput.value.toLowerCase().trim();

        if (searchTerm.length < 1) {
            this.suggestionsList.innerHTML = '';
            this.citiesGrid.innerHTML = '';
            return;
        }

        if (!this.cities || !Array.isArray(this.cities)) {
            console.error('Cities data is not defined or is not an array.');
            return;
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
        this.selectedIndex = -1;

        if (filteredCities.length === 0) {
            this.suggestionsList.innerHTML = '<div class="no-suggestions">Нет подходящих городов</div>';
            return;
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
        `).join('');

        const suggestionItems = this.suggestionsList.querySelectorAll('.suggestion-item');

        suggestionItems.forEach(item => {
            item.addEventListener('click', () => this.selectCity(item));
        });
    }

    /**
     * Выбирает город из списка предложений.
     * @param {string} item - Название выбранного города.
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
            //  Отправляем запрос на сервер для записи выбора города
            // this.trackCitySelection(city);
        }
    }

    /**
     * Отправляет запрос на сервер для записи информации о выбранном городе.
     * @param {object} city - Объект с данными о городе.
     */
    async trackCitySelection(city) {
        try {
            const response = await fetch(trackCities, {  //  Укажите URL-адрес для обработки запроса на сервере
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken  //  Не забудьте включить CSRF-токен
                },

                body: JSON.stringify({
                    table_id: city.table_id,
                    dock_num: city.dock_num,

                })
            });

            if (!response.ok) {
                console.error('Ошибка при отправке данных о городе на сервер:', response.status);
            } else {
                console.log('Данные о городе успешно отправлены на сервер');
            }
        } catch (error) {
            console.error('Ошибка при отправке запроса:', error);
        }
    }


    /**
     * Обрабатывает клик за пределами поля ввода и списка предложений.
     * Скрывает список предложений.
     * @param {object} event - Объект события `click`.
     */

    handleClickOutside(event) {
        if (!this.searchInput.contains(event.target) && !this.suggestionsList.contains(event.target)) {
            this.suggestionsList.innerHTML = '';
            this.selectedIndex = -1;
        }
    }

    /**
     * Отображает список предложений, если поле ввода не пустое.
     */
    showSuggestions() {
        if (this.searchInput.value.length > 0) {
            this.handleSearch();
        }
    }

    getCityFromCard(card) {
        const tableId = card.dataset.tableId;
        const dockNum = card.dataset.dockNum;
        return this.cities.find(city => String(city.table_id) === tableId && String(city.dock_num) === dockNum);
    }

    /**
     * Обрабатывает нажатие клавиши Enter в поле ввода.
     * Отображает карточки для всех подходящих городов.
     */
    handleEnter() {
        if (this.selectedIndex !== -1 && this.suggestionsList.children.length > 0) {
            const selectedItem = this.suggestionsList.children[this.selectedIndex];
            this.selectCity(selectedItem); // Вызываем selectCity с выбранным элементом
            this.suggestionsList.innerHTML = ''; // Очищаем список предложений после выбора
        } else {
            // Если нет выбранного элемента в списке, выполняем поиск
            const searchTerm = this.searchInput.value.toLowerCase().trim();
            if (searchTerm === '') {
                return;
            }

            // Очищаем текущие карточки и список предложений
            this.citiesGrid.innerHTML = '';
            this.suggestionsList.innerHTML = '';

            // Выполняем поиск и отображаем результаты на citiesGrid (без предложений)
            const filteredCities = this.cities.filter(city => {
                const combinedName = `${city.location.toLowerCase()} [${city.name_organ.toLowerCase()}] [${city.pseudonim.toLowerCase()}]`;
                return (
                    city.location.toLowerCase().includes(searchTerm) ||
                    city.name_organ.toLowerCase().includes(searchTerm) ||
                    city.pseudonim.toLowerCase().includes(searchTerm) ||
                    combinedName.includes(searchTerm)
                );
            });

            filteredCities.forEach((city, index) => {
                setTimeout(() => {
                    this.renderCityCard(city);
                }, index * 100);
            });
        }
    }


    /**
     * Перемещает выделение в списке предложений.
     * @param {number} direction - Направление перемещения (1 - вниз, -1 - вверх).
     */
    moveSelection(direction) {
        const suggestions = Array.from(this.suggestionsList.querySelectorAll('.suggestion-item'));

        if (suggestions.length === 0) return;

        if (this.selectedIndex >= 0) {
            suggestions[this.selectedIndex].classList.remove('selected');
        }

        this.selectedIndex += direction;

        if (this.selectedIndex < 0) {
            this.selectedIndex = suggestions.length - 1;
        } else if (this.selectedIndex >= suggestions.length) {
            this.selectedIndex = 0;
        }

        suggestions[this.selectedIndex].classList.add('selected');

        suggestions[this.selectedIndex].scrollIntoView({block: "nearest"});

        this.searchInput.value = suggestions[this.selectedIndex].dataset.city;
    }

    getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                let cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }


    renderCityCard(city) {
        const escapedCityLocation = CSS.escape(city.location);
        const escapedCityNameOrgan = CSS.escape(city.name_organ);
        const escapedCityPseudonim = CSS.escape(city.pseudonim);

        const existingCard = document.querySelector(`.city-card[data-city="${escapedCityLocation} [${escapedCityNameOrgan}] [${escapedCityPseudonim}]"]`);

        if (!existingCard) {

            const cityCardHTML = `
                <div class="city-card" data-city="${city.location} [${city.name_organ}] [${city.pseudonim}]"
                     data-table-id="${city.table_id}"
                     data-dock-num="${city.dock_num}"
                     style="cursor: pointer;">
                    <h3>${city.location}</h3>
                    <div class="city-info">
                        <p><strong>Псевдоним:</strong> ${city.pseudonim}</p>
                        <p><strong>IP-адрес:</strong> ${city.ip_address}</p>
                        <p><strong>Организация:</strong> ${city.name_organ}</p>
                        <p><strong>Рабочее время:</strong> ${city.work_time}</p>
                    </div>
                </div>
            `;

            this.citiesGrid.innerHTML += cityCardHTML;

            const newCard = this.citiesGrid.lastElementChild;

            requestAnimationFrame(() => {
                newCard.classList.add('show');
            });

        }
        // Отправляем запрос на сервер для записи информации о отображенном городе
        this.trackCitySelection(city);
    }

    openEditModal(city) {
        const modal = document.getElementById('editCityModal');
        const editCityLocation = document.getElementById('editCityLocation');
        const editCityNameOrgan = document.getElementById('editCityNameOrgan');
        const editCityPseudonim = document.getElementById('editCityPseudonim');
        const editCityIpAddress = document.getElementById('editCityIpAddress');
        const editCityWorkTime = document.getElementById('editCityWorkTime');

        // Заполняем поля формы данными города
        editCityLocation.value = city.location;
        editCityNameOrgan.value = city.name_organ;
        editCityPseudonim.value = city.pseudonim;
        editCityIpAddress.value = city.ip_address;
        editCityWorkTime.value = city.work_time;

        modal.style.display = "block";
        modal.dataset.tableId = city.table_id;
        modal.dataset.dockNum = city.dock_num;

        // Добавляем обработчик для кнопки "Сохранить"
        const saveCityButton = document.getElementById('saveCityButton');
        saveCityButton.onclick = () => {
            this.saveEditedCity(city.table_id, city.dock_num);
        };
        const deleteCityButton = document.getElementById('deleteCityButton');
        deleteCityButton.onclick = () => {
            const tableId = modal.dataset.tableId;
            const dockNum = modal.dataset.dockNum;
            this.deleteCity(tableId, dockNum);
        };

        // Добавляем обработчик для кнопки закрытия
        const closeButton = document.querySelector('.modal .close-button');
        closeButton.onclick = () => {
            this.closeEditModal();
        };

        // Закрытие модального окна при клике вне его
        window.onclick = function (event) {
            if (event.target == modal) {
                this.closeEditModal();
            }
        }.bind(this);
    }

    closeEditModal() {
        const modal = document.getElementById('editCityModal');
        modal.style.display = "none";
    }

    async saveEditedCity(tableId, dockNum) {
        const modal = document.getElementById('editCityModal');
        const editCityLocation = document.getElementById('editCityLocation');
        const editCityNameOrgan = document.getElementById('editCityNameOrgan');
        const editCityPseudonim = document.getElementById('editCityPseudonim');
        const editCityIpAddress = document.getElementById('editCityIpAddress');
        const editCityWorkTime = document.getElementById('editCityWorkTime');

        const updatedCityData = {
            location: editCityLocation.value,
            name_organ: editCityNameOrgan.value,
            pseudonim: editCityPseudonim.value,
            ip_address: editCityIpAddress.value,
            work_time: editCityWorkTime.value
        };
        const url = `/work/cities/${encodeURIComponent(tableId)}/${encodeURIComponent(dockNum)}/`;

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                },
                body: JSON.stringify(updatedCityData)
            });

            if (response.ok) {
                // Находим индекс города в массиве cities
                const index = this.cities.findIndex(city => city.table_id === tableId && city.dock_num === dockNum);

                if (index !== -1) {
                    // Обновляем данные города в массиве cities
                    this.cities[index] = {
                        ...this.cities[index], // Сохраняем старые данные
                        ...updatedCityData // Обновляем новыми
                    };
                }
                console.log('Город успешно обновлен');

                this.citiesGrid.innerHTML = '';
                // Удаляем старую карточку
                const oldCard = document.querySelector(`.city-card[data-city="${CSS.escape(this.cities[index].location)} [${CSS.escape(this.cities[index].name_organ)}] [${CSS.escape(this.cities[index].pseudonim)}]"]`);
                this.searchInput.value = '';
                if (oldCard) {
                    oldCard.remove();
                }
                // Создаем новую карточку
                this.renderCityCard(this.cities[index]);
                this.closeEditModal();

            } else {
                this.closeEditModal();
                alert(`Ошибка при обновлении города: ${errorData.message}`);
                console.error('Ошибка при обновлении города');

            }
        } catch (error) {
            this.closeEditModal();
            console.error('Ошибка сети при обновлении города:', error);
            alert(`Ошибка сети при обновлении города: ${error}`);
            this.closeEditModal();
        }
    }


    async deleteCity(tableId, dockNum, cardElement) {
        console.log('Удаляем город с tableId:', tableId, 'и dockNum:', dockNum);

        if (confirm('Вы уверены, что хотите удалить данные о городе?')) {
            try {
                const response = await fetch(`/work/cities/${encodeURIComponent(tableId)}/${encodeURIComponent(dockNum)}/`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': this.getCookie('csrftoken')
                    }
                });

                if (response.ok) {
                    console.log('Данные о городе успешно удалены');
                    // Закрываем модальное окно
                    this.closeEditModal();
                    // Очищаем строку поиска
                    this.searchInput.value = '';
                    // Обновляем данные о городе в массиве this.cities
                    const index = this.cities.findIndex(city => String(city.table_id) === String(tableId) && String(city.dock_num) === String(dockNum));
                    if (index !== -1) {
                        console.log('Город найден в массиве. Удаляем его.');
                        this.cities.splice(index, 1);
                    } else {
                        console.log('Город не найден в массиве.');
                    }
                    // Обновляем отображение
                    this.citiesGrid.innerHTML = '';
                    // this.displayAllCities();
                } else {
                    console.error('Ошибка при удалении данных о городе');
                }
            } catch (error) {
                console.error('Ошибка сети при удалении данных о городе:', error);
            }
        }
    }


}

// Инициализация класса CitySearch при загрузке страницы.
const citySearch = new CitySearch(isAdmin, isIlia);

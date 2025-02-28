class Statistics {
    constructor(stats) {
        console.log(stats)
        this.statsContainer = document.getElementById('statsContainer');
        this.stats = [
            {
                label: 'Конвертировано файлов',
                value: stats.converted_files || '0'  // Убедитесь, что значение существует
            },
            {
                label: 'Самый тяжелый день',
                value: stats.hard_day.max_day_files || '0',  // Убедитесь, что значение существует
                subtext: stats.hard_day.max_date || ''
            },
            {
                label: 'Выпито кофе ☕',
                value: stats.coffee_drunk.amount || '0',  // Убедитесь, что значение существует
                subtext: stats.coffee_drunk.note || ''
            }
        ];
        // Добавляем карточки для городов
        if (typeof stats.popular_cities === 'object' && stats.popular_cities !== null) {
            Object.keys(stats.popular_cities).forEach((cityKey) => {
                const cityData = stats.popular_cities[cityKey];
                this.stats.push({
                    label: `Популярный город ${cityKey.replace('city', '')}`,
                    value: cityData.amount || '0',
                    subtext: cityData.name || ''
                });
            });
        }

        console.log('Stats:', this.stats);
        this.init();
    }

    /**
     * Инициализация статистики.
     * Вызывает методы для рендеринга статистики и запуска анимации счетчика.
     */
    init() {
        this.renderStats();
        this.startCountAnimation();
    }

    /**
     * Отображает статистику на странице.
     * Генерирует HTML-код для каждой карточки статистики и добавляет его в контейнер.
     */
    renderStats() {
        this.statsContainer.innerHTML = this.stats.map(stat => {
            // Проверяем, является ли stat.value строкой и не равен ли он null или undefined
            const valueToDisplay = stat.value !== undefined && stat.value !== null ? stat.value : '0';
            const isNumber = !isNaN(valueToDisplay.replace(/,/g, ''));

            return `
                <div class="stat-card">
                    <div class="stat-value ${!isNumber ? 'text-stat' : ''}"
                         data-value="${valueToDisplay}">
                        ${isNumber ? valueToDisplay : '0'}
                    </div>
                    <div class="stat-label">${stat.label}</div>
                    ${stat.subtext ? `<div class="stat-subtext">${stat.subtext}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Запускает анимацию счетчика для отображения значений статистики.
     * Постепенно увеличивает значения от 0 до конечного значения в течение заданного времени.
     */
    startCountAnimation() {
        const statValues = document.querySelectorAll('.stat-value');

        statValues.forEach(element => {
            if (element.classList.contains('text-stat')) {
                element.style.opacity = 0;
                setTimeout(() => {
                    element.textContent = element.dataset.value;
                    element.style.opacity = 1;
                }, 500);
                return;
            }

            const finalValue = parseInt(element.dataset.value.replace(/,/g, ''));
            let currentValue = 0;
            const duration = 2000;  // Длительность анимации в миллисекундах
            const steps = 60;       // Количество шагов анимации
            const increment = finalValue / steps; // Увеличение на каждом шаге

            const timer = setInterval(() => {
                currentValue += increment;
                if (currentValue >= finalValue) {
                    currentValue = finalValue;
                    clearInterval(timer);
                }
                element.textContent = Math.floor(currentValue).toLocaleString(); // Форматируем число с разделением по тысячам
            }, duration / steps);
        });
    }
}


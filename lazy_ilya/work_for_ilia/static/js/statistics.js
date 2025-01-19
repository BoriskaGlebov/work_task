class Statistics {
    constructor(stats) {
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
        console.log('Stats:', this.stats);
        this.init();
    }

    init() {
        this.renderStats();
        this.startCountAnimation();
    }

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
            const duration = 2000;
            const steps = 60;
            const increment = finalValue / steps;

            const timer = setInterval(() => {
                currentValue += increment;
                if (currentValue >= finalValue) {
                    currentValue = finalValue;
                    clearInterval(timer);
                }
                element.textContent = Math.floor(currentValue).toLocaleString();
            }, duration / steps);
        });
    }
}

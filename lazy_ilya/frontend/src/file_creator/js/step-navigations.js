// step-navigation.js

/**
 * Функция для настройки навигации по шагам формы.
 * Добавляет обработчики кликов на шаги, чтобы показывать/скрывать форму,
 * а также управлять анимацией появления и исчезновения.
 */
export default function setupStepNavigation() {
    // Получаем все элементы с классом .step, которые будут шагами
    const steps = document.querySelectorAll('.step');
    // Получаем форму, которая будет показываться/скрываться
    const form = document.getElementById('step1-form');

    // Проходим по всем шагам и добавляем обработчик события на клик
    steps.forEach(step => {
        step.addEventListener('click', () => {
            // Получаем выбранный шаг из data-атрибута
            const selectedStep = step.dataset.step;

            // Удаляем класс активности с всех шагов
            steps.forEach(s => s.classList.remove('li-style-active'));

            // Добавляем класс активности для текущего шага
            step.classList.add('li-style-active');

            // Показать или скрыть форму в зависимости от выбранного шага
            if (selectedStep === '1') {
                // Если выбран первый шаг, показываем форму с анимацией
                setTimeout(() => {
                    // Убираем класс hidden, чтобы форма стала видимой
                    form.classList.remove('hidden');
                    // Добавляем класс show для анимации появления
                    setTimeout(() => {
                        form.classList.add('show');
                    }, 10); // Маленькая задержка для плавности анимации
                }, 200); // Задержка перед показом формы
            } else {
                // Если выбран не первый шаг, скрываем форму с анимацией
                form.classList.remove('show');
                setTimeout(() => {
                    // Добавляем класс hidden, чтобы скрыть форму
                    form.classList.add('hidden');
                }, 500); // Задержка для завершения анимации скрытия
            }
        });
    });
}

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
    const form1 = document.getElementById('step1-form');
    const form2 = document.getElementById('step2-form');

    // Проходим по всем шагам и добавляем обработчик события на клик
    steps.forEach(step => {
        step.addEventListener('click', () => {
                // Получаем выбранный шаг из data-атрибута
                const selectedStep = step.dataset.step;

                // Удаляем класс активности с всех шагов
                steps.forEach(s => s.classList.remove('li-style-active'));

                // Добавляем класс активности для текущего шага
                step.classList.add('li-style-active');
                if (selectedStep === '1') {
                    // Показываем form1
                    form2.classList.remove('show');
                    setTimeout(() => {

                        form1.classList.remove('hidden');
                        setTimeout(() => {
                            form2.classList.add('hidden');
                            form1.classList.add('show');
                        }, 10);
                    }, 500);
                } else if (selectedStep === '2') {
                    // Показываем form2
                    form1.classList.remove('show');
                    setTimeout(() => {

                        form2.classList.remove('hidden');
                        setTimeout(() => {
                            form1.classList.add('hidden');
                            form2.classList.add('show');
                        }, 10);
                    }, 500);
                } else {
                    // Если выбран не первый шаг, скрываем форму с анимацией
                    form1.classList.remove('show');
                    form2.classList.remove('show');
                    setTimeout(() => {
                        // Добавляем класс hidden, чтобы скрыть форму
                        form1.classList.add('hidden');
                        form2.classList.add('hidden');
                    }, 500); // Задержка для завершения анимации скрытия
                }
            }
        )
        ;
    });
}

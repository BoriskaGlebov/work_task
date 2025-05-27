// step-navigation.js

/**
 * Функция для показа нужной формы и скрытия остальных с анимацией.
 * @param {HTMLElement} targetForm - форма, которую нужно показать
 * @param  {...HTMLElement} otherForms - формы, которые нужно скрыть
 */
function showForm(targetForm, ...otherForms) {
    // Убираем класс 'show' у всех других форм
    otherForms.forEach(f => f.classList.remove('show'));

    // После анимации скрытия, скрываем формы и показываем нужную
    setTimeout(() => {
        otherForms.forEach(f => f.classList.add('hidden'));
        targetForm.classList.remove('hidden');

        setTimeout(() => {
            targetForm.classList.add('show');
        }, 100);
    }, 500);
}

/**
 * Настраивает навигацию по шагам формы.
 */
export default function setupStepNavigation() {
    const steps = document.querySelectorAll('.step');
    const forms = {
        1: document.getElementById('step1-form'),
        2: document.getElementById('step2-form'),
        3: document.getElementById('step3-form'),
        4: document.getElementById('step4-form'),
    };

    steps.forEach(step => {
        step.addEventListener('click', () => {
            const selectedStep = step.dataset.step;

            // Обновляем активный шаг
            steps.forEach(s => s.classList.remove('li-style-active'));
            step.classList.add('li-style-active');

            const targetForm = forms[selectedStep];
            const otherForms = Object.values(forms).filter(f => f !== targetForm);

            if (targetForm) {
                showForm(targetForm, ...otherForms);
            } else {
                // Если шаг невалидный — скрыть всё
                Object.values(forms).forEach(f => f.classList.remove('show'));
                setTimeout(() => {
                    Object.values(forms).forEach(f => f.classList.add('hidden'));
                }, 500);
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.step');
    const form = document.getElementById('step1-form');

    steps.forEach(step => {
        step.addEventListener('click', () => {
            const selectedStep = step.dataset.step;

            // Удалить активность со всех
            steps.forEach(s => {
                s.classList.remove('li-style-active');
                // const circle = s.querySelector('.step-circle');
                // circle.classList.remove('border-blue-600', 'dark:border-blue-500');
                // circle.classList.add('border-gray-500', 'dark:border-gray-400');
            });

            // Выделить текущий
            step.classList.add('li-style-active');
            // const circle = step.querySelector('.step-circle');
            // circle.classList.remove('border-gray-500', 'dark:border-gray-400');
            // circle.classList.add('border-blue-600', 'dark:border-blue-500');

            // Показать/скрыть форму
            if (selectedStep === '1') {
                form.classList.remove('hidden');
                form.classList.add('flex');
            } else {
                form.classList.add('hidden');
                form.classList.remove('flex');
            }
        });
    });
});
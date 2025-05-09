document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.step');
    const form = document.getElementById('step1-form');

    steps.forEach(step => {
        step.addEventListener('click', () => {
            const selectedStep = step.dataset.step;

            // Удалить активность со всех шагов
            steps.forEach(s => {
                s.classList.remove('li-style-active');
            });

            // Выделить текущий шаг
            step.classList.add('li-style-active');

            // Показать/скрыть форму в зависимости от выбранного шага
            if (selectedStep === '1') {
                // Задержка для первого отображения формы
                setTimeout(() => {
                    form.classList.remove('hidden'); // Убираем hidden
                    setTimeout(() => {
                        form.classList.add('show'); // Добавляем show для анимации
                    }, 10); // Небольшая задержка перед добавлением show
                }, 200); // Увеличенная задержка для первого отображения
            } else {
                // При переходе на другой шаг скрываем форму с анимацией
                form.classList.remove('show');
                setTimeout(() => {
                    form.classList.add('hidden');
                }, 500); // Задержка для завершения анимации
            }
        });
    });
});

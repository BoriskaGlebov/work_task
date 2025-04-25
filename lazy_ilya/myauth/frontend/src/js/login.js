document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    // Сообщения об ошибке (появляются под input)
    const usernameError = document.getElementById('login-error');
    const passwordError = document.getElementById('password-error');


    // Флаг для отслеживания первой анимации
    let isFirstLoad = true;
    // Валидация на отправку
    form.addEventListener('submit', (e) => {
        let valid = true;

        if (usernameInput.value.trim() === '') {
            usernameError.classList.remove('hidden');
            valid = false;
        }

        if (passwordInput.value.trim() === '') {
            passwordError.classList.remove('hidden');
            valid = false;
        }

        if (!valid) {
            e.preventDefault();
        }
    });

    // Скрытие при вводе
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('input', () => {
            if (input === usernameInput) {
                usernameError.classList.add('hidden')
            } else if (input === passwordInput) {
                passwordError.classList.add('hidden');
            }
        });
    });

    // Убираем анимацию при повторной загрузке страницы
    if (isFirstLoad) {
        // Добавляем класс для анимации только при первой загрузке страницы
        document.querySelector('form').classList.add('animate-fade-in');
        isFirstLoad = false; // Устанавливаем флаг на false после первого рендера
    }

});

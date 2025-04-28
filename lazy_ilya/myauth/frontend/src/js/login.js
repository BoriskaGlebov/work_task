document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const nonFieldErrors = document.getElementById('non-field-errors');
    const usernameError = document.getElementById('login-error');
    const passwordError = document.getElementById('password-error');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        usernameError.classList.add("hidden")
        passwordError.classList.add("hidden")
        nonFieldErrors.classList.add("hidden")
        const formData = new FormData(form);

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',  // важно! говорим Django, что это AJAX
                }
            });

            const data = await response.json();

            if (response.ok) {
                // Логин успешный
                window.location.href = data.redirect_url;
            } else {
                // Ошибка логина, показать ошибки
                const errors = data.errors;
                // Показываем ошибки пользователю (обработка зависит от структуры твоей формы)
                if (errors.username) {
                    usernameError.textContent = errors.username[0].message;
                    usernameError.classList.remove('hidden');
                }
                if (errors.password) {
                    passwordError.textContent = errors.password[0].message;
                    passwordError.classList.remove('hidden');
                }
                if (errors.__all__) {
                    nonFieldErrors.querySelector('p').textContent = errors.__all__[0].message;
                    nonFieldErrors.classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error('Ошибка при отправке формы:', error);
        }
    });
});

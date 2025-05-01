document.addEventListener('DOMContentLoaded', () => {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const form = document.querySelector('form');
    const usernameLabel = document.getElementById('username-label');
    const usernameInput = document.getElementById('username');
    const passwordLabel = document.getElementById('password-label');
    const passwordInput = document.getElementById('password');
    const usernameError = document.getElementById('login-error');
    const passwordError = document.getElementById('password-error');
    const loginIcon = document.getElementById('login-icon');
    const passwordIcon = document.getElementById('password-icon');

    const resetField = (label, input, icon, errorElement) => {
        errorElement.classList.add("hidden");
        label.classList.remove("error_label");
        label.classList.add("correct_label");
        input.classList.remove("error_input");
        input.classList.add("correct_input");
        icon.classList.remove("error_icon");
        icon.classList.add("correct_icon");
    };

    const setFieldError = (label, input, icon, errorElement, message) => {
        errorElement.textContent = message;
        errorElement.classList.remove("hidden");
        label.classList.add("error_label");
        label.classList.remove("correct_label");
        input.classList.add("error_input");
        input.classList.remove("correct_input");
        icon.classList.add("error_icon");
        icon.classList.remove("correct_icon");
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Сброс всех ошибок и стилей
        resetField(usernameLabel, usernameInput, loginIcon, usernameError);
        resetField(passwordLabel, passwordInput, passwordIcon, passwordError);

        const formData = new FormData(form);

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrfToken,  // 👈 правильно
                    'X-Requested-With': 'XMLHttpRequest',  // 👈 желательно: сообщает серверу, что это AJAX
                }
            });

            const data = await response.json();

            if (response.ok) {
                window.location.href = data.redirect_url;
            } else {
                const errors = data.errors;

                if (errors.username) {
                    setFieldError(usernameLabel, usernameInput, loginIcon, usernameError, errors.username[0].message);
                }

                if (errors.password) {
                    setFieldError(passwordLabel, passwordInput, passwordIcon, passwordError, errors.password[0].message);
                }

                if (errors.__all__) {
                    nonFieldErrors.querySelector('p').textContent = errors.__all__[0].message;
                    nonFieldErrors.classList.remove("hidden");

                    // Подсвечиваем оба поля на общий фейл
                    setFieldError(usernameInput, loginIcon, usernameError, '');
                    setFieldError(passwordInput, passwordIcon, passwordError, '');
                }
            }
        } catch (error) {
            console.error('Ошибка при отправке формы:', error);
        }
    });
});

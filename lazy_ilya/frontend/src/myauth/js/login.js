document.addEventListener('DOMContentLoaded', () => {
    // Получаем CSRF токен из скрытого поля в форме
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // Получаем элементы формы
    const form = document.querySelector('form');
    const nonFieldErrors = document.getElementById('non-field-errors');
    const usernameLabel = document.getElementById('username-label');
    const usernameInput = document.getElementById('username');
    const passwordLabel = document.getElementById('password-label');
    const passwordInput = document.getElementById('password');
    const usernameError = document.getElementById('login-error');
    const passwordError = document.getElementById('password-error');
    const loginIcon = document.getElementById('login-icon');
    const passwordIcon = document.getElementById('password-icon');
    const eyeIcon = document.getElementById('eye-icon');

    /**
     * Сбрасывает стили и ошибки для поля формы.
     * @param {HTMLElement} label - Элемент лейбла поля
     * @param {HTMLElement} input - Элемент ввода (поле)
     * @param {HTMLElement} icon - Иконка ошибки/успеха
     * @param {HTMLElement} errorElement - Элемент с ошибкой
     */
    const resetField = (label, input, icon, errorElement) => {
        errorElement.classList.add("hidden");
        label.classList.remove("error_label");
        label.classList.add("correct_label");
        input.classList.remove("error_input");
        input.classList.add("correct_input");
        icon.classList.remove("error_icon");
        icon.classList.add("correct_icon");
    };

    /**
     * Устанавливает ошибку для поля формы.
     * @param {HTMLElement} label - Элемент лейбла поля
     * @param {HTMLElement} input - Элемент ввода (поле)
     * @param {HTMLElement} icon - Иконка ошибки/успеха
     * @param {HTMLElement} errorElement - Элемент с ошибкой
     * @param {string} message - Сообщение об ошибке
     */
    const setFieldError = (label, input, icon, errorElement, message) => {
        errorElement.textContent = message;
        errorElement.classList.remove("hidden");
        label.classList.add("error_label");
        label.classList.remove("correct_label");
        input.classList.add("error_input");
        input.classList.remove("correct_input");
        icon.classList.add("error_icon");
        icon.classList.remove("correct_icon");
        // 🕒 Скрыть ошибку через 4 секунды
        setTimeout(() => {
            label.classList.remove('error_label');
            label.classList.add('correct_label');
            input.classList.remove('error_input');
            input.classList.add('correct_input')
            icon.classList.remove('error_icon');
            icon.classList.add('correct_icon');
            errorElement.textContent = '';
            errorElement.classList.add('hidden');
        }, 4000);
    };

    /**
     * Обработчик отправки формы
     * @param {Event} event - Событие отправки формы
     */
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Сброс всех ошибок и стилей
        resetField(usernameLabel, usernameInput, loginIcon, usernameError);
        resetField(passwordLabel, passwordInput, passwordIcon, passwordError);
        nonFieldErrors.classList.add("hidden")
        nonFieldErrors.classList.remove("flex")

        // Сбор данных из формы
        const formData = new FormData(form);

        try {
            // Отправляем форму с помощью fetch (AJAX запрос)
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrfToken,  // Отправляем CSRF токен
                    'X-Requested-With': 'XMLHttpRequest',  // Указываем, что это AJAX запрос
                }
            });

            // Преобразуем ответ в JSON
            const data = await response.json();

            if (response.ok) {
                // Если форма успешно отправлена, редиректим на другую страницу
                window.location.href = data.redirect_url;
            } else {
                // Обработка ошибок, если они есть
                const errors = data.errors;

                // Обработка ошибки для поля "username"
                if (errors.username) {
                    setFieldError(usernameLabel, usernameInput, loginIcon, usernameError, errors.username[0].message);
                }

                // Обработка ошибки для поля "password"
                if (errors.password) {
                    setFieldError(passwordLabel, passwordInput, passwordIcon, passwordError, errors.password[0].message);
                }

                // Обработка общей ошибки (например, если оба поля некорректны)
                if (errors.__all__) {
                    nonFieldErrors.querySelector('p').textContent = errors.__all__[0].message;
                    nonFieldErrors.classList.remove("hidden", "animate-popup-reverse");
                    nonFieldErrors.classList.add("flex", "animate-popup");

                    // Подсвечиваем оба поля на общий фейл
                    setFieldError(usernameLabel, usernameInput, loginIcon, usernameError, '');
                    setFieldError(passwordLabel, passwordInput, passwordIcon, passwordError, '');
                    // 🕒 Скрыть через 3 секунды
                    setTimeout(() => {
                        nonFieldErrors.classList.remove("animate-popup");
                        nonFieldErrors.classList.add("animate-popup-reverse");

                        // ⏱️ Скрыть блок только после завершения анимации (через 4 секунды)
                        setTimeout(() => {
                            nonFieldErrors.classList.add("hidden");
                            nonFieldErrors.classList.remove("flex", "animate-popup-reverse");
                        }, 1000); // должно совпадать с длительностью fade-in-out-reverse
                    }, 4000); // изначальная задержка перед скрытием
                }
            }
        } catch (error) {
            // Логирование ошибки при отправке формы
            console.error('Ошибка при отправке формы:', error);
        }
    });
    eyeIcon.addEventListener('mousedown', () => {
        passwordInput.type = 'text'; // показать пароль
    });

    eyeIcon.addEventListener('mouseup', () => {
        passwordInput.type = 'password'; // скрыть пароль
    });

    eyeIcon.addEventListener('mouseleave', () => {
        passwordInput.type = 'password'; // скрыть пароль, если мышь ушла с иконки
    });
    // === Добавляем для мобильных ===

    eyeIcon.addEventListener('touchstart', () => {
        passwordInput.type = 'text'; // показать пароль при касании
    });

    eyeIcon.addEventListener('touchend', () => {
        passwordInput.type = 'password'; // скрыть пароль при отпускании
    });

    eyeIcon.addEventListener('touchcancel', () => {
        passwordInput.type = 'password'; // скрыть, если касание было прервано (например, палец уехал)
    });

});

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const nonFieldErrors = document.getElementById('non-field-errors');
    // Сообщения об ошибке (появляются под input)
    const usernameError = document.getElementById('login-error');
    const passwordError = document.getElementById('password-error');

    let isFirstLoad = true;


    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let valid = true;

        // Валидация полей
        if (usernameInput.value.trim() === '') {
            usernameError.classList.remove('hidden');
            valid = false;
        }

        if (passwordInput.value.trim() === '') {
            passwordError.classList.remove('hidden');
            valid = false;
        }

        if (!valid) {
            e.preventDefault();  // Останавливаем отправку формы при ошибках
        } else {
            // Если форма валидна, отправляем данные асинхронно
            const formData = new FormData(form);
            fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                }
            })
                .then(response => response.text())
                .then(html => {
                    // Проверяем, есть ли ошибки на сервере
                    const errors = document.querySelectorAll('.form-error');
                    if (errors.length > 0) {
                        errors.forEach(error => {
                            error.classList.remove('hidden');
                        });
                    } else {
                        // Если ошибок нет, очищаем их
                        if (nonFieldErrors) {
                            nonFieldErrors.classList.add('hidden');
                        }
                    }
                    // Вставляем обновленную страницу
                    document.body.innerHTML = html;
                    // Если анимация сработала на первый раз, она не сработает повторно
                    document.querySelector('form').classList.remove('animate-fade-in');
                    isFirstLoad = false; // Устанавливаем флаг на false после первого рендера

                })
                .catch(error => {
                    console.error('Ошибка:', error);
                });
        }
    });

    // Скрытие ошибок при вводе данных
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('input', () => {
            if (input === usernameInput) {
                usernameError.classList.add('hidden');
            } else if (input === passwordInput) {
                passwordError.classList.add('hidden');
            }

            // Если есть блок общей ошибки — скрываем его
            if (nonFieldErrors) {
                nonFieldErrors.classList.add('hidden');
            }
        });
    });

    // Добавление анимации только при первой загрузке страницы
    if (isFirstLoad) {
        document.querySelector('form').classList.add('animate-fade-in');
        isFirstLoad = false;  // Устанавливаем флаг на false после первого рендера
    }
    console.log(isFirstLoad)
});

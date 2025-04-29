import Inputmask from "inputmask";

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registration-form');

    const usernameLabel = document.getElementById('username-label');
    const usernameIcon = document.getElementById('username-icon');
    const usernameInput = document.getElementById('username-input');
    const usernameError = document.getElementById('username-error');

    const phoneNumberLabel = document.getElementById('phone_number-label');
    const phoneNumberIcon = document.getElementById('phone_number-icon');
    const phoneNumberInput = document.getElementById('phone_number-input');
    const phoneNumberError = document.getElementById('phone_number-error');

    const password1Label = document.getElementById('password1-label');
    const password1Icon = document.getElementById('password1-icon');
    const password1Input = document.getElementById('password1-input');
    const password1Error = document.getElementById('password1-error');

    const password2Label = document.getElementById('password2-label');
    const password2Icon = document.getElementById('password2-icon');
    const password2Input = document.getElementById('password2-input');
    const password2Error = document.getElementById('password2-error');

    Inputmask("+7 (999) 999-99-99").mask(document.getElementById("phone_number-input"));

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

    form.addEventListener('submit', function (event) {
        event.preventDefault(); // Останавливаем стандартную отправку формы

        // Скрываем все сообщения об ошибках и очищаем их
        resetField(usernameLabel, usernameInput, usernameIcon, usernameError);
        resetField(phoneNumberLabel, phoneNumberInput, phoneNumberIcon, phoneNumberError);
        resetField(password1Label, password1Input, password1Icon, password1Error);
        resetField(password2Label, password2Input, password2Icon, password2Error);

        // Сбор данных из формы
        const formData = new FormData(form);

        // Отправляем данные на сервер с помощью fetch (AJAX)
        fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': 'XMLHttpRequest',
            }
        })
            .then(response => response.json()) // Ожидаем ответ в формате JSON
            .then(data => {
                if (data.errors) {
                    const errors = data.errors;
                    // Если есть ошибки, показываем их
                    Object.keys(data.errors).forEach(field => {
                        const errorElement = document.getElementById(`${field}-error`);
                        const labelElement = document.getElementById(`${field}-label`);
                        const inputElement = document.getElementById(`${field}-input`);
                        const iconElement = document.getElementById(`${field}-icon`);
                        if (errorElement) {
                            setFieldError(labelElement, inputElement, iconElement, errorElement, errors[field]);
                        }
                    });
                } else {
                    // Если ошибок нет, можем перенаправить пользователя на другую страницу
                    window.location.href = data.redirect_url;
                }
            })
            .catch(error => {
                console.error('Ошибка отправки формы:', error);
            });
    });
});

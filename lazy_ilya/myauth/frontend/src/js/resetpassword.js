import Inputmask from "inputmask";

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('reset-password-form');
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const fields = ['username', 'phone_number', 'password1', 'password2'];
    const nonFieldErrors = document.getElementById('non-field-errors');

    const getFieldElements = (fieldName) => ({
        label: document.getElementById(`${fieldName}-label`),
        input: document.getElementById(`${fieldName}-input`),
        icon: document.getElementById(`${fieldName}-icon`),
        error: document.getElementById(`${fieldName}-error`)
    });

    const resetField = ({label, input, icon, error}) => {
        error.classList.add("hidden");
        label.classList.remove("error_label");
        label.classList.add("correct_label");
        input.classList.remove("error_input");
        input.classList.add("correct_input");
        icon.classList.remove("error_icon");
        icon.classList.add("correct_icon");
    };

    const setFieldError = ({label, input, icon, error}, message) => {
        error.textContent = message;
        error.classList.remove("hidden");
        label.classList.add("error_label");
        label.classList.remove("correct_label");
        input.classList.add("error_input");
        input.classList.remove("correct_input");
        icon.classList.add("error_icon");
        icon.classList.remove("correct_icon");
    };

    Inputmask("+7 (999) 999-99-99").mask(document.getElementById("phone_number-input"));


    form.addEventListener('submit', function (event) {
        event.preventDefault(); // Останавливаем стандартную отправку формы

        // Сброс состояния всех полей
        fields.forEach(field => resetField(getFieldElements(field)));
        nonFieldErrors.classList.add("hidden");
        // Сбор данных из формы
        const formData = new FormData(form);

        // Отправляем данные на сервер с помощью fetch (AJAX)
        fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': csrfToken,  // 👈 правильно
                'X-Requested-With': 'XMLHttpRequest',  // 👈 желательно: сообщает серверу, что это AJAX
            }
        })
            .then(response => response.json()) // Ожидаем ответ в формате JSON
            .then(data => {
                if (data.errors) {
                    Object.entries(data.errors).forEach(([field, message]) => {
                        const elements = getFieldElements(field);
                        setFieldError(elements, message);
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

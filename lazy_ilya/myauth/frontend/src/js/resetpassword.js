import Inputmask from "inputmask";
import { getFieldElements, resetField, setFieldError, submitForm } from './registration.js';

/**
 * Инициализация и обработка формы сброса пароля.
 * Применяется маска для номера телефона и обрабатываются ошибки при отправке формы.
 */
document.addEventListener('DOMContentLoaded', function () {
    // Получаем элементы формы и CSRF токен
    const formResetPassword = document.getElementById('reset-password-form');
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // Определяем список полей, для которых нужно сбрасывать ошибки
    const fields_reset = ['username', 'phone_number', 'password1', 'password2'];

    // Инициализируем маску для поля телефона с использованием библиотеки Inputmask
    Inputmask("+7 (999) 999-99-99").mask(document.getElementById("phone_number-input"));

    /**
     * Обработчик отправки формы, предотвращающий стандартную отправку и выполняющий AJAX запрос.
     *
     * @param {Event} event - Событие отправки формы.
     */
    formResetPassword.addEventListener('submit', function (event) {
        event.preventDefault(); // Останавливаем стандартную отправку формы

        // Сброс состояния всех полей перед отправкой
        fields_reset.forEach(field => resetField(getFieldElements(field)));

        // Отправляем данные формы с использованием функции submitForm
        submitForm({
            form: formResetPassword, csrfToken, getFieldElements, setFieldError
        }).catch(error => {
            console.error('Ошибка в обработке формы:', error);
        });
    });
});

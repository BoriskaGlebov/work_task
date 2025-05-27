import Inputmask from "inputmask";

/**
 * Получает элементы формы по имени поля.
 * @param {string} fieldName - Имя поля формы (например, "username", "phone_number")
 * @returns {Object} Объект, содержащий элементы: label, input, icon и error.
 * @property {HTMLElement} label - Элемент лейбла поля
 * @property {HTMLElement} input - Элемент ввода (поле)
 * @property {HTMLElement} icon - Иконка ошибки/успеха
 * @property {HTMLElement} error - Элемент с ошибкой
 */
export const getFieldElements = (fieldName) => ({
    label: document.getElementById(`${fieldName}-label`),
    input: document.getElementById(`${fieldName}-input`),
    icon: document.getElementById(`${fieldName}-icon`),
    error: document.getElementById(`${fieldName}-error`)
});

/**
 * Сбрасывает стили и ошибки для поля формы.
 * @param {Object} elements - Объект с элементами поля формы.
 * @param {HTMLElement} elements.label - Элемент лейбла поля
 * @param {HTMLElement} elements.input - Элемент ввода (поле)
 * @param {HTMLElement} elements.icon - Иконка ошибки/успеха
 * @param {HTMLElement} elements.error - Элемент с ошибкой
 */
export const resetField = ({label, input, icon, error}) => {
    error.classList.add("hidden");
    label.classList.remove("error_label");
    label.classList.add("correct_label");
    input.classList.remove("error_input");
    input.classList.add("correct_input");
    icon.classList.remove("error_icon");
    icon.classList.add("correct_icon");
};

/**
 * Устанавливает ошибку для поля формы.
 * @param {Object} elements - Объект с элементами поля формы.
 * @param {HTMLElement} elements.label - Элемент лейбла поля
 * @param {HTMLElement} elements.input - Элемент ввода (поле)
 * @param {HTMLElement} elements.icon - Иконка ошибки/успеха
 * @param {HTMLElement} elements.error - Элемент с ошибкой
 * @param {string} message - Сообщение об ошибке
 */
export const setFieldError = ({label, input, icon, error}, message) => {
    error.textContent = message;
    error.classList.remove("hidden");
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
        error.textContent = '';
        error.classList.add('hidden');
    }, 4000);
};

/**
 * Отправляет форму с использованием fetch и обрабатывает ответ.
 * @param {Object} params - Параметры функции.
 * @param {HTMLFormElement} params.form - Элемент формы
 * @param {string} params.csrfToken - CSRF токен
 * @param {Function} params.getFieldElements - Функция для получения элементов поля формы
 * @param {Function} params.setFieldError - Функция для установки ошибок
 * @param {Function} [params.onSuccess] - Коллбек для обработки успешного ответа
 * @param {Function} [params.onError] - Коллбек для обработки ошибок
 * @returns {Promise<void>}
 */
export async function submitForm({
                                     form,
                                     csrfToken,
                                     getFieldElements,
                                     setFieldError,
                                     onSuccess,
                                     onError,
                                 }) {
    const formData = new FormData(form);

    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': csrfToken,  // Отправка CSRF токена для защиты от CSRF атак
                'X-Requested-With': 'XMLHttpRequest',  // Указывает серверу, что запрос выполняется через AJAX
            }
        });

        const data = await response.json();

        if (data.errors) {
            // Если в ответе есть ошибки, выводим их
            Object.entries(data.errors).forEach(([field, message]) => {
                const elements = getFieldElements(field);
                setFieldError(elements, message);
            });
            if (onError) onError(data.errors);
        } else {
            // Если ошибок нет, вызываем коллбек onSuccess или делаем редирект
            if (onSuccess) {
                onSuccess(data);
            } else if (data.redirect_url) {
                window.location.href = data.redirect_url;
            }
        }
    } catch (error) {
        console.error('Ошибка отправки формы:', error);
        if (onError) onError(error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    if (window.location.pathname !== '/login/registration/') {
        return; // Если это не страница регистрации, ничего не делаем
    }
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // Получаем форму и поля
    const formRegistration = document.getElementById('registration-form');
    const fields = ['username', 'phone_number', 'password1', 'password2'];

    // Инициализируем маску для поля телефона
    Inputmask("+7 (999) 999-99-99").mask(document.getElementById("phone_number-input"));

    // Обработчик отправки формы
    formRegistration.addEventListener('submit', function (event) {
        event.preventDefault(); // Останавливаем стандартную отправку формы

        // Сброс состояния всех полей
        fields.forEach(field => resetField(getFieldElements(field)));

        // Отправка данных формы
        submitForm({
            form: formRegistration, csrfToken, getFieldElements, setFieldError
        }).catch(error => {
            console.error('Ошибка в обработке формы:', error);
        });
    });
});

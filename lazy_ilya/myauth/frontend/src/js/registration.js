document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("registration-form");

    // Поля
    const fields = {
        login: {
            input: document.getElementById("login-input"),
            error: document.getElementById("login-error-msg"),
            label: document.getElementById("login-label"),
            icon: document.getElementById("login-icon")
        },
        firstName: {
            input: document.getElementById("first-name"),
            error: document.getElementById("first-name-error-msg"),
            label: document.getElementById("first-name-label")
        },
        lastName: {
            input: document.getElementById("last-name"),
            error: document.getElementById("last-name-error-msg"),
            label: document.getElementById("last-name-label")
        },
        phone: {
            input: document.getElementById("phone"),
            error: document.getElementById("phone-error"),
            label: document.getElementById("phone-label")
        },
        password: {
            input: document.getElementById("password"),
            error: document.getElementById("password-error"),
            label: document.getElementById("password-label")
        },
        confirmPassword: {
            input: document.getElementById("confirm-password"),
            error: document.getElementById("confirm-password-error"),
            label: document.getElementById("confirm-password-label")
        }
    };

    function showError(field, extraCheck = () => true) {
        const {input, error, label, icon} = field;
        if (!input.value.trim() || !extraCheck(input.value)) {
            error.classList.remove("hidden");
            input.classList.remove("border-gray-300", "dark:border-gray-700", "focus:ring-blue-400");
            input.classList.add("bg-red-50", "border-red-500", "text-red-900", "placeholder-red-700", "focus:ring-red-500", "focus:border-red-500");

            label.classList.remove("text-gray-900", "dark:text-white", "text-text-light", "dark:text-text-dark");
            label.classList.add("text-red-700", "dark:text-red-500");

            if (icon) {
                icon.classList.remove("text-gray-500", "dark:text-gray-400");
                icon.classList.add("text-red-500");
            }

            return true;
        }
        return false;
    }

    function hideError(field) {
        const {input, error, label, icon} = field;
        error.classList.add("hidden");
        input.classList.remove("bg-red-50", "border-red-500", "text-red-900", "placeholder-red-700", "focus:ring-red-500", "focus:border-red-500");
        input.classList.add("border-gray-300", "dark:border-gray-700", "focus:ring-blue-400");

        label.classList.remove("text-red-700", "dark:text-red-500");
        label.classList.add("text-gray-900", "dark:text-white", "text-text-light", "dark:text-text-dark");

        if (icon) {
            icon.classList.remove("text-red-500");
            icon.classList.add("text-gray-500", "dark:text-gray-400");
        }
    }

    // Маска для ввода номера телефона
    function maskPhoneNumber(event) {
        let input = event.target;
        let value = input.value;
        // Ожидаем, чтобы избежать мгновенного обновления
        requestAnimationFrame(function () {
            // Если номер начинается с плюса, сохраняем его
            if (value.length > 18) {
                value = value.slice(0, -1);  // Удаляем последний символ
            } else if (value.startsWith('+7')) {
                value = '+7 (' + value.slice(2).replace(/\D/g, '');  // Оставляем '+' и удаляем нецифровые символы
            } else if (value.startsWith('+')) {
                value = '+' + value.slice(0).replace(/\D/g, '');  // Оставляем '+' и удаляем нецифровые символы
            } else if (value.startsWith('9')) {
                value = '+7 (' + value.slice(0).replace(/\D/g, '');
            } else if (value.startsWith('8')) {
                value = '+7 (' + value.slice(1).replace(/\D/g, '');
            } else if (!value.startsWith('+7') && !value.startsWith('8') && !value.startsWith('9')) {
                // Если номер не начинается с +7, 8 или 9, очищаем значение
                value = value.slice(0, -1);  // Удаляем последний символ
            // } else {
            //     value = value.replace(/\D/g, '');  // Убираем все нецифровые символы
            }
            console.log("На выходе первых преобразований = " + value + " ДЛИНА + " + value.length);
            // Форматируем номер телефона в формат +7(XXX) XXX-XX-XX
            if (value.length <= 7) {
                value = value.slice(0, 7);
                console.log("1= " + value + " Длинна = " + value.length)
            } else if (value.length <= 10) {
                value = value.slice(0, 7) + ') ' + value.slice(7, 10);
                console.log("2= " + value + " Длинна = " + value.length)
            } else if (value.length < 13) {
                value = value.slice(0, 7) + ') ' + value.slice(7, 10) + '-' + value.slice(10, 12);
                console.log("3= " + value + " Длинна = " + value.length)
            } else if (value.length < 15) {
                value = value.slice(0, 7) + ') ' + value.slice(7, 10) + '-' + value.slice(10, 12) + '-' + value.slice(12, 14);
                console.log("4= " + value + " Длинна = " + value.length)
            }
            input.value = value;
        });


    }

    fields.phone.input.addEventListener("input", maskPhoneNumber);

    // Валидация при отправке формы
    form.addEventListener("submit", function (e) {
        let hasError = false;

        hasError |= showError(fields.login);
        hasError |= showError(fields.firstName);
        hasError |= showError(fields.lastName);
        hasError |= showError(fields.phone, value => value.replace(/\D/g, "").length >= 10);
        hasError |= showError(fields.password, value => value.length >= 5);
        hasError |= showError(fields.confirmPassword, () => fields.confirmPassword.input.value === fields.password.input.value);

        if (hasError) e.preventDefault();
    });

    // Обработчики для скрытия ошибок при вводе
    Object.values(fields).forEach(field => {
        field.input.addEventListener("input", () => {
            if (field.input.value.trim() !== "") hideError(field);
        });
    });
});
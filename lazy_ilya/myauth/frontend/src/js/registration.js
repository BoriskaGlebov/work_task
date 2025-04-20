document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("registration-form");

    // Логин
    const loginInput = document.getElementById("login-input");
    const loginError = document.getElementById("login-error-msg");
    const loginLabel = document.getElementById("login-label");
    const loginIcon = document.getElementById("login-icon");

    // Имя
    const firstNameInput = document.getElementById("first-name");
    const firstNameError = document.getElementById("first-name-error-msg");
    const firstNameLabel = document.getElementById("first-name-label");

    // Фамилия
    const lastNameInput = document.getElementById("last-name");
    const lastNameError = document.getElementById("last-name-error-msg");
    const lastNameLabel = document.getElementById("last-name-label");

    //Телефон
    const phoneInput = document.getElementById("phone");
    const phoneError = document.getElementById("phone-error");
    const phoneLabel = document.getElementById("phone-label");

    //Пароль
    const passwordLabel = document.getElementById("password-label");
    const passwordInput = document.getElementById("password");
    const passwordError = document.getElementById("password-error");
    //Подтверждение Пароля
    const confirmPasswordLabel = document.getElementById("confirm-password-label");
    const confirmPasswordInput = document.getElementById("confirm-password");
    const confirmPasswordError = document.getElementById("confirm-password-error");


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
            } else if (value.length < 10) {
                value = value.slice(0, 7) + ') ' + value.slice(7, 10);
                console.log("2= " + value + " Длинна = " + value.length)
            } else if (value.length < 12) {
                value = value.slice(0, 7) + ') ' + value.slice(7, 10) + '-' + value.slice(10, 12);
                console.log("3= " + value + " Длинна = " + value.length)
            } else if (value.length < 17) {
                value = value.slice(0, 7) + ') ' + value.slice(7, 10) + '-' + value.slice(10, 12) + '-' + value.slice(12, 15);
                console.log("4= " + value + " Длинна = " + value.length)
            }
            input.value = value;
        });


    }


    // Добавляем маску на input
    phoneInput.addEventListener("input", maskPhoneNumber);


    form.addEventListener("submit", function (e) {
        let hasError = false;

        // Проверка логина
        if (loginInput.value.trim() === "") {
            hasError = true;
            loginError.classList.remove("hidden");
            loginInput.classList.remove("border-gray-300", "dark:border-gray-700", "focus:ring-blue-400");
            loginInput.classList.add("bg-red-50", "border-red-500", "text-red-900", "placeholder-red-700", "focus:ring-red-500", "focus:border-red-500");
            loginLabel.classList.remove("text-gray-900", "dark:text-white");
            loginLabel.classList.add("text-red-700", "dark:text-red-500");
            loginIcon.classList.remove("text-gray-500", "dark:text-gray-400");
            loginIcon.classList.add("text-red-500");
        }

        // Проверка имени
        if (firstNameInput.value.trim() === "") {
            hasError = true;
            firstNameError.classList.remove("hidden");
            firstNameInput.classList.remove("border-gray-300", "dark:border-gray-700", "focus:ring-blue-400");
            firstNameInput.classList.add("bg-red-50", "border-red-500", "text-red-900", "placeholder-red-700", "focus:ring-red-500", "focus:border-red-500");
            firstNameLabel.classList.remove("text-text-light", "dark:text-text-dark");
            firstNameLabel.classList.add("text-red-700", "dark:text-red-500");
        }

        // Проверка фамилии
        if (lastNameInput.value.trim() === "") {
            e.preventDefault(); // остановить отправку формы
            hasError = true;
            lastNameError.classList.remove("hidden");
            lastNameInput.classList.remove("border-gray-300", "dark:border-gray-700", "focus:ring-blue-400");
            lastNameInput.classList.add("bg-red-50", "border-red-500", "text-red-900", "placeholder-red-700", "focus:ring-red-500", "focus:border-red-500");
            lastNameLabel.classList.remove("text-text-light", "dark:text-text-dark");
            lastNameLabel.classList.add("text-red-700", "dark:text-red-500");
        }

        //Проверка телефона
        if (phoneInput.value.trim() === "" || phoneInput.value.replace(/\D/g, "").length < 10) {
            e.preventDefault(); // остановить отправку формы
            phoneError.classList.remove("hidden");
            phoneInput.classList.remove("border-gray-300", "dark:border-gray-700", "focus:ring-blue-400");
            phoneInput.classList.add("bg-red-50", "border-red-500", "text-red-900", "placeholder-red-700", "focus:ring-red-500", "focus:border-red-500");
            phoneLabel.classList.remove("text-text-light", "dark:text-text-dark");
            phoneLabel.classList.add("text-red-700", "dark:text-red-500");
        }

        //Проверка пароля
        if (passwordInput.value.trim() === "" || passwordInput.value.length < 5) {
            e.preventDefault(); // остановить отправку формы
            passwordError.classList.remove("hidden");
            passwordInput.classList.remove("border-gray-300", "dark:border-gray-700", "focus:ring-blue-400");
            passwordInput.classList.add("bg-red-50", "border-red-500", "text-red-900", "placeholder-red-700", "focus:ring-red-500", "focus:border-red-500");
            passwordLabel.classList.remove("text-text-light", "dark:text-text-dark");
            passwordLabel.classList.add("text-red-700", "dark:text-red-500");
        }

        //Проверка подтверждения пароля
        if (passwordInput.value.trim() === "" || passwordInput.value !== confirmPasswordInput.value) {
            e.preventDefault(); // остановить отправку формы
            confirmPasswordError.classList.remove("hidden");
            confirmPasswordInput.classList.remove("border-gray-300", "dark:border-gray-700", "focus:ring-blue-400");
            confirmPasswordInput.classList.add("bg-red-50", "border-red-500", "text-red-900", "placeholder-red-700", "focus:ring-red-500", "focus:border-red-500");
            confirmPasswordLabel.classList.remove("text-text-light", "dark:text-text-dark");
            confirmPasswordLabel.classList.add("text-red-700", "dark:text-red-500");
        }


        if (hasError) e.preventDefault();
    });

    // Восстановление логина
    loginInput.addEventListener("input", function () {
        if (loginInput.value.trim() !== "") {
            loginError.classList.add("hidden");
            loginInput.classList.remove("bg-red-50", "border-red-500", "text-red-900", "placeholder-red-700", "focus:ring-red-500", "focus:border-red-500");
            loginInput.classList.add("border-gray-300", "dark:border-gray-700", "focus:ring-blue-400");
            loginLabel.classList.remove("text-red-700", "dark:text-red-500");
            loginLabel.classList.add("text-gray-900", "dark:text-white");
            loginIcon.classList.remove("text-red-500");
            loginIcon.classList.add("text-gray-500", "dark:text-gray-400");
        }
    });

    // Восстановление имени
    firstNameInput.addEventListener("input", function () {
        if (firstNameInput.value.trim() !== "") {
            firstNameError.classList.add("hidden");
            firstNameInput.classList.remove("bg-red-50", "border-red-500", "text-red-900", "placeholder-red-700", "focus:ring-red-500", "focus:border-red-500");
            firstNameInput.classList.add("border-gray-300", "dark:border-gray-700", "focus:ring-blue-400");
            firstNameLabel.classList.remove("text-red-700", "dark:text-red-500");
            firstNameLabel.classList.add("text-text-light", "dark:text-text-dark");
        }
    });
    // Восстановление фамилии
    lastNameInput.addEventListener("input", function () {
        if (lastNameInput.value.trim() !== "") {
            lastNameError.classList.add("hidden");
            lastNameInput.classList.remove("bg-red-50", "border-red-500", "text-red-900", "placeholder-red-700", "focus:ring-red-500", "focus:border-red-500");
            lastNameInput.classList.add("border-gray-300", "dark:border-gray-700", "focus:ring-blue-400");
            lastNameLabel.classList.remove("text-red-700", "dark:text-red-500");
            lastNameLabel.classList.add("text-text-light", "dark:text-text-dark");
        }
    });
    //Восстановление номера
    phoneInput.addEventListener("input", function () {
        if (phoneInput.value.trim() !== "") {
            phoneError.classList.add("hidden");
            phoneInput.classList.remove("bg-red-50", "border-red-500", "text-red-900", "placeholder-red-700", "focus:ring-red-500", "focus:border-red-500");
            phoneInput.classList.add("border-gray-300", "dark:border-gray-700", "focus:ring-blue-400");
            phoneLabel.classList.remove("text-red-700", "dark:text-red-500");
            phoneLabel.classList.add("text-text-light", "dark:text-text-dark");

        }
    });
    //Восстановление пароля
    passwordInput.addEventListener("input", function () {
        if (passwordInput.value.trim() !== "") {
            passwordError.classList.add("hidden");
            passwordInput.classList.remove("bg-red-50", "border-red-500", "text-red-900", "placeholder-red-700", "focus:ring-red-500", "focus:border-red-500");
            passwordInput.classList.add("border-gray-300", "dark:border-gray-700", "focus:ring-blue-400");
            passwordLabel.classList.remove("text-red-700", "dark:text-red-500");
            passwordLabel.classList.add("text-text-light", "dark:text-text-dark");

        }
    });
    //Восстановление подтверждения пароля
    confirmPasswordInput.addEventListener("input", function () {
        if (confirmPasswordInput.value.trim() !== "") {
            confirmPasswordError.classList.add("hidden");
            confirmPasswordInput.classList.remove("bg-red-50", "border-red-500", "text-red-900", "placeholder-red-700", "focus:ring-red-500", "focus:border-red-500");
            confirmPasswordInput.classList.add("border-gray-300", "dark:border-gray-700", "focus:ring-blue-400");
            confirmPasswordLabel.classList.remove("text-red-700", "dark:text-red-500");
            confirmPasswordLabel.classList.add("text-text-light", "dark:text-text-dark");

        }
    });

});

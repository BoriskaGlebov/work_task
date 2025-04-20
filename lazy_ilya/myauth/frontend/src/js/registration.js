import '../css/base.css'

document.addEventListener("DOMContentLoaded", function () {
    const loginInput = document.getElementById("email-address-icon");
    const loginError = document.getElementById("login-error-msg");
    const loginLabel = document.getElementById("login-label");
    const loginIcon = document.getElementById("login-icon");
    const form = document.getElementById("registration-form");

    form.addEventListener("submit", function (e) {
        if (loginInput.value.trim() === "") {
            e.preventDefault(); // остановить отправку

            // Показываем ошибку
            loginError.classList.remove("hidden");

            // Красный стиль
            loginInput.classList.remove("border-gray-300", "focus:border-blue-500", "focus:ring-blue-500");
            loginInput.classList.add("bg-red-50", "border-red-500", "text-red-900", "placeholder-red-700", "focus:ring-red-500", "focus:border-red-500");

            loginLabel.classList.remove("text-gray-900", "dark:text-white");
            loginLabel.classList.add("text-red-700", "dark:text-red-500");

            loginIcon.classList.remove("text-gray-500", "dark:text-gray-400");
            loginIcon.classList.add("text-red-500");
        }
    });

    loginInput.addEventListener("input", function () {
        if (loginInput.value.trim() !== "") {
            // Спрятать ошибку
            loginError.classList.add("hidden");

            // Вернуть нормальные стили
            loginInput.classList.remove("bg-red-50", "border-red-500", "text-red-900", "placeholder-red-700", "focus:ring-red-500", "focus:border-red-500");
            loginInput.classList.add("border-gray-300", "text-gray-900", "focus:ring-blue-500", "focus:border-blue-500");

            loginLabel.classList.remove("text-red-700", "dark:text-red-500");
            loginLabel.classList.add("text-gray-900", "dark:text-white");

            loginIcon.classList.remove("text-red-500");
            loginIcon.classList.add("text-gray-500", "dark:text-gray-400");
        }
    });
});

/**
 * @class Auth
 * @classdesc Класс, отвечающий за аутентификацию пользователя на странице входа.
 */
class Auth {
    /**
     * @constructor
     * Инициализирует класс Auth, находит форму логина и запускает процесс инициализации.
     */
    constructor() {
        /**
         * @property {HTMLFormElement} form - HTML-элемент формы логина.
         */
        this.form = document.getElementById('loginForm');
        this.init();
    }

    /**
     * @function init
     * @description Инициализирует функциональность аутентификации.
     * Подписывается на событие отправки формы и проверяет, авторизован ли пользователь.
     */
    init() {
        /**
         * Добавляет обработчик события 'submit' для формы логина.
         * @param {Event} e - Объект события.
         * @callback handleLogin
         */
        this.form.addEventListener('submit', (e) => this.handleLogin(e));

        /**
         * Если пользователь уже авторизован, перенаправляет его на главную страницу.
         */
        if (this.isLoggedIn()) {
            window.location.href = 'index.html';
        }
    }

    /**
     * @function handleLogin
     * @description Обрабатывает отправку формы логина.
     * Предотвращает отправку формы по умолчанию, получает логин и пароль,
     * проверяет их и, в случае успеха, устанавливает флаг авторизации и перенаправляет на главную страницу.
     * @param {Event} e - Объект события отправки формы.
     */
    handleLogin(e) {
        /**
         * Предотвращает стандартное поведение отправки формы.
         */
        e.preventDefault();

        /**
         * @property {string} username - Введенный пользователем логин.
         */
        const username = document.getElementById('username').value;
        /**
         * @property {string} password - Введенный пользователем пароль.
         */
        const password = document.getElementById('password').value;

        /**
         * Проверяет соответствие введенных данных заданным значениям.
         */
        if (username === 'admin' && password === '123') {
            /**
             * Устанавливает флаг авторизации в localStorage.
             */
            localStorage.setItem('isLoggedIn', 'true');
            /**
             * Перенаправляет пользователя на главную страницу.
             */
            window.location.href = 'index.html';
        } else {
            /**
             * Выводит сообщение об ошибке в случае неверных данных.
             */
            alert('Неверный логин или пароль');
        }
    }

    /**
     * @function isLoggedIn
     * @description Проверяет, авторизован ли пользователь.
     * Проверяет наличие флага авторизации в localStorage.
     * @returns {boolean} - True, если пользователь авторизован, иначе - False.
     */
    isLoggedIn() {
        /**
         * Получает значение флага авторизации из localStorage.
         * @returns {string | null}
         */
        return localStorage.getItem('isLoggedIn') === 'true';
    }
}

/**
 * Создает экземпляр класса Auth.
 */
const auth = new Auth();

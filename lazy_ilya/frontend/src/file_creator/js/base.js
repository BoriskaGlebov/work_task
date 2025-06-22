// Импортируем иконку для использования в проекте
import "../img/file_creator_eating.ico"
// Когда вся страница загружена, убираем индикатор загрузки и показываем контент
window.addEventListener('load', () => {
    // Получаем элемент загрузки
    const loader = document.getElementById('loader');
    if (!loader) return; // Если элемент не найден, выходим
    // После 2 секунд начнем плавное скрытие элемента
    setTimeout(() => {
        // Плавно меняем прозрачность на 0
        loader.style.opacity = '0';

        // После завершения анимации, полностью скрываем элемент
        setTimeout(() => {
            loader.style.display = 'none'; // Скрываем элемент
        }, 2000); // Задержка до полного исчезновения
    }, 100); // Время ожидания перед началом исчезновения 2 скекунды
});

// Переключение темы
// Получаем элементы на странице для кнопки и иконок, которые будут переключаться
const themeToggleBtn = document.getElementById('theme-toggle'); // Кнопка переключения темы
const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon'); // Иконка тёмной темы
const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon'); // Иконка светлой темы

// Проверяем, какая тема установлена в localStorage, или используем системные предпочтения
if (localStorage.getItem('color-theme') === 'dark' // Если в localStorage сохранена тёмная тема
    || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) { // Или если системное предпочтение — тёмная тема
    document.body.classList.add('dark'); // Добавляем класс 'dark' на body, чтобы применить тёмную тему
    themeToggleLightIcon.classList.remove('hidden'); // Показываем иконку для светлой темы
} else {
    document.body.classList.remove('dark'); // Убираем класс 'dark' с body, чтобы применить светлую тему
    themeToggleDarkIcon.classList.remove('hidden'); // Показываем иконку для тёмной темы
}

// Слушаем событие клика на кнопку переключения темы
themeToggleBtn.addEventListener('click', () => {
    // Переключаем видимость иконок
    themeToggleDarkIcon.classList.toggle('hidden'); // Скрываем или показываем иконку тёмной темы
    themeToggleLightIcon.classList.toggle('hidden'); // Скрываем или показываем иконку светлой темы

    // Переключаем тему на основе текущего состояния
    if (localStorage.getItem('color-theme') === 'dark') { // Если текущая тема — тёмная
        document.body.classList.remove('dark'); // Убираем класс 'dark' для светлой темы
        localStorage.setItem('color-theme', 'light'); // Сохраняем выбор светлой темы в localStorage
    } else {
        document.body.classList.add('dark'); // Добавляем класс 'dark' для тёмной темы
        localStorage.setItem('color-theme', 'dark'); // Сохраняем выбор тёмной темы в localStorage
    }
});

// Бургер-меню
// Получаем элементы на странице для кнопки бургер-меню и самого меню
const burgerMenuBtn = document.getElementById('burger-menu'); // Кнопка для открытия/закрытия бургер-меню
const navMenu = document.getElementById('nav-menu'); // Элемент меню, которое будет скрываться и показываться

// Слушаем событие клика на кнопку бургер-меню
burgerMenuBtn.addEventListener('click', () => {
    // Если меню скрыто (имеет класс 'max-h-0'), то раскрываем его
    if (navMenu.classList.contains('max-h-0')) {
        navMenu.classList.remove('max-h-0'); // Убираем класс 'max-h-0', чтобы показать меню
        navMenu.classList.add('max-h-80', 'border-t-2', 'border-t-accent'); // Добавляем класс 'max-h-60', чтобы дать меню максимальную высоту
        burgerMenuBtn.classList.add('open')
    } else {
        navMenu.classList.remove('max-h-80', 'border-t-2', 'border-t-accent'); // Убираем класс 'max-h-60', чтобы скрыть меню
        navMenu.classList.add('max-h-0'); // Добавляем класс 'max-h-0', чтобы меню было скрыто
        burgerMenuBtn.classList.remove('open')
    }
});

// --- Автоматическая перезагрузка страницы при бездействии (через 30 минут) ---
const AUTO_RELOAD_TIME = 30 * 60 * 1000; // 30 минут в миллисекундах

function updateActivity() {
    localStorage.setItem('lastActivity', Date.now().toString());
}

function checkInactivity() {
    const lastActivity = parseInt(localStorage.getItem('lastActivity'), 10) || Date.now();
    const now = Date.now();

    if (now - lastActivity > AUTO_RELOAD_TIME) {
        location.reload(); // Перезагрузка страницы
    }
}

// Обновляем активность при любом действии пользователя
['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    window.addEventListener(event, updateActivity);
});

updateActivity(); // Устанавливаем время активности при загрузке страницы

setInterval(checkInactivity, 1000); // Проверяем бездействие каждые 1 секунд


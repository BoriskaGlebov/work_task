

/**
 * Получает DOM-элемент по ID.
 * @param {string} id - Идентификатор элемента.
 * @returns {HTMLElement|null} DOM-элемент или null, если не найден.
 */
function getEl(id) {
    return document.getElementById(id);
}

// Элементы управления темой
const themeToggleBtn = getEl('theme-toggle');
const themeToggleDarkIcon = getEl('theme-toggle-dark-icon');
const themeToggleLightIcon = getEl('theme-toggle-light-icon');

/**
 * Инициализирует тему при загрузке страницы:
 * если сохранена "dark" — включается тёмная тема,
 * иначе используется светлая или системная.
 */
function initTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('color-theme');

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark');
        themeToggleLightIcon?.classList.remove('hidden');
    } else {
        document.body.classList.remove('dark');
        themeToggleDarkIcon?.classList.remove('hidden');
    }
}

/**
 * Обработчик переключения темы: переключает классы body и иконки,
 * сохраняет выбранную тему в localStorage.
 */
function toggleTheme() {
    themeToggleDarkIcon?.classList.toggle('hidden');
    themeToggleLightIcon?.classList.toggle('hidden');

    const currentTheme = localStorage.getItem('color-theme');

    if (currentTheme === 'dark') {
        document.body.classList.remove('dark');
        localStorage.setItem('color-theme', 'light');
    } else {
        document.body.classList.add('dark');
        localStorage.setItem('color-theme', 'dark');
    }
}

// Проверка на наличие всех нужных элементов перед инициализацией
if (themeToggleBtn && themeToggleDarkIcon && themeToggleLightIcon) {
    initTheme();
    themeToggleBtn.addEventListener('click', toggleTheme);
}

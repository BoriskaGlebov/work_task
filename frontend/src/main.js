    // Переключение темы
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

    if (localStorage.getItem('color-theme') === 'dark'
        || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark');
        themeToggleLightIcon.classList.remove('hidden');
    } else {
        document.body.classList.remove('dark');
        themeToggleDarkIcon.classList.remove('hidden');
    }

    themeToggleBtn.addEventListener('click', () => {
        themeToggleDarkIcon.classList.toggle('hidden');
        themeToggleLightIcon.classList.toggle('hidden');

        if (localStorage.getItem('color-theme') === 'dark') {
            document.body.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        } else {
            document.body.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        }
    });

    // Бургер-меню
    const burgerMenuBtn = document.getElementById('burger-menu');
    const navMenu = document.getElementById('nav-menu');

    burgerMenuBtn.addEventListener('click', () => {
        if (navMenu.classList.contains('max-h-0')) {
            navMenu.classList.remove('max-h-0');
            navMenu.classList.add('max-h-60');
        } else {
            navMenu.classList.remove('max-h-60');
            navMenu.classList.add('max-h-0');
        }
    });

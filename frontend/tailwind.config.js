// tailwind.config.js
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./node_modules/flowbite/**/*.js"  // Включите Flowbite
    ],
    safelist: [
        'bg-body-light',
        'dark:bg-body-dark'
    ],
    theme: {
        extend: {
            // colors: {
            //     "body-light": "oklch(0.967 0.003 264.542)",
            //     "body-dark": "oklch(0.13 0.028 261.692)",
            //     'theme-light': 'oklch(0.809 0.105 251.813)',
            //     'theme-dark': 'oklch(0.424 0.199 265.638)',
            //     // 'theme-accent': '#3B82F6',
            //     // 'theme-hover': '#60A5FA',
            // },
        },
        screens: {
            sm: '640px',
            md: '768px',
            lg: '1024px',   // <- вот это важно!
            xl: '1280px',
            '2xl': '1536px',
        },
    },
    plugins: [
        require('flowbite/plugin'),  // Подключите Flowbite как плагин
    ],
}

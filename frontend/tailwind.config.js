      // tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js"  // Включите Flowbite
  ],
  theme: {
    extend: {},
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

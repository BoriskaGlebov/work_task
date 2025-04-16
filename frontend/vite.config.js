import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  root: './',  // если index.html в корне
  plugins: [
    tailwindcss(),
  ],
})
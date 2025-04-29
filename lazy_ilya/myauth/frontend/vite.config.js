import {defineConfig} from 'vite'
import {resolve} from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    root: './', // только src
    plugins: [
        tailwindcss(),
    ],
    build: {
        outDir: '../static', // ВАЖНО: сборка пойдет сюда
        emptyOutDir: true,
        rollupOptions: {
            input: {
                base: resolve(__dirname, 'src/js/base.js'), // это твой входной HTML-файл
                registration: resolve(__dirname, 'src/js/registration.js'),
                login: resolve(__dirname, 'src/js/login.js'),
            },
            output: {
                entryFileNames: 'myauth/js/[name].js',
                chunkFileNames: 'myauth/js/[name].js',
                assetFileNames: ({name}) => {
                    if (/\.(gif|jpe?g|png|svg|ico)$/.test(name ?? '')) {
                        return 'myauth/img/[name][extname]';
                    }
                    if (/\.(woff2?|ttf|otf|eot)$/.test(name ?? '')) {
                        return 'myauth/fonts/[name][extname]';
                    }
                    if (/\.css$/.test(name ?? '')) {
                        return 'myauth/css/[name][extname]';
                    }
                    return 'myauth/[name][extname]';
                }
            }
        },
        target: 'modules', // или 'modules' для поддержки новых модулей
        // outDir: 'dist',      // куда собирать билд
        // assetsDir: 'assets', // куда положит JS, CSS и прочее
    },
})

import {defineConfig} from 'vite'
import {resolve} from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    root: './', // корень проекта (где лежит base.html)
    plugins: [
        tailwindcss(),
    ],
    build: {
        rollupOptions: {
            input: {
                base: resolve(__dirname, 'base.html'), // это твой входной HTML-файл
                registration: resolve(__dirname, 'registration.html'),
                login: resolve(__dirname, 'login.html'),
            },
            output: {
                entryFileNames: 'myauth/js/[name].js',
                chunkFileNames: 'myauth/js/[name].js',
                assetFileNames: ({name}) => {
                    if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
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
        // outDir: 'dist',      // куда собирать билд
        // assetsDir: 'assets', // куда положит JS, CSS и прочее
    },
})

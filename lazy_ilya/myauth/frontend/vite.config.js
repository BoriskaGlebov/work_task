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
                entryFileNames: 'assets/js/[name]-[hash].js',
                chunkFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: ({name}) => {
                    if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
                        return 'assets/img/[name]-[hash][extname]';
                    }
                    if (/\.(woff2?|ttf|otf|eot)$/.test(name ?? '')) {
                        return 'assets/fonts/[name]-[hash][extname]';
                    }
                    if (/\.css$/.test(name ?? '')) {
                        return 'assets/css/[name]-[hash][extname]';
                    }
                    return 'assets/[name]-[hash][extname]';
                }
            }
        },
        // outDir: 'dist',      // куда собирать билд
        // assetsDir: 'assets', // куда положит JS, CSS и прочее
    },
})

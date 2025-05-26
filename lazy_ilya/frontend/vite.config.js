import {defineConfig} from 'vite';
import {resolve} from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    root: './',
    plugins: [tailwindcss()],
    build: {
        emptyOutDir: true,
        outDir: '../collected_static',
        target: 'modules',
        rollupOptions: {
            input: {
                'myauth/js/base': resolve(__dirname, 'src/myauth/js/base.js'),
                'myauth/js/login': resolve(__dirname, 'src/myauth/js/login.js'),
                'myauth/js/registration': resolve(__dirname, 'src/myauth/js/registration.js'),
                'myauth/js/reset_password': resolve(__dirname, 'src/myauth/js/reset_password.js'),

                'file_creator/js/base': resolve(__dirname, 'src/file_creator/js/base.js'),
                'file_creator/js/main': resolve(__dirname, 'src/file_creator/js/main.js'),

                'cities/js/main': resolve(__dirname, 'src/cities/js/main.js'),
                'cities/js/update-form': resolve(__dirname, 'src/cities/js/update-form.js'),

                'statistics_app/js/main': resolve(__dirname, 'src/statistics_app/js/main.js'),
            },
            output: {
                manualChunks(id) {
                    if (id.includes('src/cities/js/utils.js')) {
                        return 'cities/js/utils';
                    }

                    if (id.includes('src/cities/js/toggleAccent.js')) {
                        return 'cities/js/toggleAccent';
                    }
                },
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: ({name = ''}) => {
                    if (/\.css$/.test(name)) return 'static/css/[name][extname]';
                    if (/\.(woff2?|ttf|otf|eot)$/.test(name)) return 'static/fonts/[name][extname]';
                    if (/\.(png|jpe?g|gif|svg|ico)$/.test(name)) {
                        if (name.startsWith('file_creator_')) {
                            return 'file_creator/img/[name][extname]';
                        }
                        if (name.includes('myauth')) {
                            return 'myauth/img/[name][extname]';
                        }
                        if (name.includes('cities')) {
                            return 'cities/img/[name][extname]';
                        }
                        return 'static/img/[name][extname]';
                    }
                    return 'assets/[name][extname]';
                },
            },
        },
    },
});

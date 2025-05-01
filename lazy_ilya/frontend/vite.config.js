import { defineConfig } from 'vite';
import { resolve } from 'path';
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
                'file_creator/js/uploader': resolve(__dirname, 'src/file_creator/js/uploader.js'),
            },
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: ({ name = '' }) => {
                    if (/\.css$/.test(name)) return 'static/css/[name][extname]';
                    if (/\.(woff2?|ttf|otf|eot)$/.test(name)) return 'static/fonts/[name][extname]';
                    if (/\.(png|jpe?g|gif|svg|ico)$/.test(name)) return 'static/img/[name][extname]';
                    return 'assets/[name][extname]';
                },
            },
        },
    },
});

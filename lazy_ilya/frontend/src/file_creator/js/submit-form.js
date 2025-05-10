// submit-form.js

/**
 * Асинхронная отправка формы через fetch
 * @returns {Promise<void>}
 */
export default async function submitFormAsync(form, formDiv, clearFileList, formDiv2) {
    const spinner = document.getElementById('upload-spinner');
    const spinner2 = document.getElementById('upload-spinner2');

    try {
        const formData = new FormData(form);
        spinner.classList.remove('hidden');

        await new Promise(resolve => setTimeout(resolve, 2000)); // Пауза для демонстрации

        const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Ошибка: ${response.status}`);
        }

        console.log('Ответ от сервера:', data);

        form.reset();
        clearFileList();

        formDiv.classList.remove('show');
        setTimeout(() => {
            formDiv.classList.add('hidden');
        }, 500);

        const step1 = document.querySelector('.step[data-step="1"]');
        const step2 = document.querySelector('.step[data-step="2"]');

        if (step1) {
            step1.classList.remove('li-style-active');
            step1.classList.add('li-style-complete', 'pointer-events-none');
            const span = step1.querySelector('span');
            span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">\n' +
                '  <path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />\n' +
                '</svg>\n';
        }
        if (step2) {
            // step2.classList.remove('li-style');
            step2.classList.add('li-style-active');
            if (Array.isArray(data.new_files)) {
                const ul = document.createElement('ul');
                ul.className = 'list-disc pl-5 mt-2 text-md text-text dark:text-text-dark font-medium';
                data.new_files.forEach(file => {
                    const li = document.createElement('li');
                    li.textContent = file; // или file.name, если это объект
                    ul.appendChild(li);
                });

                formDiv2.appendChild(ul);
            }
            setTimeout(() => {
                formDiv2.classList.remove('hidden');
                setTimeout(() => {
                    formDiv2.classList.add('show');
                }, 10);
            }, 500);

            spinner2.classList.remove('hidden');
            setTimeout(() => {
                spinner2.classList.add('hidden');
                formDiv2.classList.remove('show');
                setTimeout(() => {
                    formDiv2.classList.add('hidden');
                }, 2000);
                step2.classList.remove('li-style-active');
                step2.classList.add('li-style-complete', 'pointer-events-none');
                const span = step2.querySelector('span');
                span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">\n' +
                    '  <path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />\n' +
                    '</svg>\n';
            }, 5000);

        }

    } catch (error) {
        const errorBlock = document.getElementById('server-error');
        const errorText = errorBlock.querySelector('p');
        errorBlock.classList.remove('hidden', 'animate-popup-reverse');
        errorBlock.classList.add("flex", "animate-popup");
        errorText.textContent = error.message || 'Произошла ошибка при отправке данных';

        console.error('Ошибка запроса:', error);

        setTimeout(() => {
            errorBlock.classList.remove("animate-popup");
            errorBlock.classList.add("animate-popup-reverse");

            setTimeout(() => {
                errorBlock.classList.add("hidden");
                errorBlock.classList.remove("flex", "animate-popup-reverse");
            }, 1000);
        }, 4000);
    } finally {
        spinner.classList.add('hidden');
    }
}

// submit-form.js

/**
 * Асинхронная отправка формы через fetch
 * @returns {Promise<void>}
 */
export default async function submitFormAsync(form, formDiv, clearFileList) {
    const spinner = document.getElementById('upload-spinner');
    const spinner2 = document.getElementById('upload-spinner2');
    const formDiv2 = document.getElementById('step2-form');
    const formDiv3 = document.getElementById('step3-form');
    const leftUlForm3 = document.getElementById('file-names-list');

    try {
        const formData = new FormData(form);
        spinner.classList.remove('hidden');

        await new Promise(resolve => setTimeout(resolve, 1000));

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
        setTimeout(() => formDiv.classList.add('hidden'), 500);

        await runStep1(data);
    } catch (error) {
        showError(error);
    } finally {
        spinner.classList.add('hidden');
    }

    function showError(error) {
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
    }

    async function runStep1(data) {
        const step1 = document.querySelector('.step[data-step="1"]');
        const step2 = document.querySelector('.step[data-step="2"]');

        step1.classList.remove('li-style-active');
        step1.classList.add('li-style-complete', 'pointer-events-none');
        step1.querySelector('span').innerHTML = getCheckIcon();

        step2.classList.add('li-style-active');

        if (Array.isArray(data.new_files)) {
            const ul = document.createElement('ul');
            ul.className = 'list-disc pl-5 mt-2 text-md text-text dark:text-text-dark font-medium';
            data.new_files.forEach(file => {
                const li = document.createElement('li');
                li.textContent = file;
                ul.appendChild(li);
            });
            formDiv2.appendChild(ul);
        }

        await new Promise(r => setTimeout(r, 500));
        formDiv2.classList.remove('hidden');
        await new Promise(r => setTimeout(r, 100));
        formDiv2.classList.add('show');

        spinner2.classList.remove('hidden');
        await new Promise(r => setTimeout(r, 3000));
        spinner2.classList.add('hidden');

        formDiv2.classList.remove('show');
        await new Promise(r => setTimeout(r, 1000));
        formDiv2.classList.add('hidden');

        step2.classList.remove('li-style-active');
        step2.classList.add('li-style-complete', 'pointer-events-none');
        step2.querySelector('span').innerHTML = getCheckIcon();

        await runStep2(data);
    }

    async function runStep2(data) {
        const step3 = document.querySelector('.step[data-step="3"]');
        step3.classList.add('li-style-active');

        if (Array.isArray(data.new_files)) {
            data.new_files.forEach(file => {
                const li = document.createElement('li');
                li.textContent = file;
                leftUlForm3.appendChild(li);
            });
        }

        await new Promise(r => setTimeout(r, 500));
        formDiv3.classList.remove('hidden');
        await new Promise(r => setTimeout(r, 100));
        formDiv3.classList.add('show');

        await new Promise(r => setTimeout(r, 3000));
        // formDiv3.classList.remove('show');
        // await new Promise(r => setTimeout(r, 1000));
        // formDiv3.classList.add('hidden');

        step3.classList.remove('li-style-active');
        step3.classList.add('li-style-complete', 'pointer-events-none');
        step3.querySelector('span').innerHTML = getCheckIcon();
    }

    function getCheckIcon() {
        return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">\n' +
            '  <path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />\n' +
            '</svg>\n';
    }
}

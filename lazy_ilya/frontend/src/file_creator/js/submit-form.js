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
    const fileContentTextarea = document.getElementById('file-content');

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

        const fileContentMap = new Map();
        let firstFile = null;
        let firstLi = null;
        let currentFileName = null;
        if (Array.isArray(data.new_files) && Array.isArray(data.content)) {
            data.new_files.forEach((file, i) => {
                fileContentMap.set(file, data.content[i]);
            });


            data.new_files.forEach((file, i) => {
                const li = document.createElement('li');
                li.classList.add('file-item', 'group');

                const fileSpan = document.createElement('span');
                fileSpan.textContent = file;
                fileSpan.classList.add('file-name', 'cursor-pointer', 'group-hover:text-[--color-accent]');

                // Обработчик клика на название файла
                li.addEventListener('click', () => {
                    const content = fileContentMap.get(file);

                    fileContentTextarea.value = content;
                    fileContentTextarea.disabled = false;
                    fileContentTextarea.style.height = "auto";
                    fileContentTextarea.style.height = fileContentTextarea.scrollHeight + "px";

                    const saveButton = document.getElementById('save-edited-content');
                    saveButton.disabled = false;

                    // Убираем выделение со всех элементов
                    document.querySelectorAll('.file-item').forEach(el => {
                        el.classList.remove('file-item-selected');
                    });

                    // Добавляем на текущий
                    li.classList.add('file-item-selected');
                    currentFileName = file;
                });


                const deleteBtn = document.createElement('button');
                deleteBtn.title = 'Удалить';
                deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"\n' +
                    '                                                         stroke="currentColor" class="size-4">\n' +
                    '                                                        <path stroke-linecap="round" stroke-linejoin="round"\n' +
                    '                                                              d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path>\n' +
                    '                                                    </svg>\n' +
                    '                                                    <span>Удалить</span>'; // SVG и текст как у тебя
                deleteBtn.classList.add('opacity-0', 'btn-cancel', '!w-3/10', 'flex', 'group-hover:opacity-100', 'justify-center', 'items-center', 'gap-1', '!py-1');
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    li.remove();
                    fileContentMap.delete(file);

                    const index = data.new_files.indexOf(file);
                    if (index !== -1) {
                        data.new_files.splice(index, 1);
                        data.content.splice(index, 1);
                    }
                });

                li.appendChild(fileSpan);
                li.appendChild(deleteBtn);
                leftUlForm3.appendChild(li);

                // Сохраняем имя первого файла
                if (i === 0) {
                    firstFile = file;
                    firstLi = li;
                    currentFileName = file;
                }
            });


        }


        // Задержка для плавности перехода
        await new Promise(r => setTimeout(r, 500));
        formDiv3.classList.remove('hidden');
        await new Promise(r => setTimeout(r, 100));
        formDiv3.classList.add('show');
        // Если есть хотя бы один файл — сразу показываем его содержимое
        if (firstFile) {
            const firstContent = fileContentMap.get(firstFile);
            fileContentTextarea.value = firstContent;
            fileContentTextarea.disabled = false;
            fileContentTextarea.style.height = "auto";
            fileContentTextarea.style.height = fileContentTextarea.scrollHeight + "px";

            const saveButton = document.getElementById('save-edited-content');
            saveButton.disabled = false;

            // Выделить первый элемент
            document.querySelectorAll('.file-item').forEach(el => {
                el.classList.remove('file-item-selected');
            });
            firstLi.classList.add('file-item-selected');
        }
        fileContentTextarea.addEventListener('input', () => {
            if (currentFileName) {
                const newText = fileContentTextarea.value;
                fileContentMap.set(currentFileName, newText);
                // Синхронизировать с массивом data.content
                const index = data.new_files.indexOf(currentFileName);
                if (index !== -1) {
                    data.content[index] = newText;
                }
                console.log(data)
            }
        });
        await new Promise(r => setTimeout(r, 3000));

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

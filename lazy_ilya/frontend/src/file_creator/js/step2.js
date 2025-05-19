/**
 * Отображает список загруженных файлов и реализует интерфейс редактирования и удаления файлов.
 *
 * Основной функционал:
 * - Список файлов отображается в виде элементов <li>.
 * - При клике на файл отображается его содержимое в текстовом поле.
 * - Возможность редактировать содержимое файла с немедленной синхронизацией с объектом `data`.
 * - Поддержка удаления файлов с подтверждением.
 * - Автоматическая активация кнопок "Сохранить".
 * - Отображение и анимация формы редактирования.
 *
 * @param {Object} data - Объект с информацией о загруженных файлах.
 * @param {string[]} data.new_files - Список имён файлов.
 * @param {string[]} data.content - Содержимое файлов в том же порядке, что и `new_files`.
 * @param {HTMLElement} step3 - DOM-элемент шага 3, которому добавляется активный стиль.
 * @param {HTMLElement} formDiv3 - DOM-элемент блока формы редактирования файлов.
 *
 * @returns {Promise<void>} - Промис, завершающийся после инициализации интерфейса.
 *
 * Побочные эффекты:
 * - Изменяет DOM (создаёт элементы, добавляет обработчики событий).
 * - Модифицирует `data.new_files` и `data.content` при редактировании и удалении.
 * - Анимирует показ `formDiv3`.
 * - Устанавливает активный файл для редактирования.
 * - Управляет состоянием кнопок "Сохранить" и "Сохранить всё".
 *
 * DOM-элементы, с которыми работает функция (должны быть заранее созданы в HTML):
 * - `#save-edited-content` — кнопка "Сохранить файл".
 * - `#save-content` — кнопка "Сохранить всё".
 * - `#file-content` — textarea для редактирования файла.
 * - `#file-names-list` — список файлов.
 * - `#server-info2` — модальное окно подтверждения удаления.
 * - `#btn-div2` — контейнер для кнопок подтверждения/отмены удаления.
 */
export async function runStep2(data, step3, formDiv3) {
    const saveButton = document.getElementById('save-edited-content');
    const saveAllButton = document.getElementById('save-content');
    const divBtn2 = document.getElementById('btn-div2');
    const fileContentTextarea = document.getElementById('file-content');
    const leftUlForm3 = document.getElementById('file-names-list');
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
            li.setAttribute('tabindex', '0');
            li.classList.add('focus:outline-none', 'focus:ring-2', 'focus:ring-[--color-accent]');
            li.classList.add('file-item', 'group',
                'group-focus:outline-none', 'group-focus:ring-2',
                'group-focus:ring-[--color-accent]');

            const fileSpan = document.createElement('span');
            fileSpan.textContent = file;

            fileSpan.classList.add('file-name', 'cursor-pointer', 'group-hover:text-[--color-accent]');
            // fileSpan.classList.add();
            li.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    li.click();
                }
            });

            li.addEventListener('click', () => {
                window.scrollTo({top: 0, behavior: 'smooth'});
                fileContentTextarea.value = fileContentMap.get(file);
                fileContentTextarea.disabled = false;
                fileContentTextarea.style.height = "auto";
                fileContentTextarea.style.height = fileContentTextarea.scrollHeight + "px";

                saveButton.disabled = false;
                saveAllButton.disabled = false;

                document.querySelectorAll('.file-item').forEach(el => el.classList.remove('file-item-selected'));
                li.classList.add('file-item-selected');
                currentFileName = file;
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.title = 'Удалить';
            deleteBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                     stroke="currentColor" class="shrink-0 inline size-4 md:size-5 me-1">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
                Удалить`;
            deleteBtn.classList.add('opacity-0', 'btn-delete', '!w-4/10', 'flex', 'group-hover:opacity-100', 'justify-center', 'items-center', '!py-1');

            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.scrollTo({top: 0, behavior: 'smooth'});

                const serverInfo = document.getElementById('server-info2');
                const btnDiv = document.getElementById('btn-div');
                serverInfo.classList.remove('hidden');
                serverInfo.classList.add('flex', 'animate-popup');

                serverInfo.querySelector('h3').textContent = `Удалить файл "${file}"?`;
                serverInfo.querySelector('p').textContent = `Это действие нельзя отменить.`;

                const oldConfirm = document.getElementById('confirm-delete');
                if (oldConfirm) oldConfirm.remove();
                const oldCancel = document.getElementById('cancel-delete');
                if (oldCancel) oldCancel.remove();

                const confirmBtn = document.createElement('button');
                confirmBtn.id = 'confirm-delete';
                confirmBtn.textContent = 'Да, Нах!';
                confirmBtn.classList.add('btn-submit', '!p-1', '!font-medium');

                const cancelBtn = document.createElement('button');
                cancelBtn.id = 'cancel-delete';
                cancelBtn.textContent = 'Передумал';
                cancelBtn.classList.add('btn-cancel', '!p-1', '!font-medium');

                divBtn2.appendChild(confirmBtn);
                divBtn2.appendChild(cancelBtn);

                confirmBtn.addEventListener('click', () => {
                    const index = data.new_files.indexOf(file);
                    if (index !== -1) {
                        data.new_files.splice(index, 1);
                        data.content.splice(index, 1);
                    }
                    fileContentMap.delete(file);
                    li.remove();

                    if (currentFileName === file) {
                        const fileItems = document.querySelectorAll('.file-item');
                        if (fileItems.length > 0) {
                            const newLi = fileItems[Math.min(index, fileItems.length - 1)];
                            const newFileName = newLi.querySelector('.file-name').textContent;

                            currentFileName = newFileName;
                            fileContentTextarea.value = fileContentMap.get(newFileName) || '';
                            fileContentTextarea.disabled = false;
                            fileContentTextarea.style.height = "auto";
                            fileContentTextarea.style.height = fileContentTextarea.scrollHeight + "px";

                            document.querySelectorAll('.file-item').forEach(el => el.classList.remove('file-item-selected'));
                            newLi.classList.add('file-item-selected');
                        } else {
                            currentFileName = null;
                            fileContentTextarea.value = '';
                            fileContentTextarea.disabled = true;
                            fileContentTextarea.style.height = "auto";
                            fileContentTextarea.style.height = "2.5rem";
                            saveAllButton.disabled = true;
                            saveButton.disabled = true;
                        }
                    }

                    serverInfo.classList.remove('animate-popup');
                    serverInfo.classList.add('animate-popup-reverse');
                    setTimeout(() => {
                        serverInfo.classList.add('hidden');
                        serverInfo.classList.remove('flex', 'animate-popup-reverse');
                        serverInfo.querySelector('h3').textContent = '';
                        serverInfo.querySelector('p').textContent = '';
                        btnDiv.innerHTML = '';
                    }, 500);
                });

                cancelBtn.addEventListener('click', () => {
                    // serverInfo.classList.add('hidden');
                    // btnDiv.innerHTML = '';
                    serverInfo.classList.remove('animate-popup');
                    serverInfo.classList.add('animate-popup-reverse');
                    setTimeout(() => {
                        serverInfo.classList.add('hidden');
                        serverInfo.classList.remove('flex', 'animate-popup-reverse');
                        serverInfo.querySelector('h3').textContent = '';
                        serverInfo.querySelector('p').textContent = '';
                        btnDiv.innerHTML = '';
                    }, 500);

                });
            });
            li.appendChild(fileSpan);
            li.appendChild(deleteBtn);
            leftUlForm3.appendChild(li);

            if (i === 0) {
                firstFile = file;
                firstLi = li;
                currentFileName = file;
            }
        });
    }

    await new Promise(r => setTimeout(r, 500));
    formDiv3.classList.remove('hidden');
    await new Promise(r => setTimeout(r, 100));
    formDiv3.classList.add('show');

    if (firstFile) {
        fileContentTextarea.value = fileContentMap.get(firstFile);
        fileContentTextarea.disabled = false;
        fileContentTextarea.style.height = "auto";
        fileContentTextarea.style.height = fileContentTextarea.scrollHeight + "px";

        const saveButton = document.getElementById('save-edited-content');
        saveButton.disabled = false;
        saveAllButton.disabled = false;

        document.querySelectorAll('.file-item').forEach(el => el.classList.remove('file-item-selected'));
        firstLi.classList.add('file-item-selected');
    }

    fileContentTextarea.addEventListener('input', () => {
        if (currentFileName) {
            // Сначала сбрасываем высоту, чтобы scrollHeight был точным
            fileContentTextarea.style.height = 'auto';
            // Затем устанавливаем новую высоту по содержимому
            fileContentTextarea.style.height = fileContentTextarea.scrollHeight + 'px';

            const newText = fileContentTextarea.value;
            fileContentMap.set(currentFileName, newText);
            const index = data.new_files.indexOf(currentFileName);
            if (index !== -1) {
                data.content[index] = newText;
            }
            console.log(data);
        }
    });


    await new Promise(r => setTimeout(r, 3000));
}

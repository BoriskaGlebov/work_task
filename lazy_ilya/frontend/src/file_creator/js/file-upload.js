// file-upload.js

/**
 * Настраивает загрузку файлов с отображением списка, удалением и подтверждением удаления.
 * Подходит для простых форм с input[type="file"] и кастомным отображением.
 *
 * Элементы DOM:
 * - #files: input с типом "file"
 * - #file-list: ul/li контейнер для списка файлов
 * - #server-info: блок с сообщением и кнопками подтверждения
 * - #btn-div: контейнер для кнопок подтверждения/отмены
 *
 * @returns {Object} clearFileList - функция очистки всех выбранных файлов
 */
export default function setupFileUpload() {
    const fileInput = document.getElementById('files');
    const fileList = document.getElementById('file-list');
    const serverInfo = document.getElementById('server-info');
    const divBtn = document.getElementById('btn-div');

    /** @type {File[]} */
    let selectedFiles = [];

    // Обновляем список файлов при выборе
    fileInput.addEventListener('change', () => {
        selectedFiles = Array.from(fileInput.files);
        renderFileList();
    });

    /**
     * Отрисовывает список выбранных файлов и добавляет кнопки удаления.
     */
    function renderFileList() {
        fileList.innerHTML = '';

        selectedFiles.forEach((file) => {
            const li = document.createElement('li');
            li.classList.add('flex', 'justify-between', 'items-center', 'gap-2', 'mb-1');

            const fileInfo = document.createElement('span');
            fileInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;

            const removeBtn = createDeleteButton();
            removeBtn.addEventListener('click', () => {
                showDeleteConfirmation(file);
            });

            li.appendChild(fileInfo);
            li.appendChild(removeBtn);
            fileList.appendChild(li);
        });

        updateInputFiles();
    }

    /**
     * Обновляет input.files вручную, основываясь на selectedFiles.
     */
    function updateInputFiles() {
        const dataTransfer = new DataTransfer();
        selectedFiles.forEach(file => dataTransfer.items.add(file));
        fileInput.files = dataTransfer.files;
    }

    /**
     * Создаёт кнопку удаления с иконкой.
     * @returns {HTMLButtonElement}
     */
    function createDeleteButton() {
        const button = document.createElement('button');
        button.type = 'button';
        button.innerHTML = '<span>Удалить</span>' +
            '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">\n' +
            '  <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />\n' +
            '</svg>\n';
        button.classList.add('btn-cancel', '!w-2/10', 'flex', 'justify-center', 'items-center', 'gap-1', '!py-1');
        return button;
    }

    /**
     * Показывает модальное окно для подтверждения удаления файла.
     * @param {File} fileToDelete - файл, который пользователь хочет удалить
     */
    function showDeleteConfirmation(fileToDelete) {
        serverInfo.classList.remove('hidden');
        serverInfo.classList.add('flex', 'animate-popup');
        serverInfo.querySelector('h3').textContent = 'Подтверждение удаления';
        serverInfo.querySelector('p').textContent = `Вы уверены, что хотите удалить файл "${fileToDelete.name}"?`;

        divBtn.innerHTML = ''; // Удаляем предыдущие кнопки, если есть

        const confirmBtn = document.createElement('button');
        confirmBtn.id = 'confirm-delete';
        confirmBtn.textContent = 'Да, Нах!';
        confirmBtn.classList.add('btn-submit', '!w-4/12', '!p-1', '!font-medium');

        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancel-delete';
        cancelBtn.textContent = 'Передумал';
        cancelBtn.classList.add('btn-cancel', '!w-4/12', '!p-1', '!font-medium');

        divBtn.appendChild(confirmBtn);
        divBtn.appendChild(cancelBtn);

        confirmBtn.addEventListener('click', () => {
            const index = selectedFiles.indexOf(fileToDelete);
            if (index !== -1) {
                selectedFiles.splice(index, 1);
                renderFileList();
            }
            hideServerInfo();
        });

        cancelBtn.addEventListener('click', hideServerInfo);
    }

    /**
     * Скрывает блок server-info и очищает его содержимое и кнопки.
     */
    function hideServerInfo() {
        serverInfo.classList.add('hidden');
        serverInfo.classList.remove('animate-popup');
        serverInfo.querySelector('h3').textContent = '';
        serverInfo.querySelector('p').textContent = '';
        divBtn.innerHTML = '';
    }

    /**
     * Полностью очищает выбранные файлы и сбрасывает input.
     */
    function clearFileList() {
        selectedFiles = [];
        fileList.innerHTML = '';
        fileInput.value = '';
    }

    return {clearFileList};
}

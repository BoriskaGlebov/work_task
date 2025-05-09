// file-upload.js
/**
 * Функция для настройки загрузки файлов.
 * Управляет отображением списка выбранных файлов, их удалением
 * и обновлением состояния input для файлов.
 */
export default function setupFileUpload() {
    // Получаем элементы DOM: input для файлов и контейнер для списка файлов
    const fileInput = document.getElementById('files');
    const fileList = document.getElementById('file-list');
    // Массив для хранения выбранных файлов
    let selectedFiles = [];

    // При изменении файлов обновляем список
    fileInput.addEventListener('change', () => {
        selectedFiles = Array.from(fileInput.files);
        renderFileList();
    });

    /**
     * Функция для отрисовки списка выбранных файлов.
     * Очищает текущий список и добавляет новые файлы с кнопками удаления.
     */
    function renderFileList() {
        fileList.innerHTML = ''; // Очищаем список
        // Проходим по всем выбранным файлам и добавляем их в список
        selectedFiles.forEach((file, index) => {
            // Создаём новый элемент списка
            const li = document.createElement('li');
            li.classList.add('flex', 'justify-between', 'items-center', 'gap-2', 'mb-1');
            // Создаём элемент для информации о файле (имя и размер)
            const fileInfo = document.createElement('span');
            fileInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
            // Создаём кнопку для удаления файла
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.innerHTML = '<span>Удалить</span>' +
                '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">\n' +
                '  <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />\n' +
                '</svg>\n';
            removeBtn.classList.add('btn-cancel', '!w-2/10', 'flex', 'justify-center', 'items-center', 'gap-1', '!py-1');

            // Добавляем обработчик на клик по кнопке удаления
            removeBtn.addEventListener('click', () => {
                selectedFiles.splice(index, 1);
                renderFileList(); // Перерисовываем список
            });
            // Добавляем информацию о файле и кнопку удаления в элемент списка
            li.appendChild(fileInfo);
            li.appendChild(removeBtn);
            fileList.appendChild(li);
        });

        // Обновляем input.files вручную
        const dataTransfer = new DataTransfer();
        selectedFiles.forEach(file => dataTransfer.items.add(file));
        fileInput.files = dataTransfer.files;
    }

    /**
     * Функция для очистки выбранных файлов
     */
    function clearFileList() {
        selectedFiles = [];
        fileList.innerHTML = '';
        fileInput.value = '';
    }

    return {clearFileList};
}

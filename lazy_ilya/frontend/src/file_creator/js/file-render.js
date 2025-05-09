// file-render.js

export function renderFileList(fileList, selectedFiles) {
    fileList.innerHTML = ''; // Очищаем список

    selectedFiles.forEach((file, index) => {
        const li = document.createElement('li');
        li.classList.add('flex', 'justify-between', 'items-center', 'gap-2', 'mb-1');

        const fileInfo = document.createElement('span');
        fileInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.innerHTML = `
            <span>Удалить</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21..."/>
            </svg>`;
        removeBtn.classList.add('btn-cancel', '!w-2/10', 'flex', 'justify-center', 'items-center', 'gap-1', '!py-1');

        // Удаление файла из списка
        removeBtn.addEventListener('click', () => {
            selectedFiles.splice(index, 1);
            renderFileList(fileList, selectedFiles); // Перерисовка списка
        });

        li.appendChild(fileInfo);
        li.appendChild(removeBtn);
        fileList.appendChild(li);
    });
}

// handle-save-click.js
import {saveAllChanges} from './save-all.js';
import {getCheckIcon} from './utils.js';

/**
 * Обработчик клика по кнопке "Сохранить все".
 *
 * @param {Object} data - Данные, полученные с сервера.
 * @param {HTMLElement} formDiv3 - DOM-элемент формы для шага 3.
 * @param {HTMLElement} step3 - DOM-элемент для шага 3.
 * @param {HTMLElement} step4 - DOM-элемент для шага 4.
 * @param {HTMLElement} spinner3 - DOM-элемент спиннера для шага 3.
 * @param {HTMLElement} formDiv4 - DOM-элемент формы для шага 4.
 * @param {HTMLElement} spinner4 - DOM-элемент спиннера для шага 4.
 *
 * @returns {Promise<void>}
 */
export default async function handleSaveClick(data, formDiv3, step3, step4, spinner3, formDiv4, spinner4) {
    try {
        // Показываем спиннер перед сохранением
        spinner3.classList.remove('hidden');

        // Сохраняем данные
        const result = await saveAllChanges(data.new_files, data.content, '/');

        if (result === true) {
            // Прячем спиннер после сохранения
            spinner3.classList.add('hidden');

            // Переключаем шаги
            window.scrollTo({top: 0, behavior: 'smooth'});
            formDiv3.classList.remove('show');
            await new Promise(r => setTimeout(r, 500));
            formDiv3.classList.add('hidden');

            step3.classList.remove('li-style-active');
            step3.classList.add('li-style-complete', 'pointer-events-none');
            step3.querySelector('span').innerHTML = getCheckIcon();

            await new Promise(r => setTimeout(r, 500));
            step4.classList.add('li-style-active');

            // Показ текста
            const heading = document.createElement('h2');
            heading.classList.add('text-text', 'dark:text-text-dark');
            heading.textContent = 'Илья поработал и хочет спать!';

            const paragraph = document.createElement('p');
            paragraph.classList.add('dark:text-text-dark', 'font-medium');
            paragraph.textContent = 'Теперь можно посмотреть, папку с архивом за сегодняшнее число, туда положил все файлы!';

            formDiv4.appendChild(heading);
            formDiv4.appendChild(paragraph);

            formDiv4.classList.remove('hidden');
            await new Promise(r => setTimeout(r, 100));
            formDiv4.classList.add('show');

            // Показываем спиннер4 на время "отображения результата"
            spinner4.classList.remove('hidden');

            // Здесь можно добавить ожидание окончания обработки, если есть логика
            // Или просто подождать пока отображается текст
            await new Promise(r => setTimeout(r, 5000));  // Оставим короткую задержку для UX

            spinner4.classList.add('hidden');

            formDiv4.classList.remove('show');
            await new Promise(r => setTimeout(r, 500));
            formDiv4.classList.add('hidden');

            step4.classList.remove('li-style-active');
            step4.classList.add('li-style-complete', 'pointer-events-none');
            step4.querySelector('span').innerHTML = getCheckIcon();

            await new Promise(r => setTimeout(r, 1000));
            location.reload();
        } else {
            spinner3.classList.add('hidden');
            console.error('Ошибка при сохранении изменений');
        }
    } catch (error) {
        spinner3.classList.add('hidden');
        spinner4.classList.add('hidden');
        console.error('Ошибка во время обработки:', error);
    }
}

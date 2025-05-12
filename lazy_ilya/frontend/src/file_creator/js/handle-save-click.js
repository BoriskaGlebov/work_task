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
    const result = await saveAllChanges(data.new_files, data.content, '/');
    if (result === true) {
        // Прокрутка страницы вверх
        window.scrollTo({top: 0, behavior: 'smooth'});

        spinner3.classList.remove('hidden');
        await new Promise(r => setTimeout(r, 3000));
        spinner3.classList.add('hidden');
        formDiv3.classList.remove('show');
        await new Promise(r => setTimeout(r, 1000));
        formDiv3.classList.add('hidden');
        step3.classList.remove('li-style-active');
        step3.classList.add('li-style-complete', 'pointer-events-none');
        step3.querySelector('span').innerHTML = getCheckIcon();
        await new Promise(r => setTimeout(r, 1000));
        step4.classList.add('li-style-active');

        const heading = document.createElement('h2');
        heading.classList.add('text-xl', 'text-text', 'dark:text-text-dark', 'font-semibold');
        heading.textContent = 'Илья поработал и хочет спать!';

        const paragraph = document.createElement('p');
        paragraph.classList.add('text-md', 'text-text', 'dark:text-text-dark', 'font-medium');
        paragraph.textContent = 'Теперь можно посмотреть, ' +
            'папку с архивом за сегодняшнее число, туда положил все файлы!';
        formDiv4.appendChild(heading);
        formDiv4.appendChild(paragraph);

        await new Promise(r => setTimeout(r, 500));
        formDiv4.classList.remove('hidden');
        await new Promise(r => setTimeout(r, 100));
        formDiv4.classList.add('show');

        spinner4.classList.remove('hidden');
        await new Promise(r => setTimeout(r, 3000));
        spinner4.classList.add('hidden');

        formDiv4.classList.remove('show');
        await new Promise(r => setTimeout(r, 1000));
        formDiv4.classList.add('hidden');

        step4.classList.remove('li-style-active');
        step4.classList.add('li-style-complete', 'pointer-events-none');
        step4.querySelector('span').innerHTML = getCheckIcon();
        await new Promise(r => setTimeout(r, 5000));
        location.reload();
    }
}

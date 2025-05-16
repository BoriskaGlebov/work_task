import {runStep2} from "./step2.js"; // если runStep2 в этом же файле
import {getCheckIcon} from "./utils.js"; // убедись, что путь правильный

/**
 * Выполняет шаг 1 в многошаговой форме:
 * - Обновляет стили прогресс-бара (step1 -> завершён, step2 -> активен)
 * - Отображает полученные файлы на форме step2
 * - Показывает и скрывает спиннер с анимацией
 * - Переходит к шагу 2 (`runStep2`)
 *
 * @async
 * @function runStep1
 * @param {Object} data - Объект с данными, полученными после отправки формы.
 * @param {string[]} data.new_files - Список имён новых файлов, полученных с сервера.
 * @param {HTMLElement} formDiv2 - DOM-элемент контейнера формы шага 2.
 * @param {HTMLElement} spinner2 - DOM-элемент спиннера для шага 2.
 */
export async function runStep1(data, formDiv2, spinner2) {
    const step1 = document.querySelector('.step[data-step="1"]');
    const step2 = document.querySelector('.step[data-step="2"]');
    const step3 = document.querySelector('.step[data-step="3"]');
    const formDiv3 = document.getElementById('step3-form');

    step1.classList.remove('li-style-active');
    step1.classList.add('li-style-complete', 'pointer-events-none');
    step1.querySelector('span').innerHTML = getCheckIcon();

    step2.classList.add('li-style-active');

    // Создаем и вставляем заголовок
    const heading = document.createElement('h2');
    // heading.classList.add('text-xl', 'text-text', 'dark:text-text-dark', 'font-semibold');
    heading.textContent = 'Илья читает, что ты написал';

    // Создаем и вставляем абзац
    const paragraph = document.createElement('p');
    paragraph.classList.add('text-text', 'dark:text-text-dark');
    paragraph.textContent = 'Посмотри правильно ли Илья прочитал. ' +
        'Получены обработанные файлы, ниже приведены их названия.';

    // Если есть файлы, отображаем их в списке
    if (Array.isArray(data.new_files)) {
        const ul = document.createElement('ul');
        ul.className = 'list-disc pl-5 mt-2 text-sm md:text-base text-text dark:text-text-dark font-medium';
        data.new_files.forEach(file => {
            const li = document.createElement('li');
            li.textContent = file;
            ul.appendChild(li);
        });

        formDiv2.appendChild(heading);
        formDiv2.appendChild(paragraph);
        formDiv2.appendChild(ul);
    }

    await new Promise(r => setTimeout(r, 500));
    formDiv2.classList.remove('hidden');
    await new Promise(r => setTimeout(r, 100));
    formDiv2.classList.add('show');

    spinner2.classList.remove('hidden');
    await new Promise(r => setTimeout(r, 5000));
    spinner2.classList.add('hidden');

    formDiv2.classList.remove('show');
    await new Promise(r => setTimeout(r, 1000));
    formDiv2.classList.add('hidden');

    step2.classList.remove('li-style-active');
    step2.classList.add('li-style-complete', 'pointer-events-none');
    step2.querySelector('span').innerHTML = getCheckIcon();

    await runStep2(data, step3, formDiv3);
}

// submit-form.js
import {saveAllChanges} from './save-all.js';
import {showError, getCheckIcon} from './utils.js';
import {runStep1} from './step1.js';
import handleSaveClick from './handle-save-click.js';  // Импортируем новую функцию

/**
 * Асинхронная отправка формы через fetch
 *
 * Эта функция отвечает за обработку отправки формы, выполнение шагов формы (например, шаг 1, шаг 3, шаг 4),
 * и вызов функции сохранения данных по завершении всех шагов. Она использует Fetch API для отправки формы
 * на сервер и обработки полученных данных.
 *
 * @param {HTMLFormElement} form - Элемент формы, который будет отправлен.
 * @param {HTMLElement} formDiv - DOM-элемент для текущего шага формы.
 * @param {Function} clearFileList - Функция для очистки списка загруженных файлов.
 *
 * @returns {Promise<void>} - Промис, который разрешается по завершении отправки формы.
 */
export default async function submitFormAsync(form, formDiv, clearFileList) {
    const spinner = document.getElementById('upload-spinner');
    const spinner2 = document.getElementById('upload-spinner2');
    const spinner3 = document.getElementById('upload-spinner3');
    const spinner4 = document.getElementById('upload-spinner4');
    const formDiv2 = document.getElementById('step2-form');
    const formDiv3 = document.getElementById('step3-form');
    const formDiv4 = document.getElementById('step4-form');
    const saveButton = document.getElementById('save-edited-content');
    const saveAllButton = document.getElementById('save-content');
    const step3 = document.querySelector('.step[data-step="3"]');
    const step4 = document.querySelector('.step[data-step="4"]');

    try {
        // Сбор данных из формы
        const formData = new FormData(form);

        // Показать спиннер загрузки
        spinner.classList.remove('hidden');

        // Имитируем задержку
        // await new Promise(resolve => setTimeout(resolve, 1000));

        // Отправка данных формы через fetch
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
        });

        // Парсим ответ от сервера
        const data = await response.json();

        // Проверка на успешный ответ
        if (!response.ok) {
            throw new Error(data.error || `Ошибка: ${response.status}`);
        }

        console.log('Ответ от сервера:', data);

        // Сбрасываем форму и очищаем файлы
        form.reset();
        clearFileList();

        // Переключаем шаги формы
        formDiv.classList.remove('show');
        setTimeout(() => formDiv.classList.add('hidden'), 500);

        // Выполняем шаг 1
        await runStep1(data, formDiv2, spinner2);

        // Обработка клика на кнопки сохранения
        saveAllButton.addEventListener('click', () => {
            handleSaveClick(data, formDiv3, step3, step4, spinner3, formDiv4, spinner4);
        });

        saveButton.addEventListener('click', () => {
            handleSaveClick(data, formDiv3, step3, step4, spinner3, formDiv4, spinner4);
        });

    } catch (error) {
        // Отображаем ошибку в случае неудачи
        showError(error);
    } finally {
        // Скрываем спиннер после завершения
        spinner.classList.add('hidden');
    }
}

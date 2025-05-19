import {showError} from "./utils.js";

/**
 * Отправка всех отредактированных файлов на сервер
 * @param {string[]} files - массив имён файлов
 * @param {string[]} content - массив содержимого файлов
 * @param {string} url - адрес PUT-запроса
 * @param {string} [errorElementId='error'] - id элемента для вывода ошибки
 * @returns {Promise<boolean>}
 */
export async function saveAllChanges(files, content, url) {
    const saveButton = document.getElementById('save-content');
    saveButton.disabled = true;
    // Получаем CSRF токен из скрытого поля в форме
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    const payload = {
        files,
        content
    };

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,  // Отправляем CSRF токен
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `Ошибка: ${response.status}`);
        }

        console.log('Все изменения успешно сохранены:', result);
        return true;
    } catch (error) {
        showError(error,'server-error2');
        return false;
    } finally {
        saveButton.disabled = false;
    }
}

let errorTimeout = null;

/**
 * Показывает анимированный блок с сообщением об ошибке на странице.
 *
 * @param {Error | string} error - Объект ошибки или строка с текстом ошибки.
 * @param {string} [elementId='server-error'] - ID HTML-элемента, в котором отображается ошибка.
 *
 * HTML-структура элемента ошибки должна выглядеть так:
 * <div id="server-error" class="hidden">
 *   <p></p>
 * </div>
 *
 * Анимации должны быть определены в CSS:
 * - animate-popup
 * - animate-popup-reverse
 *
 * Пример использования:
 * ```js
 * try {
 *   await sendRequest();
 * } catch (e) {
 *   showError(e);
 * }
 * ```
 */
export function showError(error, elementId = 'server-error') {
    const errorBlock = document.getElementById(elementId);
    if (!errorBlock) {
        console.warn(`Элемент с id "${elementId}" не найден.`);
        return;
    }

    const errorText = errorBlock.querySelector('p');
    if (!errorText) {
        console.warn(`В элементе с id "${elementId}" отсутствует <p> для текста ошибки.`);
        return;
    }

    // Сброс предыдущего таймера
    if (errorTimeout) {
        clearTimeout(errorTimeout);
    }

    // Обновление текста и отображение
    errorBlock.classList.remove('hidden', 'animate-popup-reverse');
    errorBlock.classList.add('flex', 'animate-popup');
    errorText.textContent = (typeof error === 'string' ? error : error.message) || 'Произошла ошибка при отправке данных';
    errorBlock.scrollIntoView({behavior: 'smooth', block: 'start'});

    console.error('Ошибка запроса:', error);

    // Новый таймер скрытия
    errorTimeout = setTimeout(() => {
        errorBlock.classList.remove('animate-popup');
        errorBlock.classList.add('animate-popup-reverse');

        setTimeout(() => {
            errorBlock.classList.add('hidden');
            errorBlock.classList.remove('flex', 'animate-popup-reverse');
        }, 1000);

        errorTimeout = null;
    }, 4000);
}


export function getCheckIcon() {
    return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">\n' +
        '  <path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />\n' +
        '</svg>\n';
}
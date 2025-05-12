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

    errorBlock.classList.remove('hidden', 'animate-popup-reverse');
    errorBlock.classList.add('flex', 'animate-popup');

    errorText.textContent = (typeof error === 'string' ? error : error.message) || 'Произошла ошибка при отправке данных';

    console.error('Ошибка запроса:', error);

    setTimeout(() => {
        errorBlock.classList.remove('animate-popup');
        errorBlock.classList.add('animate-popup-reverse');

        setTimeout(() => {
            errorBlock.classList.add('hidden');
            errorBlock.classList.remove('flex', 'animate-popup-reverse');
        }, 1000);
    }, 4000);
}


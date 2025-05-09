import setupFileUpload from './file-upload.js';

const {clearFileList} = setupFileUpload(); // сохранить доступ к функции очистки
/**
 * Инициализация пользовательской валидации формы загрузки файлов
 * Поддерживает проверку:
 * - Загружены ли файлы
 * - Форматы файлов (.doc, .docx, .rtf)
 * - Начальный номер > 0
 * - Указан ли тип устройства
 */
export default function setupFormValidation() {
    const formDiv = document.getElementById('step1-form')
    const form = document.getElementById('file-upload-form');
    const fileLabel = document.getElementById('files-label');
    const fileInput = document.getElementById('files');
    const startNumberLabel = document.getElementById('start-number-label');
    const startNumberInput = document.getElementById('start-number');
    const deviceTypeLabel = document.getElementById('device-type-label');
    const deviceTypeInput = document.getElementById('device-type');

    const filesError = document.getElementById('files-error');
    const startNumberError = document.getElementById('start-number-error');
    const deviceTypeError = document.getElementById('device-type-error');
    const spinner = document.getElementById('upload-spinner');

    /**
     * Сброс всех сообщений об ошибке и возврат стилей по умолчанию
     */
    const resetErrors = () => {
        [filesError, startNumberError, deviceTypeError].forEach(el => el.classList.add('hidden'));
    };

    /**
     * Показать ошибку для конкретного поля с возвратом стилей через 3 секунды
     * @param {HTMLElement} input - поле ввода
     * @param {HTMLElement} label - связанный label
     * @param {HTMLElement} errorEl - элемент ошибки
     * @param {string} [message] - необязательный текст ошибки
     */
    const showError = (input, label, errorEl, message = '') => {
        if (message) errorEl.textContent = message;
        errorEl.classList.remove('hidden');
        input.classList.remove('correct_input');
        input.classList.add('error_input');
        label.classList.remove('correct_label');
        label.classList.add('error_label');

        setTimeout(() => {
            errorEl.classList.add('hidden');
            input.classList.add('correct_input');
            input.classList.remove('error_input');
            label.classList.add('correct_label');
            label.classList.remove('error_label');
        }, 3000);
    };

    /**
     * Проверка: загружены ли файлы, и все ли они нужного формата
     * @returns {boolean}
     */
    const validateFiles = () => {
        const allowedExtensions = ['.doc', '.docx', '.rtf'];
        if (fileInput.files.length === 0) {
            showError(fileInput, fileLabel, filesError, 'Загрузите хотя бы один файл.');
            return false;
        }

        for (let i = 0; i < fileInput.files.length; i++) {
            const file = fileInput.files[i];
            const ext = file.name.slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
            if (!allowedExtensions.includes('.' + ext)) {
                showError(fileInput, fileLabel, filesError, 'Допустимые форматы: .doc, .docx, .rtf');
                return false;
            }
        }
        return true;
    };

    /**
     * Проверка: введено число > 0
     * @returns {boolean}
     */
    const validateStartNumber = () => {
        const value = startNumberInput.value.trim();
        const number = Number(value);
        if (value === '' || isNaN(number) || number <= 0) {
            showError(startNumberInput, startNumberLabel, startNumberError, 'Введите число больше нуля.');
            return false;
        }
        return true;
    };

    /**
     * Проверка: выбран ли тип устройства
     * @returns {boolean}
     */
    const validateDeviceType = () => {
        if (deviceTypeInput.value === '') {
            showError(deviceTypeInput, deviceTypeLabel, deviceTypeError, 'Выберите тип устройства.');
            return false;
        }
        return true;
    };

    /**
     * Асинхронная отправка формы через fetch
     * @returns {Promise<void>}
     */
    const submitFormAsync = async () => {
        const formData = new FormData(form);

        try {
            spinner.classList.remove('hidden'); // Показываем спиннер

            await new Promise(resolve => setTimeout(resolve, 2000)); // ⏱ Пауза для демонстрации
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
            });
            // Пытаемся разобрать тело ответа
            const data = await response.json(); // если сервер возвращает JSON

            if (!response.ok) {
                throw new Error(data.error || `Ошибка: ${response.status}`);
            }


            console.log('Ответ от сервера:', data);

            form.reset(); // Очистка формы
            clearFileList(); // очищаем кастомный список файлов
            // Скрываем форму с анимацией, как в step-navigation.js
            formDiv.classList.remove('show');
            setTimeout(() => {
                formDiv.classList.add('hidden');
            }, 500);

            // Находим элемент .step с data-step="1" и помечаем его как завершённый
            const step1 = document.querySelector('.step[data-step="1"]');
            if (step1) {
                step1.classList.remove('li-style-active');
                step1.classList.add('li-style-complete');
                step1.classList.add('pointer-events-none');
                // Заменим содержимое <span> внутри шага на иконку
                const span = step1.querySelector('span');
                span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">\n' +
                    '  <path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />\n' +
                    '</svg>\n';

            }

        } catch (error) {
            // Показываем ошибку в блоке server-error
            const errorBlock = document.getElementById('server-error');
            const errorMessage = error.message || 'Произошла ошибка при отправке данных';

            // Показываем ошибку в блоке и делаем его видимым
            errorBlock.classList.remove('hidden', 'animate-popup-reverse');
            const errorText = errorBlock.querySelector('p');
            errorBlock.classList.add("flex", "animate-popup");
            errorText.textContent = errorMessage;

            console.error('Ошибка запроса:', error);

            // Прячем блок через 5 секунд, например, можно установить свою задержку
            // 🕒 Скрыть через 3 секунды
            setTimeout(() => {
                errorBlock.classList.remove("animate-popup");
                errorBlock.classList.add("animate-popup-reverse");

                // ⏱️ Скрыть блок только после завершения анимации (через 4 секунды)
                setTimeout(() => {
                    errorBlock.classList.add("hidden");
                    errorBlock.classList.remove("flex", "animate-popup-reverse");
                }, 1000); // должно совпадать с длительностью fade-in-out-reverse
            }, 4000); // изначальная задержка перед скрытием
        } finally {
            spinner.classList.add('hidden'); // Скрываем спиннер в любом случае
        }
    };

    // Обработчик отправки формы
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        resetErrors();

        const isValid =
            validateFiles() &
            validateStartNumber() &
            validateDeviceType();

        if (isValid) {
            submitFormAsync(); // Асинхронная отправка формы
        }
    });
}

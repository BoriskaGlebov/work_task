import setupFileUpload from './file-upload.js';
import submitFormAsync from './submit-form.js';

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
    const formDiv2 = document.getElementById('step2-form')
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


    // Обработчик отправки формы
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        resetErrors();

        const isValid =
            validateFiles() &
            validateStartNumber() &
            validateDeviceType();

        if (isValid) {
            submitFormAsync(form, formDiv, clearFileList, formDiv2); // Асинхронная отправка формы
        }
    });
}

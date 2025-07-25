/**
 * Класс для автодополнения поля ввода на основе списка городов с подсказками.
 * Подсказки показываются на основе сопоставления введённого текста с псевдонимами городов.
 */
export class InlineGlobusAutocomplete {
    /**
     * Создаёт экземпляр автокомплита.
     * @param {string} inputSelector - CSS селектор для поля ввода.
     * @param {string} hintInputSelector - CSS селектор для поля подсказки (overlay).
     * @param {Array} citiesData - Массив объектов городов, каждый должен содержать поле pseudonim и pk.
     */
    constructor(inputSelector, hintInputSelector, citiesData) {
        this.input = document.querySelector(inputSelector);
        this.hintInput = document.querySelector(hintInputSelector);

        // Нормализуем псевдонимы: убираем все пробелы, переносы и переводим в нижний регистр
        this.citiesData = citiesData.map(city => ({
            ...city,
            normalizedPseudonim: city.pseudonim.replace(/\s+/g, '').toLowerCase()
        }));

        this.selectedPk = null; // Идентификатор выбранного города
        this.initEvents();
        this.syncHintStyle();
    }

    /**
     * Инициализация событий для поля ввода и окна.
     */
    initEvents() {
        // Обработка ввода текста для обновления подсказки
        this.input.addEventListener('input', () => this.updateHint());

        // Обработка нажатий клавиш для принятия подсказки (стрелка вправо или Tab)
        this.input.addEventListener('keydown', (e) => {
            if ((e.key === 'ArrowRight' || e.key === 'Tab') && this.hintInput.value) {
                e.preventDefault();
                this.acceptHint();
            }
        });

        // При изменении размера окна синхронизируем стиль подсказки с полем ввода
        window.addEventListener('resize', () => this.syncHintStyle());
    }

    /**
     * Синхронизирует стили подсказки с полем ввода,
     * чтобы подсказка выглядела как часть поля.
     */
    syncHintStyle() {
        const inputStyle = window.getComputedStyle(this.input);
        Object.assign(this.hintInput.style, {
            font: inputStyle.font,
            padding: inputStyle.padding,
            lineHeight: inputStyle.lineHeight,
            height: inputStyle.height,
            width: inputStyle.width,
            borderRadius: inputStyle.borderRadius,
            boxSizing: inputStyle.boxSizing,
        });
    }

    /**
     * Обновляет подсказку на основе текущего ввода пользователя.
     * Если ввод совпадает с началом псевдонима — подставляет недостающие символы.
     * Если совпадения по началу нет — пытается найти совпадение по включению.
     * Если совпадений нет — помечает поле как ошибочное.
     */
    updateHint() {
        const queryRaw = this.input.value.trim(); // Введённый текст без пробелов по краям
        const query = queryRaw.replace(/\s+/g, '').toLowerCase(); // Нормализованный ввод (без пробелов, в нижнем регистре)

        this.hintInput.value = '';
        this.selectedPk = null;
        this.input.classList.remove('error_input', 'correct_input');

        if (!query) {
            // Если пустой ввод — считаем корректным и не показываем подсказку
            this.input.classList.add('correct_input');
            return;
        }

        // Ищем все элементы, где normalizedPseudonim начинается с запроса
        const startsWithMatches = this.citiesData.filter(city =>
            city.normalizedPseudonim.startsWith(query)
        );

        let bestMatch = null;

        if (startsWithMatches.length > 0) {
            // Выбираем "лучшее" совпадение с минимальной длиной normalizedPseudonim
            bestMatch = startsWithMatches.reduce((prev, curr) =>
                curr.normalizedPseudonim.length < prev.normalizedPseudonim.length ? curr : prev
            );
        } else {
            // Если по startsWith не нашли — ищем по includes
            const includesMatches = this.citiesData.filter(city =>
                city.normalizedPseudonim.includes(query)
            );

            if (includesMatches.length > 0) {
                bestMatch = includesMatches.reduce((prev, curr) =>
                    curr.normalizedPseudonim.length < prev.normalizedPseudonim.length ? curr : prev
                );
            }
        }

        if (bestMatch) {
            this.selectedPk = bestMatch.pk;

            const originalPseudonim = bestMatch.pseudonim;
            const typedLength = query.length;

            // Определяем сколько символов оригинального псевдонима соответствует введённым символам без пробелов
            let matchLength = 0;
            for (let i = 0, j = 0; i < originalPseudonim.length && j < typedLength; i++) {
                if (!/\s/.test(originalPseudonim[i])) {
                    j++;
                }
                matchLength = i + 1;
            }

            // Формируем подсказку: ввод + оставшаяся часть псевдонима
            const hintText = queryRaw + originalPseudonim.slice(matchLength);

            this.hintInput.value = hintText;
            this.input.classList.add('correct_input');
        } else {
            // Нет совпадений — помечаем ввод как ошибочный
            this.input.classList.add('error_input');
        }
    }

    /**
     * Принимает текущую подсказку и вставляет её в поле ввода.
     * Очищает поле подсказки и обновляет стили.
     */
    acceptHint() {
        if (this.hintInput.value) {
            this.input.value = this.hintInput.value;
            this.hintInput.value = '';
            this.input.classList.remove('error_input');
            this.input.classList.add('correct_input');
        }
    }

    /**
     * Возвращает pk выбранного элемента (если есть).
     * @returns {any|null} pk выбранного города или null, если ничего не выбрано
     */
    getSelectedPk() {
        return this.selectedPk;
    }
}

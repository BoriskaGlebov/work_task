// Время бездействия в миллисекундах (30 минут = 30 * 60 * 1000)
const inactivityTime = 30 * 60 * 1000;
let inactivityTimer;
let intervalTimer;
let startTime; // Переменная для хранения времени начала отсчета

// Функция для обновления страницы
function reloadPage() {
    console.log("Время бездействия истекло. Страница будет обновлена.");
    window.location.reload(); // Обновляем страницу
}

// Функция для сброса таймера
function resetInactivityTimer() {
    clearTimeout(inactivityTimer); // Сбрасываем таймер
    clearInterval(intervalTimer); // Сбрасываем интервал
    startTime = new Date().getTime(); // Устанавливаем время начала отсчета
    inactivityTimer = setTimeout(reloadPage, inactivityTime); // Запускаем таймер заново
    logRemainingTime(); // Логируем оставшееся время
    intervalTimer = setInterval(logRemainingTime, 30*1000); // Обновляем лог каждую секунду
}

// Функция для логирования оставшегося времени
function logRemainingTime() {
    const now = new Date().getTime(); // Текущее время
    const elapsedTime = now - startTime; // Время, прошедшее с начала отсчета
    const remainingTime = inactivityTime - elapsedTime; // Оставшееся время
    const remainingMinutes = Math.floor(remainingTime / 60000); // Переводим в минуты
    const remainingSeconds = Math.floor((remainingTime % 60000) / 1000); // Оставшиеся секунды

    // Логируем только секунды, если минуты = 0
    if (remainingMinutes > 0) {
        console.log(`До разлогинивания осталось: ${remainingMinutes} минут ${remainingSeconds} секунд`);
    } else {
        console.log(`До разлогинивания осталось: ${remainingSeconds} секунд`);
    }

    // Если время бездействия истекло, останавливаем обновление
    if (remainingTime <= 0) {
        clearInterval(intervalTimer);
    }
}

// События, которые сбрасывают таймер
window.onload = resetInactivityTimer; // При загрузке страницы
document.onmousemove = resetInactivityTimer; // При движении мыши
document.onkeypress = resetInactivityTimer; // При нажатии клавиш
document.onclick = resetInactivityTimer; // При клике
document.onscroll = resetInactivityTimer; // При прокрутке


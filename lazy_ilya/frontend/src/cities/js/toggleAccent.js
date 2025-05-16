/**
 * Переключает классы 'bg-accent' и 'dark:bg-accent-dark'
 * для элементов с id 'a-cities' и 'a-cities-mob'.
 *
 * Проверяет, что элементы существуют на странице,
 * прежде чем менять классы.
 *
 * @returns {void}
 */
export function toggleAccentClasses() {
  const aEl = document.getElementById('a-cities');
  if (aEl) {
    aEl.classList.toggle('bg-accent');
    aEl.classList.toggle('dark:bg-accent-dark');
  }

  const aElMob = document.getElementById('a-cities-mob');
  if (aElMob) {
    aElMob.classList.toggle('bg-accent');
    aElMob.classList.toggle('dark:bg-accent-dark');
  }
}

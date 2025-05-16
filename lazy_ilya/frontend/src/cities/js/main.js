document.addEventListener('DOMContentLoaded', () => {
    const aEl = document.getElementById('a-cities')
    aEl.classList.toggle('bg-accent');
    aEl.classList.toggle('dark:bg-accent-dark');
    const aElMob = document.getElementById('a-cities-mob')
    aElMob.classList.toggle('bg-accent');
    aElMob.classList.toggle('dark:bg-accent-dark');
    const citiesData = window.citiesData || [];
    console.log(citiesData);
});
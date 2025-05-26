import '../../css/base.css';
import {toggleAccentClasses} from "./toggleAccent.js";


document.addEventListener('DOMContentLoaded', () => {
    toggleAccentClasses('a-statistics', 'a-statistics-mob')
    const counters = document.querySelectorAll('.count-up');
    const speed = 100000; // чем меньше, тем быстрее

    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        let count = 0;

        const updateCount = () => {
            const increment = Math.ceil(target / speed);
            if (count < target) {
                count += increment;
                if (count > target) count = target;
                counter.textContent = count;
                requestAnimationFrame(updateCount);
            } else {
                counter.textContent = target;
            }
        };

        updateCount();
    });
});
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.accordion-toggle').forEach(button => {
        button.addEventListener('click', () => {
            const content = button.nextElementSibling;
            const svg = button.querySelector('svg');

            const isOpen = content.classList.contains('max-h-96');

            document.querySelectorAll('.accordion-content').forEach(c => c.classList.remove('max-h-96'));
            document.querySelectorAll('.accordion-toggle svg').forEach(s => s.classList.remove('rotate-180'));
            setTimeout(() => {
                if (!isOpen) {
                    content.classList.add('max-h-96');
                    svg.classList.add('rotate-180');
                }
            }, 500);

        });
    });
});
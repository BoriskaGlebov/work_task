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

    document.getElementById("uploadForm").addEventListener("submit", async function (e) {
        e.preventDefault();
        const form= document.getElementById("uploadForm");
        const fileInput = document.getElementById("fileInput");
        const errorMessage = document.getElementById("errorMessage");
        const file = fileInput.files[0];

        if (!file || file.name !== "globus.docx") {
            errorMessage.classList.remove("hidden");
            return;
        } else {
            errorMessage.classList.add("hidden");
        }

        const formData = new FormData();
        formData.append("cityFile", file); // должно соответствовать request.FILES.get("cityFile")

        // CSRF-токен
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        try {
            const response = await fetch(form.action, {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfToken,
                },
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message || "Файл успешно загружен");
            } else {
                alert(result.error || "Ошибка загрузки файла");
            }

        } catch (err) {
            alert("Произошла ошибка при отправке файла");
            console.error(err);
        }
    });
});
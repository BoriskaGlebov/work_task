export class AccordionUploader {
    constructor(formId, fileInputId, errorMessageId) {
        this.form = document.getElementById(formId);
        this.fileInput = document.getElementById(fileInputId);
        this.errorMessage = document.getElementById(errorMessageId);

        this.initAccordion();
        this.initFileUpload();
    }

    initAccordion() {
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
    }

    initFileUpload() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const file = this.fileInput.files[0];

            if (!file || file.name !== "globus.docx") {
                this.errorMessage.classList.remove("hidden");
                return;
            } else {
                this.errorMessage.classList.add("hidden");
            }

            const formData = new FormData();
            formData.append("cityFile", file); // должно совпадать с request.FILES.get("cityFile")

            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

            try {
                const response = await fetch(this.form.action, {
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
    }
}

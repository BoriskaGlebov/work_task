export class KanbanTasks {
    constructor({addButtonId, boardId}) {
        this.taskIdCounter = 1;
        this.addTaskBtn = document.getElementById(addButtonId);
        this.taskBoard = document.getElementById(boardId);

        this.addTaskBtn.addEventListener('click', () => this.addTaskCard());

        // Делегирование кликов по удалению задач
        this.taskBoard.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                e.target.closest('.task-card').remove();
            }
        });

        // Отслеживание чекбоксов (статус)
        this.taskBoard.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.closest('.task-card')) {
                const card = e.target.closest('.task-card');
                if (e.target.checked) {
                    card.classList.add('task-completed');
                } else {
                    card.classList.remove('task-completed');
                }
            }
        });
    }

    addTaskCard() {
        const taskCard = document.createElement('div');
        taskCard.classList.add('task-card', 'bg-white', 'p-4', 'rounded', 'shadow', 'relative', 'flex', 'flex-col', 'border-l-20', 'border-l-lime-500', 'rounded-xl');
        taskCard.setAttribute('data-id', this.taskIdCounter++);

        taskCard.innerHTML = `
      <h3 contenteditable="true" class="text-lg font-semibold mb-1" spellcheck="false">Новая задача</h3>
      <p contenteditable="true" class="text-sm text-gray-600 flex-grow" spellcheck="false">Описание...</p>
      <div class="mt-2 text-xs text-gray-400">Срок: <input type="date" class="task-deadline border border-gray-300 rounded p-1 text-xs" /></div>
      <button class="delete-btn absolute top-2 right-2 text-red-500 hover:text-red-700" title="Удалить задачу">×</button>
    `;

        this.taskBoard.appendChild(taskCard);
        taskCard.querySelector('h3').focus();
    }
}

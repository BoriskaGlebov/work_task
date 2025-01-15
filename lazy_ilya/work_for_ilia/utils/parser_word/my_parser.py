import datetime
import os

from docx import Document

from work_for_ilia.utils.my_settings.disrs_for_app import ProjectSettings


class Parser:
    def __init__(self, directory: str, start_number: int):
        self.directory = directory
        self.start_number = start_number

    def all_files(self) -> list:
        files = [file for file in os.listdir(self.directory) if
                 os.path.isfile(os.path.join(self.directory, file)) and file.endswith('.docx')]
        return files

    def format_text(self, text, max_length=60):
        """Форматирует текст, ограничивая длину строк до max_length символов."""
        words = text.split()
        formatted_lines = []
        current_line = []

        for word in words:
            # Проверяем, если добавление слова превышает максимальную длину
            if len(' '.join(current_line + [word])) <= max_length:
                current_line.append(word)
            else:
                # Сохраняем текущую строку и начинаем новую
                formatted_lines.append(' '.join(current_line))
                current_line = [word]

        # Добавляем последнюю строку, если она не пустая
        if current_line:
            formatted_lines.append(' '.join(current_line))

        return '\n'.join(formatted_lines)

    def create_file_parsed(self):
        for file in self.all_files():
            numm_tables = 0
            document = Document(os.path.join(self.directory, file))
            n_name = str(self.start_number) + '_' + os.path.splitext(file)[0] + '.txt'
            with open(os.path.join(self.directory, n_name), 'w', encoding='utf-8') as output_file:
                # Читаем верхний колонтитул
                # some_words = []
                # federal = False
                # number = False
                # anal = False
                # from_iz = False
                special_header = document.sections[0].first_page_header
                common_header = document.sections[0].header

                if len(special_header.tables):
                    header = special_header
                else:
                    header = common_header
                for table in header.tables:
                    for row in table.rows:
                        for cell in row.cells:
                            if 'из:' in cell.text.lower():
                                output_file.write(
                                    self.format_text(
                                        cell.text[:-1].strip().upper()) + ' ')  # Форматируем содержимое ячейки
                            elif 'г. москва' in cell.text.lower():
                                output_file.write(
                                    self.format_text(cell.text.strip().upper()) + '  НР ' + str(
                                        self.start_number) + '   Для анального пользования\n'.upper())

                # Читаем основной текст документа и таблицы
                output_file.write("\n\n          Содержимое документа:\n\n")
                num_tables = 0
                for element in document.element.body:
                    if element.tag.endswith('p'):  # Проверяем, является ли элемент абзацем
                        text: str = element.text.strip()
                        if element.text.startswith(
                                'Evaluation Warning: The document was created with Spire.Doc for Python.'):
                            continue
                        elif element.text.startswith('Куда и кому:'):
                            new_str = text.replace('Куда и кому:', '')
                            output_file.write(self.format_text(new_str.upper()) + '\n')
                        elif element.text.startswith('Уважаемый'):
                            output_file.write('      ' + self.format_text(text.upper()) + '\n')
                        elif text:  # Если абзац не пустой
                            output_file.write(self.format_text(text.upper()) + '\n')
                        else:  # Печатаем пустую строку для пустого абзаца
                            output_file.write('\n')
                    elif element.tag.endswith('tbl') and num_tables < len(document.tables):
                        table = document.tables[num_tables]  # Получаем таблицу по индексу
                        for row in table.rows:
                            for cell in row.cells:
                                if cell.text:
                                    if cell.text.startswith('Особый знак'):
                                        output_file.write(
                                            f"Особый знак НР {str(self.start_number)}/П Заместитель доярки\n"
                                            f"{datetime.datetime.now().strftime("%d.%m.%Y")}   колхозник   А.М. Поликарп \n")
                                        break

                                        # Форматируем содержимое ячейки

                            num_tables += 1
                    #
                    # Читаем нижний колонтитул
                    # footer = document.sections[0].footer
                    # output_file.write("\nНижний колонтитул:\n")
                    # for paragraph in footer.paragraphs:
                    #     output_file.write(self.format_text(paragraph.text) + '\n')

                self.start_number += 1


if __name__ == '__main__':
    start_numm = 123
    s = Parser(ProjectSettings.tlg_dir, start_numm)
    # print(s)
    # print(s.all_files())
    print(s.create_file_parsed())

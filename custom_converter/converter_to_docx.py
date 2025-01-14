import os

from spire.doc import Document, FileFormat

from settings.main_settings import ProjectSettings


class Converter:
    """
    Конверитрует из любого .rtf формата в .docx
    """

    def __init__(self, directory: str):
        self.dir = directory

    def all_files(self) -> list:
        files = [file for file in os.listdir(self.dir) if
                 os.path.isfile(os.path.join(self.dir, file)) and not file.endswith(('.txt', '.docx'))]
        return files

    def convert_files(self):
        out_list = list()
        for file_name in self.all_files():
            n_name = os.path.splitext(file_name)[0]
            new_file_name = os.path.join(self.dir, f'{n_name}.docx')
            document = Document()
            document.LoadFromFile(os.path.join(self.dir, file_name))
            document.SaveToFile(new_file_name, FileFormat.Docx)
            out_list.append(new_file_name)
        return out_list


if __name__ == '__main__':
    print(ProjectSettings.tlg_dir)
    s = Converter(ProjectSettings.tlg_dir)
    print(s.all_files())
    print(s.convert_files())

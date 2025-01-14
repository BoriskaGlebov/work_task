import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass
class ProjectSettings:
    base_dir = os.getenv('BASE_PATH')
    tlg_dir = os.getenv('TLG_PATH')


if __name__ == '__main__':
   s=ProjectSettings()
   print(s.tlg_dir)
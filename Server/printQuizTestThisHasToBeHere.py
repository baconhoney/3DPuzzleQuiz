import dotenv
import os
import pathlib

# ez elv akkor nem kell ide (2 órányi kód-bámulás után), de meglátjuk (vagyis te majd) - bacon
# os.environ["CWD"] = str(pathlib.Path(__file__).parent.resolve().as_posix())
# dotenv.load_dotenv()

import printer
import utils


printer.printQuiz(1234567890, "en", utils.QuizSizes.SIZE_20)

# illetve kicsit átrendeztem a jóistent, és mostmár nem kell ez a file, elv rögtön a printer.py-ból is tudsz olyat hogy `if name == main: printQuiz(...)` - bacon

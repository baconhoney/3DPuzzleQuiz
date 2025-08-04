import dotenv
import os
import pathlib


os.environ["CWD"] = str(pathlib.Path(__file__).parent.resolve().as_posix())
dotenv.load_dotenv()
import modules.printer as printer
import modules.utils as utils


printer.printQuiz(1234567890, "en", utils.QuizSize.SIZE_20)

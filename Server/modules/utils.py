from aiohttp import web
from enum import Enum
import datetime
import os
import pathlib
import random
import logging
import modules.quizDB as quizDB

logger = logging.getLogger(__name__)
logger.info(f"Importing {__name__}...")


# create object for paths
class paths:
    cwd = pathlib.Path(os.getenv("CWD")).resolve()
    cfgRoot = pathlib.Path(os.getenv("CFG_ROOT")).resolve()
    dataRoot = pathlib.Path(os.getenv("DATA_ROOT")).resolve()
    clientRoot = pathlib.Path(os.getenv("CLIENT_ROOT")).resolve()
    searchRoot = pathlib.Path(os.getenv("SEARCH_ROOT")).resolve()
    adminRoot = pathlib.Path(os.getenv("ADMIN_ROOT")).resolve()


router = web.RouteTableDef()
quizDB = quizDB.QuizDB(paths.dataRoot)
connectedWSClients = set()

# -----------------------
# ------- ENUMS -------
# -----------------------
class SupportedLanguages(Enum):
    """Supported languages."""

    HU = "hu"
    EN = "en"


class QuizType(Enum):
    """Possible types of the quiz."""

    DIGITAL = 0
    PAPER = 1


class QuizPhases(Enum):
    """Possible phases of the quiz."""

    IDLE = "idle"
    RUNNING = "running"
    SCORING = "scoring"


class QuizState:
    """Stores the state of the quiz."""

    nextQuizAt: datetime.datetime = datetime.datetime.now()
    currentQuizNumber: int = 1
    phase: QuizPhases = QuizPhases.IDLE
    _currentQuizdata: dict[str, dict[str, dict[str, str | int]]] = None

    @classmethod
    def formatNextQuizAt(cls) -> str:
        """Returns the formatted nextQuizAt value."""
        return cls.nextQuizAt.isoformat(timespec="milliseconds")


def getNewTeamID(type: QuizType):
    """Generate a new unique identifier."""
    while True:
        if type == QuizType.DIGITAL:
            # generating from 5000000000 to 9999999999
            uuid = random.randint(int(5e9), int(1e10 - 1))
        elif type == QuizType.PAPER:
            # generating from 1000000000 to 4999999999
            uuid = random.randint(int(1e9), int(5e9 - 1))
        else:
            raise ValueError(f"Invalid quizType {type}")
        quizDB.cursor.execute(f"SELECT count(id) FROM teams WHERE id={uuid};")
        if quizDB.cursor.fetchone()[0] == 0:
            return uuid

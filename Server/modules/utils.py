from enum import Enum
import datetime
import dotenv
import logging
import os
import pathlib
import random

import quizDB
import wsUtils


_logger = logging.getLogger(__name__)
_logger.info(f"Importing {__name__}...")


# get filepath for determining the root of the program
# this file is supposed to be in <root>/modules
os.environ["ROOT"] = str(pathlib.Path(__file__).parent.parent.resolve().as_posix())
dotenv.load_dotenv()


# resolve paths
class paths:
    cwd = pathlib.Path(os.getenv("ROOT")).resolve()
    cfgRoot = pathlib.Path(os.getenv("CFG_ROOT")).resolve()
    dataRoot = pathlib.Path(os.getenv("DATA_ROOT")).resolve()
    clientRoot = pathlib.Path(os.getenv("CLIENT_ROOT")).resolve()
    searchRoot = pathlib.Path(os.getenv("SEARCH_ROOT")).resolve()
    adminRoot = pathlib.Path(os.getenv("ADMIN_ROOT")).resolve()


quizDB = quizDB.QuizDB(paths.dataRoot)


# -----------------------
# -------- ENUMS --------
# -----------------------
class QuizLanguages(Enum):
    """Supported languages.
    - `HU: "hu"`
    - `EN: "en"`
    """

    HU = "hu"
    EN = "en"


class QuizTypes(Enum):
    """Possible types of the quiz:
    - `DIGITAL: "digital"`
    - `PAPER: "paper"`
    """

    DIGITAL = "digital"
    PAPER = "paper"


class QuizSizes(Enum):
    """Possible sizes of the quiz.
    - `SIZE_20: 20`
    - `SIZE_100: 100`
    """

    SIZE_20 = 20
    SIZE_100 = 100


class QuizPhases(Enum):
    """Possible phases of the quiz.
    - `IDLE: "idle"`
    - `RUNNING: "running"`
    - `SCORING: "scoring"`
    """

    IDLE = "idle"
    RUNNING = "running"
    SCORING = "scoring"


class QuizState:
    """Stores the state of the quiz."""

    nextPhaseChangeAt: datetime.datetime = datetime.datetime.now()
    currentQuizNumber: int = 1
    phase: QuizPhases = QuizPhases.IDLE

    @classmethod
    def formatNextPhaseChangeAt(cls) -> str:
        """Returns the formatted nextQuizAt value."""
        return cls.nextPhaseChangeAt.isoformat(timespec="milliseconds")

    @classmethod
    def getNextPhase(cls) -> QuizPhases:
        return {QuizPhases.IDLE: QuizPhases.RUNNING, QuizPhases.RUNNING: QuizPhases.SCORING, QuizPhases.SCORING: QuizPhases.IDLE}[cls.phase]

    @classmethod
    async def updateState(cls, *, nextPhase: QuizPhases = None, nextPhaseChangeAt: datetime.datetime = None):
        if nextPhase and nextPhase != cls.getNextPhase():
            raise ValueError(f"Invalid phase change: {nextPhase.value} -> {cls.getNextPhase().value}")
        if nextPhaseChangeAt and nextPhaseChangeAt < datetime.datetime.now():
            raise ValueError(f"Invalid phase change: {nextPhaseChangeAt.isoformat(timespec='milliseconds')} -> {datetime.datetime.now().isoformat(timespec='milliseconds')}")
        if nextPhase:
            cls.phase = nextPhase
            event = {QuizPhases.IDLE: "resultsReady", QuizPhases.RUNNING: "quizStarted", QuizPhases.SCORING: "quizEnded"}[nextPhase]
            await wsUtils.broadcastToClients(event, {"nextPhaseChangeAt": cls.formatNextPhaseChangeAt()})
        if nextPhaseChangeAt:
            cls.nextPhaseChangeAt = nextPhaseChangeAt
        if nextPhase or nextPhaseChangeAt:
            await wsUtils.broadcastToAdmins("statusChanged", {})


# ---------------------------
# -------- FUNCTIONS --------
# ---------------------------
# ----- Converters -----
def convertToQuizLanguage(lang: str) -> QuizLanguages | None:
    return lang in QuizLanguages and QuizLanguages(lang) or None


def convertToQuizType(type: str) -> QuizTypes | None:
    return type in QuizTypes and QuizTypes(type) or None


def convertToQuizSize(size: str) -> QuizSizes | None:
    return str(size).isdigit() and int(size) in QuizSizes and QuizSizes(int(size)) or None


def convertToQuizPhase(phase: str) -> QuizPhases | None:
    return phase in QuizPhases and QuizPhases(phase) or None


# ----- Generators -----
def getNewTeamID(type: QuizTypes):
    """Generate a new unique identifier."""
    while True:
        if type == QuizTypes.DIGITAL:
            # generating from 5000000000 to 9999999999
            uuid = random.randint(int(5e9), int(1e10 - 1))
        elif type == QuizTypes.PAPER:
            # generating from 1000000000 to 4999999999
            uuid = random.randint(int(1e9), int(5e9 - 1))
        else:
            raise ValueError(f"Invalid quizType {type}")
        quizDB.cursor.execute(f"SELECT count(id) FROM teams WHERE id={uuid};")
        if quizDB.cursor.fetchone()[0] == 0:
            return uuid


# ----- Main -----
if __name__ == "__main__":
    print("Hello from the utils module")
    for d in paths.__dict__:
        print(f"{d}: {getattr(paths, d)}")

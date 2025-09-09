from enum import Enum
import datetime
import json
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
if "QUIZSERVER_ROOT" not in os.environ:
    os.environ["QUIZSERVER_ROOT"] = str(pathlib.Path(__file__).parent.parent.resolve().as_posix())
dotenv.load_dotenv()


# resolve paths
class paths:
    cwd = pathlib.Path(os.getenv("QUIZSERVER_ROOT")).resolve()
    appRoot = pathlib.Path(os.getenv("QUIZSERVER_APP_ROOT")).resolve()
    cfgRoot = pathlib.Path(os.getenv("QUIZSERVER_CFG_ROOT")).resolve()
    dataRoot = pathlib.Path(os.getenv("QUIZSERVER_DATA_ROOT")).resolve()
    clientRoot = pathlib.Path(os.getenv("QUIZSERVER_CLIENT_ROOT")).resolve()
    searchRoot = pathlib.Path(os.getenv("QUIZSERVER_SEARCH_ROOT")).resolve()
    adminRoot = pathlib.Path(os.getenv("QUIZSERVER_ADMIN_ROOT")).resolve()


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
    currentQuizRound: int = 1
    phase: QuizPhases = QuizPhases.IDLE

    @classmethod
    def formatNextPhaseChangeAt(cls) -> str:
        """Returns the formatted nextQuizAt value."""
        return cls.nextPhaseChangeAt.isoformat(timespec="milliseconds")

    @classmethod
    def getNextPhase(cls) -> QuizPhases:
        return {QuizPhases.IDLE: QuizPhases.RUNNING, QuizPhases.RUNNING: QuizPhases.SCORING, QuizPhases.SCORING: QuizPhases.IDLE}[cls.phase]

    @classmethod
    async def updateState(cls, *, nextPhase: QuizPhases = None, nextPhaseChangeAt: datetime.datetime = None, newQuizRound: int = None):
        # Validate incoming data
        if nextPhase and nextPhase != cls.getNextPhase():
            raise ValueError(f"Invalid phase change: {nextPhase.value} -> {cls.getNextPhase().value}")
        if nextPhaseChangeAt and nextPhaseChangeAt < datetime.datetime.now():
            raise ValueError(f"Invalid phase change: {nextPhaseChangeAt.isoformat(timespec='milliseconds')} -> {datetime.datetime.now().isoformat(timespec='milliseconds')}")
        if newQuizRound and (not str(newQuizRound).isdigit() or newQuizRound < 1 or newQuizRound > 100):
            raise ValueError(f"Invalid quiz round: {newQuizRound}")
        # Make the requested change(s)
        if nextPhase:
            cls.phase = nextPhase
            event = {QuizPhases.IDLE: "resultsReady", QuizPhases.RUNNING: "quizStarted", QuizPhases.SCORING: "quizEnded"}[nextPhase]
            _logger.debug(f"Sending event {event} to clients with data: {str({"nextPhaseChangeAt": cls.formatNextPhaseChangeAt()})}")
            await wsUtils.broadcastToClients(event, {"nextPhaseChangeAt": cls.formatNextPhaseChangeAt()})
        if nextPhaseChangeAt:
            cls.nextPhaseChangeAt = nextPhaseChangeAt
        if newQuizRound:
            cls.currentQuizRound = newQuizRound
        if nextPhase or nextPhaseChangeAt or newQuizRound:
            await wsUtils.broadcastToAdmins("stateChanged", {})


class Localisation:
    _locals: dict[str, dict[str, str]] = {
        "test_name": {
            "hu": "Teszt",
            "en": "Test",
        },
        "test_legend": {
            "hu": "Kutatók éjszakája",
            "en": "Researchers’ Night",
        },
        "teamname": {
            "hu": "Csapatnév",
            "en": "Team name",
        },
        "instruction": {
            "hu": "Írd be minden épület neve mellé azt a számot,<br>ami a kiállításon a makettje mellett látható!",
            "en": "Next to each building’s name write the number<br>that is shown beside its model in the exhibition!",
        },
        "questionCol_name_name": {
            "hu": "Név",
            "en": "Name",
        },
        "questionCol_location_name": {
            "hu": "Elhelyezkedés",
            "en": "Location",
        },
        "questionCol_answer_name": {
            "hu": "Válasz",
            "en": "Answer",
        },
        "score_name": {
            "hu": "Pontszám",
            "en": "Score",
        },
        "submittedAt_name": {
            "hu": "Leadva",
            "en": "Submitted at",
        },
    }

    def __init__(self) -> str:
        self._logger = _logger
        self.lang = None

    def setlang(self, lang: QuizLanguages):
        self.lang = lang.value

    def getlang(self):
        return self.lang

    def __call__(self, key: str):
        if not self.lang:
            raise RuntimeError("Language not set")
        if not self._locals.get(key):
            self._logger.warning(f"Translator: unknown key: {key}")
            return f"<{key}>"
        return self._locals.get(key)[self.lang]


# ----- data loaders -----
if (path := pathlib.Path(paths.dataRoot / "CodewordParts.json").resolve()).exists():
    try:
        with open(path, "r", encoding="utf-8") as f:
            codewordParts: dict[str, dict[str, list[str]]] = json.load(f)
        for lang in QuizLanguages:
            if not codewordParts.get(lang.value):
                raise ValueError(f"Missing language {lang.value} in CodewordParts.json file")
            if not codewordParts[lang.value].get("adjectives"):
                raise ValueError(f"Missing adjectives in {lang.value} language in CodewordParts.json file")
            if not codewordParts[lang.value].get("nouns"):
                raise ValueError(f"Missing nouns in {lang.value} language in CodewordParts.json file")
            if not all([isinstance(part, str) for part in codewordParts[lang.value]["adjectives"] + codewordParts[lang.value]["nouns"]]):
                raise ValueError(f"Non-string parts in {lang.value} language in CodewordParts.json file")
    except json.JSONDecodeError:
        raise ValueError("Invalid CodewordParts.json file")
else:
    raise FileNotFoundError("CodewordParts.json file not found")


# ---------------------------
# -------- FUNCTIONS --------
# ---------------------------
# ----- Converters -----
def convertToQuizLanguage(lang) -> QuizLanguages | None:
    return lang in QuizLanguages and QuizLanguages(lang) or None


def convertToQuizType(quizType) -> QuizTypes | None:
    return quizType in QuizTypes and QuizTypes(quizType) or None


def convertToQuizSize(size) -> QuizSizes | None:
    return str(size).isdigit() and int(size) in QuizSizes and QuizSizes(int(size)) or None


def convertToQuizPhase(phase) -> QuizPhases | None:
    return phase in QuizPhases and QuizPhases(phase) or None


# ----- Generators -----
def getNewTeamID(type: QuizTypes, lang: str = None, teamName: str = None):
    """Generate a new unique identifier and a codeword for digital quizzes."""
    if type == QuizTypes.DIGITAL:
        # generating from 5000000000 to 9999999999
        if not lang or not convertToQuizLanguage(lang):
            raise ValueError("Parameter lang is required for digital quizzes")
        if not teamName:
            raise ValueError("Parameter teamName is required for digital quizzes")
        while True:
            uuid = random.randint(int(5e9), int(1e10 - 1))
            codeword = random.choice(codewordParts[lang]["adjectives"]) + " " + random.choice(codewordParts[lang]["nouns"])
            if quizDB.cursor.execute("SELECT count(id) FROM teams WHERE id=(?) OR (teamname=(?) AND codeword='(?)');", (uuid, teamName, codeword)).fetchone()[0] == 0:
                return (uuid, codeword)
    elif type == QuizTypes.PAPER:
        # generating from 1000000000 to 4999999999
        while True:
            uuid = random.randint(int(1e9), int(5e9 - 1))
            if quizDB.cursor.execute("SELECT count(id) FROM teams WHERE id=(?);", (uuid,)).fetchone()[0] == 0:
                return (uuid, None)
    else:
        raise ValueError(f"Invalid quizType {type}")


# ----- Main -----
if __name__ == "__main__":
    print("Hello from the utils module")
    for d in paths.__dict__:
        print(f"{d}: {getattr(paths, d)}")

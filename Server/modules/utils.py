import logging

_logger = logging.getLogger(__name__)
_logger.info(f"Importing {__name__}...")


from enum import Enum
import datetime
import dotenv
import json
import os
import pathlib
import quizDB
import random
import wsUtils


# get filepath for determining the root of the program
# this file is supposed to be in <root>/modules
if "QUIZSERVER_ROOT" not in os.environ:
    _logger.debug("QUIZSERVER_ROOT not set, deriving from file location")
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


# initialize database
quizDB = quizDB.QuizDB(paths.dataRoot)
_logger.info(f"quizDB initialized with dataRoot={paths.dataRoot}")


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


class TeamIDLimits(Enum):
    """Limits for teamIDs.
    - `DIGITAL_MAX: 9999999999`
    - `DIGITAL_MIN: 5000000000`
    - `PAPER_MAX: 4999999999`
    - `PAPER_MIN: 1000000000`
    - `MAX: 9999999999`
    - `MIN: 1000000000`
    """

    DIGITAL_MAX = int(1e10 - 1)
    DIGITAL_MIN = int(5e9)
    PAPER_MAX = int(5e9 - 1)
    PAPER_MIN = int(1e9)
    MAX = int(1e10 - 1)
    MIN = int(1e9)


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
    currentQuizRound: int = 2
    phase: QuizPhases = QuizPhases.IDLE

    @classmethod
    def formatNextPhaseChangeAt(cls) -> str:
        """Returns the formatted nextQuizAt value."""
        return cls.nextPhaseChangeAt.isoformat(timespec="milliseconds")

    @classmethod
    def getNextPhase(cls) -> QuizPhases:
        next_phase = {QuizPhases.IDLE: QuizPhases.RUNNING, QuizPhases.RUNNING: QuizPhases.SCORING, QuizPhases.SCORING: QuizPhases.IDLE}[cls.phase]
        _logger.debug(f"Current phase={cls.phase.value}, nextPhase={next_phase.value}")
        return next_phase

    @classmethod
    async def updateState(cls, *, nextPhase: QuizPhases = None, nextPhaseChangeAt: datetime.datetime = None, newQuizRound: int = None):
        _logger.info(f"Updating state with nextPhase={nextPhase}, nextPhaseChangeAt={nextPhaseChangeAt}, newQuizRound={newQuizRound}")
        # Make the changes
        if nextPhase:
            _logger.debug(f"Updating nextPhase to {nextPhase.value}")
            cls.phase = nextPhase
        if nextPhaseChangeAt:
            _logger.debug(f"Updating nextPhaseChangeAt to {nextPhaseChangeAt.isoformat(timespec='milliseconds')}")
            cls.nextPhaseChangeAt = nextPhaseChangeAt
        if newQuizRound:
            _logger.debug(f"Updating currentQuizRound to {newQuizRound}")
            cls.currentQuizRound = newQuizRound
        # Signal the clients
        if nextPhase or nextPhaseChangeAt:
            event = nextPhase and ({QuizPhases.IDLE: "resultsReady", QuizPhases.RUNNING: "quizStarted", QuizPhases.SCORING: "quizEnded"}[nextPhase]) or "nextPhaseChangeAtChanged"
            _logger.debug(f"Broadcasting event '{event}' to clients with nextPhaseChangeAt={cls.formatNextPhaseChangeAt()}")
            await wsUtils.broadcastToClients(event, {"nextPhaseChangeAt": cls.formatNextPhaseChangeAt()})
        if nextPhase or nextPhaseChangeAt or newQuizRound:
            _logger.debug("Broadcasting stateChanged to admins")
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
        self._logger = logging.getLogger(__name__ + ".translator")
        self.lang = None

    def setlang(self, lang: QuizLanguages):
        self.lang = lang.value
        self._logger.debug(f"Language set to {self.lang}")

    def getlang(self):
        return self.lang

    def __call__(self, key: str):
        if not self.lang:
            raise RuntimeError("Language not set")
        if not self._locals.get(key):
            self._logger.warning(f"Translator: unknown key: {key}")
            return f"<{key}>"
        value = self._locals.get(key)[self.lang]
        self._logger.debug(f"Translation found for key={key}, lang={self.lang}, value={value}")
        return value


# ----- data loaders -----
if (path := pathlib.Path(paths.dataRoot / "CodewordParts.json").resolve()).exists():
    _logger.info(f"Loading codeword parts from {path}")
    try:
        with open(path, "r", encoding="utf-8") as f:
            codewordParts: dict[str, dict[str, list[str]]] = json.load(f)
        for lang in QuizLanguages:
            _logger.debug(
                f"Validating codewordParts for lang={lang.value}, adjectives={len(codewordParts.get(lang.value, {}).get('adjectives', []))}, nouns={len(codewordParts.get(lang.value, {}).get('nouns', []))}"
            )
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
    result = lang in QuizLanguages and QuizLanguages(lang) or None
    _logger.debug(f"convertToQuizLanguage input={lang}, result={result}")
    return result


def convertToQuizType(quizType) -> QuizTypes | None:
    result = quizType in QuizTypes and QuizTypes(quizType) or None
    _logger.debug(f"convertToQuizType input={quizType}, result={result}")
    return result


def convertToQuizSize(size) -> QuizSizes | None:
    result = str(size).isdigit() and int(size) in QuizSizes and QuizSizes(int(size)) or None
    _logger.debug(f"convertToQuizSize input={size}, result={result}")
    return result


def convertToQuizPhase(phase) -> QuizPhases | None:
    result = phase in QuizPhases and QuizPhases(phase) or None
    _logger.debug(f"convertToQuizPhase input={phase}, result={result}")
    return result


# ----- Generators -----
def getNewTeamID(quizType: QuizTypes, lang: str = None, teamName: str = None):
    """Generate a new unique identifier and a codeword for digital quizzes."""
    _logger.debug(f"Generating new team ID for type={quizType}, lang={lang}, teamName={teamName}")
    if quizType == QuizTypes.DIGITAL:
        if not lang or not convertToQuizLanguage(lang):
            raise ValueError("Parameter lang is required for digital quizzes")
        if not teamName:
            raise ValueError("Parameter teamName is required for digital quizzes")
        while True:
            uuid = random.randint(TeamIDLimits.DIGITAL_MIN, TeamIDLimits.DIGITAL_MAX)
            codeword = random.choice(codewordParts[lang]["adjectives"]) + " " + random.choice(codewordParts[lang]["nouns"])
            count = quizDB.cursor.execute(
                "SELECT count(id) FROM teams WHERE id=(?) OR (name=(?) AND codeword=(?));",
                (uuid, teamName, codeword),
            ).fetchone()[0]
            _logger.debug(f"Trying uuid={uuid}, codeword={codeword}: count={count}")
            if count == 0:
                _logger.info(f"Generated new digital team ID {uuid} with codeword={codeword}")
                return (uuid, codeword)
    elif quizType == QuizTypes.PAPER:
        while True:
            uuid = random.randint(TeamIDLimits.PAPER_MIN, TeamIDLimits.PAPER_MAX)
            count = quizDB.cursor.execute("SELECT count(id) FROM teams WHERE id=(?);", (uuid,)).fetchone()[0]
            _logger.debug(f"Trying uuid={uuid}, existingCount={count}")
            if count == 0:
                _logger.info(f"Generated new paper team ID {uuid}")
                return (uuid, None)
    else:
        raise ValueError(f"Invalid quizType {quizType}")


# ----- Main -----
if __name__ == "__main__":
    print("Hello from the utils module")
    for d in paths.__dict__:
        if not d.startswith("__"):
            print(f"{d}: {getattr(paths, d)}")
    print("Exiting...")

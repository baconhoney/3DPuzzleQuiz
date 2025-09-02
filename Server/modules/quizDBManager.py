from aiohttp import web
import datetime
import logging
import utils
import wsUtils


_quizDBcursor = utils.quizDB.cursor
_quizDBconnection = utils.quizDB.connection
_quizState = utils.QuizState
_logger = logging.getLogger(__name__)


class InvalidParameterError(Exception):
    def __init__(self, message: str):
        _logger.error("InvalidParameterError: " + message)
        super().__init__("InvalidParameterError: " + message)


# -------------------
# ----- GETTERS -----
# -------------------
async def getQuestions(lang, size) -> list[dict[str, str | int]]:
    """client side"""
    if not lang:
        raise InvalidParameterError(f"Missing language parameter")
    if not size:
        raise InvalidParameterError(f"Missing size parameter")
    if utils.convertToQuizLanguage(lang) is None:
        raise InvalidParameterError(f"Invalid language: {lang}")
    if utils.convertToQuizSize(size) is None:
        raise InvalidParameterError(f"Invalid size: {size}")
    quizRound = (int(size) == utils.QuizSizes.SIZE_20.value) and _quizState.currentQuizRound or -1  # -1 -> SIZE_100 quiz
    rawQuizdata: list[list[str | int]] = utils.quizDB.cursor.execute(
        f"SELECT buildings.id, buildings.name_{lang}, buildings.location_{lang} \
        FROM buildings JOIN quizzes ON buildings.id = quizzes.building_id \
        WHERE quizzes.quiz_round = {quizRound} \
        ORDER BY buildings.name_{lang};"
    ).fetchall()
    return [{"id": entry[0], "name": entry[1], "location": entry[2]} for entry in rawQuizdata]


async def getAnswers(teamID: int) -> dict[str, str | int | list[dict[str, str | int]]]:
    """client side"""
    if not teamID:
        raise InvalidParameterError(f"Missing teamID parameter")
    res = utils.quizDB.cursor.execute(f"SELECT name, language, score, submitted_at FROM teams WHERE teams.id = {teamID};").fetchone()
    if not res:
        raise InvalidParameterError(f"Team with ID {teamID} not found")
    lang: str = res[1]
    score: int = res[2]
    submittedAt: str = res[3]
    rawData: list[list[str | int]] = _quizDBcursor.execute(
        f"SELECT buildings.name_{lang}, buildings.location_{lang}, answers.answer, CASE WHEN buildings.answer = answers.answer THEN 1 ELSE 0 END \
        FROM answers JOIN buildings ON answers.building_id = buildings.id \
        WHERE answers.team_id = {teamID} \
        ORDER BY buildings.name_{lang} ASC;"
    ).fetchall()
    return {
        "score": score,
        "submittedAt": submittedAt,
        "quizdata": [{"name": entry[0], "location": entry[1], "answer": entry[2], "correct": bool(entry[3])} for entry in rawData],
    }


async def getLeaderboard(*, size: int = None, quizRound: int = None) -> list[dict[str, str | int]]:
    """admin side"""
    if size and not utils.convertToQuizSize(size):
        raise InvalidParameterError(f"Invalid size parameter: '{size}'")
    res: list[list[str | int]] = utils.quizDB.cursor.execute(
        f"SELECT id, name, language, quiz_size, score, submitted_at FROM teams \
        WHERE quiz_round = {quizRound or utils.QuizState.currentQuizRound} {size and "AND quiz_size = " + str(size) or ""} \
        ORDER BY score DESC, submitted_at ASC;",
    ).fetchall()
    return res and [{"teamID": entry[0], "teamname": entry[1], "language": entry[2], "size": entry[3], "score": entry[4], "submittedAt": entry[5]} for entry in res] or []


async def getQuizDetails(teamID: int) -> dict[str, str | int | list[dict[str, str | int]]]:
    """admin side"""
    if not teamID:
        raise InvalidParameterError(f"Missing teamID parameter")
    res = utils.quizDB.cursor.execute(f"SELECT name, language, score, quiz_round, quiz_size, submitted_at FROM teams WHERE teams.id = {teamID};").fetchone()
    if not res:
        raise InvalidParameterError(f"Team with ID {teamID} not found")
    lang: str = res[1]
    quizRound = res[3]
    quizSize = res[4]
    rawData: list[list[str | int]] = _quizDBcursor.execute(
        f"SELECT buildings.id, buildings.name_{lang}, buildings.location_{lang}, answers.answer, CASE WHEN buildings.answer = answers.answer THEN 1 ELSE 0 END \
        FROM buildings JOIN quizzes ON buildings.id = quizzes.building_id \
        LEFT JOIN answers ON buildings.id = answers.building_id AND answers.team_id = {teamID} \
        WHERE quizzes.quiz_round = {quizSize == utils.QuizSizes.SIZE_20.value and quizRound or -1} \
        ORDER BY buildings.name_{lang} ASC;"
    ).fetchall()
    return {
        "teamname": res[0],
        "language": lang,
        "score": res[2],
        "submittedAt": res[5],
        "questions": [{"id": entry[0], "name": entry[1], "location": entry[2], "answer": entry[3], "correct": bool(entry[4])} for entry in rawData],
    }


async def checkIfSubmittedAtIsPresent(teamID: int) -> bool:
    """internal"""
    if not teamID:
        raise InvalidParameterError(f"Invalid teamID: {teamID}")
    res = _quizDBcursor.execute("SELECT id, submitted_at FROM teams WHERE id = (?);", (teamID,)).fetchone()
    if not res or not res[0] == teamID:
        raise InvalidParameterError(f"Team with ID {teamID} not found")
    return bool(res[1])


async def getAllBuildingData() -> list[dict[str, str | int | None]]:
    """utility"""
    localisedCols = ", ".join([f"name_{lang.value}, location_{lang.value}" for lang in utils.QuizLanguages])
    res = _quizDBcursor.execute(f"SELECT id, box, answer, type, {localisedCols} FROM buildings ORDER BY id;").fetchall()
    colHeaders = ["id", "box", "answer", "type"] + localisedCols.split(", ")
    return [dict(zip(colHeaders, entry)) for entry in res]


# -------------------
# ----- POSTERS -----
# -------------------
async def addEmptyTeamEntry(teamID: int, lang: str, size: int):
    """internal"""
    if not lang or utils.convertToQuizLanguage(lang) is None:
        raise InvalidParameterError(f"Invalid language: {lang}")
    if not size or utils.convertToQuizSize(size) is None:
        raise InvalidParameterError(f"Invalid size: {size}")
    if _quizDBcursor.execute("SELECT count(id) FROM teams WHERE id = (?);", (teamID,)).fetchone()[0] > 0:
        raise RuntimeError(f"Team with ID {teamID} already exists")
    _quizDBcursor.execute(
        "INSERT INTO teams (id, language, quiz_round, quiz_size) VALUES (?, ?, ?, ?);",
        (teamID, lang, utils.QuizState.currentQuizRound, size),
    )
    _quizDBconnection.commit()
    await wsUtils.broadcastToAdmins("leaderboardUpdated", {})


async def updateSubmittedAt(teamID: int):
    """internal"""
    if not teamID or teamID >= int(5e9):
        raise InvalidParameterError(f"Invalid teamID for paper-quiz: {teamID}")
    _quizDBcursor.execute(
        "UPDATE teams SET submitted_at = (?) WHERE id = (?);",
        (datetime.datetime.now().isoformat(timespec="milliseconds"), teamID),
    )
    _quizDBconnection.commit()
    await wsUtils.broadcastToAdmins("leaderboardUpdated", {})


async def uploadAnswers(mode: str = None, *, teamID: int = None, name: str = None, lang: str = None, answers: list[dict[str, int]] = None):
    """mode = `paper-uploadAnswers` or `digital-uploadFull`
    client+admin side"""
    if mode == "paper-uploadAnswers" or mode == "digital-uploadFull":
        if (
            teamID
            and name
            and (mode == "digital-uploadFull" and lang and utils.convertToQuizLanguage(lang) or (mode == "paper-uploadAnswers" and not lang))
            and answers
            and isinstance(answers, list)
            and len(answers) in utils.QuizSizes
            and all((isinstance(answer, dict) and "id" in answer and "answer" in answer) for answer in answers)
        ):
            # uploading either paper quiz answers or full digital quiz
            teamIDCount = _quizDBcursor.execute("SELECT count(id) FROM teams WHERE teams.id = (?);", (teamID,)).fetchone()[0]
            if teamIDCount > 1:
                raise RuntimeError(f"Too many teamIDs of {teamID}: {teamIDCount}")
            _quizDBcursor.executemany(
                "INSERT INTO answers (team_id, building_id, answer) VALUES (?, ?, ?);",
                ((teamID, answer["id"], answer["answer"]) for answer in answers),
            )
            _quizDBconnection.commit()
            score = _quizDBcursor.execute(
                "SELECT count(buildings.id) FROM buildings JOIN answers ON buildings.id = answers.building_id \
                    WHERE answers.team_id = (?) AND answers.answer = buildings.answer;",
                (teamID,),
            ).fetchone()[0]
            if mode == "paper-uploadAnswers":  # uploading paper quiz answers
                if teamID >= int(5e9):
                    raise InvalidParameterError(f"Invalid teamID for paper-quiz: {teamID}")
                _quizDBcursor.execute(
                    "UPDATE teams SET name = (?), score = (?) WHERE id = (?);",
                    (name, score, teamID),
                )
                if not _quizDBcursor.rowcount == 1:
                    raise RuntimeError(f"Failed to update team {teamID}, name '{name}', lang {lang.value}, {str(answers)}")
            else:  # uploading full digital quiz
                if teamID < int(5e9):
                    raise InvalidParameterError(f"Invalid teamID for digital-quiz: {teamID}")
                _quizDBcursor.execute(
                    f"INSERT INTO teams (id, name, language, quiz_round, quiz_size, score, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?);",
                    (teamID, name, lang, _quizState.currentQuizRound, len(answers), score, datetime.datetime.now().isoformat(timespec="milliseconds")),
                )
            _quizDBconnection.commit()
            await wsUtils.broadcastToAdmins("leaderboardUpdated", {})
        else:
            raise InvalidParameterError(f"Invalid parameters: teamID={teamID}, name={name}, lang={lang}, answers={answers}; all 4 parameters are required for this mode")
    else:
        raise RuntimeError(f"Invalid mode: {mode}")

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
    """
    Client-side

    Returns
    ```
    [
        {
            "id": int,
            "name": str,
            "location": str
        },
        ...
    ]
    ```
    """
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
    """
    Client-side

    Returns
    ```
    {
        "score": int,
        "submittedAt": str,
        "quizdata": [
            {
                "name": str,
                "location": str,
                "answer": str,
                "correct": bool
            },
            ...
        ]
    }
    ```
    """
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


async def getLeaderboard(*, size: str = None, quizRound: str = None) -> list[dict[str, str | int]]:
    """
    Admin-side

    @param size: QuizSize.value | None -> filters leaderboard by size when provided
    @param quizRound: int | None -> filters leaderboard by round when provided (1+ -> given round, 0 -> current round, None -> all rounds)

    Returns
    ```
    [
        {
            "teamID": int,
            "teamname": str,
            "codeword": str,
            "language": str,
            "size": int,
            "score": int,
            "submittedAt": str
        },
        ...
    ]
    ```
    """
    # _logger.debug(f"getLeaderboard(size={size}, quizRound={quizRound})")
    if size is not None and not utils.convertToQuizSize(size):
        raise InvalidParameterError(f"Invalid size parameter: '{size}' type {type(size)}")
    if quizRound is not None and not (quizRound.isdigit() and int(quizRound) >= 0):
        raise InvalidParameterError(f"Invalid quizRound parameter: '{quizRound}' type {type(quizRound)}")
    quizRound = quizRound and int(quizRound)

    cols = {"id": "teamID", "name": "teamname", "codeword": "codeword", "language": "language", "quiz_size": "size", "score": "score", "submitted_at": "submittedAt"}

    conditions = []
    if quizRound is not None:
        # if round = 0  -> use current round, else use provided value
        conditions.append(f"quiz_round = {quizRound > 0 and quizRound or utils.QuizState.currentQuizRound}")
    else:
        # if round = -1 -> show all rounds
        pass
    if size:
        # if size -> use provided value
        conditions.append(f"quiz_size = {size}")
    else:
        # if size = None -> show all sizes
        pass

    res: list[list[str | int]] = utils.quizDB.cursor.execute(
        f"SELECT {', '.join(cols.keys())} FROM teams \
        {conditions and ("WHERE " + ' AND '.join(conditions))} \
        ORDER BY score DESC NULLS LAST, submitted_at ASC NULLS LAST;",
    ).fetchall()
    # _logger.debug(f"Query result: {res}")
    return res and [dict(zip(cols.values(), entry)) for entry in res] or []


async def getQuizDetails(teamID: int) -> dict[str, str | int | list[dict[str, str | int]]]:
    """
    Admin-side

    Returns
    ```
    {
        "teamname": str,
        "codeword": str,
        "language": str,
        "score": int,
        "submittedAt": str,
        "questions": [
            {
                "id": int,
                "name": str,
                "location": str,
                "answer": str,
                "correct": bool
            },
            ...
        ]
    }
    ```
    """
    if not teamID:
        raise InvalidParameterError(f"Missing teamID parameter")
    cols = ["name", "codeword", "language", "score", "quiz_round", "quiz_size", "submitted_at"]
    res = dict(zip(cols, utils.quizDB.cursor.execute(f"SELECT {', '.join(cols)} FROM teams WHERE teams.id = {teamID};").fetchone()))
    if not res:
        raise InvalidParameterError(f"Team with ID {teamID} not found")
    lang: str = res["language"]
    quizRound = res["quiz_round"]
    quizSize = res["quiz_size"]
    rawData: list[list[str | int]] = _quizDBcursor.execute(
        f"SELECT buildings.id, buildings.name_{lang}, buildings.location_{lang}, answers.answer, CASE WHEN buildings.answer = answers.answer THEN 1 ELSE 0 END \
        FROM buildings JOIN quizzes ON buildings.id = quizzes.building_id \
        LEFT JOIN answers ON buildings.id = answers.building_id AND answers.team_id = {teamID} \
        WHERE quizzes.quiz_round = {quizSize == utils.QuizSizes.SIZE_20.value and quizRound or -1} \
        ORDER BY buildings.name_{lang} COLLATE LANG_HU ASC;"
    ).fetchall()
    return {
        "teamname": res["name"],
        "codeword": res["codeword"],
        "language": lang,
        "score": res["score"],
        "submittedAt": res["submitted_at"],
        "questions": [{"id": entry[0], "name": entry[1], "location": entry[2], "answer": entry[3], "correct": bool(entry[4])} for entry in rawData],
    }


async def checkIfTeamExists(teamID: int) -> bool:
    """
    Internal

    Returns `True` if team exists, else `False`
    """
    _logger.debug(f"Checking if team with ID {teamID} exists...")
    if not teamID or not isinstance(teamID, int):
        raise InvalidParameterError("TeamID missing or invalid")
    res = _quizDBcursor.execute("SELECT id FROM teams WHERE id = (?);", (teamID,)).fetchone()
    _logger.debug(f"Query result: {res}")
    return res and len(res) == 1 and res[0] == teamID


async def checkIfSubmittedAtIsPresent(teamID: int) -> bool:
    """
    Internal

    Returns `True` if submitted_at is present, else `False`
    """
    if not teamID:
        raise InvalidParameterError(f"Invalid teamID: {teamID}")
    res: list[int | str | None] = _quizDBcursor.execute("SELECT id, submitted_at FROM teams WHERE id = (?);", (teamID,)).fetchone()
    if not res or not res[0] == teamID:
        raise InvalidParameterError(f"Team with ID {teamID} not found")
    # print(f"Checkdata: {res}")
    return bool(res[1])


async def getAllBuildingData() -> list[dict[str, str | int | None]]:
    """
    Utility

    Returns
    ```
    [
        {
            "id": int,
            "box": int,
            "answer": str,
            "type": int,
            "name_*": str,
            "location_*": str
        },
        ...
    ]
    ```
    where `*` is the available languages
    """
    colHeaders = ["id", "box", "answer", "type"] + [f"name_{lang.value}, location_{lang.value}" for lang in utils.QuizLanguages]
    colsString = ", ".join(colHeaders)
    res = _quizDBcursor.execute(f"SELECT {colsString} FROM buildings ORDER BY id;").fetchall()
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


async def uploadAnswers(mode: str = None, *, teamID: int = None, name: str = None, codeword: str = None, lang: str = None, answers: list[dict[str, int]] = None):
    """mode = `paper-uploadAnswers` or `digital-uploadFull`
    client+admin side"""
    if mode == "paper-uploadAnswers" or mode == "digital-uploadFull":
        # _logger.debug(f"uploadAnswers(mode={mode}, teamID={teamID}, name={name}, codeword={codeword}, lang={lang}, len of answers={len(answers)})")
        if (
            teamID
            and name
            and ((mode == "digital-uploadFull" and codeword) or (mode == "paper-uploadAnswers" and not codeword))
            and ((mode == "digital-uploadFull" and lang and utils.convertToQuizLanguage(lang)) or (mode == "paper-uploadAnswers" and not lang))
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
                    f"INSERT INTO teams (id, name, codeword, language, quiz_round, quiz_size, score, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
                    (teamID, name, codeword, lang, _quizState.currentQuizRound, len(answers), score, datetime.datetime.now().isoformat(timespec="milliseconds")),
                )
            _quizDBconnection.commit()
            await wsUtils.broadcastToAdmins("leaderboardUpdated", {})
        else:
            raise InvalidParameterError(f"Invalid parameters: teamID={teamID}, name={name}, codeword={codeword}, lang={lang}, len of answers={len(answers)}; all are required")
    else:
        raise RuntimeError(f"Invalid mode: {mode}")

import logging

_logger = logging.getLogger(__name__)
_logger.info(f"Importing {__name__}...")


import datetime
import utils
import wsUtils


_quizDBcursor = utils.quizDB.cursor
_quizDBconnection = utils.quizDB.connection
_quizState = utils.QuizState


class InvalidParameterError(Exception):
    def __init__(self, message: str):
        _logger.error(f"InvalidParameterError: {message}")
        super().__init__(f"InvalidParameterError: {message}")


# -------------------
# ----- GETTERS -----
# -------------------
async def getQuestions(lang: str, size: int) -> list[dict[str, str | int]]:
    _logger.debug(f"getQuestions called with lang={lang}, size={size}")
    if utils.convertToQuizLanguage(lang) is None:
        raise InvalidParameterError(f"Invalid language: {lang or '<missing>'}")
    if utils.convertToQuizSize(size) is None:
        raise InvalidParameterError(f"Invalid size: {size or '<missing>'}")
    quizRound = (int(size) == utils.QuizSizes.SIZE_20.value and utils.QuizState.currentQuizRound) or -1
    rawQuizdata: list[list[str | int]] = utils.quizDB.cursor.execute(
        f"""SELECT buildings.id, buildings.name_{lang}, buildings.location_{lang} 
            FROM buildings 
            JOIN quizzes ON buildings.id = quizzes.building_id 
            WHERE quizzes.quiz_round = {quizRound} 
            ORDER BY buildings.name_{lang};"""
    ).fetchall()
    _logger.debug(f"Data for lang={lang}, quizRound={quizRound}: {rawQuizdata}")
    return [{"id": entry[0], "name": entry[1], "location": entry[2]} for entry in rawQuizdata]


async def getAnswers(teamID: int) -> dict[str, str | int | list[dict[str, str | int]]]:
    _logger.debug(f"getAnswers called with teamID={teamID}")
    if not teamID:
        raise InvalidParameterError("Missing teamID parameter")
    res = utils.quizDB.cursor.execute(f"SELECT name, language, score, submitted_at FROM teams WHERE teams.id = {teamID};").fetchone()
    if not res:
        raise InvalidParameterError(f"Team with ID {teamID} not found")
    lang, score, submittedAt = res[1], res[2], res[3]
    rawData: list[list[str | int]] = _quizDBcursor.execute(
        f"""SELECT buildings.name_{lang}, buildings.location_{lang}, answers.answer, CASE WHEN buildings.answer = answers.answer THEN 1 ELSE 0 END 
            FROM answers 
            JOIN buildings ON answers.building_id = buildings.id 
            WHERE answers.team_id = {teamID} 
            ORDER BY buildings.name_{lang} ASC;"""
    ).fetchall()
    _logger.debug(f"Data for teamID={teamID}: score={score}, submittedAt={submittedAt} rawData={rawData}")
    return {
        "score": score,
        "submittedAt": submittedAt,
        "quizdata": [{"name": entry[0], "location": entry[1], "answer": entry[2], "correct": bool(entry[3])} for entry in rawData],
    }


async def getLeaderboard(*, size: str = None, quizRound: str = None) -> list[dict[str, str | int]]:
    _logger.debug(f"getLeaderboard called with size={size}, quizRound={quizRound}")
    if size and not utils.convertToQuizSize(size):
        raise InvalidParameterError(f"Invalid size parameter: '{size}' type {type(size)}")
    if quizRound and not (quizRound.isdigit() and int(quizRound) >= 0):
        raise InvalidParameterError(f"Invalid quizRound parameter: '{quizRound}' type {type(quizRound)}")
    quizRound = int(quizRound) if quizRound else None
    cols = {
        "id": "teamID",
        "name": "teamname",
        "codeword": "codeword",
        "language": "language",
        "quiz_size": "size",
        "score": "score",
        "submitted_at": "submittedAt",
    }
    conditions = []
    if quizRound is not None:
        current_round = utils.QuizState.currentQuizRound if quizRound == 0 else quizRound
        conditions.append(f"quiz_round = {current_round}")
    if size:
        conditions.append(f"quiz_size = {size}")
    res = utils.quizDB.cursor.execute(
        f"""SELECT {', '.join(cols.keys())} 
            FROM teams 
            {('WHERE ' + ' AND '.join(conditions)) if conditions else ''} 
            ORDER BY score DESC NULLS LAST, submitted_at ASC NULLS LAST;"""
    ).fetchall()
    _logger.debug(f"Data for size={size}, quizRound={quizRound}: {res}")
    return [dict(zip(cols.values(), entry)) for entry in res]


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
                "correct": bool | None
            },
            ...
        ]
    }
    ```
    """
    _logger.debug(f"getQuizDetails called with teamID={teamID}")
    if not teamID:
        raise InvalidParameterError(f"Missing teamID parameter")
    cols = ["name", "codeword", "language", "score", "quiz_round", "quiz_size", "submitted_at"]
    row = utils.quizDB.cursor.execute(f"SELECT {', '.join(cols)} FROM teams WHERE teams.id = {teamID};").fetchone()
    if not row:
        raise InvalidParameterError(f"Team with ID {teamID} not found")
    res = dict(zip(cols, row))
    _logger.debug(f"Team data retrieved: {res}")
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
    _logger.debug(f"Retrieved {res} with {len(rawData)} questions for teamID {teamID}")
    return {
        "teamname": res["name"],
        "codeword": res["codeword"],
        "language": lang,
        "score": res["score"],
        "submittedAt": res["submitted_at"],
        "questions": [{"id": entry[0], "name": entry[1], "location": entry[2], "answer": entry[3], "correct": (bool(entry[4]) if entry[3] is not None else None )} for entry in rawData],
    }


async def checkIfTeamExists(teamID: int) -> bool:
    _logger.debug(f"Checking if team exists for teamID={teamID}")
    if not teamID or not isinstance(teamID, int):
        raise InvalidParameterError(f"Invalid teamID parameter: '{teamID}' type {type(teamID)}")
    res = _quizDBcursor.execute("SELECT id FROM teams WHERE id = ?;", (teamID,)).fetchone()
    exists = bool(res and res[0] == teamID)
    _logger.debug(f"TeamID={teamID} exists={exists}")
    return exists


async def getAllBuildingData() -> list[dict[str, str | int | None]]:
    _logger.debug("Fetching all building data")
    colHeaders = ["id", "box", "answer", "type"]
    for lang in utils.QuizLanguages:
        colHeaders.extend([f"name_{lang.value}", f"location_{lang.value}"])
    colsString = ", ".join(colHeaders)
    res = _quizDBcursor.execute(f"SELECT {colsString} FROM buildings ORDER BY id;").fetchall()
    _logger.debug(f"Fetched {len(res)} building entries")
    return [dict(zip(colHeaders, entry)) for entry in res]


# -------------------
# ----- POSTERS -----
# -------------------
async def addEmptyTeamEntry(teamID: int, lang: str, size: int):
    """internal"""
    _logger.debug(f"Adding empty team entry for teamID={teamID}")
    if not teamID or not isinstance(teamID, int):
        raise InvalidParameterError(f"Invalid teamID: {teamID or '<missing>'}")
    if utils.convertToQuizLanguage(lang) is None:
        raise InvalidParameterError(f"Invalid language: {lang or '<missing>'}")
    if utils.convertToQuizSize(size) is None:
        raise InvalidParameterError(f"Invalid size: {size or '<missing>'}")
    count = _quizDBcursor.execute("SELECT count(id) FROM teams WHERE id = (?);", (teamID,)).fetchone()[0]
    if count > 0:
        raise RuntimeError(f"Team with ID {teamID} already exists")
    _quizDBcursor.execute("INSERT INTO teams (id, language, quiz_round, quiz_size) VALUES (?, ?, ?, ?);", (teamID, lang, utils.QuizState.currentQuizRound, size))
    _quizDBconnection.commit()
    _logger.info(f"Team {teamID} with language={lang} and size={size} added successfully")
    await wsUtils.broadcastToAdmins("leaderboardUpdated", {})


async def updateSubmittedAt(teamID: int):
    """internal"""
    _logger.debug(f"Updating submitted_at for teamID={teamID}")
    if not teamID or teamID >= int(5e9):
        raise InvalidParameterError(f"Invalid teamID for paper-quiz: {teamID or '<missing>'}")
    timestamp = datetime.datetime.now().isoformat(timespec="milliseconds")
    _quizDBcursor.execute("UPDATE teams SET submitted_at = (?) WHERE id = (?);", (timestamp, teamID))
    _quizDBconnection.commit()
    _logger.info(f"Field 'submitted_at' updated for team {teamID} to {timestamp}")
    await wsUtils.broadcastToAdmins("leaderboardUpdated", {})


async def uploadAnswers(mode: str = None, *, teamID: int = None, name: str = None, codeword: str = None, lang: str = None, answers: list[dict[str, int]] = None):
    """mode = `paper-uploadAnswers` or `digital-uploadFull` client+admin side"""
    _logger.debug(f"Uploading answers in mode={mode} for teamID={teamID}: name={name}, codeword={codeword}, lang={lang}, len(answers)={len(answers) if answers else None}")
    if mode not in {"paper-uploadAnswers", "digital-uploadFull"}:
        raise RuntimeError(f"Invalid mode: {mode}")
    if (
        teamID
        and name
        and ((mode == "digital-uploadFull" and codeword) or (mode == "paper-uploadAnswers" and not codeword))
        and ((mode == "digital-uploadFull" and lang and utils.convertToQuizLanguage(lang)) or (mode == "paper-uploadAnswers" and not lang))
        and answers
        and isinstance(answers, list)
        and len(answers) in utils.QuizSizes
        and all(isinstance(answer, dict) and "id" in answer and "answer" in answer for answer in answers)
    ):
        count = _quizDBcursor.execute("SELECT count(id) FROM teams WHERE teams.id = (?);", (teamID,)).fetchone()[0]
        if count > 1:
            raise RuntimeError(f"Too many teamIDs of {teamID}: {count}")
        _quizDBcursor.executemany(
            "INSERT INTO answers (team_id, building_id, answer) VALUES (?, ?, ?);",
            ((teamID, answer["id"], answer["answer"]) for answer in answers),
        )
        _quizDBconnection.commit()
        _logger.debug(f"Inserted {len(answers)} answers for team {teamID}")
        score = _quizDBcursor.execute(
            "SELECT count(buildings.id) FROM buildings JOIN answers ON buildings.id = answers.building_id " "WHERE answers.team_id = (?) AND answers.answer = buildings.answer;",
            (teamID,),
        ).fetchone()[0]
        _logger.debug(f"Calculated score={score} for team {teamID}")

        if mode == "paper-uploadAnswers":
            # paper-uploadAnswers
            if teamID >= int(5e9):
                raise InvalidParameterError(f"Invalid teamID for paper-quiz: {teamID}")
            _quizDBcursor.execute(
                "UPDATE teams SET name = (?), score = (?) WHERE id = (?);",
                (name, score, teamID),
            )
            if not _quizDBcursor.rowcount == 1:
                raise RuntimeError(f"Failed to update team {teamID}, name '{name}', lang {lang}, {len(answers)}")
        else:
            # digital-uploadFull
            if teamID < int(5e9):
                raise InvalidParameterError(f"Invalid teamID for digital-quiz: {teamID}")
            _quizDBcursor.execute(
                "INSERT INTO teams (id, name, codeword, language, quiz_round, quiz_size, score, submitted_at) " "VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
                (teamID, name, codeword, lang, _quizState.currentQuizRound, len(answers), score, datetime.datetime.now().isoformat(timespec="milliseconds")),
            )
        _quizDBconnection.commit()
        _logger.info(f"Team {teamID} successfully uploaded answers in mode={mode}: name={name}, codeword={codeword}, lang={lang}, score={score}, answers={len(answers)}")
        await wsUtils.broadcastToAdmins("leaderboardUpdated", {})
    else:
        raise InvalidParameterError(f"Invalid parameters: teamID={teamID}, name={name}, codeword={codeword}, lang={lang}, len of answers={len(answers)}; all are required")

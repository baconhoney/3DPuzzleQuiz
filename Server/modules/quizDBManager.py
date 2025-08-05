from aiohttp import web
import datetime
import logging
import utils


_quizDBcursor = utils.quizDB.cursor
_quizDBconnection = utils.quizDB.connection
_quizState = utils.QuizState
_logger = logging.getLogger(__name__)


# ----- GETTERS -----
def getQuestions(lang: utils.SupportedLanguages) -> dict[str, dict[str, str | int]]:
    if not lang or lang not in utils.SupportedLanguages:
        raise ValueError(f"Invalid language: {lang}")
    rawQuizdata: list[list[str | int]] = utils.quizDB.cursor.execute(
        f"SELECT buildings.id, buildings.name_{lang}, buildings.country_{lang}, buildings.city_{lang} \
        FROM buildings JOIN quizzes ON buildings.id = quizzes.building_id \
        WHERE quizzes.quiz_number = {_quizState.currentQuizNumber} \
        SORT BY buildings.name_{lang};"
    ).fetchall()
    return [{"id": entry[0], "name": entry[1], "country": entry[2], "city": entry[3]} for entry in rawQuizdata]


def getAnswers(teamID: int) -> dict[str, str | int | dict[str, dict[str, str | int | bool]]]:
    res = utils.quizDB.cursor.execute(f"SELECT language, score, submitted_at FROM teams WHERE teams.id = {teamID};").fetchone()
    if not res:
        raise web.HTTPNotFound(text=f"Team with ID {teamID} not found")
    lang, score, submittedAt = res
    rawData = (
        score,
        submittedAt,
        _quizDBcursor.execute(
            f"SELECT buildings.name_{lang}, buildings.country_{lang}, buildings.city_{lang}, answers.answer, \
            CASE WHEN buildings.answer = answers.answer THEN 1 ELSE 0 END \
            FROM answers JOIN buildings ON answers.building_id = buildings.id \
            WHERE answers.team_id = {teamID};"
        ).fetchall(),
    )
    return {
        "quizdata": {
            str(i): {
                "name": entry[0],
                "country": entry[1],
                "city": entry[2],
                "answers": entry[3],
                "correct": bool(entry[4]),
            }
            for i, entry in enumerate(rawData)
        },
        "score": score,
        "submittedAt": submittedAt,
    }


def getAllBuildingData():
    localisedCols = ", ".join([f"name_{lang.value}, country_{lang.value}, city_{lang.value}" for lang in utils.SupportedLanguages])
    res = utils.quizDB.cursor.execute(f"SELECT id, box, answer, {localisedCols} FROM buildings SORT BY id;").fetchall()
    colHeaders = ["id", "box", "answer"] + localisedCols.split(", ")
    return [dict(zip(colHeaders, entry)) for entry in res]


# ----- POSTERS -----
def uploadAnswers(teamID: int, name: str, lang: utils.SupportedLanguages, answers: dict[str, dict[str, int]]) -> None:
    try:  # catching all kinda errors cuz they shouldnt happen
        _quizDBcursor.executemany(
            f"INSERT INTO answers (team_id, building_id, answer) VALUES (?, ?, ?);",
            ((teamID, answer["building_id"], answer["answer"]) for answer in answers.values()),
        )
        _quizDBconnection.commit()
        score = _quizDBcursor.execute(
            f"SELECT count(answers.id) \
                FROM teams JOIN answers ON teams.id = answers.team_id JOIN buildings ON answers.building_id = buildings.id \
                WHERE teams.id = {teamID} AND buildings.answer = answers.answer;"
        ).fetchone()[0]
        _quizDBcursor.execute(
            f"INSERT INTO teams (id, name, language, quiz_number, score, submitted_at) VALUES (?, ?, ?, ?, ?);",
            (
                teamID,
                name,
                lang.value,
                _quizState.currentQuizNumber,
                score,
                datetime.datetime.now().isoformat(timespec="milliseconds"),
            ),
        )
        _quizDBconnection.commit()
    except Exception as e:
        _logger.error(f"Failed to upload answers: {e}")
        raise web.HTTPInternalServerError(text=f"Failed to upload answers: {e}")

import modules.utils as utils
import datetime
from aiohttp import web
import logging

quizDBcursor = utils.quizDB.cursor
quizDBconnection = utils.quizDB.connection
quizState = utils.QuizState
logger = logging.getLogger(__name__)


def getQuestions(lang: utils.SupportedLanguages) -> dict[str, dict[str, str | int]]:
    if not lang or lang not in utils.SupportedLanguages:
        raise ValueError(f"Invalid language: {lang}")
    rawQuizdata = utils.quizDB.cursor.execute(
        f"SELECT buildings.id, buildings.name_{lang}, buildings.country_{lang}, buildings.city_{lang} \
        FROM buildings JOIN quizzes ON buildings.id = quizzes.building_id \
        WHERE quizzes.quiz_number = {quizState.currentQuizNumber};"
    ).fetchall()
    return {
        str(i): {
            "id": entry[0],
            "name": entry[1],
            "country": entry[2],
            "city": entry[3],
        }
        for i, entry in enumerate(sorted(rawQuizdata, key=lambda x: x[1]))
    }


def uploadAnswers(teamID: int, name: str, lang: utils.SupportedLanguages, answers: dict[str, dict[str, int]]) -> None:
    try:  # catching all kinda errors cuz they shouldnt happen
        quizDBcursor.executemany(
            f"INSERT INTO answers (team_id, building_id, answer) VALUES (?, ?, ?);",
            ((teamID, answer["building_id"], answer["answer"]) for answer in answers.values()),
        )
        quizDBconnection.commit()
        score = quizDBcursor.execute(
            f"SELECT count(answers.id) \
                FROM teams JOIN answers ON teams.id = answers.team_id JOIN buildings ON answers.building_id = buildings.id \
                WHERE teams.id = {teamID} AND buildings.answer = answers.answer;"
        ).fetchone()[0]
        quizDBcursor.execute(
            f"INSERT INTO teams (id, name, language, quiz_number, score, submitted_at) VALUES (?, ?, ?, ?, ?);",
            (
                teamID,
                name,
                lang.value,
                quizState.currentQuizNumber,
                score,
                datetime.datetime.now().isoformat(timespec="milliseconds"),
            ),
        )
        quizDBconnection.commit()
    except Exception as e:
        logger.error(f"Failed to upload answers: {e}")
        raise web.HTTPInternalServerError(text=f"Failed to upload answers: {e}")


def getAnswers(teamID: int) -> dict[str, str | int | dict[str, dict[str, str | int | bool]]]:
    res = utils.quizDB.cursor.execute(f"SELECT language, score, submitted_at FROM teams WHERE teams.id = {teamID};").fetchone()
    if not res:
        raise web.HTTPNotFound(text=f"Team with ID {teamID} not found")
    lang, score, submittedAt = res
    rawData = (
        score,
        submittedAt,
        quizDBcursor.execute(
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




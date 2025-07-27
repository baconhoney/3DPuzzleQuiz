import datetime
import pathlib
import mimetypes
import random
import json
import dotenv
import QuizDB
import logging
import sys
import os
from enum import Enum
from aiohttp import web


os.environ["CWD"] = str(pathlib.Path(__file__).parent.resolve().as_uri())
dotenv.load_dotenv()


# create object for paths
class paths:
    cwd = pathlib.Path(os.getenv("CWD")).resolve()
    cfgRoot = pathlib.Path(os.getenv("CFG_ROOT")).resolve()
    dataRoot = pathlib.Path(os.getenv("DATA_ROOT")).resolve()
    clientRoot = pathlib.Path(os.getenv("CLIENT_ROOT")).resolve()
    searchRoot = pathlib.Path(os.getenv("SEARCH_ROOT")).resolve()
    adminRoot = pathlib.Path(os.getenv("ADMIN_ROOT")).resolve()


router = web.RouteTableDef()
quizDB = QuizDB.QuizDB(paths.dataRoot)
loggingLevel = "INFO"

SUPPORTED_LANGS = ["hu", "en"]


# -----------------------
# ------- ENUMS -------
# -----------------------
class QuizType(Enum):
    """Possible types of the quiz."""

    DIGITAL = 0
    PAPER = 1


class QuizPhases(Enum):
    """Possible phases of the quiz."""

    IDLE = "idle"
    RUNNING = "running"
    SCORING = "scoring"


# -----------------------
# ------- CLASSES -------
# -----------------------
class QuizState:
    nextQuizAt: datetime.datetime = datetime.datetime.now()
    currentQuizNumber: int = 2
    phase: QuizPhases = QuizPhases.IDLE
    _currentQuizdata: dict[str, dict[str, dict[str, str | int]]] = None

    @classmethod
    def formatNextQuizAt(cls) -> str:
        """Returns the formatted nextQuizAt value."""
        return cls.nextQuizAt.isoformat(timespec="milliseconds")


# ------------------------------
# ------- UTIL FUNCTIONS -------
# ------------------------------
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


# -------------------------------------
# ------- API HANDLER FUNCTIONS -------
# -------------------------------------
@router.get("/api/getQuestions")
async def getQuestionsHandler(request: web.Request):
    print(f"API GET request incoming: getQuestions")
    lang = request.query.get("lang")
    if not lang or lang not in SUPPORTED_LANGS:
        raise web.HTTPBadRequest(text=f"Value 'lang' is missing or invalid: {lang}")
    rawQuizdata: list[list[str | int]] = quizDB.cursor.execute(
        f"SELECT buildings.id, buildings.name_{lang}, buildings.country_{lang}, buildings.city_{lang} \
        FROM buildings JOIN quizzes ON buildings.id = quizzes.building_id \
        WHERE quizzes.quiz_number = {QuizState.currentQuizNumber};"
    ).fetchall()
    quizdata = {
        str(i): {
            "building_id": entry[0],
            "name": entry[1],
            "country": entry[2],
            "city": entry[3],
        }
        for i, entry in enumerate(sorted(rawQuizdata, key=lambda x: x[1]))
    }
    return web.json_response(quizdata)


@router.post("/api/uploadAnswers")
async def uploadAnswersHandler(request: web.Request):
    print("API POST request incoming: uploadAnswers")
    data: dict[str, str | dict[str, dict[str, int]]] = await request.json()
    if "name" not in data:
        raise web.HTTPBadRequest(text="Value 'name' is missing")
    if "lang" not in data or data["lang"] not in SUPPORTED_LANGS:
        raise web.HTTPBadRequest(text=f"Value 'lang' is invalid: {data.get('lang', '<missing>')}")
    if "answers" not in data:
        raise web.HTTPBadRequest(text="Value 'answers' is missing")
    teamID = getNewTeamID(QuizType.DIGITAL)
    try:  # catching all kinda errors cuz they shouldnt happen
        answers: dict[str, dict[str, int]] = data["answers"]
        quizDB.cursor.executemany(
            f"INSERT INTO answers (team_id, building_id, answer) VALUES (?, ?, ?);",
            ((teamID, answer["building_id"], answer["answer"]) for answer in answers.values()),
        )
        quizDB.connection.commit()
        score = quizDB.cursor.execute(
            f"SELECT count(answers.id) \
            FROM teams JOIN answers ON teams.id = answers.team_id JOIN buildings ON answers.building_id = buildings.id \
            WHERE teams.id = {teamID} AND buildings.answer = answers.answer;"
        ).fetchone()[0]
        quizDB.cursor.execute(
            f"INSERT INTO teams (id, name, language, quiz_number, score, submitted_at) \
                VALUES (?, ?, ?, ?, ?);",
            (
                teamID,
                data["name"],
                data["lang"],
                QuizState.currentQuizNumber,
                score,
                datetime.datetime.now().isoformat(timespec="milliseconds"),
            ),
        )
        quizDB.connection.commit()
        raise web.HTTPNoContent()
    except Exception as e:
        logging.error(f"Failed to upload answers: {e}")
        raise web.HTTPInternalServerError(text=f"Failed to upload answers: {e}")


@router.get("/api/getAnswers")
def getAnswersHandler(request: web.Request):
    print(f"API GET request incoming: getAnswers")
    teamID = request.query.get("teamID")
    if not teamID:
        raise web.HTTPBadRequest(text="Value 'teamID' is missing")
    lang, score, submittedAt = quizDB.cursor.execute(f"SELECT language, score, submitted_at FROM teams WHERE teams.id = {teamID};").fetchone()
    rawData: list[list[str | int]] = quizDB.cursor.execute(
        f"SELECT buildings.name_{lang}, buildings.country_{lang}, buildings.city_{lang}, answers.answer, \
        CASE WHEN buildings.answer = answers.answer THEN 1 ELSE 0 END \
        FROM answers JOIN buildings ON answers.building_id = buildings.id \
        WHERE answers.team_id = {teamID};"
    ).fetchall()
    return web.json_response(
        {
            "quizdata": {
                str(i): {
                    "name": entry[0],
                    "country": entry[1],
                    "city": entry[2],
                    "number": entry[3],
                    "correct": bool(entry[4]),
                }
                for i, entry in enumerate(rawData)
            },
            "score": score,
            "submittedAt": submittedAt,
        }
    )


# ------- 404 Handlers -------
@router.get("/api/{fn}")
async def GET_NotFound(request: web.Request) -> web.Response:
    raise web.HTTPNotFound(text=f"API GET endpoint '{request.match_info.get('fn')}' doesn't exist.")


@router.post("/api/{fn}")
async def POST_NotFound(request: web.Request) -> web.Response:
    raise web.HTTPNotFound(text=f"API POST endpoint '{request.match_info.get('fn')}' doesn't exist.")


# --------------------------------------------
# ------- FILE HANDLER FUNCTIONS -------
# --------------------------------------------
def handleFile(request: web.Request, root: pathlib.Path) -> web.Response:
    print(f"HTTP GET request incoming: {request.path}")
    url = request.match_info.get("fn", "").strip("/")
    if ".." in url:
        raise web.HTTPForbidden(text=f"URL contains '..': '{str(url)}'")
    filepath = root / url
    if filepath.is_dir():
        # Directory is requested, serve index.html from that directory
        filepath = filepath / "index.html"
    if not filepath.exists():
        # File does not exist, return 404
        raise web.HTTPNotFound(text=f"Resource '{filepath}' does not exist.")
    if not filepath.is_file():
        # Resource is not a file, return 403
        raise web.HTTPForbidden(text=f"Resource '{filepath}' is not a file.")
    mimetype, encoding = mimetypes.guess_type(filepath)
    return web.Response(body=filepath.read_text(), content_type=mimetype or "text/plain", charset=encoding or "utf-8")


# Search webpage
@router.get("/search/{fn:.*}")
async def GET_files(request: web.Request) -> web.Response:
    return handleFile(request, paths.searchRoot)


# Admin webpage
@router.get("/admin/{fn:.*}")
async def GET_files(request: web.Request) -> web.Response:
    return handleFile(request, paths.adminRoot)


# Client webpage
@router.get("/{fn:.*}")
async def GET_files(request: web.Request) -> web.Response:
    return handleFile(request, paths.clientRoot)


# --------------------
# ------- MAIN -------
# --------------------
def main():
    logging.basicConfig(
        level=loggingLevel.upper(),
        stream=sys.stdout,
        format="%(asctime)s %(name)s %(levelname)s %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    logging.debug("Testing logger")
    app = web.Application()
    app.add_routes(router)
    web.run_app(app, port=8000)


# ------- Entrypoint -------
if __name__ == "__main__":
    main()

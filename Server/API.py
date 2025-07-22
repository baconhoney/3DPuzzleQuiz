import datetime
import pathlib
import mimetypes
import random
import json
import QuizDB
import logging
import sys
from enum import Enum
from aiohttp import web

router = web.RouteTableDef()
cwd = pathlib.Path(__file__).parent.resolve()
cfgRoot = cwd / "cfg"
dataRoot = cwd / "data"
webRoot = cwd / "web"
quizDB = QuizDB.QuizDB(dataRoot)
loggingLevel = "INFO"

SUPPORTED_LANGS = ["hu", "en"]


# -----------------------
# ------- CLASSES -------
# -----------------------
class QuizType(Enum):
    """Possible types of the quiz."""

    DIGITAL = 0
    PAPER = 1


class QuizPhases(Enum):
    """Possible phases of the quiz."""

    IDLE = 0
    RUNNING = 1
    WAITING_FOR_RESULTS = 2


class QuizState:
    isRunning: bool = False
    nextQuizAt: datetime.datetime = datetime.datetime.now()
    currentQuizId: int = 2
    phase: QuizPhases = QuizPhases.IDLE

    @classmethod
    def formatNextQuizAt(cls) -> str:
        """Returns the formatted nextQuizAt value."""
        return cls.nextQuizAt.isoformat(timespec="milliseconds")


# ------------------------------
# ------- UTIL FUNCTIONS -------
# ------------------------------
def getNewUUID(type: QuizType):
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
        quizDB.cursor.execute(f"SELECT count(uuid) FROM teams WHERE uuid={uuid};")
        if quizDB.cursor.fetchone()[0] == 0:
            return uuid


# -------------------------------------
# ------- API HANDLER FUNCTIONS -------
# -------------------------------------
@router.post("/api/login")
async def loginHandler(request: web.Request):
    print(f"API POST request incoming: login")
    requestData: dict[str, str] = await request.json()
    teamName = requestData.get("teamName").strip()
    if not teamName:
        raise web.HTTPBadRequest(text="Value 'teamName' is missing from json")
    lang = requestData.get("lang", "hu")
    if lang not in SUPPORTED_LANGS:
        raise web.HTTPBadRequest(text=f"Invalid language: {lang}")
    uuid = getNewUUID(QuizType.DIGITAL)
    logging.info(f"Registering new team: {teamName} ({uuid}), {lang}")
    quizDB.cursor.execute(
        f"INSERT INTO teams (uuid, team_name, language, quiz_id) VALUES (?, ?, ?, ?);",
        (uuid, teamName, lang, QuizState.currentQuizId),
    )
    quizDB.connection.commit()
    return web.json_response({"uuid": uuid, "startTime": QuizState.formatNextQuizAt(), "isRunning": QuizState.isRunning})


@router.get("/api/getQuestions")
async def getQuestionsHandler(request: web.Request):
    print(f"API GET request incoming: getQuestions")
    uuid = request.query.get("uuid")
    if not uuid:
        raise web.HTTPBadRequest(text="UUID missing")
    res = quizDB.cursor.execute(f"SELECT language, quiz_id FROM teams WHERE uuid={uuid};").fetchone()
    if not res:
        raise web.HTTPBadRequest(text=f"Invalid UUID: {uuid}")
    lang = res[0]
    # TODO: ez így nem jó
    res = quizDB.cursor.execute(f"SELECT building_id, name_{lang}, country_{lang}, city_{lang} FROM questions JOIN quizzes ON questions.ROWID = quizzes.question_ids WHERE quizzes.ROWID = {res[1]};").fetchall()
    quizdata = {
        str(i): {
            "name": entry[res]["name"],
            "country": entry[res]["country"],
            "city": entry[res]["city"],
            "id": "",
        }
        for i, entry in enumerate([])
    }
    return web.json_response(quizdata)


@router.post("/api/uploadAnswers")
async def uploadAnswersHandler(request: web.Request):
    print("API POST request incoming: uploadAnswers")
    data = await request.json()
    print(f"Received length {'answers' in data and len(data['answers'])}")
    raise web.HTTPOk()


@router.get("/api/getAnswers")
def getAnswersHandler(request: web.Request):
    print(f"API GET request incoming: getAnswers")
    uid = request.query.get("uid")
    if not uid:
        raise web.HTTPBadRequest(text="UID missing")
    return web.json_response({"quizdata": {}, "score": random.randint(0, 20)})


# ------- 404 Handlers -------
@router.get("/api/{fn}")
async def GET_NotFound(request: web.Request) -> web.Response:
    raise web.HTTPNotFound(text=f"API GET endpoint '{request.match_info.get('fn')}' doesn't exist.")


@router.post("/api/{fn}")
async def POST_NotFound(request: web.Request) -> web.Response:
    raise web.HTTPNotFound(text=f"API POST endpoint '{request.match_info.get('fn')}' doesn't exist.")


@router.get("/{fn:.*}")
async def GET_files(request: web.Request) -> web.Response:
    print(f"Request incoming: {request.method} {request.path}")
    filepath = webRoot / request.match_info.get("fn", "").strip("/")
    # If a directory is requested, serve index.html from that directory
    if filepath.is_dir():
        filepath = filepath / "index.html"
    # If the file does not exist, return 404
    if not (filepath.exists() and filepath.is_file()):
        raise web.HTTPNotFound(text=f"File '{filepath}' does not exist.")
    mimetype, encoding = mimetypes.guess_type(filepath)
    return web.Response(body=filepath.read_text(), content_type=mimetype or "text/plain", charset=encoding or "utf-8")


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
    web.run_app(app, port=1006)


# ------- Entrypoint -------
if __name__ == "__main__":
    main()

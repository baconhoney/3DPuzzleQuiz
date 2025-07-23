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

    STUDYING = "studying"
    ANSWERING = "answering"
    SCORING = "scoring"


class QuizState:
    nextQuizAt: datetime.datetime = datetime.datetime.now()
    currentQuizNumber: int = 2
    phase: QuizPhases = QuizPhases.STUDYING
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
@router.post("/api/login")
async def loginHandler(request: web.Request):
    print(f"API POST request incoming: login")
    requestData: dict[str, str] = await request.json()
    teamName = requestData.get("name", "").strip()
    if not teamName:
        raise web.HTTPBadRequest(text="Value 'name' is missing from json")
    teamLang = requestData.get("lang", "").strip().lower()
    if not teamName:
        raise web.HTTPBadRequest(text="Value 'lang' is missing from json")
    if teamLang not in SUPPORTED_LANGS:
        raise web.HTTPBadRequest(text=f"Invalid language: '{teamLang}'")
    teamID = getNewTeamID(QuizType.DIGITAL)
    logging.info(f"Registering new team: {teamName} ({teamID}), {teamLang}")
    quizDB.cursor.execute(
        f"INSERT INTO teams (id, name, language, quiz_number) VALUES (?, ?, ?, ?);",
        (teamID, teamName, teamLang, QuizState.currentQuizNumber),
    )
    quizDB.connection.commit()
    return web.json_response({"teamID": teamID, "startTime": QuizState.formatNextQuizAt(), "quizState": QuizState.phase.value})


@router.get("/api/getQuestions")
async def getQuestionsHandler(request: web.Request):
    print(f"API GET request incoming: getQuestions")
    teamID = request.query.get("teamID")
    if not teamID:
        raise web.HTTPBadRequest(text="Value 'teamID' is missing from query")
    if not teamID.isdigit():
        raise web.HTTPBadRequest(text=f"Invalid teamID: {teamID}")
    res: list[str | int] = quizDB.cursor.execute(f"SELECT language, quiz_number FROM teams WHERE id = {teamID};").fetchone()
    if not res:
        raise web.HTTPBadRequest(text=f"Invalid teamID: {teamID}")
    lang = res[0]
    quizNumber = res[1]
    if quizNumber != QuizState.currentQuizNumber:
        raise web.HTTPGone(text=f"")
    rawQuizdata: list[list[str | int]] = quizDB.cursor.execute(
        f"SELECT buildings.id, buildings.name_{lang}, buildings.country_{lang}, buildings.city_{lang} \
        FROM buildings JOIN quizzes ON buildings.id = quizzes.building_id \
        WHERE quizzes.quiz_number = {quizNumber};"
    ).fetchall()
    quizdata = {
        str(i): {
            "id": entry[0],
            "name": entry[1],
            "country": entry[2],
            "city": entry[3],
        }
        for i, entry in enumerate(sorted(rawQuizdata, key=lambda x: x[2]))
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

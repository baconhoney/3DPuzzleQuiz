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


# ------- CLASSES -------
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
    nextQuizAt: datetime.datetime = None
    currentQuizId: int = None
    phase: QuizPhases = QuizPhases.IDLE

    @property
    def nextQuizAtFormatted(self) -> str:
        """Returns the formatted nextQuizAt value."""
        return self._nextQuizAt.isoformat(timespec="milliseconds")


# ------- UTIL FUNCTIONS -------
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
        quizDB.cursor.execute(f"SELECT count(id) FROM teams WHERE uuid={uuid};")
        if quizDB.cursor.fetchone()[0] == 0:
            return uuid


def getQuiz(quizId: int, lang: str) -> dict[str, dict[str, dict[str, str]]]:
    pass


# ------- API HANDLER FUNCTIONS -------
@router.post("/api/login")
async def loginHandler(request: web.Request):
    print(f"API POST request incoming: login")
    requestData: dict[str, str] = await request.json()
    lang = requestData.get("lang", "hu")
    teamName = requestData.get("teamName").strip()
    if not teamName:
        return web.HTTPBadRequest(text="Value 'teamName' is missing from json")
    uuid = getNewUUID()
    logging.info(f"Registering new team: {teamName} ({uuid}), {lang}")
    quizDB.cursor.execute(f"INSERT INTO teams (uuid, team_name, language, quiz_id) VALUES ({uuid}, '{teamName}', '{lang}', {QuizState.currentQuizId});")
    return web.json_response({"uid": uuid, "startTime": QuizState.nextQuizAtFormatted, "isRunning": QuizState.isRunning})


@router.get("/api/getQuestions")
async def getQuestionsHandler(request: web.Request):
    print(f"API GET request incoming: getQuestions")
    lang = request.query.get("lang", "hu")
    entrylist = sorted(random.sample(list(rawQuizData["entries"].items()), 20), key=lambda x: x[1][lang]["name"])
    quizdata = {
        str(i): {
            "name": entry[lang]["name"],
            "country": entry[lang]["country"],
            "city": entry[lang]["city"],
            "id": uid,
        }
        for i, (uid, entry) in enumerate(entrylist)
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
    filename: str = request.match_info.get("fn", "")
    if filename or filename == "" or filename == "/":
        filepath = webRoot / "index.html"
    else:
        filepath = webRoot / filename
    # If a directory is requested, serve index.html from that directory
    if filepath.is_dir():
        filepath = filepath / "index.html"
    # If file does not exist, return 404
    if not pathlib.Path.is_file(filepath):
        raise web.HTTPNotFound(text=f"File '{filepath}' does not exist.")
    mimetype, encoding = mimetypes.guess_type(filepath)
    return web.Response(body=filepath.read_text(), content_type=mimetype or "text/plain", charset=encoding or "utf-8")


# ------- MAIN -------
def main():
    logging.basicConfig(level=loggingLevel.upper(), stream=sys.stdout, format="%(asctime)s %(name)s %(levelname)s %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    logging.debug("Testing logger")
    app = web.Application()
    app.add_routes(router)
    web.run_app(app, port=1006)


# ------- ENTRY POINT -------
if __name__ == "__main__":
    main()

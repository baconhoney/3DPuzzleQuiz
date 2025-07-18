import datetime
import pathlib
import mimetypes
import random
import json
import sqlite3
from aiohttp import web

cwd = pathlib.Path(__file__).parent.resolve()
webRoot = cwd / "web"
router = web.RouteTableDef()
dataRoot = cwd / "data"
cfgRoot = cwd / "cfg"

quizDatabase = sqlite3.connect(dataRoot / "quizData.db")



# load in the testdata
with open(cwd / r"Teszt/masterList.json", "r", encoding="utf-8") as f:
    testdata: dict[str, dict[str, dict]] = json.load(f)


# ------- CLASSES -------



# ------- UTIL FUNCTIONS -------
def getNewUUID():
    """Generate a new unique identifier."""
    # TODO: make sure it never repeats
    return str(random.randint(int(1e9), int(1e10 - 1)))


def getNewTimestamp():
    """Generate a new timestamp in ISO format."""
    return (datetime.datetime.now() - datetime.timedelta(microseconds=(random.random() * 600 * 1e6))).isoformat(timespec="milliseconds")



# ------- API HANDLER FUNCTIONS -------
@router.get("/api/login")
def loginHandler(request: web.Request):
    print(f"API GET request incoming: login")
    return web.json_response({"uid": getNewUUID(), "startTime": getNewTimestamp(), "isRunning": True})


@router.get("/api/getQuestions")
def getQuestionsHandler(request: web.Request):
    print(f"API GET request incoming: getQuestions")
    lang = request.query.get("lang", "hu")
    entrylist = random.sample(list(testdata["entries"].items()), 20)
    entrylist = sorted(entrylist, key=lambda x: x[1][lang]["name"])
    quizdata = {
        str(i): {"name": entry[lang]["name"], "country": entry[lang]["country"], "city": entry[lang]["city"], "id": uid}
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
    app = web.Application()
    app.add_routes(router)
    web.run_app(app, port=1006)



# ------- ENTRY POINT -------
if __name__ == "__main__":
    main()

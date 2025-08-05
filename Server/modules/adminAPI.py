from aiohttp import web
import logging
import quizDBManager
import utils


router = web.RouteTableDef()

_logger = logging.getLogger(__name__)
_logger.info(f"Importing {__name__}...")
_baseURL = "/api/admin"


@utils.router.get(_baseURL + "/getStates")
async def getStatesHandler(request: web.Request):
    print(f"API GET request incoming: admin/getStates")
    return web.json_response(
        {
            "phase": utils.QuizState.phase.value,
            "currentQuizNumber": utils.QuizState.currentQuizNumber,
            "nextQuizAt": utils.QuizState.formatNextQuizAt(),
        }
    )


@utils.router.get(_baseURL + "/getAllBuildingsData")
async def getAllBuildingsDataHandler(request: web.Request):
    print(f"API GET request incoming: admin/getAllBuildingsData")
    return web.json_response(quizDBManager.getAllBuildingData())


@utils.router.get(_baseURL + "/getQuizResults")
async def getQuizResultsHandler(request: web.Request):
    print(f"API GET request incoming: admin/getResults")
    res: list[list[str | int]] = utils.quizDB.cursor.execute(
        f"SELECT id, name, language, quiz_size, score, submitted_at FROM teams \
        WHERE quiz_number = {utils.QuizState.currentQuizNumber} \
        ORDER BY score DESC, submitted_at ASC;",
    ).fetchall()
    if not res:
        return web.json_response({})
    return web.json_response([{"id": entry[0], "name": entry[1], "language": entry[2], "quizSize": entry[3], "score": entry[4], "submittedAt": entry[5]} for entry in res])


@utils.router.get(_baseURL + "/getQuizdata")
async def getQuizdataHandler(request: web.Request):
    print(f"API GET request incoming: admin/getQuizdata")
    teamID = request.query.get("teamID")
    if not teamID:
        raise web.HTTPBadRequest(text="Value 'teamID' is missing")
    return web.json_response(quizDBManager.getAnswers(teamID))


@utils.router.post(_baseURL + "/uploadQuiz")
async def uploadQuizHandler(request: web.Request):
    print("API POST request incoming: admin/uploadQuiz")
    data = request.json()
    if "id" not in data:
        raise web.HTTPBadRequest(text="Value 'id' is missing")
    if "name" not in data:
        raise web.HTTPBadRequest(text="Value 'name' is missing")
    if "lang" not in data or data["lang"] not in utils.SupportedLanguages:
        raise web.HTTPBadRequest(text=f"Value 'lang' is invalid: {data.get('lang', '<missing>')}")
    if "answers" not in data:
        raise web.HTTPBadRequest(text="Value 'answers' is missing")
    quizDBManager.uploadAnswers(data["id"], data["name"], utils.SupportedLanguages(data["lang"]), data["answers"])
    return web.HTTPOk()


@utils.router.post(_baseURL + "/queuePrintjob")
async def queuePrintjobHandler(request: web.Request):
    print(f"API POST request incoming: admin/queuePrintjob")
    data = await request.json()
    if "numberOfTests" not in data or not data["numberOfTests"].isdigit():
        raise web.HTTPBadRequest(text="Value 'numberOfTests' is missing")
    if "language" not in data or data["language"] not in utils.SupportedLanguages:
        raise web.HTTPBadRequest(text=f"Value 'language' is invalid: {data.get('language', '<missing>')}")
    if "size" not in data or data["size"] not in utils.QuizSizes:
        raise web.HTTPBadRequest(text=f"Value 'size' is invalid: {data.get('size', '<missing>')}")
    print(f"New print job: {data['numberOfTests']} copies of type {utils.QuizSizes(data['size']).name} in lang {utils.SupportedLanguages(data['language']).name}")
    for _ in range(data["numberOfTests"]):
        pass  # call print function
    return web.HTTPOk()


# ------- 404 Handlers -------
@utils.router.get(_baseURL + "/{fn}")
async def GET_NotFound(request: web.Request) -> web.Response:
    raise web.HTTPNotFound(text=f"API GET endpoint '{request.match_info.get('fn')}' doesn't exist.")


@utils.router.post(_baseURL + "/{fn}")
async def POST_NotFound(request: web.Request) -> web.Response:
    raise web.HTTPNotFound(text=f"API POST endpoint '{request.match_info.get('fn')}' doesn't exist.")

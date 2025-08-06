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
    return web.json_response(quizDBManager.getLeaderboard())


@utils.router.get(_baseURL + "/getQuizdata")
async def getQuizdataHandler(request: web.Request):
    print(f"API GET request incoming: admin/getQuizdata")
    return web.json_response(quizDBManager.getAnswers(request.query.get("teamID")))


@utils.router.post(_baseURL + "/uploadQuiz")
async def uploadQuizHandler(request: web.Request):
    print("API POST request incoming: admin/uploadQuiz")
    data: dict[str, str | int | list[dict[str, str | int]]] = request.json()
    quizDBManager.uploadAnswers("paper-uploadAnswers", data.get("teamID"), data.get("name"), utils.convertToQuizLanguage(data.get("lang")), data.get("answers"))
    return web.HTTPOk()


@utils.router.post(_baseURL + "/queuePrintjob")
async def queuePrintjobHandler(request: web.Request):
    print(f"API POST request incoming: admin/queuePrintjob")
    data: dict[str, str | int] = await request.json()
    numberOfTests = data.get("numberOfTests")
    lang = utils.convertToQuizLanguage(data.get("language"))
    size = utils.convertToQuizSize(data.get("size"))
    if not numberOfTests or not isinstance(numberOfTests, int):
        raise web.HTTPBadRequest(text=f"Value 'numberOfTests' is invalid: {data.get('numberOfTests', '<missing>')}")
    if not lang:
        raise web.HTTPBadRequest(text=f"Value 'language' is invalid: {data.get('language', '<missing>')}")
    if not size:
        raise web.HTTPBadRequest(text=f"Value 'size' is invalid: {data.get('size', '<missing>')}")
    print(f"New print job: {numberOfTests} copies of type {size.name} in lang {lang.name}")
    for _ in range(numberOfTests):
        pass  # call print function
    return web.HTTPOk()


# ------- 404 Handlers -------
@utils.router.get(_baseURL + "/{fn}")
async def GET_NotFound(request: web.Request) -> web.Response:
    raise web.HTTPNotFound(text=f"API GET endpoint '{request.match_info.get('fn')}' doesn't exist.")


@utils.router.post(_baseURL + "/{fn}")
async def POST_NotFound(request: web.Request) -> web.Response:
    raise web.HTTPNotFound(text=f"API POST endpoint '{request.match_info.get('fn')}' doesn't exist.")

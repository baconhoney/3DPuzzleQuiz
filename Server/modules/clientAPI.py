from aiohttp import web
import datetime
import logging
import modules.utils as utils
import modules.quizDBManager as quizDBManager

logger = logging.getLogger(__name__)
logger.info(f"Importing {__name__}...")
baseURL = "/api/client"


@utils.router.get(baseURL + "/getQuizState")
async def getQuizStateHandler(request: web.Request):
    print(f"API GET request incoming: getQuizState")
    return web.json_response({"state": utils.QuizState.phase.value})


@utils.router.get(baseURL + "/getQuestions")
async def getQuestionsHandler(request: web.Request):
    print(f"API GET request incoming: getQuestions")
    lang = request.query.get("lang")
    if not lang or lang not in utils.SupportedLanguages:
        raise web.HTTPBadRequest(text=f"Value 'lang' is missing or invalid: {lang}")
    return web.json_response(quizDBManager.getQuestions(utils.SupportedLanguages(lang)))


@utils.router.post(baseURL + "/uploadAnswers")
async def uploadAnswersHandler(request: web.Request):
    print("API POST request incoming: uploadAnswers")
    data: dict[str, str | dict[str, dict[str, int]]] = await request.json()
    if "name" not in data:
        raise web.HTTPBadRequest(text="Value 'name' is missing")
    if "lang" not in data or data["lang"] not in utils.SupportedLanguages:
        raise web.HTTPBadRequest(text=f"Value 'lang' is invalid: {data.get('lang', '<missing>')}")
    if "answers" not in data:
        raise web.HTTPBadRequest(text="Value 'answers' is missing")
    teamID = utils.getNewTeamID(utils.QuizType.DIGITAL)
    quizDBManager.uploadAnswers(teamID, data["name"], utils.SupportedLanguages(data["lang"]), data["answers"])
    return web.json_response({"teamID": teamID})


@utils.router.get(baseURL + "/getAnswers")
def getAnswersHandler(request: web.Request):
    print(f"API GET request incoming: getAnswers")
    teamID = request.query.get("teamID")
    if not teamID:
        raise web.HTTPBadRequest(text="Value 'teamID' is missing")
    return web.json_response(quizDBManager.getAnswers(teamID))


@utils.router.get(baseURL + "/events")
async def eventsHandler(request: web.Request):
    print(f"API GET request incoming: events")
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    utils.connectedWSClients.add(ws)
    logger.debug(f"New websocket client connected: {ws}\nTotal: {len(utils.connectedWSClients)}")
    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.ERROR:
                logger.warning(f"WebSocket connection closed with error: {ws.exception()}")
                print(f"WebSocket connection closed with error: {ws.exception()}")
    finally:
        utils.connectedWSClients.remove(ws)
        logger.debug(f"WebSocket client disconnected: {ws}\nTotal: {len(utils.connectedWSClients)}")
    return ws


# ------- 404 Handlers -------
@utils.router.get(baseURL + "/{fn}")
async def GET_NotFound(request: web.Request) -> web.Response:
    raise web.HTTPNotFound(text=f"API-Client GET endpoint '{request.match_info.get('fn')}' doesn't exist.")


@utils.router.post(baseURL + "/{fn}")
async def POST_NotFound(request: web.Request) -> web.Response:
    raise web.HTTPNotFound(text=f"API-Client POST endpoint '{request.match_info.get('fn')}' doesn't exist.")



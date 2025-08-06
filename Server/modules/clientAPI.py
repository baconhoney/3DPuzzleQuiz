from aiohttp import web
import logging
import quizDBManager
import utils


router = web.RouteTableDef()

_logger = logging.getLogger(__name__)
_logger.info(f"Importing {__name__}...")
_baseURL = "/api/client"


@utils.router.get(_baseURL + "/getQuizPhase")
async def getQuizPhaseHandler(request: web.Request):
    print(f"API GET request incoming: getQuizState")
    return web.json_response({"phase": utils.QuizState.phase.value})


@utils.router.get(_baseURL + "/getQuestions")
async def getQuestionsHandler(request: web.Request):
    print(f"API GET request incoming: getQuestions")
    try:
        return web.json_response(quizDBManager.getQuestions(utils.convertToQuizLanguage(request.query.get("lang")), utils.convertToQuizSize(request.query.get("size"))))
    except quizDBManager.InvalidParameterError as e:
        raise web.HTTPBadRequest(text=str(e))


@utils.router.post(_baseURL + "/uploadAnswers")
async def uploadAnswersHandler(request: web.Request):
    print("API POST request incoming: uploadAnswers")
    data: dict[str, str | list[dict[str, int]]] = await request.json()
    teamID = utils.getNewTeamID(utils.QuizTypes.DIGITAL)
    try:
        quizDBManager.uploadAnswers("digital-uploadFull", teamID, data.get("name"), utils.convertToQuizLanguage(data.get("lang")), data.get("answers"))
    except quizDBManager.InvalidParameterError as e:
        raise web.HTTPBadRequest(text=str(e))
    return web.json_response({"teamID": teamID})


@utils.router.get(_baseURL + "/getAnswers")
def getAnswersHandler(request: web.Request):
    print(f"API GET request incoming: getAnswers")
    try:
        return web.json_response(quizDBManager.getAnswers(request.query.get("teamID")))
    except quizDBManager.InvalidParameterError as e:
        raise web.HTTPBadRequest(text=str(e))


# websockets handler for incoming websocket connections at /api/events
@utils.router.get(_baseURL + "/events")
async def eventsHandler(request: web.Request):
    print(f"API GET request incoming: events")
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    utils.connectedWSClients.add(ws)
    _logger.debug(f"New websocket client connected: {ws}\nTotal: {len(utils.connectedWSClients)}")
    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.ERROR:
                _logger.warning(f"WebSocket connection closed with error: {ws.exception()}")
                print(f"WebSocket connection closed with error: {ws.exception()}")
    finally:
        utils.connectedWSClients.remove(ws)
        _logger.debug(f"WebSocket client disconnected: {ws}\nTotal: {len(utils.connectedWSClients)}")
    return ws


# ------- 404 Handlers -------
@utils.router.get(_baseURL + "/{fn}")
async def GET_NotFound(request: web.Request) -> web.Response:
    raise web.HTTPNotFound(text=f"API-Client GET endpoint '{request.match_info.get('fn')}' doesn't exist.")


@utils.router.post(_baseURL + "/{fn}")
async def POST_NotFound(request: web.Request) -> web.Response:
    raise web.HTTPNotFound(text=f"API-Client POST endpoint '{request.match_info.get('fn')}' doesn't exist.")

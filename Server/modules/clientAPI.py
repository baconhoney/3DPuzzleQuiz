import json
from aiohttp import web
import logging
import quizDBManager
import utils
import wsUtils


router = web.RouteTableDef()

_logger = logging.getLogger(__name__)
_logger.info(f"Importing {__name__}...")
_baseURL = "/api/client"


@router.get(_baseURL + "/getQuizPhase")
async def getQuizPhaseHandler(request: web.Request):
    print(f"API GET request incoming: getQuizState")
    return web.json_response({"phase": utils.QuizState.phase.value, "nextPhaseChangeAt": utils.QuizState.formatNextPhaseChangeAt()})


@router.get(_baseURL + "/getQuestions")
async def getQuestionsHandler(request: web.Request):
    print(f"API GET request incoming: getQuestions")
    try:
        return web.json_response(
            {
                "nextPhaseChangeAt": utils.QuizState.formatNextPhaseChangeAt(),
                "questions": await quizDBManager.getQuestions(request.query.get("lang"), request.query.get("size")),
            }
        )
    except quizDBManager.InvalidParameterError as e:
        raise web.HTTPBadRequest(text=str(e))


@router.post(_baseURL + "/uploadAnswers")
async def uploadAnswersHandler(request: web.Request):
    print("API POST request incoming: uploadAnswers")
    data: dict[str, str | list[dict[str, int]]] = await request.json()
    teamID = utils.getNewTeamID(utils.QuizTypes.DIGITAL)
    try:
        await quizDBManager.uploadAnswers("digital-uploadFull", teamID=teamID, name=data.get("name"), lang=data.get("lang"), answers=data.get("answers"))
    except quizDBManager.InvalidParameterError as e:
        raise web.HTTPBadRequest(text=str(e))
    return web.json_response({"teamID": teamID, "nextPhaseChangeAt": utils.QuizState.formatNextPhaseChangeAt()})


@router.get(_baseURL + "/getAnswers")
async def getAnswersHandler(request: web.Request):
    print(f"API GET request incoming: getAnswers")
    try:
        return web.json_response({"nextPhaseChangeAt": utils.QuizState.formatNextPhaseChangeAt(), "answers": await quizDBManager.getAnswers(request.query.get("teamID"))})
    except quizDBManager.InvalidParameterError as e:
        raise web.HTTPBadRequest(text=str(e))


# websockets handler for incoming websocket connections at /api/client/events
@router.get(_baseURL + "/events")
async def eventsHandler(request: web.Request):
    print(f"API GET request incoming: events")
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    wsUtils.clientCons.append(ws)
    _logger.debug(f"New websocket client connected: {ws}\nTotal: {len(wsUtils.clientCons)}")
    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.ERROR:
                _logger.warning(f"WebSocket connection closed with error: {ws.exception()}")
                print(f"WebSocket connection closed with error: {ws.exception()}")
            elif msg.type == web.WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                except json.JSONDecodeError:
                    _logger.warning(f"WebSocket message is not a valid JSON object: {msg.data}")
                    continue
                if "event" not in data:
                    _logger.warning(f"WebSocket message is missing 'event' field: {msg.data}")
                    continue
                if "data" not in data:
                    _logger.warning(f"WebSocket message is missing 'data' field: {msg.data}")
                    continue
                eventType = data["event"]
                if eventType in wsUtils._clientMsgEventListeners:
                    for listener in wsUtils._clientMsgEventListeners[eventType]:
                        listener(data.get("data"))
    finally:
        wsUtils.clientCons.remove(ws)
        _logger.debug(f"WebSocket client disconnected: {ws}\nTotal: {len(wsUtils.clientCons)}")
    return ws


# ------- 404 Handlers -------
@router.get(_baseURL + "/{fn}")
async def GET_NotFound(request: web.Request) -> web.Response:
    raise web.HTTPNotFound(text=f"API-Client GET endpoint '{request.match_info.get('fn')}' doesn't exist.")


@router.post(_baseURL + "/{fn}")
async def POST_NotFound(request: web.Request) -> web.Response:
    raise web.HTTPNotFound(text=f"API-Client POST endpoint '{request.match_info.get('fn')}' doesn't exist.")

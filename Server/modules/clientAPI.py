import logging

_logger = logging.getLogger(__name__)
_logger.info(f"Importing {__name__}...")


from aiohttp import web
import json
import quizDBManager
import utils
import wsUtils


_baseURL = "/api/client"

router = web.RouteTableDef()


@router.get(_baseURL + "/getQuizPhase")
async def getQuizPhaseHandler(request: web.Request):
    _logger.info(f"API GET request incoming: getQuizState")
    # return web.json_response({"phase": utils.QuizState.phase.value, "nextPhaseChangeAt": utils.QuizState.formatNextPhaseChangeAt()})
    return web.json_response({"phase": utils.QuizState.phase.value})


@router.get(_baseURL + "/getQuestions")
async def getQuestionsHandler(request: web.Request):
    _logger.info(f"API GET request incoming: getQuestions")
    try:
        questions = await quizDBManager.getQuestions(request.query.get("lang"), request.query.get("size"))
        _logger.debug(f"Fetched {len(questions)} questions for lang={request.query.get('lang')} size={request.query.get('size')}")
        return web.json_response(
            {
                # "nextPhaseChangeAt": utils.QuizState.formatNextPhaseChangeAt(),
                "questions": questions,
            }
        )
    except quizDBManager.InvalidParameterError as e:
        raise web.HTTPBadRequest(text=str(e))


@router.post(_baseURL + "/uploadAnswers")
async def uploadAnswersHandler(request: web.Request):
    _logger.info("API POST request incoming: uploadAnswers")
    data: dict[str, str | list[dict[str, int]]] = await request.json()
    _logger.debug(f"Received data: {data}")
    teamID, codeword = utils.getNewTeamID(utils.QuizTypes.DIGITAL, lang=data.get("lang"), teamName=data.get("name"))
    _logger.debug(f"Generated teamID={teamID}, codeword={codeword}")
    try:
        await quizDBManager.uploadAnswers("digital-uploadFull", teamID=teamID, name=data.get("name"), codeword=codeword, lang=data.get("lang"), answers=data.get("answers"))
        _logger.debug(f"Uploaded answers for teamID={teamID}")
    except quizDBManager.InvalidParameterError as e:
        raise web.HTTPBadRequest(text=str(e))
    # return web.json_response({"teamID": teamID, "codeword": codeword, "nextPhaseChangeAt": utils.QuizState.formatNextPhaseChangeAt()})
    return web.json_response({"teamID": teamID, "codeword": codeword})


@router.get(_baseURL + "/getAnswers")
async def getAnswersHandler(request: web.Request):
    _logger.info(f"API GET request incoming: getAnswers")
    try:
        answers = await quizDBManager.getAnswers(request.query.get("teamID"))
        _logger.debug(f"Fetched {len(answers)} answers for teamID={request.query.get('teamID')}")
        # return web.json_response({"nextPhaseChangeAt": utils.QuizState.formatNextPhaseChangeAt(), "answers": answers})
        return web.json_response({"answers": answers})
    except quizDBManager.InvalidParameterError as e:
        raise web.HTTPBadRequest(text=str(e))


# websockets handler for incoming websocket connections at /events
@router.get(_baseURL + "/events")
async def eventsHandler(request: web.Request):
    _logger.info(f"API GET request incoming: events")
    clientIP = request.headers.get("X-Forwarded-For", request.remote)
    clientPort = request.transport.get_extra_info("peername")[1] if request.transport else None
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    wsUtils.clientCons.append(ws)
    _logger.debug(f"New websocket client connected: {clientIP}:{clientPort}, total: {len(wsUtils.clientCons)}")
    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.ERROR:
                _logger.info(f"WebSocket connection ({clientIP}:{clientPort}) closed with error: {ws.exception()}")
            elif msg.type == web.WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                    _logger.debug(f"Received websocket message: {data}")
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
                _logger.debug(f"Handling websocket event: {eventType}")
                if eventType in wsUtils._clientMsgEventListeners:
                    for listener in wsUtils._clientMsgEventListeners[eventType]:
                        listener(data.get("data"))
    finally:
        wsUtils.clientCons.remove(ws)
        _logger.debug(f"Websocket client disconnected: {clientIP}:{clientPort}, total: {len(wsUtils.clientCons)}")
    return ws


# ------- 404 Handlers -------
@router.get(_baseURL + "/{fn}")
async def GET_NotFound(request: web.Request) -> web.Response:
    _logger.warning(f"GET request to unknown endpoint: {request.match_info.get('fn')}")
    raise web.HTTPNotFound(text=f"API-Client GET endpoint '{request.match_info.get('fn')}' doesn't exist.")


@router.post(_baseURL + "/{fn}")
async def POST_NotFound(request: web.Request) -> web.Response:
    _logger.warning(f"POST request to unknown endpoint: {request.match_info.get('fn')}")
    raise web.HTTPNotFound(text=f"API-Client POST endpoint '{request.match_info.get('fn')}' doesn't exist.")

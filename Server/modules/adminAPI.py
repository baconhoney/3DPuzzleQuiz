import logging

_logger = logging.getLogger(__name__)
_logger.info(f"Importing {__name__}...")


from aiohttp import web
import asyncio
import datetime
import json
import printer
import quizDBManager
import utils
import wsUtils


_currentPrinter = printer.Printer()
asyncio.run_coroutine_threadsafe(_currentPrinter.realInit(), asyncio.get_event_loop())

router = web.RouteTableDef()

_baseURL = "/api/admin"


@router.get(_baseURL + "/getStates")
async def getStatesHandler(request: web.Request):
    _logger.info(f"API GET request incoming: getStates")
    return web.json_response(
        {
            "phase": utils.QuizState.phase.value,
            "currentQuizRound": utils.QuizState.currentQuizRound,
            "nextPhaseChangeAt": utils.QuizState.formatNextPhaseChangeAt(),
        }
    )


@router.get(_baseURL + "/getAllBuildingsData")
async def getAllBuildingsDataHandler(request: web.Request):
    _logger.info(f"API GET request incoming: getAllBuildingsData")
    data = await quizDBManager.getAllBuildingData()
    _logger.debug(f"Retrieved building data: {len(data)} entries")
    return web.json_response(data)


@router.get(_baseURL + "/getLeaderboard")
async def getLeaderboardHandler(request: web.Request):
    _logger.info(f"API GET request incoming: getLeaderboard")
    try:
        data = await quizDBManager.getLeaderboard(size=request.query.get("size"), quizRound=request.query.get("round"))
        _logger.debug(f"Leaderboard data: {len(data)} entries")
        return web.json_response(data)
    except quizDBManager.InvalidParameterError as e:
        _logger.warning(f"Invalid parameters for getLeaderboard: {e}")
        raise web.HTTPBadRequest(text=str(e))


@router.get(_baseURL + "/getQuizDetails")
async def getQuizdataHandler(request: web.Request):
    _logger.info(f"API GET request incoming: getQuizDetails")
    try:
        data = await quizDBManager.getQuizDetails(request.query.get("teamID"))
        _logger.debug(f"Quiz details retrieved: {({k: v for k, v in data.items() if k != 'answers'})}")
        return web.json_response(data)
    except quizDBManager.InvalidParameterError as e:
        _logger.warning(f"Invalid parameters for getQuizDetails: {e}")
        raise web.HTTPBadRequest(text=str(e))


@router.post(_baseURL + "/uploadQuiz")
async def uploadQuizHandler(request: web.Request):
    _logger.info("API POST request incoming: uploadQuiz")
    data: dict[str, str | int | list[dict[str, str | int]]] = await request.json()
    _logger.debug(f"Received uploadQuiz data: {data}")
    try:
        await quizDBManager.uploadAnswers("paper-uploadAnswers", teamID=data.get("teamID"), name=data.get("name"), answers=data.get("answers"))
        _logger.debug(f"Successfully uploaded quiz answers for teamID: {data.get('teamID')}")
    except quizDBManager.InvalidParameterError as e:
        _logger.warning(f"Invalid parameters for uploadQuiz: {e}")
        raise web.HTTPBadRequest(text=str(e))
    return web.HTTPOk()


@router.post(_baseURL + "/nextPhase")
async def nextPhaseHandler(request: web.Request):
    _logger.info(f"API GET request incoming: nextPhase")
    data: dict[str, str] = await request.json()
    _logger.debug(f"NextPhase request data: {data}")
    nextPhase = utils.convertToQuizPhase(data.get("nextPhase"))
    if nextPhase != utils.QuizState.getNextPhase():
        raise web.HTTPBadRequest(text=f"Invalid nextPhase: {data.get('nextPhase', '<missing>')}, expected: {utils.QuizState.getNextPhase().value}")
    nextPhaseChangeAt = data.get("nextPhaseChangeAt") and datetime.datetime.fromisoformat(data.get("nextPhaseChangeAt")).replace(tzinfo=None, second=0, microsecond=0) or None
    if not nextPhaseChangeAt or nextPhaseChangeAt < utils.QuizState.nextPhaseChangeAt:
        raise web.HTTPBadRequest(text=f"Invalid nextPhaseChangeAt: {data.get('nextPhaseChangeAt', '<missing>')}, expected value later than {utils.QuizState.formatNextPhaseChangeAt()}")
    newQuizNumber = (utils.QuizState.phase == utils.QuizPhases.SCORING and nextPhase == utils.QuizPhases.IDLE and utils.QuizState.currentQuizRound + 1) or None
    await utils.QuizState.updateState(nextPhase=utils.QuizState.getNextPhase(), nextPhaseChangeAt=nextPhaseChangeAt, newQuizRound=newQuizNumber)
    _logger.info(f"Updated quiz state to {utils.QuizState.phase} with nextPhaseChangeAt = '{utils.QuizState.formatNextPhaseChangeAt()}' and newQuizRound = {newQuizNumber}")
    return web.HTTPOk()


@router.post(_baseURL + "/setNextPhaseChangeAt")
async def setNextPhaseChangeAtHandler(request: web.Request):
    _logger.info(f"API GET request incoming: setNextPhaseChangeAt")
    data: dict[str, str] = await request.json()
    _logger.debug(f"SetNextPhaseChangeAt request data: {data}")
    nextPhaseChangeAt = data.get("nextPhaseChangeAt") and datetime.datetime.fromisoformat(data.get("nextPhaseChangeAt")).replace(tzinfo=None, second=0, microsecond=0) or None
    if not nextPhaseChangeAt or nextPhaseChangeAt < utils.QuizState.nextPhaseChangeAt:
        raise web.HTTPBadRequest(text=f"Invalid nextPhaseChangeAt: {data.get('nextPhaseChangeAt', '<missing>')}, expected value later than {utils.QuizState.formatNextPhaseChangeAt()}")
    await utils.QuizState.updateState(nextPhaseChangeAt=nextPhaseChangeAt)
    _logger.info(f"Updated nextPhaseChangeAt to: {utils.QuizState.formatNextPhaseChangeAt()}")
    return web.HTTPOk()


@router.post(_baseURL + "/setQuizRound")
async def setQuizRoundHandler(request: web.Request):
    _logger.info(f"API GET request incoming: setQuizRound")
    data: dict[str, str] = await request.json()
    _logger.debug(f"setQuizRound request data: {data}")
    newQuizRound = data.get("newQuizRound") and data.get("newQuizRound").isdigit() and int(data.get("newQuizRound")) or None
    if not newQuizRound or not (0 < newQuizRound < 100):
        raise web.HTTPBadRequest(text=f"Invalid newQuizRound: {data.get('newQuizRound', '<missing>')}, expected value between 1 and 99")
    await utils.QuizState.updateState(newQuizRound=newQuizRound)
    _logger.info(f"Updated currentQuizRound to: {utils.QuizState.currentQuizRound}")
    return web.HTTPOk()


@router.post(_baseURL + "/queuePrint")
async def queuePrintHandler(request: web.Request):
    _logger.info(f"API POST request incoming: queuePrint")
    data: dict[str, str | int] = await request.json()
    _logger.debug(f"QueuePrint data received: {data}")
    teamID = data.get("teamID")
    copyCount = data.get("copyCount")
    lang = utils.convertToQuizLanguage(data.get("language"))
    size = utils.convertToQuizSize(data.get("quizSize"))
    if teamID and not copyCount and not lang and not size:
        # printing filled-out digital quiz
        _logger.info(f"Printing filled-out digital quiz for teamID: {teamID}")
        await _currentPrinter.printQuiz(teamID)
    elif not teamID and copyCount and isinstance(copyCount, int) and copyCount > 0 and lang and size:
        # printing empty paper quiz(zes)
        _logger.info(f"Printing {copyCount} empty paper quiz(zes) with language {lang} and size {size}")
        for _ in range(copyCount):
            teamID, _ = utils.getNewTeamID(utils.QuizTypes.PAPER)
            await _currentPrinter.printQuiz(teamID, lang, size)
            await quizDBManager.addEmptyTeamEntry(teamID, lang.value, size.value)
    return web.HTTPOk()


# websockets handler for incoming websocket connections at /events
@router.get(_baseURL + "/events")
async def eventsHandler(request: web.Request):
    _logger.info(f"API GET request incoming: events")
    clientIP = request.headers.get("X-Forwarded-For", request.remote)
    clientPort = request.transport.get_extra_info("peername")[1] if request.transport else None
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    wsUtils.adminCons.append(ws)
    _logger.debug(f"New websocket client connected: {clientIP}:{clientPort}, total: {len(wsUtils.adminCons)}")
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
                if eventType in wsUtils._adminMsgEventListeners:
                    for listener in wsUtils._adminMsgEventListeners[eventType]:
                        listener(data.get("data"))
    finally:
        wsUtils.adminCons.remove(ws)
        _logger.debug(f"Websocket client disconnected: {clientIP}:{clientPort}, total: {len(wsUtils.adminCons)}")
    return ws


# ------- 404 Handlers -------
@router.get(_baseURL + "/{fn}")
async def GET_NotFound(request: web.Request) -> web.Response:
    _logger.warning(f"API GET endpoint not found: {request.match_info.get('fn')}")
    raise web.HTTPNotFound(text=f"API GET endpoint '{request.match_info.get('fn')}' doesn't exist.")


@router.post(_baseURL + "/{fn}")
async def POST_NotFound(request: web.Request) -> web.Response:
    _logger.warning(f"API POST endpoint not found: {request.match_info.get('fn')}")
    raise web.HTTPNotFound(text=f"API POST endpoint '{request.match_info.get('fn')}' doesn't exist.")

from aiohttp import web
import asyncio
import datetime
import json
import logging
import printer
import quizDBManager
import utils
import wsUtils


router = web.RouteTableDef()
_currentPrinter = printer.Printer()
asyncio.run_coroutine_threadsafe(_currentPrinter.realInit(), asyncio.get_event_loop())

_logger = logging.getLogger(__name__)
_logger.info(f"Importing {__name__}...")
_baseURL = "/api/admin"


@router.get(_baseURL + "/getStates")
async def getStatesHandler(request: web.Request):
    print(f"API GET request incoming: admin/getStates")
    return web.json_response(
        {
            "phase": utils.QuizState.phase.value,
            "currentQuizRound": utils.QuizState.currentQuizRound,
            "nextPhaseChangeAt": utils.QuizState.formatNextPhaseChangeAt(),
        }
    )


@router.get(_baseURL + "/getAllBuildingsData")
async def getAllBuildingsDataHandler(request: web.Request):
    print(f"API GET request incoming: admin/getAllBuildingsData")
    return web.json_response(await quizDBManager.getAllBuildingData())


@router.get(_baseURL + "/getLeaderboard")
async def getLeaderboardHandler(request: web.Request):
    print(f"API GET request incoming: admin/getLeaderboard")
    try:
        return web.json_response(await quizDBManager.getLeaderboard(size=request.query.get("size"), quizRound=request.query.get("round")))
    except quizDBManager.InvalidParameterError as e:
        raise web.HTTPBadRequest(text=str(e))


@router.get(_baseURL + "/getQuizDetails")
async def getQuizdataHandler(request: web.Request):
    print(f"API GET request incoming: admin/getQuizDetails")
    try:
        return web.json_response(await quizDBManager.getQuizDetails(request.query.get("teamID")))
    except quizDBManager.InvalidParameterError as e:
        raise web.HTTPBadRequest(text=str(e))


@router.post(_baseURL + "/uploadQuiz")
async def uploadQuizHandler(request: web.Request):
    print("API POST request incoming: admin/uploadQuiz")
    data: dict[str, str | int | list[dict[str, str | int]]] = await request.json()
    try:
        await quizDBManager.uploadAnswers("paper-uploadAnswers", teamID=data.get("teamID"), name=data.get("name"), answers=data.get("answers"))
    except quizDBManager.InvalidParameterError as e:
        raise web.HTTPBadRequest(text=str(e))
    return web.HTTPOk()


@router.post(_baseURL + "/queuePrint")
async def queuePrintHandler(request: web.Request):
    print(f"API POST request incoming: admin/queuePrint")
    data: dict[str, str | int] = await request.json()
    teamID = data.get("teamID")
    copyCount = data.get("copyCount")
    lang = utils.convertToQuizLanguage(data.get("language"))
    size = utils.convertToQuizSize(data.get("quizSize"))
    if teamID and not copyCount and not lang and not size: # printing filled-out digital quiz
        await _currentPrinter.printQuiz(teamID)
    elif not teamID and copyCount and isinstance(copyCount, int) and copyCount > 0 and lang and size: # printing empty paper quiz(zes)
        for _ in range(copyCount):
            teamID = utils.getNewTeamID(utils.QuizTypes.PAPER)
            await _currentPrinter.printQuiz(teamID, lang, size)
            await quizDBManager.addEmptyTeamEntry(teamID, lang.value, size.value)
    return web.HTTPOk()


@router.post(_baseURL + "/nextPhase")
async def nextPhaseHandler(request: web.Request):
    print(f"API GET request incoming: admin/nextPhase")
    data: dict[str, str] = await request.json()
    currentPhase = utils.convertToQuizPhase(data.get("currentPhase"))
    nextPhaseChangeAt = data.get("nextPhaseChangeAt") and datetime.datetime.fromisoformat(data.get("nextPhaseChangeAt")).replace(tzinfo=None) or None
    if not currentPhase:
        raise web.HTTPBadRequest(text=f"Value 'currentPhase' is invalid: {data.get('currentPhase', '<missing>')}")
    if not nextPhaseChangeAt or nextPhaseChangeAt < datetime.datetime.now():
        raise web.HTTPBadRequest(text=f"Value 'nextPhaseChangeAt' is invalid: {data.get('nextPhaseChangeAt', '<missing>')}")
    if currentPhase != utils.QuizState.phase:
        raise web.HTTPBadRequest(text=f"Value currentPhase is not the actual current phase: {currentPhase.value}")
    await utils.QuizState.updateState(nextPhase=utils.QuizState.getNextPhase(), nextPhaseChangeAt=nextPhaseChangeAt)
    return web.HTTPOk()


@router.post(_baseURL + "/setNextPhaseChangeAt")
async def setNextPhaseChangeAtHandler(request: web.Request):
    print(f"API GET request incoming: admin/setNextPhaseChangeAt")
    data: dict[str, str] = await request.json()
    nextPhaseChangeAt = data.get("nextPhaseChangeAt") and datetime.datetime.fromisoformat(data.get("nextPhaseChangeAt")) or None
    if not nextPhaseChangeAt:
        raise web.HTTPBadRequest(text=f"Value 'nextPhaseChangeAt' is invalid: {data.get('nextPhaseChangeAt', '<missing>')}")
    await utils.QuizState.updateState(nextPhaseChangeAt=nextPhaseChangeAt)
    return web.HTTPOk()


# websockets handler for incoming websocket connections at /api/admin/events
@router.get(_baseURL + "/events")
async def eventsHandler(request: web.Request):
    print(f"API GET request incoming: events")
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    wsUtils.adminCons.append(ws)
    _logger.debug(f"New websocket client connected: {ws}\nTotal: {len(wsUtils.adminCons)}")
    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.ERROR:
                _logger.warning(f"WebSocket connection closed with error: {ws.exception()}")
                print(f"WebSocket connection closed with error: {ws.exception()}")
            elif msg.type == web.WSMsgType.TEXT:
                # print("Received message on admin websocket.\nData is: " + str(msg.data))
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
                if eventType in wsUtils._adminMsgEventListeners:
                    for listener in wsUtils._adminMsgEventListeners[eventType]:
                        listener(data.get("data"))
    finally:
        wsUtils.adminCons.remove(ws)
        _logger.debug(f"WebSocket client disconnected: {ws}\nTotal: {len(wsUtils.adminCons)}")
    return ws


# ------- 404 Handlers -------
@router.get(_baseURL + "/{fn}")
async def GET_NotFound(request: web.Request) -> web.Response:
    raise web.HTTPNotFound(text=f"API GET endpoint '{request.match_info.get('fn')}' doesn't exist.")


@router.post(_baseURL + "/{fn}")
async def POST_NotFound(request: web.Request) -> web.Response:
    raise web.HTTPNotFound(text=f"API POST endpoint '{request.match_info.get('fn')}' doesn't exist.")

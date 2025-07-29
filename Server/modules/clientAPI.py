from aiohttp import web
import datetime
import logging
import modules.utils as utils

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
    rawQuizdata: list[list[str | int]] = utils.quizDB.cursor.execute(
        f"SELECT buildings.id, buildings.name_{lang}, buildings.country_{lang}, buildings.city_{lang} \
        FROM buildings JOIN quizzes ON buildings.id = quizzes.building_id \
        WHERE quizzes.quiz_number = {utils.QuizState.currentQuizNumber};"
    ).fetchall()
    quizdata = {
        str(i): {
            "id": entry[0],
            "name": entry[1],
            "country": entry[2],
            "city": entry[3],
        }
        for i, entry in enumerate(sorted(rawQuizdata, key=lambda x: x[1]))
    }
    return web.json_response(quizdata)


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
    try:  # catching all kinda errors cuz they shouldnt happen
        answers: dict[str, dict[str, int]] = data["answers"]
        utils.quizDB.cursor.executemany(
            f"INSERT INTO answers (team_id, building_id, answer) VALUES (?, ?, ?);",
            ((teamID, answer["building_id"], answer["answer"]) for answer in answers.values()),
        )
        utils.quizDB.connection.commit()
        score = utils.quizDB.cursor.execute(
            f"SELECT count(answers.id) \
            FROM teams JOIN answers ON teams.id = answers.team_id JOIN buildings ON answers.building_id = buildings.id \
            WHERE teams.id = {teamID} AND buildings.answer = answers.answer;"
        ).fetchone()[0]
        utils.quizDB.cursor.execute(
            f"INSERT INTO teams (id, name, language, quiz_number, score, submitted_at) VALUES (?, ?, ?, ?, ?);",
            (
                teamID,
                data["name"],
                data["lang"],
                utils.QuizState.currentQuizNumber,
                score,
                datetime.datetime.now().isoformat(timespec="milliseconds"),
            ),
        )
        utils.quizDB.connection.commit()
        return web.json_response({"teamID": teamID})
    except Exception as e:
        logger.error(f"Failed to upload answers: {e}")
        raise web.HTTPInternalServerError(text=f"Failed to upload answers: {e}")


@utils.router.get(baseURL + "/getAnswers")
def getAnswersHandler(request: web.Request):
    print(f"API GET request incoming: getAnswers")
    teamID = request.query.get("teamID")
    if not teamID:
        raise web.HTTPBadRequest(text="Value 'teamID' is missing")
    res = utils.quizDB.cursor.execute(f"SELECT language, score, submitted_at FROM teams WHERE teams.id = {teamID};").fetchone()
    if not res:
        raise web.HTTPNotFound(text=f"Team with ID {teamID} not found")
    lang, score, submittedAt = res
    rawData: list[list[str | int]] = utils.quizDB.cursor.execute(
        f"SELECT buildings.name_{lang}, buildings.country_{lang}, buildings.city_{lang}, answers.answer, \
        CASE WHEN buildings.answer = answers.answer THEN 1 ELSE 0 END \
        FROM answers JOIN buildings ON answers.building_id = buildings.id \
        WHERE answers.team_id = {teamID};"
    ).fetchall()
    return web.json_response(
        {
            "quizdata": {
                str(i): {
                    "name": entry[0],
                    "country": entry[1],
                    "city": entry[2],
                    "answers": entry[3],
                    "correct": bool(entry[4]),
                }
                for i, entry in enumerate(rawData)
            },
            "score": score,
            "submittedAt": submittedAt,
        }
    )


# websockets handler for incoming websocket connections at /api/events
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

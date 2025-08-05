from aiohttp import web
import datetime
import logging
import utils


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
    localisedCols = ", ".join([f"name_{lang.value}, country_{lang.value}, city_{lang.value}" for lang in utils.SupportedLanguages])
    res = utils.quizDB.cursor.execute(f"SELECT id, box, answer, {localisedCols} FROM buildings;").fetchall()
    colHeaders = ["id", "box", "answer"] + localisedCols.split(", ")
    return web.json_response({str(i): dict(zip(colHeaders, entry)) for i, entry in enumerate(res)})


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
    return web.json_response(
        {
            str(i): {
                "id": entry[0],
                "name": entry[1],
                "language": entry[2],
                "quizSize": entry[3],
                "score": entry[4],
                "submittedAt": entry[5],
            }
            for i, entry in enumerate(res)
        },
    )


@utils.router.get(_baseURL + "/getQuizdata")
async def getQuizdataHandler(request: web.Request):
    print(f"API GET request incoming: admin/getQuizdataFor")
    teamID = request.query.get("teamID")
    if not teamID:
        raise web.HTTPBadRequest(text="Value 'teamID' is missing")
    res = utils.quizDB.cursor.execute(f"SELECT language FROM teams WHERE teams.id = {teamID};").fetchone()
    if not res:
        raise web.HTTPNotFound(text=f"Team with ID {teamID} not found")
    lang = res[0]
    rawData: list[list[str | int]] = utils.quizDB.cursor.execute(
        f"SELECT buildings.name_{lang}, buildings.country_{lang}, buildings.city_{lang}, answers.answer, \
        CASE WHEN buildings.answer = answers.answer THEN 1 ELSE 0 END \
        FROM answers JOIN buildings ON answers.building_id = buildings.id \
        WHERE answers.team_id = {teamID};"
    ).fetchall()
    return web.json_response(
        {
            str(i): {
                "name": entry[0],
                "country": entry[1],
                "city": entry[2],
                "number": entry[3],
                "correct": bool(entry[4]),
            }
            for i, entry in enumerate(rawData)
        }
    )


@utils.router.post(_baseURL + "/uploadQuiz")
async def uploadQuizHandler(request: web.Request):
    print("API POST request incoming: admin/uploadQuiz")
    data = await request.json()
    if "id" not in data:
        raise web.HTTPBadRequest(text="Value 'id' is missing")
    if "name" not in data:
        raise web.HTTPBadRequest(text="Value 'name' is missing")
    if "lang" not in data or data["lang"] not in utils.SupportedLanguages:
        raise web.HTTPBadRequest(text=f"Value 'lang' is invalid: {data.get('lang', '<missing>')}")
    if "answers" not in data:
        raise web.HTTPBadRequest(text="Value 'answers' is missing")
    answers: dict[str, dict[str, int]] = data["answers"]
    if len(answers) not in utils.QuizSize:
        raise web.HTTPBadRequest(text=f"Value 'answers' has invalid number of lines: {len(answers)}")
    size = len(answers)
    teamID = utils.getNewTeamID(utils.QuizType.DIGITAL)
    try:  # catching all kinda errors cuz they shouldnt happen
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
            f"INSERT INTO teams (id, name, language, quiz_number, quiz_size, score, submitted_at) VALUES (?, ?, ?, ?, ?);",
            (
                teamID,
                data["name"],
                data["lang"],
                utils.QuizState.currentQuizNumber,
                size,
                score,
                datetime.datetime.now().isoformat(timespec="milliseconds"),
            ),
        )
        utils.quizDB.connection.commit()
        return web.json_response({"teamID": teamID})
    except Exception as e:
        _logger.error(f"Failed to upload answers: {e}")
        raise web.HTTPInternalServerError(text=f"Failed to upload answers: {e}")


@utils.router.post(_baseURL + "/queuePrintjob")
async def queuePrintjobHandler(request: web.Request):
    print(f"API POST request incoming: admin/queuePrintjob")
    data = await request.json()
    if "numberOfTests" not in data or not data["numberOfTests"].isdigit():
        raise web.HTTPBadRequest(text="Value 'numberOfTests' is missing")
    if "language" not in data or data["language"] not in utils.SupportedLanguages:
        raise web.HTTPBadRequest(text=f"Value 'language' is invalid: {data.get('language', '<missing>')}")
    if "size" not in data or data["size"] not in utils.QuizSize:
        raise web.HTTPBadRequest(text=f"Value 'size' is invalid: {data.get('size', '<missing>')}")
    print(f"New print job: {data['numberOfTests']} copies of type {utils.QuizSize(data['size']).name} in {utils.SupportedLanguages(data['language']).name}")
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

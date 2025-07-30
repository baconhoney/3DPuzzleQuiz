from aiohttp import web
import datetime
import logging
import modules.utils as utils
import modules.quizDBManager as quizDBManager

logger = logging.getLogger(__name__)
logger.info(f"Importing {__name__}...")
baseURL = "/api/admin"


@utils.router.get(baseURL + "/getAllBuildingsData")
async def getAllBuildingsDataHandler(request: web.Request):
    print(f"API GET request incoming: admin/getAllBuildingsData")
    localisedCols = ", ".join([f"name_{lang.value}, country_{lang.value}, city_{lang.value}" for lang in utils.SupportedLanguages])
    res = utils.quizDB.cursor.execute(f"SELECT id, box, answer, {localisedCols} FROM buildings;").fetchall()
    colHeaders = ["id", "box", "answer"] + localisedCols.split(", ")
    return web.json_response({str(i): dict(zip(colHeaders, entry)) for i, entry in enumerate(res)})


@utils.router.get(baseURL + "/getQuizResults")
async def getQuizResultsHandler(request: web.Request):
    print(f"API GET request incoming: admin/getResults")
    res: list[list[str | int]] = utils.quizDB.cursor.execute(
        f"SELECT id, name, score, submitted_at FROM teams WHERE quiz_number = {utils.QuizState.currentQuizNumber} \
        ORDER BY score DESC, submitted_at ASC;",
    ).fetchall()
    if not res:
        return web.json_response({})
    return web.json_response(
        {
            str(i): {
                "teamID": entry[0],
                "name": entry[1],
                "score": entry[2],
                "submittedAt": entry[3],
            }
            for i, entry in enumerate(res)
        },
    )


@utils.router.get(baseURL + "/getQuizdata")
async def getQuizdataHandler(request: web.Request):
    print(f"API GET request incoming: admin/getQuizdata")
    teamID = request.query.get("teamID")
    if not teamID:
        raise web.HTTPBadRequest(text="Value 'teamID' is missing")
    return web.json_response(quizDBManager.getAnswers(teamID)["quizdata"])


@utils.router.post(baseURL + "/uploadQuiz")
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


@utils.router.get(baseURL + "/getStates")
async def getStatesHandler(request: web.Request):
    print(f"API GET request incoming: admin/getStates")
    return web.json_response({
        "phase": utils.QuizState.phase.value,
        "currentQuizNumber": utils.QuizState.currentQuizNumber,
        "nextQuizAt": utils.QuizState.formatNextQuizAt(),
    })


@utils.router.post(baseURL + "/queuePrintjob")
async def queuePrintjobHandler(request: web.Request):
    print(f"API POST request incoming: admin/queuePrintjob")
    data = request.json()
    if "numberOfTests" not in data:
        raise web.HTTPBadRequest(text="Value 'numberOfTests' is missing")
    if "language" not in data or data["language"] not in utils.SupportedLanguages:
        raise web.HTTPBadRequest(text=f"Value 'language' is invalid: {data.get('language', '<missing>')}")
    if "type" not in data or data["type"] not in utils.QuizType:
        raise web.HTTPBadRequest(text=f"Value 'type' is invalid: {data.get('type', '<missing>')}")
    print(f"New print job: {data['numberOfTests']} copies of type {utils.QuizType(data['type']).name} in {utils.SupportedLanguages(data['language']).name}")
    for _ in range(data["numberOfTests"]):
        pass # call print function
    return web.HTTPOk()


# ------- 404 Handlers -------
@utils.router.get(baseURL + "/{fn}")
async def GET_NotFound(request: web.Request) -> web.Response:
    raise web.HTTPNotFound(text=f"API GET endpoint '{request.match_info.get('fn')}' doesn't exist.")


@utils.router.post(baseURL + "/{fn}")
async def POST_NotFound(request: web.Request) -> web.Response:
    raise web.HTTPNotFound(text=f"API POST endpoint '{request.match_info.get('fn')}' doesn't exist.")

from aiohttp import web
import datetime
import logging
import modules.utils as utils

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
                "id": entry[0],
                "name": entry[1],
                "score": entry[2],
                "submittedAt": entry[3],
            }
            for i, entry in enumerate(res)
        },
    )


@utils.router.get(baseURL + "/getQuizdata")
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


# ------- 404 Handlers -------
@utils.router.get(baseURL + "/{fn}")
async def GET_NotFound(request: web.Request) -> web.Response:
    raise web.HTTPNotFound(text=f"API GET endpoint '{request.match_info.get('fn')}' doesn't exist.")


@utils.router.post(baseURL + "/{fn}")
async def POST_NotFound(request: web.Request) -> web.Response:
    raise web.HTTPNotFound(text=f"API POST endpoint '{request.match_info.get('fn')}' doesn't exist.")

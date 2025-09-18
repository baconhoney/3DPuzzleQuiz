import logging

_logger = logging.getLogger(__name__)
_logger.info(f"Importing {__name__}...")


import os

os.environ["PYPPETEER_DOWNLOAD_HOST"] = "https://commondatastorage.googleapis.com"
os.environ["PYPPETEER_CHROMIUM_REVISION"] = "1181217"

from barcode import Code128
from io import BytesIO
from pyppeteer import launch
import asyncio
import atexit
import datetime
import htmlReplacer
import math
import pathlib
import quizDBManager
import sys
import utils

def launchCallback(result: asyncio.Future):
    global _browser
    _browser = result.result()

_locals = utils.Localisation()
_logger.debug("Localisation initialized.")
_logger.info("Launching browser...")
_browser = asyncio.get_event_loop().run_until_complete(launch(args=["--no-sandbox"]))
_logger.info("Browser launch complete and atexit handler registered.")

pdfPath = pathlib.Path("./temp.pdf").resolve()

async def generatePDF(teamID: int, lang: utils.QuizLanguages = None, size: utils.QuizSizes = None) -> pathlib.Path:
    if await quizDBManager.checkIfTeamExists(teamID):
        _logger.debug(f"Generating filled-out digital quiz for team {teamID} with lang '{lang}' and size '{size}' (should be None)")
        if lang or size:
            raise RuntimeError("Parameters `lang` and `size` are not allowed when generating filled-out digital quiz")
        details = await quizDBManager.getQuizDetails(teamID)
        _logger.debug(f"Fetched quiz details for team {teamID}: {details}")
        details["questions"] = [{**row, "correct": row["correct"] and "✓" or "X"} for row in details["questions"]]
        quizLang = details["language"]
        quizSize = len(details["questions"])
    else:
        _logger.debug(f"Generating empty paper quiz for team {teamID} with lang '{lang}' and size '{size}' (should not be None)")
        if not lang:
            raise RuntimeError(f"Parameter `lang` is missing")
        if not size:
            raise RuntimeError(f"Parameter `size` is missing")
        quizLang = lang.value
        quizSize = size.value
        questions_list = await quizDBManager.getQuestions(quizLang, quizSize)
        _logger.debug(f"Fetched {len(questions_list)} questions for new quiz.")
        details = {
            "teamname": "",
            "language": quizLang,
            "score": "",
            "submittedAt": "",
            "questions": [{**row, "answer": "", "correct": ""} for row in questions_list],
        }

    _locals.setlang(utils.convertToQuizLanguage(details["language"]))
    _logger.debug(f"Language set for localisation: {details['language']}")
    questions = details["questions"]
    n = math.ceil(len(questions) / 25)
    k, m = divmod(len(questions), n)
    details["pages"] = [{"pageNumber": i + 1, "questions": questions[i * k + min(i, m) : (i + 1) * k + min(i + 1, m)]} for i in range(n)]
    _logger.debug(f"Divided questions into {n} pages.")
    details["testname"] = f"{_locals('test_name')} {utils.QuizState.currentQuizRound:02}"
    details["testlegend"] = _locals("test_legend") + " - " + str(datetime.datetime.now().year)
    details["teamname"] = _locals("teamname") + ": " + (details["teamname"] or "_______________________________")
    details["instruction"] = _locals("instruction")
    details["questionCol_name_name"] = _locals("questionCol_name_name")
    details["questionCol_location_name"] = _locals("questionCol_location_name")
    details["questionCol_answer_name"] = _locals("questionCol_answer_name")
    details["totalPages"] = n
    details["timestamp"] = details["submittedAt"] and _locals("submittedAt_name") + ": " + datetime.datetime.fromisoformat(details["submittedAt"]).strftime("%H:%M:%S")
    details["score"] = f"{_locals('score_name')}: {details['score'] or '____'} / {quizSize}"
    svgFile = BytesIO()
    Code128(str(teamID)).write(svgFile, options={"module_width": 0.3, "module_height": 15})
    details["svgstring"] = ("<svg" + svgFile.getvalue().decode("utf-8").split("<svg")[1]).strip().replace("\n\n", "\n")
    _logger.debug(f"Generated barcode SVG for team {teamID}.")

    with open(utils.paths.dataRoot / "PaperQuizTemplate.html", encoding="UTF-8") as f:
        html = htmlReplacer.render_template(f.read(), details)
    _logger.info(f"Rendered HTML for team {teamID}, quiz size {quizSize}.")

    page = await _browser.newPage()
    _logger.debug("Browser page created.")
    await page.setContent(html)
    _logger.debug("HTML content set in browser page.")
    timeout = 10 # seconds
    while pdfPath.exists() and pdfPath.is_file():
        _logger.warning(f"PDF file already exists, waiting for {timeout} second(s) for removal...")
        timeout -= 1
        await asyncio.sleep(1)
        if timeout < 1:
            _logger.warning("PDF file not deleted for 10 seconds, removing it.")
            pdfPath.unlink()
    await page.pdf(path=str(pdfPath), format="A4", printBackground=True, preferCSSPageSize=True)
    _logger.info("PDF generated from quiz HTML.")
    await page.close()
    _logger.debug("Browser page closed.")
    return pdfPath


async def main():
    logging.basicConfig(
        level="DEBUG",
        stream=sys.stdout,
        format="%(asctime)s %(name)-20s %(levelname)-7s> %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    _logger.info("Starting test quiz pdf generation in main().")
    print("Path:", await generatePDF(int(5e10 - 1), utils.QuizLanguages.EN, utils.QuizSizes.SIZE_20))
    # print("Path:", await generatePDF(5434615008))
    _logger.info("Finished test quiz pdf generation in main().")


if __name__ == "__main__":
    asyncio.run(main())

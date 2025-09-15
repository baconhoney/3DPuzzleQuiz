import logging

logging.getLogger(__name__).info(f"Importing {__name__}...")


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
import quizDBManager
import subprocess
import sys
import utils


# pyppeteer.DEBUG = True


class Printer:
    def __init__(self):
        logging.getLogger("pyppeteer").setLevel(logging.INFO)
        logging.getLogger("websockets.client").setLevel(logging.INFO)
        logging.getLogger("pyppeteer.launcher").setLevel(logging.WARNING)
        self._logger = logging.getLogger(__name__)
        self._logger.info("Initializing Printer instance.")
        self._browser = None
        # collect all printers
        if sys.platform == "linux":
            printers = subprocess.run("lpstat -p | grep '^printer' | awk '{print $2}'", stdout=subprocess.PIPE, shell=True).stdout.decode("utf-8").strip().split("\n")
            self._logger.debug(f"Found {len(printers)} local printers on Linux.")
            # print all printers and ask for selecting one
            preselected = -1
            print("-----------------\nAvailable printers:")
            for index, printer in enumerate(printers):
                print(f"{index:2}: {printer}")
                if printer == "DCPL2510D":
                    preselected = index
            while True:
                inp = input(f"Select device (0-{index}): " + preselected > -1 and f"use {preselected}?" or "")
                try:
                    self._printerName = printers[int(inp or str(preselected))]
                    print(f"Selected printer: {self._printerName}")
                    break
                except:
                    print(f"Invalid input: {inp}, try again.")
        else:
            self._printerName = None
            self._logger.warning(f"Printing is not supported on {sys.platform}. Printing will be skipped.")

    async def realInit(self):
        self._locals = utils.Localisation()
        self._logger.debug("Localisation initialized.")
        self._logger.info("Launching browser...")
        self._browser = await launch(args=["--no-sandbox"])
        atexit.register(lambda: asyncio.run(self._browser.close()))
        self._logger.debug("Browser launch complete and atexit handler registered.")

    async def printQuiz(self, teamID: int, lang: utils.QuizLanguages = None, size: utils.QuizSizes = None):
        if await quizDBManager.checkIfTeamExists(teamID):
            self._logger.debug(f"Printing filled-out quiz for team {teamID} with lang '{lang}' and size '{size}' (should be None)")
            if lang or size:
                raise RuntimeError("Parameters `lang` and `size` are not allowed when printing filled-out quiz")
            details = await quizDBManager.getQuizDetails(teamID)
            self._logger.debug(f"Fetched quiz details for team {teamID}: {details}")
            details["questions"] = [{**row, "correct": row["correct"] and "✓" or "X"} for row in details["questions"]]
            quizLang = details["language"]
            quizSize = len(details["questions"])
        else:
            self._logger.debug(f"Printing empty paper quiz for team {teamID} with lang '{lang}' and size '{size}' (should not be None)")
            if not lang:
                raise RuntimeError(f"Parameter `lang` is missing")
            if not size:
                raise RuntimeError(f"Parameter `size` is missing")
            quizLang = lang.value
            quizSize = size.value
            questions_list = await quizDBManager.getQuestions(quizLang, quizSize)
            self._logger.debug(f"Fetched {len(questions_list)} questions for new quiz.")
            details = {
                "teamname": "",
                "language": quizLang,
                "score": "",
                "submittedAt": "",
                "questions": [{**row, "answer": "", "correct": ""} for row in questions_list],
            }

        self._locals.setlang(utils.convertToQuizLanguage(details["language"]))
        self._logger.debug(f"Language set for localisation: {details['language']}")
        questions = details["questions"]
        n = math.ceil(len(questions) / 25)
        k, m = divmod(len(questions), n)
        details["pages"] = [{"pageNumber": i + 1, "questions": questions[i * k + min(i, m) : (i + 1) * k + min(i + 1, m)]} for i in range(n)]
        self._logger.debug(f"Divided questions into {n} pages.")
        details["testname"] = f"{self._locals('test_name')} {utils.QuizState.currentQuizRound:02}"
        details["testlegend"] = self._locals("test_legend") + " - " + str(datetime.datetime.now().year)
        details["teamname"] = self._locals("teamname") + ": " + (details["teamname"] or "_______________________________")
        details["instruction"] = self._locals("instruction")
        details["questionCol_name_name"] = self._locals("questionCol_name_name")
        details["questionCol_location_name"] = self._locals("questionCol_location_name")
        details["questionCol_answer_name"] = self._locals("questionCol_answer_name")
        details["totalPages"] = n
        details["timestamp"] = details["submittedAt"] and self._locals("submittedAt_name") + ": " + datetime.datetime.fromisoformat(details["submittedAt"]).strftime("%H:%M:%S")
        details["score"] = f"{self._locals('score_name')}: {details['score'] or '____'} / {quizSize}"
        svgFile = BytesIO()
        Code128(str(teamID)).write(svgFile, options={"module_width": 0.3, "module_height": 15})
        details["svgstring"] = ("<svg" + svgFile.getvalue().decode("utf-8").split("<svg")[1]).strip().replace("\n\n", "\n")
        self._logger.debug(f"Generated barcode SVG for team {teamID}.")

        with open(utils.paths.dataRoot / "PaperQuizTemplate.html", encoding="UTF-8") as f:
            html = htmlReplacer.render_template(f.read(), details)
        self._logger.info(f"Rendered HTML for team {teamID}, quiz size {quizSize}.")

        page = await self._browser.newPage()
        self._logger.debug("Browser page created.")
        await page.setContent(html)
        self._logger.debug("HTML content set in browser page.")
        await page.pdf(path="temp.pdf", format="A4", printBackground=True, preferCSSPageSize=True)
        self._logger.info("PDF generated from quiz HTML.")
        await page.close()
        self._logger.debug("Browser page closed.")

        if sys.platform == "linux" and self._printerName:
            self._logger.debug(f"Printing PDF to Linux printer {self._printerName}.")
            subprocess.run(f"lpr -P {self._printerName} -o media=A4 -o sides=two-sided-long-edge -o print-quality=5 -r temp.pdf", shell=True, check=True)
            self._logger.info(f"PDF sent to printer {self._printerName} for team {teamID}.")
        else:
            self._logger.warning(f"Printing is not supported on {sys.platform}. PDF is created, and will not be deleted until a new printjob is requested.")


async def main():
    logging.basicConfig(
        level="DEBUG",
        stream=sys.stdout,
        format="%(asctime)s %(name)-20s %(levelname)-7s> %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    printer = Printer()
    await printer.realInit()
    printer._logger.info("Starting test quiz print in main().")
    await printer.printQuiz(int(5e10 - 1), utils.QuizLanguages.EN, utils.QuizSizes.SIZE_20)
    printer._logger.info("Finished test quiz print in main().")
    # await printer.printQuiz(5434615008)


if __name__ == "__main__":
    asyncio.run(main())

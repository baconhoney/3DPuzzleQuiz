import os

os.environ["PYPPETEER_DOWNLOAD_HOST"] = "https://commondatastorage.googleapis.com"
os.environ["PYPPETEER_CHROMIUM_REVISION"] = "1181217"

from barcode import Code128
from io import BytesIO
from pyppeteer import launch
from yattag import Doc
import asyncio
import atexit
import datetime
import htmlReplacer
import logging
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
        self._locals = utils.Localisation()
        self._browser = None
        # collect all printers
        if sys.platform == "win32":
            from win32 import win32print

            printers = [i[2] for i in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL, None, 1)]
        elif sys.platform == "linux":
            printers = subprocess.run("lpstat -p | grep '^printer' | awk '{print $2}'", stdout=subprocess.PIPE, shell=True).stdout.decode("utf-8").strip().split("\n")
        else:
            raise RuntimeError(f"Unsupported platform: {sys.platform}")
        # print all printers and ask for selecting one
        preselected = -1
        print("-----------------\nAvailable printers:")
        for index, printer in enumerate(printers):
            print(f"{index:2}: {printer}")
            if printer == "DCPL2510D":
                preselected = index
        while True:
            if preselected > -1:
                inp = input(f"Select device (0-{index}): use {preselected}?")
            else:
                inp = input(f"Select device (0-{index}): ")
            try:
                self._printerName = printers[int(inp or str(preselected))]
                break
            except:
                print(f"Invalid input: {inp}, try again.")
        print(f"Selected printer: {self._printerName}")

    async def realInit(self):
        self._browser = await launch(args=['--no-sandbox'])
        atexit.register(lambda: asyncio.run(self._browser.close()))

    async def printQuiz(self, teamID: int, lang: utils.QuizLanguages = None, size: utils.QuizSizes = None):
        if (await quizDBManager.checkIfTeamExists(teamID)):
            self._logger.debug(f"Printing filled-out quiz for team {teamID} with lang '{lang}' and size '{size}' (should be None)")
            if lang or size:
                raise RuntimeError("Parameters `lang` and `size` are not allowed when printing filled-out quiz")
            details = await quizDBManager.getQuizDetails(teamID)
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
            details = {
                "teamname": "",
                "language": quizLang,
                "score": "",
                "submittedAt": "",
                "questions": [{**row, "answer": "", "correct": ""} for row in await quizDBManager.getQuestions(quizLang, quizSize)],
            }

        self._locals.setlang(utils.convertToQuizLanguage(details["language"]))
        questions = details["questions"]
        n = math.ceil(len(questions) / 25)
        k, m = divmod(len(questions), n)
        details["pages"] = [{"pageNumber": i + 1, "questions": questions[i * k + min(i, m) : (i + 1) * k + min(i + 1, m)]} for i in range(n)]
        details["testname"] = f"{self._locals("test_name")} {utils.QuizState.currentQuizRound:02}"
        details["testlegend"] = self._locals("test_legend") + " - " + str(datetime.datetime.now().year)
        details["teamname"] = self._locals("teamname") + ": " + (details["teamname"] or "_______________________________")
        details["instruction"] = self._locals("instruction")
        details["questionCol_name_name"] = self._locals("questionCol_name_name")
        details["questionCol_location_name"] = self._locals("questionCol_location_name")
        details["questionCol_answer_name"] = self._locals("questionCol_answer_name")
        details["totalPages"] = n
        details["timestamp"] = details["submittedAt"] and self._locals("submittedAt_name") + ": " + datetime.datetime.fromisoformat(details["submittedAt"]).strftime("%H:%M:%S")
        details["score"] = f"{self._locals("score_name")}: {details["score"] or "____"} / {quizSize}"
        svgFile = BytesIO()
        Code128(str(teamID)).write(svgFile, options={"module_width": 0.3, "module_height": 15})
        details["svgstring"] = ("<svg" + svgFile.getvalue().decode("utf-8").split("<svg")[1]).strip().replace("\n\n", "\n")

        with open(utils.paths.dataRoot / "PaperQuizTemplate.html", encoding="UTF-8") as f:
            html = htmlReplacer.render_template(f.read(), details)
        # with open("temp.html", mode="w", encoding="UTF-8") as f: f.write(html)

        page = await self._browser.newPage()
        await page.setContent(html)
        # await page.screenshot(path="temp.png", fullPage=True)
        await page.pdf(path="temp.pdf", format="A4", printBackground=True, preferCSSPageSize=True)
        await page.close()
        if sys.platform == "win32":
            self._logger.debug(f"Printing pdf to printer {self._printerName}, with id {teamID}, lang {quizLang}, size {quizSize}")
            subprocess.run(f'"{utils.paths.appRoot / "PDFToPrinter.exe"}" temp.pdf "{self._printerName}"', shell=True, check=True)
            os.unlink("temp.pdf")
            pass
        elif sys.platform == "linux":
            self._logger.debug(f"Printing pdf to printer {self._printerName}, with id {teamID}, lang {quizLang}, size {quizSize}")
            subprocess.run(f"lpr -P {self._printerName} -o media=A4 -o sides=two-sided-long-edge -o print-quality=5 temp.pdf", shell=True, check=True)
            pass
        else:
            raise RuntimeError(f"Unsupported platform: {sys.platform}")


async def main():
    logging.basicConfig(
        level="DEBUG",
        stream=sys.stdout,
        format="%(asctime)s %(name)-20s %(levelname)-7s> %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    printer = Printer()
    await printer.realInit()
    await printer.printQuiz(int(5e10 - 1), utils.QuizLanguages.EN, utils.QuizSizes.SIZE_20)
    # await printer.printQuiz(5434615008)


if __name__ == "__main__":
    asyncio.run(main())

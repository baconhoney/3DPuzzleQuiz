import logging

_logger = logging.getLogger(__name__)
_logger.info(f"Importing {__name__}...")


from pdfGenerator import generatePDF
import asyncio
import subprocess
import sys
import utils


# collect all printers
if sys.platform == "linux":
    printers = subprocess.run("lpstat -p | grep '^printer' | awk '{print $2}'", stdout=subprocess.PIPE, shell=True).stdout.decode("utf-8").strip().split("\n")
    _logger.debug(f"Found {len(printers)} local printers on Linux.")
    # print all printers and ask for selecting one
    preselected = -1
    index = -1
    print("-----------------\nAvailable printers:")
    for index, printer in enumerate(printers):
        print(f"{index:2}: {printer}")
        if printer == "DCPL2510D":
            preselected = index
    while True:
        inp = input(f"Select device (0-{index}): " + (preselected > -1 and f"use {preselected}?" or ""))
        try:
            _printerName = printers[int(inp or str(preselected))]
            print(f"Selected printer: {_printerName}")
            break
        except:
            print(f"Invalid input: {inp}, try again.")
else:
    _printerName = None
    _logger.warning(f"Printing is not supported on {sys.platform}. Printing will be skipped.")


async def printQuiz(teamID: int, lang: utils.QuizLanguages | None = None, size: utils.QuizSizes | None = None):
    pdfPath = await generatePDF(teamID, lang, size)
    if sys.platform == "linux" and _printerName:
        _logger.debug(f"Printing PDF to Linux printer {_printerName}.")
        subprocess.run(f"lpr -P {_printerName} -o media=A4 -o sides=two-sided-long-edge -o print-quality=5 -r '{str(pdfPath)}'", shell=True, check=True)
        _logger.info(f"PDF sent to printer {_printerName} for team {teamID}: {str(pdfPath)}.")
    else:
        _logger.warning(f"Printing is not supported on {sys.platform}. PDF is created at {str(pdfPath)}, and will not be deleted until a new printjob is requested and 10 seconds have passed.")


async def _main():
    logging.basicConfig(
        level="DEBUG",
        stream=sys.stdout,
        format="%(asctime)s %(name)-20s %(levelname)-7s> %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    _logger.info("Starting test quiz print in main().")
    await printQuiz(int(5e10 - 1), utils.QuizLanguages.EN, utils.QuizSizes.SIZE_20)
    # await printer.printQuiz(5434615008)
    _logger.info("Finished test quiz print in main().")


if __name__ == "__main__":
    asyncio.run(_main())

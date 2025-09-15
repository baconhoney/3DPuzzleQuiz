import logging
import sys

# set up logging before importing modules, so they can log
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.WARNING,
    stream=sys.stdout,
    format="%(asctime)s %(name)-20s %(levelname)-7s> %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger.setLevel(logging.DEBUG)
logger.info("Logging configured for main module, started logging")

# set level of logging for each module
loggingLevel = logging.DEBUG

logging.getLogger("quizDB").setLevel(loggingLevel)
logging.getLogger("quizDBManager").setLevel(loggingLevel)
logging.getLogger("utils").setLevel(loggingLevel)
logging.getLogger("wsUtils").setLevel(loggingLevel)
logging.getLogger("htmlReplacer").setLevel(logging.WARNING)
logging.getLogger("printer").setLevel(loggingLevel)
logging.getLogger("scanner").setLevel(loggingLevel)
logging.getLogger("fileServer").setLevel(loggingLevel)
logging.getLogger("clientAPI").setLevel(loggingLevel)
logging.getLogger("adminAPI").setLevel(loggingLevel)

logger.debug("Logging configured for all modules")


from aiohttp import web
import asyncio
import dotenv
import os
import pathlib
import threading

# make new event loop and set it as default
asyncio.set_event_loop(asyncio.new_event_loop())

# add local modules to pythonpath (each top level file needs this)
sys.path.insert(1, str(pathlib.Path("./modules").resolve()))
os.environ["QUIZSERVER_ROOT"] = str(pathlib.Path(__file__).parent.resolve().as_posix())

# dotenv can be loaded because we explicitly set the 'ROOT' path before calling load_dotenv()
dotenv.load_dotenv()
specsFile = pathlib.Path("./server_specifics.env").resolve()
if specsFile.exists():
    dotenv.load_dotenv(str(specsFile))

port = int(os.getenv("QUIZSERVER_PORT", 80))


#################### START OF MAIN ####################
from scanner import Scanner
import quizDBManager
import utils
import wsUtils

# import the routers from the modules
from fileServer import router as fileServerRouter
from clientAPI import router as clientRouter
from adminAPI import router as adminRouter


async def callbackFn(value: str):
    logger.debug(f"Executing callbackFn with value: {value}")
    if not value or not value.isdigit() or int(value) < utils.TeamIDLimits.PAPER_MIN or int(value) > utils.TeamIDLimits.PAPER_MAX:
        logger.info(f"Scanner input is not a valid teamID: {value}")
    try:
        if await quizDBManager.checkIfSubmittedAtIsPresent(int(value)):
            logger.debug(f"Team {value} has already submitted, broadcasting showQuiz")
            await wsUtils.broadcastToAdmins("showQuiz", {"teamID": int(value)})
        else:
            logger.debug(f"Registering scanned team: {value}")
            await quizDBManager.updateSubmittedAt(int(value))
    except quizDBManager.InvalidParameterError:
        logger.info(f"Scanned teamID cannot be found: {value}")


async def startScannerListener(_: web.Application):
    logger.info("Starting scanner listener...")
    stopEvent = threading.Event()
    scannerTask = asyncio.create_task(Scanner(callbackFn, asyncio.get_event_loop()).run_forever(stopEvent))
    logger.info("Scanner listener started")
    yield
    logger.info("Stopping scanner listener...")
    stopEvent.set()
    asyncio.get_event_loop().stop()
    await scannerTask
    logger.info("Scanner listener stopped")


def main():
    logger.info("Starting main web application")
    app = web.Application()
    # app.cleanup_ctx.append(startScannerListener)
    app.add_routes(adminRouter)
    logger.debug("Admin router added")
    # client has to be 2nd last, so sub-API requests are not refused with 404
    app.add_routes(clientRouter)
    logger.debug("Client router added")
    # fileserver has to be the very last, so API requests are not refused with 404
    app.add_routes(fileServerRouter)
    logger.debug("FileServer router added")
    web.run_app(app, port=port, loop=asyncio.get_event_loop())
    logger.info(f"Web application running on port {port}")


# ------- Entrypoint -------
if __name__ == "__main__":
    logger.info("Starting server from main.py")
    main()
    logger.info("Server stopped")

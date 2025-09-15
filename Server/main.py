from aiohttp import web
import asyncio
import dotenv
import logging
import os
import pathlib
import sys
import threading


# add local modules to pythonpath (each top level file needs this)
sys.path.insert(1, str(pathlib.Path("./modules").resolve()))
os.environ["QUIZSERVER_ROOT"] = str(pathlib.Path(__file__).parent.resolve().as_posix())

# dotenv can be loaded because we explicitly set the 'ROOT' path before calling load_dotenv()
dotenv.load_dotenv()
specsFile = pathlib.Path("./server_specifics.env").resolve()
if specsFile.exists():
    dotenv.load_dotenv(str(specsFile))

port = int(os.getenv("QUIZSERVER_PORT", 80))

# set up logging before importing modules, so they can log
logging.basicConfig(
    level=logging.WARNING,
    stream=sys.stdout,
    format="%(asctime)s %(name)-20s %(levelname)-7s> %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)


#################### START OF MAIN ####################
from scanner import Scanner
import quizDBManager
import wsUtils

# import the routers from the modules
from fileServer import router as fileServerRouter
from clientAPI import router as clientRouter
from adminAPI import router as adminRouter

# set level of logging for each module

loggingLevel = logging.DEBUG

logging.getLogger("scanner").setLevel(loggingLevel)
logging.getLogger("quizDB").setLevel(loggingLevel)
logging.getLogger("quizDBManager").setLevel(loggingLevel)
logging.getLogger("utils").setLevel(loggingLevel)
logging.getLogger("wsUtils").setLevel(loggingLevel)
logging.getLogger("htmlReplacer").setLevel(loggingLevel)
logging.getLogger("printer").setLevel(loggingLevel)
logging.getLogger("fileServer").setLevel(loggingLevel)
logging.getLogger("clientAPI").setLevel(loggingLevel)
logging.getLogger("adminAPI").setLevel(loggingLevel)

logger.setLevel(logging.DEBUG)
logger.debug("Testing logger")

# print("Path for CWD", utils.paths.cwd)
# print("Path for cfgRoot", utils.paths.cfgRoot)
# print("Path for dataRoot", utils.paths.dataRoot)
# print("Path for clientRoot", utils.paths.clientRoot)
# print("Path for searchRoot", utils.paths.searchRoot)
# print("Path for adminRoot", utils.paths.adminRoot)


async def callbackFn(value: str):
    logger.debug("Executing callbackFunction")
    if not value or not value.isdigit():
        print(f"Scanner input is not a teamID: {value}")
    try:
        if await quizDBManager.checkIfSubmittedAtIsPresent(int(value)):
            # team has already submitted, show quiz on admin page
            logger.debug(f"Scanned team has already submitted: {value}")
            await wsUtils.broadcastToAdmins("showQuiz", {"teamID": int(value)})
        else:
            # team is not yet registered, register it
            logger.debug(f"Scanned team needs registering: {value}")
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
    loop.stop()
    await scannerTask
    logger.info("Scanner listener stopped")


def main():
    app = web.Application()
    # app.cleanup_ctx.append(startScannerListener)
    app.add_routes(adminRouter)
    # client has to be 2nd last, so sub-API requests are not refused with 404
    app.add_routes(clientRouter)
    # fileserver has to be the very last, so API requests are not refused with 404
    app.add_routes(fileServerRouter)
    web.run_app(app, port=port, loop=asyncio.get_event_loop())


# ------- Entrypoint -------
if __name__ == "__main__":
    main()

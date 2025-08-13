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
loggingLevel = "DEBUG"
logging.basicConfig(
    level=loggingLevel.upper(),
    stream=sys.stdout,
    format="%(asctime)s %(name)-20s %(levelname)-7s> %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logging.debug("Testing logger")
logging.getLogger("aiohttp").setLevel("INFO")
logging.getLogger("asyncio").setLevel("INFO")


#################### START OF MAIN ####################
import quizDBManager
import utils
from scanner import Scanner

# import the routers from the modules
from fileServer import router as fileServerRouter
from clientAPI import router as clientRouter
from adminAPI import router as adminRouter


print("Path for CWD", utils.paths.cwd)
print("Path for cfgRoot", utils.paths.cfgRoot)
print("Path for dataRoot", utils.paths.dataRoot)
print("Path for clientRoot", utils.paths.clientRoot)
print("Path for searchRoot", utils.paths.searchRoot)
print("Path for adminRoot", utils.paths.adminRoot)


def callbackFn(value: str):
    if not value or not value.isdigit():
        print(f"Scanner input is not a teamID: {value}")
    asyncio.run(quizDBManager.updateSubmittedAt(int(value)))


async def startScannerListener(_: web.Application):
    logging.info("Starting scanner listener...")
    stopEvent = threading.Event()
    scannerTask = asyncio.create_task(Scanner(callbackFn).run_forever(stopEvent))
    logging.info("Scanner listener started")
    yield
    logging.info("Stopping scanner listener...")
    stopEvent.set()
    await scannerTask
    logging.info("Scanner listener stopped")


def main():
    app = web.Application()
    app.cleanup_ctx.append(startScannerListener)
    app.add_routes(adminRouter)
    # client has to be 2nd last, so sub-API requests are not refused with 404
    app.add_routes(clientRouter)
    # fileserver has to be the very last, so API requests are not refused with 404
    app.add_routes(fileServerRouter)
    web.run_app(app, port=port)


# ------- Entrypoint -------
if __name__ == "__main__":
    main()

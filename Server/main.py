import pathlib
import sys

# add local modules to pythonpath (each top level file needs this)
sys.path.insert(1, str(pathlib.Path("./modules").resolve()))


#################### START OF MAIN ####################
from aiohttp import web
import logging

# set up logging
loggingLevel = "DEBUG"
logging.basicConfig(
    level=loggingLevel.upper(),
    stream=sys.stdout,
    format="%(asctime)s %(name)-20s %(levelname)-7s> %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logging.debug("Testing logger")
logging.getLogger("aiohttp").setLevel("WARNING")

# import the routers from the modules
from adminAPI import router as adminRouter
from clientAPI import router as clientRouter
from fileServer import router as fileServerRouter


def main():
    app = web.Application()
    # client has to be 2nd last, so sub-API requests are not refused with 404
    # fileserver has to be the very last, so API requests are not refused with 404
    app.add_routes(adminRouter)
    app.add_routes(clientRouter)
    app.add_routes(fileServerRouter)
    web.run_app(app, port=1006)


# ------- Entrypoint -------
if __name__ == "__main__":
    main()

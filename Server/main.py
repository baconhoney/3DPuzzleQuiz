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


# import the modules to add them to the program
from utils import router
import adminAPI

# client has to be 2nd last, so sub-API requests are not refused with 404
import clientAPI

# fileserver has to be the very last
import fileServer


def main():
    app = web.Application()
    app.add_routes(router)
    web.run_app(app, port=1006)


# ------- Entrypoint -------
if __name__ == "__main__":
    main()

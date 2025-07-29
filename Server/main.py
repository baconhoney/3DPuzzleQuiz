from aiohttp import web
import dotenv
import logging
import os
import pathlib
import sys

# set up logging
loggingLevel = "DEBUG"
logging.basicConfig(
    level=loggingLevel.upper(),
    stream=sys.stdout,
    format="%(asctime)s %(name)-20s %(levelname)-7s> %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logging.debug("Testing logger")

# add local modules to pythonpath
# sys.path.insert(1, str(pathlib.Path(__file__).parent.resolve() / "modules"))

# get main file path for determining the root of the program
os.environ["CWD"] = str(pathlib.Path(__file__).parent.resolve().as_posix())
dotenv.load_dotenv()

# import the modules to add them to the program
from modules.utils import router
import modules.adminAPI as adminAPI
import modules.clientAPI as clientAPI  # client has to be 2nd last, so sub-API requests are not refused with 404
import modules.fileServer as fileServer  # fileserver has to be the very last


def main():
    app = web.Application()
    app.add_routes(router)
    web.run_app(app, port=1006)


# ------- Entrypoint -------
if __name__ == "__main__":
    main()

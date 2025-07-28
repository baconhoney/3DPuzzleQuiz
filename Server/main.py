from aiohttp import web
import dotenv
import logging
import os
import pathlib
import sys

# get main file path for determining the root of the program
os.environ["CWD"] = str(pathlib.Path(__file__).parent.resolve().as_uri())
dotenv.load_dotenv()

# import the modules to add them to the program
from modules.utils import router
import modules.adminAPI
import modules.clientAPI # client has to be 2nd last, so sub-API requests are not refused with 404
import modules.fileServer # fileserver has to be the very last


loggingLevel = "DEBUG"


def main():
    logging.basicConfig(
        level=loggingLevel.upper(),
        stream=sys.stdout,
        format="%(asctime)s %(name)s %(levelname)s %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    logging.debug("Testing logger")
    app = web.Application()
    app.add_routes(router)
    web.run_app(app, port=8000)


# ------- Entrypoint -------
if __name__ == "__main__":
    main()

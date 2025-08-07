import pathlib
import sys

# add local modules to pythonpath (each top level file needs this)
sys.path.insert(1, str(pathlib.Path("./modules").resolve()))


#################### START OF MAIN ####################
from aiohttp import web
import dotenv
import logging
import os


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
import utils
from adminAPI import router as adminRouter
from clientAPI import router as clientRouter
from fileServer import router as fileServerRouter
dotenv.load_dotenv()


port = int(os.getenv("PORT", 1006))

print("Path for CWD", utils.paths.cwd)
print("Path for cfgRoot", utils.paths.cfgRoot)
print("Path for dataRoot", utils.paths.dataRoot)
print("Path for clientRoot", utils.paths.clientRoot)
print("Path for searchRoot", utils.paths.searchRoot)
print("Path for adminRoot", utils.paths.adminRoot)

def main():
    app = web.Application()
    # client has to be 2nd last, so sub-API requests are not refused with 404
    # fileserver has to be the very last, so API requests are not refused with 404
    app.add_routes(adminRouter)
    app.add_routes(clientRouter)
    app.add_routes(fileServerRouter)
    web.run_app(app, port=port)


# ------- Entrypoint -------
if __name__ == "__main__":
    main()

from aiohttp import web
import logging
import mimetypes
import pathlib
import utils


router = web.RouteTableDef()

_logger = logging.getLogger(__name__)
_logger.info(f"Importing {__name__}...")


def handleFile(request: web.Request, root: pathlib.Path) -> web.Response:
    print(f"HTTP GET request incoming: {request.path}")
    url = request.match_info.get("fn", "").strip("/")
    if url.startswith("api"):
        raise RuntimeError(f"Unhandled API request received in file-server handler: {url}")
    if ".." in url:
        raise web.HTTPForbidden(text=f"URL contains '..': '{str(url)}'")
    filepath = root / url

    if filepath.is_dir():
        # Directory is requested, serve index.html from that directory
        filepath = filepath / "index.html"

    if not filepath.exists():
        # File does not exist, return 404
        raise web.HTTPNotFound(text=f"Resource '{filepath}' does not exist.")

    if not filepath.is_file():
        # Resource is not a file, return 403
        raise web.HTTPForbidden(text=f"Resource '{filepath}' is not a file.")

    # return file
    mimetype, encoding = mimetypes.guess_type(filepath)
    print(f"Returning file '{filepath}' with mimetype '{mimetype}' and encoding '{encoding}'")
    data = encoding and filepath.read_text(encoding=encoding or "utf-8") or filepath.read_bytes()
    return web.Response(body=data, content_type=mimetype or "text/plain", charset=encoding or "utf-8")


# Search webpage
@router.get("/search/{fn:.*}")
async def GET_files(request: web.Request) -> web.Response:
    return handleFile(request, utils.paths.searchRoot)


# Admin webpage
@router.get("/admin/{fn:.*}")
async def GET_files(request: web.Request) -> web.Response:
    return handleFile(request, utils.paths.adminRoot)


# Client webpage
@router.get("/{fn:.*}")
async def GET_files(request: web.Request) -> web.Response:
    return handleFile(request, utils.paths.clientRoot)

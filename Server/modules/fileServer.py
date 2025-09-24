import logging

_logger = logging.getLogger(__name__)
_logger.info(f"Importing {__name__}...")


from aiohttp import web
import mimetypes
import pathlib
import utils


router = web.RouteTableDef()


def handleFile(request: web.Request, root: pathlib.Path) -> web.Response:
    _logger.debug(f"HTTP GET request incoming: {request.path}")
    url = request.match_info.get("fn", "").strip("/")
    _logger.debug(f"Requested URL: '{url}'")
    if url.startswith("api"):
        raise web.HTTPBadRequest(text=f"Unhandled API request received in file-server handler: {url}")
    if ".." in url:
        raise web.HTTPForbidden(text=f"URL contains '..': '{str(url)}'")
    filepath = root / url
    _logger.debug(f"Resolved file path: '{filepath}'")

    if filepath.is_dir():
        # Directory is requested, serve index.html from that directory
        _logger.debug(f"Directory requested, serving index.html from '{filepath}'")
        filepath = filepath / "index.html"
    if not filepath.exists():
        # File does not exist, return 404
        raise web.HTTPNotFound(text=f"Resource '{filepath}' does not exist.")
    _logger.debug(f"File exists: '{filepath}'")
    if not filepath.is_file():
        # Resource is not a file, return 403
        raise web.HTTPForbidden(text=f"Resource '{filepath}' is not a file.")
    _logger.debug(f"Confirmed '{filepath}' is a file")

    # return file
    mimetype, encoding = mimetypes.guess_type(filepath)
    data = encoding and filepath.read_text(encoding=encoding or "utf-8") or filepath.read_bytes()
    _logger.info(f"Returning file '{filepath}' with mimetype '{mimetype}' and encoding '{encoding}'")
    _logger.debug(f"Read {len(data)} bytes from file '{filepath}'")
    return web.Response(body=data, content_type=mimetype or "text/plain", charset=encoding or "utf-8")


# Search webpage
@router.get("/search/{fn:.*}")
async def getSearchPageFiles(request: web.Request) -> web.Response:
    _logger.info(f"Serving search page request: {request.path}")
    return handleFile(request, utils.paths.searchRoot)


# Admin webpage
@router.get("/admin/{fn:.*}")
async def getAdminPageFiles(request: web.Request) -> web.Response:
    _logger.info(f"Serving admin page request: {request.path}")
    return handleFile(request, utils.paths.adminRoot)


# Client webpage
@router.get("/{fn:.*}")
async def getClientPageFiles(request: web.Request) -> web.Response:
    _logger.info(f"Serving client page request: {request.path}")
    return handleFile(request, utils.paths.clientRoot)

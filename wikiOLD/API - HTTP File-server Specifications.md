# Web Server File Handlers Documentation

These HTTP handlers serve static text files from specific directories on disk. They are designed to handle requests for the **Search**, **Admin**, and **Client** web interfaces, returning HTML or other text-based files such as CSS or JavaScript.

## Expected Inputs

* **Input Parameters:** None. These endpoints serve static files based solely on the request path.
* **Path Variables:** `{fn}` — a wildcard path segment representing the relative file path within the root directory.

## Returns

* **Type:** `aiohttp.web.Response`
* **Value:** Contents of the requested file (as text).
* **Content-Type:** Determined via MIME type guessing (e.g., `text/html`, `text/css`, `application/javascript`, etc.).
* **Charset:** Automatically inferred, defaults to `"utf-8"`.

## Errors Handled

* `403 Forbidden`:

  * If the path contains `..`
  * If the target is not a file
* `404 Not Found`: If the requested file does not exist
* `500 Internal Server Error`: If an API path (`/api/...`) is accidentally routed here

---

## `/search/{fn:.*}`

**Description:** Serves static files from the `paths.searchRoot` directory for the Search interface.

**Example Use Case:**
Requesting the Search UI homepage:

```http
GET /search/index.html
```

## `/admin/{fn:.*}`

**Description:** Serves static files from the `paths.adminRoot` directory for the Admin panel.

**Example Use Case:**
Loading the Admin JavaScript logic:

```http
GET /admin/assets/admin.js
```

## `/{fn:.*}`

**Description:** Serves static files from the `paths.clientRoot` directory for the main Client-facing interface.

**Example Use Case:**
Accessing the root index page:

```http
GET /index.html
```

---

**Security Note:** These handlers explicitly block path traversal attempts and do not allow access to non-file resources.

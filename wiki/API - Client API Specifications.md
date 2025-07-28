# `/api/client` — Client Quiz API Documentation

These API endpoints support the client quiz experience by providing questions, accepting user answers, and returning scores. All communication is done via HTTP requests and JSON.

---

## Common Requirements

* **Base URL:** `/api/client`
* **Content-Type (for POST requests):** `application/json`
* **Supported Languages:** Defined in `utils.SupportedLanguages` (e.g., `"hu"`, `"en"`, etc.)

---

## `GET /api/client/getQuestions`

**Description:** Retrieves the list of buildings used in the current quiz, localized to the requested language.

### Query Parameters

* `lang`: type `string`, required — must be one of the supported languages.

### Response Format (JSON):

```json
{
  "0": {
    "building_id": <2000..9999>,
    "name": "<name>",
    "country": "<country",
    "city": "<city>"
  },
  ...
}
```

**JSON:**

* `"index"`: type `string`, a unique key for each entry in the response

  * `"building_id"`: type `int`, ID of the building
  * `"name"`: type `string`, localized name of the building
  * `"country"`: type `string`, localized country name
  * `"city"`: type `string`, localized city name

### Errors

* `400 Bad Request`: if `lang` is missing or not supported

### Example Request

```http
GET /api/client/getQuestions?lang=en
```

---

## `POST /api/client/uploadAnswers`

**Description:** Accepts a team's answers and saves them to the database, returning a unique `teamID`.

### Request Body Format (JSON):

```json
{
  "name": "Team Alpha",
  "lang": "en",
  "answers": {
    "0": {
      "building_id": 1,
      "answer": 2
    },
    "1": {
      "building_id": 3,
      "answer": 1
    }
  }
}
```

**JSON:**

* `"name"`: type `string`, used for storing the team's display name
* `"lang"`: type `string`, used to store the quiz language (must be supported)
* `"answers"`: dictionary where each key represents an answer entry

  * `"building_id"`: type `int`, the building this answer corresponds to
  * `"answer"`: type `int`, the user’s submitted answer

### Successful Response:

```json
{
  "teamID": 42
}
```

**JSON:**

* `"teamID"`: type `int`, the unique ID assigned to the submitted team

### Errors

* `400 Bad Request`: if any of `"name"`, `"lang"`, or `"answers"` is missing or invalid
* `500 Internal Server Error`: if the database operation fails

### Example Request

```http
POST /api/client/uploadAnswers
Content-Type: application/json

{
  "name": "Team Alpha",
  "lang": "en",
  "answers": {
    "0": { "building_id": 1, "answer": 2 },
    "1": { "building_id": 3, "answer": 1 }
  }
}
```

---

## `GET /api/client/getAnswers`

**Description:** Fetches the submitted answers and score for a given team.

### Query Parameters

* `teamID`: type `string`, required — the unique team ID assigned during submission

### Response Format (JSON):

```json
{
  "quizdata": {
    "0": {
      "name": "Eiffel Tower",
      "country": "France",
      "city": "Paris",
      "number": 2,
      "correct": true
    },
    ...
  },
  "score": 1,
  "submittedAt": "2025-07-28T15:22:33.111"
}
```

**JSON:**

* `"quizdata"`: dictionary of answered questions

  * `"name"`: type `string`, localized name of the building
  * `"country"`: type `string`, localized country name
  * `"city"`: type `string`, localized city name
  * `"number"`: type `int`, the answer submitted by the user
  * `"correct"`: type `bool`, whether the answer was correct
* `"score"`: type `int`, number of correct answers
* `"submittedAt"`: type `string` (ISO datetime), timestamp of submission

### Errors

* `400 Bad Request`: if `teamID` is missing
* `404 Not Found`: if no team exists with the given `teamID`

### Example Request

```http
GET /api/client/getAnswers?teamID=42
```

---

## `GET|POST /api/client/{fn}` — Not Found Handlers

These catch-all handlers return a 404 response for any undefined `/api/client/*` endpoint.

**Example:**

```http
GET /api/client/unknownEndpoint
→ 404 Not Found: API GET endpoint 'unknownEndpoint' doesn't exist.
```

---

Let me know if you’d like a downloadable version or OpenAPI-style format next!

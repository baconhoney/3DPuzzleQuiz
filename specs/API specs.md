# API endpoint specs:

`<value>`: required

`[value]`: optional

`(value1|value2)`: alternate


Request specifying nothing expect nothing on request.
All requests return `<http_response_code>` and `error message` (MIME:"text/plain") if exists, alongside the below specified, where all jsons (expected and returned/sent) are stringified to UTF-8 strings.


### GET `/*`
Excluding `api/*`
- returns file `/*` (if existing)

### POST `/api/login`
- expects json:
  - name (string): Name of the team
  - lang (string): Language of the team: `"hu"|"en"`
```json
{
    "name": "John Doe",
    "lang": "hu"
}
```
- returns json:
```json
{
    "teamID": <10 digit number>,
    "startTime": "<YYYY-MM-DDTHH:MM:SS.sss>",
    "quizState": "<studying|answering|scoring>"
}
```

### GET `/api/getQuestions`
- expects `lang=hu` (`hu` or `en`, defaults to `hu`)
- returns json:
```json
{
    "quizdata": {
        "0": {"name": "Fehér Ház", "country": "Egyesült Államok", "city": "Washington", "building_id": 2000},
        "1": {"name": "Szent István bazilika", "country": "Magyarország", "city": "Budapest", "building_id": 2001},
        ...
        "19": {"name": "Kölni dóm", "country": "Németország", "city": "Köln", "building_id": 2019}
    },
    "endTime": "<YYYY-MM-DDTHH:MM:SS.sss>"
}
```

### POST `/api/uploadAnswers`
- expects json:
```json
{
    "uid": 1234567890, (the returned uid value from `/login`)
    "answers": {
        "0": {"building_id": 2000, "answer": 1},
        "1": {"building_id": 2001, "answer": 41},
        ...
        "19": {"building_id": 2019, "answer": 39}
    }
}
```

### GET `/api/getAnswers`
- expects `uid=1234567890` (the returned uid value from `/login`)
- returns json:
```json
{
    "quizdata": {
        "0": {"name": "Fehér Ház", "country": "Egyesült Államok", "city": "Washington", "number": 1, "correct": true},
        "1": {"name": "Szent István bazilika", "country": "Magyarország", "city": "Budapest", "number": 41, "correct": true},
        ...
        "19": {"name": "Kölni dóm", "country": "Németország", "city": "Köln", "number": 39, "correct": false}
    },
    "score": 14
}
```

### WebSockets `/api/updates`
- expects `'{"uid"=1234567890}'` (the returned uid value from `/login`) as the first message in json, and no other after that
- sends `events` as json:
```json
{
    "event": <"quizStarted" | "quizEnded" | "resultsReady">,
    "timestamp": "<YYYY-MM-DDTHH:MM:SS.sss>"
}
```
where `timestamp` means:
  - quizStarted `->` quiz ending time
  - quizEnded `->` expected results ready time
  - resultsReady `->` next quiz start time


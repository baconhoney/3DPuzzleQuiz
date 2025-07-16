# API endpoint specs:

`<value>`: required
`[value]`: optional
`(value1|value2)`: alternate

Request specifying nothing expect nothing on request.
All requests return `<http_response_code>` and `error message` (MIME:"text/plain") if exists, alongside the below specified.


### GET `/*`
Excluding `api/*`
- returns file `/*` (if existing)

### GET `/api/login`
- returns
```json
{
    "uid": 1234567890, (random number from 1e9, up to but not including 1e10)
    "startTime": "<YYYY-MM-DDTHH:MM:SS.sss>",
    "quizIsRunning": false
}
```

### GET `/api/getQuestions`
- expects `lang=hu` (`hu` or `en`, defaults to `hu`)
- returns
```json
{
    "quizdata": {
        "0": {"name": "Fehér Ház", "country": "Egyesült Államok", "city": "Washington", "id": 2000},
        "1": {"name": "Szent István bazilika", "country": "Magyarország", "city": "Budapest", "id": 2001},
        ...
        "19": {"name": "Kölni dóm", "country": "Németország", "city": "Köln", "id": 2019}
    },
    "endTime": "<YYYY-MM-DDTHH:MM:SS.sss>"
}
```

### POST `/api/uploadAnswers`

- expects
```json
{
    "answers": {
        "0": {"id": 2000, "number": 1},
        "1": {"id": 2001, "number": 41},
        ...
        "19": {"id": 2019, "number": 39}
    }
}
```

### GET `/api/getAnswers`
- expects `uid=1234567890` (the returned uid value from `/login`)
- returns
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
- sends
```json
{
    "event": ("quizStarted" | "quizEnded" | "resultsReady"),
    "timestamp": "<YYYY-MM-DDTHH:MM:SS.sss>"
}
```
where `timestamp` means:
  - quizStarted `->` quiz ending time
  - quizEnded `->` expected results ready time
  - resultsReady `->` next quiz start time


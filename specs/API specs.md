# API endpoint specs:

`<value>`: required
`[value]`: optional
`(value1|value2)`: alternate

Request specifying nothing expect nothing on request.
All requests return `<http_response_code>` and `error message` (MIME:"text/plain") if exists.


### GET `/`
- returns `index.html`

### GET `/admin`
- returns `admin.html`

### GET `/login`
- returns
```json
{
    "uid": 1234567890, (random number from 1e9, to but not including 1e10)
    "startTime": "<HH:mm>",
    "quizIsRunning": false
}
```

### GET `/getQuestions`
- expects `lang=hu` (`hu` or `en`, defaults to `hu`)
- returns
```json
{
    "quizNumber": 5,
    "quizdata": {
        "0": {"name": "Fehér Ház", "country": "Egyesült Államok", "city": "Washington", "flag": "flag_us", "id": 2000},
        "1": {"name": "Szent István bazilika", "country": "Magyarország", "city": "Budapest", "flag": "flag_hu", "id": 2001},
        ...
        "19": {"name": "Kölni dóm", "country": "Németország", "city": "Köln", "flag": "flag_de", "id": 2019}
    },
    "endTime": "<HH:mm>"
}
```

### POST `/uploadAnswers`

- expects
```json
{
    "answers": {
        "0": {"id": 2000, "num": 1},
        "1": {"id": 2001, "num": 41},
        ...
        "19": {"id": 2019, "num": 39}
    }
}
```

### GET `/getAnswers`
- expects `uid=1234567890` (the returned uid value from `/login`)
- returns
```json
{
    "results": {
        "0": {"name": "Fehér Ház", "country": "Egyesült Államok", "city": "Washington", "flag": "flag_us", "num": 1, "correct": true},
        "1": {"name": "Szent István bazilika", "country": "Magyarország", "city": "Budapest", "flag": "flag_hu", "num": 41, "correct": true},
        ...
        "19": {"name": "Kölni dóm", "country": "Németország", "city": "Köln", "flag": "flag_de", "num": 39, "correct": false}
    },
    "score": 14
}
```

### SSE `/updates`
- returns
```
ONE OF:
"event: quizStarted\nendsAt: <HH:mm>\n\n"
"event: quizEnded\nresultsReadyAt: <HH:mm>\n\n"
"event: resultsReady\nnextQuizAt: <HH:mm>\n\n"
```

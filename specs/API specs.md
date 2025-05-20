# API endpoint specs:

`<value>`: required
`[value]`: optional
`value1|value2`: alternate

missing means expects `null` / returns <http_response_code>
always returns a <http_response_code>, if its not 200 there was an error

- GET `/`
  returns `index.html`

- GET `/admin`
  returns `admin.html`

- GET `/login`
  returns ```json
  {
    "uid": "<10 digit random number>",
    "startTime": "<ISO timestamp>",
    "quizIsRunning": <bool>
  }```

- GET `/getQuestions`
  expects `lang=hu|en`
  returns ```json
  {
    "quizNumber": 5,
    "quizdata": {
        "0": {"name": "Fehér Ház", "country": "Egyesült Államok", "city": "Washington", "flag": "us_flag"},
        "1": {"name": "Szent István bazilika", "country": "Magyarország", "city": "Budapest", "flag": "hu_flag"},
        ...
        "19": {"name": "Kölni dóm", "country": "Németország", "city": "Köln", "flag": "de_flag"}
    },
    "endTime": "<ISO timestamp>"
  }```

- POST `/uploadAnswers`
  expects ```json
  {
    "answers": {
        "0": {"id": 2000, "num": 1},
        "1": {"id": 2001, "num": 41},
        ...
        "19": {"id": 2020, "num": 39}
    }
  }```

- GET `/getAnswers`
  expects `uid=<uniqueIdentifier>`
  returns ```json
  {
    "results": {
        "0": {"name": "Fehér Ház", "country": "Egyesült Államok", "city": "Washington", "flag": "us_flag", "num": 1, "correct": true},
        "1": {"name": "Szent István bazilika", "country": "Magyarország", "city": "Budapest", "flag": "hu_flag", "num": 41", "correct": true},
        ...
        "19": {"name": "Kölni dóm", "country": "Németország", "city": "Köln", "flag": "de_flag", "num": 39, "correct": false}
    },
    "score": 14
  }```
- SSE `/updates`
  returns
    "event: quizStarted\nendsAt: <ISO timestamp>\n\n" | "event: quizEnded\nnextQuizAt: <ISO timestamp>\n\n" | "event: resultsReady\nnextQuizAt: <ISO timestamp>\n\n"

Implement admin-API endpoints

# List of API endpoints, and their definitions

## GET /api/admin/getQuizResults
Returns the quizResults, ordered by score desc then submittedAt asc.

### Returns
```json
{
    "0": {"id": 42, "name": "Team Rocket", "score": 3, "submittedAt": "2025-07-29T14:21:45.000"},
    "1": { ... },
    ...
}
```

## GET /api/admin/getQuizdata?teamID=[]
Returns a single answer according to teamID.

### Returns
```json
{
  "0": {"name": "Colosseum", "country": "Italy", "city": "Rome", "number": 2, "correct": true},
  "1": { ... },
  ...
}
```

## POST /api/admin/uploadQuiz
Uploads a (partially) filled out quiz to the DB.

### Expects
```json
{
    "id": 1234567890,
    "name": "Team Rocket",
    "lang": "en",
    "answers": {
        "0": {"id": 1, "answer": 2},
        "1": { ... },
        ...
    }
}
```

## GET /api/admin/getStates
Returns the internal StateMachine's values, and maybe some extra stuff too

### Returns
```json
{
    "phase": "running",
    "currentQuiz": 2,
    "nextQuizAt": "ISO string"
}
```

## POST /api/admin/queuePrintjob
Queues up some print jobs.

### Expects
```json
{
    "numberOfTests": 1,
    "language": "hu",
    "type": 20
}
```

# Admin page API endpoint specs

### WebSockets `/api/admin`
- expects
```json
{
    "event": ("quizStarted" | "quizEnded" | "resultsReady"),
    "timestamp": "<YYYY-MM-DDTHH:MM:SS.sss>"
}
```


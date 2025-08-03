# Additional `admin` API endpoints

***Notice***: Each endpoint should be prefixed with `/api/admin`.

## `POST /sendEvent`

### Expects
```json
{
    "type": "queuePrint" | "nextPhase" | "setTimeTill",
    "data": {
        ...
    }
}
```
where `data` is:
- if `type == "nextPhase"`:
  ```json
  data = {
      "currentPhase": "idle",
      "nextPhase": "running",
      "timeTillNextPhase": "ISO DateTime string"
  }
  ```
- if `type == "queueprint"`:
  ```json
  data = {
      "copyCount": 5,
      "quizSize": 20,
      "language": "hu"
  }
  ```
- if `type == "setTimeTill"`:
  ```json
  data = {
      "timeTill": "ISO DateTime string"
  }
  ```


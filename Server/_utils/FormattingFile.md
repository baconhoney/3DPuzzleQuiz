# Additional `admin` API endpoints

***Notice***: Each endpoint should be prefixed with `/api/admin`.

## `POST /sendEvent`

### Expects
```json
{
    "type": "queuePrint" | "nextPhase" | "setNextPhaseChangeAt",
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
      "nextPhaseChangeAt": "ISO DateTime string"
  }
  ```
- if `type == "queueprint"`:
  ```json
  data = {
      "copyCount": 5,
      "language": "hu",
      "quizSize": 20
  }
  ```
- if `type == "setNextPhaseChangeAt"`:
  ```json
  data = {
      "nextPhaseChangeAt": "ISO DateTime string"
  }
  ```


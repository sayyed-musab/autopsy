# API Reference

Base URL for local development:

```text
http://127.0.0.1:8000
```

The frontend uses:

```text
http://localhost:8000
```

Both resolve locally in normal development.

## Health

```http
GET /api/health
```

Response:

```json
{
  "status": "ok"
}
```

## Start Autopsy

```http
POST /api/autopsy
Content-Type: application/json
```

Request:

```json
{
  "subject": "WeWork IPO failure"
}
```

Response:

```json
{
  "run_id": "uuid-string"
}
```

Notes:

- `subject` is required.
- Empty subjects are rejected.
- The backend starts the actual run in the background.

## Stream Agent

```http
GET /api/stream/{run_id}/{agent_id}
```

Valid `agent_id` values:

- `strategist`
- `operator`
- `finance`
- `devils_advocate`
- `verdict`

Response type:

```text
text/event-stream
```

Token event:

```text
data: {"token":"Quibi", "done":false}
```

Completion event:

```text
data: {"token":"", "done":true}
```

Frontend handling:

- Append every `token` while `done` is false.
- Close the `EventSource` when `done` is true.

## Status

```http
GET /api/status/{run_id}
```

Response:

```json
{
  "strategist": "done",
  "operator": "done",
  "finance": "done",
  "devils_advocate": "done",
  "verdict": "thinking"
}
```

Status values:

- `idle`
- `thinking`
- `done`

## Error Cases

Unknown run:

```json
{
  "detail": "run_id not found"
}
```

Invalid subject:

```json
{
  "detail": "subject is required"
}
```

OpenAI errors are streamed as token text so the frontend can display them in the same agent card flow.

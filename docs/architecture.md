# Architecture

AUTOPSY uses a local web client and API server.

```text
User
  |
  v
Next.js client
  |
  | POST /api/autopsy
  v
FastAPI server
  |
  | creates run_id
  | initializes agent queues
  | starts background run_autopsy()
  v
LangChain OpenAI orchestrator
  |
  | asyncio.gather()
  v
Four panel agents in parallel
  |
  | outputs collected
  v
Verdict Agent
  |
  | token events
  v
SSE queues
  |
  | GET /api/stream/{run_id}/{agent_id}
  v
Next.js UI
```

## Main Runtime Flow

1. `client/src/app/page.jsx` calls `runAutopsy(subject)` from `client/src/hooks/useAutopsy.js`.
2. `useAutopsy.js` calls `initiateAutopsy(subject)` in `client/src/lib/api.js`.
3. `server/main.py` receives `POST /api/autopsy`.
4. `server/main.py` generates a UUID and calls `initialize_run(run_id, subject)`.
5. `server/main.py` starts `run_autopsy(subject, run_id)` as a background task.
6. `server/orchestrator.py` runs the four panel agents with `asyncio.gather()`.
7. Each agent writes streamed tokens into an async queue keyed as `{run_id}_{agent_id}`.
8. The frontend opens an `EventSource` for each agent and updates the relevant agent card.
9. After panel completion, `server/orchestrator.py` builds and streams the verdict prompt.
10. The frontend parses `ROOT_CAUSE` and `FAULT_SCORES` from the verdict output.

## Backend State

The backend keeps transient runtime state in module-level dictionaries:

- `outputs` - accumulated text per run and agent.
- `statuses` - `idle`, `thinking`, or `done` per run and agent.
- `queues` - per-agent async queues used by SSE endpoints.
- `run_subjects` - subject text by run id.

This is intentionally simple for local development. For production, replace it with Redis or another external state/queue system.

## Agent Order

Panel agents:

- `strategist`
- `operator`
- `finance`
- `devils_advocate`

Final agent:

- `verdict`

The verdict does not start until all four panel agents finish.

## Streaming Model

The backend uses `ChatOpenAI(..., streaming=True)` and iterates `llm.astream(prompt)`.

Each chunk becomes an SSE payload:

```json
{"token":"...", "done":false}
```

When an agent finishes:

```json
{"token":"", "done":true}
```

The frontend appends token strings until `done` is true.

## Production Considerations

Before deploying this architecture, add:

- Redis or durable queue storage for streams and run state.
- Authentication and rate limiting.
- Request size limits and abuse controls.
- Request cancellation.
- Persistent result storage.
- Logging and observability.
- CORS configuration for the production frontend origin.

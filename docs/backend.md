# Backend Guide

The backend lives in `server`.

## Files

```text
server
├── .env
├── requirements.txt
├── main.py
├── orchestrator.py
└── agents
    ├── __init__.py
    ├── strategist.py
    ├── operator.py
    ├── finance.py
    ├── devils_advocate.py
    └── verdict.py
```

## Dependencies

Declared in `server/requirements.txt`:

- `fastapi`
- `uvicorn[standard]`
- `langchain`
- `langchain-openai`
- `openai`
- `python-dotenv`
- `httpx`

Install:

```powershell
cd "D:\Codex Pune\server"
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

## Environment Variables

`server/.env`:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

`OPENAI_MODEL` is optional. If missing, the backend defaults to `gpt-4o-mini`.

## `main.py`

`main.py` owns the FastAPI app and HTTP interface.

Endpoints:

- `GET /api/health`
- `POST /api/autopsy`
- `GET /api/status/{run_id}`
- `GET /api/stream/{run_id}/{agent_id}`

Important behavior:

- CORS allows `http://localhost:3000`.
- `POST /api/autopsy` returns immediately with a `run_id`.
- The autopsy itself runs as an `asyncio.create_task`.
- `/api/stream/...` returns `StreamingResponse` with `text/event-stream`.

## `orchestrator.py`

`orchestrator.py` owns agent execution, streaming, state, and OpenAI integration.

Key functions:

- `initialize_run(run_id, subject)` - creates run state and queues.
- `get_status(run_id)` - returns current agent statuses.
- `get_queue(run_id, agent_id)` - returns the async queue for SSE.
- `make_llm()` - creates `ChatOpenAI`.
- `run_agent(run_id, agent_id, prompt)` - streams one agent.
- `run_autopsy(subject, run_id)` - runs the full panel and verdict.

Parallelism:

```python
await asyncio.gather(
    run_agent(run_id, "strategist", strategist_prompt),
    run_agent(run_id, "operator", operator_prompt),
    run_agent(run_id, "finance", finance_prompt),
    run_agent(run_id, "devils_advocate", devils_advocate_prompt),
)
```

The verdict agent runs after the gathered panel outputs complete.

## Agent Prompt Modules

Each file in `server/agents` exports `build_prompt(...)`.

Panel prompt modules accept:

```python
build_prompt(subject: str) -> str
```

Verdict prompt module accepts:

```python
build_prompt(
    subject: str,
    strategist_output: str,
    operator_output: str,
    finance_output: str,
    devils_advocate_output: str,
) -> str
```

## Error Handling

OpenAI errors are converted to sanitized messages in `describe_openai_error(exc)`.

Examples:

- Invalid key - authentication message.
- No model access - permission message.
- Bad model name - request rejected message.
- Quota/rate limit - billing/rate-limit message.

The backend does not stream the API key or raw secret data.

## Running

```powershell
cd "D:\Codex Pune\server"
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Development reload:

```powershell
cd "D:\Codex Pune\server"
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## Backend Smoke Tests

Health:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health"
```

Create a run:

```powershell
$body = @{ subject = "Quibi failure" } | ConvertTo-Json
$run = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/autopsy" -Method Post -ContentType "application/json" -Body $body
$run
```

Check status:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/status/$($run.run_id)"
```

Read one SSE stream:

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/stream/$($run.run_id)/strategist" -UseBasicParsing
```

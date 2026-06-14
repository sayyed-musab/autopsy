# AUTOPSY Server

FastAPI + LangChain OpenAI backend for AUTOPSY.

## Stack

- FastAPI
- Uvicorn
- LangChain
- langchain-openai
- OpenAI Python SDK
- python-dotenv

## Run

```powershell
cd "D:\Codex Pune\server"
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Development reload:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## Environment

`server/.env`:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

Restart the backend after editing `.env`.

## API

- `GET /api/health`
- `POST /api/autopsy`
- `GET /api/status/{run_id}`
- `GET /api/stream/{run_id}/{agent_id}`

## Key Files

- `main.py` - FastAPI app, CORS, routes, SSE response.
- `orchestrator.py` - agent orchestration, OpenAI streaming, queues, statuses.
- `agents/*.py` - prompt builders for each specialist.
- `requirements.txt` - backend dependencies.

## Verification

```powershell
.\.venv\Scripts\python.exe -m py_compile main.py orchestrator.py agents\strategist.py agents\operator.py agents\finance.py agents\devils_advocate.py agents\verdict.py
```

Health:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health"
```

# Development Guide

## Common Commands

Frontend:

```powershell
cd "D:\Codex Pune\client"
npm run dev
npm run lint
npm run build
```

Backend:

```powershell
cd "D:\Codex Pune\server"
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
.\.venv\Scripts\python.exe -m py_compile main.py orchestrator.py agents\strategist.py agents\operator.py agents\finance.py agents\devils_advocate.py agents\verdict.py
```

## Adding an Agent

Backend:

1. Add a new prompt file in `server/agents`.
2. Import it in `server/orchestrator.py`.
3. Add the new agent id to `AGENT_IDS`.
4. If it is part of the parallel panel, add it to the `asyncio.gather()` block.
5. Add its output to the verdict prompt if needed.

Frontend:

1. Add the agent object to `client/src/lib/constants.js`.
2. Add the id to `AGENT_IDS` if it is a panel agent.
3. Ensure `initialState.agents` in `useAutopsy.js` includes that id.
4. Add UI space if the layout needs more than four cards.

## Changing Prompts

Edit the relevant file under `server/agents`.

Prompt modules are deliberately isolated so prompt changes do not require editing API or frontend logic.

## Changing the Model

Update `server/.env`:

```env
OPENAI_MODEL=gpt-4o-mini
```

Restart the backend after changing `.env`.

## Changing Backend URL

By default, the frontend uses:

```javascript
http://localhost:8000
```

To override it, create a client environment file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then restart the frontend dev server.

## Styling Rules

- Core colors live in `client/src/app/globals.css`.
- Use CSS custom properties for shared UI colors.
- Agent colors should come from `client/src/lib/constants.js`.
- Keep source files JavaScript-only.

## State Rules

The backend is in-memory. Do not expect a run to survive backend restart.

The frontend treats the backend stream as the source of truth for text output. Confidence and sparklines are simulated locally for UI activity.

## Verification Checklist

Before handing off changes:

```powershell
cd "D:\Codex Pune\client"
npm run lint
npm run build
```

```powershell
cd "D:\Codex Pune\server"
.\.venv\Scripts\python.exe -m py_compile main.py orchestrator.py agents\strategist.py agents\operator.py agents\finance.py agents\devils_advocate.py agents\verdict.py
```

Manual checks:

- Backend health returns `ok`.
- Frontend opens at `http://localhost:3000`.
- Creating an autopsy returns a `run_id`.
- All four panel cards stream before the verdict starts.
- Verdict panel parses root cause and radar scores.

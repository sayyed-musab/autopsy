# AUTOPSY

AUTOPSY is a multi-agent AI failure analysis system. It lets a user enter a failed startup, product, company, or business decision, then streams a panel-style post-mortem from four specialist agents and one final verdict agent.

The app is split into:

- `client` - Next.js 14 App Router frontend, JavaScript only.
- `server` - FastAPI backend with LangChain + OpenAI streaming orchestration.

## What It Does

1. The user enters a subject, such as `WeWork IPO failure`.
2. The frontend calls `POST /api/autopsy`.
3. The backend creates a `run_id`, initializes in-memory queues, and starts the analysis in the background.
4. Four panel agents run in parallel:
   - Dr. Kiran - strategy and market timing
   - Marcus - execution and operations
   - Ghost - finance and unit economics
   - Vex - contrarian opportunity analysis
5. The frontend opens one `EventSource` stream per agent and renders token-by-token output.
6. After the four panel agents finish, the backend runs the Verdict Agent.
7. The verdict stream includes `ROOT_CAUSE` and `FAULT_SCORES`; the frontend parses those into the root-cause panel and radar chart.

## Repository Map

```text
D:\Codex Pune
├── README.md
├── docs
│   ├── architecture.md
│   ├── backend.md
│   ├── frontend.md
│   ├── api.md
│   ├── development.md
│   └── troubleshooting.md
├── client
│   ├── README.md
│   ├── package.json
│   └── src
│       ├── app
│       ├── components
│       ├── hooks
│       └── lib
└── server
    ├── README.md
    ├── .env
    ├── requirements.txt
    ├── main.py
    ├── orchestrator.py
    └── agents
```

## Requirements

- Node.js 18+
- Python 3.11+
- OpenAI API key

## Environment

Create or update `server/.env`:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

Do not commit real API keys.

## Install

Frontend:

```powershell
cd "D:\Codex Pune\client"
npm install
```

Backend:

```powershell
cd "D:\Codex Pune\server"
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

If the virtual environment does not have `pip`:

```powershell
cd "D:\Codex Pune\server"
.\.venv\Scripts\python.exe -m ensurepip --upgrade
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

## Run

Start the backend:

```powershell
cd "D:\Codex Pune\server"
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Start the frontend:

```powershell
cd "D:\Codex Pune\client"
npm run dev
```

Open:

```text
http://localhost:3000
```

## Verification

Frontend:

```powershell
cd "D:\Codex Pune\client"
npm run lint
npm run build
```

Backend:

```powershell
cd "D:\Codex Pune\server"
.\.venv\Scripts\python.exe -m py_compile main.py orchestrator.py agents\strategist.py agents\operator.py agents\finance.py agents\devils_advocate.py agents\verdict.py
```

Health check:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health"
```

## Documentation

- [Architecture](docs/architecture.md)
- [Backend](docs/backend.md)
- [Frontend](docs/frontend.md)
- [API](docs/api.md)
- [Development Guide](docs/development.md)
- [Troubleshooting](docs/troubleshooting.md)

## Current Notes

- The frontend is JavaScript-only. There are no `.tsx` or `.ts` source files in `client/src`.
- Streaming is implemented with browser `EventSource` and backend Server-Sent Events.
- Runtime state is in memory only. Restarting the backend clears active runs.
- The app is designed for local development with the frontend on `localhost:3000` and backend on `127.0.0.1:8000`.

# Troubleshooting

## OpenAI Stream Error

If an agent card shows an OpenAI error:

1. Check `server/.env`.
2. Confirm `OPENAI_API_KEY` is present and not `your_key_here`.
3. Confirm `OPENAI_MODEL` is a model your project can access.
4. Restart the backend after changing `.env`.

Backend key sanity check without printing the secret:

```powershell
cd "D:\Codex Pune\server"
.\.venv\Scripts\python.exe -c "from dotenv import load_dotenv; import os; load_dotenv('.env'); key=os.getenv('OPENAI_API_KEY',''); print({'has_key': bool(key and key != 'your_key_here'), 'key_prefix': key[:7] if key else '', 'key_length': len(key), 'model': os.getenv('OPENAI_MODEL','')})"
```

Direct streaming smoke test:

```powershell
cd "D:\Codex Pune\server"
.\.venv\Scripts\python.exe -c "exec('''from dotenv import load_dotenv\nload_dotenv('.env')\nfrom orchestrator import make_llm, describe_openai_error\nimport asyncio\nasync def main():\n    try:\n        llm = make_llm()\n        chunks = []\n        async for chunk in llm.astream('Reply with exactly: ok'):\n            if chunk.content:\n                chunks.append(chunk.content)\n        print('SUCCESS:' + ''.join(chunks))\n    except Exception as exc:\n        print('ERROR:' + describe_openai_error(exc))\nasyncio.run(main())\n''')"
```

Expected:

```text
SUCCESS:ok
```

## Stale Backend Process

If you changed `.env` but still see old errors, restart FastAPI.

Find Uvicorn processes:

```powershell
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*uvicorn*main:app*' } | Select-Object ProcessId,ParentProcessId,CommandLine
```

Stop a process:

```powershell
Stop-Process -Id <PID>
```

Start again:

```powershell
cd "D:\Codex Pune\server"
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

## Port Already In Use

Check listeners:

```powershell
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 3000,8000 } | Select-Object LocalAddress,LocalPort,OwningProcess
```

If Next.js starts on `3001`, something is already on `3000`. Stop the old process or use the URL Next prints in the terminal.

## Frontend Cannot Reach Backend

Check:

- Backend is running on port `8000`.
- CORS in `server/main.py` includes `http://localhost:3000`.
- Frontend `NEXT_PUBLIC_API_URL`, if set, points to the backend.

Health test:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health"
```

## Hydration Error

A React hydration mismatch means server-rendered HTML did not match the client render.

The current UI contains an inline `<style>` block in `client/src/app/page.jsx`. If you see a mismatch involving escaped CSS quotes, move those rules into `client/src/app/globals.css` and target real class names instead of CSS attribute selectors.

## SSE Stream Opens But No Tokens Arrive

Check:

- The run id exists.
- The agent id is valid.
- The backend process has network access.
- The OpenAI call is not blocked by quota or model permissions.

Read status:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/status/<run_id>"
```

Read a stream directly:

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/stream/<run_id>/strategist" -UseBasicParsing
```

## `python.exe: No module named pip`

Bootstrap pip:

```powershell
cd "D:\Codex Pune\server"
.\.venv\Scripts\python.exe -m ensurepip --upgrade
```

Then install:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

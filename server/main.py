import asyncio
import json
import uuid
from typing import Literal
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from orchestrator import AGENT_IDS, get_queue, get_status, initialize_run, run_autopsy, stream_autopsy_events

load_dotenv()

app = FastAPI(title="AUTOPSY API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AutopsyRequest(BaseModel):
    subject: str = Field(..., min_length=1, max_length=500)


AgentId = Literal["strategist", "operator", "finance", "devils_advocate", "verdict"]


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/autopsy")
async def start_autopsy(payload: AutopsyRequest) -> dict[str, str]:
    subject = payload.subject.strip()
    if not subject:
        raise HTTPException(status_code=422, detail="subject is required")

    run_id = str(uuid.uuid4())
    initialize_run(run_id, subject)
    asyncio.create_task(run_autopsy(subject, run_id))
    return {"run_id": run_id}


@app.get("/api/autopsy/stream")
async def stream_autopsy(subject: str) -> StreamingResponse:
    subject = subject.strip()
    if not subject:
        raise HTTPException(status_code=422, detail="subject is required")
    if len(subject) > 500:
        raise HTTPException(status_code=422, detail="subject must be 500 characters or fewer")

    async def event_generator():
        async for event in stream_autopsy_events(subject):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/status/{run_id}")
async def status(run_id: str) -> dict[str, str]:
    current = get_status(run_id)
    if current is None:
        raise HTTPException(status_code=404, detail="run_id not found")
    return current


@app.get("/api/stream/{run_id}/{agent_id}")
async def stream(run_id: str, agent_id: AgentId) -> StreamingResponse:
    if agent_id not in AGENT_IDS:
        raise HTTPException(status_code=404, detail="agent_id not found")

    queue = get_queue(run_id, agent_id)
    if queue is None:
        raise HTTPException(status_code=404, detail="run_id not found")

    async def event_generator():
        while True:
            event = await queue.get()
            yield f"data: {json.dumps(event)}\n\n"
            if event.get("done"):
                break

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

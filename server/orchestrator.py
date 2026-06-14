import asyncio
import os
from collections import defaultdict
from typing import Any

from dotenv import load_dotenv
from openai import APIConnectionError, APIStatusError, AuthenticationError, BadRequestError, PermissionDeniedError, RateLimitError
from langchain_openai import ChatOpenAI

from agents import devils_advocate, finance, operator, strategist, verdict

load_dotenv()

AGENT_IDS = ("strategist", "operator", "finance", "devils_advocate", "verdict")
PANEL_AGENT_IDS = ("strategist", "operator", "finance", "devils_advocate")

outputs: dict[str, dict[str, str]] = defaultdict(dict)
statuses: dict[str, dict[str, str]] = {}
queues: dict[str, asyncio.Queue[dict[str, Any]]] = {}
run_subjects: dict[str, str] = {}


def queue_key(run_id: str, agent_id: str) -> str:
    return f"{run_id}_{agent_id}"


def initialize_run(run_id: str, subject: str) -> None:
    run_subjects[run_id] = subject
    outputs[run_id] = {agent_id: "" for agent_id in AGENT_IDS}
    statuses[run_id] = {agent_id: "idle" for agent_id in AGENT_IDS}
    for agent_id in AGENT_IDS:
        queues[queue_key(run_id, agent_id)] = asyncio.Queue()


def get_status(run_id: str) -> dict[str, str] | None:
    return statuses.get(run_id)


def get_queue(run_id: str, agent_id: str) -> asyncio.Queue[dict[str, Any]] | None:
    return queues.get(queue_key(run_id, agent_id))


def make_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        temperature=0.35,
        streaming=True,
    )


def describe_openai_error(exc: Exception) -> str:
    if isinstance(exc, AuthenticationError):
        return "OpenAI authentication failed. Check that OPENAI_API_KEY is valid and restart the backend."
    if isinstance(exc, PermissionDeniedError):
        return "OpenAI permission denied. This key may not have access to the selected model or project."
    if isinstance(exc, BadRequestError):
        return f"OpenAI request rejected. Check OPENAI_MODEL={os.getenv('OPENAI_MODEL', 'gpt-4o-mini')}."
    if isinstance(exc, RateLimitError):
        return "OpenAI rate limit or quota error. Check project billing, credits, and rate limits."
    if isinstance(exc, APIConnectionError):
        return "OpenAI connection failed. Check network access from the backend process."
    if isinstance(exc, APIStatusError):
        return f"OpenAI API error {exc.status_code}. Check server logs for details."
    return f"OpenAI stream error: {exc.__class__.__name__}"


async def push_token(run_id: str, agent_id: str, token: str) -> None:
    outputs[run_id][agent_id] += token
    await queues[queue_key(run_id, agent_id)].put({"token": token, "done": False})


async def finish_agent(run_id: str, agent_id: str) -> None:
    statuses[run_id][agent_id] = "done"
    await queues[queue_key(run_id, agent_id)].put({"token": "", "done": True})


async def run_agent(run_id: str, agent_id: str, prompt: str) -> str:
    statuses[run_id][agent_id] = "thinking"
    llm = make_llm()

    try:
        async for chunk in llm.astream(prompt):
            token = chunk.content or ""
            if token:
                await push_token(run_id, agent_id, token)
    except Exception as exc:
        error_text = f"[{describe_openai_error(exc)}]"
        await push_token(run_id, agent_id, error_text)
    finally:
        await finish_agent(run_id, agent_id)

    return outputs[run_id][agent_id]


async def stream_prompt_to_event_queue(
    event_queue: asyncio.Queue[dict[str, Any]],
    agent_id: str,
    prompt: str,
) -> str:
    output = ""
    llm = make_llm()

    try:
        async for chunk in llm.astream(prompt):
            token = chunk.content or ""
            if token:
                output += token
                await event_queue.put({"agent_id": agent_id, "token": token, "done": False})
    except Exception as exc:
        token = f"[{describe_openai_error(exc)}]"
        output += token
        await event_queue.put({"agent_id": agent_id, "token": token, "done": False})
    finally:
        await event_queue.put({"agent_id": agent_id, "token": "", "done": True})

    return output


async def stream_autopsy_events(subject: str):
    event_queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue()

    panel_prompts = {
        "strategist": strategist.build_prompt(subject),
        "operator": operator.build_prompt(subject),
        "finance": finance.build_prompt(subject),
        "devils_advocate": devils_advocate.build_prompt(subject),
    }

    panel_tasks = {
        agent_id: asyncio.create_task(stream_prompt_to_event_queue(event_queue, agent_id, prompt))
        for agent_id, prompt in panel_prompts.items()
    }

    async def run_verdict_after_panel() -> None:
        strategist_output, operator_output, finance_output, devils_advocate_output = await asyncio.gather(
            panel_tasks["strategist"],
            panel_tasks["operator"],
            panel_tasks["finance"],
            panel_tasks["devils_advocate"],
        )

        verdict_prompt = verdict.build_prompt(
            subject,
            strategist_output,
            operator_output,
            finance_output,
            devils_advocate_output,
        )
        await stream_prompt_to_event_queue(event_queue, "verdict", verdict_prompt)
        await event_queue.put({"agent_id": "__run__", "token": "", "done": True})

    verdict_task = asyncio.create_task(run_verdict_after_panel())

    try:
        while True:
            event = await event_queue.get()
            yield event
            if event.get("agent_id") == "__run__" and event.get("done"):
                break
    finally:
        for task in panel_tasks.values():
            if not task.done():
                task.cancel()
        if not verdict_task.done():
            verdict_task.cancel()


async def run_autopsy(subject: str, run_id: str) -> None:
    if run_id not in statuses:
        initialize_run(run_id, subject)

    strategist_prompt = strategist.build_prompt(subject)
    operator_prompt = operator.build_prompt(subject)
    finance_prompt = finance.build_prompt(subject)
    devils_advocate_prompt = devils_advocate.build_prompt(subject)

    strategist_output, operator_output, finance_output, devils_advocate_output = await asyncio.gather(
        run_agent(run_id, "strategist", strategist_prompt),
        run_agent(run_id, "operator", operator_prompt),
        run_agent(run_id, "finance", finance_prompt),
        run_agent(run_id, "devils_advocate", devils_advocate_prompt),
    )

    verdict_prompt = verdict.build_prompt(
        subject,
        strategist_output,
        operator_output,
        finance_output,
        devils_advocate_output,
    )
    await run_agent(run_id, "verdict", verdict_prompt)

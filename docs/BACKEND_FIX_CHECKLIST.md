# Backend Fix Checklist — What's Broken Right Now

Quick triage of what the goals UI screenshot proves and the exact bugs to fix on Railway.

---

## What the failing run shows

You sent the prompt:
> "Open a Notepad window in the background, type a short timestamped note…"

The backend produced these timeline entries:

1. **`plan`** — model planned to use `cu_launch_application`, `cu_key`, `cu_screenshot`. ✅
2. **`plan` (again)** — model re-planned with `cu_launch`, `cu_type`, `cu_key`, `cu_screenshot`. ✅
3. **`note`** — model finally admits:
   > *"I don't have access to `cu_*` tools (cursor-unaware computer control tools) in my available function set. Looking at my available tools, I have: Document generation (Word, PowerPoint, Excel), Web search, Stock data and technical analysis, Python and React execution, Knowledge base search, Memory functions, Site generation."*

**Translation:** the agent runner is alive, the goals system works, but the model is being called with the **old web-only tool list**. The client envelope advertising `capabilities: ["fs","shell","computer","yang_cu","yang_workflow"]` is being ignored.

Also visible: the cards in the dock show `"description"` rendered as `"[object Object]"` — the API is returning `description` as an object instead of a string.

---

## ✅ Bug 1 (BLOCKER) — Desktop tool schemas aren't merged into the agent's tool list

### Where
In the FastAPI module that builds the model's tool dict — same module that registers `generate_word`, `web_search`, `python_execute`, `knowledge_base_search`, `memory_search`, etc.

### Fix
After your existing tools are added, splice in the desktop families **gated by `client.capabilities`**:

```python
from app.agents.desktop_tools         import desktop_tools_for       # see DESKTOP_AGENT_BACKEND_RECIPE.md §3
from app.agents.yang_cu_tools         import yang_cu_tools_for       # see YANG_AUTOPILOT_PHASE_1_2_BACKEND.md §2
from app.agents.yang_workflow_tools   import yang_workflow_tools_for # see YANG_AUTOPILOT_PHASE_5_6_BACKEND.md §2

caps: list[str] = []
if req.client and req.client.kind == "desktop":
    caps = req.client.capabilities or []

tools.update(desktop_tools_for(caps))       # fs_*, shell_*, computer_*
tools.update(yang_cu_tools_for(caps))       # cu_*, browser_*
tools.update(yang_workflow_tools_for(caps)) # terminal_*, github_*, ssh_*
```

### Result
The model will see all 50+ new tool names and stop hallucinating `cu_launch_application`. It'll call the real `cu_open_target({kind:"native", app:"notepad.exe"})` etc.

### How to verify
After fix, run the same `/goal` again. The timeline should now contain `tool-call` entries (not just `plan` → `note`).

---

## ✅ Bug 2 (BLOCKER) — Client-executed tools aren't being routed through pause/resume

Once the model **does** call `cu_open_target`, the agent loop will try to execute it server-side, find no Python implementation, and fail.

### Where
The agent's main loop where it dispatches a `tool_call`.

### Fix
Before running a tool, check whether its name is in the **client-executed set**. If so, emit the tool-call SSE event and `await` for the result via `/chat/agent/tool-result`:

```python
CLIENT_EXECUTED_TOOL_NAMES = (
    DESKTOP_TOOL_NAMES              # fs_*, shell_*, computer_*  (Phase 0)
    | YANG_CU_TOOL_NAMES             # cu_*, browser_*           (Phase 1+2)
    | YANG_WORKFLOW_TOOL_NAMES       # terminal_*, github_*, ssh_* (Phase 5)
)

def is_client_executed(tool_name: str) -> bool:
    return tool_name in CLIENT_EXECUTED_TOOL_NAMES or tool_name.startswith("mcp_")

# In the loop:
for tc in step.tool_calls:
    if is_client_executed(tc.name):
        yield sse({"type": "tool-input-available", "toolCallId": tc.id,
                   "toolName": tc.name, "input": tc.args})
        fut = pending.register(req.conversation_id, tc.id)
        try:
            result = await asyncio.wait_for(fut, timeout=300)
            error = None
        except asyncio.TimeoutError:
            result, error = None, "client did not return tool result in 5 minutes"
        yield sse({"type": "tool-output-available", "toolCallId": tc.id,
                   "output": result if error is None else {"error": error}})
        messages.append(tool_result_message(tc.id, result, error))
    else:
        # existing server-side execution path
        ...
```

Full pseudocode is in **`docs/DESKTOP_AGENT_BACKEND_RECIPE.md` §4**.

### How to verify
After fix, the Activity drawer in the Electron app (bottom-right pill) will start showing tool calls flowing through. The audit log at `userData/tool-audit.log.jsonl` will contain entries.

---

## ✅ Bug 3 (BLOCKER) — `/chat/agent/tool-result` endpoint must exist

The renderer POSTs every client-side tool result here. Without it, the future from Bug 2 never resolves and goals hang.

### Where
A new FastAPI route, e.g. `app/api/chat_agent.py`.

### Fix
```python
class ToolResultRequest(BaseModel):
    conversation_id: str | None = None
    tool_call_id: str
    tool_name: str | None = None
    result: Any | None = None
    error: str | None = None

@router.post("/chat/agent/tool-result")
async def tool_result(req: ToolResultRequest, request: Request):
    ok = pending.resolve(req.conversation_id, req.tool_call_id, req.result, req.error)
    if not ok:
        return Response(status_code=410, content='{"error":"unknown or expired tool_call_id"}',
                        media_type="application/json")
    return Response(status_code=204)
```

The `PendingCall` registry is in **`docs/DESKTOP_AGENT_BACKEND_RECIPE.md` §2**.

### How to verify
After fix: trigger a goal with a desktop tool, watch the Network tab in the Electron renderer DevTools — there should be a POST to `/api/chat/tool-result` returning **204**. If it returns 404, the endpoint isn't registered. If 410, the future already timed out.

---

## ✅ Bug 4 (BLOCKER for /goal specifically) — Goals tables + endpoints don't exist

The goal currently runs (somewhere — looks like an in-memory or partial version), but the dock can't refresh because `/goals` likely returns 401/404.

### Where
SQLAlchemy / migrations folder + new FastAPI routes.

### Fix
Apply the schema and endpoints from **`docs/YANG_AUTOPILOT_PHASE_3_4_BACKEND.md` §§1–4**:

1. SQL migration: `goals`, `goal_steps`, `memories` (pgvector), `scheduled_jobs`.
2. REST endpoints: `POST /goals`, `GET /goals`, `GET /goals/{id}`, `POST /goals/{id}/control`, `DELETE /goals/{id}`, `GET /goals/{id}/stream`.
3. The runner ticker (APScheduler) that ticks every 5 s.

### How to verify
After fix: refresh the dock — goals persist across reload, and the SSE stream pushes live `step` events.

---

## 🛠 Bug 5 (cosmetic) — `description: [object Object]`

The goal cards in the dock render `g.description` directly. The backend is sending it as an object/dict instead of a string.

### Fix
In the `Goal` response shape, ensure `description` is **always a string**:

```python
class GoalOut(BaseModel):
    id: str
    title: str
    description: str | None       # <- must be str, not dict
    status: GoalStatus
    created_at: int               # epoch ms
    finished_at: int | None
    last_note: str | None
```

If your model is currently storing JSON in `description`, either string-ify on serialization or move it to a separate field.

---

## 🛠 Bug 6 (also visible in screenshot) — `model` was called twice with two slightly different plans

Two `plan` entries in a row before the model gave up. This means:
- The runner is calling the model in a loop without saving the plan to `goals.plan_jsonb` between iterations.
- Or there's no plan-detection (every iteration the model re-plans because it can't see its own previous plan).

### Fix
After the first `model_step`, persist its plan to `goals.plan_jsonb` and include it in the message history for the next iteration. See **`docs/YANG_AUTOPILOT_PHASE_3_4_BACKEND.md` §3** for the full runner pseudocode — specifically the `if not goal.plan_jsonb` guard.

---

## Order of operations to unblock the Notepad test

1. **Bug 1** (~10 min) — splice the new tool families into the agent's tool dict.
2. **Bug 2** (~10 min) — extend `is_client_executed` to recognize the new prefixes.
3. **Bug 3** (~5 min) — add the `tool-result` resume endpoint.
4. Re-run the Notepad goal — should now execute end-to-end. ✅

Bugs 4–6 are cleanups for the goals UI but **not required** for `/goal` itself to work — the runner clearly already exists.

---

## Quick sanity checks the backend can run today

```python
# Pretend the renderer sent this:
client = ClientEnvelope(kind="desktop", capabilities=["fs", "shell", "computer", "yang_cu"])
tools = {}
tools.update(desktop_tools_for(client.capabilities))
tools.update(yang_cu_tools_for(client.capabilities))
assert "cu_open_target"   in tools
assert "fs_read_file"     in tools
assert "computer_screenshot" in tools
print(f"✅ {len(tools)} desktop tools registered")
```

If that prints `✅ 27 desktop tools registered`, the model will see them on its next turn.

---

## TL;DR for whoever owns the backend

> The frontend is fully shipped and advertising `capabilities: [fs, shell, computer, yang_cu, yang_workflow]` in `client` field of every `/chat/agent/ui-stream` POST. The agent loop currently ignores that field. To unblock everything:
>
> 1. Copy the four `desktop_tools_for / yang_cu_tools_for / yang_workflow_tools_for` functions from `docs/*_BACKEND.md` into a new `app/agents/desktop_*` module each.
> 2. In the agent assembly point, **read `req.client.capabilities`** and `tools.update(…)` with each.
> 3. In the tool-dispatch loop, if `tool_name` is in `CLIENT_EXECUTED_TOOL_NAMES` or starts with `mcp_`, emit `tool-input-available` SSE, await the future from a pending registry, then emit `tool-output-available` with the result.
> 4. Add `POST /chat/agent/tool-result` that resolves that future.
>
> ~30 minutes of work, no new dependencies, reuses the existing model and streaming infrastructure.

# YANG Autopilot — Phase 3 (Goals) & 4 (Memory + Schedules) Backend Recipe

Frontend ships with:
- `/yang` landing + `/yang/goals/[id]` detail + `/yang/memory` + `/yang/schedules` pages
- Goals dock in sidebar with live SSE per running goal
- Slash commands in chat: `/goal …`, `/remember …`, `/schedule daily 8am …`
- Edge proxies under `/api/yang/{goal,goal/[id],goal/[id]/stream,memory,schedule}` that just forward to your Railway backend

What follows is the **server-side** half. The pause/resume tool-routing pattern from `DESKTOP_AGENT_BACKEND_RECIPE.md` is reused — only the new endpoints, tables, and the agent runner are added.

---

## 1. Database schema

```sql
CREATE EXTENSION IF NOT EXISTS vector;   -- pgvector for memory embeddings

CREATE TABLE goals (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT REFERENCES users(id) NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  prompt          TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'queued',   -- queued | running | waiting_for_input | paused | done | failed | cancelled
  plan_jsonb      JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ,
  conversation_id TEXT,                              -- chat that spawned it (optional)
  last_note       TEXT
);
CREATE INDEX goals_user_status_idx ON goals(user_id, status);

CREATE TABLE goal_steps (
  id        BIGSERIAL PRIMARY KEY,
  goal_id   BIGINT REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  idx       INT NOT NULL,
  kind      TEXT NOT NULL,                          -- plan | thought | tool-call | tool-result | note | done | error
  content   JSONB NOT NULL,
  ts        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX goal_steps_goal_idx ON goal_steps(goal_id, idx);

CREATE TABLE memories (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT REFERENCES users(id) NOT NULL,
  kind         TEXT NOT NULL DEFAULT 'fact',        -- preference | fact | tool_recipe | schedule
  key          TEXT NOT NULL,
  value        JSONB NOT NULL,
  embedding    vector(1536),                        -- match your embedding model dim
  tags         TEXT[] DEFAULT '{}',
  source_goal_id BIGINT REFERENCES goals(id) ON DELETE SET NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, key)
);
CREATE INDEX memories_user_idx ON memories(user_id);
CREATE INDEX memories_embedding_idx ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TABLE scheduled_jobs (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT REFERENCES users(id) NOT NULL,
  name          TEXT NOT NULL,
  cron          TEXT NOT NULL,
  prompt        TEXT NOT NULL,
  enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at   TIMESTAMPTZ,
  next_run_at   TIMESTAMPTZ
);
CREATE INDEX scheduled_jobs_user_idx ON scheduled_jobs(user_id);
```

---

## 2. REST endpoints

### Goals
- `POST /goals` — `{ title, description?, prompt }` → returns `Goal`. Creates row, queues for worker.
- `GET /goals` — list all goals for the current user (newest first).
- `GET /goals/{id}` — `{ goal, steps[] }` for hydration.
- `POST /goals/{id}/control` — `{ action: 'pause'|'resume'|'cancel' }`.
- `DELETE /goals/{id}` — soft- or hard-delete.
- `GET /goals/{id}/stream` — SSE. Sends one event whenever a new `goal_step` row is inserted **or** the goal status changes:
  ```
  data: {"type":"step","step":{...goal_step_row...}}
  data: {"type":"status","status":"done"}
  data: {"type":"done"}
  ```

### Memory
- `POST /memory/save` — `{ key, value, kind, tags? }`. Computes embedding from `JSON.stringify({ key, value })` and upserts.
- `GET /memory/search?q=…` — returns top-K (default 20) by cosine similarity. Empty `q` returns most-recently-updated.
- `DELETE /memory/{key}` — deletes by key for current user.

### Schedules
- `POST /schedule` — `{ name, cron, prompt }`. Validate cron with `croniter`. Compute `next_run_at`.
- `GET /schedules`
- `DELETE /schedule/{id}`

All endpoints require the same auth as the rest of your API. Honor `X-Potomac-Client: desktop` header for routing (informational).

---

## 3. The goal runner (`runner.py`)

The runner ticks each `running` or `queued` goal. Pseudocode:

```python
async def tick_goal(goal_id: int):
    goal = await fetch_goal(goal_id)
    if goal.status not in ('queued', 'running', 'waiting_for_input'):
        return
    await set_status(goal_id, 'running')

    # Build conversation context: system prompt + memory top-K + goal history.
    sys_prompt = await build_system_prompt(goal.user_id, goal.prompt)
    history = [step_to_message(s) for s in await fetch_steps(goal_id)]

    # Plan if no plan yet.
    if not goal.plan_jsonb:
        plan = await plan_step(model, sys_prompt, goal.prompt)
        await save_step(goal_id, idx=0, kind='plan', content=plan)
        await save_plan(goal_id, plan)

    # One agentic step.
    step = await model_step(model, sys_prompt, history + [{'role':'user','content':goal.prompt}],
                            tools=all_tools_for(goal.user_id))

    # Persist & emit events.
    for tc in step.tool_calls:
        await save_step(goal_id, kind='tool-call', content={'name': tc.name, 'args': tc.args})
        if tc.name in CLIENT_EXECUTED_TOOL_NAMES:
            # Goals reuse the same /chat/agent/tool-result pause/resume — but
            # they can also surface a `waiting_for_input` status while waiting.
            await set_status(goal_id, 'waiting_for_input')
            result = await wait_for_client_tool_result(goal_id, tc.id, timeout=300)
            await set_status(goal_id, 'running')
        else:
            result = await run_server_tool(tc.name, tc.args)
        await save_step(goal_id, kind='tool-result', content={'name': tc.name, 'result': result})

    if step.assistant_text:
        await save_step(goal_id, kind='note', content=step.assistant_text)

    if step.is_final:
        await set_status(goal_id, 'done')
        await save_step(goal_id, kind='done', content={})
        return

    # Otherwise schedule another tick.
    await enqueue_tick(goal_id, delay=2)
```

Wrap every state change in a Postgres `LISTEN/NOTIFY` so the SSE endpoint can forward events without polling:

```python
async def goal_stream(goal_id: int):
    conn = await acquire_listen_conn()
    await conn.add_listener(f'goal_{goal_id}', queue.put)
    try:
        # Emit current status immediately for fast hydration.
        goal = await fetch_goal(goal_id)
        yield sse({'type':'status', 'status': goal.status})
        while True:
            ev = await queue.get()
            yield sse(json.loads(ev))
            if json.loads(ev).get('type') == 'done':
                break
    finally:
        await release_listen_conn(conn)
```

`save_step()` and `set_status()` both `NOTIFY` the channel with the payload.

---

## 4. The worker (APScheduler)

A single background task at app startup:

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

async def tick_all_queued():
    rows = await db.fetch_all("SELECT id FROM goals WHERE status IN ('queued', 'running')")
    for r in rows:
        asyncio.create_task(tick_goal(r['id']))

async def run_due_schedules():
    rows = await db.fetch_all(
        "SELECT * FROM scheduled_jobs WHERE enabled AND next_run_at <= now()"
    )
    for s in rows:
        # Spawn a new goal from the schedule.
        goal = await create_goal(s.user_id, title=s.name, prompt=s.prompt)
        # Advance next_run_at using croniter.
        await db.execute(
            "UPDATE scheduled_jobs SET last_run_at = now(), next_run_at = :next WHERE id = :id",
            {'next': croniter(s.cron, datetime.utcnow()).get_next(datetime), 'id': s.id},
        )

scheduler.add_job(tick_all_queued,    'interval', seconds=5,  id='yang-ticker')
scheduler.add_job(run_due_schedules,  'interval', seconds=30, id='yang-scheduler')
scheduler.start()
```

---

## 5. Memory injection into the chat agent

When the user sends a normal chat message *or* a goal ticks, prepend the top-8 semantically-most-relevant memories to the system prompt:

```python
async def build_system_prompt(user_id: int, user_msg: str) -> str:
    base = CURRENT_SYSTEM_PROMPT
    relevant = await memory_search(user_id, user_msg, limit=8)
    if not relevant:
        return base
    block = "<learned_preferences>\n" + "\n".join(f"- {m.key}: {json.dumps(m.value)}" for m in relevant) + "\n</learned_preferences>"
    return base + "\n\n" + block
```

Use the same embedding model you already have configured (likely OpenAI `text-embedding-3-small` or similar — keep the dimension consistent with the `vector(1536)` column).

---

## 6. New "memory_*" + "schedule_*" tools the agent can call autonomously

Optional but recommended — lets the AI save / search memories without the user explicitly typing `/remember`:

```python
class MemorySaveArgs(BaseModel):
    key: str
    value: dict | str
    kind: Literal['preference', 'fact', 'tool_recipe', 'schedule'] = 'fact'
    tags: list[str] = []

class MemorySearchArgs(BaseModel):
    query: str
    limit: int = 8

YANG_MEMORY_TOOLS = {
    'memory_save':   {'description': 'Save a long-term memory for this user.', 'schema': MemorySaveArgs.model_json_schema()},
    'memory_search': {'description': 'Search the user\'s long-term memories.', 'schema': MemorySearchArgs.model_json_schema()},
}
```

These execute **server-side** (just direct DB calls — no client round-trip).

---

## 7. SSE event shape (must match the frontend)

The frontend (`src/lib/yang/client.ts`) expects:

```
data: {"type":"step", "step": { id, goalId, idx, kind, content, ts }}
data: {"type":"status", "status": "running"|"waiting_for_input"|"paused"|"done"|"failed"|"cancelled"}
data: {"type":"done"}
```

Where `step.kind` is one of `plan | thought | tool-call | tool-result | note | done | error`.

---

## 8. End-to-end sanity test

1. `POST /goals` with `{prompt: "Read README.md and summarize"}`
2. Open the goal in the YANG dock — UI shows "queued → running → tool-call fs_read_file → tool-result → note (summary) → done".
3. Save a memory: `/remember I prefer responses in bullet points`
4. Start a new chat — model receives the preference in `<learned_preferences>` and responds in bullets.
5. Add a schedule `/schedule daily 8am Give me a market briefing`
6. At 8am the next day, a new goal appears in the dock and runs autonomously.

---

## 9. Notes on the existing `/api/chat` integration

Goals **reuse the same `/chat/agent/tool-result` endpoint** for client-executed tools — the runner just stores `goal_id` next to the pending future so the `tool-result` POST can resolve it. No new client-side code needed; the existing `installDesktopRuntime()` in the renderer already wires the response.

When the renderer receives a `tool-call` over a goal SSE (not a chat SSE), the existing interceptor's `/api/chat` URL filter won't catch it. That's fine — goal tool-calls flow through your **server-side agent runner** which uses the same pending registry; the renderer's POST to `/api/chat/tool-result` still resolves the correct future.

If for some reason a goal needs *desktop* tool execution from a context that isn't tied to a chat conversation, the simplest approach is to launch each goal under a hidden `conversation_id` (the runner can create one when the goal starts), so the client sees it as if it were a normal chat tool-call. Future enhancement; not required for v1.

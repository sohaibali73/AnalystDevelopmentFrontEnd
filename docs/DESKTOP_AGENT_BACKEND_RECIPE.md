# Backend Recipe: Desktop Agent (FastAPI + Python AI SDK port)

This is the **server-side** half of the desktop agent feature. The Electron client now ships fully built and will:

- Auto-inject `client: { kind: "desktop", capabilities: [...] }` into every `POST /api/chat` request (relayed unchanged to your Railway backend at `/chat/agent/ui-stream`).
- Also send headers `X-Potomac-Client: desktop` and `X-Potomac-Capabilities: fs,shell,computer`.
- POST tool execution results back via `POST /api/chat/tool-result` → which proxies to **new backend endpoint** `POST /chat/agent/tool-result`.
- Recognize **all** tool names listed in `## Tool inventory` below as "execute on the client".

Web (non-Electron) users send no `client` field — backend behavior is unchanged for them.

---

## What you need to add on Railway

### 1. The body envelope `client`

`/chat/agent/ui-stream` already takes a JSON body. Add an optional field:

```python
from pydantic import BaseModel
from typing import Literal, Optional

class ClientEnvelope(BaseModel):
    kind: Literal["desktop", "web"] = "web"
    version: Optional[str] = None
    capabilities: list[str] = []     # subset of ["fs","shell","computer"]
    platform: Optional[str] = None

class ChatRequest(BaseModel):
    content: str
    conversation_id: Optional[str] = None
    # … existing fields …
    client: Optional[ClientEnvelope] = None
```

### 2. The pending-tool registry (in-memory, per-process)

```python
# desktop_pending.py
import asyncio
from typing import Any
from dataclasses import dataclass, field

@dataclass
class PendingCall:
    future: asyncio.Future
    started_at: float

# Keyed by (conversation_id, tool_call_id)
_pending: dict[tuple[str, str], PendingCall] = {}

def register(conv_id: str, call_id: str) -> asyncio.Future:
    fut: asyncio.Future = asyncio.get_event_loop().create_future()
    _pending[(conv_id, call_id)] = PendingCall(future=fut, started_at=__import__("time").time())
    return fut

def resolve(conv_id: str, call_id: str, result: Any, error: str | None) -> bool:
    key = (conv_id, call_id)
    pc = _pending.pop(key, None)
    if not pc or pc.future.done():
        return False
    if error:
        pc.future.set_exception(RuntimeError(error))
    else:
        pc.future.set_result(result)
    return True
```

### 3. The desktop tool schemas (no `execute()` — server-side declarations only)

These must match the names the client knows about (see `src/lib/desktop/bridge.ts` → `DESKTOP_TOOL_NAMES`).

```python
# desktop_tools.py — Python AI SDK port "tool" definitions
from ai import tool  # or whatever wrapper your port uses
from pydantic import BaseModel
from typing import Literal, Optional

# ── Filesystem ──────────────────────────────────────────────────────────────
class FsRead(BaseModel):
    path: str
    encoding: Optional[str] = "utf-8"

class FsWrite(BaseModel):
    path: str
    content: str
    encoding: Optional[str] = "utf-8"
    createDirs: Optional[bool] = True

class FsAppend(BaseModel):
    path: str
    content: str

class FsPath(BaseModel):
    path: str

class FsList(BaseModel):
    path: str
    recursive: Optional[bool] = False
    maxEntries: Optional[int] = 1000

class FsMoveCopy(BaseModel):
    src: str
    dest: str

class FsPickFile(BaseModel):
    multi: Optional[bool] = False

class _Empty(BaseModel):
    pass

# ── Shell ───────────────────────────────────────────────────────────────────
class ShellRun(BaseModel):
    command: str
    args: list[str] = []
    cwd: Optional[str] = None
    env: Optional[dict[str, str]] = None
    timeoutMs: Optional[int] = None
    shell: Optional[bool] = False

class ShellOpen(BaseModel):
    target: str  # path or URL

# ── Computer use ────────────────────────────────────────────────────────────
class ComputerScreenshot(BaseModel):
    displayIndex: Optional[int] = 0

class ComputerXY(BaseModel):
    x: int
    y: int
    speed: Optional[int] = None

class ComputerClick(BaseModel):
    x: Optional[int] = None
    y: Optional[int] = None
    button: Optional[Literal["left", "right", "middle"]] = "left"

class ComputerXYOpt(BaseModel):
    x: Optional[int] = None
    y: Optional[int] = None

class ComputerDrag(BaseModel):
    from_: dict
    to: dict

    class Config:
        fields = {"from_": "from"}

class ComputerScroll(BaseModel):
    direction: Literal["up", "down", "left", "right"]
    amount: int

class ComputerType(BaseModel):
    text: str
    delayMs: Optional[int] = None

class ComputerKey(BaseModel):
    combo: str


def desktop_tools_for(caps: list[str]) -> dict[str, dict]:
    """
    Returns a dict {name: {description, parameters_schema}} for every desktop
    tool the client advertised support for. These are *declared only* — the
    agent loop must intercept their tool-call events and ROUTE them to the
    client via SSE, awaiting the result before continuing.
    """
    out = {}
    if "fs" in caps:
        out.update({
            "fs_read_file":   {"description": "Read a text file from the user's machine.", "schema": FsRead.model_json_schema()},
            "fs_write_file":  {"description": "Write a text file. Creates parent dirs by default.", "schema": FsWrite.model_json_schema()},
            "fs_append_file": {"description": "Append to a text file.", "schema": FsAppend.model_json_schema()},
            "fs_delete":      {"description": "Delete a file or folder recursively.", "schema": FsPath.model_json_schema()},
            "fs_list_dir":    {"description": "List a directory. Set recursive=true for a tree.", "schema": FsList.model_json_schema()},
            "fs_stat":        {"description": "Stat a file/folder.", "schema": FsPath.model_json_schema()},
            "fs_move":        {"description": "Move/rename.", "schema": FsMoveCopy.model_json_schema()},
            "fs_copy":        {"description": "Copy (recursive for folders).", "schema": FsMoveCopy.model_json_schema()},
            "fs_mkdir":       {"description": "Create a directory (recursive).", "schema": FsPath.model_json_schema()},
            "fs_pick_file":   {"description": "Ask the user to pick a file via OS dialog. Use to access paths outside the workspace.", "schema": FsPickFile.model_json_schema()},
            "fs_pick_folder": {"description": "Ask the user to pick a folder and grant access to it.", "schema": _Empty.model_json_schema()},
        })
    if "shell" in caps:
        out.update({
            "shell_run":  {"description": "Run any shell command and return stdout/stderr/exitCode.", "schema": ShellRun.model_json_schema()},
            "shell_open": {"description": "Open a path or URL with the OS default handler.", "schema": ShellOpen.model_json_schema()},
        })
    if "computer" in caps:
        out.update({
            "computer_screenshot":      {"description": "Capture a full-screen PNG (base64) of the user's primary display. Call this BEFORE clicking to ground your coordinates.", "schema": ComputerScreenshot.model_json_schema()},
            "computer_screen_size":     {"description": "Get screen dimensions.",          "schema": _Empty.model_json_schema()},
            "computer_cursor_position": {"description": "Where the cursor currently is.",  "schema": _Empty.model_json_schema()},
            "computer_move":            {"description": "Move the mouse to (x,y).",        "schema": ComputerXY.model_json_schema()},
            "computer_click":           {"description": "Click; optionally move to (x,y) first.", "schema": ComputerClick.model_json_schema()},
            "computer_double_click":    {"description": "Double-click.",                   "schema": ComputerXYOpt.model_json_schema()},
            "computer_right_click":     {"description": "Right-click.",                    "schema": ComputerXYOpt.model_json_schema()},
            "computer_drag":            {"description": "Drag from one point to another.", "schema": ComputerDrag.model_json_schema()},
            "computer_scroll":          {"description": "Scroll in a direction.",          "schema": ComputerScroll.model_json_schema()},
            "computer_type":            {"description": "Type a string at the cursor.",    "schema": ComputerType.model_json_schema()},
            "computer_key":             {"description": "Press a key combo like 'Ctrl+Shift+T' or 'Enter'.", "schema": ComputerKey.model_json_schema()},
        })
    return out
```

### 4. Patch the agent loop in `/chat/agent/ui-stream`

Wherever your loop says "model wants tool X, run it locally", short-circuit for desktop tool names:

```python
DESKTOP_TOOL_NAMES = {
    "fs_read_file", "fs_write_file", "fs_append_file", "fs_delete",
    "fs_list_dir", "fs_stat", "fs_move", "fs_copy", "fs_mkdir",
    "fs_pick_file", "fs_pick_folder",
    "shell_run", "shell_open",
    "computer_screenshot", "computer_screen_size", "computer_cursor_position",
    "computer_move", "computer_click", "computer_double_click", "computer_right_click",
    "computer_drag", "computer_scroll", "computer_type", "computer_key",
}

async def stream_agent(req: ChatRequest):
    caps = (req.client.capabilities if req.client and req.client.kind == "desktop" else [])
    extra_tools = desktop_tools_for(caps)
    tools = {**server_tools(), **extra_tools}

    async def event_iter():
        # … your existing agent loop …

        while True:
            step = await model_step(messages, tools)

            # When the model emits a tool call:
            for call in step.tool_calls:
                if call.name in DESKTOP_TOOL_NAMES:
                    # 1) Emit the AI SDK v5 "tool-input-available" UI event so the
                    #    client knows what to execute.
                    yield sse_format({
                        "type": "tool-input-available",
                        "toolCallId": call.id,
                        "toolName": call.name,
                        "input": call.args,
                    })

                    # 2) Pause and wait for the client to POST the result.
                    fut = pending.register(req.conversation_id, call.id)
                    try:
                        result = await asyncio.wait_for(fut, timeout=300)
                        error = None
                    except asyncio.TimeoutError:
                        result, error = None, "client did not return tool result in 5 minutes"
                    except Exception as e:
                        result, error = None, str(e)

                    # 3) Emit the AI SDK v5 "tool-output-available" UI event and
                    #    feed the result back into the next model step.
                    yield sse_format({
                        "type": "tool-output-available",
                        "toolCallId": call.id,
                        "output": result if error is None else {"error": error},
                    })
                    messages.append(tool_result_message(call.id, result, error))
                else:
                    # existing server-side tool execution path
                    result = await run_server_tool(call.name, call.args)
                    yield sse_format({
                        "type": "tool-output-available",
                        "toolCallId": call.id,
                        "output": result,
                    })
                    messages.append(tool_result_message(call.id, result, None))

            if step.is_final:
                break

    return StreamingResponse(event_iter(), media_type="text/event-stream",
                             headers={"x-vercel-ai-ui-message-stream": "v1"})
```

> **Key detail:** the event field names `type`, `toolCallId`, `toolName`, `input`, and `output` must match exactly what the AI SDK v5 UI Message Stream protocol expects. The client interceptor in `src/lib/desktop/install.ts` accepts both `tool-input-available` and the older `tool-call` / `tool_call` shapes, so use whichever your Python AI SDK port already emits.

### 5. The resume endpoint

```python
class ToolResultRequest(BaseModel):
    conversation_id: str
    tool_call_id: str
    tool_name: Optional[str] = None
    result: Optional[Any] = None
    error: Optional[str] = None

@router.post("/chat/agent/tool-result")
async def tool_result(req: ToolResultRequest, request: Request):
    # Optional: verify Authorization header / user owns conversation_id
    ok = pending.resolve(req.conversation_id, req.tool_call_id, req.result, req.error)
    if not ok:
        return Response(status_code=410, content='{"error":"unknown or expired tool_call_id"}',
                        media_type="application/json")
    return Response(status_code=204)
```

### 6. System-prompt augmentation (when caps present)

Prepend this to your system prompt when `req.client.kind == "desktop"`:

```
You have access to the user's desktop through a set of tools that execute on
THEIR machine (not yours). The Potomac Workspace lives at ~/PotomacWorkspace
and is the default place to put files. Use fs_pick_file or fs_pick_folder to
gain access to paths outside the workspace.

Rules:
- Before any computer_click / computer_type, call computer_screenshot first.
- Prefer non-destructive shell commands. Destructive commands outside the
  workspace will prompt the user for approval.
- Never store secrets or credentials in files.
- If a tool returns { error: "..." }, do not retry the same call blindly.
- If a tool is denied, explain that and offer the user a different path
  (e.g. fs_pick_folder).
```

### 7. (Optional) audit table

```sql
CREATE TABLE tool_invocations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT,
  conversation_id TEXT,
  tool_call_id TEXT,
  tool_name TEXT,
  client_kind TEXT,         -- 'desktop' or 'web'
  status TEXT,              -- 'success' | 'error'
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  error TEXT
);
```

Log a row when you emit the tool-input event and update it when the result returns.

---

## Tool inventory (canonical names)

These are the exact names the client recognizes. Use them verbatim in your AI SDK tool registrations:

**Filesystem (`capabilities: ["fs"]`):**
`fs_read_file`, `fs_write_file`, `fs_append_file`, `fs_delete`, `fs_list_dir`, `fs_stat`, `fs_move`, `fs_copy`, `fs_mkdir`, `fs_pick_file`, `fs_pick_folder`

**Shell (`capabilities: ["shell"]`):**
`shell_run`, `shell_open`

**Computer use (`capabilities: ["computer"]`):**
`computer_screenshot`, `computer_screen_size`, `computer_cursor_position`, `computer_move`, `computer_click`, `computer_double_click`, `computer_right_click`, `computer_drag`, `computer_scroll`, `computer_type`, `computer_key`

---

## End-to-end sanity test

After deploying:

1. Open the Electron app, complete onboarding (set passcode, enable fs/shell).
2. Ask the chat: *"Read the README in my workspace."*
3. Expected backend log: `tool_input_available fs_read_file …` → pause → `tool_result` POST arrives → resume.
4. Expected client log: tool activity drawer shows `fs_read_file` → success → duration.
5. The AI's next message includes the file's contents.

If the agent loop emits the tool call but the client never sees it, the SSE event `type` field is probably named differently than what the client interceptor recognizes. The interceptor accepts `tool-call`, `tool_call`, `tool-call-streaming-start`, and `tool-input-available`. Pick one and stick with it.

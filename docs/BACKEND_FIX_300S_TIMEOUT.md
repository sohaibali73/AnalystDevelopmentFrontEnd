# Backend Fix — `client did not return result for X within 300s`

This doc is **copy-paste-ready Python** to fix the exact error shown in the
desktop app's audit log:

```
8:27:47 AM  ▶ tool-call    computer_key { combo: "Win+R" }
8:32:48 AM  ✗ tool-result  "client did not return result for computer_key within 300s"
8:32:49 AM  ✗ Claude API error 400: `tool_use` ids were found without
            `tool_result` blocks immediately after: toolu_…
```

The **frontend** was already fixed in commit `<latest master>` — the two bugs
where (a) `cu_*` / `yang_*` tool names weren't in the allowlist and (b) the
auth header was lost when posting tool results. See
`docs/COMPUTER_USE_TIMEOUT_DIAGNOSIS.md`.

**This doc covers the remaining backend work**, which is the actual reason the
agent hung for 5 minutes.

---

## TL;DR — three Python changes

| # | File | Change | Lines |
|---|------|--------|------:|
| 1 | `app/agents/desktop_tools.py` (new) | Define schema for every client-executed tool | ~150 |
| 2 | Wherever you build the agent's `tools = {...}` dict | Merge desktop tools when `client.capabilities` is present | ~6 |
| 3 | `app/api/chat_agent.py` | Add `POST /chat/agent/tool-result` + route client-executed tool calls through a pending-future | ~80 |

Total: ~30 minutes, no new pip dependencies.

---

## Step 1 — Create `app/agents/desktop_tools.py`

```python
"""
Client-executed tool schemas for the Potomac Desktop Agent.

These tools are *declared* here so the model can choose them, but the actual
implementation lives in the Electron renderer (`window.potomacTools`).

The agent loop must NOT try to execute them server-side. Instead it should
emit `tool-input-available` over SSE, wait for the matching
`POST /chat/agent/tool-result`, then resume with that result.
"""
from typing import Any

# ── Tool name groups (must match src/lib/desktop/bridge.ts DESKTOP_TOOL_NAMES) ─

FS_TOOL_NAMES = {
    "fs_read_file", "fs_write_file", "fs_append_file", "fs_delete",
    "fs_list_dir", "fs_stat", "fs_move", "fs_copy", "fs_mkdir",
    "fs_pick_file", "fs_pick_folder",
}
SHELL_TOOL_NAMES = {"shell_run", "shell_open"}
COMPUTER_TOOL_NAMES = {
    "computer_screenshot", "computer_screen_size", "computer_cursor_position",
    "computer_move", "computer_click", "computer_double_click",
    "computer_right_click", "computer_drag", "computer_scroll",
    "computer_type", "computer_key",
}
YANG_CU_TOOL_NAMES = {
    "cu_open_target", "cu_close", "cu_list_targets",
    "cu_screenshot", "cu_get_content",
    "cu_click", "cu_double_click", "cu_type", "cu_key", "cu_scroll", "cu_size",
    "browser_navigate", "browser_eval", "browser_pin_note", "browser_get_pins",
    "browser_download", "browser_list_downloads", "browser_wait_for", "browser_fill",
}
YANG_WORKFLOW_TOOL_NAMES = {
    "terminal_run",
    "github_list_prs", "github_pr_diff", "github_pr_comment",
    "github_pr_review", "github_clone", "github_status",
    "ssh_connect", "ssh_exec", "ssh_disconnect",
}

CLIENT_EXECUTED_TOOL_NAMES = (
    FS_TOOL_NAMES
    | SHELL_TOOL_NAMES
    | COMPUTER_TOOL_NAMES
    | YANG_CU_TOOL_NAMES
    | YANG_WORKFLOW_TOOL_NAMES
)


def is_client_executed(tool_name: str) -> bool:
    """All MCP-namespaced tools (`mcp_*`) are also client-executed."""
    return tool_name in CLIENT_EXECUTED_TOOL_NAMES or tool_name.startswith("mcp_")


# ── Anthropic-format tool schemas ─────────────────────────────────────────────
# These are the schemas the model needs to see in order to choose to call
# them. Match the runtime contract exposed by the renderer.

DESKTOP_TOOL_SCHEMAS: dict[str, dict[str, Any]] = {
    # ── Filesystem ──────────────────────────────────────────────────────
    "fs_read_file": {
        "name": "fs_read_file",
        "description": "Read a UTF-8 text file from the user's workspace.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path":     {"type": "string", "description": "Absolute or workspace-relative path."},
                "encoding": {"type": "string", "default": "utf-8"},
            },
            "required": ["path"],
        },
    },
    "fs_write_file": {
        "name": "fs_write_file",
        "description": "Write (overwrite) a UTF-8 text file. Creates parent directories if `createDirs` is true.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path":       {"type": "string"},
                "content":    {"type": "string"},
                "encoding":   {"type": "string", "default": "utf-8"},
                "createDirs": {"type": "boolean", "default": True},
            },
            "required": ["path", "content"],
        },
    },
    "fs_append_file": {
        "name": "fs_append_file",
        "description": "Append text to a file.",
        "input_schema": {
            "type": "object",
            "properties": {"path": {"type": "string"}, "content": {"type": "string"}},
            "required": ["path", "content"],
        },
    },
    "fs_list_dir": {
        "name": "fs_list_dir",
        "description": "List the entries in a directory.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path":       {"type": "string"},
                "recursive":  {"type": "boolean", "default": False},
                "maxEntries": {"type": "integer", "default": 500},
            },
            "required": ["path"],
        },
    },
    "fs_stat": {
        "name": "fs_stat",
        "description": "Stat a file or directory (size, mtime, exists?).",
        "input_schema": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]},
    },
    "fs_delete": {
        "name": "fs_delete",
        "description": "Delete a file or directory.",
        "input_schema": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]},
    },
    "fs_mkdir": {
        "name": "fs_mkdir",
        "description": "Create a directory (recursive).",
        "input_schema": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]},
    },
    "fs_move": {
        "name": "fs_move",
        "description": "Move/rename a file or directory.",
        "input_schema": {
            "type": "object",
            "properties": {"src": {"type": "string"}, "dest": {"type": "string"}},
            "required": ["src", "dest"],
        },
    },
    "fs_copy": {
        "name": "fs_copy",
        "description": "Copy a file or directory.",
        "input_schema": {
            "type": "object",
            "properties": {"src": {"type": "string"}, "dest": {"type": "string"}},
            "required": ["src", "dest"],
        },
    },

    # ── Shell ───────────────────────────────────────────────────────────
    "shell_run": {
        "name": "shell_run",
        "description": "Run a shell command and return its stdout/stderr/exit-code. Prompts for user consent unless auto-approved.",
        "input_schema": {
            "type": "object",
            "properties": {
                "command":   {"type": "string"},
                "args":      {"type": "array", "items": {"type": "string"}, "default": []},
                "cwd":       {"type": "string"},
                "timeoutMs": {"type": "integer", "default": 60000},
                "shell":     {"type": "boolean", "default": False},
            },
            "required": ["command"],
        },
    },
    "shell_open": {
        "name": "shell_open",
        "description": "Open a file/folder/URL in the user's default OS handler.",
        "input_schema": {
            "type": "object",
            "properties": {"target": {"type": "string"}},
            "required": ["target"],
        },
    },

    # ── Real-cursor computer use (legacy; moves user's mouse) ───────────
    "computer_screenshot": {
        "name": "computer_screenshot",
        "description": "Capture a PNG screenshot of the user's primary display. Returns base64.",
        "input_schema": {
            "type": "object",
            "properties": {"displayIndex": {"type": "integer", "default": 0}},
        },
    },
    "computer_screen_size": {
        "name": "computer_screen_size",
        "description": "Get the user's primary display size and DPI scale factor.",
        "input_schema": {"type": "object", "properties": {}},
    },
    "computer_move": {
        "name": "computer_move",
        "description": "Move the user's real mouse cursor. **Visible to the user.**",
        "input_schema": {
            "type": "object",
            "properties": {"x": {"type": "integer"}, "y": {"type": "integer"}, "speed": {"type": "integer"}},
            "required": ["x", "y"],
        },
    },
    "computer_click": {
        "name": "computer_click",
        "description": "Click at coordinates (or current cursor position).",
        "input_schema": {
            "type": "object",
            "properties": {
                "x":      {"type": "integer"},
                "y":      {"type": "integer"},
                "button": {"type": "string", "enum": ["left", "right", "middle"], "default": "left"},
            },
        },
    },
    "computer_double_click": {
        "name": "computer_double_click",
        "description": "Double-click at coordinates.",
        "input_schema": {
            "type": "object",
            "properties": {"x": {"type": "integer"}, "y": {"type": "integer"}},
        },
    },
    "computer_type": {
        "name": "computer_type",
        "description": "Type text via the user's real keyboard.",
        "input_schema": {
            "type": "object",
            "properties": {"text": {"type": "string"}, "delayMs": {"type": "integer", "default": 0}},
            "required": ["text"],
        },
    },
    "computer_key": {
        "name": "computer_key",
        "description": "Press a key combination (e.g. 'Ctrl+S', 'Win+R', 'Enter').",
        "input_schema": {
            "type": "object",
            "properties": {"combo": {"type": "string"}},
            "required": ["combo"],
        },
    },
    "computer_scroll": {
        "name": "computer_scroll",
        "description": "Scroll the screen.",
        "input_schema": {
            "type": "object",
            "properties": {
                "direction": {"type": "string", "enum": ["up", "down", "left", "right"]},
                "amount":    {"type": "integer"},
            },
            "required": ["direction", "amount"],
        },
    },

    # ── Background Computer Use (cursor-aware; does NOT move user's mouse) ─
    "cu_open_target": {
        "name": "cu_open_target",
        "description": (
            "Open a *background* target for the agent to control without disturbing the user. "
            "kind='browser' launches a headed Chromium with its OWN window/cursor (user's mouse not moved). "
            "kind='native' opens a desktop application via Windows UI Automation (no cursor movement). "
            "kind='virtual-desktop' creates a virtual Windows desktop the agent owns exclusively."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "kind":        {"type": "string", "enum": ["browser", "native", "virtual-desktop"]},
                "url":         {"type": "string", "description": "For kind='browser'."},
                "app":         {"type": "string", "description": "For kind='native'/'virtual-desktop' (e.g. 'notepad.exe')."},
                "args":        {"type": "array", "items": {"type": "string"}},
                "windowTitle": {"type": "string", "description": "Attach to an existing window by title (native only)."},
            },
            "required": ["kind"],
        },
    },
    "cu_close": {
        "name": "cu_close",
        "description": "Close a target previously opened with cu_open_target.",
        "input_schema": {"type": "object", "properties": {"targetId": {"type": "string"}}, "required": ["targetId"]},
    },
    "cu_list_targets": {
        "name": "cu_list_targets",
        "description": "List all currently-open background targets.",
        "input_schema": {"type": "object", "properties": {}},
    },
    "cu_screenshot": {
        "name": "cu_screenshot",
        "description": "Take a PNG screenshot of one specific background target.",
        "input_schema": {"type": "object", "properties": {"targetId": {"type": "string"}}, "required": ["targetId"]},
    },
    "cu_get_content": {
        "name": "cu_get_content",
        "description": "Get the structured content (DOM / accessibility tree) of a target.",
        "input_schema": {"type": "object", "properties": {"targetId": {"type": "string"}}, "required": ["targetId"]},
    },
    "cu_click": {
        "name": "cu_click",
        "description": "Click inside a background target (coordinates relative to its surface).",
        "input_schema": {
            "type": "object",
            "properties": {
                "targetId": {"type": "string"},
                "x": {"type": "integer"}, "y": {"type": "integer"},
                "button": {"type": "string", "enum": ["left", "right", "middle"], "default": "left"},
            },
            "required": ["targetId", "x", "y"],
        },
    },
    "cu_double_click": {
        "name": "cu_double_click",
        "input_schema": {
            "type": "object",
            "properties": {"targetId": {"type": "string"}, "x": {"type": "integer"}, "y": {"type": "integer"}},
            "required": ["targetId", "x", "y"],
        },
    },
    "cu_type": {
        "name": "cu_type",
        "description": "Type text into the currently-focused control of a background target.",
        "input_schema": {
            "type": "object",
            "properties": {
                "targetId": {"type": "string"},
                "text":     {"type": "string"},
                "delayMs":  {"type": "integer"},
            },
            "required": ["targetId", "text"],
        },
    },
    "cu_key": {
        "name": "cu_key",
        "description": "Press a key combo inside a background target (e.g. 'Ctrl+S').",
        "input_schema": {
            "type": "object",
            "properties": {"targetId": {"type": "string"}, "combo": {"type": "string"}},
            "required": ["targetId", "combo"],
        },
    },
    "cu_scroll": {
        "name": "cu_scroll",
        "input_schema": {
            "type": "object",
            "properties": {
                "targetId": {"type": "string"},
                "x": {"type": "integer"}, "y": {"type": "integer"},
                "dx": {"type": "integer"}, "dy": {"type": "integer"},
            },
            "required": ["targetId", "x", "y", "dx", "dy"],
        },
    },

    # ── Browser-only conveniences ───────────────────────────────────────
    "browser_navigate": {
        "name": "browser_navigate",
        "description": "Navigate an existing browser target to a new URL.",
        "input_schema": {
            "type": "object",
            "properties": {"targetId": {"type": "string"}, "url": {"type": "string"}},
            "required": ["targetId", "url"],
        },
    },
    "browser_fill": {
        "name": "browser_fill",
        "description": "Fill an <input>/<textarea> by CSS selector (more reliable than coordinate-typing).",
        "input_schema": {
            "type": "object",
            "properties": {
                "targetId": {"type": "string"},
                "selector": {"type": "string"},
                "value":    {"type": "string"},
            },
            "required": ["targetId", "selector", "value"],
        },
    },
    "browser_wait_for": {
        "name": "browser_wait_for",
        "description": "Wait for a CSS selector to appear (defaults to 15s timeout).",
        "input_schema": {
            "type": "object",
            "properties": {
                "targetId":  {"type": "string"},
                "selector":  {"type": "string"},
                "timeoutMs": {"type": "integer", "default": 15000},
            },
            "required": ["targetId", "selector"],
        },
    },
    "browser_download": {
        "name": "browser_download",
        "description": (
            "Download a URL through the browser's session (cookies/auth carry over) "
            "and save it to the user's `<workspace>/Downloads/` folder. Returns the local path."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "targetId": {"type": "string"},
                "url":      {"type": "string"},
                "filename": {"type": "string"},
            },
            "required": ["targetId", "url"],
        },
    },
    "browser_list_downloads": {
        "name": "browser_list_downloads",
        "description": "List all files downloaded by this browser session.",
        "input_schema": {"type": "object", "properties": {"targetId": {"type": "string"}}, "required": ["targetId"]},
    },
    "browser_eval": {
        "name": "browser_eval",
        "description": "Evaluate JavaScript in the page context of a browser target.",
        "input_schema": {
            "type": "object",
            "properties": {"targetId": {"type": "string"}, "script": {"type": "string"}},
            "required": ["targetId", "script"],
        },
    },

    # ── Workflow (Phase 5) ──────────────────────────────────────────────
    "terminal_run": {
        "name": "terminal_run",
        "description": "Run a command in a fresh PTY and capture its output.",
        "input_schema": {
            "type": "object",
            "properties": {
                "command":   {"type": "string"},
                "cwd":       {"type": "string"},
                "timeoutMs": {"type": "integer"},
            },
            "required": ["command"],
        },
    },
    "github_list_prs": {
        "name": "github_list_prs",
        "input_schema": {
            "type": "object",
            "properties": {
                "repo":  {"type": "string", "description": "owner/repo"},
                "state": {"type": "string", "enum": ["open", "closed", "merged", "all"], "default": "open"},
            },
            "required": ["repo"],
        },
    },
    "github_pr_diff": {
        "name": "github_pr_diff",
        "input_schema": {
            "type": "object",
            "properties": {"repo": {"type": "string"}, "pr": {"type": "integer"}},
            "required": ["repo", "pr"],
        },
    },
    "github_pr_comment": {
        "name": "github_pr_comment",
        "input_schema": {
            "type": "object",
            "properties": {"repo": {"type": "string"}, "pr": {"type": "integer"}, "body": {"type": "string"}},
            "required": ["repo", "pr", "body"],
        },
    },
}


def desktop_tools_for(capabilities: list[str]) -> dict[str, dict]:
    """Return only the tool schemas the renderer advertises support for."""
    out: dict[str, dict] = {}
    caps = set(capabilities or [])
    if "fs" in caps:
        for n in FS_TOOL_NAMES:
            if n in DESKTOP_TOOL_SCHEMAS:
                out[n] = DESKTOP_TOOL_SCHEMAS[n]
    if "shell" in caps:
        for n in SHELL_TOOL_NAMES:
            if n in DESKTOP_TOOL_SCHEMAS:
                out[n] = DESKTOP_TOOL_SCHEMAS[n]
    if "computer" in caps:
        for n in COMPUTER_TOOL_NAMES:
            if n in DESKTOP_TOOL_SCHEMAS:
                out[n] = DESKTOP_TOOL_SCHEMAS[n]
        # cu_* / browser_* are also gated on the 'computer' capability — they
        # don't move the user's real cursor, but they still affect their machine.
        for n in YANG_CU_TOOL_NAMES:
            if n in DESKTOP_TOOL_SCHEMAS:
                out[n] = DESKTOP_TOOL_SCHEMAS[n]
    if "shell" in caps:
        for n in YANG_WORKFLOW_TOOL_NAMES:
            if n in DESKTOP_TOOL_SCHEMAS:
                out[n] = DESKTOP_TOOL_SCHEMAS[n]
    return out
```

---

## Step 2 — Merge desktop tools into the agent's tool dict

Find the function that builds the model's tool list. It probably looks like:

```python
async def build_tools_for_request(req: ChatRequest) -> dict[str, dict]:
    tools = {}
    tools["web_search"]            = WEB_SEARCH_SCHEMA
    tools["generate_word"]         = GENERATE_WORD_SCHEMA
    tools["python_execute"]        = PYTHON_EXECUTE_SCHEMA
    tools["knowledge_base_search"] = KB_SEARCH_SCHEMA
    # ... etc
    return tools
```

Add the three lines marked `# NEW`:

```python
from app.agents.desktop_tools import desktop_tools_for   # NEW

async def build_tools_for_request(req: ChatRequest) -> dict[str, dict]:
    tools = {}
    tools["web_search"]            = WEB_SEARCH_SCHEMA
    tools["generate_word"]         = GENERATE_WORD_SCHEMA
    tools["python_execute"]        = PYTHON_EXECUTE_SCHEMA
    tools["knowledge_base_search"] = KB_SEARCH_SCHEMA
    # ... etc

    # NEW: register client-executed tools the renderer advertises.
    caps = []
    if getattr(req, "client", None) and getattr(req.client, "kind", None) == "desktop":
        caps = req.client.capabilities or []
    tools.update(desktop_tools_for(caps))                # NEW

    return tools
```

Make sure `ChatRequest` (or the equivalent Pydantic model) has the `client`
field. If it doesn't:

```python
class ClientEnvelope(BaseModel):
    kind: str = "web"
    version: str | None = None
    capabilities: list[str] = []
    platform: str | None = None

class ChatRequest(BaseModel):
    # ... existing fields ...
    client: ClientEnvelope | None = None
```

---

## Step 3 — Route client-executed tools through a pending-future

In the agent loop, when the model returns a `tool_use` block:

```python
import asyncio
from collections import defaultdict
from app.agents.desktop_tools import is_client_executed

# Module-level registry of conversation_id → tool_call_id → Future
_pending: dict[str, dict[str, asyncio.Future]] = defaultdict(dict)


def register_pending(conversation_id: str, tool_call_id: str) -> asyncio.Future:
    fut: asyncio.Future = asyncio.get_event_loop().create_future()
    _pending[conversation_id][tool_call_id] = fut
    return fut


def resolve_pending(conversation_id: str, tool_call_id: str,
                    result: Any, error: str | None) -> bool:
    fut = _pending.get(conversation_id, {}).pop(tool_call_id, None)
    if not fut:
        return False
    if not fut.done():
        if error:
            fut.set_result({"error": error})
        else:
            fut.set_result(result)
    # Cleanup empty conversation dicts.
    if not _pending[conversation_id]:
        _pending.pop(conversation_id, None)
    return True


# ── In the existing agent loop, replace the tool-dispatch block: ──────────

async def dispatch_tool_call(tc, *, conversation_id: str, sse_sink):
    """
    Dispatch ONE tool_use block.

    For client-executed tools: emit `tool-input-available`, await a future
    that the `/chat/agent/tool-result` route resolves, then emit
    `tool-output-available`.

    For server-executed tools: call the existing Python implementation.
    """
    if is_client_executed(tc.name):
        # 1. Tell the client to execute this tool.
        await sse_sink({
            "type": "tool-input-available",
            "toolCallId": tc.id,
            "toolName": tc.name,
            "input": tc.args,
        })
        # 2. Wait for the matching POST /chat/agent/tool-result.
        fut = register_pending(conversation_id, tc.id)
        try:
            result = await asyncio.wait_for(fut, timeout=300)
            error = result.get("error") if isinstance(result, dict) else None
            if error:
                tool_result_payload = {"error": error}
            else:
                tool_result_payload = result
        except asyncio.TimeoutError:
            # Pop the future so it doesn't leak.
            _pending.get(conversation_id, {}).pop(tc.id, None)
            tool_result_payload = {"error": f"client did not return result for {tc.name} within 300s"}
        # 3. Tell the model what happened.
        await sse_sink({
            "type": "tool-output-available",
            "toolCallId": tc.id,
            "output": tool_result_payload,
        })
        return tool_result_payload

    # Existing server-side path:
    return await run_server_tool(tc.name, tc.args)
```

> **Why `tool-input-available`** and not `tool-call`? Because the AI SDK v5
> stream protocol (which the frontend's `useChat` understands) emits
> `tool-input-available` once the tool input is fully formed. The renderer's
> SSE interceptor in `src/lib/desktop/install.ts` matches on either name, but
> `tool-input-available` is canonical.

---

## Step 4 — Add the resume endpoint

In your existing FastAPI app:

```python
from fastapi import APIRouter, Response, Request, HTTPException
from pydantic import BaseModel
from typing import Any
from app.agents.desktop_tools import resolve_pending  # if you put it there
# (or wherever resolve_pending() lives)

router = APIRouter()


class ToolResultRequest(BaseModel):
    conversation_id: str | None = None
    tool_call_id: str
    tool_name: str | None = None
    result: Any = None
    error: str | None = None


@router.post("/chat/agent/tool-result")
async def chat_agent_tool_result(req: ToolResultRequest):
    """
    Resolve the pending future for a client-executed tool call.

    Called by the Electron renderer in `src/lib/desktop/install.ts` after
    `runTool()` finishes.
    """
    ok = resolve_pending(
        req.conversation_id or "",
        req.tool_call_id,
        req.result,
        req.error,
    )
    if not ok:
        # Either the conversation_id was wrong or the call already timed out.
        raise HTTPException(status_code=410, detail="unknown or expired tool_call_id")
    return Response(status_code=204)
```

Register the router wherever you mount your other `/chat` endpoints:

```python
app.include_router(router)
```

---

## Step 5 — Verify

After deploying, do these in order:

### 5a — Tool schemas reach the model

In the Railway logs you should see something like:

```
[chat_agent] tools registered: ['web_search', 'generate_word', ...,
  'fs_read_file', 'fs_write_file', 'computer_screenshot', 'computer_key',
  'cu_open_target', 'cu_screenshot', 'browser_navigate', 'browser_download',
  ...]
```

If `cu_*` / `computer_*` / `fs_*` aren't in that list, the capability gating
isn't firing — confirm `req.client.capabilities` is the list `["fs","shell","computer","yang_cu","yang_workflow"]`.

### 5b — `tool-input-available` reaches the renderer

In the Electron app, open DevTools (Ctrl+Shift+I) → Network → find the
`/api/chat` request → Response tab. You should see SSE lines like:

```
data: {"type":"tool-input-available","toolCallId":"toolu_…","toolName":"cu_open_target","input":{"kind":"browser","url":"https://example.com"}}
```

### 5c — `POST /chat/agent/tool-result` fires

In the same Network tab you should see a follow-up POST to
`/api/chat/tool-result` returning **204**. Console should log:

```
[desktop] tool-result posted { toolName: "cu_open_target", ok: true, durationMs: 412 }
```

### 5d — `tool-output-available` resumes the agent

Back in the `/api/chat` SSE stream:

```
data: {"type":"tool-output-available","toolCallId":"toolu_…","output":{"id":"browser:1","kind":"browser","title":"Example Domain","url":"https://example.com/"}}
```

Then the next model turn happens with the tool result in context, and the
agent continues.

---

## Common failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Model says "I don't have access to cu_* tools" | Capability gating not splicing schemas | Step 2 |
| `client did not return result for X within 300s` | Either Step 3 isn't routing client tools through the future, or `/chat/agent/tool-result` doesn't exist | Steps 3 + 4 |
| `POST /chat/agent/tool-result` returns **404** | Router not mounted | Add `app.include_router(router)` |
| `POST /chat/agent/tool-result` returns **410** | Future already timed out (5 min). Increase timeout or speed up the client tool. | Bump `asyncio.wait_for(..., timeout=300)` to `600` |
| `POST /chat/agent/tool-result` returns **401** | Renderer's auth header missing | Already fixed frontend-side (see `docs/COMPUTER_USE_TIMEOUT_DIAGNOSIS.md`). Make sure your auth middleware accepts the `Authorization: Bearer <token>` header from this route. |
| Frontend Console shows `[desktop] ignoring non-desktop tool call <X>` | Backend emitting a tool name the renderer doesn't know about | Add it to `DESKTOP_TOOL_NAMES` in `src/lib/desktop/bridge.ts`. |

---

## Why this design (not "just run the tool on the server")

- **fs_*, shell_*, computer_*** all need access to the **user's local machine**, which the Railway container can't reach.
- The "agent in the cloud, tools on the desktop" pattern keeps the model API key + agent loop server-side (cheap to scale, no key leakage) while letting tools touch the local OS (the only place they make sense).
- It's the same pattern Anthropic uses for MCP and Claude Desktop.

---

## What if I want to avoid the 300s timeout entirely?

Two options:

1. **Make the client tools faster.** Most are <1s. The exceptions are
   `cu_screenshot` of a slow page or `terminal_run` of a long command. Pass
   an explicit `timeoutMs` arg on the client side and let it short-circuit.
2. **Bump the wait_for timeout to e.g. `1800`** (30 min). Use this for
   `terminal_run`, `shell_run`, and any tool the user might consent-prompt
   on. The future cleanup will still happen on disconnect, so memory stays
   bounded.

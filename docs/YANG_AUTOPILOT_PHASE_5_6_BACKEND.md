# YANG Autopilot — Phase 5 (Workflow) & 6 (MCP) Backend Recipe

Frontend ships with:
- **Terminals** (`/yang/terminals`) — xterm.js multi-tab, real `node-pty` PTYs
- **GitHub** (`/yang/github`) — PR list, diff view, comment / approve / request-changes via `gh` CLI
- **SSH** (`/yang/ssh`) — encrypted profile manager + `ssh_exec` via `ssh2`
- **MCP** (`/yang/mcp`) — `@modelcontextprotocol/sdk` host with stdio + HTTP transports; tools auto-discovered as `mcp_<server>_<tool>`

All of these are **client-executed** through the existing desktop tool pipeline. The backend just needs to declare the schemas so the AI can call them.

---

## 1. Capability flags

```python
ALLOWED_CAPS |= {"yang_workflow", "yang_mcp"}
```

Client advertises `yang_workflow` when the user has terminals/SSH/GitHub enabled (default: on if `shell` cap is on). It advertises `yang_mcp` plus a `mcp_tools` array listing the qualified names of any connected MCP servers.

The client envelope now looks like:

```json
{
  "kind": "desktop",
  "version": "0.1.0",
  "capabilities": ["fs", "shell", "computer", "yang_cu", "yang_workflow", "yang_mcp"],
  "mcp_tools": [
    { "name": "mcp_filesystem_read_file",   "schema": {...}, "description": "..." },
    { "name": "mcp_github_search_repos",    "schema": {...}, "description": "..." }
  ]
}
```

Add a `mcp_tools` field to `ClientEnvelope`:

```python
class McpToolAdvert(BaseModel):
    name: str
    schema: dict
    description: Optional[str] = None

class ClientEnvelope(BaseModel):
    kind: Literal["desktop", "web"] = "web"
    version: Optional[str] = None
    capabilities: list[str] = []
    platform: Optional[str] = None
    mcp_tools: list[McpToolAdvert] = []
```

> **Client TODO:** the renderer must POST its MCP tool inventory to `/api/yang/mcp/register` (or include it in every `/api/chat` body — simpler for v1). We'll do the simpler route below.

---

## 2. Workflow tool schemas

```python
# app/agents/yang_workflow_tools.py
from pydantic import BaseModel
from typing import Literal, Optional

# Terminal
class TerminalRun(BaseModel):
    command: str
    cwd: Optional[str] = None
    timeoutMs: Optional[int] = 60_000
    env: Optional[dict[str, str]] = None

# GitHub
class GhListPrs(BaseModel):
    repo: str
    state: Optional[Literal["open", "closed", "merged", "all"]] = "open"

class GhPrDiff(BaseModel):
    repo: str
    pr: int

class GhPrComment(BaseModel):
    repo: str
    pr: int
    body: str

class GhPrReview(BaseModel):
    repo: str
    pr: int
    event: Literal["approve", "request_changes", "comment"]
    body: Optional[str] = None

class GhClone(BaseModel):
    repo: str
    dest: Optional[str] = None

# SSH
class SshConnect(BaseModel):
    profileId: Optional[str] = None        # use a saved profile
    host: Optional[str] = None
    port: Optional[int] = 22
    user: Optional[str] = None
    privateKeyPath: Optional[str] = None
    password: Optional[str] = None

class SshExec(BaseModel):
    connectionId: str
    command: str

class SshDisconnect(BaseModel):
    connectionId: str


YANG_WORKFLOW_TOOL_NAMES = {
    "terminal_run",
    "github_list_prs", "github_pr_diff", "github_pr_comment", "github_pr_review", "github_clone", "github_status",
    "ssh_connect", "ssh_exec", "ssh_disconnect",
}

def yang_workflow_tools_for(caps: list[str]) -> dict[str, dict]:
    if "yang_workflow" not in caps:
        return {}
    return {
        "terminal_run":     {"description": "Run a shell command in a fresh PTY and return its stdout (60s default timeout). Use for one-shot commands; multi-step interactive sessions belong in the user's terminal panel.", "schema": TerminalRun.model_json_schema()},
        "github_list_prs":  {"description": "List PRs for owner/repo.",              "schema": GhListPrs.model_json_schema()},
        "github_pr_diff":   {"description": "Get the unified diff of a PR.",         "schema": GhPrDiff.model_json_schema()},
        "github_pr_comment":{"description": "Leave an issue-level comment on a PR.", "schema": GhPrComment.model_json_schema()},
        "github_pr_review": {"description": "Submit a review (approve / request_changes / comment).", "schema": GhPrReview.model_json_schema()},
        "github_clone":     {"description": "Clone a repo to the local workspace.",  "schema": GhClone.model_json_schema()},
        "github_status":    {"description": "Check `gh auth status`.",               "schema": {}},
        "ssh_connect":      {"description": "Open an SSH session. Use profileId for a stored profile or pass host/user/key inline.", "schema": SshConnect.model_json_schema()},
        "ssh_exec":         {"description": "Run a command over an open SSH connection.", "schema": SshExec.model_json_schema()},
        "ssh_disconnect":   {"description": "Close an SSH connection.",              "schema": SshDisconnect.model_json_schema()},
    }
```

Add `YANG_WORKFLOW_TOOL_NAMES` to your existing `CLIENT_EXECUTED_TOOL_NAMES` set — the pause/resume flow handles them identically to fs/shell/cu tools.

---

## 3. MCP integration

The renderer connects to MCP servers locally. On every `/api/chat` POST the body now includes `client.mcp_tools[]` listing all currently-connected MCP servers' tools. The backend merges them into the model's tool list dynamically:

```python
def merge_mcp_tools(client: ClientEnvelope, tools: dict[str, dict]) -> dict[str, dict]:
    if "yang_mcp" not in client.capabilities:
        return tools
    for t in client.mcp_tools or []:
        # Use the client-supplied schema/description verbatim; the model never
        # sees that it's an MCP tool, it just sees `mcp_<server>_<tool>` with
        # its declared input schema.
        tools[t.name] = {
            "description": t.description or f"MCP tool: {t.name}",
            "schema": t.schema,
        }
    return tools
```

When the model calls `mcp_<server>_<tool>`, your agent loop routes it to `CLIENT_EXECUTED_TOOL_NAMES` (any name starting with `mcp_` qualifies). The client receives the tool-call SSE event, looks up the server by parsing `mcp_<serverId>_…`, calls `client.callTool({ name: '<tool>', arguments: args })` against the right MCP server, and POSTs the result back like any other tool.

```python
def is_client_executed(tool_name: str) -> bool:
    return (
        tool_name in CLIENT_EXECUTED_TOOL_NAMES
        or tool_name in YANG_CU_TOOL_NAMES
        or tool_name in YANG_WORKFLOW_TOOL_NAMES
        or tool_name.startswith("mcp_")
    )
```

---

## 4. System-prompt block

When desktop capabilities include `yang_workflow` and/or `yang_mcp`, append:

```
YANG AUTOPILOT — workflow tools

- terminal_run lets you run a shell command in a fresh PTY and read its
  output. Prefer this over shell_run when the command is interactive
  (e.g. starts a REPL, asks confirmation), since it uses a real terminal.

- GitHub:
    1) github_list_prs(repo) to discover open PRs.
    2) github_pr_diff to read the change.
    3) For inline feedback, github_pr_comment writes an issue-level comment.
       For approving/blocking, github_pr_review with event in
       {approve, request_changes, comment}.

- SSH: open a connection first with ssh_connect (use profileId if the
  user has saved one), then ssh_exec each command. Always ssh_disconnect
  when done. NEVER store SSH credentials in chat history or memories.

YANG AUTOPILOT — MCP servers

You also have access to user-installed MCP server tools, named like
mcp_<server>_<tool>. Their behavior is documented in each tool's
description. Treat them as first-class — call them just like built-in
tools.
```

---

## 5. End-to-end test cases

| Try | What should happen |
|---|---|
| "Run `git status` in `~/PotomacWorkspace`" | Backend emits `terminal_run` → client returns stdout → assistant summarizes |
| "Review the latest PR in owner/repo" | `github_list_prs` → `github_pr_diff` → assistant writes summary → optionally `github_pr_comment` |
| "Connect to my prod server (profile 'prod') and check disk" | `ssh_connect({profileId:'prod'})` → `ssh_exec('df -h')` → `ssh_disconnect` |
| With `@modelcontextprotocol/server-filesystem` registered | The model sees `mcp_filesystem_read_file`, `mcp_filesystem_write_file`, etc. as if native |

---

## 6. Minimal frontend addition required for MCP (optional v1)

Currently the renderer connects to MCP servers but does **not** automatically push the discovered tool list into `/api/chat` requests. To enable that, add to `src/lib/desktop/install.ts` (inside `injectClientEnvelope`):

```ts
// In addition to capabilities + platform, attach mcp_tools.
if (window.potomacTools?.mcp_list_running) {
  const running = await window.potomacTools.mcp_list_running();
  if (Array.isArray(running)) {
    parsed.client = { ...(parsed.client || {}), mcp_tools: running.flatMap((r) => r.tools.map((name: string) => ({ name }))) };
  }
}
```

Until then, the AI sees the MCP-managed servers but won't auto-discover their tools. The Settings page (`/yang/mcp`) lets you see what's registered; manual injection into prompts works fine for testing.

---

## 7. Wrap-up

Combined with the previous recipes (`DESKTOP_AGENT_BACKEND_RECIPE.md`, `YANG_AUTOPILOT_PHASE_1_2_BACKEND.md`, `YANG_AUTOPILOT_PHASE_3_4_BACKEND.md`), the backend now has:

- Filesystem / shell / computer-use tools (Phase 0)
- Background browser + Windows native via UIA + Virtual Desktop (Phase 1+2)
- Autonomous goals with plan→step→critique loop + persistent SSE (Phase 3)
- Per-user pgvector memory + APScheduler cron jobs (Phase 4)
- Terminals + GitHub + SSH client-executed tools (Phase 5)
- MCP server tool injection (Phase 6)

All of it routes through the same pause/resume `/chat/agent/tool-result` endpoint — there is no new transport protocol. Adding new tool families in the future is a matter of:

1. Declaring schemas in a new Pydantic module.
2. Adding names to `CLIENT_EXECUTED_TOOL_NAMES`.
3. Implementing the client-side handler (IPC + bridge `runTool` switch).

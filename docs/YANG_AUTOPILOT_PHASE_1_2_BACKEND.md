# YANG Autopilot — Phase 1 & 2 Backend Recipe

The Electron client now ships with **Background Computer Use**: Playwright browser, Windows UI Automation (no-cursor-movement), and Virtual Desktop adapter. To enable the AI to use them, declare the schemas below in your FastAPI tool registry. **Execution stays on the client** — same pause/resume pattern you already implemented for the original desktop agent (`/chat/agent/tool-result`).

---

## 1. New tool capability flag

Extend the existing `ClientEnvelope.capabilities` to recognize `"yang_cu"`:

```python
# (no model changes — capabilities is already `list[str]`)
ALLOWED_CAPS = {"fs", "shell", "computer", "yang_cu"}
```

The frontend will advertise `"yang_cu"` automatically once the user enables the "Background Computer Use" toggle in Settings (which we'll add in a follow-up; for now you can hand-edit `userData/settings.json` to test).

---

## 2. Tool schemas (server-declared, client-executed)

Add this module:

```python
# app/agents/yang_cu_tools.py
from pydantic import BaseModel
from typing import Literal, Optional

# ── Generic target lifecycle ────────────────────────────────────────────────
class CuOpenTarget(BaseModel):
    """Open a new control surface for the AI."""
    kind: Literal["browser", "native", "virtual-desktop"]
    url: Optional[str] = None         # required when kind == 'browser'
    app: Optional[str] = None         # path or name when kind in ('native','virtual-desktop')
    args: Optional[list[str]] = None
    windowTitle: Optional[str] = None # attach to existing window by title (native/vd)

class TargetId(BaseModel):
    targetId: str

# ── Input/output ────────────────────────────────────────────────────────────
class CuXY(BaseModel):
    targetId: str
    x: int
    y: int
    button: Optional[Literal["left", "right", "middle"]] = "left"

class CuType(BaseModel):
    targetId: str
    text: str
    delayMs: Optional[int] = None

class CuKey(BaseModel):
    targetId: str
    combo: str

class CuScroll(BaseModel):
    targetId: str
    x: int
    y: int
    dx: int
    dy: int

# ── Browser-only convenience ────────────────────────────────────────────────
class BrowserNavigate(BaseModel):
    targetId: str
    url: str

class BrowserEval(BaseModel):
    targetId: str
    script: str

class BrowserPinNote(BaseModel):
    targetId: str
    x: int
    y: int
    text: str


YANG_CU_TOOL_NAMES = {
    "cu_open_target", "cu_close", "cu_list_targets", "cu_screenshot", "cu_get_content",
    "cu_click", "cu_double_click", "cu_type", "cu_key", "cu_scroll", "cu_size",
    "browser_navigate", "browser_eval", "browser_pin_note", "browser_get_pins",
}


def yang_cu_tools_for(caps: list[str]) -> dict[str, dict]:
    """
    Build the {name: {description, schema}} map. The agent loop must intercept
    these tool names and route them to the client (same pattern as fs_*/shell_*/
    computer_* tools added in DESKTOP_AGENT_BACKEND_RECIPE.md).
    """
    if "yang_cu" not in caps:
        return {}
    return {
        "cu_open_target": {
            "description": (
                "Open a new control surface. kind='browser' for a parallel "
                "headless Chromium tab (use this for web pages). kind='native' "
                "for a Windows native app via UI Automation (does NOT move the "
                "user's cursor). kind='virtual-desktop' to run a native app on "
                "a secondary virtual desktop so the user's primary desktop is "
                "untouched. Returns { id, title, kind, ... }."
            ),
            "schema": CuOpenTarget.model_json_schema(),
        },
        "cu_close":        {"description": "Close a target by id.",          "schema": TargetId.model_json_schema()},
        "cu_list_targets": {"description": "List all open targets.",         "schema": {}},
        "cu_screenshot":   {"description": "PNG (base64) of the target. Call this BEFORE clicking/typing to ground coordinates.", "schema": TargetId.model_json_schema()},
        "cu_get_content":  {"description": "Logical content of the target (DOM/a11y tree for browser, UIA tree for native).",      "schema": TargetId.model_json_schema()},
        "cu_click":        {"description": "Click at (x,y) inside the target. No real cursor is moved for native/vd targets.",     "schema": CuXY.model_json_schema()},
        "cu_double_click": {"description": "Double-click at (x,y).",         "schema": CuXY.model_json_schema()},
        "cu_type":         {"description": "Type text into the focused field.", "schema": CuType.model_json_schema()},
        "cu_key":          {"description": "Press a key combo like 'Ctrl+S' or 'Enter'.", "schema": CuKey.model_json_schema()},
        "cu_scroll":       {"description": "Scroll inside the target by (dx,dy) at (x,y).", "schema": CuScroll.model_json_schema()},
        "cu_size":         {"description": "Get target dimensions.",        "schema": TargetId.model_json_schema()},

        "browser_navigate":  {"description": "Navigate a browser target to a URL.",                "schema": BrowserNavigate.model_json_schema()},
        "browser_eval":      {"description": "Run JavaScript in the browser target and return its result.", "schema": BrowserEval.model_json_schema()},
        "browser_pin_note":  {"description": "Drop a user-comment pin (the AI uses this to surface 'fix this here' feedback the human added).", "schema": BrowserPinNote.model_json_schema()},
        "browser_get_pins":  {"description": "Read any pinned user notes attached to a browser target.", "schema": TargetId.model_json_schema()},
    }
```

---

## 3. Agent loop change (one-liner)

Extend the existing desktop-tool intercept to also catch the new names:

```python
from app.agents.yang_cu_tools import YANG_CU_TOOL_NAMES

CLIENT_EXECUTED_TOOL_NAMES = (
    DESKTOP_TOOL_NAMES               # from previous recipe
    | YANG_CU_TOOL_NAMES
)
```

No other code changes needed — the pause/resume/`tool-result` flow is identical.

---

## 4. System-prompt block (when `"yang_cu" in caps`)

Append:

```
YANG AUTOPILOT — Background Computer Use

You have three parallel control surfaces. Open targets with cu_open_target:
  - kind='browser'           — parallel headless Chromium (Playwright). Use for
                                web pages, app testing, dev-server preview.
  - kind='native'            — Windows app via UI Automation (does NOT move
                                the user's real cursor or steal focus).
  - kind='virtual-desktop'   — Windows app placed on a secondary virtual
                                desktop, fully isolated from the user.

Workflow:
  1. cu_open_target → keep the returned `id`.
  2. cu_screenshot(id) — ALWAYS look before you touch.
  3. cu_click / cu_type / cu_key / cu_scroll with coordinates relative to the
     screenshot you just took.
  4. cu_get_content for richer grounding (a11y tree or DOM).
  5. cu_close(id) when done.

Notes:
  - When the user has dropped pin-comments on a browser target, browser_get_pins
    returns them — act on those as priority feedback.
  - You can have multiple targets open simultaneously.
  - For long-running tasks the user can press Ctrl+Shift+Esc to kill everything.
```

---

## 5. Surface dependency for the user

To use Background Computer Use, **Playwright browsers must be installed** on the user's machine. The Electron app bundles the `playwright` npm package, but the Chromium binary is downloaded lazily. We can either:

- Run `npx playwright install chromium` as a one-time setup step in the renderer (recommended; we'll add a button in Settings → "Install background browser"), or
- Bundle Chromium into the installer (~150 MB increase — heavy)

For Phase 1 we'll surface the missing-binary error from `cu_open_target` and prompt the user to click "Install" in the Settings UI (TODO follow-up — for now they can run the command manually).

---

## 6. End-to-end test

After deploying:

```
User: "/yang Use a background browser to open example.com, take a screenshot, and tell me what's on the page."
```

Expected:
1. Backend emits `tool-input-available` `cu_open_target` `{kind:"browser", url:"https://example.com"}`
2. Client opens a Playwright tab, returns `{id:"browser:1", ...}`
3. Backend emits `cu_screenshot` `{targetId:"browser:1"}`
4. Client returns the PNG
5. Backend emits `cu_get_content` to read the a11y tree
6. Model writes a response describing the page; emits `cu_close`

If you see the model calling `computer_screenshot` (the old global-screen tool) instead of `cu_screenshot`, the system prompt isn't injecting the YANG block — double-check `caps`.

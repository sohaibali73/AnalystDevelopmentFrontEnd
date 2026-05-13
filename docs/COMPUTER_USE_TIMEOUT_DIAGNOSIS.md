# Diagnosis: `client did not return result for computer_key within 300s`

This document explains the **two-sided bug** you saw in the audit log and what
has now been fixed on each side.

## What the error log was telling you

```
8:27:47 AM  ▶ tool-call  computer_key { combo: "Win+R" }
8:32:48 AM  ✗ tool-result  "client did not return result for computer_key within 300s"
```

Five minutes (300 seconds) elapsed between the tool-call and the timeout. That
means the backend asked the desktop client to run a tool, **the desktop client
never reported back**, and the backend gave up.

Whenever Anthropic gets a `tool_use` block without a matching `tool_result` it
returns:

```
messages.N: `tool_use` ids were found without `tool_result` blocks
immediately after: toolu_…
```

…which is the 400 error you were seeing on top.

## Root causes (3 bugs, 2 sides)

### Frontend Bug #1 — `cu_*` / `computer_*` tools were never recognized as desktop tools  ✅ FIXED

`src/lib/desktop/install.ts` had:

```ts
const ALL_DESKTOP_TOOL_NAMES = new Set<string>([
  ...DESKTOP_TOOL_NAMES.fs,
  ...DESKTOP_TOOL_NAMES.shell,
  ...DESKTOP_TOOL_NAMES.computer,   // <— ONLY the legacy real-cursor family!
  // ...DESKTOP_TOOL_NAMES.yang_cu,         (MISSING)
  // ...DESKTOP_TOOL_NAMES.yang_workflow,   (MISSING)
]);
```

So when the SSE interceptor saw the backend emit a tool-call for
`computer_key`, `cu_open_target`, `cu_screenshot`, `terminal_run`, etc. it
checked the allowlist, saw the name wasn't there, and silently skipped it.

The IPC handler was never invoked. The backend waited 300 seconds. Timeout.

**Fix:** Added `yang_cu` and `yang_workflow` tool-name groups to the allowlist
and added a `console.debug` breadcrumb when an unknown tool is ignored so this
never happens silently again.

### Frontend Bug #2 — Auth header lost when posting tool results  ✅ FIXED

The interceptor used:

```ts
const authHeader = (init?.headers && (init.headers as Record<string, string>)['Authorization']) || '';
```

…which **only works** when `init.headers` is a plain object. But `useChat()`
from `@ai-sdk/react` constructs a `Headers` instance, where you must call
`.get('Authorization')`. The bracket lookup returned `undefined`, so the
result-POST went out with `Authorization: ''` → backend returned 401 → result
never arrived at the agent loop → 300s timeout.

**Fix:** Handle `Headers` instance, `[string,string][]` tuple, and plain object
shapes. Plus fall back to `localStorage.auth_token` so the token is always
included.

### Backend Bug #3 — Cannot be fixed from this repo  ⚠️ STILL OPEN

Even with #1 and #2 fixed, the backend's 300s timeout means **every** stalled
tool will produce this Anthropic 400 error. The proper fix is in
`docs/BACKEND_FIX_CHECKLIST.md`:

1. **Register client-executed tool schemas** when `req.client.capabilities`
   includes the relevant capability.
2. **Route `is_client_executed(tool_name)` calls** through the pending-future
   pattern: emit `tool-input-available`, `await pending.register(...)`, resume
   the agent loop.
3. **Implement `POST /chat/agent/tool-result`** that resolves the matching
   future.

With #1 frontend-side, the result will arrive in milliseconds and #3 will no
longer time out.

## Verifying the fix

After installing the new EXE (`electron\out2\Potomac Analyst Workbench Setup 0.1.0.exe`):

1. Open DevTools in the desktop app (Ctrl+Shift+I).
2. Send the same goal.
3. In the Console you should now see:
   ```
   [desktop] tool-result posted { toolName: "computer_key", toolCallId: "…", ok: true, durationMs: 42 }
   ```
4. If you instead see `[desktop] ignoring non-desktop tool call <name>`, the
   backend is emitting a tool name we don't ship a handler for — add it to
   `DESKTOP_TOOL_NAMES` in `src/lib/desktop/bridge.ts`.
5. If you see neither, the backend isn't emitting `tool-call` / `tool-input-available`
   SSE events at all — that's a backend-only issue.

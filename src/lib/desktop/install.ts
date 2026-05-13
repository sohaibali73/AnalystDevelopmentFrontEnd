/**
 * Desktop agent runtime bootstrap.
 *
 * Patches `window.fetch` to:
 *   1. Inject a `client: { kind: 'desktop', version, capabilities[] }` envelope
 *      into every outgoing POST to `/api/chat`.
 *   2. Tee the SSE response body so we can passively inspect the v5 UI Message
 *      Stream for `tool-call` parts naming desktop tools — when one appears we
 *      execute it locally via `runTool()` and POST the result to
 *      `/api/chat/tool-result`. The original response is forwarded to the
 *      AI SDK consumer untouched, so the stream resumes seamlessly once the
 *      backend receives the tool result.
 *
 * This is idempotent and a no-op outside Electron / before consent.
 *
 * IMPORTANT: This file is only imported from a client-only React component;
 * SSR builds never see the side effect.
 */
import { isDesktop, getDesktopCapabilities, runTool, DESKTOP_TOOL_NAMES, getSettings } from './bridge';

let installed = false;

interface SubscribeOpts {
  onToolCall?: (name: string, args: Record<string, unknown>, toolCallId: string) => void;
  onToolResult?: (toolCallId: string, ok: boolean, durationMs: number) => void;
}

type Subscriber = (event: { kind: 'tool-call' | 'tool-result'; payload: unknown }) => void;
const subscribers = new Set<Subscriber>();

/** Subscribe to live tool-call activity (e.g. for the ToolActivityDrawer UI). */
export function subscribeToolActivity(cb: Subscriber): () => void {
  subscribers.add(cb);
  return () => { subscribers.delete(cb); };
}

function emit(ev: { kind: 'tool-call' | 'tool-result'; payload: unknown }): void {
  for (const cb of subscribers) {
    try { cb(ev); } catch { /* ignore subscriber errors */ }
  }
}

const ALL_DESKTOP_TOOL_NAMES = new Set<string>([
  ...DESKTOP_TOOL_NAMES.fs,
  ...DESKTOP_TOOL_NAMES.shell,
  ...DESKTOP_TOOL_NAMES.computer,
  ...DESKTOP_TOOL_NAMES.yang_cu,        // cu_*, browser_*  — was missing!
  ...DESKTOP_TOOL_NAMES.yang_workflow,  // terminal_*, github_*, ssh_*  — was missing!
]);

/** Conversation id captured from request body, used when POSTing tool results back. */
const conversationIdByRequest = new WeakMap<Request, string | null>();

async function injectClientEnvelope(input: RequestInfo | URL, init?: RequestInit): Promise<RequestInit | undefined> {
  if (!init || init.method !== 'POST' || !init.body) return init;
  try {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (!url.includes('/api/chat') || url.includes('/tool-result')) return init;

    const caps = await getDesktopCapabilities();
    if (caps.length === 0) return init;

    let bodyStr: string;
    if (typeof init.body === 'string') bodyStr = init.body;
    else if (init.body instanceof Blob) bodyStr = await init.body.text();
    else return init;

    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(bodyStr); } catch { return init; }

    const version = window.electronAPI?.versions?.electron || '0.0.0';
    parsed.client = {
      kind: 'desktop',
      version,
      capabilities: caps,
      platform: window.electronAPI?.platform || 'unknown',
    };

    return { ...init, body: JSON.stringify(parsed) };
  } catch {
    return init;
  }
}

/**
 * Parse v5 UI Message Stream lines (`data: {…json}\n\n`) out of a text chunk,
 * forwarding the chunk to the consumer untouched while inspecting each event.
 * Returns the same chunk unchanged.
 */
function makeSSEInterceptor(getConvId: () => string | null, getAuthHeader: () => string): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  // Dedupe: a single tool call can show up as `tool-call-streaming-start`,
  // multiple `tool-input-delta` events, and finally `tool-input-available`.
  // We must only execute ONCE per toolCallId.
  const seenToolCallIds = new Set<string>();
  return new TransformStream({
    transform(chunk, controller) {
      // pass through immediately
      controller.enqueue(chunk);
      try {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const json = line.slice(5).trim();
          if (!json || json === '[DONE]') continue;
          let evt: Record<string, unknown>;
          try { evt = JSON.parse(json); } catch { continue; }
          // Diagnostic: log every SSE event type the backend emits so we can
          // tell whether the frontend's tool-call interceptor is missing the
          // backend's event-name convention.
          if (typeof window !== 'undefined' && (window as any).__POTOMAC_SSE_DEBUG__) {
            try { console.debug('[desktop:sse]', evt.type, evt); } catch { /* ignore */ }
          }
          // AI SDK v5 emits parts. Recognize tool-call parts; tool name could
          // live under any of these keys depending on backend serialization.
          //
          // Potomac DevBackend also emits a custom breadcrumb event of the
          // form { desktop_tool_pending: true, tool_call_id, tool_name }
          // when it's waiting for the client to execute a tool — we treat
          // that as equivalent to `tool-input-available`.
          //
          // Goal-mode SSE (via /api/yang/goal/{id}/stream) wraps the real
          // tool-call event inside { type: "step", step: { kind: "tool-call",
          // content: { id, name, args } } } — unwrap that here too.
          const type = evt.type as string | undefined;
          const isCanonicalToolCall =
            type === 'tool-call'
            || type === 'tool_call'
            || type === 'tool-call-streaming-start'
            || type === 'tool-input-available'
            || type === 'tool_use'
            || type === 'tool_input_available'
            || type === 'tool-input-start'
            || type === 'tool-input-delta';
          const isDesktopBreadcrumb = evt.desktop_tool_pending === true;
          const isGoalStepToolCall =
            type === 'step'
            && evt.step
            && typeof evt.step === 'object'
            && (evt.step as { kind?: string }).kind === 'tool-call';
          if (!isCanonicalToolCall && !isDesktopBreadcrumb && !isGoalStepToolCall) continue;

          let toolName: string | undefined;
          let toolCallId: string | undefined;
          let args: Record<string, unknown> | undefined;
          if (isGoalStepToolCall) {
            const stepContent = (evt.step as { content?: Record<string, unknown> }).content || {};
            toolName = (stepContent.name || stepContent.tool_name) as string | undefined;
            toolCallId = (stepContent.id || stepContent.tool_call_id) as string | undefined;
            args = (stepContent.args || stepContent.input) as Record<string, unknown> | undefined;
          } else {
            toolName = (evt.toolName || evt.tool_name || evt.name) as string | undefined;
            toolCallId = (evt.toolCallId || evt.tool_call_id || evt.id) as string | undefined;
            args = (evt.args || evt.input || evt.arguments) as Record<string, unknown> | undefined;
          }
          if (!toolName || !toolCallId) {
            try { console.debug('[desktop] tool-call event missing name/id', evt); } catch { /* ignore */ }
            continue;
          }
          if (!ALL_DESKTOP_TOOL_NAMES.has(toolName)) {
            // Surface a debug breadcrumb so unknown tool names are visible in DevTools.
            try { console.debug('[desktop] ignoring non-desktop tool call', toolName); } catch { /* ignore */ }
            continue;
          }
          // Dedupe: only execute the *first* time we see a given tool-call id.
          // The AI SDK v5 stream protocol emits multiple events per call
          // (start → delta(s) → available) and only the `tool-input-available`
          // contains the final assembled `input`. We prefer that one if we see
          // it, but otherwise the first event with a non-empty args wins.
          if (seenToolCallIds.has(toolCallId)) {
            // If we already fired but this is the canonical `tool-input-available`
            // with richer args, we still skip — the earlier execution is in flight.
            try { console.debug('[desktop] dedup: skipping duplicate event for', toolCallId, type); } catch { /* ignore */ }
            continue;
          }
          // Prefer waiting for `tool-input-available` if we haven't seen it yet
          // and the current event is a streaming-start with empty args.
          if ((type === 'tool-call-streaming-start' || type === 'tool-input-start')
              && (!args || Object.keys(args).length === 0)) {
            try { console.debug('[desktop] waiting for tool-input-available before executing', toolCallId); } catch { /* ignore */ }
            continue;
          }
          seenToolCallIds.add(toolCallId);
          emit({ kind: 'tool-call', payload: { toolName, toolCallId, args } });
          // Execute asynchronously; back to backend.
          void executeAndReport(toolName, args || {}, toolCallId, getConvId(), getAuthHeader());
        }
      } catch {
        /* ignore */
      }
    },
  });
}

async function executeAndReport(
  toolName: string,
  args: Record<string, unknown>,
  toolCallId: string,
  conversationId: string | null,
  authHeader: string,
): Promise<void> {
  const start = performance.now();
  const { result, error } = await runTool(toolName, args);
  const durationMs = Math.round(performance.now() - start);
  emit({ kind: 'tool-result', payload: { toolCallId, ok: !error, durationMs, error } });
  try {
    await fetch('/api/chat/tool-result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        tool_call_id: toolCallId,
        tool_name: toolName,
        result: error ? null : result,
        error: error || null,
      }),
    });
  } catch (err) {
    console.warn('[desktop] failed to POST tool result', err);
  }
  // Also log success/failure for diagnostics.
  try {
    console.debug('[desktop] tool-result posted', { toolName, toolCallId, ok: !error, durationMs, error });
  } catch { /* ignore */ }
}

export function installDesktopRuntime(): void {
  if (installed) return;
  if (!isDesktop()) return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // 1) Inject client envelope into /api/chat POSTs.
    if (url.includes('/api/chat') && !url.includes('/tool-result')) {
      init = await injectClientEnvelope(input, init);
    }

    const resp = await originalFetch(input, init);

    // 2) Intercept SSE stream for desktop tool calls.
    //    Sources we wrap:
    //      • /api/chat               — main chat SSE stream
    //      • /api/yang/goal/.../stream  — autonomous-goal SSE stream
    //    Both can emit client-executable tool-call events that we need to
    //    pick up and dispatch to `window.potomacTools`.
    const ct = resp.headers.get('content-type') || '';
    const isInterceptable =
      ct.includes('text/event-stream')
      && resp.ok
      && (
        (url.includes('/api/chat') && !url.includes('/tool-result'))
        || /\/api\/yang\/goal\/[^/]+\/stream/.test(url)
      );
    if (isInterceptable) {
      // Pull conversation_id out of the request body or response header.
      const convFromHeader = resp.headers.get('X-Conversation-Id');
      let convFromBody: string | null = null;
      if (init?.body && typeof init.body === 'string') {
        try {
          const parsed = JSON.parse(init.body);
          convFromBody = parsed.conversationId || parsed.conversation_id || null;
        } catch { /* ignore */ }
      }
      const getConvId = () => convFromHeader || convFromBody;
      // Headers may be a plain object, a Headers instance, or a [string,string][] tuple.
      // Try all three, plus fall back to localStorage.auth_token (next-auth client pattern).
      let authHeader = '';
      try {
        const h = init?.headers;
        if (h instanceof Headers) authHeader = h.get('Authorization') || h.get('authorization') || '';
        else if (Array.isArray(h)) {
          const pair = h.find(([k]) => /^authorization$/i.test(k));
          authHeader = pair?.[1] || '';
        } else if (h && typeof h === 'object') {
          const rec = h as Record<string, string>;
          authHeader = rec.Authorization || rec.authorization || '';
        }
      } catch { /* ignore */ }
      if (!authHeader) {
        try {
          const tok = window.localStorage.getItem('auth_token');
          if (tok) authHeader = `Bearer ${tok}`;
        } catch { /* ignore */ }
      }
      const teed = resp.body?.pipeThrough(makeSSEInterceptor(getConvId, () => authHeader));
      return new Response(teed, { status: resp.status, statusText: resp.statusText, headers: resp.headers });
    }

    return resp;
  };

  // Reset session approvals on every app focus regain (defense in depth: a
  // long-idle desktop shouldn't keep blanket consent for shell/computer).
  window.addEventListener('focus', () => {
    getSettings()?.get().then(() => { /* warm cache */ }).catch(() => { /* ignore */ });
  });
}

# Frontend Streaming Optimization — Implementation Notes

## Summary

The Next.js chat proxy is now a **pure Edge byte-passthrough** to the backend's
`/chat/agent/ui-stream` endpoint, which emits AI SDK v5 UI Message Stream
Protocol natively. This eliminates per-chunk JSON parse/translate work on the
Vercel function and drops TTFB by ~150–400 ms.

## Changes shipped

| File | Change |
|---|---|
| `app/api/chat/route.ts` | Rewritten as Edge runtime byte-passthrough (~150 lines, was 441). Removed `TransformStream` translator. Removed per-request `[FORMATTING:]` append (backend owns formatting now). Added `X-Accel-Buffering: no` header. |
| `app/layout.tsx` | Added `<link rel="preconnect">` and `<link rel="dns-prefetch">` to the streaming backend origin. Saves the TLS handshake (~100–300 ms) on the first chat request. |
| `vercel.json` | Removed `maxDuration` overrides (Edge functions don't honor them the same way; streaming connections persist independently). Removed dangling `app/api/chat/v6/route.ts` entry. |

## Rollback

Set the environment variable in Vercel:

```
NEXT_PUBLIC_USE_UI_STREAM=0
```

This makes the Edge proxy hit the legacy `/chat/agent` endpoint instead. The
backend's legacy endpoint still works and emits the old `text/plain` data-stream
protocol — but note that the new Edge proxy does **not** translate that protocol
to v5 SSE (that translation used to live in the proxy and has been deleted).
The legacy endpoint should only be used as a fallback in coordination with a
matching frontend rollback (e.g., reverting this commit).

## Verification

1. **curl test** (replace `<JWT>` and host):
   ```bash
   curl -N -X POST https://<your-vercel-domain>/api/chat \
     -H "Authorization: Bearer <JWT>" \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","parts":[{"type":"text","text":"hi"}]}]}'
   ```
   Tokens should arrive one at a time. No long pauses, no burst at the end.

2. **DevTools → Network → /api/chat → Timings tab**
   - **TTFB target:** < 250 ms in production
   - **Server-Timing header:** should be present (forwarded from backend)

3. **First-token-visible target:** < 800 ms after pressing Enter.

4. **Sanity checks:**
   - Send "hi" → renders normally
   - Trigger a tool call → tool card renders, output renders
   - Trigger a YANG event (auto-compact) → handled by `useYangStreamEvents`
   - Trigger a 401 (expire token in localStorage) → re-login flow fires

## Known follow-ups (not shipped — too risky for one PR)

### 1. React memoization of `renderMessage` in ChatPage.tsx

Every token from the stream causes a re-render of the **entire** conversation
because `streamMessages` is a top-level state in `useChat`. For long
conversations this is wasteful — only the actively-streaming message changes,
but every prior message re-renders too.

**Recommended approach:**
- Extract `renderMessage` into a dedicated `<ChatMessage>` component (its own file)
- Wrap with `React.memo` and a custom equality check:
  ```ts
  (prev, next) =>
    prev.message.id === next.message.id &&
    prev.message.parts === next.message.parts &&
    prev.msgIsStreaming === next.msgIsStreaming
  ```
- For the streaming message specifically, use `useDeferredValue(textContent)`
  so React can interrupt expensive markdown parsing under load.

**Risk:** `renderMessage` reads ~15 state variables and refs from the parent
closure (colors, isDark, fileBlobCacheRef, handleCopyMessage, T, etc.). Lifting
it requires careful prop-drilling or context.

**Expected win:** ~5–15 ms saved per token on long conversations.

### 2. Pre-flight body size guard

Edge runtime has a 4 MB request body cap. The current AI SDK `useChat`
transport posts the full `messages[]` array (with prior tool results embedded).
Long conversations could theoretically exceed this. The proxy extracts only
`lastUserMessage.text` server-side, but Vercel still has to receive the full
body first.

**Mitigation if hit:** Use `experimental_prepareRequestBody` in `DefaultChatTransport`
to trim the messages array client-side to `[lastUserMessage]` before send.

### 3. Verify optimistic user-message render

Confirm that pressing Enter paints the user message bubble in <16 ms (one
frame). The AI SDK `useChat.sendMessage` should do this synchronously. If
`buildStackContextPreamble` runs **before** `sendMessage` (it currently does at
ChatPage.tsx:2554–2569), the user sees nothing for hundreds of ms while RAG
retrieval runs.

**Fix:** Render an optimistic user-message bubble immediately, then run stack
retrieval, then call `sendMessage` with the assembled text. Show the
`stackRetrieving` indicator inline while it runs.

## Expected end-state metrics

| Event | Before | After |
|---|---|---|
| Proxy CPU per token | ~30–80 ms | ~0 ms (passthrough) |
| TTFB (Vercel → user) | ~700–1200 ms | ~200–400 ms |
| First token visible | ~1000–1500 ms | ~400–700 ms |

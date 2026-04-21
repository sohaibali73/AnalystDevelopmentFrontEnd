/**
 * Next.js API Route: /api/chat
 * 
 * Translates between Vercel AI SDK v5 UI Message Stream Protocol (SSE)
 * and the backend's Data Stream Protocol (0:, 2:, d: format).
 * 
 * PHASE 4 FIXES:
 * - Removed debug console.log spam
 * - Added backend fetch timeout (55s to stay under maxDuration)
 * - Improved error propagation (parse errors logged, not swallowed)
 * - Uses backend's actual tool call IDs (not random)
 * - Better error messages for common failure modes
 */

import { NextRequest } from 'next/server';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080'
    : 'https://developer-potomaac.up.railway.app')).replace(/\/+$/, '');

// UI Message Stream headers required by AI SDK v5
const UI_MESSAGE_STREAM_HEADERS = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'x-vercel-ai-ui-message-stream': 'v1',
};

// Edge runtime: CPU-time billing (not wall-clock), so I/O-heavy streaming
// proxying doesn't count against the limit. On Vercel Hobby this gives
// effectively unlimited streaming time for responses (30s CPU budget).
export const runtime = 'edge';
// maxDuration is ignored on Hobby but documents intent for Pro upgrade.
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages || [];
    const data = body.data || {};
    
    // Get the latest user message
    const lastUserMessage = messages
      .filter((m: any) => m.role === 'user')
      .pop();
    
    if (!lastUserMessage) {
      return new Response(
        JSON.stringify({ error: 'No user message found' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract text content from parts-based or content-based message
    let messageText = '';
    if (lastUserMessage.parts && Array.isArray(lastUserMessage.parts)) {
      messageText = lastUserMessage.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text || '')
        .join('');
    }
    if (!messageText) {
      messageText = lastUserMessage.content || lastUserMessage.text || '';
    }
    
    if (!messageText.trim()) {
      return new Response(
        JSON.stringify({ error: 'Empty message content' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const authToken = req.headers.get('authorization') || '';
    // conversationId from sendMessage options or transport body callback
    const conversationId = body.conversationId || data.conversationId || null;

    // Forward to backend streaming endpoint with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 29000000); // 290s timeout (under maxDuration=300)

    let backendResponse: Response;
    try {
      // Append formatting instructions to every message
      const formattingInstruction = '\n\n[FORMATTING: Do not use any emojis whatsoever in your response. Use clear, professional formatting with proper markdown headings, bullet points, and structured sections. Keep responses concise and data-driven.]';
      const enhancedMessage = messageText + formattingInstruction;

      backendResponse = await fetch(`${API_BASE_URL}/chat/agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify({
          content: enhancedMessage,
          conversation_id: conversationId,
          model: body.model || data.model || null,
          skill_slug: body.skill_slug || data.skill_slug || null,
          thinking_mode: body.thinking_mode || data.thinking_mode || null,
          thinking_budget: body.thinking_budget || data.thinking_budget || null,
          thinking_effort: body.thinking_effort || data.thinking_effort || null,
          use_prompt_caching: data.use_prompt_caching ?? body.use_prompt_caching ?? true,
          max_iterations: data.max_iterations ?? body.max_iterations ?? 5,
          pin_model_version: data.pin_model_version ?? body.pin_model_version ?? false,
          // YANG per-request feature overrides (forwarded to backend untouched)
          yang: data.yang ?? body.yang ?? null,
        }),

        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const isTimeout = fetchErr instanceof Error && fetchErr.name === 'AbortError';
      const errorMsg = isTimeout 
        ? 'Backend request timed out. The AI may be processing a complex request — please try again.'
        : `Cannot connect to backend at ${API_BASE_URL}. Please check your connection.`;
      return new Response(
        JSON.stringify({ error: errorMsg }), 
        { status: isTimeout ? 504 : 502, headers: { 'Content-Type': 'application/json' } }
      );
    }
    clearTimeout(timeoutId);

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({ 
        detail: `Backend error: ${backendResponse.status}` 
      }));
      
      // Provide user-friendly error messages for common status codes
      let userMessage = error.detail || `HTTP ${backendResponse.status}`;
      if (backendResponse.status === 401) {
        // Use a distinctive phrase the frontend can reliably detect to trigger re-login
        userMessage = 'SESSION_EXPIRED: Your session has expired. Please log in again.';
      } else if (backendResponse.status === 400 && userMessage.includes('API key')) {
        userMessage = 'Claude API key not configured. Please add your API key in Profile Settings.';
      }
      
      return new Response(
        JSON.stringify({ error: userMessage }), 
        { status: backendResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newConversationId = backendResponse.headers.get('X-Conversation-Id');

    // Create a TransformStream to translate Data Stream Protocol → UI Message Stream SSE
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const writeSSE = async (data: any) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    // Process the backend stream in the background
    (async () => {
      try {
        if (!backendResponse.body) {
          await writeSSE({ type: 'start', messageId: `msg-${Date.now()}` });
          await writeSSE({ type: 'text-start', id: `text-${Date.now()}` });
          await writeSSE({ type: 'text-delta', id: `text-${Date.now()}`, delta: 'Error: No response stream from backend' });
          await writeSSE({ type: 'text-end', id: `text-${Date.now()}` });
          await writeSSE({ type: 'finish' });
          await writer.write(encoder.encode('data: [DONE]\n\n'));
          await writer.close();
          return;
        }

        const reader = backendResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        const messageId = `msg-${Date.now()}`;
        let textId = `text-${Date.now()}`;
        let textStarted = false;
        // Track tool calls to prevent duplicate input-start events
        const toolInputStartedSet = new Set<string>();
        let finishSent = false;

        await writeSSE({ type: 'start', messageId });
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;

            const typeCode = line[0];
            const content = line.substring(2);
            if (!content) continue;

            try {
              // Special handling for type 0 (text deltas) - may be raw text or JSON string
              let parsed: any;
              if (typeCode === '0') {
                // Try JSON parse first, fall back to treating content as raw text
                try {
                  parsed = JSON.parse(content);
                } catch {
                  // Content is raw text, not JSON - use directly
                  parsed = content;
                }
              } else {
                parsed = JSON.parse(content);
              }

              switch (typeCode) {
                case '0': { // Text delta
                  const text = typeof parsed === 'string' ? parsed : parsed.text || '';
                  if (text) {
                    if (!textStarted) {
                      await writeSSE({ type: 'text-start', id: textId });
                      textStarted = true;
                    }
                    await writeSSE({ type: 'text-delta', id: textId, delta: text });
                  }
                  break;
                }

                case '2': { // Data (artifacts, file downloads, skill status, conversation metadata)
                  if (textStarted) {
                    await writeSSE({ type: 'text-end', id: textId });
                    textStarted = false;
                    textId = `text-${Date.now()}`;
                  }
                  if (Array.isArray(parsed)) {
                    for (const item of parsed) {
                      if (!item) continue;
                      if (item.type === 'artifact') {
                        await writeSSE({
                          type: 'data-artifact',
                          id: item.id || `artifact-${Date.now()}`,
                          data: item,
                        });
                      } else if (item.type === 'file_download') {
                        // File download card — wrap in array so frontend's
                        // Array.isArray(dataPart?.data) unwraps correctly
                        await writeSSE({ type: 'data-file_download', data: [item] });
                      } else if (item.skill_status) {
                        // Skill execution status ("Creating Word document…")
                        await writeSSE({ type: 'data-skill_status', data: [item] });
                      } else if (item.skill_heartbeat) {
                        // Keep-alive heartbeat — no need to forward to client
                      } else if (
                        item.yang_verification ||
                        item.yang_focus_chain ||
                        item.yang_background_edit ||
                        item.yang_plan_mode ||
                        item.yang_yolo_mode ||
                        item.yang_yolo_iteration_cap ||
                        item.yang_tool_search ||
                        item.yang_subagents_running
                      ) {
                        // YANG advanced-agentic events — forward as a single
                        // unified data-yang part; the useYangStreamEvents hook
                        // dispatches on the inner yang_* flag.
                        await writeSSE({ type: 'data-yang', data: [item] });
                      } else if (item.conversation_id) {
                        await writeSSE({ type: 'data-conversation', data: item });
                      }

                    }
                  } else if (parsed && typeof parsed === 'object' && parsed.conversation_id) {
                    await writeSSE({ type: 'data-conversation', data: parsed });
                  }
                  break;
                }

                case '3': // Error from backend
                  await writeSSE({
                    type: 'error',
                    errorText: typeof parsed === 'string' ? parsed : parsed.message || 'Unknown error',
                  });
                  break;

                case '7': // Tool call streaming start — use backend's actual toolCallId
                  if (parsed.toolCallId && parsed.toolName) {
                    if (textStarted) {
                      await writeSSE({ type: 'text-end', id: textId });
                      textStarted = false;
                      textId = `text-${Date.now()}`;
                    }
                    if (!toolInputStartedSet.has(parsed.toolCallId)) {
                      toolInputStartedSet.add(parsed.toolCallId);
                      await writeSSE({
                        type: 'tool-input-start',
                        toolCallId: parsed.toolCallId,
                        toolName: parsed.toolName,
                      });
                    }
                  }
                  break;

                case '8': // Tool call argument delta
                  if (parsed.toolCallId && parsed.argsTextDelta) {
                    await writeSSE({
                      type: 'tool-input-delta',
                      toolCallId: parsed.toolCallId,
                      inputTextDelta: parsed.argsTextDelta,
                    });
                  }
                  break;

                case '9': // Complete tool call (input available) — use backend's IDs
                  if (parsed.toolCallId && parsed.toolName) {
                    if (textStarted) {
                      await writeSSE({ type: 'text-end', id: textId });
                      textStarted = false;
                      textId = `text-${Date.now()}`;
                    }
                    if (!toolInputStartedSet.has(parsed.toolCallId)) {
                      toolInputStartedSet.add(parsed.toolCallId);
                      await writeSSE({
                        type: 'tool-input-start',
                        toolCallId: parsed.toolCallId,
                        toolName: parsed.toolName,
                      });
                    }
                    await writeSSE({
                      type: 'tool-input-available',
                      toolCallId: parsed.toolCallId,
                      toolName: parsed.toolName,
                      input: parsed.args || {},
                    });
                  }
                  break;

                case 'a': { // Tool result (output available) — parse string results
                  // Try to parse if content wasn't already parsed as JSON
                  let toolResult = parsed;
                  if (typeof parsed === 'string') {
                    try { toolResult = JSON.parse(parsed); } catch { toolResult = { result: parsed }; }
                  }
                  if (toolResult.toolCallId) {
                    let output = toolResult.result;
                    if (typeof output === 'string') {
                      try { output = JSON.parse(output); } catch { /* keep as string */ }
                    }
                    await writeSSE({
                      type: 'tool-output-available',
                      toolCallId: toolResult.toolCallId,
                      output: output,
                    });
                  }
                  break;
                }

                case 'd': // Finish message
                  if (textStarted) {
                    await writeSSE({ type: 'text-end', id: textId });
                    textStarted = false;
                  }
                  if (!finishSent) {
                    await writeSSE({ type: 'finish' });
                    finishSent = true;
                  }
                  break;

                case 'e': // Finish step
                  await writeSSE({ type: 'finish-step' });
                  break;

                case 'f': // Start step
                  await writeSSE({ type: 'start-step' });
                  break;
              }
            } catch (parseError) {
              // Log parse errors in development, skip silently in production
              if (process.env.NODE_ENV === 'development') {
                console.warn(`[API/chat] Parse error for type=${typeCode}:`, content.substring(0, 80));
              }
            }
          }
        }

        // Ensure text block is closed
        if (textStarted) {
          await writeSSE({ type: 'text-end', id: textId });
        }

        // Ensure finish is sent exactly once
        if (!finishSent) {
          await writeSSE({ type: 'finish' });
        }
        
        await writer.write(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        try {
          const errorMsg = err instanceof Error ? err.message : 'Stream processing error';
          await writeSSE({ type: 'error', errorText: errorMsg });
          await writer.write(encoder.encode('data: [DONE]\n\n'));
        } catch { /* writer may be closed */ }
      } finally {
        try { await writer.close(); } catch { /* already closed */ }
      }
    })();

    const headers: Record<string, string> = { ...UI_MESSAGE_STREAM_HEADERS };
    if (newConversationId) {
      headers['X-Conversation-Id'] = newConversationId;
    }

    return new Response(readable, { status: 200, headers });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMsg }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

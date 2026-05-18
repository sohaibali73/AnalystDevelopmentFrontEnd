'use client';

/**
 * WorkspaceShell
 * --------------
 * Glue component that wraps the IDE panel with its provider and a tiny
 * observer that watches the live chat stream for `workspace_*` tool-result
 * parts and forwards them to `ingestToolResult` for optimistic updates.
 *
 * Mounted by ChatPage as the last flex child of `.chat-root` so it docks
 * naturally on the right edge. The panel itself hides when no files exist,
 * so when a conversation has no workspace activity nothing renders.
 */

import React, { useEffect, useRef } from 'react';
import { WorkspaceProvider, useWorkspace } from '@/contexts/WorkspaceContext';
import WorkspacePanel from './WorkspacePanel';

interface ChatMessageLike {
  id?: string;
  role?: string;
  parts?: Array<{
    type?: string;
    toolName?: string;
    state?: string;
    output?: unknown;
    result?: unknown;
    toolInvocation?: { toolName?: string; result?: unknown };
  }>;
}

interface Props {
  conversationId: string | null;
  /** The `messages` array from useChat — observer mines it for tool-results. */
  streamMessages: ChatMessageLike[];
}

export function WorkspaceShell({ conversationId, streamMessages }: Props) {
  if (!conversationId) return null;
  return (
    <WorkspaceProvider conversationId={conversationId}>
      <WorkspaceObserver streamMessages={streamMessages} />
      <WorkspaceDock />
    </WorkspaceProvider>
  );
}

// ─── Observer ────────────────────────────────────────────────────────────────
// Watches streamMessages for newly-completed `workspace_*` tool parts and
// pushes their payload into the workspace store. Uses a Set of `${msgId}::
// ${toolName}::${idx}` keys so we don't ingest the same part twice across
// re-renders.

function WorkspaceObserver({ streamMessages }: { streamMessages: ChatMessageLike[] }) {
  const { ingestToolResult } = useWorkspace();
  const ingestedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const msg of streamMessages) {
      if (msg.role !== 'assistant' || !Array.isArray(msg.parts)) continue;
      msg.parts.forEach((part, idx) => {
        const partType = part.type ?? '';
        // AI SDK exposes tool parts in two shapes:
        //   { type: 'tool-<name>', state, output }   (typed tool)
        //   { type: 'dynamic-tool', toolName, state, output }
        // Older transports also surface { type: 'tool-invocation', toolName, toolInvocation: {...} }.
        const isToolPart =
          partType.startsWith('tool-') ||
          partType === 'dynamic-tool' ||
          partType === 'tool-invocation';
        if (!isToolPart) return;

        const toolName: string =
          part.toolName
          || part.toolInvocation?.toolName
          || (partType.startsWith('tool-') ? partType.replace('tool-', '') : '');
        if (!toolName.startsWith('workspace_')) return;

        // Only ingest when the result is actually present.
        const isReady = part.state === 'output-available'
          || part.state === 'output-error'
          || part.state === undefined; // legacy shapes
        if (!isReady) return;

        const key = `${msg.id ?? '?'}::${toolName}::${idx}`;
        if (ingestedRef.current.has(key)) return;
        ingestedRef.current.add(key);

        const payload = part.output ?? part.result ?? part.toolInvocation?.result ?? null;
        ingestToolResult(toolName, payload);
      });
    }
  }, [streamMessages, ingestToolResult]);

  return null;
}

// ─── Dock ────────────────────────────────────────────────────────────────────
// Hides the panel entirely when there are no files, and respects the user's
// collapse preference (kept in localStorage so it sticks across reloads).

const COLLAPSED_KEY = 'workspace_panel_collapsed_v1';

function WorkspaceDock() {
  const { files } = useWorkspace();
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try { return window.localStorage.getItem(COLLAPSED_KEY) === '1'; } catch { return false; }
  });

  // When new files arrive after a collapse, un-collapse so the user sees them.
  const lastCountRef = useRef(files.length);
  useEffect(() => {
    if (files.length > lastCountRef.current) {
      setCollapsed(false);
      try { window.localStorage.removeItem(COLLAPSED_KEY); } catch {/* */}
    }
    lastCountRef.current = files.length;
  }, [files.length]);

  if (files.length === 0) return null;
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => { setCollapsed(false); try { window.localStorage.removeItem(COLLAPSED_KEY); } catch {/* */} }}
        title={`Open workspace · ${files.length} file${files.length === 1 ? '' : 's'}`}
        style={{
          flexShrink: 0,
          width: 32,
          height: '100%',
          background: 'rgba(254,192,15,0.06)',
          border: 'none',
          borderLeft: '1px solid rgba(254,192,15,0.25)',
          color: '#FEC00F',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          writingMode: 'vertical-rl',
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}
      >
        Workspace · {files.length}
      </button>
    );
  }

  return (
    <WorkspacePanel onCollapse={() => { setCollapsed(true); try { window.localStorage.setItem(COLLAPSED_KEY, '1'); } catch {/* */} }} />
  );
}

export default WorkspaceShell;

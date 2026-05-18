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
import { Code2 } from 'lucide-react';
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

        // Only ingest when the result is actually present.
        const isReady = part.state === 'output-available'
          || part.state === 'output-error'
          || part.state === undefined; // legacy shapes
        if (!isReady) return;

        const payload = part.output ?? part.result ?? part.toolInvocation?.result ?? null;

        // Two ways a tool result can touch the workspace:
        //  1. Explicit workspace_* tool call from the agent.
        //  2. execute_python auto-mirror — the backend silently saves the
        //     executed source as a workspace file and tags the result with
        //     a `workspace_file` field. Refresh the panel in both cases.
        let touchesWorkspace = toolName.startsWith('workspace_');
        if (!touchesWorkspace && toolName === 'execute_python') {
          const p = (payload ?? {}) as { workspace_file?: unknown };
          touchesWorkspace = !!p && !!p.workspace_file;
        }
        if (!touchesWorkspace) return;

        const key = `${msg.id ?? '?'}::${toolName}::${idx}`;
        if (ingestedRef.current.has(key)) return;
        ingestedRef.current.add(key);

        ingestToolResult(toolName, payload);
      });
    }
  }, [streamMessages, ingestToolResult]);

  return null;
}

// ─── Dock ────────────────────────────────────────────────────────────────────
// Defaults to COLLAPSED. The panel never auto-opens, even when the agent
// writes a new file — instead a small "•" indicator appears on the strip to
// hint that something changed since the user last looked. Clicking the strip
// expands the IDE; the open/closed preference persists in localStorage.
//
// Storage keys:
//   workspace_panel_collapsed_v1 — '1' collapsed (default), '0' open
//   workspace_panel_seen_count_v1 — last file count the user observed open

const COLLAPSED_KEY = 'workspace_panel_collapsed_v1';
const SEEN_COUNT_KEY = 'workspace_panel_seen_count_v1';

function WorkspaceDock() {
  const { files } = useWorkspace();
  // Default: collapsed. Only the explicit '0' value opens it on load.
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      return window.localStorage.getItem(COLLAPSED_KEY) !== '0';
    } catch {
      return true;
    }
  });

  // Track how many files the user has "seen" — used to render a small dot
  // on the collapsed strip when fresh files arrive.
  const [seenCount, setSeenCount] = React.useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const n = parseInt(window.localStorage.getItem(SEEN_COUNT_KEY) || '0', 10);
      return Number.isFinite(n) ? n : 0;
    } catch {
      return 0;
    }
  });

  // When the panel is open, the user is "seeing" the current file count.
  // Persist that so reloading the page doesn't re-flag everything as new.
  useEffect(() => {
    if (!collapsed) {
      setSeenCount(files.length);
      try { window.localStorage.setItem(SEEN_COUNT_KEY, String(files.length)); } catch {/* */}
    }
  }, [collapsed, files.length]);

  const open = React.useCallback(() => {
    setCollapsed(false);
    setSeenCount(files.length);
    try {
      window.localStorage.setItem(COLLAPSED_KEY, '0');
      window.localStorage.setItem(SEEN_COUNT_KEY, String(files.length));
    } catch {/* */}
  }, [files.length]);

  const close = React.useCallback(() => {
    setCollapsed(true);
    try { window.localStorage.setItem(COLLAPSED_KEY, '1'); } catch {/* */}
  }, []);

  if (files.length === 0) return null;

  if (collapsed) {
    const hasNew = files.length > seenCount;
    return <CollapsedStrip count={files.length} hasNew={hasNew} onOpen={open} />;
  }

  return <WorkspacePanel onCollapse={close} />;
}

// ─── Sleek collapsed strip ──────────────────────────────────────────────────
// Visibility model:
//
//   hover === true   → fully visible (the user is reaching for it)
//   hasNew === true  → fully visible (the agent just wrote something — show
//                                     so the user notices without hovering)
//   otherwise        → opacity 0 (no visual weight at all)
//
// The 22 px-wide button is ALWAYS in the layout so the chat content never
// reflows. It just animates its opacity in/out. Pointer events keep working
// at opacity 0, so moving the cursor to the right edge of the chat triggers
// `mouseenter` and reveals the strip.

function CollapsedStrip({
  count, hasNew, onOpen,
}: {
  count: number;
  hasNew: boolean;
  onOpen: () => void;
}) {
  const [hover, setHover] = React.useState(false);
  const visible = hover || hasNew;

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      title={`Open workspace · ${count} file${count === 1 ? '' : 's'}${hasNew ? ' · new activity' : ''}`}
      aria-label={`Open workspace (${count} files)`}
      style={{
        flexShrink: 0,
        width: 22,
        height: '100%',
        // Background only paints when actively hovered, and only at low
        // opacity. When invisible we don't render any chrome at all.
        background: hover ? 'rgba(255,255,255,0.045)' : 'transparent',
        border: 'none',
        borderLeft: visible ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
        color: hover ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '14px 0',
        opacity: visible ? 1 : 0,
        transition: 'opacity .2s ease, background .14s ease, color .14s ease, border-color .14s ease',
        position: 'relative',
        // Outline only when keyboard-focused; the focus ring uses opacity 1.
        outline: 'none',
      }}
    >
      <span style={{ position: 'relative', display: 'inline-flex' }}>
        <Code2 size={13} />
        {hasNew && (
          <span
            aria-hidden
            className="workspace-strip-dot"
            style={{
              position: 'absolute',
              top: -3,
              right: -4,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#FEC00F',
              boxShadow: '0 0 6px rgba(254,192,15,0.7)',
            }}
          />
        )}
      </span>
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: '0.02em',
          color: 'inherit',
        }}
      >
        {count}
      </span>
      <style>{`
        @keyframes ws-strip-dot-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.4); opacity: 0.6; }
        }
        .workspace-strip-dot { animation: ws-strip-dot-pulse 1.8s ease-in-out infinite; }
      `}</style>
    </button>
  );
}

export default WorkspaceShell;

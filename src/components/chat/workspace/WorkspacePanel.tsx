'use client';

/**
 * WorkspacePanel
 * --------------
 * Right-side IDE dock for the chat. Renders when the active conversation
 * has any workspace files. Layout (top → bottom):
 *
 *   ┌─ File tabs (one per file, x to close, ⋯ menu to delete) ──────┐
 *   │  fib.py [main] · main.afl  · notes.md   ⋯  ⟳  ⤓  ▶ Run        │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │  Monaco editor                                                │
 *   │  ...                                                          │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │  Console output  (stdout default, stderr red, exit + ms)      │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Internal width is resizable via a drag handle on its left edge —
 * persisted to localStorage so the user's preferred width sticks.
 * No emojis; lucide icons only.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  FileText,
  X,
  Play,
  Square,
  Clock,
  RotateCcw,
  Download,
  Loader2,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  CircleAlert,
  RefreshCw,
  PanelRightClose,
  Code2,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import {
  EXECUTABLE_LANGUAGES,
  monacoLanguageFor,
  type WorkspaceLanguage,
} from '@/lib/workspaceApi';

// Monaco loads lazily and only on the client.
const Monaco = dynamic(
  () => import('@monaco-editor/react').then((m) => m.default),
  { ssr: false, loading: () => <MonacoSkeleton /> },
);

// ─── Constants ───────────────────────────────────────────────────────────────

const PANEL_WIDTH_KEY = 'workspace_panel_width_v1';
const DEFAULT_WIDTH = 500;
const MIN_WIDTH = 360;
const MAX_WIDTH_PCT = 0.65;
const YELLOW = '#FEC00F';
const GREEN = '#22c55e';
const RED = '#ef4444';
const AMBER = '#d29922';
const INDIGO = '#818cf8';
const SLATE = 'rgba(255,255,255,0.55)';
const SUBTLE = 'rgba(255,255,255,0.06)';

// ─── Width hook ──────────────────────────────────────────────────────────────

function useResizableWidth() {
  const [width, setWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDTH;
    const raw = window.localStorage.getItem(PANEL_WIDTH_KEY);
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) && n >= MIN_WIDTH ? n : DEFAULT_WIDTH;
  });

  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(width);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = startX.current - e.clientX;
      const max = typeof window !== 'undefined'
        ? Math.floor(window.innerWidth * MAX_WIDTH_PCT)
        : 1200;
      const next = Math.min(max, Math.max(MIN_WIDTH, startW.current + dx));
      setWidth(next);
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      try { window.localStorage.setItem(PANEL_WIDTH_KEY, String(width)); } catch {/* */}
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [width]);

  const startDrag = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    startW.current = width;
    document.body.style.cursor = 'col-resize';
  }, [width]);

  return { width, startDrag };
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export function WorkspacePanel({ onCollapse }: { onCollapse?: () => void }) {
  const {
    files, loading, error, activeFilename, activeFile,
    output, dirty, saving,
    openFile, deleteFile, setContent, saveActive, resetActive, runActive,
    stopActive, downloadActive, clearOutput, refresh,
  } = useWorkspace();

  const { width, startDrag } = useResizableWidth();

  const lang = activeFile?.meta.language ?? 'text';
  const isExec = EXECUTABLE_LANGUAGES.includes(lang as WorkspaceLanguage);
  const isRunning = activeFilename ? output[activeFilename]?.status === 'running' : false;
  const isDirty = activeFilename ? !!dirty[activeFilename] : false;
  const saveState = activeFilename ? saving[activeFilename] ?? 'idle' : 'idle';

  return (
    <div
      style={{
        flexShrink: 0,
        width,
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        background: '#0a0a0a',
        borderLeft: '1px solid var(--border)',
        boxShadow: '-4px 0 18px rgba(0,0,0,0.25)',
        minWidth: 0,
      }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={startDrag}
        title="Drag to resize"
        style={{
          position: 'absolute',
          left: -3,
          top: 0,
          bottom: 0,
          width: 6,
          cursor: 'col-resize',
          zIndex: 5,
        }}
      />

      {/* Header / tabs — VS Code-style: rectangular tabs with a top-accent
          on the active one, no rounded "button" look. Logo + brand sit on
          the left as a compact chrome strip. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          background: '#0c0c0d',
          borderBottom: `1px solid ${SUBTLE}`,
          minHeight: 38,
        }}
      >
        {/* Brand chip */}
        <div
          title="Workspace IDE — files the agent created or modified in this chat"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '0 12px',
            background: `linear-gradient(180deg, ${YELLOW}14 0%, transparent 100%)`,
            borderRight: `1px solid ${SUBTLE}`,
            color: YELLOW,
            flexShrink: 0,
          }}
        >
          <Code2 size={13} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontFamily: "'DM Mono', monospace",
            }}
          >
            Workspace
          </span>
        </div>

        {/* Tabs strip */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            overflowX: 'auto',
            alignItems: 'stretch',
            minWidth: 0,
          }}
          className="ws-tabs-strip"
        >
          {files.map((f) => {
            const isActive = f.filename === activeFilename;
            const fileDirty = !!dirty[f.filename];
            const fileSaveState = saving[f.filename] ?? 'idle';
            const agent = f.last_author === 'agent';
            return (
              <div
                key={f.filename}
                onClick={() => openFile(f.filename)}
                onMouseDown={(e) => { if (e.button === 1) { e.preventDefault(); void deleteFile(f.filename); } }}
                title={`${f.filename} · v${f.version} · last edit by ${f.last_author}`}
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '0 12px 0 12px',
                  borderRight: `1px solid ${SUBTLE}`,
                  background: isActive ? '#0a0a0a' : 'transparent',
                  color: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.55)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 500,
                  whiteSpace: 'nowrap',
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  flexShrink: 0,
                  minWidth: 0,
                  transition: 'background .12s, color .12s',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Top accent — only on the active tab */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: YELLOW,
                    }}
                  />
                )}
                <FileText size={11} color={isActive ? YELLOW : 'rgba(255,255,255,0.4)'} />
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 180,
                  }}
                >
                  {f.filename}
                </span>
                {agent && (
                  <span
                    title="Last edited by the agent"
                    style={{ display: 'inline-flex', alignItems: 'center', color: INDIGO, opacity: 0.75 }}
                  >
                    <Sparkles size={10} />
                  </span>
                )}
                {fileDirty ? (
                  <span
                    title="Unsaved changes"
                    style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER, display: 'inline-block' }}
                  />
                ) : fileSaveState === 'pending' ? (
                  <Loader2 size={10} className="animate-spin" color={SLATE} />
                ) : null}
                {/* Close-x button — visible on active or hover */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); void deleteFile(f.filename); }}
                  title={`Delete ${f.filename}`}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: 'none',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.45)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 2,
                    opacity: isActive ? 0.9 : 0.6,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; e.currentTarget.style.color = '#fca5a5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
                >
                  <X size={10} />
                </button>
              </div>
            );
          })}
          {files.length === 0 && (
            <span style={{ fontSize: 11, color: SLATE, padding: '10px 14px' }}>
              {loading ? 'Loading…' : 'No files yet.'}
            </span>
          )}
        </div>

        {/* Right chrome */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0 8px', borderLeft: `1px solid ${SUBTLE}`, flexShrink: 0 }}>
          <button
            onClick={() => refresh()}
            title="Refresh file list"
            style={chromeBtn()}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
          >
            <RefreshCw size={12} />
          </button>
          {onCollapse && (
            <button
              onClick={onCollapse}
              title="Collapse workspace"
              style={chromeBtn()}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
            >
              <PanelRightClose size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Toolbar — left side: metadata pill + save state.
                    right side: icon-only secondary actions + big Run/Stop. */}
      {activeFile && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 12px',
            borderBottom: `1px solid ${SUBTLE}`,
            background: 'rgba(255,255,255,0.014)',
            fontSize: 11.5,
            color: SLATE,
            minHeight: 40,
          }}
        >
          {/* Metadata pill */}
          <span
            title={`Language: ${lang}\nVersion: ${activeFile.meta.version}\nLast edited by: ${activeFile.meta.last_author}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 9px',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${SUBTLE}`,
              borderRadius: 6,
              fontFamily: "'DM Mono', monospace",
              fontSize: 10.5,
              color: 'rgba(255,255,255,0.7)',
              flexShrink: 0,
            }}
          >
            <span style={{ color: YELLOW, fontWeight: 600 }}>{lang}</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
            <span>v{activeFile.meta.version}</span>
          </span>

          <SaveBadge state={isDirty ? 'pending' : saveState} />

          <div style={{ flex: 1 }} />

          {/* Secondary actions — icon only, tooltipped */}
          <IconAction
            icon={<RotateCcw size={12} />}
            title="Reset to last saved version"
            onClick={resetActive}
            disabled={!isDirty}
          />
          <IconAction
            icon={<Save size={12} />}
            title="Save now"
            onClick={saveActive}
            disabled={!isDirty || saveState === 'pending'}
          />
          <IconAction
            icon={<Download size={12} />}
            title="Download file"
            onClick={downloadActive}
          />
          <IconAction
            icon={<Trash2 size={12} />}
            title="Delete file"
            tone="danger"
            onClick={() => { if (activeFilename && window.confirm(`Delete ${activeFilename}?`)) void deleteFile(activeFilename); }}
          />

          <div style={{ width: 1, height: 18, background: SUBTLE, margin: '0 2px' }} />

          {/* Primary action — large pill */}
          {isRunning ? (
            <RunButton onClick={stopActive} tone="stop">
              <Square size={11} fill="#fca5a5" /> Stop
            </RunButton>
          ) : (
            <RunButton
              onClick={runActive}
              tone="run"
              disabled={!isExec}
              title={isExec ? 'Execute this file (stdout streams live)' : `${lang} is not executable — only Python or JavaScript can run`}
            >
              <Play size={11} fill="currentColor" /> Run
            </RunButton>
          )}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            background: 'rgba(239,68,68,0.08)',
            borderBottom: '1px solid rgba(239,68,68,0.25)',
            color: '#fca5a5',
            fontSize: 11.5,
          }}
        >
          <CircleAlert size={12} />
          {error}
        </div>
      )}

      {/* Editor + console */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          {activeFile ? (
            <Monaco
              height="100%"
              language={monacoLanguageFor(lang as WorkspaceLanguage)}
              value={activeFile.content}
              onChange={(v) => setContent(v ?? '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 12.5,
                wordWrap: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                renderLineHighlight: 'gutter',
                smoothScrolling: true,
                tabSize: 2,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              }}
            />
          ) : (
            <EmptyState loading={loading} hasFiles={files.length > 0} />
          )}
        </div>

        {activeFilename && (
          <ConsolePane
            filename={activeFilename}
            state={output[activeFilename] ?? { stdout: '', stderr: '', status: 'idle', exitCode: null, durationMs: null }}
            onClear={() => clearOutput(activeFilename)}
          />
        )}
      </div>

      {/* Slim scrollbar styling for the tab strip — applied globally so it
          works whether or not the console pane is mounted. */}
      <style>{`
        .ws-tabs-strip { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.15) transparent; }
        .ws-tabs-strip::-webkit-scrollbar { height: 4px; }
        .ws-tabs-strip::-webkit-scrollbar-track { background: transparent; }
        .ws-tabs-strip::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
      `}</style>
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function chromeBtn(): React.CSSProperties {
  return {
    width: 26,
    height: 26,
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,0.55)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background .12s, color .12s',
  };
}

/** Borderless icon-only toolbar action with a tooltip. Used for Reset /
 *  Save / Download / Delete so they sit quietly next to the primary Run
 *  button instead of competing with it. */
function IconAction({
  icon, title, onClick, disabled, tone = 'default',
}: {
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
}) {
  const color = tone === 'danger' ? '#fca5a5' : 'rgba(255,255,255,0.7)';
  const hoverBg = tone === 'danger' ? 'rgba(239,68,68,0.14)' : 'rgba(255,255,255,0.06)';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        border: 'none',
        background: 'transparent',
        color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background .12s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = hoverBg; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {icon}
    </button>
  );
}

/** Big primary Run / Stop button. Anchors the right edge of the toolbar so
 *  it stays prominent regardless of language metadata length on the left. */
function RunButton({
  children, onClick, disabled, tone, title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone: 'run' | 'stop';
  title?: string;
}) {
  const palette = tone === 'run'
    ? { bg: `${YELLOW}1F`, border: `${YELLOW}66`, color: YELLOW, hover: `${YELLOW}33` }
    : { bg: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.5)', color: '#fca5a5', hover: 'rgba(239,68,68,0.24)' };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 12px',
        height: 28,
        borderRadius: 7,
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        color: palette.color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        transition: 'background .12s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = palette.hover; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = palette.bg; }}
    >
      {children}
    </button>
  );
}

function SaveBadge({ state }: { state: 'idle' | 'pending' | 'saved' | 'error' }) {
  // Mixed-case labels — the shouty UPPERCASE got noisy next to the toolbar
  // metadata pill. State is conveyed via icon colour + a small text label.
  const map = {
    idle:    { color: 'rgba(255,255,255,0.4)', icon: null,                                  text: 'In sync' },
    pending: { color: AMBER, icon: <Loader2 size={11} className="animate-spin" />,          text: 'Saving' },
    saved:   { color: GREEN, icon: <CheckCircle2 size={11} />,                              text: 'Saved' },
    error:   { color: RED,   icon: <AlertTriangle size={11} />,                             text: 'Save failed' },
  } as const;
  const m = map[state];
  return (
    <span
      title={m.text}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        color: m.color,
        fontWeight: 500,
      }}
    >
      {m.icon}
      {m.text}
    </span>
  );
}

function ConsolePane({
  filename, state, onClear,
}: {
  filename: string;
  state: { stdout: string; stderr: string; status: 'idle' | 'running' | 'done' | 'error' | 'timed_out'; exitCode: number | null; durationMs: number | null };
  onClear: () => void;
}) {
  const hasContent = state.stdout.length > 0 || state.stderr.length > 0 || state.status !== 'idle';
  if (!hasContent) return null;

  const statusColor =
    state.status === 'running'   ? AMBER :
    state.status === 'error'     ? RED   :
    state.status === 'timed_out' ? RED   :
    state.status === 'done'      ? GREEN : SLATE;

  const statusLabel =
    state.status === 'timed_out' ? 'timed out' : state.status;

  // Auto-scroll to the bottom whenever new output arrives.
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [state.stdout, state.stderr, state.status]);

  return (
    <div
      style={{
        flexShrink: 0,
        borderTop: '1px solid var(--border)',
        background: '#070707',
        maxHeight: '40%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderBottom: `1px solid ${SUBTLE}`,
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: SLATE,
        }}
      >
        <span style={{ color: statusColor, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {state.status === 'running' && (
            <span
              className="workspace-console-pulse"
              style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER }}
            />
          )}
          {state.status === 'timed_out' && <Clock size={10} color={RED} />}
          {state.status === 'done' && <CheckCircle2 size={10} color={GREEN} />}
          {state.status === 'error' && <AlertTriangle size={10} color={RED} />}
          {statusLabel}
        </span>
        <span>Console · {filename}</span>
        {state.exitCode !== null && (
          <span title="Process exit code">exit {state.exitCode}</span>
        )}
        {state.durationMs !== null && (
          <span>{(state.durationMs / 1000).toFixed(2)}s</span>
        )}
        <div style={{ flex: 1 }} />
        <button
          onClick={onClear}
          title="Clear console"
          style={{ ...chromeBtn(), width: 22, height: 22 }}
        >
          <X size={10} />
        </button>
      </div>

      <div
        ref={bodyRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          padding: '8px 12px',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: 11.5,
          lineHeight: 1.55,
        }}
      >
        {state.stdout && (
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#e6edf3' }}>
            {state.stdout}
          </pre>
        )}
        {state.stderr && (
          <pre style={{ margin: state.stdout ? '8px 0 0' : 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#f97583' }}>
            {state.stderr}
          </pre>
        )}
        {state.status === 'running' && (
          <div style={{ marginTop: 6, color: AMBER, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            streaming…
          </div>
        )}
      </div>

      <style>{`
        @keyframes workspace-pulse-kf { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.6); } }
        .workspace-console-pulse { animation: workspace-pulse-kf 1.3s ease-in-out infinite; display: inline-block; }
      `}</style>
    </div>
  );
}

function EmptyState({ loading, hasFiles }: { loading: boolean; hasFiles: boolean }) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        color: SLATE,
        textAlign: 'center',
        padding: 24,
      }}
    >
      {loading ? (
        <Loader2 size={24} className="animate-spin" color={YELLOW} />
      ) : (
        <FileText size={32} color="rgba(255,255,255,0.18)" />
      )}
      <div style={{ fontSize: 12.5 }}>
        {loading
          ? 'Loading workspace…'
          : hasFiles
          ? 'Pick a file from the tab bar.'
          : 'When the assistant writes code in this chat, it appears here as an editable file.'}
      </div>
    </div>
  );
}

function MonacoSkeleton() {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d1117',
        color: SLATE,
        fontSize: 12,
        gap: 10,
      }}
    >
      <Loader2 size={16} className="animate-spin" />
      Loading editor…
    </div>
  );
}

export default WorkspacePanel;

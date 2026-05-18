'use client';

/**
 * WorkspaceCards
 * --------------
 * Three flagship generative-UI cards for the conversation IDE workspace:
 *
 *   WorkspaceFileCard      -> workspace_write_file / workspace_read_file
 *                             Single-file hero card with metadata strip,
 *                             syntax-highlighted code preview, and a
 *                             prominent "Open in IDE" action that focuses
 *                             the right-side panel on this file.
 *
 *   WorkspaceListCard      -> workspace_list_files
 *                             Compact bundle view: one row per file with
 *                             language icon + name + size + author chip.
 *                             Click any row to open that file in the IDE.
 *
 *   WorkspaceExecutionCard -> workspace_execute_file
 *                             Execution result: status banner, exit code +
 *                             duration, monospace stdout / stderr panes,
 *                             "Open in IDE" and "Re-run" actions.
 *
 * Visual language matches the AFL family: Potomac yellow primary accent
 * (#FEC00F), dark #0a0a0a shell, #0d1117 code panes, lucide-react icons
 * only, language-tinted secondary accents (Python blue, JS yellow, etc.).
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  FileText,
  FileCode2,
  Sparkles,
  Copy,
  Check,
  Download,
  ExternalLink,
  Play,
  Loader2,
  Square,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Terminal,
  HardDrive,
  Hash,
  User,
  Bot,
  Cog,
  ArrowUpRight,
  Layers,
} from 'lucide-react';
import { useWorkspaceOptional } from '@/contexts/WorkspaceContext';
import type { WorkspaceLanguage } from '@/lib/workspaceApi';

// ════════════════════════════════════════════════════════════════════════════
//  Palette + helpers
// ════════════════════════════════════════════════════════════════════════════

const YELLOW = '#FEC00F';
const GREEN = '#22c55e';
const AMBER = '#d29922';
const RED = '#ef4444';
const BLUE = '#3b82f6';
const INDIGO = '#818cf8';
const SLATE = 'rgba(255,255,255,0.55)';
const SUBTLE = 'rgba(255,255,255,0.06)';
const PANEL = '#0d1117';
const SHELL = '#0a0a0a';

/** Per-language accent tone. Picked from each ecosystem's brand colour
 *  but pulled toward a desaturated dark-mode-friendly tone. */
function langTone(lang?: string): string {
  switch ((lang || '').toLowerCase()) {
    case 'python':     return '#4584b6';
    case 'javascript': return '#f7df1e';
    case 'typescript': return '#3178c6';
    case 'afl':        return YELLOW;
    case 'sql':        return '#e38c00';
    case 'json':       return '#cc9842';
    case 'yaml':       return '#cb171e';
    case 'markdown':   return '#7c93ff';
    default:           return SLATE;
  }
}

function langLabel(lang?: string): string {
  const l = (lang || 'text').toLowerCase();
  if (l === 'javascript') return 'JavaScript';
  if (l === 'typescript') return 'TypeScript';
  if (l === 'afl')        return 'AmiBroker AFL';
  if (l === 'sql')        return 'SQL';
  if (l === 'json')       return 'JSON';
  if (l === 'yaml')       return 'YAML';
  if (l === 'markdown')   return 'Markdown';
  if (l === 'python')     return 'Python';
  return 'Text';
}

function formatBytes(n: number | null | undefined): string {
  const b = Number(n ?? 0);
  if (!b) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function timeAgo(iso?: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return '';
  const s = Math.floor(ms / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function authorIcon(author?: string, size = 11) {
  if (author === 'agent')  return <Bot   size={size} />;
  if (author === 'system') return <Cog   size={size} />;
  return <User size={size} />;
}

function authorLabel(author?: string): string {
  // Backend stores the assistant author as the literal string 'agent', but
  // the product brand for that author is YANG. Only the user-visible label
  // is rewritten — the API field stays as 'agent' so payloads still match.
  if (author === 'agent') return 'YANG';
  if (author === 'system') return 'System';
  return 'You';
}

// ════════════════════════════════════════════════════════════════════════════
//  Lightweight syntax highlighter (reused from AFL card)
// ════════════════════════════════════════════════════════════════════════════

const PY_KEYWORDS = new Set([
  'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'not',
  'and', 'or', 'is', 'lambda', 'import', 'from', 'as', 'pass', 'break', 'continue',
  'try', 'except', 'finally', 'raise', 'with', 'yield', 'global', 'nonlocal',
  'True', 'False', 'None', 'self', 'cls', 'async', 'await',
]);

const JS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
  'switch', 'case', 'default', 'break', 'continue', 'try', 'catch', 'finally',
  'throw', 'new', 'this', 'class', 'extends', 'super', 'import', 'export', 'from',
  'as', 'async', 'await', 'yield', 'typeof', 'instanceof', 'in', 'of', 'void',
  'delete', 'true', 'false', 'null', 'undefined',
]);

function highlightLine(line: string, lang: string, key: number): React.ReactNode {
  if (!line) return <>&nbsp;</>;
  const kws = lang === 'python' ? PY_KEYWORDS
    : (lang === 'javascript' || lang === 'typescript' || lang === 'afl') ? JS_KEYWORDS
    : new Set<string>();

  // Comment-only line shortcut
  const trimmed = line.trimStart();
  if (
    (lang === 'python' && trimmed.startsWith('#')) ||
    ((lang === 'javascript' || lang === 'typescript' || lang === 'afl') && trimmed.startsWith('//'))
  ) {
    return <span key={key} style={{ color: '#7c8a99', fontStyle: 'italic' }}>{line}</span>;
  }

  const parts: React.ReactNode[] = [];
  const re = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|([^\sA-Za-z0-9_"'`]+)|(\s+)/g;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(line)) !== null) {
    const [, str, num, ident, punct, ws] = m;
    if (str !== undefined) {
      parts.push(<span key={`${key}-${i++}`} style={{ color: '#a5d6ff' }}>{str}</span>);
    } else if (num !== undefined) {
      parts.push(<span key={`${key}-${i++}`} style={{ color: '#79c0ff' }}>{num}</span>);
    } else if (ident !== undefined) {
      if (kws.has(ident)) {
        parts.push(<span key={`${key}-${i++}`} style={{ color: '#ff7b72', fontWeight: 600 }}>{ident}</span>);
      } else {
        parts.push(<span key={`${key}-${i++}`} style={{ color: '#e6edf3' }}>{ident}</span>);
      }
    } else if (punct !== undefined) {
      parts.push(<span key={`${key}-${i++}`} style={{ color: '#d2a8ff' }}>{punct}</span>);
    } else if (ws !== undefined) {
      parts.push(<span key={`${key}-${i++}`}>{ws}</span>);
    }
  }
  return parts.length > 0 ? <>{parts}</> : <>{line}</>;
}

// ════════════════════════════════════════════════════════════════════════════
//  Shared sub-components
// ════════════════════════════════════════════════════════════════════════════

function CardShell({
  accent, icon, eyebrow, title, subtitle, rightMeta, badge, children,
}: {
  accent: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle?: string;
  rightMeta?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 14,
        overflow: 'hidden',
        border: `1px solid ${accent}33`,
        maxWidth: 820,
        marginTop: 8,
        backgroundColor: SHELL,
        boxShadow: `0 4px 28px rgba(0,0,0,0.4), 0 0 0 1px ${accent}08`,
      }}
    >
      {/* Hero */}
      <div
        style={{
          position: 'relative',
          padding: '14px 16px',
          background: `
            radial-gradient(ellipse 80% 140% at 0% 0%, ${accent}22 0%, transparent 55%),
            linear-gradient(180deg, ${accent}08 0%, transparent 100%)
          `,
          borderBottom: `1px solid ${SUBTLE}`,
        }}
      >
        <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 14px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: `linear-gradient(135deg, ${accent}33 0%, ${accent}14 100%)`,
              border: `1px solid ${accent}55`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accent,
              flexShrink: 0,
              boxShadow: `0 4px 12px ${accent}14`,
            }}
          >
            {icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 1 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent, opacity: 0.9, fontFamily: "'DM Mono', monospace" }}>
                {eyebrow}
              </span>
              {badge && <>{badge}</>}
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: 'rgba(255,255,255,0.97)',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              }}
              title={title}
            >
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 12, color: SLATE, marginTop: 3, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {subtitle}
              </div>
            )}
          </div>
          {rightMeta && <div style={{ flexShrink: 0 }}>{rightMeta}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Chip({
  color, children, icon, title, filled = false,
}: {
  color: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  title?: string;
  filled?: boolean;
}) {
  return (
    <span
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10.5,
        padding: '3px 7px',
        borderRadius: 5,
        background: filled ? color : `${color}1A`,
        color: filled ? '#0a0a0a' : color,
        border: filled ? 'none' : `1px solid ${color}33`,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        fontFamily: "'DM Mono', monospace",
        letterSpacing: '0.04em',
      }}
    >
      {icon}
      {children}
    </span>
  );
}

function ActionBtn({
  icon, label, onClick, tone = 'default', disabled, done, title,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
  done?: boolean;
  title?: string;
}) {
  const palette = tone === 'primary'
    ? { bg: `${YELLOW}1F`, border: `${YELLOW}66`, color: YELLOW, hover: `${YELLOW}33` }
    : tone === 'danger'
    ? { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.45)', color: '#fca5a5', hover: 'rgba(239,68,68,0.22)' }
    : { bg: 'rgba(255,255,255,0.04)', border: SUBTLE, color: 'rgba(255,255,255,0.78)', hover: 'rgba(255,255,255,0.08)' };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 11px',
        borderRadius: 7,
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        color: palette.color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontSize: 11.5,
        fontWeight: 600,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
        transition: 'background .15s',
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = palette.hover; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = palette.bg; }}
    >
      {done ? <Check size={12} color={GREEN} /> : icon}
      {label}
    </button>
  );
}

function CodePreview({
  code, lang, maxLines = 12, expanded, onExpandToggle,
}: {
  code: string;
  lang: string;
  maxLines?: number;
  expanded: boolean;
  onExpandToggle: () => void;
}) {
  const lines = useMemo(() => (code || '').split('\n'), [code]);
  const isTruncated = lines.length > maxLines && !expanded;
  const shown = expanded ? lines : lines.slice(0, maxLines);

  return (
    <div
      style={{
        backgroundColor: PANEL,
        borderRadius: 10,
        border: `1px solid ${SUBTLE}`,
        overflow: 'hidden',
      }}
    >
      <pre
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
          fontSize: 11.5,
          lineHeight: 1.55,
          color: '#e6edf3',
          maxHeight: expanded ? 480 : undefined,
          overflow: expanded ? 'auto' : 'hidden',
        }}
      >
        {shown.map((ln, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr',
              padding: '0',
            }}
          >
            <span style={{ textAlign: 'right', paddingRight: 10, color: 'rgba(255,255,255,0.22)', userSelect: 'none', borderRight: `1px solid ${SUBTLE}` }}>
              {i + 1}
            </span>
            <span style={{ padding: '0 12px', whiteSpace: 'pre' }}>
              {highlightLine(ln, lang, i)}
            </span>
          </div>
        ))}
      </pre>
      {(isTruncated || expanded) && (
        <button
          type="button"
          onClick={onExpandToggle}
          style={{
            width: '100%',
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.025)',
            border: 'none',
            borderTop: `1px solid ${SUBTLE}`,
            color: SLATE,
            fontSize: 10.5,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          {expanded ? 'Collapse' : `Show full · ${lines.length} lines`}
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  WorkspaceFileCard  (write / read)
// ════════════════════════════════════════════════════════════════════════════

export interface WorkspaceFilePayload {
  id?: string | null;
  filename?: string;
  language?: WorkspaceLanguage | string;
  version?: number;
  last_author?: 'agent' | 'user' | 'system';
  created_at?: string | null;
  updated_at?: string | null;
  size_bytes?: number;
  content?: string;
  conversation_id?: string | null;
  /** Optional one-line summary from the backend (matches data-card_workspace_file). */
  summary?: string;
}

export function WorkspaceFileCard({
  file, mode = 'write',
}: {
  file: WorkspaceFilePayload;
  mode?: 'write' | 'read';
}) {
  const ws = useWorkspaceOptional();
  const tone = langTone(file.language);
  const lang = String(file.language || 'text').toLowerCase();
  const filename = file.filename || 'untitled';
  const content = file.content ?? '';
  const lineCount = content ? content.split('\n').length : 0;

  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(content); setCopied(true); window.setTimeout(() => setCopied(false), 1500); } catch {/* */}
  }, [content]);

  const handleDownload = useCallback(() => {
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloaded(true); window.setTimeout(() => setDownloaded(false), 1500);
    } catch {/* */}
  }, [content, filename]);

  const handleOpenInIde = useCallback(() => {
    if (!ws) return;
    void ws.openFile(filename);
  }, [ws, filename]);

  const eyebrow = mode === 'write'
    ? (file.last_author === 'agent' ? 'YANG wrote · Workspace' : 'Saved · Workspace')
    : 'Read · Workspace';

  return (
    <CardShell
      accent={tone}
      icon={<FileCode2 size={17} />}
      eyebrow={eyebrow}
      title={filename}
      subtitle={file.summary || `${langLabel(file.language)} · ${formatBytes(file.size_bytes ?? content.length)} · ${lineCount} lines`}
      badge={typeof file.version === 'number' ? (
        <Chip color={tone}>v{file.version}</Chip>
      ) : null}
      rightMeta={
        file.last_author ? (
          <Chip color={file.last_author === 'agent' ? INDIGO : SLATE} icon={authorIcon(file.last_author, 10)}>
            {authorLabel(file.last_author)}
          </Chip>
        ) : null
      }
    >
      {/* Meta strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 16px',
          borderBottom: `1px solid ${SUBTLE}`,
          backgroundColor: 'rgba(255,255,255,0.014)',
          fontSize: 11,
          color: SLATE,
          flexWrap: 'wrap',
        }}
      >
        <MetaItem icon={<Hash size={10} />} label={`${lineCount} lines`} />
        <MetaItem icon={<HardDrive size={10} />} label={formatBytes(file.size_bytes ?? content.length)} />
        {file.updated_at && <MetaItem icon={<Clock size={10} />} label={`updated ${timeAgo(file.updated_at)}`} />}
        {file.language && (
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, color: tone, fontWeight: 600, fontFamily: "'DM Mono', monospace", fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: tone, display: 'inline-block' }} />
            {langLabel(file.language)}
          </span>
        )}
      </div>

      {/* Code preview */}
      {content ? (
        <div style={{ padding: '12px 16px' }}>
          <CodePreview
            code={content}
            lang={lang}
            expanded={expanded}
            onExpandToggle={() => setExpanded((v) => !v)}
          />
        </div>
      ) : (
        <div style={{ padding: '20px 16px', textAlign: 'center', color: SLATE, fontSize: 12 }}>
          (no preview — content not included)
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '10px 16px 12px',
          borderTop: `1px solid ${SUBTLE}`,
          backgroundColor: 'rgba(255,255,255,0.012)',
        }}
      >
        {ws && (
          <ActionBtn
            icon={<ArrowUpRight size={12} />}
            label="Open in IDE"
            onClick={handleOpenInIde}
            tone="primary"
            title="Focus the workspace panel on this file"
          />
        )}
        <ActionBtn icon={<Copy size={12} />} label={copied ? 'Copied' : 'Copy'} onClick={handleCopy} done={copied} />
        <ActionBtn icon={<Download size={12} />} label={downloaded ? 'Downloaded' : 'Download'} onClick={handleDownload} done={downloaded} />
      </div>
    </CardShell>
  );
}

function MetaItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'DM Mono', monospace", fontSize: 10.5 }}>
      {icon}
      {label}
    </span>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  WorkspaceListCard  (list_files)
// ════════════════════════════════════════════════════════════════════════════

export interface WorkspaceListPayload {
  file_count?: number;
  files?: Array<WorkspaceFilePayload>;
}

export function WorkspaceListCard({ payload }: { payload: WorkspaceListPayload }) {
  const ws = useWorkspaceOptional();
  const files = Array.isArray(payload.files) ? payload.files : [];
  const count = payload.file_count ?? files.length;

  return (
    <CardShell
      accent={YELLOW}
      icon={<Layers size={17} />}
      eyebrow="Workspace · Files"
      title={`${count} ${count === 1 ? 'file' : 'files'} in workspace`}
      subtitle="Files this conversation has created or edited"
    >
      {files.length === 0 ? (
        <div style={{ padding: '24px 16px', textAlign: 'center', color: SLATE, fontSize: 12.5 }}>
          No files yet. Ask the assistant to write one.
        </div>
      ) : (
        <div>
          {files.map((f, i) => {
            const tone = langTone(f.language);
            return (
              <button
                key={`${f.filename}-${i}`}
                type="button"
                onClick={() => { if (ws && f.filename) void ws.openFile(f.filename); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: i < files.length - 1 ? `1px solid ${SUBTLE}` : 'none',
                  color: 'rgba(255,255,255,0.92)',
                  cursor: ws ? 'pointer' : 'default',
                  textAlign: 'left',
                  transition: 'background .12s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${tone}1F`,
                    border: `1px solid ${tone}44`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: tone,
                    flexShrink: 0,
                  }}
                >
                  <FileCode2 size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: 12.5,
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {f.filename || 'untitled'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, fontSize: 10.5, color: SLATE, fontFamily: "'DM Mono', monospace" }}>
                    <span style={{ color: tone, fontWeight: 600 }}>{langLabel(f.language)}</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span>{formatBytes(f.size_bytes)}</span>
                    {typeof f.version === 'number' && (
                      <>
                        <span style={{ opacity: 0.4 }}>·</span>
                        <span>v{f.version}</span>
                      </>
                    )}
                    {f.last_author && (
                      <>
                        <span style={{ opacity: 0.4 }}>·</span>
                        <span style={{ color: f.last_author === 'agent' ? INDIGO : SLATE, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          {authorIcon(f.last_author, 9)} {authorLabel(f.last_author)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {ws && (
                  <span style={{ flexShrink: 0, color: SLATE, opacity: 0.7 }}>
                    <ArrowUpRight size={14} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </CardShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  WorkspaceExecutionCard  (execute_file)
// ════════════════════════════════════════════════════════════════════════════

export interface WorkspaceExecutionPayload {
  filename?: string;
  language?: WorkspaceLanguage | string;
  success?: boolean;
  output?: string;
  error?: string;
  exit_code?: number | null;
  execution_time_ms?: number | null;
  timed_out?: boolean;
  artifacts?: unknown[];
}

export function WorkspaceExecutionCard({ payload }: { payload: WorkspaceExecutionPayload }) {
  const ws = useWorkspaceOptional();
  const tone = langTone(payload.language);
  const filename = payload.filename || 'untitled';
  const stdout = payload.output || '';
  const stderr = payload.error || '';
  const exitCode = payload.exit_code ?? null;
  const duration = payload.execution_time_ms ?? null;
  const timedOut = !!payload.timed_out;
  const success = !!payload.success && !timedOut;

  // Status visuals
  const status =
    timedOut ? { color: RED,    icon: <Clock size={11} />,        label: 'Timed out' } :
    success  ? { color: GREEN,  icon: <CheckCircle2 size={11} />, label: 'Success'  } :
               { color: RED,    icon: <XCircle size={11} />,       label: 'Failed'   };

  const [reRunning, setReRunning] = useState(false);
  const handleOpen = useCallback(() => {
    if (ws) void ws.openFile(filename);
  }, [ws, filename]);
  const handleReRun = useCallback(async () => {
    if (!ws) return;
    setReRunning(true);
    try {
      await ws.openFile(filename);
      await ws.runActive();
    } finally {
      setReRunning(false);
    }
  }, [ws, filename]);

  return (
    <CardShell
      accent={status.color}
      icon={<Terminal size={17} />}
      eyebrow="Workspace · Executed"
      title={filename}
      subtitle={`${langLabel(payload.language)}${exitCode !== null ? ` · exit ${exitCode}` : ''}${duration !== null ? ` · ${(duration / 1000).toFixed(2)}s` : ''}`}
      badge={
        <Chip color={status.color} icon={status.icon}>
          {status.label}
        </Chip>
      }
      rightMeta={
        <Chip color={tone}>
          {langLabel(payload.language)}
        </Chip>
      }
    >
      {/* Quick stats */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          padding: '10px 16px',
          borderBottom: `1px solid ${SUBTLE}`,
          backgroundColor: 'rgba(255,255,255,0.014)',
          flexWrap: 'wrap',
        }}
      >
        <StatBlock label="Status" value={status.label} tone={status.color} icon={status.icon} />
        {exitCode !== null && (
          <StatBlock label="Exit code" value={String(exitCode)} tone={exitCode === 0 ? GREEN : RED} />
        )}
        {duration !== null && (
          <StatBlock label="Duration" value={duration < 1000 ? `${duration} ms` : `${(duration / 1000).toFixed(2)} s`} tone={tone} />
        )}
        {timedOut && (
          <StatBlock label="Timeout" value="exceeded" tone={RED} icon={<AlertTriangle size={10} />} />
        )}
      </div>

      {/* Output panes */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {stdout && (
          <OutputBlock
            label="stdout"
            text={stdout}
            tone={GREEN}
            icon={<Terminal size={10} />}
          />
        )}
        {stderr && (
          <OutputBlock
            label="stderr"
            text={stderr}
            tone={RED}
            icon={<AlertTriangle size={10} />}
            mono="error"
          />
        )}
        {!stdout && !stderr && (
          <div style={{ padding: 12, textAlign: 'center', color: SLATE, fontSize: 12, background: PANEL, borderRadius: 8, border: `1px solid ${SUBTLE}` }}>
            (no output)
          </div>
        )}
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '10px 16px 12px',
          borderTop: `1px solid ${SUBTLE}`,
          backgroundColor: 'rgba(255,255,255,0.012)',
        }}
      >
        {ws && (
          <ActionBtn icon={<ArrowUpRight size={12} />} label="Open in IDE" onClick={handleOpen} tone="primary" />
        )}
        {ws && (
          <ActionBtn
            icon={reRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
            label={reRunning ? 'Running' : 'Re-run'}
            onClick={handleReRun}
            disabled={reRunning}
          />
        )}
      </div>
    </CardShell>
  );
}

function StatBlock({ label, value, tone, icon }: { label: string; value: string; tone: string; icon?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: 9.5, fontFamily: "'DM Mono', monospace", letterSpacing: '0.14em', textTransform: 'uppercase', color: SLATE }}>
        {label}
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: tone, fontFamily: "'JetBrains Mono', monospace" }}>
        {icon}
        {value}
      </div>
    </div>
  );
}

function OutputBlock({ label, text, tone, icon, mono = 'normal' }: { label: string; text: string; tone: string; icon: React.ReactNode; mono?: 'normal' | 'error' }) {
  return (
    <div style={{ borderRadius: 9, border: `1px solid ${SUBTLE}`, overflow: 'hidden', background: PANEL }}>
      <div
        style={{
          padding: '6px 12px',
          borderBottom: `1px solid ${SUBTLE}`,
          background: 'rgba(255,255,255,0.025)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: tone,
          fontFamily: "'DM Mono', monospace",
          fontSize: 9.5,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontWeight: 700,
        }}
      >
        {icon} {label}
      </div>
      <pre
        style={{
          margin: 0,
          padding: '10px 12px',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: 11.5,
          lineHeight: 1.55,
          color: mono === 'error' ? '#f97583' : '#e6edf3',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight: 280,
          overflow: 'auto',
        }}
      >
        {text}
      </pre>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  Default export — re-exports for the registry
// ════════════════════════════════════════════════════════════════════════════

export default WorkspaceFileCard;

'use client';

/**
 * AFLToolCards
 * ------------
 * Five generative-UI cards for the AFL toolchain. Each card consumes the
 * canonical GenUI envelope:
 *
 *   { type: "data-card_<name>", data: { ... summary, ... } }
 *
 * Cards in this file:
 *   - AFLValidationCard      -> data-card_afl_validation     (validate_afl)
 *   - AFLSanityCheckCard     -> data-card_afl_sanity_check   (sanity_check_afl)
 *   - AFLDebugDiffCard       -> data-card_afl_debug          (debug_afl_code)
 *   - AFLExplanationCard     -> data-card_afl_explanation    (explain_afl_code)
 *   - AFLReferenceCard       -> data-card_afl_reference      (get_afl_syntax_reference)
 *
 * The `afl_strategy` envelope (for generate_afl_code) is handled separately
 * by AFLStrategyCard.tsx.
 *
 * Visual language matches the existing AFL family: Potomac yellow (#FEC00F)
 * accent, dark #0d1117 code panes, lucide-react icons only (no emoji),
 * collapsible sections, copy/download affordances on every code surface.
 */

import React, { useMemo, useState } from 'react';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Copy,
  Check,
  Bug,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Sparkles,
  FileText,
  Tag,
  Layers,
  Hash,
} from 'lucide-react';

// ─── Shared palette ─────────────────────────────────────────────────────────
const YELLOW = '#FEC00F';
const GREEN = '#22c55e';
const AMBER = '#d29922';
const RED = '#ef4444';
const BLUE = '#3b82f6';
const INDIGO = '#818cf8';
const SLATE = 'rgba(255,255,255,0.55)';
const PANEL = '#0d1117';

// ─── Shared types ───────────────────────────────────────────────────────────
type Severity = 'ERROR' | 'WARNING' | 'INFO' | 'SUGGESTION' | string;

interface Issue {
  line?: number;
  severity?: Severity;
  category?: string;
  message?: string;
  suggestion?: string;
  cascading?: boolean;
}

interface Counts {
  errors?: number;
  warnings?: number;
  suggestions?: number;
  info?: number;
  cascades?: number;
}

// ─── Shared helpers ─────────────────────────────────────────────────────────
function severityColor(sev?: Severity): string {
  const s = String(sev || '').toUpperCase();
  if (s === 'ERROR') return RED;
  if (s === 'WARNING') return AMBER;
  if (s === 'SUGGESTION') return INDIGO;
  return BLUE;
}

function severityLabel(sev?: Severity): string {
  const s = String(sev || '').toUpperCase();
  if (s === 'ERROR') return 'Error';
  if (s === 'WARNING') return 'Warning';
  if (s === 'INFO') return 'Info';
  if (s === 'SUGGESTION') return 'Suggestion';
  return 'Note';
}

function severityIcon(sev?: Severity, size = 13) {
  const c = severityColor(sev);
  const s = String(sev || '').toUpperCase();
  if (s === 'ERROR') return <XCircle size={size} color={c} />;
  if (s === 'WARNING') return <AlertTriangle size={size} color={c} />;
  if (s === 'SUGGESTION') return <Sparkles size={size} color={c} />;
  return <Info size={size} color={c} />;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ─── Shared sub-components ──────────────────────────────────────────────────
interface CardShellProps {
  accent: string;
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  rightMeta?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string | number;
}

function CardShell({ accent, icon, title, badge, rightMeta, children, maxWidth = '720px' }: CardShellProps) {
  return (
    <div
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        border: `1px solid ${accent}55`,
        maxWidth,
        marginTop: '8px',
        backgroundColor: '#0a0a0a',
        boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          background: `linear-gradient(135deg, ${accent}26 0%, ${accent}08 100%)`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            backgroundColor: `${accent}2A`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: '13.5px',
              color: 'rgba(255,255,255,0.95)',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={title}
          >
            {title}
          </div>
          {badge && (
            <div style={{ marginTop: '3px', fontSize: '11.5px', color: SLATE }}>
              {badge}
            </div>
          )}
        </div>
        {rightMeta}
      </div>
      {children}
    </div>
  );
}

interface PillProps {
  color: string;
  bg?: string;
  children: React.ReactNode;
  title?: string;
}

function Pill({ color, bg, children, title }: PillProps) {
  return (
    <span
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        padding: '3px 8px',
        borderRadius: '6px',
        backgroundColor: bg || `${color}1F`,
        color,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

interface StatusBannerProps {
  ok: boolean;
  text: string;
}

function StatusBanner({ ok, text }: StatusBannerProps) {
  const color = ok ? GREEN : RED;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        backgroundColor: `${color}14`,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        borderLeft: `3px solid ${color}`,
      }}
    >
      {ok ? <CheckCircle size={14} color={color} /> : <XCircle size={14} color={color} />}
      <span style={{ fontSize: '12.5px', color, fontWeight: 700 }}>{text}</span>
    </div>
  );
}

interface CollapsibleProps {
  title: string;
  defaultOpen?: boolean;
  rightMeta?: React.ReactNode;
  children: React.ReactNode;
}

function Collapsible({ title, defaultOpen = false, rightMeta, children }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.85)',
          fontSize: '12.5px',
          fontWeight: 600,
          textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {title}
        </span>
        {rightMeta && <span style={{ fontSize: '11.5px', color: SLATE }}>{rightMeta}</span>}
      </button>
      {open && <div style={{ padding: '0 16px 14px 16px' }}>{children}</div>}
    </div>
  );
}

interface CopyButtonProps {
  text: string;
  label?: string;
  size?: 'sm' | 'md';
}

function CopyButton({ text, label = 'Copy', size = 'sm' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const pad = size === 'sm' ? '4px 8px' : '6px 10px';
  const fs = size === 'sm' ? '11px' : '12px';
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await copyToClipboard(text);
        if (ok) {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        }
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: pad,
        borderRadius: '6px',
        fontSize: fs,
        fontWeight: 600,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: copied ? GREEN : 'rgba(255,255,255,0.75)',
        cursor: 'pointer',
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : label}
    </button>
  );
}

interface CodePaneProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
  highlightLines?: Set<number>;
}

function CodePane({ code, showLineNumbers = false, maxHeight = '320px', highlightLines }: CodePaneProps) {
  const lines = useMemo(() => (code || '').split('\n'), [code]);
  if (!showLineNumbers) {
    return (
      <pre
        style={{
          margin: 0,
          padding: '12px 14px',
          backgroundColor: PANEL,
          fontSize: '12px',
          fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
          color: '#e6edf3',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: 1.55,
          maxHeight,
          overflow: 'auto',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {code || ' '}
      </pre>
    );
  }
  return (
    <pre
      style={{
        margin: 0,
        padding: 0,
        backgroundColor: PANEL,
        fontSize: '12px',
        fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        color: '#e6edf3',
        lineHeight: 1.55,
        maxHeight,
        overflow: 'auto',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {lines.map((ln, i) => {
        const lineNo = i + 1;
        const isHl = highlightLines?.has(lineNo);
        return (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '48px 1fr',
              backgroundColor: isHl ? 'rgba(254, 192, 15, 0.10)' : 'transparent',
            }}
          >
            <span
              style={{
                userSelect: 'none',
                textAlign: 'right',
                paddingRight: '12px',
                color: 'rgba(255,255,255,0.25)',
                borderRight: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {lineNo}
            </span>
            <span style={{ padding: '0 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{ln || ' '}</span>
          </div>
        );
      })}
    </pre>
  );
}

interface IssueRowProps {
  issue: Issue;
  onJump?: (line: number) => void;
}

function IssueRow({ issue, onJump }: IssueRowProps) {
  const c = severityColor(issue.severity);
  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: '8px',
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderLeft: `3px solid ${c}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
        {severityIcon(issue.severity)}
        <span style={{ fontSize: '11px', fontWeight: 700, color: c, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {severityLabel(issue.severity)}
        </span>
        {issue.category && (
          <span
            style={{
              fontSize: '10.5px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: SLATE,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              fontWeight: 600,
            }}
          >
            {issue.category}
          </span>
        )}
        {issue.cascading && (
          <span
            style={{
              fontSize: '10.5px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.45)',
              fontWeight: 600,
            }}
            title="This issue cascades from an earlier one"
          >
            cascade
          </span>
        )}
        {typeof issue.line === 'number' && (
          <span style={{ fontSize: '11px', color: SLATE, marginLeft: 'auto' }}>Line {issue.line}</span>
        )}
      </div>
      <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
        {issue.message || 'No message'}
      </div>
      {issue.suggestion && (
        <div
          style={{
            marginTop: '6px',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.5,
            paddingLeft: '10px',
            borderLeft: '2px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <div>
            <span style={{ color: YELLOW, fontWeight: 600 }}>Suggestion:</span> {issue.suggestion}
          </div>
          <CopyButton text={issue.suggestion} label="Copy fix" />
        </div>
      )}
      {typeof issue.line === 'number' && onJump && (
        <div style={{ marginTop: '8px' }}>
          <button
            type="button"
            onClick={() => onJump(issue.line as number)}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
            }}
          >
            Jump to line
          </button>
        </div>
      )}
    </div>
  );
}

interface CountTileProps {
  label: string;
  value: number;
  color: string;
}

function CountTile({ label, value, color }: CountTileProps) {
  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: '70px',
        padding: '8px 10px',
        borderRadius: '8px',
        backgroundColor: value > 0 ? `${color}14` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${value > 0 ? `${color}33` : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <div style={{ fontSize: '18px', fontWeight: 700, color: value > 0 ? color : 'rgba(255,255,255,0.4)', lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: '10.5px', color: SLATE, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, marginTop: '2px' }}>
        {label}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  1. AFL Validation Card  (validate_afl)
// ════════════════════════════════════════════════════════════════════════════

export interface AFLValidationData {
  valid?: boolean;
  line_count?: number;
  counts?: Counts;
  structure?: {
    has_buy_sell?: boolean;
    has_plot?: boolean;
    has_section_markers?: boolean;
  };
  issues?: Issue[];
  summary?: string;
}

export function AFLValidationCard({ data }: { data?: AFLValidationData }) {
  const d = data || {};
  const counts: Counts = d.counts || {};
  const errs = counts.errors ?? 0;
  const warns = counts.warnings ?? 0;
  const suggs = counts.suggestions ?? 0;
  const infos = counts.info ?? 0;
  const casc = counts.cascades ?? 0;
  const valid = d.valid ?? errs === 0;
  const issues = Array.isArray(d.issues) ? d.issues : [];

  const structure = d.structure || {};
  const headerText = valid
    ? `Valid — 0 errors${warns > 0 ? `, ${warns} warning${warns === 1 ? '' : 's'}` : ''}`
    : `Invalid — ${errs} error${errs === 1 ? '' : 's'}${warns > 0 ? `, ${warns} warning${warns === 1 ? '' : 's'}` : ''}`;

  return (
    <CardShell
      accent={valid ? GREEN : RED}
      icon={<Shield size={15} color={valid ? GREEN : RED} />}
      title="AFL Validation"
      badge={d.summary || (typeof d.line_count === 'number' ? `${d.line_count} lines analyzed` : undefined)}
    >
      <StatusBanner ok={valid} text={headerText} />

      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <CountTile label="Errors" value={errs} color={RED} />
          <CountTile label="Warnings" value={warns} color={AMBER} />
          <CountTile label="Suggestions" value={suggs} color={INDIGO} />
          <CountTile label="Info" value={infos} color={BLUE} />
          <CountTile label="Cascades" value={casc} color={SLATE} />
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {typeof d.line_count === 'number' && (
            <Pill color={SLATE}>
              <FileText size={11} /> {d.line_count} lines
            </Pill>
          )}
          {structure.has_buy_sell && (
            <Pill color={GREEN}>
              <CheckCircle size={11} /> Buy/Sell
            </Pill>
          )}
          {structure.has_plot && (
            <Pill color={INDIGO}>
              <CheckCircle size={11} /> Plot
            </Pill>
          )}
          {structure.has_section_markers && (
            <Pill color={YELLOW}>
              <CheckCircle size={11} /> Sections
            </Pill>
          )}
        </div>
      </div>

      {issues.length > 0 && (
        <Collapsible
          title="Issues"
          defaultOpen={errs > 0}
          rightMeta={`${issues.length} item${issues.length === 1 ? '' : 's'}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {issues.map((iss, i) => (
              <IssueRow key={i} issue={iss} />
            ))}
          </div>
        </Collapsible>
      )}
    </CardShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  2. AFL Sanity Check Card  (sanity_check_afl)
// ════════════════════════════════════════════════════════════════════════════

export interface AFLSanityCheckData {
  is_valid?: boolean;
  total_issues?: number;
  counts?: Counts;
  line_count?: number;
  auto_fix_applied?: boolean;
  report?: string;
  issues_by_category?: Record<string, number>;
  issues?: Issue[];
  summary?: string;
}

export function AFLSanityCheckCard({ data }: { data?: AFLSanityCheckData }) {
  const d = data || {};
  const [view, setView] = useState<'structured' | 'raw'>('structured');
  const counts: Counts = d.counts || {};
  const errs = counts.errors ?? 0;
  const warns = counts.warnings ?? 0;
  const total = d.total_issues ?? (errs + warns + (counts.suggestions ?? 0) + (counts.info ?? 0));
  const valid = d.is_valid ?? errs === 0;
  const byCat = d.issues_by_category || {};
  const catEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const catMax = Math.max(1, ...catEntries.map(([, v]) => v));

  const headerText = valid
    ? `Clean — ${total} issue${total === 1 ? '' : 's'}`
    : `${errs} error${errs === 1 ? '' : 's'}, ${warns} warning${warns === 1 ? '' : 's'}`;

  return (
    <CardShell
      accent={valid ? GREEN : errs > 0 ? RED : AMBER}
      icon={<Sparkles size={15} color={valid ? GREEN : errs > 0 ? RED : AMBER} />}
      title="AFL Sanity Check"
      badge={d.summary}
      rightMeta={
        d.auto_fix_applied ? (
          <Pill color={GREEN} title="Auto-fix was applied during this check">
            <Check size={11} /> Auto-fixed
          </Pill>
        ) : undefined
      }
    >
      <StatusBanner ok={valid} text={headerText} />

      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <CountTile label="Errors" value={errs} color={RED} />
          <CountTile label="Warnings" value={warns} color={AMBER} />
          <CountTile label="Suggestions" value={counts.suggestions ?? 0} color={INDIGO} />
          <CountTile label="Info" value={counts.info ?? 0} color={BLUE} />
          <CountTile label="Cascades" value={counts.cascades ?? 0} color={SLATE} />
        </div>

        {catEntries.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: SLATE, marginBottom: '8px' }}>
              Issues by category
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {catEntries.map(([cat, n]) => (
                <div key={cat} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 28px', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.75)' }}>{cat}</span>
                  <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{ width: `${(n / catMax) * 100}%`, height: '100%', background: YELLOW, opacity: 0.8 }} />
                  </div>
                  <span style={{ fontSize: '11.5px', color: SLATE, textAlign: 'right' }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setView('structured')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              background: view === 'structured' ? `${YELLOW}1F` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${view === 'structured' ? `${YELLOW}66` : 'rgba(255,255,255,0.08)'}`,
              color: view === 'structured' ? YELLOW : 'rgba(255,255,255,0.65)',
            }}
          >
            Structured
          </button>
          <button
            type="button"
            onClick={() => setView('raw')}
            disabled={!d.report}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: d.report ? 'pointer' : 'not-allowed',
              background: view === 'raw' ? `${YELLOW}1F` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${view === 'raw' ? `${YELLOW}66` : 'rgba(255,255,255,0.08)'}`,
              color: view === 'raw' ? YELLOW : 'rgba(255,255,255,0.65)',
              opacity: d.report ? 1 : 0.4,
            }}
          >
            Raw report
          </button>
          <div style={{ flex: 1 }} />
          {view === 'raw' && d.report && <CopyButton text={d.report} label="Copy report" />}
        </div>
      </div>

      {view === 'structured' && Array.isArray(d.issues) && d.issues.length > 0 && (
        <Collapsible title="Issues" defaultOpen={errs > 0} rightMeta={`${d.issues.length} item${d.issues.length === 1 ? '' : 's'}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {d.issues.map((iss, i) => (
              <IssueRow key={i} issue={iss} />
            ))}
          </div>
        </Collapsible>
      )}

      {view === 'raw' && d.report && (
        <div style={{ padding: '0 16px 16px 16px' }}>
          <CodePane code={d.report} maxHeight="360px" />
        </div>
      )}
    </CardShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  3. AFL Debug Card  (debug_afl_code) — side-by-side diff
// ════════════════════════════════════════════════════════════════════════════

interface DebugChange {
  line?: number;
  before?: string;
  after?: string;
  reason?: string;
}

export interface AFLDebugData {
  error_message?: string;
  original_code_preview?: string;
  original_code?: string;
  fixed_code?: string;
  diff_summary?: DebugChange[];
  summary?: string;
}

export function AFLDebugDiffCard({ data }: { data?: AFLDebugData }) {
  const d = data || {};
  const [view, setView] = useState<'diff' | 'side'>('side');
  const original = d.original_code_preview || d.original_code || '';
  const fixed = d.fixed_code || '';
  const changes = Array.isArray(d.diff_summary) ? d.diff_summary : [];

  const highlightOriginal = useMemo(() => {
    const set = new Set<number>();
    changes.forEach((c) => {
      if (typeof c.line === 'number') set.add(c.line);
    });
    return set;
  }, [changes]);

  return (
    <CardShell
      accent={INDIGO}
      icon={<Bug size={15} color={INDIGO} />}
      title="AFL Debugged"
      badge={d.summary || `${changes.length || 0} change${(changes.length || 0) === 1 ? '' : 's'} applied`}
      rightMeta={<CopyButton text={fixed} label="Copy fixed" />}
    >
      {d.error_message && (
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            borderLeft: `3px solid ${RED}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <AlertTriangle size={14} color={RED} style={{ marginTop: '2px', flexShrink: 0 }} />
          <div style={{ fontSize: '12px', color: '#f97583', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700, marginRight: '4px' }}>Original error:</span>
            {d.error_message}
          </div>
        </div>
      )}

      <div style={{ padding: '12px 16px 0 16px', display: 'flex', gap: '6px' }}>
        <button
          type="button"
          onClick={() => setView('side')}
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            background: view === 'side' ? `${INDIGO}1F` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${view === 'side' ? `${INDIGO}66` : 'rgba(255,255,255,0.08)'}`,
            color: view === 'side' ? INDIGO : 'rgba(255,255,255,0.65)',
          }}
        >
          Side-by-side
        </button>
        <button
          type="button"
          onClick={() => setView('diff')}
          disabled={changes.length === 0}
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: changes.length > 0 ? 'pointer' : 'not-allowed',
            background: view === 'diff' ? `${INDIGO}1F` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${view === 'diff' ? `${INDIGO}66` : 'rgba(255,255,255,0.08)'}`,
            color: view === 'diff' ? INDIGO : 'rgba(255,255,255,0.65)',
            opacity: changes.length > 0 ? 1 : 0.4,
          }}
        >
          Per-change diff
        </button>
      </div>

      {view === 'side' && (
        <div style={{ padding: '12px 16px 16px 16px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: RED }}>
                  Before
                </span>
                {original && <CopyButton text={original} label="Copy" />}
              </div>
              <CodePane code={original || '/* no original */'} showLineNumbers maxHeight="360px" highlightLines={highlightOriginal} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: GREEN }}>
                  After
                </span>
                {fixed && <CopyButton text={fixed} label="Copy" />}
              </div>
              <CodePane code={fixed || '/* no fix */'} showLineNumbers maxHeight="360px" highlightLines={highlightOriginal} />
            </div>
          </div>
        </div>
      )}

      {view === 'diff' && changes.length > 0 && (
        <div style={{ padding: '12px 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {changes.map((ch, i) => (
            <div
              key={i}
              style={{
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.06)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255,255,255,0.025)',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  fontSize: '11.5px',
                  color: SLATE,
                }}
              >
                {typeof ch.line === 'number' && (
                  <Pill color={INDIGO}>
                    <Hash size={10} /> Line {ch.line}
                  </Pill>
                )}
                {ch.reason && <span style={{ color: 'rgba(255,255,255,0.75)' }}>{ch.reason}</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 20px 1fr', gap: '8px', padding: '10px 12px', alignItems: 'center' }}>
                <pre
                  style={{
                    margin: 0,
                    padding: '8px 10px',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: `1px solid ${RED}33`,
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#f97583',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {ch.before || ' '}
                </pre>
                <ArrowRight size={14} color={SLATE} style={{ justifySelf: 'center' }} />
                <pre
                  style={{
                    margin: 0,
                    padding: '8px 10px',
                    backgroundColor: 'rgba(34, 197, 94, 0.08)',
                    border: `1px solid ${GREEN}33`,
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#7ee787',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {ch.after || ' '}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  4. AFL Explanation Card  (explain_afl_code)
// ════════════════════════════════════════════════════════════════════════════

export interface AFLExplanationData {
  code_preview?: string;
  code?: string;
  sections?: {
    purpose?: string;
    indicators?: string[];
    entry_logic?: string;
    exit_logic?: string;
    parameters?: string[];
  };
  explanation_raw?: string;
  explanation?: string;
  summary?: string;
}

export function AFLExplanationCard({ data }: { data?: AFLExplanationData }) {
  const d = data || {};
  const s = d.sections || {};
  const raw = d.explanation_raw || d.explanation;
  const codePreview = d.code_preview || d.code;
  const hasStructured =
    !!(s.purpose || (s.indicators && s.indicators.length) || s.entry_logic || s.exit_logic || (s.parameters && s.parameters.length));

  return (
    <CardShell
      accent={BLUE}
      icon={<BookOpen size={15} color={BLUE} />}
      title="AFL Code Explanation"
      badge={d.summary}
    >
      {hasStructured ? (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {s.purpose && (
            <Section title="Purpose" icon={<Sparkles size={12} color={BLUE} />}>
              <p style={pStyle}>{s.purpose}</p>
            </Section>
          )}
          {s.indicators && s.indicators.length > 0 && (
            <Section title="Indicators" icon={<Layers size={12} color={BLUE} />}>
              <ul style={ulStyle}>
                {s.indicators.map((it, i) => (
                  <li key={i} style={liStyle}>
                    {it}
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {s.entry_logic && (
            <Section title="Entry logic" icon={<ArrowRight size={12} color={GREEN} />} accent={GREEN}>
              <p style={pStyle}>{s.entry_logic}</p>
            </Section>
          )}
          {s.exit_logic && (
            <Section title="Exit logic" icon={<ArrowRight size={12} color={RED} />} accent={RED}>
              <p style={pStyle}>{s.exit_logic}</p>
            </Section>
          )}
          {s.parameters && s.parameters.length > 0 && (
            <Section title="Parameters" icon={<Tag size={12} color={YELLOW} />} accent={YELLOW}>
              <ul style={ulStyle}>
                {s.parameters.map((p, i) => (
                  <li key={i} style={liStyle}>
                    {p}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      ) : (
        raw && (
          <div
            style={{
              padding: '14px 16px',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
            }}
          >
            {raw}
          </div>
        )
      )}

      {hasStructured && raw && (
        <Collapsible title="Show full explanation" defaultOpen={false}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.78)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
            {raw}
          </div>
        </Collapsible>
      )}

      {codePreview && (
        <Collapsible title="Code preview" defaultOpen={false}>
          <CodePane code={codePreview} maxHeight="300px" />
        </Collapsible>
      )}
    </CardShell>
  );
}

const pStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '13px',
  color: 'rgba(255,255,255,0.82)',
  lineHeight: 1.6,
};

const ulStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: '18px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const liStyle: React.CSSProperties = {
  fontSize: '12.5px',
  color: 'rgba(255,255,255,0.78)',
  lineHeight: 1.55,
};

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  accent?: string;
  children: React.ReactNode;
}

function Section({ title, icon, accent = BLUE, children }: SectionProps) {
  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: '8px',
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '6px',
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: accent,
        }}
      >
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  5. AFL Reference Card  (get_afl_syntax_reference)
// ════════════════════════════════════════════════════════════════════════════

interface SignatureEntry {
  name?: string;
  signature?: string;
  arg_count?: number;
  example?: string;
}

interface ReservedEntry {
  keyword?: string;
  kind?: string;
}

interface RefSection {
  title?: string;
  entries?: any[];
  code?: string;
  rules?: string[];
}

export interface AFLReferenceData {
  sections?: RefSection[];
  reference?: string;
  summary?: string;
}

export function AFLReferenceCard({ data }: { data?: AFLReferenceData }) {
  const d = data || {};
  const sections = Array.isArray(d.sections) ? d.sections : [];
  const [active, setActive] = useState(0);
  const [search, setSearch] = useState('');

  // Fall back: if no structured sections but a raw reference string was sent,
  // render it as a single monospace block.
  if (sections.length === 0 && d.reference) {
    return (
      <CardShell
        accent={YELLOW}
        icon={<BookOpen size={15} color={YELLOW} />}
        title="AFL Syntax Reference"
        badge={d.summary}
        rightMeta={<CopyButton text={d.reference} label="Copy" />}
      >
        <div style={{ padding: '14px 16px' }}>
          <CodePane code={d.reference} maxHeight="480px" />
        </div>
      </CardShell>
    );
  }

  const activeSection = sections[active] || { title: '', entries: [] };
  const title = String(activeSection.title || `Section ${active + 1}`).toLowerCase();
  const isSignatures = title.includes('signature') || title.includes('function');
  const isReserved = title.includes('reserved') || title.includes('keyword');
  const isCode = !!activeSection.code;
  const isRules = Array.isArray(activeSection.rules) && activeSection.rules.length > 0;

  return (
    <CardShell
      accent={YELLOW}
      icon={<BookOpen size={15} color={YELLOW} />}
      title="AFL Syntax Reference"
      badge={d.summary || `${sections.length} section${sections.length === 1 ? '' : 's'}`}
    >
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '10px 12px 0 12px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          overflowX: 'auto',
        }}
      >
        {sections.map((sec, i) => {
          const isActive = i === active;
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                setActive(i);
                setSearch('');
              }}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${isActive ? YELLOW : 'transparent'}`,
                color: isActive ? YELLOW : 'rgba(255,255,255,0.55)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {sec.title || `Section ${i + 1}`}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '14px 16px' }}>
        {isSignatures && (
          <>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter functions…"
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                color: 'rgba(255,255,255,0.9)',
                marginBottom: '10px',
                outline: 'none',
              }}
            />
            <SignaturesTable entries={(activeSection.entries as SignatureEntry[]) || []} filter={search} />
          </>
        )}

        {isReserved && <ReservedGrid entries={(activeSection.entries as ReservedEntry[]) || []} />}

        {isCode && activeSection.code && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
              <CopyButton text={activeSection.code} label="Copy pattern" />
            </div>
            <CodePane code={activeSection.code} maxHeight="280px" />
          </div>
        )}

        {isRules && (
          <ul style={{ ...ulStyle, paddingLeft: '20px' }}>
            {activeSection.rules!.map((r, i) => (
              <li key={i} style={{ ...liStyle, marginBottom: '4px' }}>
                {r}
              </li>
            ))}
          </ul>
        )}

        {!isSignatures && !isReserved && !isCode && !isRules && (
          <div style={{ fontSize: '12.5px', color: SLATE, fontStyle: 'italic' }}>No content for this section.</div>
        )}
      </div>
    </CardShell>
  );
}

function SignaturesTable({ entries, filter }: { entries: SignatureEntry[]; filter: string }) {
  const q = filter.trim().toLowerCase();
  const rows = q
    ? entries.filter((e) =>
        [(e.name || ''), (e.signature || ''), (e.example || '')].some((s) => s.toLowerCase().includes(q)),
      )
    : entries;

  if (rows.length === 0) {
    return <div style={{ fontSize: '12.5px', color: SLATE, fontStyle: 'italic' }}>No matches.</div>;
  }

  return (
    <div
      style={{
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr 50px',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          fontSize: '10.5px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: SLATE,
        }}
      >
        <span>Name</span>
        <span>Signature</span>
        <span style={{ textAlign: 'right' }}>Args</span>
      </div>
      <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
        {rows.map((e, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '140px 1fr 50px',
              gap: '8px',
              padding: '8px 12px',
              borderBottom: i === rows.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
              fontSize: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              alignItems: 'center',
            }}
          >
            <span style={{ color: YELLOW, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {e.name || '—'}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {e.signature || '—'}
            </span>
            <span style={{ color: SLATE, textAlign: 'right' }}>
              {typeof e.arg_count === 'number' ? e.arg_count : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReservedGrid({ entries }: { entries: ReservedEntry[] }) {
  if (!entries || entries.length === 0) {
    return <div style={{ fontSize: '12.5px', color: SLATE, fontStyle: 'italic' }}>No keywords.</div>;
  }
  const byKind: Record<string, ReservedEntry[]> = {};
  entries.forEach((e) => {
    const k = e.kind || 'other';
    if (!byKind[k]) byKind[k] = [];
    byKind[k].push(e);
  });
  const kinds = Object.keys(byKind);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {kinds.map((kind) => (
        <div key={kind}>
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: SLATE,
              marginBottom: '6px',
            }}
          >
            {kind}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {byKind[kind].map((e, i) => (
              <span
                key={i}
                style={{
                  padding: '4px 8px',
                  fontSize: '11.5px',
                  fontFamily: "'JetBrains Mono', monospace",
                  background: 'rgba(254, 192, 15, 0.08)',
                  border: '1px solid rgba(254, 192, 15, 0.25)',
                  borderRadius: '5px',
                  color: YELLOW,
                }}
              >
                {e.keyword || '—'}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Default exports ────────────────────────────────────────────────────────
export default AFLValidationCard;

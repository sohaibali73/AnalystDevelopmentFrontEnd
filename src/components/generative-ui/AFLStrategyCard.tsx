'use client';

/**
 * AFLStrategyCard
 * ---------------
 * Premium generative-UI card for the unified AFL generation pipeline
 * (`generate_afl_code` / `generate_afl_with_skill` / `POST /afl/generate`).
 *
 * Consumes the GenUI envelope:
 *
 *   { type: "afl_strategy", data: { ... } }
 *
 * Design pillars:
 *   - Hero header with circular quality gauge (no emoji, lucide icons only)
 *   - Validation stripe banner with severity-colored left rail
 *   - Tabbed body: Code / Explanation / Issues / Metrics
 *   - Syntax-aware AFL code pane with line numbers, jump-to-line, copy/download
 *   - Issues panel with severity badges, category chips, copy-suggestion
 *   - Metrics tab with quality breakdown bars and structure flags
 *   - Sticky action footer: Validate / Debug / Explain / Save
 *
 * Visual language: Potomac yellow accent (#FEC00F), dark #0a0a0a chrome,
 * #0d1117 code panes — consistent with the AFL card family.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Wand2,
  Shield,
  Copy,
  Check,
  Download,
  Bug,
  BookOpen,
  Save,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  ChevronRight,
  Loader2,
  Code2,
  Sparkles,
  Activity,
  Hash,
  Clock,
  Cpu,
  FileText,
  Layers,
  Zap,
  Target,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AFLIssue {
  line?: number;
  severity?: 'ERROR' | 'WARNING' | 'INFO' | 'SUGGESTION' | string;
  category?: string;
  message?: string;
  suggestion?: string;
  cascading?: boolean;
}

interface AFLValidation {
  is_valid?: boolean;
  errors?: number;
  warnings?: number;
  suggestions?: number;
  info?: number;
  quality_score?: number;
  issues?: AFLIssue[];
}

interface AFLStats {
  generation_time_ms?: number;
  model?: string;
  line_count?: number;
  has_buy_sell?: boolean;
  has_plot?: boolean;
  has_sections?: boolean;
}

/**
 * A single AFL source file in a composite strategy bundle.
 *
 *   name        Display name (e.g. "main.afl", "momentum.afl").
 *   path        Filesystem path used when the bundle is downloaded
 *               (e.g. "main.afl", "Include/momentum.afl"). The "Include/"
 *               prefix is preserved so the .zip mirrors AmiBroker's
 *               on-disk layout.
 *   code        File contents.
 *   is_main     True for the entry-point file (rendered first, marked
 *               in the tab strip). Backend should set exactly one.
 *   description Optional one-line description shown as a tooltip.
 */
interface AFLFile {
  name: string;
  path?: string;
  code: string;
  is_main?: boolean;
  description?: string;
}

interface AFLStrategyData {
  title?: string;
  description?: string;
  strategy_type?: string;
  trade_timing?: string;
  /** The main/entry-point AFL source. Always present. */
  afl_code?: string;
  /** Optional list of files in a composite bundle. When > 1 file, the
   *  Code tab renders a file-tab strip and bundles a "Download all" .zip
   *  that preserves the Include/ folder layout. */
  files?: AFLFile[];
  explanation?: string;
  validation?: AFLValidation;
  stats?: AFLStats;
  actions?: string[];
}

interface Props {
  data?: AFLStrategyData;
}

// ─── Palette ─────────────────────────────────────────────────────────────────

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

// ─── Utility helpers ─────────────────────────────────────────────────────────

function slugify(s: string): string {
  return (s || 'strategy')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'strategy';
}

function severityColor(sev?: string): string {
  const s = (sev || '').toUpperCase();
  if (s === 'ERROR') return RED;
  if (s === 'WARNING') return AMBER;
  if (s === 'SUGGESTION') return INDIGO;
  return BLUE;
}

function severityLabel(sev?: string): string {
  const s = (sev || '').toUpperCase();
  if (s === 'ERROR') return 'Error';
  if (s === 'WARNING') return 'Warning';
  if (s === 'INFO') return 'Info';
  if (s === 'SUGGESTION') return 'Suggestion';
  return 'Note';
}

function severityIcon(sev?: string, size = 13) {
  const c = severityColor(sev);
  const s = (sev || '').toUpperCase();
  if (s === 'ERROR') return <XCircle size={size} color={c} />;
  if (s === 'WARNING') return <AlertTriangle size={size} color={c} />;
  if (s === 'SUGGESTION') return <Sparkles size={size} color={c} />;
  return <Info size={size} color={c} />;
}

function qualityTone(score?: number): { color: string; label: string } {
  if (typeof score !== 'number') return { color: SLATE, label: '—' };
  if (score >= 90) return { color: GREEN, label: 'Excellent' };
  if (score >= 75) return { color: '#84cc16', label: 'Good' };
  if (score >= 60) return { color: AMBER, label: 'Fair' };
  if (score >= 40) return { color: '#f97316', label: 'Needs work' };
  return { color: RED, label: 'Critical' };
}

function formatTime(ms?: number): string {
  if (typeof ms !== 'number') return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatStrategyType(s?: string): string {
  if (!s) return '';
  return s.replace(/_/g, ' ');
}

function formatTradeTiming(s?: string): string {
  if (!s) return '';
  const v = s.toLowerCase();
  if (v === 'close') return 'close-of-bar';
  if (v === 'open') return 'next-open';
  if (v === 'intraday') return 'intraday';
  return s.replace(/_/g, ' ');
}

// ─── Quality ring (SVG) ──────────────────────────────────────────────────────

interface QualityRingProps {
  score?: number;
  size?: number;
}

function QualityRing({ score, size = 72 }: QualityRingProps) {
  const value = typeof score === 'number' ? Math.max(0, Math.min(100, score)) : 0;
  const tone = qualityTone(score);
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
      }}
      title={`Quality score ${value}/100 — ${tone.label}`}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={typeof score === 'number' ? offset : c}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 800, color: tone.color }}>
          {typeof score === 'number' ? Math.round(score) : '—'}
        </div>
        <div
          style={{
            fontSize: '8.5px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.4)',
            marginTop: '2px',
          }}
        >
          Quality
        </div>
      </div>
    </div>
  );
}

// ─── Mini stat ──────────────────────────────────────────────────────────────

interface StatProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  color?: string;
}

function Stat({ icon, label, value, color }: StatProps) {
  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: '90px',
        padding: '10px 12px',
        borderRadius: '10px',
        background: 'rgba(255,255,255,0.025)',
        border: `1px solid ${SUBTLE}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '10.5px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: SLATE,
          marginBottom: '4px',
        }}
      >
        {icon}
        {label}
      </div>
      <div style={{ fontSize: '15px', fontWeight: 700, color: color || 'rgba(255,255,255,0.92)', lineHeight: 1.1 }}>
        {value}
      </div>
    </div>
  );
}

// ─── Pill ────────────────────────────────────────────────────────────────────

function Pill({
  color,
  children,
  title,
  filled = false,
}: {
  color: string;
  children: React.ReactNode;
  title?: string;
  filled?: boolean;
}) {
  return (
    <span
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '11px',
        padding: '3px 8px',
        borderRadius: '6px',
        backgroundColor: filled ? color : `${color}1A`,
        color: filled ? '#0a0a0a' : color,
        border: filled ? 'none' : `1px solid ${color}33`,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        lineHeight: 1.3,
      }}
    >
      {children}
    </span>
  );
}

// ─── Tabbed nav ──────────────────────────────────────────────────────────────

type TabKey = 'code' | 'explanation' | 'issues' | 'metrics';

interface Tab {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  count?: number;
  countColor?: string;
}

function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: Tab[];
  active: TabKey;
  onChange: (k: TabKey) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '2px',
        padding: '0 16px',
        borderBottom: `1px solid ${SUBTLE}`,
        backgroundColor: 'rgba(255,255,255,0.015)',
        overflowX: 'auto',
      }}
    >
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '11px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${isActive ? YELLOW : 'transparent'}`,
              color: isActive ? YELLOW : 'rgba(255,255,255,0.55)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s',
            }}
          >
            {t.icon}
            {t.label}
            {typeof t.count === 'number' && t.count > 0 && (
              <span
                style={{
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '8px',
                  background: isActive ? `${YELLOW}26` : 'rgba(255,255,255,0.06)',
                  color: t.countColor || (isActive ? YELLOW : 'rgba(255,255,255,0.6)'),
                  fontWeight: 700,
                  minWidth: '18px',
                  textAlign: 'center',
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Action button ───────────────────────────────────────────────────────────

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void | Promise<void>;
  loading?: boolean;
  done?: boolean;
  tone?: 'default' | 'primary' | 'ghost';
  disabled?: boolean;
}

function ActionButton({ icon, label, onClick, loading, done, tone = 'default', disabled }: ActionButtonProps) {
  const isPrimary = tone === 'primary';
  const isGhost = tone === 'ghost';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '7px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: 600,
        cursor: loading || disabled ? 'wait' : 'pointer',
        border: isPrimary
          ? `1px solid ${YELLOW}73`
          : isGhost
          ? '1px solid transparent'
          : `1px solid ${SUBTLE}`,
        backgroundColor: isPrimary
          ? `${YELLOW}26`
          : isGhost
          ? 'transparent'
          : 'rgba(255,255,255,0.04)',
        color: isPrimary ? YELLOW : 'rgba(255,255,255,0.85)',
        opacity: loading || disabled ? 0.65 : 1,
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : done ? <Check size={13} color={GREEN} /> : icon}
      {label}
    </button>
  );
}

// ─── Lightweight AFL syntax highlighting ─────────────────────────────────────
// Token-pass over a single line of code. Avoids dragging in a heavyweight
// tokenizer for what is effectively a preview surface.

const AFL_KEYWORDS = new Set([
  'if', 'else', 'for', 'while', 'function', 'return', 'and', 'or', 'not',
  'true', 'false', 'True', 'False', 'NULL', 'Null',
]);

const AFL_BUILTINS = new Set([
  'Buy', 'Sell', 'Short', 'Cover', 'BuyPrice', 'SellPrice', 'ShortPrice', 'CoverPrice',
  'Open', 'High', 'Low', 'Close', 'Volume', 'OI', 'Avg',
  'RSI', 'MA', 'EMA', 'SMA', 'WMA', 'MACD', 'ATR', 'StochD', 'StochK', 'ADX',
  'BBandTop', 'BBandBot', 'Ref', 'Cross', 'IIf', 'Highest', 'Lowest', 'HighestBars',
  'LowestBars', 'Sum', 'LastValue', 'Foreign', 'SetForeign', 'RestorePriceArrays',
  'Param', 'ParamColor', 'ParamStr', 'ParamList', 'Optimize',
  'Plot', 'PlotShapes', 'PlotText', 'Title', 'EncodeColor',
  'TimeFrameSet', 'TimeFrameRestore', 'TimeFrameExpand', 'TimeFrameGetPrice',
  'SetTradeDelays', 'SetPositionSize', 'SetOption', 'ApplyStop',
  'BarsSince', 'Status', 'Name', 'Now', 'DateNum',
]);

function highlightAFLLine(line: string, key: number): React.ReactNode {
  if (!line) return <>&nbsp;</>;

  const parts: React.ReactNode[] = [];
  // Tokenize using a single regex that splits the line into known classes.
  // Order matters: comment > string > number > identifier > everything else.
  const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|([^\sA-Za-z0-9_"]+)|(\s+)/g;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(line)) !== null) {
    const [, comment, str, num, ident, punct, ws] = m;
    if (comment !== undefined) {
      parts.push(<span key={`${key}-${i++}`} style={{ color: '#7c8a99', fontStyle: 'italic' }}>{comment}</span>);
    } else if (str !== undefined) {
      parts.push(<span key={`${key}-${i++}`} style={{ color: '#a5d6ff' }}>{str}</span>);
    } else if (num !== undefined) {
      parts.push(<span key={`${key}-${i++}`} style={{ color: '#79c0ff' }}>{num}</span>);
    } else if (ident !== undefined) {
      if (AFL_KEYWORDS.has(ident)) {
        parts.push(<span key={`${key}-${i++}`} style={{ color: '#ff7b72', fontWeight: 600 }}>{ident}</span>);
      } else if (AFL_BUILTINS.has(ident)) {
        parts.push(<span key={`${key}-${i++}`} style={{ color: YELLOW }}>{ident}</span>);
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

// ─── Code view ───────────────────────────────────────────────────────────────

interface CodeViewProps {
  code: string;
  highlightLine?: number | null;
  onLineClick?: (line: number) => void;
}

const CodeView = React.forwardRef<HTMLPreElement, CodeViewProps>(function CodeView(
  { code, highlightLine, onLineClick },
  ref,
) {
  const lines = useMemo(() => (code || '').split('\n'), [code]);
  return (
    <pre
      ref={ref}
      style={{
        margin: 0,
        padding: 0,
        backgroundColor: PANEL,
        fontSize: '12.5px',
        fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        color: '#e6edf3',
        lineHeight: 1.6,
        maxHeight: '460px',
        overflow: 'auto',
        borderRadius: '10px',
        border: `1px solid ${SUBTLE}`,
      }}
    >
      {lines.map((ln, i) => {
        const lineNo = i + 1;
        const isHl = highlightLine === lineNo;
        return (
          <div
            key={i}
            data-line={lineNo}
            onClick={onLineClick ? () => onLineClick(lineNo) : undefined}
            style={{
              display: 'grid',
              gridTemplateColumns: '52px 1fr',
              backgroundColor: isHl ? 'rgba(254, 192, 15, 0.13)' : 'transparent',
              borderLeft: isHl ? `2px solid ${YELLOW}` : '2px solid transparent',
              transition: 'background-color 0.5s ease, border-color 0.3s ease',
              cursor: onLineClick ? 'pointer' : 'default',
            }}
          >
            <span
              style={{
                userSelect: 'none',
                textAlign: 'right',
                paddingRight: '12px',
                color: isHl ? YELLOW : 'rgba(255,255,255,0.22)',
                borderRight: '1px solid rgba(255,255,255,0.04)',
                fontWeight: isHl ? 700 : 400,
              }}
            >
              {lineNo}
            </span>
            <span style={{ padding: '0 14px', whiteSpace: 'pre' }}>{highlightAFLLine(ln, i)}</span>
          </div>
        );
      })}
    </pre>
  );
});

// ─── Bar (for metrics tab) ───────────────────────────────────────────────────

interface BarProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

function Bar({ label, value, total, color }: BarProps) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 32px', gap: '10px', alignItems: 'center' }}>
      <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.75)' }}>{label}</span>
      <div
        style={{
          height: '8px',
          borderRadius: '4px',
          backgroundColor: 'rgba(255,255,255,0.04)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${color}aa, ${color})`,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <span style={{ fontSize: '12px', color: SLATE, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
    </div>
  );
}

// ─── Main card ───────────────────────────────────────────────────────────────

const AFLStrategyCard: React.FC<Props> = ({ data }) => {
  const d = data || {};
  const validation: AFLValidation = d.validation || {};
  const stats: AFLStats = d.stats || {};
  const requested = new Set(d.actions || ['copy', 'download_afl', 'validate', 'debug', 'explain']);

  const errorCount = validation.errors ?? 0;
  const warningCount = validation.warnings ?? 0;
  const suggCount = validation.suggestions ?? 0;
  const infoCount = validation.info ?? 0;
  const isValid = validation.is_valid ?? (errorCount === 0);
  const issues = Array.isArray(validation.issues) ? validation.issues : [];

  // ─── Composite file bundle ────────────────────────────────────────────────
  // Backend emits `files: [{name, path, code, is_main}, ...]` for composite
  // strategies (main + Include/ helpers). When absent or single-file, the
  // card behaves exactly as before (one tab, no file strip).
  const files = useMemo<AFLFile[]>(() => {
    const raw = Array.isArray(d.files) ? d.files : [];
    const normalised: AFLFile[] = raw
      .filter((f) => f && typeof f.code === 'string')
      .map((f) => ({
        name: f.name || (f.path ? f.path.split(/[\\/]/).pop() || 'file.afl' : 'file.afl'),
        path: f.path || f.name || 'file.afl',
        code: f.code || '',
        is_main: !!f.is_main,
        description: f.description,
      }));
    // Synthesise a single-file bundle from afl_code if backend didn't send files.
    if (normalised.length === 0 && d.afl_code) {
      const fname = `${slugify(d.title || 'strategy')}.afl`;
      normalised.push({ name: fname, path: fname, code: d.afl_code, is_main: true });
    }
    // Ensure the main file is first.
    normalised.sort((a, b) => (a.is_main === b.is_main ? 0 : a.is_main ? -1 : 1));
    return normalised;
  }, [d.files, d.afl_code, d.title]);

  const isComposite = files.length > 1;

  // ─── Local state ───────────────────────────────────────────────────────────
  const [tab, setTab] = useState<TabKey>('code');
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadedAll, setDownloadedAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [revalidating, setRevalidating] = useState(false);
  const [reval, setReval] = useState<{ valid?: boolean; errors?: string[]; warnings?: string[] } | null>(null);
  const [debugging, setDebugging] = useState(false);
  const [debugFixed, setDebugFixed] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [extraExplanation, setExtraExplanation] = useState<string | null>(null);
  const [highlightLine, setHighlightLine] = useState<number | null>(null);
  const [issueFilter, setIssueFilter] = useState<'all' | 'error' | 'warning' | 'suggestion'>('all');

  const codeRef = useRef<HTMLPreElement | null>(null);

  // ─── Tab auto-switch when async result arrives ─────────────────────────────
  useEffect(() => {
    if (reval) setTab('issues');
  }, [reval]);
  useEffect(() => {
    if (debugFixed) setTab('code');
  }, [debugFixed]);
  useEffect(() => {
    if (extraExplanation) setTab('explanation');
  }, [extraExplanation]);

  // ─── Active file (composite-aware) ─────────────────────────────────────────
  const activeFile = files[activeFileIdx] || files[0];
  const activeCode = activeFile?.code || d.afl_code || '';
  const lineCount = useMemo(
    () => (activeCode ? activeCode.split('\n').length : (stats.line_count ?? 0)),
    [activeCode, stats.line_count],
  );

  // Clamp activeFileIdx if files array shrinks/grows between renders.
  useEffect(() => {
    if (activeFileIdx >= files.length && files.length > 0) {
      setActiveFileIdx(0);
    }
  }, [files.length, activeFileIdx]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(activeCode || '');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* swallow */
    }
  }, [activeCode]);

  const downloadAfl = useCallback(() => {
    try {
      const filename = activeFile?.name || `${slugify(d.title || 'strategy')}.afl`;
      const blob = new Blob([activeCode || ''], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloaded(true);
      window.setTimeout(() => setDownloaded(false), 1800);
    } catch {
      /* swallow */
    }
  }, [activeCode, activeFile, d.title]);

  /**
   * Bundle every file in the composite as a .zip mirroring AmiBroker's
   * on-disk layout. Files with paths like "Include/foo.afl" go into the
   * Include/ subfolder inside the zip. JSZip is loaded lazily so the
   * single-file render path doesn't pay the bundle cost.
   */
  const downloadAllZip = useCallback(async () => {
    if (files.length === 0) return;
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (const f of files) {
        const p = (f.path || f.name || 'file.afl').replace(/^[\\/]+/, '');
        zip.file(p, f.code || '');
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slugify(d.title || 'composite-strategy')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadedAll(true);
      window.setTimeout(() => setDownloadedAll(false), 1800);
    } catch {
      /* JSZip import or zip generation failed — silently fall back to single-file download */
      downloadAfl();
    }
  }, [files, d.title, downloadAfl]);

  const revalidate = useCallback(async () => {
    if (!d.afl_code) return;
    setRevalidating(true);
    try {
      const res = await apiClient.validateAFL(d.afl_code);
      setReval({
        valid: (res as any)?.valid,
        errors: (res as any)?.errors,
        warnings: (res as any)?.warnings,
      });
    } catch {
      setReval({ valid: false, errors: ['Validation request failed'] });
    } finally {
      setRevalidating(false);
    }
  }, [d.afl_code]);

  const debugCode = useCallback(async () => {
    if (!d.afl_code) return;
    setDebugging(true);
    try {
      const res = await apiClient.debugAFL(d.afl_code, undefined);
      const fixed = (res as any)?.fixed_code || (res as any)?.afl_code || (res as any)?.code;
      if (fixed) setDebugFixed(fixed);
    } catch {
      /* swallow */
    } finally {
      setDebugging(false);
    }
  }, [d.afl_code]);

  const explain = useCallback(async () => {
    if (!d.afl_code) return;
    setExplaining(true);
    try {
      const res = await apiClient.explainAFL(d.afl_code);
      const text = (res as any)?.explanation;
      if (text) setExtraExplanation(text);
    } catch {
      /* swallow */
    } finally {
      setExplaining(false);
    }
  }, [d.afl_code]);

  const saveHistory = useCallback(async () => {
    if (!d.afl_code) return;
    setSaving(true);
    try {
      await apiClient.saveAflHistory({
        prompt: d.title || 'Untitled strategy',
        afl_code: d.afl_code,
        explanation: d.explanation || '',
        strategy_type: d.strategy_type || '',
      } as any);
      setSaved(true);
    } catch {
      /* swallow */
    } finally {
      setSaving(false);
    }
  }, [d.afl_code, d.title, d.explanation, d.strategy_type]);

  const jumpToLine = useCallback((line: number) => {
    setTab('code');
    window.setTimeout(() => {
      setHighlightLine(line);
      const root = codeRef.current;
      if (root) {
        const target = root.querySelector<HTMLElement>(`[data-line="${line}"]`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      window.setTimeout(() => setHighlightLine(null), 1500);
    }, 80);
  }, []);

  // ─── Validation stripe ─────────────────────────────────────────────────────
  const stripe = useMemo(() => {
    if (errorCount > 0) {
      return {
        color: RED,
        bg: 'rgba(239, 68, 68, 0.10)',
        icon: <XCircle size={14} color={RED} />,
        label: `Invalid — ${errorCount} error${errorCount === 1 ? '' : 's'}${warningCount > 0 ? `, ${warningCount} warning${warningCount === 1 ? '' : 's'}` : ''}`,
      };
    }
    if (warningCount > 0) {
      return {
        color: AMBER,
        bg: 'rgba(210, 153, 34, 0.10)',
        icon: <AlertTriangle size={14} color={AMBER} />,
        label: `Valid with ${warningCount} warning${warningCount === 1 ? '' : 's'}`,
      };
    }
    return {
      color: GREEN,
      bg: 'rgba(34, 197, 94, 0.10)',
      icon: <CheckCircle size={14} color={GREEN} />,
      label: 'Validated — no issues',
    };
  }, [errorCount, warningCount]);

  // ─── Filtered issues ───────────────────────────────────────────────────────
  const filteredIssues = useMemo(() => {
    if (issueFilter === 'all') return issues;
    return issues.filter((i) => (i.severity || '').toUpperCase() === issueFilter.toUpperCase());
  }, [issues, issueFilter]);

  const qTone = qualityTone(validation.quality_score);
  const tabs: Tab[] = [
    { key: 'code', label: 'Code', icon: <Code2 size={13} /> },
    { key: 'explanation', label: 'Explanation', icon: <BookOpen size={13} /> },
    {
      key: 'issues',
      label: 'Issues',
      icon: <AlertTriangle size={13} />,
      count: issues.length,
      countColor: errorCount > 0 ? RED : warningCount > 0 ? AMBER : undefined,
    },
    { key: 'metrics', label: 'Metrics', icon: <Activity size={13} /> },
  ];

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '14px',
        overflow: 'hidden',
        border: `1px solid ${YELLOW}33`,
        maxWidth: '820px',
        marginTop: '8px',
        backgroundColor: SHELL,
        boxShadow: '0 4px 28px rgba(0,0,0,0.4), 0 0 0 1px rgba(254,192,15,0.04)',
      }}
    >
      {/* ─── Hero header ──────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          padding: '18px 18px 16px 18px',
          background: `
            radial-gradient(ellipse 80% 140% at 0% 0%, rgba(254, 192, 15, 0.18) 0%, transparent 55%),
            radial-gradient(ellipse 60% 100% at 100% 0%, rgba(254, 192, 15, 0.08) 0%, transparent 60%),
            linear-gradient(180deg, rgba(254, 192, 15, 0.04) 0%, transparent 100%)
          `,
          borderBottom: `1px solid ${SUBTLE}`,
        }}
      >
        {/* Subtle diagonal stripe overlay */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(135deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 14px)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${YELLOW}33 0%, ${YELLOW}14 100%)`,
              border: `1px solid ${YELLOW}55`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 4px 14px ${YELLOW}1A`,
            }}
          >
            <Wand2 size={18} color={YELLOW} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: YELLOW,
                  opacity: 0.85,
                }}
              >
                AmiBroker AFL
              </span>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>·</span>
              <span style={{ fontSize: '10.5px', color: SLATE, fontWeight: 500 }}>
                Generated strategy
              </span>
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: '17px',
                color: 'rgba(255,255,255,0.97)',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginBottom: '4px',
              }}
              title={d.title || 'AFL Strategy'}
            >
              {d.title || 'AFL Strategy'}
            </div>
            {d.description && (
              <div
                style={{
                  fontSize: '12.5px',
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.5,
                  marginBottom: '10px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {d.description}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              {d.strategy_type && (
                <Pill color={YELLOW} title="Strategy type">
                  <Target size={11} /> {formatStrategyType(d.strategy_type)}
                </Pill>
              )}
              {d.trade_timing && (
                <Pill color={INDIGO} title="Trade timing">
                  <Clock size={11} /> {formatTradeTiming(d.trade_timing)}
                </Pill>
              )}
              {stats.model && (
                <Pill color={SLATE} title="Generation model">
                  <Cpu size={11} /> {stats.model}
                </Pill>
              )}
              {typeof stats.generation_time_ms === 'number' && (
                <Pill color={SLATE} title="Generation time">
                  <Zap size={11} /> {formatTime(stats.generation_time_ms)}
                </Pill>
              )}
            </div>
          </div>

          {typeof validation.quality_score === 'number' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <QualityRing score={validation.quality_score} />
              <div style={{ fontSize: '10.5px', color: qTone.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {qTone.label}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Validation stripe ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '9px 18px',
          backgroundColor: stripe.bg,
          borderBottom: `1px solid ${SUBTLE}`,
          borderLeft: `3px solid ${stripe.color}`,
        }}
      >
        {stripe.icon}
        <span style={{ fontSize: '12.5px', color: stripe.color, fontWeight: 700 }}>{stripe.label}</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {errorCount > 0 && <Pill color={RED}>{errorCount} E</Pill>}
          {warningCount > 0 && <Pill color={AMBER}>{warningCount} W</Pill>}
          {suggCount > 0 && <Pill color={INDIGO}>{suggCount} S</Pill>}
          {infoCount > 0 && <Pill color={BLUE}>{infoCount} I</Pill>}
        </div>
      </div>

      {/* ─── Tab bar ──────────────────────────────────────────────────────── */}
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {/* ─── Tab body ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px' }}>
        {tab === 'code' && (
          <div>
            {isComposite && (
              <FileTabStrip
                files={files}
                activeIdx={activeFileIdx}
                onChange={setActiveFileIdx}
              />
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
                marginTop: isComposite ? '10px' : 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <FileText size={12} color={SLATE} />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: isComposite ? YELLOW : SLATE,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '320px',
                  }}
                  title={activeFile?.path || 'AFL source'}
                >
                  {isComposite ? (activeFile?.path || activeFile?.name || 'AFL source') : 'AFL source'}
                </span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>
                  · {lineCount} line{lineCount === 1 ? '' : 's'}
                </span>
                {isComposite && (
                  <span
                    style={{
                      fontSize: '10.5px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(254,192,15,0.10)',
                      border: `1px solid ${YELLOW}33`,
                      color: YELLOW,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      flexShrink: 0,
                    }}
                    title="This strategy spans multiple AFL files"
                  >
                    Composite · {files.length} files
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                {requested.has('copy') && (
                  <ActionButton icon={<Copy size={12} />} label={copied ? 'Copied' : 'Copy'} onClick={copyCode} done={copied} />
                )}
                {requested.has('download_afl') && (
                  <ActionButton
                    icon={<Download size={12} />}
                    label={downloaded ? 'Downloaded' : isComposite ? 'Download file' : 'Download .afl'}
                    onClick={downloadAfl}
                    done={downloaded}
                  />
                )}
                {isComposite && (
                  <ActionButton
                    icon={<Download size={12} />}
                    label={downloadedAll ? 'Bundled' : 'Download all (.zip)'}
                    onClick={downloadAllZip}
                    done={downloadedAll}
                    tone="primary"
                  />
                )}
              </div>
            </div>
            <CodeView
              ref={codeRef}
              code={activeCode || '/* No AFL code provided */'}
              highlightLine={highlightLine}
              onLineClick={(ln) => setHighlightLine(ln)}
            />
            {debugFixed && (
              <div style={{ marginTop: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bug size={12} color={INDIGO} />
                    <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: INDIGO }}>
                      Debugger output
                    </span>
                  </div>
                  <ActionButton
                    icon={<Copy size={12} />}
                    label="Copy fixed"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(debugFixed);
                      } catch {
                        /* */
                      }
                    }}
                  />
                </div>
                <CodeView code={debugFixed} />
              </div>
            )}
          </div>
        )}

        {tab === 'explanation' && (
          <div>
            {(d.explanation || extraExplanation) ? (
              <div
                style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.82)',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  padding: '4px 2px',
                }}
              >
                {d.explanation && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '3px',
                        alignSelf: 'stretch',
                        borderRadius: '2px',
                        background: `linear-gradient(180deg, ${YELLOW} 0%, ${YELLOW}22 100%)`,
                        flexShrink: 0,
                      }}
                    />
                    <div>{d.explanation}</div>
                  </div>
                )}
                {extraExplanation && (
                  <div
                    style={{
                      marginTop: d.explanation ? '14px' : 0,
                      paddingTop: d.explanation ? '14px' : 0,
                      borderTop: d.explanation ? `1px solid ${SUBTLE}` : 'none',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: SLATE,
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Sparkles size={11} color={BLUE} />
                      Re-explained on request
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.72)' }}>{extraExplanation}</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: SLATE, fontSize: '12.5px' }}>
                <BookOpen size={28} color="rgba(255,255,255,0.15)" style={{ marginBottom: '8px' }} />
                <div style={{ marginBottom: '10px' }}>No explanation was generated.</div>
                {requested.has('explain') && (
                  <ActionButton
                    icon={<BookOpen size={12} />}
                    label={explaining ? 'Explaining' : 'Generate explanation'}
                    onClick={explain}
                    loading={explaining}
                    tone="primary"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'issues' && (
          <div>
            {issues.length > 0 ? (
              <>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <FilterChip
                    active={issueFilter === 'all'}
                    onClick={() => setIssueFilter('all')}
                    color={YELLOW}
                  >
                    All ({issues.length})
                  </FilterChip>
                  {errorCount > 0 && (
                    <FilterChip
                      active={issueFilter === 'error'}
                      onClick={() => setIssueFilter('error')}
                      color={RED}
                    >
                      Errors ({errorCount})
                    </FilterChip>
                  )}
                  {warningCount > 0 && (
                    <FilterChip
                      active={issueFilter === 'warning'}
                      onClick={() => setIssueFilter('warning')}
                      color={AMBER}
                    >
                      Warnings ({warningCount})
                    </FilterChip>
                  )}
                  {suggCount > 0 && (
                    <FilterChip
                      active={issueFilter === 'suggestion'}
                      onClick={() => setIssueFilter('suggestion')}
                      color={INDIGO}
                    >
                      Suggestions ({suggCount})
                    </FilterChip>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredIssues.map((iss, i) => (
                    <IssueRow key={i} issue={iss} onJump={jumpToLine} />
                  ))}
                  {filteredIssues.length === 0 && (
                    <div style={{ padding: '14px', textAlign: 'center', color: SLATE, fontSize: '12.5px' }}>
                      No issues match the current filter.
                    </div>
                  )}
                </div>
                {reval && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${reval.valid ? GREEN : RED}33`,
                      background: `${reval.valid ? GREEN : RED}10`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      {reval.valid ? <CheckCircle size={13} color={GREEN} /> : <XCircle size={13} color={RED} />}
                      <span style={{ fontSize: '12px', fontWeight: 700, color: reval.valid ? GREEN : RED }}>
                        Re-validation: {reval.valid ? 'clean' : 'issues found'}
                      </span>
                    </div>
                    {(reval.errors || []).map((e, i) => (
                      <div key={`e-${i}`} style={{ fontSize: '12px', color: '#f97583', marginBottom: '2px' }}>
                        • {e}
                      </div>
                    ))}
                    {(reval.warnings || []).map((w, i) => (
                      <div key={`w-${i}`} style={{ fontSize: '12px', color: AMBER, marginBottom: '2px' }}>
                        • {w}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: SLATE, fontSize: '12.5px' }}>
                <CheckCircle size={28} color={GREEN} style={{ marginBottom: '8px', opacity: 0.6 }} />
                <div>No issues detected by the validator.</div>
              </div>
            )}
          </div>
        )}

        {tab === 'metrics' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <Stat
                icon={<Hash size={11} />}
                label="Lines"
                value={lineCount}
              />
              <Stat
                icon={<Shield size={11} />}
                label="Quality"
                value={typeof validation.quality_score === 'number' ? `${Math.round(validation.quality_score)} / 100` : '—'}
                color={qTone.color}
              />
              <Stat
                icon={<Zap size={11} />}
                label="Generation"
                value={formatTime(stats.generation_time_ms)}
              />
              <Stat
                icon={<AlertTriangle size={11} />}
                label="Issues"
                value={issues.length}
                color={issues.length === 0 ? GREEN : errorCount > 0 ? RED : AMBER}
              />
            </div>

            {(errorCount + warningCount + suggCount + infoCount) > 0 && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: `1px solid ${SUBTLE}`,
                  background: 'rgba(255,255,255,0.02)',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: SLATE,
                    marginBottom: '10px',
                  }}
                >
                  Issue breakdown
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Bar label="Errors" value={errorCount} total={Math.max(1, errorCount + warningCount + suggCount + infoCount)} color={RED} />
                  <Bar label="Warnings" value={warningCount} total={Math.max(1, errorCount + warningCount + suggCount + infoCount)} color={AMBER} />
                  <Bar label="Suggestions" value={suggCount} total={Math.max(1, errorCount + warningCount + suggCount + infoCount)} color={INDIGO} />
                  <Bar label="Info" value={infoCount} total={Math.max(1, errorCount + warningCount + suggCount + infoCount)} color={BLUE} />
                </div>
              </div>
            )}

            <div
              style={{
                padding: '12px',
                borderRadius: '10px',
                border: `1px solid ${SUBTLE}`,
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: SLATE,
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Layers size={11} />
                Structure
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <StructureFlag ok={!!stats.has_buy_sell} label="Buy / Sell signals" />
                <StructureFlag ok={!!stats.has_plot} label="Plot functions" />
                <StructureFlag ok={!!stats.has_sections} label="Section markers" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Action footer ────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: `1px solid ${SUBTLE}`,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          backgroundColor: 'rgba(255,255,255,0.015)',
        }}
      >
        {requested.has('validate') && (
          <ActionButton
            icon={<Shield size={13} />}
            label={revalidating ? 'Validating' : 'Validate again'}
            onClick={revalidate}
            loading={revalidating}
            tone="primary"
          />
        )}
        {requested.has('debug') && (
          <ActionButton
            icon={<Bug size={13} />}
            label={debugging ? 'Debugging' : 'Debug'}
            onClick={debugCode}
            loading={debugging}
          />
        )}
        {requested.has('explain') && (
          <ActionButton
            icon={<BookOpen size={13} />}
            label={explaining ? 'Explaining' : 'Explain'}
            onClick={explain}
            loading={explaining}
          />
        )}
        <div style={{ flex: 1 }} />
        <ActionButton
          icon={<Save size={13} />}
          label={saved ? 'Saved to history' : saving ? 'Saving' : 'Save to history'}
          onClick={saveHistory}
          loading={saving}
          done={saved}
        />
      </div>
    </div>
  );
};

// ─── Sub-components used inside the main card ────────────────────────────────

/**
 * Horizontal scrollable file-tab strip for composite AFL bundles.
 * Mirrors a typical IDE file-tab row: filename + active underline,
 * `Include/` subfolder prefix shown muted, "main" badge on the entry-point.
 */
function FileTabStrip({
  files,
  activeIdx,
  onChange,
}: {
  files: AFLFile[];
  activeIdx: number;
  onChange: (idx: number) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="AFL files"
      style={{
        display: 'flex',
        gap: '2px',
        padding: '8px 4px 0 4px',
        borderBottom: `1px solid ${SUBTLE}`,
        backgroundColor: 'rgba(255,255,255,0.015)',
        borderRadius: '8px 8px 0 0',
        overflowX: 'auto',
      }}
    >
      {files.map((f, i) => {
        const isActive = i === activeIdx;
        const path = f.path || f.name;
        const inSubfolder = path.includes('/') || path.includes('\\');
        const folder = inSubfolder ? path.replace(/[\\/][^\\/]+$/, '').replace(/\\/g, '/') : '';
        const baseName = path.split(/[\\/]/).pop() || f.name;
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(i)}
            title={path}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 11px 8px 11px',
              fontSize: '11.5px',
              fontWeight: 600,
              background: isActive ? 'rgba(254, 192, 15, 0.10)' : 'transparent',
              border: 'none',
              borderBottom: `2px solid ${isActive ? YELLOW : 'transparent'}`,
              borderRadius: '6px 6px 0 0',
              color: isActive ? YELLOW : 'rgba(255,255,255,0.65)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.12s ease',
              minWidth: 0,
              maxWidth: '260px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <FileText size={12} color={isActive ? YELLOW : 'rgba(255,255,255,0.45)'} />
            {folder && (
              <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                {folder}/
              </span>
            )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{baseName}</span>
            {f.is_main && (
              <span
                style={{
                  fontSize: '9.5px',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  backgroundColor: isActive ? `${YELLOW}33` : 'rgba(255,255,255,0.06)',
                  color: isActive ? YELLOW : 'rgba(255,255,255,0.55)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                main
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '5px 10px',
        fontSize: '11.5px',
        fontWeight: 600,
        cursor: 'pointer',
        background: active ? `${color}22` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${active ? `${color}66` : SUBTLE}`,
        borderRadius: '6px',
        color: active ? color : 'rgba(255,255,255,0.6)',
        transition: 'all 0.15s ease',
      }}
    >
      {children}
    </button>
  );
}

function StructureFlag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '11.5px',
        padding: '5px 9px',
        borderRadius: '6px',
        background: ok ? `${GREEN}14` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${ok ? `${GREEN}33` : SUBTLE}`,
        color: ok ? GREEN : SLATE,
        fontWeight: 600,
      }}
    >
      {ok ? <CheckCircle size={11} /> : <XCircle size={11} color="rgba(255,255,255,0.3)" />}
      {label}
    </span>
  );
}

function IssueRow({ issue, onJump }: { issue: AFLIssue; onJump?: (line: number) => void }) {
  const c = severityColor(issue.severity);
  const [copiedFix, setCopiedFix] = useState(false);

  return (
    <div
      style={{
        padding: '11px 13px',
        borderRadius: '10px',
        backgroundColor: 'rgba(255,255,255,0.025)',
        border: `1px solid ${SUBTLE}`,
        borderLeft: `3px solid ${c}`,
        transition: 'background-color 0.15s',
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
              padding: '2px 7px',
              borderRadius: '5px',
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
              padding: '2px 7px',
              borderRadius: '5px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 600,
            }}
            title="Cascades from an earlier issue"
          >
            cascade
          </span>
        )}
        {typeof issue.line === 'number' && (
          <span style={{ fontSize: '11px', color: SLATE, marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
            Line {issue.line}
          </span>
        )}
      </div>
      <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.88)', lineHeight: 1.55 }}>
        {issue.message || 'No message'}
      </div>
      {issue.suggestion && (
        <div
          style={{
            marginTop: '8px',
            paddingLeft: '10px',
            borderLeft: '2px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, flex: 1 }}>
            <span style={{ color: YELLOW, fontWeight: 700 }}>Suggestion: </span>
            {issue.suggestion}
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(issue.suggestion || '');
                setCopiedFix(true);
                window.setTimeout(() => setCopiedFix(false), 1600);
              } catch {
                /* */
              }
            }}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${SUBTLE}`,
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 600,
              color: copiedFix ? GREEN : 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0,
            }}
          >
            {copiedFix ? <Check size={11} /> : <Copy size={11} />}
            {copiedFix ? 'Copied' : 'Copy fix'}
          </button>
        </div>
      )}
      {typeof issue.line === 'number' && onJump && (
        <div style={{ marginTop: '8px' }}>
          <button
            type="button"
            onClick={() => onJump(issue.line as number)}
            style={{
              background: 'none',
              border: `1px solid ${SUBTLE}`,
              borderRadius: '6px',
              padding: '3px 9px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.75)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <ChevronRight size={11} />
            Jump to line
          </button>
        </div>
      )}
    </div>
  );
}

export default AFLStrategyCard;
export { AFLStrategyCard };

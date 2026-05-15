'use client';

/**
 * AFLStrategyCard
 * ---------------
 * Generative-UI card for the unified AFL pipeline (`generate_afl_code` /
 * `generate_afl_with_skill` / `afl-developer` skill / `POST /afl/generate`).
 *
 * Consumes the `afl_strategy` GenUI envelope:
 *
 *   {
 *     type: "afl_strategy",
 *     data: {
 *       title, strategy_type, trade_timing, afl_code, explanation,
 *       validation: { is_valid, errors, warnings, quality_score, issues[] },
 *       stats:      { generation_time_ms, model },
 *       actions:    ["copy", "download_afl", "validate", "debug", "explain", ...]
 *     }
 *   }
 *
 * Design constraints (per product brief):
 *   - Absolutely NO emoji characters anywhere — icons come from lucide-react only.
 *   - No raw JSON / envelope leakage — every field is rendered through typed
 *     React nodes; the code block is the only place that ever shows raw text,
 *     and it's wrapped in a <pre> so brace characters can never be reparsed.
 *   - Potomac yellow accent (#FEC00F) consistent with sibling cards
 *     (PptxGenerationCard, DocxGenerationCard, AFLCodeCard).
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
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
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AFLIssue {
  line?: number;
  severity?: 'ERROR' | 'WARNING' | 'INFO' | string;
  category?: string;
  message?: string;
  suggestion?: string;
}

interface AFLStrategyData {
  title?: string;
  strategy_type?: string;
  trade_timing?: string;
  afl_code?: string;
  explanation?: string;
  validation?: {
    is_valid?: boolean;
    errors?: number;
    warnings?: number;
    quality_score?: number;
    issues?: AFLIssue[];
  };
  stats?: {
    generation_time_ms?: number;
    model?: string;
  };
  actions?: string[];
}

interface Props {
  data?: AFLStrategyData;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const YELLOW = '#FEC00F';
const GREEN = '#22c55e';
const AMBER = '#d29922';
const RED = '#ef4444';
const BLUE = '#3b82f6';

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
  return BLUE;
}

function severityLabel(sev?: string): string {
  const s = (sev || '').toUpperCase();
  if (s === 'ERROR') return 'Error';
  if (s === 'WARNING') return 'Warning';
  if (s === 'INFO') return 'Info';
  return 'Note';
}

function qualityColor(score?: number): { bg: string; fg: string } {
  if (typeof score !== 'number') return { bg: 'rgba(255,255,255,0.06)', fg: 'rgba(255,255,255,0.55)' };
  if (score >= 85) return { bg: 'rgba(34, 197, 94, 0.15)', fg: GREEN };
  if (score >= 60) return { bg: 'rgba(210, 153, 34, 0.18)', fg: AMBER };
  return { bg: 'rgba(239, 68, 68, 0.15)', fg: RED };
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

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

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
          fontSize: '13px',
          fontWeight: 600,
          textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {title}
        </span>
        {rightMeta && <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{rightMeta}</span>}
      </button>
      {open && <div style={{ padding: '0 16px 14px 16px' }}>{children}</div>}
    </div>
  );
}

interface CodeBlockProps {
  code: string;
  highlightLine?: number | null;
  onLineClick?: (line: number) => void;
}

const CodeBlock = React.forwardRef<HTMLPreElement, CodeBlockProps>(function CodeBlock(
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
        backgroundColor: '#0d1117',
        fontSize: '12px',
        fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        color: '#e6edf3',
        lineHeight: 1.55,
        maxHeight: '420px',
        overflow: 'auto',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.06)',
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
              backgroundColor: isHl ? 'rgba(254, 192, 15, 0.12)' : 'transparent',
              transition: 'background-color 0.6s ease',
              cursor: onLineClick ? 'pointer' : 'default',
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
            <span style={{ padding: '0 12px', whiteSpace: 'pre' }}>{ln || ' '}</span>
          </div>
        );
      })}
    </pre>
  );
});

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void | Promise<void>;
  loading?: boolean;
  done?: boolean;
  tone?: 'default' | 'primary';
}

function ActionButton({ icon, label, onClick, loading, done, tone = 'default' }: ActionButtonProps) {
  const isPrimary = tone === 'primary';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: 600,
        cursor: loading ? 'wait' : 'pointer',
        border: isPrimary
          ? '1px solid rgba(254,192,15,0.45)'
          : '1px solid rgba(255,255,255,0.08)',
        backgroundColor: isPrimary
          ? 'rgba(254,192,15,0.15)'
          : 'rgba(255,255,255,0.04)',
        color: isPrimary ? YELLOW : 'rgba(255,255,255,0.85)',
        opacity: loading ? 0.7 : 1,
        transition: 'all 0.15s ease',
      }}
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : done ? <Check size={13} color={GREEN} /> : icon}
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main card
// ─────────────────────────────────────────────────────────────────────────────

const AFLStrategyCard: React.FC<Props> = ({ data }) => {
  const d = data || {};
  const validation = d.validation || {};
  const stats = d.stats || {};
  const actions = d.actions || ['copy', 'download_afl', 'validate', 'debug', 'explain'];

  const errorCount = validation.errors ?? 0;
  const warningCount = validation.warnings ?? 0;
  const isValid = validation.is_valid ?? (errorCount === 0);
  const issues = Array.isArray(validation.issues) ? validation.issues : [];

  const stripeColor = errorCount > 0 ? RED : warningCount > 0 ? AMBER : GREEN;
  const stripeBg =
    errorCount > 0
      ? 'rgba(239, 68, 68, 0.10)'
      : warningCount > 0
      ? 'rgba(210, 153, 34, 0.10)'
      : 'rgba(34, 197, 94, 0.10)';
  const stripeText =
    errorCount > 0
      ? `${errorCount} error${errorCount === 1 ? '' : 's'}, ${warningCount} warning${warningCount === 1 ? '' : 's'}`
      : warningCount > 0
      ? `Valid  —  0 errors, ${warningCount} warning${warningCount === 1 ? '' : 's'}`
      : 'Valid  —  no issues';

  // ── local state ───────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [revalidating, setRevalidating] = useState(false);
  const [reval, setReval] = useState<{ valid?: boolean; errors?: string[]; warnings?: string[] } | null>(null);
  const [debugging, setDebugging] = useState(false);
  const [debugFixed, setDebugFixed] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [extraExplanation, setExtraExplanation] = useState<string | null>(null);
  const [highlightLine, setHighlightLine] = useState<number | null>(null);

  const codeRef = useRef<HTMLPreElement | null>(null);

  // ── actions ───────────────────────────────────────────────────────────────
  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(d.afl_code || '');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* swallow */
    }
  }, [d.afl_code]);

  const downloadAfl = useCallback(() => {
    try {
      const filename = `${slugify(d.title || 'strategy')}.afl`;
      const blob = new Blob([d.afl_code || ''], { type: 'text/plain;charset=utf-8' });
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
  }, [d.afl_code, d.title]);

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

  // ── line jump (issue click) ───────────────────────────────────────────────
  const jumpToLine = useCallback((line: number) => {
    setHighlightLine(line);
    const root = codeRef.current;
    if (root) {
      const target = root.querySelector<HTMLElement>(`[data-line="${line}"]`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    window.setTimeout(() => setHighlightLine(null), 1400);
  }, []);

  // ── derived meta line ─────────────────────────────────────────────────────
  const metaParts: string[] = [];
  if (d.strategy_type) metaParts.push(formatStrategyType(d.strategy_type));
  if (d.trade_timing) metaParts.push(formatTradeTiming(d.trade_timing));
  if (stats.model) metaParts.push(String(stats.model));
  if (typeof stats.generation_time_ms === 'number') {
    metaParts.push(`${(stats.generation_time_ms / 1000).toFixed(1)}s`);
  }

  const qColor = qualityColor(validation.quality_score);
  const showActions = new Set(actions);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(254, 192, 15, 0.3)',
        maxWidth: '760px',
        marginTop: '8px',
        backgroundColor: '#0a0a0a',
        boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
      }}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '14px 16px',
          background:
            'linear-gradient(135deg, rgba(254, 192, 15, 0.15) 0%, rgba(254, 192, 15, 0.03) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: 'rgba(254,192,15,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Wand2 size={15} color={YELLOW} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: '14px',
                color: 'rgba(255,255,255,0.95)',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={d.title || 'AFL Strategy'}
            >
              {d.title || 'AFL Strategy'}
            </div>
            {metaParts.length > 0 && (
              <div
                style={{
                  marginTop: '3px',
                  fontSize: '11.5px',
                  color: 'rgba(255,255,255,0.55)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  alignItems: 'center',
                }}
              >
                {metaParts.map((p, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>}
                    <span>{p}</span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
          {typeof validation.quality_score === 'number' && (
            <div
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: qColor.bg,
                color: qColor.fg,
                fontSize: '12px',
                fontWeight: 700,
                lineHeight: 1,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              title="Quality score (0-100)"
            >
              {validation.quality_score}
              <span style={{ opacity: 0.6, fontWeight: 500 }}> / 100</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Validation stripe ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: stripeBg,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          borderLeft: `3px solid ${stripeColor}`,
        }}
      >
        {errorCount > 0 ? (
          <XCircle size={14} color={stripeColor} />
        ) : warningCount > 0 ? (
          <AlertTriangle size={14} color={stripeColor} />
        ) : (
          <CheckCircle size={14} color={stripeColor} />
        )}
        <span style={{ fontSize: '12px', color: stripeColor, fontWeight: 600 }}>
          {isValid && errorCount === 0 ? stripeText : `Invalid  —  ${stripeText}`}
        </span>
      </div>

      {/* ── Code block ───────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 4px 16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            AFL Source
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {showActions.has('copy') && (
              <ActionButton icon={<Copy size={13} />} label={copied ? 'Copied' : 'Copy'} onClick={copyCode} done={copied} />
            )}
            {showActions.has('download_afl') && (
              <ActionButton
                icon={<Download size={13} />}
                label={downloaded ? 'Downloaded' : 'Download .afl'}
                onClick={downloadAfl}
                done={downloaded}
              />
            )}
          </div>
        </div>
        <CodeBlock
          ref={codeRef}
          code={d.afl_code || '/* No AFL code provided */'}
          highlightLine={highlightLine}
          onLineClick={(ln) => setHighlightLine(ln)}
        />
      </div>

      {/* ── Explanation (collapsed by default) ───────────────────────────── */}
      {(d.explanation || extraExplanation) && (
        <Collapsible title="Explanation" defaultOpen={false}>
          <div
            style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.78)',
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <BookOpen size={14} color="rgba(255,255,255,0.45)" style={{ marginTop: '3px', flexShrink: 0 }} />
              <div>{d.explanation || extraExplanation}</div>
            </div>
            {extraExplanation && d.explanation && (
              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
                  Additional explanation
                </div>
                {extraExplanation}
              </div>
            )}
          </div>
        </Collapsible>
      )}

      {/* ── Issues panel ─────────────────────────────────────────────────── */}
      {issues.length > 0 && (
        <Collapsible
          title="Issues"
          defaultOpen={errorCount > 0}
          rightMeta={`${issues.length} item${issues.length === 1 ? '' : 's'}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {issues.map((iss, i) => {
              const sev = (iss.severity || '').toUpperCase();
              const c = severityColor(iss.severity);
              const Icon = sev === 'ERROR' ? XCircle : sev === 'WARNING' ? AlertTriangle : Info;
              return (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderLeft: `3px solid ${c}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Icon size={13} color={c} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: c, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {severityLabel(iss.severity)}
                    </span>
                    {iss.category && (
                      <span
                        style={{
                          fontSize: '10.5px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          color: 'rgba(255,255,255,0.55)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          fontWeight: 600,
                        }}
                      >
                        {iss.category}
                      </span>
                    )}
                    {typeof iss.line === 'number' && (
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginLeft: 'auto' }}>
                        Line {iss.line}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                    {iss.message || 'No message'}
                  </div>
                  {iss.suggestion && (
                    <div
                      style={{
                        marginTop: '6px',
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.6)',
                        lineHeight: 1.5,
                        paddingLeft: '10px',
                        borderLeft: '2px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <span style={{ color: YELLOW, fontWeight: 600 }}>Suggestion:</span> {iss.suggestion}
                    </div>
                  )}
                  {typeof iss.line === 'number' && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => jumpToLine(iss.line as number)}
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
            })}
          </div>
        </Collapsible>
      )}

      {/* ── Re-validation result (if user clicked Validate) ──────────────── */}
      {reval && (
        <Collapsible
          title="Re-validation result"
          defaultOpen
          rightMeta={reval.valid ? 'Valid' : 'Invalid'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {reval.valid ? <CheckCircle size={14} color={GREEN} /> : <XCircle size={14} color={RED} />}
            <span style={{ fontSize: '12.5px', color: reval.valid ? GREEN : RED, fontWeight: 600 }}>
              {reval.valid ? 'Validator returned clean' : 'Validator returned issues'}
            </span>
          </div>
          {(reval.errors || []).map((e, i) => (
            <div key={`e-${i}`} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', fontSize: '12px', color: '#f97583', marginBottom: '4px' }}>
              <XCircle size={12} style={{ flexShrink: 0, marginTop: '2px' }} /> {e}
            </div>
          ))}
          {(reval.warnings || []).map((w, i) => (
            <div key={`w-${i}`} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', fontSize: '12px', color: AMBER, marginBottom: '4px' }}>
              <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: '2px' }} /> {w}
            </div>
          ))}
        </Collapsible>
      )}

      {/* ── Debug result ─────────────────────────────────────────────────── */}
      {debugFixed && (
        <Collapsible title="Debugged code" defaultOpen rightMeta="Fixed">
          <CodeBlock code={debugFixed} />
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
            <ActionButton
              icon={<Copy size={13} />}
              label="Copy fixed code"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(debugFixed);
                } catch {
                  /* */
                }
              }}
            />
          </div>
        </Collapsible>
      )}

      {/* ── Action bar ───────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          backgroundColor: 'rgba(255,255,255,0.015)',
        }}
      >
        {showActions.has('validate') && (
          <ActionButton
            icon={<Shield size={13} />}
            label={revalidating ? 'Validating' : 'Validate again'}
            onClick={revalidate}
            loading={revalidating}
            tone="primary"
          />
        )}
        {showActions.has('debug') && (
          <ActionButton
            icon={<Bug size={13} />}
            label={debugging ? 'Debugging' : 'Debug'}
            onClick={debugCode}
            loading={debugging}
          />
        )}
        {showActions.has('explain') && (
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
          label={saved ? 'Saved' : saving ? 'Saving' : 'Save to history'}
          onClick={saveHistory}
          loading={saving}
          done={saved}
        />
      </div>
    </div>
  );
};

export default AFLStrategyCard;
export { AFLStrategyCard };

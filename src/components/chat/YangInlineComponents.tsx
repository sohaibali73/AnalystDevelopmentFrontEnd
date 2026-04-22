'use client';

/**
 * Inline / inside-message YANG components:
 *   • CompletionVerificationBadge — badge under assistant message
 *   • CompactionBanner            — divider above compacted messages
 *   • TokenCounterBadge           — live token / context window counter
 *   • SubagentProgress            — renders spawn_subagents tool output
 *   • BackgroundTaskCard          — renders tool output w/ task_id polling
 *   • ToolSearchChip              — transient shimmer while tools lazy-load
 */

import React from 'react';
import {
  CheckCircle2, AlertCircle, Info, Archive,
  Search as SearchIcon, GitBranch, Clock, Download, AlertTriangle,
  Gauge,
} from 'lucide-react';
import { useYangBackgroundTasks } from '@/contexts/YangBackgroundTasksContext';
import type { YangVerificationEvent } from '@/types/yang';
import type { YangTokenUsage } from '@/hooks/useYangStreamEvents';

// ─── Shared token helpers ────────────────────────────────────────────────────

function fmtTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ─── CompletionVerificationBadge ────────────────────────────────────────────

export function CompletionVerificationBadge({
  isDark, verification,
}: {
  isDark: boolean;
  verification: YangVerificationEvent | null;
}) {
  if (!verification) return null;

  const verified = verification.verified;
  const color  = verified ? '#10B981' : '#F59E0B';
  const Icon   = verified ? CheckCircle2 : AlertCircle;
  const label  = verified ? 'Verified' : 'Revised';
  const title  = verified
    ? 'Response verified against your request'
    : `Verifier triggered a revision — ${verification.critique}`;

  return (
    <span
      title={title}
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:            5,
        padding:       '3px 10px 3px 7px',
        borderRadius:   999,
        border:        `1px solid ${color}40`,
        background:     color + '12',
        color,
        fontSize:       10,
        fontWeight:     700,
        fontFamily:    "'DM Mono', monospace",
        letterSpacing: '0.07em',
        textTransform: 'uppercase' as const,
        whiteSpace:    'nowrap' as const,
        boxShadow:     `0 0 0 3px ${color}0A`,
        transition:    'box-shadow .2s',
      }}
    >
      <Icon size={10} strokeWidth={2.5} />
      {label}
    </span>
  );
}

// ─── CompactionBanner ────────────────────────────────────────────────────────

export function CompactionBanner({
  isDark, count,
}: {
  isDark: boolean;
  count: number;
}) {
  if (count <= 0) return null;

  const lineColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const textColor = isDark ? '#606068' : '#9CA3AF';
  const accentColor = '#F59E0B';

  return (
    <div
      style={{
        display:    'flex',
        alignItems: 'center',
        gap:         10,
        margin:     '10px 0',
      }}
    >
      <span style={{ flex: 1, height: 1, background: lineColor }} />
      <span
        style={{
          display:       'inline-flex',
          alignItems:    'center',
          gap:            6,
          color:          textColor,
          fontSize:       9.5,
          fontFamily:    "'DM Mono', monospace",
          letterSpacing: '0.10em',
          textTransform: 'uppercase' as const,
          whiteSpace:    'nowrap' as const,
          userSelect:    'none' as const,
        }}
      >
        <Archive size={10} strokeWidth={2} style={{ color: accentColor, opacity: 0.8 }} />
        {count} message{count === 1 ? '' : 's'} summarized
      </span>
      <span style={{ flex: 1, height: 1, background: lineColor }} />
    </div>
  );
}

// ─── TokenCounterBadge ───────────────────────────────────────────────────────

export function TokenCounterBadge({
  isDark,
  tokenUsage,
}: {
  isDark: boolean;
  tokenUsage: YangTokenUsage | null;
}) {
  if (!tokenUsage) return null;

  const pct = tokenUsage.utilization_pct;

  const accent =
    pct >= 75 ? '#EF4444' :
    pct >= 50 ? '#F59E0B' :
    isDark    ? '#52525B' :
                '#A1A1AA';

  const barBg   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const barFill = Math.min(100, pct);
  const hasCacheHit = tokenUsage.cache_read_tokens > 0;

  return (
    <div
      title={`Context: ${fmtTokens(tokenUsage.input_tokens)} / ${fmtTokens(tokenUsage.context_window)} tokens`}
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:            7,
        padding:       '4px 10px 4px 9px',
        borderRadius:   999,
        border:        `1px solid ${accent}38`,
        background:     accent + '0E',
        color:          accent,
        fontSize:       10,
        fontWeight:     600,
        fontFamily:    "'DM Mono', monospace",
        letterSpacing: '0.04em',
        whiteSpace:    'nowrap' as const,
        userSelect:    'none' as const,
        cursor:        'default',
        transition:    'border-color .3s, background .3s, color .3s',
      }}
    >
      <Gauge size={11} strokeWidth={2} style={{ flexShrink: 0 }} />

      {/* Used / total */}
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2 }}>
        <span style={{ fontWeight: 700 }}>{fmtTokens(tokenUsage.input_tokens)}</span>
        <span style={{ opacity: 0.4, fontSize: 9 }}> / {fmtTokens(tokenUsage.context_window)}</span>
      </span>

      {/* Progress bar */}
      <span
        style={{
          display:     'inline-flex',
          width:        48,
          height:        3,
          borderRadius:  2,
          background:    barBg,
          overflow:     'hidden',
          flexShrink:    0,
        }}
      >
        <span
          style={{
            display:     'block',
            width:       `${barFill}%`,
            height:      '100%',
            borderRadius: 2,
            background:   accent,
            transition:  'width .5s ease, background .3s',
          }}
        />
      </span>

      {/* Percentage */}
      <span style={{ minWidth: 34, textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' }}>
        {pct.toFixed(1)}%
      </span>

      {/* Cache badge */}
      {hasCacheHit && (
        <span
          title={`${fmtTokens(tokenUsage.cache_read_tokens)} tokens from prompt cache`}
          style={{
            padding:       '1px 6px',
            borderRadius:   999,
            background:    '#10B98114',
            border:        '1px solid #10B98138',
            color:         '#10B981',
            fontSize:       8.5,
            fontWeight:     800,
            letterSpacing: '0.08em',
          }}
        >
          ⚡ CACHED
        </span>
      )}
    </div>
  );
}

// ─── ToolSearchChip ──────────────────────────────────────────────────────────

export function ToolSearchChip({ isDark, active }: { isDark: boolean; active: boolean }) {
  if (!active) return null;

  const accent = '#06B6D4';

  return (
    <div
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:             6,
        padding:        '4px 11px 4px 9px',
        borderRadius:    999,
        background:     `linear-gradient(90deg, ${accent}1A 0%, ${accent}36 50%, ${accent}1A 100%)`,
        backgroundSize: '200% 100%',
        border:         `1px solid ${accent}44`,
        color:           accent,
        fontSize:        10,
        fontWeight:      700,
        fontFamily:     "'DM Mono', monospace",
        letterSpacing:  '0.07em',
        textTransform:  'uppercase' as const,
        animation:      'chat-shimmer 1.6s ease-in-out infinite',
        userSelect:     'none' as const,
      }}
    >
      <SearchIcon size={10} strokeWidth={2.5} style={{ flexShrink: 0 }} />
      Searching tools
      <span style={{ opacity: 0.5 }}>…</span>
    </div>
  );
}

// ─── SubagentProgress ────────────────────────────────────────────────────────

interface SubagentResult {
  role?: string;
  task?: string;
  result?: string;
  error?: string;
  status?: 'running' | 'complete' | 'failed';
  elapsed_s?: number;
}

const ROLE_COLORS: Record<string, string> = {
  researcher:  '#3B82F6',
  analyst:     '#8B5CF6',
  kb_searcher: '#10B981',
};

export function SubagentProgress({
  isDark, input, output,
}: {
  isDark: boolean;
  input: any;
  output: any;
}) {
  const textPrimary   = isDark ? '#E4E4E7' : '#18181B';
  const textMuted     = isDark ? '#71717A' : '#6B7280';
  const borderBase    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const headerBg      = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)';
  const rowBg         = isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.015)';

  const subtasks = Array.isArray(input?.subtasks) ? input.subtasks : [];
  const results: SubagentResult[] = Array.isArray(output?.results) ? output.results : [];

  const rows = subtasks.map((st: any, i: number) => ({
    role:      st?.role || 'researcher',
    task:      st?.task || '',
    result:    results[i]?.result,
    error:     results[i]?.error,
    elapsed_s: results[i]?.elapsed_s,
    status:    results[i]?.status ?? (results[i] ? 'complete' : 'running'),
  }));

  const doneCount = rows.filter((r: any) => r.status === 'complete').length;
  const failCount = rows.filter((r: any) => r.status === 'failed' || r.error).length;

  return (
    <div
      style={{
        margin:       '8px 0',
        borderRadius:  12,
        border:       `1px solid ${borderBase}`,
        overflow:     'hidden',
        fontFamily:   "'DM Mono', monospace",
      }}
    >
      {/* Header */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '8px 12px',
          background:      headerBg,
          borderBottom:   `1px solid ${borderBase}`,
        }}
      >
        <span style={{
          display:       'flex',
          alignItems:    'center',
          gap:            6,
          fontSize:       9.5,
          fontWeight:     700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          color:          textMuted,
        }}>
          <GitBranch size={10} strokeWidth={2.5} />
          Subagents
        </span>
        <span style={{
          fontSize:       9,
          letterSpacing: '0.06em',
          color:          textMuted,
        }}>
          {doneCount}/{rows.length} done
          {failCount > 0 && (
            <span style={{ color: '#EF4444', marginLeft: 6 }}>· {failCount} failed</span>
          )}
        </span>
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rows.map((r: any, i: number) => {
          const color  = ROLE_COLORS[r.role] || '#6B7280';
          const isDone = r.status === 'complete';
          const isFail = r.status === 'failed' || !!r.error;

          return (
            <div
              key={i}
              style={{
                display:      'flex',
                alignItems:   'flex-start',
                gap:           10,
                padding:      '9px 12px',
                background:    rowBg,
                borderBottom:  i < rows.length - 1 ? `1px solid ${borderBase}` : 'none',
                borderLeft:   `2px solid ${color}`,
                transition:   'background .15s',
              }}
            >
              {/* Role pill */}
              <span style={{
                padding:       '2px 7px',
                borderRadius:   999,
                background:     color + '18',
                color,
                fontSize:       8.5,
                fontWeight:     800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                flexShrink:     0,
                marginTop:      1,
                border:        `1px solid ${color}28`,
              }}>
                {r.role}
              </span>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize:    11.5,
                  fontFamily: 'inherit',
                  color:       textPrimary,
                  lineHeight:  1.4,
                  overflow:   'hidden',
                  display:    '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical' as any,
                }}>
                  {r.task}
                </div>

                {r.result && !isFail && (
                  <div style={{
                    marginTop:  4,
                    fontSize:   10,
                    color:      textMuted,
                    lineHeight: 1.45,
                    overflow:  'hidden',
                    display:   '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as any,
                  }}>
                    {String(r.result).slice(0, 200)}
                  </div>
                )}

                {isFail && r.error && (
                  <div style={{
                    marginTop:  4,
                    fontSize:   10,
                    color:     '#EF4444',
                    lineHeight: 1.4,
                  }}>
                    {r.error}
                  </div>
                )}

                {r.elapsed_s != null && isDone && (
                  <div style={{
                    marginTop:     3,
                    fontSize:      9,
                    color:         textMuted,
                    opacity:       0.6,
                    letterSpacing: '0.04em',
                  }}>
                    {r.elapsed_s.toFixed(1)}s
                  </div>
                )}
              </div>

              {/* Status icon */}
              <div style={{ flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center' }}>
                {isFail ? (
                  <AlertCircle size={12} style={{ color: '#EF4444' }} />
                ) : isDone ? (
                  <CheckCircle2 size={12} style={{ color: '#10B981' }} />
                ) : (
                  <span style={{
                    width:           11,
                    height:          11,
                    borderRadius:   '50%',
                    border:         `1.5px solid ${color}`,
                    borderTopColor: 'transparent',
                    animation:      'chat-spin 0.8s linear infinite',
                    display:        'inline-block',
                  }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── BackgroundTaskCard ──────────────────────────────────────────────────────

export function BackgroundTaskCard({
  isDark, output,
}: {
  isDark: boolean;
  output: any;
}) {
  const textPrimary = isDark ? '#E4E4E7' : '#18181B';
  const textMuted   = isDark ? '#71717A' : '#6B7280';
  const borderBase  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';

  const taskId  = output?.task_id;
  const { tasks } = useYangBackgroundTasks();
  const live    = taskId ? tasks[taskId] : undefined;

  const status  = live?.status || output?.status || 'running';
  const label   = live?.label || output?.label ||
    (live?.tool_name ? `Running ${live.tool_name}` : 'Background task');
  const elapsed = live?.elapsed_s ?? 0;

  const isDone = status === 'complete';
  const isFail = status === 'failed';

  const statusColor   = isDone ? '#10B981' : isFail ? '#EF4444' : '#F59E0B';
  const statusLabel   = isDone ? 'Complete' : isFail ? 'Failed' : 'Running';

  const downloadUrl = live?.result?.download_url || output?.download_url;
  const filename    = live?.result?.filename || output?.filename || 'file';

  return (
    <div
      style={{
        margin:       '8px 0',
        padding:      '11px 14px',
        borderRadius:  12,
        border:       `1px solid ${borderBase}`,
        borderLeft:   `2px solid ${statusColor}`,
        background:    isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
        display:      'flex',
        alignItems:   'center',
        gap:           12,
        transition:   'border-color .3s',
      }}
    >
      {/* Status icon */}
      <span style={{
        width:           32,
        height:          32,
        borderRadius:     999,
        background:       statusColor + '18',
        border:          `1px solid ${statusColor}30`,
        color:            statusColor,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        flexShrink:       0,
      }}>
        {isFail ? (
          <AlertTriangle size={13} strokeWidth={2} />
        ) : isDone ? (
          <CheckCircle2 size={13} strokeWidth={2} />
        ) : (
          <span style={{
            width:           13,
            height:          13,
            borderRadius:   '50%',
            border:         `1.5px solid ${statusColor}`,
            borderTopColor: 'transparent',
            animation:      'chat-spin 0.8s linear infinite',
            display:        'inline-block',
          }} />
        )}
      </span>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize:    12.5,
          fontWeight:  600,
          color:       textPrimary,
          lineHeight:  1.3,
          whiteSpace: 'nowrap' as const,
          overflow:   'hidden',
          textOverflow: 'ellipsis',
        }}>
          {label}
        </div>
        <div style={{
          marginTop:     3,
          display:      'flex',
          alignItems:   'center',
          gap:           6,
          fontFamily:   "'DM Mono', monospace",
          fontSize:      9.5,
          color:         textMuted,
          letterSpacing: '0.04em',
        }}>
          <span style={{
            color:         statusColor,
            fontWeight:    700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            fontSize:       8.5,
          }}>
            {statusLabel}
          </span>
          {!isFail && (
            <>
              <span style={{ opacity: 0.3 }}>·</span>
              <span>{elapsed.toFixed(1)}s</span>
            </>
          )}
          {isFail && live?.error && (
            <>
              <span style={{ opacity: 0.3 }}>·</span>
              <span style={{ color: '#EF4444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {live.error}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Download button */}
      {isDone && downloadUrl && (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={filename}
          style={{
            display:       'inline-flex',
            alignItems:    'center',
            gap:            5,
            padding:       '6px 12px',
            borderRadius:   999,
            border:        `1px solid ${statusColor}40`,
            background:     statusColor + '14',
            color:          statusColor,
            fontSize:       10.5,
            fontWeight:     700,
            fontFamily:    "'DM Mono', monospace",
            letterSpacing: '0.04em',
            textDecoration: 'none',
            whiteSpace:    'nowrap' as const,
            flexShrink:     0,
            transition:    'background .15s, border-color .15s',
          }}
        >
          <Download size={10} strokeWidth={2.5} />
          Download
        </a>
      )}
    </div>
  );
}
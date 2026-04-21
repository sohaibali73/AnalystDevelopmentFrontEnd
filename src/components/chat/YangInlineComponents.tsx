'use client';

/**
 * Inline / inside-message YANG components:
 *   • CompletionVerificationBadge — badge under assistant message
 *   • CompactionBanner            — divider above compacted messages
 *   • SubagentProgress            — renders spawn_subagents tool output
 *   • BackgroundTaskCard          — renders tool output w/ task_id polling
 *   • ToolSearchChip              — transient shimmer while tools lazy-load
 */

import React from 'react';
import {
  CheckCircle2, AlertCircle, Info, Archive,
  Search as SearchIcon, GitBranch, Clock, Download, AlertTriangle,
} from 'lucide-react';
import { useYangBackgroundTasks } from '@/contexts/YangBackgroundTasksContext';
import type { YangVerificationEvent } from '@/types/yang';

// ─── CompletionVerificationBadge ────────────────────────────────────────────

export function CompletionVerificationBadge({
  isDark, verification,
}: {
  isDark: boolean;
  verification: YangVerificationEvent | null;
}) {
  if (!verification) return null;

  const verified = verification.verified;
  const color = verified ? '#10B981' : '#F59E0B';
  const Icon  = verified ? CheckCircle2 : AlertCircle;
  const label = verified ? 'Verified' : 'Revised';
  const title = verified
    ? 'Response verified against your request'
    : `Verifier triggered a revision — ${verification.critique}`;

  return (
    <span
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 9px',
        borderRadius: 999,
        border: `1px solid ${color}55`,
        background: color + '15',
        color,
        fontSize: 10.5,
        fontWeight: 600,
        fontFamily: "'DM Mono', monospace",
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap' as const,
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
  const T = {
    text:   isDark ? '#9A9AA3' : '#6B7280',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    accent: '#F59E0B',
  };
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        margin: '8px 0',
        padding: '6px 12px',
        borderRadius: 999,
        border: `1px dashed ${T.border}`,
        background: 'transparent',
        color: T.text,
        fontSize: 10.5,
        fontFamily: "'DM Mono', monospace",
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        alignSelf: 'center',
        maxWidth: 'fit-content',
      }}
    >
      <Archive size={11} style={{ color: T.accent }} />
      {count} earlier message{count === 1 ? '' : 's'} summarized
    </div>
  );
}

// ─── ToolSearchChip (transient shimmer) ──────────────────────────────────────

export function ToolSearchChip({ isDark, active }: { isDark: boolean; active: boolean }) {
  if (!active) return null;
  const T = {
    text:   isDark ? '#DCDCE0' : '#30303A',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    accent: '#06B6D4',
  };
  return (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: `linear-gradient(90deg, ${T.accent}20, ${T.accent}40, ${T.accent}20)`,
        backgroundSize: '200% 100%',
        border: `1px solid ${T.accent}55`,
        color: T.accent,
        fontSize: 10.5,
        fontWeight: 600,
        fontFamily: "'DM Mono', monospace",
        animation: 'chat-shimmer 1.5s linear infinite',
      }}
    >
      <SearchIcon size={10} strokeWidth={2.25} />
      Searching tools…
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

export function SubagentProgress({
  isDark, input, output,
}: {
  isDark: boolean;
  input: any;
  output: any;
}) {
  const T = {
    text:   isDark ? '#EFEFEF' : '#0A0A0B',
    muted:  isDark ? '#9A9AA3' : '#6B7280',
    dim:    isDark ? '#606068' : '#808088',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    cardBg: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
  };

  const roleColor: Record<string, string> = {
    researcher:  '#3B82F6',
    analyst:     '#8B5CF6',
    kb_searcher: '#10B981',
  };

  const subtasks = Array.isArray(input?.subtasks) ? input.subtasks : [];
  const results: SubagentResult[] = Array.isArray(output?.results) ? output.results : [];

  // Merge by index (subtasks define roles; results carry outputs)
  const rows = subtasks.map((st: any, i: number) => ({
    role:      st?.role || 'researcher',
    task:      st?.task || '',
    result:    results[i]?.result,
    error:     results[i]?.error,
    elapsed_s: results[i]?.elapsed_s,
    status:    results[i]?.status ?? (results[i] ? 'complete' : 'running'),
  }));

  return (
    <div
      style={{
        margin: '6px 0',
        padding: 12,
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        background: T.cardBg,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontFamily: "'DM Mono', monospace",
        fontSize: 10, letterSpacing: '0.14em',
        color: T.muted, textTransform: 'uppercase' as const,
      }}>
        <GitBranch size={11} strokeWidth={2.25} />
        Subagents · {rows.length}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map((r: any, i: number) => {
          const color = roleColor[r.role] || '#6B7280';
          const isDone  = r.status === 'complete';
          const isFail  = r.status === 'failed' || !!r.error;
          return (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: 8,
                borderRadius: 8,
                border: `1px solid ${color}22`,
                background: color + '08',
              }}
            >
              <span style={{
                padding: '2px 8px',
                borderRadius: 999,
                background: color + '20',
                color,
                fontSize: 9.5,
                fontWeight: 700,
                fontFamily: "'DM Mono', monospace",
                letterSpacing: '0.05em',
                textTransform: 'uppercase' as const,
                flexShrink: 0,
                alignSelf: 'flex-start',
              }}>
                {r.role}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 11.5, color: T.text,
                  lineHeight: 1.35,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical' as any,
                }}>
                  {r.task}
                </div>
                {r.result && (
                  <div style={{
                    marginTop: 4,
                    fontSize: 10.5, color: T.muted,
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical' as any,
                  }}>
                    {String(r.result).slice(0, 240)}
                  </div>
                )}
                {isFail && r.error && (
                  <div style={{ marginTop: 4, fontSize: 10.5, color: '#EF4444' }}>
                    {r.error}
                  </div>
                )}
              </div>
              <span style={{ flexShrink: 0 }}>
                {isFail ? (
                  <AlertCircle size={12} style={{ color: '#EF4444' }} />
                ) : isDone ? (
                  <CheckCircle2 size={12} style={{ color: '#10B981' }} />
                ) : (
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%',
                    border: `2px solid ${color}`,
                    borderTopColor: 'transparent',
                    animation: 'chat-spin 0.8s linear infinite',
                    display: 'inline-block',
                  }} />
                )}
              </span>
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
  const T = {
    text:   isDark ? '#EFEFEF' : '#0A0A0B',
    muted:  isDark ? '#9A9AA3' : '#6B7280',
    dim:    isDark ? '#606068' : '#808088',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    cardBg: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
    accent: '#F59E0B',
  };

  const taskId = output?.task_id;
  const { tasks } = useYangBackgroundTasks();
  const live = taskId ? tasks[taskId] : undefined;

  const status = live?.status || output?.status || 'running';
  const label  = live?.label || output?.label ||
    (live?.tool_name ? `Running ${live.tool_name}` : 'Background task');
  const elapsed = live?.elapsed_s ?? 0;

  const isDone = status === 'complete';
  const isFail = status === 'failed';

  const statusColor = isDone ? '#10B981' : isFail ? '#EF4444' : T.accent;

  // Download URL only appears once complete
  const downloadUrl = live?.result?.download_url || output?.download_url;
  const filename    = live?.result?.filename || output?.filename || 'file';

  return (
    <div
      style={{
        margin: '6px 0',
        padding: 12,
        borderRadius: 12,
        border: `1px solid ${statusColor}55`,
        background: statusColor + '08',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span style={{
        width: 32, height: 32, borderRadius: 999,
        background: statusColor + '25',
        color: statusColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {isFail ? (
          <AlertTriangle size={14} />
        ) : isDone ? (
          <CheckCircle2 size={14} />
        ) : (
          <span style={{
            width: 14, height: 14, borderRadius: '50%',
            border: `2px solid ${statusColor}`,
            borderTopColor: 'transparent',
            animation: 'chat-spin 0.8s linear infinite',
          }} />
        )}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>
          {label}
        </div>
        <div style={{
          marginTop: 2, fontSize: 10.5, color: T.muted,
          fontFamily: "'DM Mono', monospace", letterSpacing: '0.05em',
        }}>
          {isFail
            ? (live?.error || 'Failed')
            : isDone
              ? `Completed · ${elapsed.toFixed(1)}s`
              : `Running · ${elapsed.toFixed(1)}s`}
        </div>
      </div>

      {isDone && downloadUrl && (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '6px 12px',
            borderRadius: 999,
            border: `1px solid ${statusColor}55`,
            background: statusColor + '18',
            color: statusColor,
            fontSize: 11, fontWeight: 600,
            textDecoration: 'none',
            whiteSpace: 'nowrap' as const,
          }}
          title={filename}
        >
          <Download size={11} />
          Download
        </a>
      )}
    </div>
  );
}

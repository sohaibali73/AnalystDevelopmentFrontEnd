'use client';

/**
 * FocusChainDrawer — collapsible right-rail widget.
 *
 * Shows the current conversation goal + open tasks + key files + tools used,
 * fed by the yang_focus_chain stream event.  Open/closed state persists
 * in localStorage so it survives reloads.
 */

import React, { useEffect, useState } from 'react';
import {
  Target, ChevronRight, ChevronLeft,
  Square, CheckSquare2, FileText, Wrench, Circle,
} from 'lucide-react';
import type { YangFocusSnapshot } from '@/types/yang';

const LS_KEY = 'yang_focus_drawer_open';

export interface FocusChainDrawerProps {
  isDark: boolean;
  focus: YangFocusSnapshot | null;
  enabled: boolean;
}

export function FocusChainDrawer({ isDark, focus, enabled }: FocusChainDrawerProps) {
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const v = window.localStorage.getItem(LS_KEY);
    return v === null ? true : v === '1';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LS_KEY, open ? '1' : '0');
    }
  }, [open]);

  if (!enabled) return null;

  const T = {
    text:    isDark ? '#E4E4E7' : '#18181B',
    muted:   isDark ? '#71717A' : '#6B7280',
    dim:     isDark ? '#3F3F46' : '#D4D4D8',
    border:  isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
    bg:      isDark ? '#0E0E11' : '#FAFAFA',
    chipBg:  isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    accent:  '#10B981',
    accentDim: isDark ? '#10B98118' : '#10B98110',
    accentBorder: isDark ? '#10B98130' : '#10B98128',
  };

  const hasAny = focus && (
    focus.goal ||
    (focus.open_tasks?.length ?? 0) > 0 ||
    (focus.key_files?.length ?? 0) > 0 ||
    (focus.tools_used?.length ?? 0) > 0
  );

  const openTaskCount = focus?.open_tasks?.length ?? 0;

  // ── Collapsed rail ─────────────────────────────────────────────────────────
  if (!open) {
    return (
      <aside
        style={{
          width: 32,
          borderLeft: `1px solid ${T.border}`,
          background: T.bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 12,
          paddingBottom: 12,
          gap: 8,
          flexShrink: 0,
        }}
      >
        {/* Toggle button */}
        <button
          onClick={() => setOpen(true)}
          title="Show Focus Chain"
          style={{
            width: 24, height: 24, borderRadius: 6,
            background: hasAny ? T.accentDim : 'transparent',
            border: `1px solid ${hasAny ? T.accentBorder : T.border}`,
            color: hasAny ? T.accent : T.muted,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <Target size={11} strokeWidth={2.25} />
          {/* Live task count dot */}
          {openTaskCount > 0 && (
            <span style={{
              position: 'absolute', top: -3, right: -3,
              minWidth: 13, height: 13,
              borderRadius: 999,
              background: T.accent,
              color: '#fff',
              fontSize: 7.5,
              fontWeight: 800,
              fontFamily: "'DM Mono', monospace",
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 2px',
              boxShadow: `0 0 0 2px ${T.bg}`,
            }}>
              {openTaskCount}
            </span>
          )}
        </button>

        {/* Vertical label */}
        <span
          onClick={() => setOpen(true)}
          style={{
            writingMode: 'vertical-rl' as const,
            textOrientation: 'mixed' as const,
            transform: 'rotate(180deg)',
            fontFamily: "'DM Mono', monospace",
            fontSize: 8.5,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
            color: T.dim,
            cursor: 'pointer',
            userSelect: 'none' as const,
            marginTop: 4,
          }}
        >
          Focus Chain
        </span>

        <button
          onClick={() => setOpen(true)}
          style={{
            marginTop: 'auto',
            width: 22, height: 22, borderRadius: 5,
            background: 'transparent', border: `1px solid ${T.border}`,
            color: T.muted, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronLeft size={11} />
        </button>
      </aside>
    );
  }

  // ── Expanded panel ─────────────────────────────────────────────────────────
  return (
    <aside
      style={{
        width: 288,
        borderLeft: `1px solid ${T.border}`,
        background: T.bg,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px 10px 13px',
        borderBottom: `1px solid ${T.border}`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 20, height: 20, borderRadius: 5,
            background: T.accentDim,
            border: `1px solid ${T.accentBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Target size={10} strokeWidth={2.25} style={{ color: T.accent }} />
          </div>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9.5, letterSpacing: '0.13em', fontWeight: 700,
            color: T.muted, textTransform: 'uppercase' as const,
          }}>
            Focus Chain
          </span>
          {openTaskCount > 0 && (
            <span style={{
              padding: '1px 5px',
              borderRadius: 999,
              background: T.accentDim,
              border: `1px solid ${T.accentBorder}`,
              color: T.accent,
              fontSize: 8.5, fontWeight: 800,
              fontFamily: "'DM Mono', monospace",
            }}>
              {openTaskCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{
            width: 22, height: 22, borderRadius: 5, border: `1px solid ${T.border}`,
            background: 'transparent', cursor: 'pointer', color: T.muted,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color .15s, color .15s',
          }}
        >
          <ChevronRight size={11} />
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{
        overflow: 'auto', flex: 1,
        padding: '14px 0',
        display: 'flex', flexDirection: 'column', gap: 0,
      }}>
        {!hasAny ? (
          <EmptyState T={T} />
        ) : (
          <>
            {focus?.goal && (
              <Section label="Goal" T={T}>
                <div style={{
                  padding: '9px 11px',
                  borderRadius: 8,
                  background: T.accentDim,
                  border: `1px solid ${T.accentBorder}`,
                  borderLeft: `2px solid ${T.accent}`,
                  fontSize: 11.5,
                  color: T.text,
                  lineHeight: 1.55,
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: '0.01em',
                }}>
                  {focus.goal}
                </div>
              </Section>
            )}

            {focus && focus.open_tasks.length > 0 && (
              <Section label={`Open · ${focus.open_tasks.length}`} T={T} accent={T.accent}>
                <TaskList tasks={focus.open_tasks} done={false} T={T} />
              </Section>
            )}

            {focus && focus.completed_tasks.length > 0 && (
              <Section label="Done" T={T}>
                <TaskList tasks={focus.completed_tasks.slice(-3)} done={true} T={T} />
              </Section>
            )}

            {focus && focus.key_files.length > 0 && (
              <Section label={`Files · ${focus.key_files.length}`} T={T}>
                <FileList files={focus.key_files.slice(0, 6)} T={T} />
              </Section>
            )}

            {focus && focus.tools_used.length > 0 && (
              <Section label="Tools" T={T}>
                <ToolChips tools={focus.tools_used.slice(-6)} T={T} />
              </Section>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyState({ T }: { T: any }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 10, padding: '32px 20px', textAlign: 'center' as const,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: T.accentDim, border: `1px solid ${T.accentBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Target size={16} strokeWidth={1.75} style={{ color: T.accent, opacity: 0.6 }} />
      </div>
      <div style={{
        fontSize: 11, color: T.muted, lineHeight: 1.55,
        fontFamily: "'DM Mono', monospace",
        letterSpacing: '0.02em',
      }}>
        Focus chain updates as<br />you work. Goals and tasks<br />will appear here.
      </div>
    </div>
  );
}

function Section({
  label, T, accent, children,
}: {
  label: string; T: any; accent?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ padding: '0 13px 16px' }}>
      {/* Ruled header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 8,
      }}>
        {accent && (
          <span style={{
            width: 3, height: 3, borderRadius: '50%',
            background: accent, flexShrink: 0,
            boxShadow: `0 0 5px ${accent}`,
          }} />
        )}
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 8.5, letterSpacing: '0.14em', fontWeight: 700,
          color: T.muted, textTransform: 'uppercase' as const,
          flexShrink: 0,
        }}>
          {label}
        </span>
        <span style={{ flex: 1, height: 1, background: T.border }} />
      </div>
      {children}
    </div>
  );
}

function TaskList({ tasks, done, T }: { tasks: string[]; done: boolean; T: any }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {tasks.map((t, i) => (
        <li
          key={i}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 7,
            padding: '5px 8px',
            borderRadius: 6,
            background: done ? 'transparent' : T.chipBg,
            border: done ? 'none' : `1px solid ${T.border}`,
          }}
        >
          {/* Icon / pulse */}
          <span style={{ flexShrink: 0, marginTop: 2, position: 'relative' as const, display: 'flex' }}>
            {done ? (
              <CheckSquare2 size={10} strokeWidth={2} style={{ color: T.accent, opacity: 0.6 }} />
            ) : (
              <>
                <Square size={10} strokeWidth={1.75} style={{ color: T.accent }} />
                {/* Pulse dot for active tasks */}
                <span style={{
                  position: 'absolute', top: -1, right: -1,
                  width: 4, height: 4, borderRadius: '50%', background: T.accent,
                  animation: 'focus-pulse 2s ease-in-out infinite',
                }} />
              </>
            )}
          </span>
          <span style={{
            flex: 1,
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            color: done ? T.muted : T.text,
            textDecoration: done ? 'line-through' : 'none',
            lineHeight: 1.5,
            letterSpacing: '0.01em',
            opacity: done ? 0.6 : 1,
          }}>
            {t}
          </span>
        </li>
      ))}
    </ul>
  );
}

function FileList({ files, T }: { files: string[]; T: any }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {files.map((f, i) => {
        // Extract just the filename for display, show full path on hover
        const parts = f.split('/');
        const name  = parts[parts.length - 1];
        const dir   = parts.slice(0, -1).join('/');
        return (
          <li
            key={i}
            title={f}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 7px', borderRadius: 5,
              border: `1px solid ${T.border}`,
              overflow: 'hidden',
            }}
          >
            <FileText size={9} strokeWidth={2} style={{ color: T.muted, flexShrink: 0 }} />
            <span style={{
              flex: 1, overflow: 'hidden',
              display: 'flex', flexDirection: 'column', gap: 1,
              minWidth: 0,
            }}>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10.5, color: T.text,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                letterSpacing: '0.01em',
              }}>
                {name}
              </span>
              {dir && (
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 8.5, color: T.muted, opacity: 0.55,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                  letterSpacing: '0.01em',
                }}>
                  {dir}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function ToolChips({ tools, T }: { tools: string[]; T: any }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
      {tools.map((t, i) => (
        <span
          key={i}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 8px',
            borderRadius: 999,
            border: `1px solid ${T.border}`,
            background: T.chipBg,
            fontSize: 9.5,
            fontWeight: 600,
            color: T.muted,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.04em',
          }}
        >
          <Wrench size={8} strokeWidth={2} />
          {t}
        </span>
      ))}
    </div>
  );
}
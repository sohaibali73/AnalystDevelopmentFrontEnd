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
  Square, CheckSquare2, FileText, Wrench,
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
    text:   isDark ? '#EFEFEF' : '#0A0A0B',
    muted:  isDark ? '#9A9AA3' : '#6B7280',
    dim:    isDark ? '#606068' : '#808088',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    bg:     isDark ? '#0D0D10' : '#FFFFFF',
    cardBg: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
    accent: '#10B981',
  };

  const hasAny = focus && (
    focus.goal ||
    (focus.open_tasks?.length ?? 0) > 0 ||
    (focus.key_files?.length ?? 0) > 0 ||
    (focus.tools_used?.length ?? 0) > 0
  );

  // Collapsed rail — 36px, just shows icon + count dot
  if (!open) {
    return (
      <aside
        style={{
          width: 36,
          borderLeft: `1px solid ${T.border}`,
          background: T.bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '10px 0',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setOpen(true)}
          title="Show Focus Chain"
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'transparent', border: `1px solid ${T.border}`,
            color: hasAny ? T.accent : T.muted,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Target size={14} />
          {hasAny && (
            <span style={{
              position: 'absolute', top: -2, right: -2,
              width: 7, height: 7, borderRadius: '50%', background: T.accent,
              boxShadow: `0 0 0 2px ${T.bg}`,
            }} />
          )}
        </button>
        <button
          onClick={() => setOpen(true)}
          style={{
            marginTop: 6, width: 24, height: 24, borderRadius: 6,
            background: 'transparent', border: 'none', color: T.muted,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronLeft size={14} />
        </button>
      </aside>
    );
  }

  return (
    <aside
      style={{
        width: 300,
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
        padding: '12px 14px', borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Target size={12} strokeWidth={2.25} style={{ color: T.accent }} />
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10, letterSpacing: '0.14em',
            color: T.muted, textTransform: 'uppercase' as const,
          }}>
            Focus Chain
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{
            width: 22, height: 22, borderRadius: 6, border: 'none',
            background: 'transparent', cursor: 'pointer', color: T.muted,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Body */}
      <div style={{ overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {!hasAny ? (
          <div style={{ fontSize: 11.5, color: T.dim, lineHeight: 1.5, textAlign: 'center' as const, paddingTop: 20 }}>
            The focus chain updates as you work.<br/>
            Goals, open tasks, and key files will appear here.
          </div>
        ) : (
          <>
            {focus?.goal && (
              <Section label="Goal" T={T}>
                <div style={{ fontSize: 12.5, color: T.text, lineHeight: 1.4 }}>
                  {focus.goal}
                </div>
              </Section>
            )}

            {focus && focus.open_tasks.length > 0 && (
              <Section label={`Open Tasks · ${focus.open_tasks.length}`} T={T}>
                <TaskList tasks={focus.open_tasks} done={false} T={T} />
              </Section>
            )}

            {focus && focus.completed_tasks.length > 0 && (
              <Section label="Recently Done" T={T}>
                <TaskList tasks={focus.completed_tasks.slice(-3)} done={true} T={T} />
              </Section>
            )}

            {focus && focus.key_files.length > 0 && (
              <Section label={`Key Files · ${focus.key_files.length}`} T={T}>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {focus.key_files.slice(0, 6).map((f, i) => (
                    <li
                      key={i}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontSize: 11.5, color: T.text,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                      }}
                    >
                      <FileText size={11} style={{ color: T.muted, flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {focus && focus.tools_used.length > 0 && (
              <Section label="Tools Used" T={T}>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                  {focus.tools_used.slice(-5).map((t, i) => (
                    <span
                      key={i}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 8px',
                        borderRadius: 999,
                        border: `1px solid ${T.border}`,
                        background: T.cardBg,
                        fontSize: 10.5,
                        color: T.muted,
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      <Wrench size={9} />
                      {t}
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

function Section({
  label, T, children,
}: {
  label: string; T: any; children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 9.5, letterSpacing: '0.12em',
        color: T.muted, textTransform: 'uppercase' as const,
        marginBottom: 6,
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function TaskList({
  tasks, done, T,
}: {
  tasks: string[]; done: boolean; T: any;
}) {
  const Icon = done ? CheckSquare2 : Square;
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
      {tasks.map((t, i) => (
        <li
          key={i}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 6,
            fontSize: 11.5,
            color: done ? T.muted : T.text,
            textDecoration: done ? 'line-through' : 'none',
            lineHeight: 1.4,
          }}
        >
          <Icon size={11} style={{ color: done ? T.muted : T.dim, flexShrink: 0, marginTop: 2 }} />
          <span style={{ flex: 1 }}>{t}</span>
        </li>
      ))}
    </ul>
  );
}

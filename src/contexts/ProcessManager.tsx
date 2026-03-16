'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  X, ChevronUp, ChevronDown, Loader2, CheckCircle2,
  AlertCircle, Minimize2, Maximize2, Presentation,
  FileText, BarChart3, Code, Sparkles, ChevronRight,
  Trash2,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

export type ProcessStatus = 'pending' | 'running' | 'complete' | 'failed';
export type ProcessType = 'slide' | 'document' | 'dashboard' | 'afl' | 'article' | 'general';

export interface BackgroundProcess {
  id: string;
  title: string;
  type: ProcessType;
  status: ProcessStatus;
  progress: number;       // 0-100
  message?: string;       // Current step description
  startedAt: number;
  completedAt?: number;
  error?: string;
  result?: unknown;       // Result data when complete
  onComplete?: (result: unknown) => void;
}

interface ProcessManagerContextType {
  processes: BackgroundProcess[];
  addProcess: (process: Omit<BackgroundProcess, 'id' | 'startedAt'>) => string;
  updateProcess: (id: string, updates: Partial<BackgroundProcess>) => void;
  removeProcess: (id: string) => void;
  clearCompleted: () => void;
  activeCount: number;
}

/* ================================================================== */
/*  Context                                                            */
/* ================================================================== */

const ProcessManagerContext = createContext<ProcessManagerContextType | null>(null);

export function useProcessManager() {
  const ctx = useContext(ProcessManagerContext);
  if (!ctx) throw new Error('useProcessManager must be used within ProcessManagerProvider');
  return ctx;
}

/* ================================================================== */
/*  Provider                                                           */
/* ================================================================== */

export function ProcessManagerProvider({ children }: { children: React.ReactNode }) {
  const [processes, setProcesses] = useState<BackgroundProcess[]>([]);
  const counterRef = useRef(0);

  const addProcess = useCallback((proc: Omit<BackgroundProcess, 'id' | 'startedAt'>) => {
    const id = `proc_${Date.now()}_${++counterRef.current}`;
    const newProc: BackgroundProcess = {
      ...proc,
      id,
      startedAt: Date.now(),
    };
    setProcesses(prev => [newProc, ...prev]);
    return id;
  }, []);

  const updateProcess = useCallback((id: string, updates: Partial<BackgroundProcess>) => {
    setProcesses(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, ...updates };
      if (updates.status === 'complete' && !updated.completedAt) {
        updated.completedAt = Date.now();
        if (p.onComplete && updates.result !== undefined) {
          setTimeout(() => p.onComplete?.(updates.result), 0);
        }
      }
      return updated;
    }));
  }, []);

  const removeProcess = useCallback((id: string) => {
    setProcesses(prev => prev.filter(p => p.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setProcesses(prev => prev.filter(p => p.status !== 'complete' && p.status !== 'failed'));
  }, []);

  const activeCount = processes.filter(p => p.status === 'pending' || p.status === 'running').length;

  return (
    <ProcessManagerContext.Provider value={{
      processes, addProcess, updateProcess, removeProcess, clearCompleted, activeCount,
    }}>
      {children}
    </ProcessManagerContext.Provider>
  );
}

/* ================================================================== */
/*  Floating Widget                                                    */
/* ================================================================== */

const TYPE_ICONS: Record<ProcessType, React.ElementType> = {
  slide: Presentation,
  document: FileText,
  dashboard: BarChart3,
  afl: Code,
  article: FileText,
  general: Sparkles,
};

const TYPE_LABELS: Record<ProcessType, string> = {
  slide: 'Presentation',
  document: 'Document',
  dashboard: 'Dashboard',
  afl: 'AFL Code',
  article: 'Article',
  general: 'Task',
};

function formatElapsed(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

function TaskItem({
  proc,
  isExpanded,
  onToggle,
  onRemove,
  isDark,
}: {
  proc: BackgroundProcess;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  isDark: boolean;
}) {
  const [now, setNow] = useState(Date.now());
  const TypeIcon = TYPE_ICONS[proc.type] || Sparkles;
  const isActive = proc.status === 'pending' || proc.status === 'running';
  const isDone = proc.status === 'complete';
  const isFailed = proc.status === 'failed';

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  const statusColor = isActive ? '#FEC00F' : isDone ? '#22c55e' : isFailed ? '#ef4444' : '#555';
  const borderColor = isActive ? '#FEC00F' : isDone ? '#22c55e' : isFailed ? '#ef4444' : (isDark ? '#2a2a2a' : '#e5e5e5');
  const elapsed = isActive ? formatElapsed(now - proc.startedAt) : proc.completedAt ? formatElapsed(proc.completedAt - proc.startedAt) : '';

  return (
    <div
      style={{
        borderLeft: `3px solid ${borderColor}`,
        backgroundColor: isDark
          ? (isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent')
          : (isExpanded ? 'rgba(0,0,0,0.02)' : 'transparent'),
        transition: 'background-color 0.2s ease, border-color 0.3s ease',
        marginBottom: '1px',
      }}
    >
      {/* Compact row - always visible, clickable to toggle */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        {/* Status icon */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {isActive ? (
            <Loader2 size={15} color="#FEC00F" style={{ animation: 'pm-spin 1s linear infinite' }} />
          ) : isDone ? (
            <CheckCircle2 size={15} color="#22c55e" />
          ) : isFailed ? (
            <AlertCircle size={15} color="#ef4444" />
          ) : (
            <TypeIcon size={15} color={isDark ? '#666' : '#999'} />
          )}
        </div>

        {/* Title */}
        <span style={{
          flex: 1,
          fontSize: '13px',
          fontWeight: 600,
          color: isFailed ? '#ef4444' : (isDark ? '#e0e0e0' : '#333'),
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily: "'Quicksand', sans-serif",
        }}>
          {proc.title}
        </span>

        {/* Right side: elapsed + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {isActive && (
            <span style={{
              fontSize: '10px',
              color: isDark ? '#888' : '#888',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
              letterSpacing: '0.3px',
            }}>
              {elapsed}
            </span>
          )}
          {isActive && proc.progress > 0 && (
            <span style={{
              fontSize: '10px',
              color: '#FEC00F',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
            }}>
              {proc.progress}%
            </span>
          )}
          <ChevronRight
            size={13}
            color={isDark ? '#555' : '#aaa'}
            style={{
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </div>
      </div>

      {/* Expanded detail area */}
      <div
        style={{
          maxHeight: isExpanded ? '200px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, opacity 0.2s ease',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div style={{ padding: '0 12px 12px 25px' }}>
          {/* Type badge + elapsed */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '10px',
              backgroundColor: isDark ? 'rgba(254,192,15,0.1)' : 'rgba(254,192,15,0.12)',
              border: `1px solid ${isDark ? 'rgba(254,192,15,0.15)' : 'rgba(254,192,15,0.25)'}`,
              fontSize: '10px',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              color: '#FEC00F',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>
              <TypeIcon size={10} />
              {TYPE_LABELS[proc.type]}
            </span>
            {elapsed && (
              <span style={{
                fontSize: '10px',
                color: isDark ? '#666' : '#999',
                fontFamily: "'Quicksand', sans-serif",
              }}>
                {isDone ? `Completed in ${elapsed}` : isFailed ? `Failed after ${elapsed}` : elapsed}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {isActive && (
            <div style={{
              height: '4px',
              borderRadius: '2px',
              backgroundColor: isDark ? '#222' : '#e5e5e5',
              overflow: 'hidden',
              marginBottom: '6px',
            }}>
              <div style={{
                height: '100%',
                borderRadius: '2px',
                width: proc.progress > 0 ? `${proc.progress}%` : '30%',
                background: 'linear-gradient(90deg, #FEC00F, #FFD700)',
                transition: 'width 0.4s ease',
                animation: proc.progress === 0 ? 'pm-indeterminate 1.5s ease-in-out infinite' : 'none',
              }} />
            </div>
          )}

          {/* Step message */}
          {proc.message && (
            <p style={{
              fontSize: '11px',
              color: isDark ? '#888' : '#777',
              fontFamily: "'Quicksand', sans-serif",
              margin: '0 0 6px',
              lineHeight: 1.4,
            }}>
              {proc.message}
            </p>
          )}

          {/* Error message */}
          {isFailed && proc.error && (
            <p style={{
              fontSize: '11px',
              color: '#ef4444',
              fontFamily: "'Quicksand', sans-serif",
              margin: '0 0 6px',
              lineHeight: 1.4,
            }}>
              {proc.error}
            </p>
          )}

          {/* Dismiss button for done/failed */}
          {!isActive && (
            <button
              onClick={e => { e.stopPropagation(); onRemove(); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                background: 'none',
                border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                borderRadius: '6px',
                color: isDark ? '#888' : '#777',
                cursor: 'pointer',
                fontSize: '10px',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                letterSpacing: '0.3px',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = statusColor; e.currentTarget.style.color = statusColor; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? '#333' : '#ddd'; e.currentTarget.style.color = isDark ? '#888' : '#777'; }}
            >
              <X size={10} />
              DISMISS
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProcessManagerWidget() {
  const { processes, removeProcess, clearCompleted, activeCount } = useProcessManager();
  const { actualTheme } = useTheme();
  const { isMobile } = useResponsive();
  const isDark = actualTheme === 'dark';
  const [panelOpen, setPanelOpen] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const completedCount = processes.filter(p => p.status === 'complete').length;
  const failedCount = processes.filter(p => p.status === 'failed').length;

  const toggleTask = useCallback((id: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedTasks(new Set(processes.map(p => p.id)));
  }, [processes]);

  const collapseAll = useCallback(() => {
    setExpandedTasks(new Set());
  }, []);

  // Auto-open panel when a new process arrives
  useEffect(() => {
    if (processes.length > 0 && activeCount > 0) {
      setPanelOpen(true);
    }
  }, [processes.length, activeCount]);

  // Colors
  const bg = isDark ? '#141414' : '#ffffff';
  const headerBg = isDark
    ? 'linear-gradient(135deg, #1a1a1a, #111)'
    : 'linear-gradient(135deg, #f8f8f8, #f0f0f0)';
  const borderCol = isDark ? '#2a2a2a' : '#e5e5e5';
  const textMuted = isDark ? '#666' : '#999';
  const textPrimary = isDark ? '#e0e0e0' : '#333';

  const widgetWidth = isMobile ? 'calc(100vw - 24px)' : '370px';

  /* -------- Empty state: minimal pill -------- */
  if (processes.length === 0) {
    return (
      <>
        <div style={{
          position: 'fixed',
          bottom: isMobile ? '12px' : '20px',
          right: isMobile ? '12px' : '20px',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '7px 14px',
          borderRadius: '20px',
          backgroundColor: bg,
          border: `1px solid ${borderCol}`,
          color: textMuted,
          fontSize: '10px',
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 600,
          letterSpacing: '1px',
          boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.08)',
          opacity: 0.7,
          transition: 'opacity 0.25s, box-shadow 0.25s',
        }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.boxShadow = isDark ? '0 2px 12px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.08)'; }}
        >
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            backgroundColor: '#22c55e',
            boxShadow: '0 0 6px rgba(34,197,94,0.4)',
          }} />
          NO TASKS
        </div>
        <style>{pmStyles}</style>
      </>
    );
  }

  /* -------- Collapsed pill (has tasks but panel closed) -------- */
  if (!panelOpen) {
    return (
      <>
        <button
          onClick={() => setPanelOpen(true)}
          style={{
            position: 'fixed',
            bottom: isMobile ? '12px' : '20px',
            right: isMobile ? '12px' : '20px',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            borderRadius: '24px',
            backgroundColor: bg,
            border: `1px solid ${activeCount > 0 ? 'rgba(254,192,15,0.3)' : borderCol}`,
            color: activeCount > 0 ? '#FEC00F' : textPrimary,
            cursor: 'pointer',
            boxShadow: activeCount > 0
              ? (isDark ? '0 4px 24px rgba(254,192,15,0.15)' : '0 4px 24px rgba(254,192,15,0.12)')
              : (isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.1)'),
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: '12px',
            letterSpacing: '0.8px',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {activeCount > 0 && (
            <Loader2 size={14} style={{ animation: 'pm-spin 1s linear infinite' }} />
          )}
          {activeCount > 0 ? (
            <>{activeCount} RUNNING</>
          ) : (
            <>{processes.length} TASK{processes.length !== 1 ? 'S' : ''}</>
          )}
          {failedCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '16px', height: '16px', borderRadius: '50%',
              backgroundColor: 'rgba(239,68,68,0.15)', fontSize: '9px', color: '#ef4444',
              fontWeight: 800,
            }}>
              {failedCount}
            </span>
          )}
          <Maximize2 size={12} />
        </button>
        <style>{pmStyles}</style>
      </>
    );
  }

  /* -------- Expanded panel -------- */
  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: isMobile ? '0' : '20px',
        right: isMobile ? '0' : '20px',
        zIndex: 9998,
        width: widgetWidth,
        maxHeight: isMobile ? '60vh' : '480px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: bg,
        border: `1px solid ${borderCol}`,
        borderRadius: isMobile ? '16px 16px 0 0' : '14px',
        overflow: 'hidden',
        boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.6)' : '0 8px 40px rgba(0,0,0,0.12)',
        animation: 'pm-slideIn 0.25s ease-out',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderBottom: `1px solid ${borderCol}`,
          background: headerBg,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeCount > 0 ? (
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: '#FEC00F',
                boxShadow: '0 0 8px rgba(254,192,15,0.5)',
                animation: 'pm-pulse 2s ease-in-out infinite',
              }} />
            ) : (
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: '#22c55e',
                boxShadow: '0 0 6px rgba(34,197,94,0.3)',
              }} />
            )}
            <span style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: '13px',
              color: isDark ? '#FEC00F' : '#b8860b',
              letterSpacing: '1.5px',
            }}>
              TASK MANAGER
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '20px',
              height: '18px',
              padding: '0 6px',
              borderRadius: '9px',
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              fontSize: '10px',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              color: textMuted,
            }}>
              {processes.length}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {/* Expand/Collapse all */}
            {processes.length > 1 && (
              <button
                onClick={expandedTasks.size === processes.length ? collapseAll : expandAll}
                title={expandedTasks.size === processes.length ? 'Collapse all' : 'Expand all'}
                style={{
                  padding: '4px',
                  background: 'none',
                  border: 'none',
                  color: textMuted,
                  cursor: 'pointer',
                  display: 'flex',
                  borderRadius: '4px',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = textPrimary; }}
                onMouseLeave={e => { e.currentTarget.style.color = textMuted; }}
              >
                {expandedTasks.size === processes.length ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
            {/* Clear completed */}
            {completedCount > 0 && (
              <button
                onClick={clearCompleted}
                title="Clear completed"
                style={{
                  padding: '4px',
                  background: 'none',
                  border: 'none',
                  color: textMuted,
                  cursor: 'pointer',
                  display: 'flex',
                  borderRadius: '4px',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#22c55e'; }}
                onMouseLeave={e => { e.currentTarget.style.color = textMuted; }}
              >
                <Trash2 size={13} />
              </button>
            )}
            {/* Minimize */}
            <button
              onClick={() => setPanelOpen(false)}
              title="Minimize"
              style={{
                padding: '4px',
                background: 'none',
                border: 'none',
                color: textMuted,
                cursor: 'pointer',
                display: 'flex',
                borderRadius: '4px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = textPrimary; }}
              onMouseLeave={e => { e.currentTarget.style.color = textMuted; }}
            >
              <Minimize2 size={13} />
            </button>
            {/* Close all / dismiss */}
            <button
              onClick={() => {
                clearCompleted();
                processes.filter(p => p.status !== 'pending' && p.status !== 'running').forEach(p => removeProcess(p.id));
                if (activeCount === 0) setPanelOpen(false);
              }}
              title="Close"
              style={{
                padding: '4px',
                background: 'none',
                border: 'none',
                color: textMuted,
                cursor: 'pointer',
                display: 'flex',
                borderRadius: '4px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.color = textMuted; }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Task list */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
        }}>
          {processes.map(proc => (
            <TaskItem
              key={proc.id}
              proc={proc}
              isExpanded={expandedTasks.has(proc.id)}
              onToggle={() => toggleTask(proc.id)}
              onRemove={() => removeProcess(proc.id)}
              isDark={isDark}
            />
          ))}
        </div>

        {/* Footer summary */}
        {processes.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            borderTop: `1px solid ${borderCol}`,
            backgroundColor: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.015)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              {activeCount > 0 && (
                <span style={{
                  fontSize: '10px',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  color: '#FEC00F',
                  letterSpacing: '0.5px',
                }}>
                  {activeCount} ACTIVE
                </span>
              )}
              {completedCount > 0 && (
                <span style={{
                  fontSize: '10px',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  color: '#22c55e',
                  letterSpacing: '0.5px',
                }}>
                  {completedCount} DONE
                </span>
              )}
              {failedCount > 0 && (
                <span style={{
                  fontSize: '10px',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  color: '#ef4444',
                  letterSpacing: '0.5px',
                }}>
                  {failedCount} FAILED
                </span>
              )}
            </div>
            <span style={{
              fontSize: '9px',
              color: textMuted,
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}>
              {processes.length} TOTAL
            </span>
          </div>
        )}
      </div>
      <style>{pmStyles}</style>
    </>
  );
}

/* ================================================================== */
/*  Widget CSS                                                         */
/* ================================================================== */

const pmStyles = `
  @keyframes pm-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes pm-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.85); }
  }
  @keyframes pm-slideIn {
    from { opacity: 0; transform: translateY(12px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes pm-indeterminate {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(400%); }
  }
`;

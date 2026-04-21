'use client';

/**
 * CheckpointsPanel — slide-out drawer from the right edge of the viewport
 * showing all checkpoints for a conversation.
 *
 * Triggered by a History icon button in the chat header. Restore shows an
 * inline confirm with a clear warning about destroyed messages.
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  History, X, Save, Zap, Archive, Bookmark,
  RotateCcw, Trash2, AlertTriangle, Plus,
} from 'lucide-react';
import type { YangCheckpoint, CheckpointTrigger } from '@/types/yang';

export interface CheckpointsPanelProps {
  isDark: boolean;
  open: boolean;
  onClose: () => void;
  checkpoints: YangCheckpoint[];
  loading: boolean;
  onCreate: (label?: string | null) => Promise<YangCheckpoint | null>;
  onRestore: (id: string) => Promise<{ messages_deleted: number; warning?: string } | null>;
  onDelete: (id: string) => Promise<boolean>;
}

export function CheckpointsPanel(props: CheckpointsPanelProps) {
  const { isDark, open, onClose, checkpoints, loading, onCreate, onRestore, onDelete } = props;
  const [label, setLabel]   = useState('');
  const [pendingRestore, setPendingRestore] = useState<string | null>(null);
  const [busy, setBusy]     = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setLabel('');
      setPendingRestore(null);
    }
  }, [open]);

  // Keyboard: Esc closes
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const T = {
    text:   isDark ? '#EFEFEF' : '#0A0A0B',
    muted:  isDark ? '#9A9AA3' : '#6B7280',
    dim:    isDark ? '#606068' : '#808088',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    bg:     isDark ? '#141418' : '#FFFFFF',
    cardBg: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
    hover:  isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    accent: '#6366F1',
  };

  const triggerMeta: Record<CheckpointTrigger, { Icon: any; label: string; color: string }> = {
    manual:      { Icon: Save,     label: 'Manual',      color: '#6366F1' },
    auto:        { Icon: Bookmark, label: 'Auto',        color: '#10B981' },
    pre_yolo:    { Icon: Zap,      label: 'Pre-Yolo',    color: '#EF4444' },
    pre_compact: { Icon: Archive,  label: 'Pre-Compact', color: '#F59E0B' },
    pre_restore: { Icon: RotateCcw, label: 'Pre-Restore', color: '#8B5CF6' },
  };

  const handleCreate = async () => {
    setBusy('create');
    try {
      await onCreate(label.trim() || null);
      setLabel('');
    } finally {
      setBusy(null);
    }
  };

  const handleRestoreConfirm = async (id: string) => {
    setBusy(id);
    try {
      const res = await onRestore(id);
      setPendingRestore(null);
      if (res) {
        onClose();
      }
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this checkpoint? Messages are not affected.')) return;
    setBusy(id);
    try {
      await onDelete(id);
    } finally {
      setBusy(null);
    }
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 9998,
          animation: 'chat-fadeIn 0.15s ease-out',
        }}
      />
      {/* Drawer */}
      <aside
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: 360,
          background: T.bg,
          borderLeft: `1px solid ${T.border}`,
          boxShadow: '-8px 0 32px rgba(0,0,0,0.25)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          animation: 'chat-slideInRight 0.2s cubic-bezier(.16,1,.3,1)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderBottom: `1px solid ${T.border}`,
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <History size={14} style={{ color: T.accent }} />
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, letterSpacing: '0.14em',
              color: T.muted, textTransform: 'uppercase' as const,
            }}>
              Checkpoints · {checkpoints.length}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 24, height: 24, borderRadius: 6, border: 'none',
              background: 'transparent', color: T.muted, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = T.hover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Create new */}
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              placeholder="Label (optional)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 999,
                border: `1px solid ${T.border}`,
                background: T.cardBg,
                color: T.text,
                fontSize: 12,
                outline: 'none',
                transition: 'border-color .15s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = T.accent + '55'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = T.border; }}
            />
            <button
              onClick={handleCreate}
              disabled={busy === 'create'}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: `1px solid ${T.accent}55`,
                background: T.accent + '10',
                color: T.accent,
                fontSize: 11,
                fontWeight: 600,
                cursor: busy === 'create' ? 'wait' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 4,
                transition: 'all .15s',
                whiteSpace: 'nowrap' as const,
              }}
              onMouseEnter={(e) => { if (busy !== 'create') e.currentTarget.style.background = T.accent + '20'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = T.accent + '10'; }}
            >
              <Plus size={12} />
              Create
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ padding: 20, fontSize: 12, color: T.dim, textAlign: 'center' as const }}>
              Loading…
            </div>
          ) : checkpoints.length === 0 ? (
            <div style={{ padding: 32, fontSize: 12, color: T.dim, textAlign: 'center' as const, lineHeight: 1.5 }}>
              No checkpoints yet.<br/>
              Create one to save the current conversation state.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {checkpoints.map((c) => {
                const meta = triggerMeta[c.trigger] || triggerMeta.manual;
                const Icon = meta.Icon;
                const isPending = pendingRestore === c.id;
                const isBusy    = busy === c.id;
                return (
                  <li
                    key={c.id}
                    style={{
                      borderBottom: `1px solid ${T.border}`,
                      padding: '12px 16px',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = T.hover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{
                        width: 26, height: 26, borderRadius: 999,
                        background: meta.color + '20',
                        color: meta.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Icon size={12} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12.5, fontWeight: 600, color: T.text,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                        }}>
                          {c.label || `Checkpoint ${c.id.slice(0, 8)}`}
                        </div>
                        <div style={{
                          marginTop: 2,
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          fontSize: 10, color: T.dim,
                          fontFamily: "'DM Mono', monospace",
                        }}>
                          <span style={{ color: meta.color }}>{meta.label}</span>
                          <span>·</span>
                          <span>{formatRelative(c.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {isPending ? (
                      <div style={{
                        marginTop: 10,
                        padding: 10,
                        borderRadius: 10,
                        border: `1px solid #EF444455`,
                        background: '#EF444410',
                        display: 'flex', flexDirection: 'column', gap: 8,
                      }}>
                        <div style={{
                          display: 'flex', alignItems: 'flex-start', gap: 6,
                          color: '#EF4444', fontSize: 11, lineHeight: 1.35,
                        }}>
                          <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                          <span>
                            Messages newer than this point will be deleted.
                            Generated files remain on disk.
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => handleRestoreConfirm(c.id)}
                            disabled={isBusy}
                            style={{
                              flex: 1,
                              padding: '6px 10px',
                              borderRadius: 999,
                              border: 'none',
                              background: '#EF4444',
                              color: '#fff',
                              fontSize: 11, fontWeight: 600,
                              cursor: isBusy ? 'wait' : 'pointer',
                            }}
                          >
                            {isBusy ? 'Restoring…' : 'Confirm Restore'}
                          </button>
                          <button
                            onClick={() => setPendingRestore(null)}
                            disabled={isBusy}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 999,
                              border: `1px solid ${T.border}`,
                              background: 'transparent',
                              color: T.muted,
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: 8, display: 'flex', gap: 6, paddingLeft: 36 }}>
                        <button
                          onClick={() => setPendingRestore(c.id)}
                          disabled={!!busy}
                          style={iconBtnStyle(T, T.accent)}
                          title="Restore to this checkpoint"
                        >
                          <RotateCcw size={11} />
                          Restore
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={!!busy}
                          style={iconBtnStyle(T, '#EF4444')}
                          title="Delete checkpoint"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <style>{`
        @keyframes chat-slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>,
    document.body,
  );
}

function iconBtnStyle(T: any, accent: string): React.CSSProperties {
  return {
    padding: '4px 10px',
    borderRadius: 999,
    border: `1px solid ${T.border}`,
    background: 'transparent',
    color: accent,
    fontSize: 10.5,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    transition: 'all .15s',
  };
}

function formatRelative(iso: string): string {
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diff = Math.floor((now - d.getTime()) / 1000);
    if (diff < 60)       return 'just now';
    if (diff < 3600)     return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)    return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800)   return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString();
  } catch {
    return '';
  }
}

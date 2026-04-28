'use client';

/**
 * Knowledge Stacks page — Msty-style stacks management.
 * Backend contract: DevBackend/Documentation/KNOWLEDGE_STACKS_GUIDE.md
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Database,
  Plus,
  RefreshCw,
  Trash2,
  Pencil,
  X,
  FileText,
  Upload,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Layers,
  HardDrive,
  Boxes,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  ArrowRightLeft,
  Settings as SettingsIcon,
} from 'lucide-react';
import stacksApi from '@/lib/stacksApi';
import type {
  KnowledgeStack,
  StackDocument,
  StackSettings,
} from '@/types/stacks';
import {
  DEFAULT_STACK_SETTINGS,
  STACK_COLOR_CHOICES,
  STACK_ICON_CHOICES,
} from '@/types/stacks';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function timeAgo(iso: string): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ═════════════════════════════════════════════════════════════════════════════
// Main component
// ═════════════════════════════════════════════════════════════════════════════

export function KnowledgeStacksPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { isMobile } = useResponsive();

  const colors = useMemo(
    () => ({
      background: 'var(--bg)',
      cardBg: 'var(--bg-card)',
      inputBg: 'var(--bg-raised)',
      border: 'var(--border)',
      text: 'var(--text)',
      textMuted: 'var(--text-muted)',
      hoverBg: 'var(--bg-card-hover)',
      shadow: 'var(--shadow-card)',
    }),
    [],
  );

  const [stacks, setStacks] = useState<KnowledgeStack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStackId, setActiveStackId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingStack, setEditingStack] = useState<KnowledgeStack | null>(null);
  const [deletingStack, setDeletingStack] = useState<KnowledgeStack | null>(null);

  const loadStacks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await stacksApi.list();
      setStacks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load stacks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStacks();
  }, [loadStacks]);

  const activeStack = useMemo(
    () => stacks.find((s) => s.id === activeStackId) || null,
    [stacks, activeStackId],
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  const dot = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.background,
        backgroundImage: [
          `radial-gradient(ellipse 120% 50% at 60% -8%, rgba(254,192,15,0.045) 0%, transparent 55%)`,
          `radial-gradient(${dot} 1px, transparent 1px)`,
        ].join(', '),
        backgroundSize: 'auto, 24px 24px',
        fontFamily: "'Instrument Sans', 'Quicksand', sans-serif",
        color: colors.text,
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          height: 1,
          background:
            'linear-gradient(90deg, transparent 0%, var(--accent) 45%, rgba(254,192,15,0.25) 65%, transparent 100%)',
          opacity: 0.45,
        }}
      />

      {/* Header */}
      <div
        style={{
          borderBottom: `1px solid ${colors.border}`,
          padding: isMobile ? '24px 20px 0' : '40px 52px 0',
        }}
      >
        <div style={{ maxWidth: 1360, margin: '0 auto' }}>
          {activeStack ? (
            <button
              onClick={() => setActiveStackId(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: colors.textMuted,
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: 0,
                marginBottom: 14,
              }}
            >
              <ArrowLeft size={13} /> All Stacks
            </button>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(254,192,15,0.08)',
                border: '1px solid rgba(254,192,15,0.2)',
                borderRadius: 100,
                padding: '4px 14px 4px 10px',
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  animation: 'kb-pulse 2.4s ease-in-out infinite',
                }}
              />
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--accent)',
                }}
              >
                Knowledge Stacks · {stacks.length} {stacks.length === 1 ? 'stack' : 'stacks'}
              </span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: isMobile ? 'flex-start' : 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexDirection: isMobile ? 'column' : 'row',
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {activeStack && (
                <div
                  style={{
                    width: isMobile ? 48 : 60,
                    height: isMobile ? 48 : 60,
                    borderRadius: 14,
                    background: `${activeStack.color || 'var(--accent)'}22`,
                    border: `1px solid ${activeStack.color || 'var(--accent)'}55`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isMobile ? 24 : 30,
                  }}
                >
                  {activeStack.icon || '📊'}
                </div>
              )}
              <div>
                <h1
                  style={{
                    fontFamily: "'Syne', var(--font-rajdhani), sans-serif",
                    fontSize: isMobile ? 26 : 40,
                    fontWeight: 800,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.08,
                    color: colors.text,
                    margin: 0,
                  }}
                >
                  {activeStack ? (
                    activeStack.name
                  ) : (
                    <>
                      Knowledge <span style={{ color: 'var(--accent)' }}>Stacks</span>
                    </>
                  )}
                </h1>
                <p
                  style={{
                    fontSize: 13,
                    color: colors.textMuted,
                    lineHeight: 1.7,
                    margin: '6px 0 0',
                  }}
                >
                  {activeStack
                    ? activeStack.description || 'Curated collection of documents for chat context.'
                    : 'Bundle related documents into curated, RAG-ready collections.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <IconButton title="Refresh" onClick={loadStacks} colors={colors}>
                <RefreshCw size={14} />
              </IconButton>
              {activeStack ? (
                <>
                  <PrimaryButton onClick={() => setEditingStack(activeStack)}>
                    <Pencil size={13} /> Edit
                  </PrimaryButton>
                  <SecondaryButton
                    onClick={() => setDeletingStack(activeStack)}
                    colors={colors}
                    danger
                  >
                    <Trash2 size={13} /> Delete
                  </SecondaryButton>
                </>
              ) : (
                <PrimaryButton onClick={() => setCreateOpen(true)}>
                  <Plus size={13} /> New Stack
                </PrimaryButton>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          padding: isMobile ? '20px 20px' : '28px 52px 64px',
          maxWidth: 1360,
          margin: '0 auto',
        }}
      >
        {error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 12,
              padding: '11px 18px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={15} color="#EF4444" />
              <p style={{ color: '#FCA5A5', fontSize: 12.5, margin: 0 }}>{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: colors.textMuted,
                fontSize: 16,
              }}
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <LoadingSpinner colors={colors} message="Loading knowledge stacks…" />
        ) : activeStack ? (
          <StackDetail
            stack={activeStack}
            colors={colors}
            isDark={isDark}
            isMobile={isMobile}
            onStackChanged={loadStacks}
            onError={setError}
          />
        ) : (
          <StacksGrid
            stacks={stacks}
            colors={colors}
            isMobile={isMobile}
            onOpen={(s) => setActiveStackId(s.id)}
            onEdit={(s) => setEditingStack(s)}
            onDelete={(s) => setDeletingStack(s)}
            onCreate={() => setCreateOpen(true)}
          />
        )}
      </div>

      {/* Modals */}
      {createOpen && (
        <StackEditorModal
          mode="create"
          colors={colors}
          isDark={isDark}
          onClose={() => setCreateOpen(false)}
          onSaved={(s) => {
            setCreateOpen(false);
            setStacks((prev) => [s, ...prev]);
            setActiveStackId(s.id);
          }}
        />
      )}

      {editingStack && (
        <StackEditorModal
          mode="edit"
          stack={editingStack}
          colors={colors}
          isDark={isDark}
          onClose={() => setEditingStack(null)}
          onSaved={(s) => {
            setEditingStack(null);
            setStacks((prev) => prev.map((p) => (p.id === s.id ? s : p)));
          }}
        />
      )}

      {deletingStack && (
        <DeleteStackModal
          stack={deletingStack}
          colors={colors}
          onClose={() => setDeletingStack(null)}
          onDeleted={(id) => {
            setDeletingStack(null);
            setStacks((prev) => prev.filter((s) => s.id !== id));
            if (activeStackId === id) setActiveStackId(null);
          }}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes kb-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.3; transform: scale(0.55); }
        }
      `}</style>
    </div>
  );
}

export default KnowledgeStacksPage;

// ═════════════════════════════════════════════════════════════════════════════
// Sub-components
// ═════════════════════════════════════════════════════════════════════════════

function LoadingSpinner({ colors, message }: { colors: any; message: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 0',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: 'rgba(254,192,15,0.08)',
          border: '1px solid rgba(254,192,15,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loader2 size={22} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
      <p
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: colors.textMuted,
        }}
      >
        {message}
      </p>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  title,
  colors,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  colors: any;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 38,
        height: 38,
        borderRadius: 9,
        border: `1px solid ${colors.border}`,
        background: colors.cardBg,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.textMuted,
        boxShadow: colors.shadow,
        transition: 'border-color .2s, color .2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(254,192,15,0.35)';
        e.currentTarget.style.color = 'var(--accent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border;
        e.currentTarget.style.color = colors.textMuted;
      }}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 38,
        padding: '0 16px',
        borderRadius: 9,
        border: '1px solid rgba(254,192,15,0.4)',
        background: 'rgba(254,192,15,0.12)',
        color: 'var(--accent)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        fontFamily: "'Syne', sans-serif",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        transition: 'background .15s',
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = 'rgba(254,192,15,0.2)';
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = 'rgba(254,192,15,0.12)';
      }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  colors,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  colors: any;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 38,
        padding: '0 16px',
        borderRadius: 9,
        border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : colors.border}`,
        background: danger ? 'rgba(239,68,68,0.08)' : colors.cardBg,
        color: danger ? '#FCA5A5' : colors.textMuted,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        fontFamily: "'Syne', sans-serif",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        transition: 'background .15s',
      }}
    >
      {children}
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Stacks grid
// ═════════════════════════════════════════════════════════════════════════════

function StacksGrid({
  stacks,
  colors,
  isMobile,
  onOpen,
  onEdit,
  onDelete,
  onCreate,
}: {
  stacks: KnowledgeStack[];
  colors: any;
  isMobile: boolean;
  onOpen: (s: KnowledgeStack) => void;
  onEdit: (s: KnowledgeStack) => void;
  onDelete: (s: KnowledgeStack) => void;
  onCreate: () => void;
}) {
  if (stacks.length === 0) {
    return (
      <div
        style={{
          background: colors.cardBg,
          border: `1px dashed ${colors.border}`,
          borderRadius: 16,
          padding: '64px 24px',
          textAlign: 'center',
          boxShadow: colors.shadow,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            margin: '0 auto 18px',
            background: 'rgba(254,192,15,0.08)',
            border: '1px solid rgba(254,192,15,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Layers size={26} color="var(--accent)" />
        </div>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 700,
            margin: '0 0 8px',
            color: colors.text,
          }}
        >
          No stacks yet
        </h2>
        <p
          style={{
            color: colors.textMuted,
            margin: '0 auto 22px',
            maxWidth: 420,
            fontSize: 13.5,
            lineHeight: 1.6,
          }}
        >
          Create your first knowledge stack to bundle related documents together for
          targeted retrieval in chat.
        </p>
        <button
          onClick={onCreate}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 10,
            border: '1px solid rgba(254,192,15,0.4)',
            background: 'rgba(254,192,15,0.12)',
            color: 'var(--accent)',
            cursor: 'pointer',
            fontFamily: "'Syne', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          <Plus size={14} /> Create stack
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}
    >
      {stacks.map((s) => (
        <StackCard
          key={s.id}
          stack={s}
          colors={colors}
          onOpen={() => onOpen(s)}
          onEdit={() => onEdit(s)}
          onDelete={() => onDelete(s)}
        />
      ))}
    </div>
  );
}

function StackCard({
  stack,
  colors,
  onOpen,
  onEdit,
  onDelete,
}: {
  stack: KnowledgeStack;
  colors: any;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const accent = stack.color || 'var(--accent)';
  return (
    <div
      onClick={onOpen}
      style={{
        background: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: colors.shadow,
        position: 'relative',
        cursor: 'pointer',
        transition: 'transform .15s, border-color .15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${accent}55`;
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${accent}, transparent)`,
          opacity: 0.7,
        }}
      />
      <div style={{ padding: '20px 18px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `${accent}22`,
              border: `1px solid ${accent}55`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            {stack.icon || '📊'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                color: colors.text,
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {stack.name}
            </h3>
            {stack.description && (
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 12,
                  color: colors.textMuted,
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {stack.description}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <CardIcon onClick={onEdit} title="Edit" colors={colors}>
              <Pencil size={12} />
            </CardIcon>
            <CardIcon onClick={onDelete} title="Delete" colors={colors} danger>
              <Trash2 size={12} />
            </CardIcon>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            paddingTop: 12,
            borderTop: `1px solid ${colors.border}`,
          }}
        >
          <Stat label="Docs" value={String(stack.document_count).padStart(2, '0')} colors={colors} />
          <Stat label="Chunks" value={String(stack.total_chunks).padStart(2, '0')} colors={colors} />
          <Stat label="Size" value={formatBytes(stack.total_size_bytes)} colors={colors} />
        </div>

        <div
          style={{
            marginTop: 12,
            fontFamily: "'DM Mono', monospace",
            fontSize: 9.5,
            color: colors.textMuted,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Updated {timeAgo(stack.updated_at)}
        </div>
      </div>
    </div>
  );
}

function CardIcon({
  children,
  onClick,
  title,
  colors,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  colors: any;
  danger?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      style={{
        width: 26,
        height: 26,
        borderRadius: 7,
        border: `1px solid ${colors.border}`,
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: danger ? '#EF4444' : colors.textMuted,
        transition: 'background .15s, border-color .15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.08)' : colors.hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 14,
          color: colors.text,
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 8.5,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: colors.textMuted,
          marginTop: 3,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Stack detail (drop zone, document table)
// ═════════════════════════════════════════════════════════════════════════════

function StackDetail({
  stack,
  colors,
  isDark,
  isMobile,
  onStackChanged,
  onError,
}: {
  stack: KnowledgeStack;
  colors: any;
  isDark: boolean;
  isMobile: boolean;
  onStackChanged: () => void;
  onError: (msg: string) => void;
}) {
  const [docs, setDocs] = useState<StackDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [moveDialog, setMoveDialog] = useState<StackDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<Set<string>>(new Set());

  const reloadDocs = useCallback(async () => {
    try {
      setDocsLoading(true);
      const res = await stacksApi.listDocuments(stack.id, { limit: 200 });
      setDocs(res.documents || []);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Failed to load documents');
    } finally {
      setDocsLoading(false);
    }
  }, [stack.id, onError]);

  useEffect(() => {
    reloadDocs();
  }, [reloadDocs]);

  // Poll status for any documents currently processing
  useEffect(() => {
    const processingIds = docs
      .filter((d) => !d.is_processed && d.status !== 'error')
      .map((d) => d.id);

    if (processingIds.length === 0) return;

    let cancelled = false;
    const tick = async () => {
      for (const id of processingIds) {
        if (cancelled) return;
        if (pollingRef.current.has(id)) continue;
        pollingRef.current.add(id);
        try {
          const status = await stacksApi.getDocumentStatus(id);
          if (cancelled) return;
          if (status.ready) {
            setDocs((prev) =>
              prev.map((d) =>
                d.id === id
                  ? {
                      ...d,
                      is_processed: true,
                      status: 'ready',
                      chunk_count: status.chunk_count ?? d.chunk_count,
                    }
                  : d,
              ),
            );
            // Trigger stack stats refresh once a doc finishes
            onStackChanged();
          } else if (status.status === 'error') {
            setDocs((prev) =>
              prev.map((d) => (d.id === id ? { ...d, status: 'error' } : d)),
            );
          }
        } catch {
          /* keep polling */
        } finally {
          pollingRef.current.delete(id);
        }
      }
    };

    const interval = setInterval(tick, 2500);
    tick();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [docs, onStackChanged]);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      if (arr.length === 0) return;
      setUploading(true);
      try {
        if (arr.length === 1) {
          const r = await stacksApi.upload(stack.id, arr[0]);
          if (r.status === 'error') throw new Error(r.error || 'Upload failed');
        } else {
          await stacksApi.uploadBatch(stack.id, arr);
        }
        await reloadDocs();
        onStackChanged();
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [stack.id, reloadDocs, onStackChanged, onError],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleDeleteDoc = useCallback(
    async (doc: StackDocument) => {
      if (!confirm(`Delete "${doc.filename}"? This will remove the document and its chunks.`)) return;
      try {
        await stacksApi.deleteDocument(stack.id, doc.id, true);
        setDocs((prev) => prev.filter((d) => d.id !== doc.id));
        onStackChanged();
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Delete failed');
      }
    },
    [stack.id, onStackChanged, onError],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Settings summary */}
      <SettingsSummary stack={stack} colors={colors} />

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${
            dragActive ? 'var(--accent)' : colors.border
          }`,
          borderRadius: 16,
          padding: isMobile ? 24 : 36,
          textAlign: 'center',
          cursor: 'pointer',
          background: dragActive ? 'rgba(254,192,15,0.06)' : colors.cardBg,
          transition: 'background .2s, border-color .2s',
          boxShadow: colors.shadow,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            margin: '0 auto 14px',
            background: 'rgba(254,192,15,0.1)',
            border: '1px solid rgba(254,192,15,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {uploading ? (
            <Loader2 size={22} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Upload size={22} color="var(--accent)" />
          )}
        </div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: colors.text }}>
          {uploading ? 'Uploading…' : 'Drop files here or click to browse'}
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: colors.textMuted }}>
          PDF, DOCX, TXT, MD, CSV, JSON, XLSX, HTML, RTF
        </p>
      </div>

      {/* Document table */}
      <div
        style={{
          background: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: colors.shadow,
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={14} color="var(--accent)" />
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9.5,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: colors.textMuted,
              }}
            >
              Documents · {docs.length}
            </span>
          </div>
          <button
            onClick={reloadDocs}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: colors.textMuted,
              padding: 4,
              display: 'flex',
            }}
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {docsLoading ? (
          <div style={{ padding: 40 }}>
            <LoadingSpinner colors={colors} message="Loading documents…" />
          </div>
        ) : docs.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>
            No documents yet. Upload some to get started.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: colors.textMuted,
                    textAlign: 'left',
                  }}
                >
                  <th style={{ padding: '10px 18px', fontWeight: 500 }}>Filename</th>
                  <th style={{ padding: '10px 8px', fontWeight: 500 }}>Status</th>
                  <th style={{ padding: '10px 8px', fontWeight: 500 }}>Chunks</th>
                  <th style={{ padding: '10px 8px', fontWeight: 500 }}>Size</th>
                  <th style={{ padding: '10px 8px', fontWeight: 500 }}>Added</th>
                  <th style={{ padding: '10px 18px', fontWeight: 500, width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <DocRow
                    key={d.id}
                    doc={d}
                    colors={colors}
                    onMove={() => setMoveDialog(d)}
                    onDelete={() => handleDeleteDoc(d)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {moveDialog && (
        <MoveDocModal
          doc={moveDialog}
          fromStack={stack}
          colors={colors}
          onClose={() => setMoveDialog(null)}
          onMoved={(docId) => {
            setMoveDialog(null);
            setDocs((prev) => prev.filter((d) => d.id !== docId));
            onStackChanged();
          }}
        />
      )}
    </div>
  );
}

function SettingsSummary({ stack, colors }: { stack: KnowledgeStack; colors: any }) {
  const s = { ...DEFAULT_STACK_SETTINGS, ...(stack.settings || {}) };
  const items = [
    { label: 'Chunk', value: s.chunk_size },
    { label: 'Per Query', value: s.chunk_count },
    { label: 'Overlap', value: s.overlap },
    { label: 'Mode', value: s.load_mode },
    { label: 'Embeddings', value: s.generate_embeddings ? 'On' : 'Off' },
  ];
  return (
    <div
      style={{
        background: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: '12px 18px',
        boxShadow: colors.shadow,
        display: 'flex',
        gap: 18,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <SettingsIcon size={13} color="var(--accent)" />
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9.5,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: colors.textMuted,
          }}
        >
          Settings
        </span>
      </div>
      {items.map((it) => (
        <div key={it.label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9.5,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: colors.textMuted,
            }}
          >
            {it.label}
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: colors.text }}>{String(it.value)}</span>
        </div>
      ))}
    </div>
  );
}

function DocRow({
  doc,
  colors,
  onMove,
  onDelete,
}: {
  doc: StackDocument;
  colors: any;
  onMove: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status: 'processing' | 'ready' | 'error' =
    doc.status === 'error'
      ? 'error'
      : doc.is_processed
      ? 'ready'
      : 'processing';

  const statusInfo =
    status === 'ready'
      ? { color: '#10B981', icon: <CheckCircle2 size={11} />, label: 'Ready' }
      : status === 'error'
      ? { color: '#EF4444', icon: <AlertTriangle size={11} />, label: 'Error' }
      : { color: '#F59E0B', icon: <Clock size={11} />, label: 'Processing' };

  return (
    <tr style={{ borderTop: `1px solid ${colors.border}` }}>
      <td style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'rgba(254,192,15,0.08)',
              border: '1px solid rgba(254,192,15,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FileText size={13} color="var(--accent)" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: colors.text,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 320,
              }}
            >
              {doc.title || doc.filename}
            </div>
            {doc.title && doc.title !== doc.filename && (
              <div style={{ fontSize: 11, color: colors.textMuted }}>{doc.filename}</div>
            )}
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 8px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px',
            borderRadius: 6,
            background: `${statusInfo.color}18`,
            color: statusInfo.color,
            fontSize: 10.5,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {statusInfo.icon}
          {statusInfo.label}
        </span>
      </td>
      <td style={{ padding: '12px 8px', fontFamily: "'DM Mono', monospace", color: colors.textMuted }}>
        {doc.chunk_count ?? '—'}
      </td>
      <td style={{ padding: '12px 8px', fontFamily: "'DM Mono', monospace", color: colors.textMuted }}>
        {doc.file_size ? formatBytes(doc.file_size) : '—'}
      </td>
      <td
        style={{
          padding: '12px 8px',
          fontFamily: "'DM Mono', monospace",
          color: colors.textMuted,
          fontSize: 11,
        }}
      >
        {timeAgo(doc.created_at)}
      </td>
      <td style={{ padding: '12px 18px', textAlign: 'right', position: 'relative' }}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            border: `1px solid ${colors.border}`,
            background: 'transparent',
            cursor: 'pointer',
            color: colors.textMuted,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MoreHorizontal size={13} />
        </button>
        {menuOpen && (
          <>
            <div
              onClick={() => setMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 50 }}
            />
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 16,
                marginTop: 4,
                minWidth: 160,
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                zIndex: 60,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onMove();
                }}
                style={menuItemStyle(colors)}
              >
                <ArrowRightLeft size={12} /> Move to stack…
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                style={{ ...menuItemStyle(colors), color: '#EF4444' }}
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  );
}

function menuItemStyle(colors: any): React.CSSProperties {
  return {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 12px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: colors.text,
    fontSize: 12.5,
    textAlign: 'left',
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// Modals
// ═════════════════════════════════════════════════════════════════════════════

function ModalFrame({
  title,
  onClose,
  children,
  colors,
  width = 560,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  colors: any;
  width?: number;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          background: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: "'Syne', sans-serif",
              fontSize: 16,
              fontWeight: 700,
              color: colors.text,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: colors.textMuted,
              padding: 4,
              display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', padding: 18 }}>{children}</div>
      </div>
    </div>
  );
}

function StackEditorModal({
  mode,
  stack,
  colors,
  isDark,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit';
  stack?: KnowledgeStack;
  colors: any;
  isDark: boolean;
  onClose: () => void;
  onSaved: (s: KnowledgeStack) => void;
}) {
  const [name, setName] = useState(stack?.name || '');
  const [description, setDescription] = useState(stack?.description || '');
  const [icon, setIcon] = useState(stack?.icon || '📊');
  const [color, setColor] = useState(stack?.color || '#FEC00F');
  const [settings, setSettings] = useState<StackSettings>({
    ...DEFAULT_STACK_SETTINGS,
    ...(stack?.settings || {}),
  });
  const initialSettingsRef = useRef<StackSettings>({ ...settings });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [reindexOnSave, setReindexOnSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const settingsChanged =
    mode === 'edit' &&
    (initialSettingsRef.current.chunk_size !== settings.chunk_size ||
      initialSettingsRef.current.overlap !== settings.overlap ||
      initialSettingsRef.current.generate_embeddings !== settings.generate_embeddings);

  const handleSave = async () => {
    if (!name.trim()) {
      setErr('Name is required');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      let saved: KnowledgeStack;
      if (mode === 'create') {
        saved = await stacksApi.create({
          name: name.trim(),
          description: description.trim() || undefined,
          icon,
          color,
          settings,
        });
      } else if (stack) {
        saved = await stacksApi.update(stack.id, {
          name: name.trim(),
          description: description.trim(),
          icon,
          color,
          settings,
        });
        if (settingsChanged && reindexOnSave) {
          try {
            await stacksApi.reindex(stack.id);
          } catch {
            /* non-fatal */
          }
        }
      } else {
        return;
      }
      onSaved(saved);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalFrame
      title={mode === 'create' ? 'Create Knowledge Stack' : 'Edit Stack'}
      onClose={onClose}
      colors={colors}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Name" colors={colors}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Earnings Reports 2024"
            style={inputStyle(colors)}
            autoFocus
          />
        </Field>

        <Field label="Description" colors={colors}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's in this stack?"
            rows={2}
            style={{ ...inputStyle(colors), resize: 'vertical', fontFamily: 'inherit' }}
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Icon" colors={colors}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                padding: 8,
                border: `1px solid ${colors.border}`,
                borderRadius: 9,
                background: colors.inputBg,
                maxHeight: 110,
                overflowY: 'auto',
              }}
            >
              {STACK_ICON_CHOICES.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  type="button"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 7,
                    border: `1px solid ${icon === ic ? 'var(--accent)' : 'transparent'}`,
                    background: icon === ic ? 'rgba(254,192,15,0.12)' : 'transparent',
                    cursor: 'pointer',
                    fontSize: 16,
                  }}
                >
                  {ic}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Color" colors={colors}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                padding: 8,
                border: `1px solid ${colors.border}`,
                borderRadius: 9,
                background: colors.inputBg,
              }}
            >
              {STACK_COLOR_CHOICES.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  type="button"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: c,
                    cursor: 'pointer',
                    border:
                      color === c
                        ? '2px solid #fff'
                        : `1px solid rgba(255,255,255,0.2)`,
                    boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
          </Field>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--accent)',
            fontFamily: "'DM Mono', monospace",
            fontSize: 10.5,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textAlign: 'left',
            padding: 0,
          }}
        >
          {showAdvanced ? '− Hide' : '+ Show'} Advanced Settings
        </button>

        {showAdvanced && (
          <div
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              background: colors.inputBg,
            }}
          >
            <SliderField
              label="Chunk size"
              hint="200 – 8000 chars"
              value={settings.chunk_size}
              min={200}
              max={8000}
              step={100}
              onChange={(v) => setSettings({ ...settings, chunk_size: v })}
              colors={colors}
            />
            <SliderField
              label="Chunks per query"
              hint="1 – 100"
              value={settings.chunk_count}
              min={1}
              max={100}
              step={1}
              onChange={(v) => setSettings({ ...settings, chunk_count: v })}
              colors={colors}
            />
            <SliderField
              label="Overlap"
              hint="0 – 2000 chars"
              value={settings.overlap}
              min={0}
              max={2000}
              step={50}
              onChange={(v) => setSettings({ ...settings, overlap: v })}
              colors={colors}
            />
            <Field label="Load mode" colors={colors}>
              <select
                value={settings.load_mode}
                onChange={(e) =>
                  setSettings({ ...settings, load_mode: e.target.value as any })
                }
                style={inputStyle(colors)}
              >
                <option value="static">Static — index once</option>
                <option value="dynamic">Dynamic — re-index on every query</option>
                <option value="sync">Sync — re-index when files change</option>
              </select>
            </Field>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                fontSize: 13,
                color: colors.text,
              }}
            >
              <input
                type="checkbox"
                checked={settings.generate_embeddings}
                onChange={(e) =>
                  setSettings({ ...settings, generate_embeddings: e.target.checked })
                }
              />
              Generate embeddings (semantic vector search)
            </label>

            {settingsChanged && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  fontSize: 12.5,
                  color: 'var(--accent)',
                  paddingTop: 6,
                  borderTop: `1px dashed ${colors.border}`,
                }}
              >
                <input
                  type="checkbox"
                  checked={reindexOnSave}
                  onChange={(e) => setReindexOnSave(e.target.checked)}
                />
                Re-index existing documents with new chunk settings
              </label>
            )}
          </div>
        )}

        {err && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#FCA5A5',
              fontSize: 12.5,
            }}
          >
            {err}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
          <SecondaryButton onClick={onClose} colors={colors} disabled={saving}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {mode === 'create' ? 'Create Stack' : 'Save Changes'}
          </PrimaryButton>
        </div>
      </div>
    </ModalFrame>
  );
}

function SliderField({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
  colors,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  colors: any;
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 6,
        }}
      >
        <label style={{ fontSize: 12.5, color: colors.text, fontWeight: 600 }}>{label}</label>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: colors.textMuted,
            }}
          >
            {hint}
          </span>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              color: 'var(--accent)',
              fontWeight: 700,
              minWidth: 50,
              textAlign: 'right',
            }}
          >
            {value}
          </span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#FEC00F' }}
      />
    </div>
  );
}

function Field({
  label,
  children,
  colors,
}: {
  label: string;
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontFamily: "'DM Mono', monospace",
          fontSize: 9.5,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: colors.textMuted,
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function inputStyle(colors: any): React.CSSProperties {
  return {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 9,
    border: `1px solid ${colors.border}`,
    background: colors.inputBg,
    color: colors.text,
    fontSize: 13.5,
    outline: 'none',
    fontFamily: 'inherit',
  };
}

function DeleteStackModal({
  stack,
  colors,
  onClose,
  onDeleted,
}: {
  stack: KnowledgeStack;
  colors: any;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [cascade, setCascade] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const handleDelete = async () => {
    setBusy(true);
    setErr('');
    try {
      await stacksApi.remove(stack.id, cascade);
      onDeleted(stack.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Delete failed');
      setBusy(false);
    }
  };

  return (
    <ModalFrame title="Delete Stack" onClose={onClose} colors={colors} width={460}>
      <p style={{ margin: '0 0 14px', fontSize: 13.5, color: colors.text, lineHeight: 1.6 }}>
        Are you sure you want to delete <strong>{stack.name}</strong>?
      </p>
      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          cursor: 'pointer',
          fontSize: 13,
          color: colors.text,
          padding: 12,
          borderRadius: 9,
          border: `1px solid ${colors.border}`,
          background: colors.inputBg,
          marginBottom: 14,
        }}
      >
        <input
          type="checkbox"
          checked={cascade}
          onChange={(e) => setCascade(e.target.checked)}
          style={{ marginTop: 2 }}
        />
        <span>
          <strong>Also delete all {stack.document_count} document{stack.document_count !== 1 ? 's' : ''}</strong>{' '}
          inside this stack and remove their files from storage.
          <span style={{ display: 'block', fontSize: 11.5, color: colors.textMuted, marginTop: 4 }}>
            If unchecked, documents are unlinked from the stack but kept in your library.
          </span>
        </span>
      </label>
      {err && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#FCA5A5',
            fontSize: 12.5,
            marginBottom: 12,
          }}
        >
          {err}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <SecondaryButton onClick={onClose} colors={colors} disabled={busy}>
          Cancel
        </SecondaryButton>
        <SecondaryButton onClick={handleDelete} colors={colors} danger disabled={busy}>
          {busy ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={13} />}
          Delete
        </SecondaryButton>
      </div>
    </ModalFrame>
  );
}

function MoveDocModal({
  doc,
  fromStack,
  colors,
  onClose,
  onMoved,
}: {
  doc: StackDocument;
  fromStack: KnowledgeStack;
  colors: any;
  onClose: () => void;
  onMoved: (docId: string) => void;
}) {
  const [stacks, setStacks] = useState<KnowledgeStack[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    stacksApi
      .list()
      .then((s) => setStacks(s.filter((x) => x.id !== fromStack.id)))
      .catch((e) => setErr(e instanceof Error ? e.message : 'Failed to load stacks'))
      .finally(() => setLoading(false));
  }, [fromStack.id]);

  const handleMove = async (targetId: string) => {
    setBusy(true);
    setErr('');
    try {
      await stacksApi.moveDocument(fromStack.id, doc.id, targetId);
      onMoved(doc.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Move failed');
      setBusy(false);
    }
  };

  return (
    <ModalFrame title="Move Document" onClose={onClose} colors={colors} width={500}>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: colors.textMuted }}>
        Move <strong style={{ color: colors.text }}>{doc.title || doc.filename}</strong> to:
      </p>
      {loading ? (
        <LoadingSpinner colors={colors} message="Loading stacks…" />
      ) : stacks.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>
          No other stacks available. Create one first.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
          {stacks.map((s) => (
            <button
              key={s.id}
              disabled={busy}
              onClick={() => handleMove(s.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                background: 'transparent',
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                cursor: busy ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                color: colors.text,
                transition: 'background .15s, border-color .15s',
              }}
              onMouseEnter={(e) => {
                if (!busy) {
                  e.currentTarget.style.background = colors.hoverBg;
                  e.currentTarget.style.borderColor = `${s.color || '#FEC00F'}55`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = colors.border;
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: `${s.color || '#FEC00F'}22`,
                  border: `1px solid ${s.color || '#FEC00F'}55`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {s.icon || '📊'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: colors.textMuted }}>
                  {s.document_count} docs · {s.total_chunks} chunks
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      {err && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#FCA5A5',
            fontSize: 12.5,
            marginTop: 12,
          }}
        >
          {err}
        </div>
      )}
    </ModalFrame>
  );
}

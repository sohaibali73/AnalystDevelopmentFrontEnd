'use client';

/**
 * KnowledgeStacksPage — rebuilt against the backend brief.
 * Backend contract: /stacks/* endpoints
 *
 * Preview path: KBFileViewerModal → /brain/documents/{id}/download
 * Model path:   stacksApi.getContext() → /stacks/{id}/context (used in ChatPage only)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
  AlertTriangle,
  ArrowRightLeft,
  Settings as SettingsIcon,
  RotateCcw,
} from 'lucide-react';
import stacksApi from '@/lib/stacksApi';
import kbApi from '@/lib/kbApi';
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
import KBFileViewerModal from '@/components/knowledge/KBFileViewerModal';
import type { KBDocument } from '@/types/kb';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function LoadingSpinner({ colors, message }: { colors: any; message: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(254,192,15,0.08)', border: '1px solid rgba(254,192,15,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={22} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.textMuted }}>{message}</p>
    </div>
  );
}

function IconButton({ children, onClick, title, colors }: { children: React.ReactNode; onClick: () => void; title: string; colors: any }) {
  return (
    <button onClick={onClick} title={title} style={{ width: 38, height: 38, borderRadius: 9, border: `1px solid ${colors.border}`, background: colors.cardBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textMuted, boxShadow: colors.shadow, transition: 'border-color .2s, color .2s' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(254,192,15,0.35)'; e.currentTarget.style.color = 'var(--accent)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textMuted; }}>
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick, disabled, type = 'button' }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ height: 38, padding: '0 16px', borderRadius: 9, border: '1px solid rgba(254,192,15,0.4)', background: 'rgba(254,192,15,0.12)', color: 'var(--accent)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', transition: 'background .15s' }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = 'rgba(254,192,15,0.2)'; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = 'rgba(254,192,15,0.12)'; }}>
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick, colors, danger, disabled }: { children: React.ReactNode; onClick?: () => void; colors: any; danger?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ height: 38, padding: '0 16px', borderRadius: 9, border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : colors.border}`, background: danger ? 'rgba(239,68,68,0.08)' : colors.cardBg, color: danger ? '#FCA5A5' : colors.textMuted, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', transition: 'background .15s' }}>
      {children}
    </button>
  );
}

function ModalFrame({ title, onClose, colors, width = 560, children }: { title: string; onClose: () => void; colors: any; width?: number; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: width, maxHeight: '90vh', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: colors.text, margin: 0, letterSpacing: '-0.01em' }}>{title}</h2>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${colors.border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textMuted }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function KnowledgeStacksPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { isMobile } = useResponsive();

  const colors = useMemo(() => ({
    background: 'var(--bg)',
    cardBg: 'var(--bg-card)',
    inputBg: 'var(--bg-raised)',
    border: 'var(--border)',
    text: 'var(--text)',
    textMuted: 'var(--text-muted)',
    hoverBg: 'var(--bg-card-hover)',
    shadow: 'var(--shadow-card)',
  }), []);

  const [stacks, setStacks] = useState<KnowledgeStack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStackId, setActiveStackId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingStack, setEditingStack] = useState<KnowledgeStack | null>(null);
  const [deletingStack, setDeletingStack] = useState<KnowledgeStack | null>(null);
  const [viewerDoc, setViewerDoc] = useState<KBDocument | null>(null);

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

  useEffect(() => { loadStacks(); }, [loadStacks]);

  const activeStack = useMemo(() => stacks.find((s) => s.id === activeStackId) || null, [stacks, activeStackId]);

  const dot = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background, backgroundImage: [`radial-gradient(ellipse 120% 50% at 60% -8%, rgba(254,192,15,0.045) 0%, transparent 55%)`, `radial-gradient(${dot} 1px, transparent 1px)`].join(', '), backgroundSize: 'auto, 24px 24px', fontFamily: "'Instrument Sans', 'Quicksand', sans-serif", color: colors.text }}>
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, var(--accent) 45%, rgba(254,192,15,0.25) 65%, transparent 100%)', opacity: 0.45 }} />

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${colors.border}`, padding: isMobile ? '24px 20px 0' : '40px 52px 0' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto' }}>
          {activeStack ? (
            <button onClick={() => setActiveStackId(null)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: 0, marginBottom: 14 }}>
              <ArrowLeft size={13} /> All Stacks
            </button>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(254,192,15,0.08)', border: '1px solid rgba(254,192,15,0.2)', borderRadius: 100, padding: '4px 14px 4px 10px', marginBottom: 14 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animation: 'kb-pulse 2.4s ease-in-out infinite' }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                Knowledge Stacks · {stacks.length} {stacks.length === 1 ? 'stack' : 'stacks'}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 16, flexDirection: isMobile ? 'column' : 'row', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {activeStack && (
                <div style={{ width: isMobile ? 48 : 60, height: isMobile ? 48 : 60, borderRadius: 14, background: `${activeStack.color || 'var(--accent)'}22`, border: `1px solid ${activeStack.color || 'var(--accent)'}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 24 : 30 }}>
                  {activeStack.icon || '📊'}
                </div>
              )}
              <div>
                <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: isMobile ? 26 : 40, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.08, color: colors.text, margin: 0 }}>
                  {activeStack ? activeStack.name : (<>Knowledge <span style={{ color: 'var(--accent)' }}>Stacks</span></>)}
                </h1>
                <p style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.7, margin: '6px 0 0' }}>
                  {activeStack ? (activeStack.description || 'Curated collection of documents for chat context.') : 'Bundle related documents into curated, RAG-ready collections.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <IconButton title="Refresh" onClick={loadStacks} colors={colors}><RefreshCw size={14} /></IconButton>
              {activeStack ? (
                <>
                  <PrimaryButton onClick={() => setEditingStack(activeStack)}><Pencil size={13} /> Edit</PrimaryButton>
                  <SecondaryButton onClick={() => setDeletingStack(activeStack)} colors={colors} danger><Trash2 size={13} /> Delete</SecondaryButton>
                </>
              ) : (
                <PrimaryButton onClick={() => setCreateOpen(true)}><Plus size={13} /> New Stack</PrimaryButton>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: isMobile ? '20px' : '28px 52px 64px', maxWidth: 1360, margin: '0 auto' }}>
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '11px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={15} color="#EF4444" />
              <p style={{ color: '#FCA5A5', fontSize: 12.5, margin: 0 }}>{error}</p>
            </div>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, fontSize: 16 }}>×</button>
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
            onViewDocument={setViewerDoc}
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
        <StackEditorModal mode="create" colors={colors} isDark={isDark} onClose={() => setCreateOpen(false)}
          onSaved={(s) => { setCreateOpen(false); setStacks((prev) => [s, ...prev]); setActiveStackId(s.id); }} />
      )}
      {editingStack && (
        <StackEditorModal mode="edit" stack={editingStack} colors={colors} isDark={isDark} onClose={() => setEditingStack(null)}
          onSaved={(s) => { setEditingStack(null); setStacks((prev) => prev.map((p) => (p.id === s.id ? s : p))); }} />
      )}
      {deletingStack && (
        <DeleteStackModal stack={deletingStack} colors={colors} onClose={() => setDeletingStack(null)}
          onDeleted={(id) => { setDeletingStack(null); setStacks((prev) => prev.filter((s) => s.id !== id)); if (activeStackId === id) setActiveStackId(null); }} />
      )}
      {viewerDoc && (
        <KBFileViewerModal doc={viewerDoc} onClose={() => setViewerDoc(null)} isDark={isDark} colors={colors} />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes kb-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(0.55); } }
      `}</style>
    </div>
  );
}

export default KnowledgeStacksPage;

// ─── Stacks grid ──────────────────────────────────────────────────────────────

function StacksGrid({ stacks, colors, isMobile, onOpen, onEdit, onDelete, onCreate }: { stacks: KnowledgeStack[]; colors: any; isMobile: boolean; onOpen: (s: KnowledgeStack) => void; onEdit: (s: KnowledgeStack) => void; onDelete: (s: KnowledgeStack) => void; onCreate: () => void }) {
  if (stacks.length === 0) {
    return (
      <div style={{ background: colors.cardBg, border: `1px dashed ${colors.border}`, borderRadius: 16, padding: '64px 24px', textAlign: 'center', boxShadow: colors.shadow }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, margin: '0 auto 18px', background: 'rgba(254,192,15,0.08)', border: '1px solid rgba(254,192,15,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Layers size={26} color="var(--accent)" />
        </div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: colors.text }}>No stacks yet</h2>
        <p style={{ color: colors.textMuted, margin: '0 auto 22px', maxWidth: 420, fontSize: 13.5, lineHeight: 1.6 }}>
          Create your first knowledge stack to bundle related documents together for targeted retrieval in chat.
        </p>
        <button onClick={onCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(254,192,15,0.4)', background: 'rgba(254,192,15,0.12)', color: 'var(--accent)', cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          <Plus size={14} /> Create stack
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
      {stacks.map((s) => (
        <StackCard key={s.id} stack={s} colors={colors} onOpen={() => onOpen(s)} onEdit={() => onEdit(s)} onDelete={() => onDelete(s)} />
      ))}
    </div>
  );
}

function StackCard({ stack, colors, onOpen, onEdit, onDelete }: { stack: KnowledgeStack; colors: any; onOpen: () => void; onEdit: () => void; onDelete: () => void }) {
  const accent = stack.color || 'var(--accent)';
  return (
    <div onClick={onOpen} style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: colors.shadow, position: 'relative', cursor: 'pointer', transition: 'transform .15s, border-color .15s' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${accent}55`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.transform = 'translateY(0)'; }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${accent}, transparent)`, opacity: 0.7 }} />
      <div style={{ padding: '20px 18px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${accent}22`, border: `1px solid ${accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            {stack.icon || '📊'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colors.text, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stack.name}</h3>
            {stack.description && (
              <p style={{ margin: '4px 0 0', fontSize: 12, color: colors.textMuted, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{stack.description}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Edit" style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${colors.border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textMuted }}>
              <Pencil size={12} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete" style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, paddingTop: 12, borderTop: `1px solid ${colors.border}` }}>
          {[
            { label: 'Docs', value: String(stack.document_count).padStart(2, '0') },
            { label: 'Chunks', value: String(stack.total_chunks).padStart(2, '0') },
            { label: 'Size', value: formatBytes(stack.total_size_bytes) },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: colors.text, letterSpacing: '-0.01em', lineHeight: 1 }}>{value}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: colors.textMuted, marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontFamily: "'DM Mono', monospace", fontSize: 9.5, color: colors.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Updated {timeAgo(stack.updated_at)}
        </div>
      </div>
    </div>
  );
}

// ─── Stack detail ─────────────────────────────────────────────────────────────

function StackDetail({ stack, colors, isDark, isMobile, onStackChanged, onError, onViewDocument }: { stack: KnowledgeStack; colors: any; isDark: boolean; isMobile: boolean; onStackChanged: () => void; onError: (msg: string) => void; onViewDocument: (doc: KBDocument) => void }) {
  const [docs, setDocs] = useState<StackDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [moveDialog, setMoveDialog] = useState<StackDocument | null>(null);
  const [reindexing, setReindexing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

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

  useEffect(() => { reloadDocs(); }, [reloadDocs]);

  // Poll processing docs
  useEffect(() => {
    const processingIds = docs.filter((d) => !d.is_processed && d.status !== 'error').map((d) => d.id);
    if (processingIds.length === 0) return;

    processingIds.forEach((id) => {
      if (pollingRef.current.has(id)) return;
      const intervalId = setInterval(async () => {
        try {
          const status = await stacksApi.getDocumentStatus(id);
          if (status.ready || status.status === 'error') {
            clearInterval(pollingRef.current.get(id)!);
            pollingRef.current.delete(id);
            setDocs((prev) => prev.map((d) => d.id === id ? { ...d, is_processed: status.ready, status: status.status, chunk_count: status.chunk_count ?? d.chunk_count } : d));
            if (status.ready) onStackChanged();
          }
        } catch { /* ignore */ }
      }, 2000);
      pollingRef.current.set(id, intervalId);
    });

    return () => {
      pollingRef.current.forEach((id) => clearInterval(id));
      pollingRef.current.clear();
    };
  }, [docs, onStackChanged]);

  const handleUpload = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const res = await stacksApi.uploadBatch(stack.id, files);
      await reloadDocs();
      onStackChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [stack.id, reloadDocs, onStackChanged, onError]);

  const handleDelete = useCallback(async (docId: string) => {
    try {
      await stacksApi.deleteDocument(stack.id, docId, true);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      onStackChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Delete failed');
    }
  }, [stack.id, onStackChanged, onError]);

  const handleReindex = useCallback(async () => {
    setReindexing(true);
    try {
      await stacksApi.reindex(stack.id);
      await reloadDocs();
      onStackChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Reindex failed');
    } finally {
      setReindexing(false);
    }
  }, [stack.id, reloadDocs, onStackChanged, onError]);

  const handleViewDoc = useCallback(async (doc: StackDocument) => {
    // Convert StackDocument to KBDocument shape for the viewer
    const kbDoc: KBDocument = {
      id: doc.id,
      filename: doc.filename,
      title: doc.title ?? undefined,
      file_size: doc.file_size ?? undefined,
      file_type: doc.file_type ?? undefined,
      chunk_count: doc.chunk_count ?? undefined,
      is_processed: doc.is_processed,
      created_at: doc.created_at,
      tags: doc.tags ?? undefined,
    };
    onViewDocument(kbDoc);
  }, [onViewDocument]);

  const accent = stack.color || 'var(--accent)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Documents', value: String(stack.document_count).padStart(2, '0'), icon: FileText, color: accent },
          { label: 'Chunks', value: String(stack.total_chunks).padStart(2, '0'), icon: Boxes, color: '#60A5FA' },
          { label: 'Total Size', value: formatBytes(stack.total_size_bytes), icon: HardDrive, color: '#34D399' },
          { label: 'Chunk Size', value: `${stack.settings?.chunk_size ?? 1500}`, icon: SettingsIcon, color: '#A78BFA' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px', boxShadow: colors.shadow, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px', background: `linear-gradient(90deg, ${color}, transparent)`, opacity: 0.55 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={13} color={color} />
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 400, color: colors.text, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: colors.textMuted, marginTop: 2 }}>{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload drop zone */}
      <div
        style={{ background: colors.cardBg, border: `2px dashed ${dragActive ? accent : colors.border}`, borderRadius: 16, padding: '28px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all .2s', backgroundColor: dragActive ? `${accent}08` : colors.cardBg }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleUpload(Array.from(e.dataTransfer.files)); }}
      >
        {uploading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Loader2 size={20} color={accent} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ color: colors.textMuted, fontSize: 13 }}>Uploading…</span>
          </div>
        ) : (
          <>
            <Upload size={22} color={accent} style={{ marginBottom: 8 }} />
            <p style={{ color: colors.text, fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>
              {dragActive ? 'Drop files here' : 'Click or drag files to add to this stack'}
            </p>
            <p style={{ color: colors.textMuted, fontSize: 11.5, margin: 0 }}>PDF, DOCX, CSV, TXT, MD, JSON, XLSX…</p>
          </>
        )}
      </div>
      <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.doc,.docx,.csv,.md,.json,.xml,.html,.xlsx,.xls,.rtf" style={{ display: 'none' }} onChange={(e) => { if (e.target.files) handleUpload(Array.from(e.target.files)); e.target.value = ''; }} />

      {/* Reindex button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleReindex} disabled={reindexing} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 9, border: `1px solid ${colors.border}`, background: colors.cardBg, color: colors.textMuted, cursor: reindexing ? 'not-allowed' : 'pointer', fontSize: 11, fontFamily: "'Syne', sans-serif", fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', opacity: reindexing ? 0.6 : 1 }}>
          {reindexing ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCcw size={12} />}
          Reindex Stack
        </button>
      </div>

      {/* Document table */}
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: colors.shadow }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: colors.textMuted }}>
            Documents · {docs.length}
          </span>
        </div>

        {docsLoading ? (
          <LoadingSpinner colors={colors} message="Loading documents…" />
        ) : docs.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <FileText size={36} color={colors.textMuted} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ color: colors.textMuted, fontSize: 13, margin: 0 }}>No documents yet. Upload files above.</p>
          </div>
        ) : (
          docs.map((doc, idx) => (
            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: idx < docs.length - 1 ? `1px solid ${colors.border}` : 'none', transition: 'background .15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = colors.hoverBg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              {/* Status icon */}
              <div style={{ flexShrink: 0 }}>
                {doc.is_processed ? (
                  <CheckCircle2 size={14} color="#22c55e" />
                ) : doc.status === 'error' ? (
                  <AlertTriangle size={14} color="#ef4444" />
                ) : (
                  <Loader2 size={14} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => handleViewDoc(doc)}>
                <p style={{ color: colors.text, fontSize: 13, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.title || doc.filename}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: colors.textMuted }}>
                    {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : '—'}
                  </span>
                  {doc.chunk_count != null && (
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: colors.textMuted }}>
                      {doc.chunk_count} chunks
                    </span>
                  )}
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: doc.is_processed ? '#22c55e' : doc.status === 'error' ? '#ef4444' : '#f59e0b' }}>
                    {doc.is_processed ? 'ready' : doc.status === 'error' ? 'error' : 'processing'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={() => setMoveDialog(doc)} title="Move to another stack" style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${colors.border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textMuted }}>
                  <ArrowRightLeft size={12} />
                </button>
                <button onClick={() => handleDelete(doc.id)} title="Remove from stack" style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Move dialog */}
      {moveDialog && (
        <MoveDocModal doc={moveDialog} fromStack={stack} colors={colors} onClose={() => setMoveDialog(null)}
          onMoved={(docId) => { setMoveDialog(null); setDocs((prev) => prev.filter((d) => d.id !== docId)); onStackChanged(); }} />
      )}
    </div>
  );
}

// ─── Stack editor modal ───────────────────────────────────────────────────────

function StackEditorModal({ mode, stack, colors, isDark, onClose, onSaved }: { mode: 'create' | 'edit'; stack?: KnowledgeStack; colors: any; isDark: boolean; onClose: () => void; onSaved: (s: KnowledgeStack) => void }) {
  const [name, setName] = useState(stack?.name ?? '');
  const [description, setDescription] = useState(stack?.description ?? '');
  const [icon, setIcon] = useState(stack?.icon ?? '📊');
  const [color, setColor] = useState(stack?.color ?? '#FEC00F');
  const [settings, setSettings] = useState<StackSettings>(stack?.settings ?? DEFAULT_STACK_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const [reindexOnSave, setReindexOnSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setErr('Name is required'); return; }
    setSaving(true);
    setErr('');
    try {
      let saved: KnowledgeStack;
      if (mode === 'create') {
        saved = await stacksApi.create({ name: name.trim(), description: description.trim() || undefined, icon, color, settings });
      } else {
        saved = await stacksApi.update(stack!.id, { name: name.trim(), description: description.trim() || undefined, icon, color, settings });
        if (reindexOnSave && settingsChanged) {
          await stacksApi.reindex(stack!.id);
        }
      }
      onSaved(saved);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed');
      setSaving(false);
    }
  };

  return (
    <ModalFrame title={mode === 'create' ? 'New Stack' : 'Edit Stack'} onClose={onClose} colors={colors}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Name */}
        <div>
          <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.textMuted, marginBottom: 6 }}>Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Earnings Reports 2024" style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text, fontSize: 13.5, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>

        {/* Description */}
        <div>
          <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.textMuted, marginBottom: 6 }}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What documents does this stack contain?" rows={2} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text, fontSize: 13.5, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>

        {/* Icon + Color */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.textMuted, marginBottom: 6 }}>Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {STACK_ICON_CHOICES.slice(0, 12).map((ic) => (
                <button key={ic} onClick={() => setIcon(ic)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${icon === ic ? 'var(--accent)' : colors.border}`, background: icon === ic ? 'rgba(254,192,15,0.1)' : 'transparent', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ic}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.textMuted, marginBottom: 6 }}>Color</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {STACK_COLOR_CHOICES.map((c) => (
                <button key={c} onClick={() => setColor(c)} style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: `2px solid ${color === c ? colors.text : 'transparent'}`, cursor: 'pointer' }} />
              ))}
            </div>
          </div>
        </div>

        {/* Settings toggle */}
        <button onClick={() => setShowSettings((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: 0 }}>
          <SettingsIcon size={12} />
          {showSettings ? 'Hide' : 'Show'} RAG Settings
        </button>

        {showSettings && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '14px 16px', borderRadius: 10, border: `1px solid ${colors.border}`, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
            {[
              { key: 'chunk_size', label: 'Chunk Size', hint: '200–8000 chars', min: 200, max: 8000, step: 100 },
              { key: 'chunk_count', label: 'Top-K Chunks', hint: '1–100', min: 1, max: 100, step: 1 },
              { key: 'overlap', label: 'Overlap', hint: '0–2000 chars', min: 0, max: 2000, step: 50 },
            ].map(({ key, label, hint, min, max, step }) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <label style={{ fontSize: 12.5, color: colors.text, fontWeight: 600 }}>{label}</label>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: colors.textMuted }}>{hint}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--accent)', fontWeight: 700, minWidth: 50, textAlign: 'right' }}>{(settings as any)[key]}</span>
                  </div>
                </div>
                <input type="range" min={min} max={max} step={step} value={(settings as any)[key]}
                  onChange={(e) => { setSettings({ ...settings, [key]: Number(e.target.value) }); setSettingsChanged(true); }}
                  style={{ width: '100%', accentColor: '#FEC00F' }} />
              </div>
            ))}

            <div>
              <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.textMuted, marginBottom: 6 }}>Load mode</label>
              <select value={settings.load_mode} onChange={(e) => { setSettings({ ...settings, load_mode: e.target.value as any }); setSettingsChanged(true); }}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text, fontSize: 13.5, outline: 'none', fontFamily: 'inherit' }}>
                <option value="static">Static — index once</option>
                <option value="dynamic">Dynamic — re-index on every query</option>
                <option value="sync">Sync — re-index when files change</option>
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: colors.text }}>
              <input type="checkbox" checked={settings.generate_embeddings} onChange={(e) => { setSettings({ ...settings, generate_embeddings: e.target.checked }); setSettingsChanged(true); }} />
              Generate embeddings (semantic vector search)
            </label>

            {settingsChanged && mode === 'edit' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 12.5, color: 'var(--accent)', paddingTop: 6, borderTop: `1px dashed ${colors.border}` }}>
                <input type="checkbox" checked={reindexOnSave} onChange={(e) => setReindexOnSave(e.target.checked)} />
                Re-index existing documents with new chunk settings
              </label>
            )}
          </div>
        )}

        {err && (
          <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', fontSize: 12.5 }}>{err}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
          <SecondaryButton onClick={onClose} colors={colors} disabled={saving}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {mode === 'create' ? 'Create Stack' : 'Save Changes'}
          </PrimaryButton>
        </div>
      </div>
    </ModalFrame>
  );
}

// ─── Delete stack modal ───────────────────────────────────────────────────────

function DeleteStackModal({ stack, colors, onClose, onDeleted }: { stack: KnowledgeStack; colors: any; onClose: () => void; onDeleted: (id: string) => void }) {
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
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: colors.text, padding: 12, borderRadius: 9, border: `1px solid ${colors.border}`, background: colors.inputBg, marginBottom: 14 }}>
        <input type="checkbox" checked={cascade} onChange={(e) => setCascade(e.target.checked)} style={{ marginTop: 2 }} />
        <span>
          <strong>Also delete all {stack.document_count} document{stack.document_count !== 1 ? 's' : ''}</strong>{' '}
          inside this stack and remove their files from storage.
          <span style={{ display: 'block', fontSize: 11.5, color: colors.textMuted, marginTop: 4 }}>
            If unchecked, documents are unlinked from the stack but kept in your library.
          </span>
        </span>
      </label>
      {err && <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <SecondaryButton onClick={onClose} colors={colors} disabled={busy}>Cancel</SecondaryButton>
        <SecondaryButton onClick={handleDelete} colors={colors} danger disabled={busy}>
          {busy ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={13} />}
          Delete
        </SecondaryButton>
      </div>
    </ModalFrame>
  );
}

// ─── Move doc modal ───────────────────────────────────────────────────────────

function MoveDocModal({ doc, fromStack, colors, onClose, onMoved }: { doc: StackDocument; fromStack: KnowledgeStack; colors: any; onClose: () => void; onMoved: (docId: string) => void }) {
  const [stacks, setStacks] = useState<KnowledgeStack[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    stacksApi.list()
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
        <div style={{ padding: 30, textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>No other stacks available. Create one first.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
          {stacks.map((s) => (
            <button key={s.id} disabled={busy} onClick={() => handleMove(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: 10, cursor: busy ? 'not-allowed' : 'pointer', textAlign: 'left', color: colors.text, transition: 'background .15s, border-color .15s' }}
              onMouseEnter={(e) => { if (!busy) { e.currentTarget.style.background = colors.hoverBg; e.currentTarget.style.borderColor = `${s.color || '#FEC00F'}55`; } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = colors.border; }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${s.color || '#FEC00F'}22`, border: `1px solid ${s.color || '#FEC00F'}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{s.icon || '📊'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: colors.textMuted }}>{s.document_count} docs · {s.total_chunks} chunks</div>
              </div>
            </button>
          ))}
        </div>
      )}
      {err && <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', fontSize: 12.5, marginTop: 12 }}>{err}</div>}
    </ModalFrame>
  );
}

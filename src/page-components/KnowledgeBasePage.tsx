'use client';

/**
 * KnowledgePage  (unified library + stacks)
 * =========================================
 *
 * Two-pane layout:
 *
 *   ┌──────────────┬────────────────────────────────────────┐
 *   │   STACKS     │   Active view: All documents OR        │
 *   │   sidebar    │   one stack's contents.                │
 *   │              │                                        │
 *   │ ● All docs   │   Search, filters, file grid, upload,  │
 *   │ ● Silver     │   stack metadata, "Use in chat" CTA.   │
 *   │ ● Macro      │                                        │
 *   │ + New stack  │                                        │
 *   └──────────────┴────────────────────────────────────────┘
 *
 * Chat handoff:
 *   Clicking "Use in chat" on a stack writes an AttachedStack payload
 *   to localStorage under `kb_pending_attach_v1` and navigates to /chat.
 *   ChatPage reads + clears that key on mount and pre-attaches the stack.
 *
 * Replaces both legacy pages:
 *   - KnowledgeBasePage  (this file, rewritten)
 *   - KnowledgeStacksPage (deleted; /stacks route removed)
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  Upload,
  Loader2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Pencil,
  Plus,
  X,
  Layers,
  HardDrive,
  Boxes,
  MessageSquare,
  ArrowRightLeft,
  RotateCcw,
  Settings as SettingsIcon,
  ChevronRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';

import kbApi from '@/lib/kbApi';
import stacksApi from '@/lib/stacksApi';
import {
  extractTextForKB,
  isParseableForKB,
  mimeFor,
  sha256OfBlob,
} from '@/lib/kbIngest';
import type { KBDocument, KBStats } from '@/types/kb';
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

// ════════════════════════════════════════════════════════════════════════════
//  Chat handoff contract
// ════════════════════════════════════════════════════════════════════════════

/** Storage key read by ChatPage on mount to auto-attach a stack. */
export const KB_PENDING_ATTACH_KEY = 'kb_pending_attach_v1';

/** Payload written when the user clicks "Use in chat" on a stack card. */
export interface PendingStackAttach {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  document_count: number;
  total_chunks: number;
  mode: 'rag' | 'full_content';
}

// ════════════════════════════════════════════════════════════════════════════
//  Helpers
// ════════════════════════════════════════════════════════════════════════════

function formatBytes(bytes: number | null | undefined): string {
  const n = Number(bytes ?? 0);
  if (!n) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
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

function getFileTone(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'pdf': return '#ef4444';
    case 'doc': case 'docx': return '#3b82f6';
    case 'txt': case 'md': return '#22c55e';
    case 'csv': case 'xlsx': case 'xls': return '#22c55e';
    case 'json': case 'xml': case 'html': return '#f59e0b';
    default: return '#9ca3af';
  }
}

interface UploadItem {
  file: File;
  /**
   * Upload phases (no server-side parsing involved):
   *   queued    → just picked, nothing done yet
   *   hashing   → computing SHA-256 of bytes (local)
   *   parsing   → extracting text via pdfjs / docx-preview / xlsx (local)
   *   uploading → POSTing pre-parsed text to /brain/upload-preparsed
   *   ready     → server indexed it; doc is searchable
   *   duplicate → server already had this hash; no new row created
   *   error     → terminal failure (parse or upload)
   */
  status:
    | 'queued'
    | 'hashing'
    | 'parsing'
    | 'uploading'
    | 'ready'
    | 'duplicate'
    | 'error';
  documentId?: string;
  chunkCount?: number;
  charCount?: number;
  error?: string;
}

type ActiveView =
  | { kind: 'all' }
  | { kind: 'stack'; stackId: string };

// ════════════════════════════════════════════════════════════════════════════
//  Small primitives (kept inline — both old pages are being deleted)
// ════════════════════════════════════════════════════════════════════════════

function LoadingBlock({ message }: { message: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '90px 0', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(254,192,15,0.08)', border: '1px solid rgba(254,192,15,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={20} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{message}</p>
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, type = 'button', size = 'md', tone = 'accent' }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit'; size?: 'sm' | 'md'; tone?: 'accent' | 'neutral' }) {
  const palette = tone === 'accent'
    ? { border: 'rgba(254,192,15,0.4)', bg: 'rgba(254,192,15,0.12)', color: 'var(--accent)', hover: 'rgba(254,192,15,0.2)' }
    : { border: 'var(--border)', bg: 'var(--bg-card)', color: 'var(--text-muted)', hover: 'var(--bg-card-hover)' };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        height: size === 'sm' ? 32 : 38,
        padding: size === 'sm' ? '0 12px' : '0 16px',
        borderRadius: 9,
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        color: palette.color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        fontFamily: "'Syne', sans-serif",
        fontSize: size === 'sm' ? 10.5 : 11,
        fontWeight: 700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        transition: 'background .15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = palette.hover; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = palette.bg; }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick, danger, disabled, size = 'md' }: { children: React.ReactNode; onClick?: () => void; danger?: boolean; disabled?: boolean; size?: 'sm' | 'md' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: size === 'sm' ? 30 : 38,
        padding: size === 'sm' ? '0 12px' : '0 16px',
        borderRadius: 9,
        border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
        background: danger ? 'rgba(239,68,68,0.08)' : 'var(--bg-card)',
        color: danger ? '#FCA5A5' : 'var(--text-muted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        fontFamily: "'Syne', sans-serif",
        fontSize: size === 'sm' ? 10.5 : 11,
        fontWeight: 600,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

function ModalFrame({ title, onClose, width = 540, children }: { title: string; onClose: () => void; width?: number; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: width, maxHeight: '90vh', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>{title}</h2>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <X size={13} />
          </button>
        </div>
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  Main page
// ════════════════════════════════════════════════════════════════════════════

export function KnowledgeBasePage() {
  const { resolvedTheme } = useTheme();
  const { isMobile } = useResponsive();
  const isDark = resolvedTheme === 'dark';
  const router = useRouter();

  // ── Server data ───────────────────────────────────────────────────────────
  const [stacks, setStacks] = useState<KnowledgeStack[]>([]);
  const [allDocs, setAllDocs] = useState<KBDocument[]>([]);
  const [stats, setStats] = useState<KBStats | null>(null);
  const [loadingShell, setLoadingShell] = useState(true);
  const [error, setError] = useState('');

  // ── View state ────────────────────────────────────────────────────────────
  const [view, setView] = useState<ActiveView>({ kind: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewerDoc, setViewerDoc] = useState<KBDocument | null>(null);
  const [createStackOpen, setCreateStackOpen] = useState(false);
  const [editingStack, setEditingStack] = useState<KnowledgeStack | null>(null);
  const [deletingStack, setDeletingStack] = useState<KnowledgeStack | null>(null);

  // ── Active stack derivation ───────────────────────────────────────────────
  const activeStack = useMemo(
    () => (view.kind === 'stack' ? stacks.find((s) => s.id === view.stackId) || null : null),
    [view, stacks],
  );

  // ── Load shell (stacks + all docs + stats) ────────────────────────────────
  const reloadAll = useCallback(async () => {
    setLoadingShell(true);
    setError('');
    try {
      const [stackList, docs, kbStats] = await Promise.all([
        stacksApi.list().catch(() => [] as KnowledgeStack[]),
        kbApi.listFiles({ limit: 300 }).then((r) => r.files).catch(() => [] as KBDocument[]),
        kbApi.getStats().catch(() => null as unknown as KBStats),
      ]);
      setStacks(stackList);
      setAllDocs(docs);
      setStats(kbStats || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load library');
    } finally {
      setLoadingShell(false);
    }
  }, []);

  useEffect(() => { reloadAll(); }, [reloadAll]);

  // Light refresh: just stacks (after CRUD ops)
  const reloadStacks = useCallback(async () => {
    try {
      const next = await stacksApi.list();
      setStacks(next);
    } catch {/* keep current list */}
  }, []);

  // ── Chat handoff ──────────────────────────────────────────────────────────
  const useInChat = useCallback((stack: KnowledgeStack) => {
    const payload: PendingStackAttach = {
      id: stack.id,
      name: stack.name,
      icon: stack.icon ?? null,
      color: stack.color ?? null,
      document_count: stack.document_count,
      total_chunks: stack.total_chunks,
      mode: 'rag',
    };
    try {
      localStorage.setItem(KB_PENDING_ATTACH_KEY, JSON.stringify(payload));
    } catch {/* private-mode etc — chat will just not auto-attach */}
    router.push('/chat');
  }, [router]);

  // ── Render ────────────────────────────────────────────────────────────────
  const dotBg = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)';
  const totalDocs = stats?.total_documents ?? allDocs.length;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        backgroundImage: [
          'radial-gradient(ellipse 120% 50% at 60% -8%, rgba(254,192,15,0.045) 0%, transparent 55%)',
          `radial-gradient(${dotBg} 1px, transparent 1px)`,
        ].join(', '),
        backgroundSize: 'auto, 24px 24px',
        fontFamily: "'Instrument Sans', 'Quicksand', sans-serif",
        color: 'var(--text)',
      }}
    >
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, var(--accent) 45%, rgba(254,192,15,0.25) 65%, transparent 100%)', opacity: 0.45 }} />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: isMobile ? '20px 18px 0' : '32px 48px 0' }}>
        <div style={{ maxWidth: 1480, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(254,192,15,0.08)', border: '1px solid rgba(254,192,15,0.2)', borderRadius: 100, padding: '4px 14px 4px 10px', marginBottom: 12 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animation: 'kb-pulse 2.4s ease-in-out infinite' }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)' }}>
              Knowledge · {totalDocs} {totalDocs === 1 ? 'doc' : 'docs'} · {stacks.length} {stacks.length === 1 ? 'stack' : 'stacks'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'flex-end', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: 12, paddingBottom: 18 }}>
            <div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: isMobile ? 26 : 38, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.08, margin: 0 }}>
                Your <span style={{ color: 'var(--accent)' }}>Knowledge</span>
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.6 }}>
                One library, organised into stacks. Pick a stack to use in chat and the assistant retrieves from it on every reply.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={reloadAll}
                title="Refresh"
                style={{ width: 38, height: 38, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
              >
                <RefreshCw size={14} />
              </button>
              <PrimaryButton onClick={() => setCreateStackOpen(true)}>
                <Plus size={13} /> New stack
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {error && (
        <div style={{ padding: isMobile ? '12px 18px 0' : '14px 48px 0', maxWidth: 1480, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={14} color="#EF4444" />
              <p style={{ color: '#FCA5A5', fontSize: 12.5, margin: 0 }}>{error}</p>
            </div>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>×</button>
          </div>
        </div>
      )}

      {/* ── Two-pane body ───────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: 1480,
          margin: '0 auto',
          padding: isMobile ? '16px 18px 64px' : '24px 48px 64px',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '260px 1fr',
          gap: isMobile ? 16 : 24,
          alignItems: 'flex-start',
        }}
      >
        {/* Left rail */}
        <StackRail
          stacks={stacks}
          allDocsCount={totalDocs}
          activeView={view}
          onPick={setView}
          onNew={() => setCreateStackOpen(true)}
          isMobile={isMobile}
        />

        {/* Right pane */}
        <div style={{ minWidth: 0 }}>
          {loadingShell ? (
            <LoadingBlock message="Loading library…" />
          ) : view.kind === 'all' ? (
            <AllDocumentsPane
              docs={allDocs}
              stats={stats}
              search={searchQuery}
              onSearch={setSearchQuery}
              onView={setViewerDoc}
              onChange={reloadAll}
              onError={setError}
              isMobile={isMobile}
            />
          ) : activeStack ? (
            <StackPane
              key={activeStack.id}
              stack={activeStack}
              onView={setViewerDoc}
              onChange={() => { reloadAll(); }}
              onEdit={() => setEditingStack(activeStack)}
              onDelete={() => setDeletingStack(activeStack)}
              onUseInChat={() => useInChat(activeStack)}
              onError={setError}
              isMobile={isMobile}
            />
          ) : (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>Stack not found.</div>
          )}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {createStackOpen && (
        <StackEditorModal
          mode="create"
          onClose={() => setCreateStackOpen(false)}
          onSaved={(s) => { setCreateStackOpen(false); setStacks((prev) => [s, ...prev]); setView({ kind: 'stack', stackId: s.id }); }}
          isDark={isDark}
        />
      )}
      {editingStack && (
        <StackEditorModal
          mode="edit"
          stack={editingStack}
          onClose={() => setEditingStack(null)}
          onSaved={(s) => { setEditingStack(null); setStacks((prev) => prev.map((p) => p.id === s.id ? s : p)); }}
          isDark={isDark}
        />
      )}
      {deletingStack && (
        <DeleteStackModal
          stack={deletingStack}
          onClose={() => setDeletingStack(null)}
          onDeleted={(id) => {
            setDeletingStack(null);
            setStacks((prev) => prev.filter((s) => s.id !== id));
            if (view.kind === 'stack' && view.stackId === id) setView({ kind: 'all' });
          }}
        />
      )}
      {viewerDoc && (
        <KBFileViewerModal doc={viewerDoc} onClose={() => setViewerDoc(null)} isDark={isDark} colors={{ background: 'var(--bg)', cardBg: 'var(--bg-card)', inputBg: 'var(--bg-raised)', border: 'var(--border)', text: 'var(--text)', textMuted: 'var(--text-muted)', hoverBg: 'var(--bg-card-hover)', accent: 'var(--accent)', shadow: 'var(--shadow-card)' }} />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes kb-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(0.55); } }
      `}</style>
    </div>
  );
}

export default KnowledgeBasePage;

// ════════════════════════════════════════════════════════════════════════════
//  Left rail — stack navigator
// ════════════════════════════════════════════════════════════════════════════

function StackRail({ stacks, allDocsCount, activeView, onPick, onNew, isMobile }: {
  stacks: KnowledgeStack[];
  allDocsCount: number;
  activeView: ActiveView;
  onPick: (v: ActiveView) => void;
  onNew: () => void;
  isMobile: boolean;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '12px 10px',
        position: isMobile ? 'static' : 'sticky',
        top: 24,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ padding: '4px 10px 8px', fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        Library
      </div>

      <StackRailItem
        active={activeView.kind === 'all'}
        onClick={() => onPick({ kind: 'all' })}
        icon={<BookOpen size={14} />}
        label="All documents"
        count={allDocsCount}
        accent="var(--accent)"
      />

      <div style={{ padding: '14px 10px 6px', fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        Stacks
      </div>

      {stacks.length === 0 ? (
        <div style={{ padding: '12px 10px 16px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          No stacks yet. Create one to bundle documents into a chat-ready collection.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {stacks.map((s) => (
            <StackRailItem
              key={s.id}
              active={activeView.kind === 'stack' && activeView.stackId === s.id}
              onClick={() => onPick({ kind: 'stack', stackId: s.id })}
              icon={<span style={{ fontSize: 14 }}>{s.icon || '📚'}</span>}
              label={s.name}
              count={s.document_count}
              accent={s.color || 'var(--accent)'}
            />
          ))}
        </div>
      )}

      <button
        onClick={onNew}
        style={{
          width: '100%',
          marginTop: 12,
          padding: '9px 10px',
          background: 'transparent',
          border: '1px dashed var(--border)',
          borderRadius: 9,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--text-muted)',
          fontFamily: "'Syne', sans-serif",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          transition: 'all .15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(254,192,15,0.4)'; e.currentTarget.style.color = 'var(--accent)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        <Plus size={13} /> New stack
      </button>
    </div>
  );
}

function StackRailItem({ active, onClick, icon, label, count, accent }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
  accent: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '9px 10px',
        background: active ? `${accent}18` : 'transparent',
        border: 'none',
        borderRadius: 9,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        color: active ? 'var(--text)' : 'var(--text-muted)',
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        textAlign: 'left',
        position: 'relative',
        transition: 'background .15s, color .15s',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {active && (
        <div style={{ position: 'absolute', left: -10, top: 6, bottom: 6, width: 3, borderRadius: '0 3px 3px 0', background: accent }} />
      )}
      <div style={{ width: 24, height: 24, borderRadius: 7, background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: accent }}>
        {icon}
      </div>
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10.5, color: 'var(--text-muted)', flexShrink: 0 }}>{count}</span>
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  Right pane — All documents (library-wide upload + grid)
// ════════════════════════════════════════════════════════════════════════════

function AllDocumentsPane({ docs, stats, search, onSearch, onView, onChange, onError, isMobile }: {
  docs: KBDocument[];
  stats: KBStats | null;
  search: string;
  onSearch: (s: string) => void;
  onView: (d: KBDocument) => void;
  onChange: () => void;
  onError: (m: string) => void;
  isMobile: boolean;
}) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Stop flag — when the user hits Cancel we set this and the in-flight
  // pipeline drains without queueing more work.
  const cancelRef = useRef(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return docs;
    const q = search.toLowerCase();
    return docs.filter((d) =>
      d.filename.toLowerCase().includes(q) ||
      (d.title ?? '').toLowerCase().includes(q) ||
      (d.category ?? '').toLowerCase().includes(q),
    );
  }, [docs, search]);

  // ── Local-parse + batch-upload pipeline ─────────────────────────────────
  // Mirrors the kb_uploader_gui.py flow:
  //   1. hash + parse locally (concurrent pool of 4)
  //   2. one /brain/check-hashes call to mark duplicates without uploading
  //   3. batch POST extracted text to /brain/upload-preparsed (10 per batch)
  // Server-side parsing is never invoked, so the "processing forever" failure
  // mode is gone — when /upload-preparsed returns, the doc is already indexed.
  const handleFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    cancelRef.current = false;
    setUploading(true);

    // Snapshot where the new items will live so per-file state updates target
    // the right rows even as more uploads come in later.
    const newItems: UploadItem[] = files.map((f) => ({ file: f, status: 'queued' }));
    let baseIndex = 0;
    setUploads((prev) => { baseIndex = prev.length; return [...prev, ...newItems]; });

    const patchItem = (offset: number, patch: Partial<UploadItem>) => {
      setUploads((prev) => prev.map((item, j) =>
        j === baseIndex + offset ? { ...item, ...patch } : item,
      ));
    };

    // ── Phase 1: hash + parse locally with a concurrency pool ──────────────
    interface Prepared {
      offset: number;
      file: File;
      hash: string;
      text: string;
      charCount: number;
    }
    const prepared: Prepared[] = [];

    const POOL_SIZE = 4;
    let cursor = 0;
    const workOne = async () => {
      while (cursor < files.length) {
        if (cancelRef.current) return;
        const offset = cursor++;
        const file = files[offset];
        try {
          patchItem(offset, { status: 'hashing' });
          const hash = await sha256OfBlob(file);
          if (cancelRef.current) return;
          if (!isParseableForKB(file.name)) {
            patchItem(offset, {
              status: 'error',
              error: `Unsupported file type (${file.name.split('.').pop() || 'no extension'})`,
            });
            continue;
          }
          patchItem(offset, { status: 'parsing' });
          const { text, charCount } = await extractTextForKB(file, file.name);
          if (!text) {
            patchItem(offset, { status: 'error', error: 'No text could be extracted from this file.' });
            continue;
          }
          prepared.push({ offset, file, hash, text, charCount });
          patchItem(offset, { charCount });
        } catch (err) {
          patchItem(offset, {
            status: 'error',
            error: err instanceof Error ? err.message : 'Parse failed',
          });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(POOL_SIZE, files.length) }, workOne));

    if (cancelRef.current) { setUploading(false); return; }

    // ── Phase 2: dedup precheck (single round trip) ────────────────────────
    let existing: Record<string, { document_id: string; ready: boolean; filename?: string; title?: string }> = {};
    if (prepared.length) {
      try {
        const resp = await kbApi.checkHashes(prepared.map((p) => p.hash));
        existing = resp.existing || {};
      } catch (err) {
        // Non-fatal — the server still dedups on insert. Just log and continue.
        console.warn('check-hashes precheck failed, server will still dedup:', err);
      }
    }

    const toUpload: Prepared[] = [];
    for (const p of prepared) {
      const hit = existing[p.hash];
      if (hit) {
        patchItem(p.offset, { status: 'duplicate', documentId: hit.document_id });
      } else {
        toUpload.push(p);
      }
    }

    // ── Phase 3: batch upload pre-parsed text ──────────────────────────────
    const BATCH_SIZE = 10;
    for (let i = 0; i < toUpload.length; i += BATCH_SIZE) {
      if (cancelRef.current) break;
      const batch = toUpload.slice(i, i + BATCH_SIZE);
      batch.forEach((p) => patchItem(p.offset, { status: 'uploading' }));

      try {
        const resp = await kbApi.uploadPreparsedBatch(
          batch.map((p) => ({
            filename: p.file.name,
            file_type: mimeFor(p.file.name),
            file_size: p.file.size,
            extracted_text: p.text,
            content_hash: p.hash,
          })),
        );

        const byName = new Map<string, typeof resp.results[number]>();
        for (const r of resp.results || []) byName.set(r.filename, r);
        for (const p of batch) {
          const r = byName.get(p.file.name);
          if (!r) {
            patchItem(p.offset, { status: 'error', error: 'No result returned for this file.' });
            continue;
          }
          if (r.status === 'success') {
            patchItem(p.offset, {
              status: 'ready',
              documentId: r.document_id,
              chunkCount: r.chunks_created,
            });
          } else if (r.status === 'duplicate') {
            patchItem(p.offset, { status: 'duplicate', documentId: r.document_id });
          } else {
            patchItem(p.offset, { status: 'error', error: r.error || 'Upload failed' });
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        for (const p of batch) patchItem(p.offset, { status: 'error', error: msg });
      }
    }

    setUploading(false);
    cancelRef.current = false;
    onChange();
  }, [onChange]);

  const cancelUploads = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await kbApi.deleteFile(id);
      onChange();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Delete failed');
    }
  }, [onChange, onError]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(254,192,15,0.10)', border: '1px solid rgba(254,192,15,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <BookOpen size={18} />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text)', letterSpacing: '-0.015em' }}>All documents</h2>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Everything in your library, across every stack.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <PrimaryButton onClick={() => fileInputRef.current?.click()} size="sm">
            <Upload size={12} /> Upload
          </PrimaryButton>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            accept=".pdf,.txt,.doc,.docx,.csv,.md,.json,.xml,.html,.xlsx,.xls,.rtf"
            onChange={(e) => { if (e.target.files) handleFiles(Array.from(e.target.files)); e.target.value = ''; }}
          />
        </div>
      </div>

      {/* Stats pills */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: 10 }}>
          {[
            { label: 'Documents', value: String(stats.total_documents ?? docs.length).padStart(2, '0'), icon: FileText, tone: 'var(--accent)' },
            { label: 'Total size', value: formatBytes(stats.total_size), icon: HardDrive, tone: '#60A5FA' },
            { label: 'Categories', value: String(Object.keys(stats.categories || {}).length).padStart(2, '0'), icon: Boxes, tone: '#34D399' },
            { label: 'Ready', value: String(docs.filter((d) => d.is_processed).length).padStart(2, '0'), icon: CheckCircle2, tone: '#A78BFA' },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 11, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: `linear-gradient(90deg, ${tone}, transparent)`, opacity: 0.55 }} />
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${tone}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={13} color={tone} />
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: 'var(--text)', letterSpacing: '-0.01em', lineHeight: 1 }}>{value}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search + drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(Array.from(e.dataTransfer.files)); }}
        style={{
          background: 'var(--bg-card)',
          border: `1px ${dragActive ? 'dashed' : 'solid'} ${dragActive ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 14,
          padding: '14px 16px',
          position: 'relative',
        }}
      >
        <div style={{ position: 'relative' }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={dragActive ? 'Drop files to upload to your library…' : 'Search documents by name, title, category…'}
            style={{
              width: '100%',
              height: 40,
              paddingLeft: 38,
              paddingRight: 14,
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              borderRadius: 9,
              color: 'var(--text)',
              fontSize: 13.5,
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <p style={{ margin: '8px 4px 0', fontSize: 11.5, color: 'var(--text-muted)' }}>
          Tip: drag files anywhere here to upload them to the library, or attach them to a stack from that stack's page.
        </p>
      </div>

      {/* Upload progress (only when active) */}
      {uploads.length > 0 && (
        <UploadList
          items={uploads}
          onClear={() => setUploads([])}
          onCancel={uploading ? cancelUploads : undefined}
        />
      )}

      {/* Doc grid */}
      <DocumentGrid docs={filtered} onView={onView} onDelete={handleDelete} emptyMessage={search.trim() ? 'No documents match your search.' : 'No documents yet — upload some to get started.'} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  Right pane — single stack detail
// ════════════════════════════════════════════════════════════════════════════

function StackPane({ stack, onView, onChange, onEdit, onDelete, onUseInChat, onError, isMobile }: {
  stack: KnowledgeStack;
  onView: (d: KBDocument) => void;
  onChange: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUseInChat: () => void;
  onError: (m: string) => void;
  isMobile: boolean;
}) {
  const [docs, setDocs] = useState<StackDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [moveDoc, setMoveDoc] = useState<StackDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const accent = stack.color || 'var(--accent)';

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await stacksApi.listDocuments(stack.id, { limit: 300 });
      setDocs(res.documents || []);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Failed to load stack documents');
    } finally {
      setLoading(false);
    }
  }, [stack.id, onError]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    const processingIds = docs.filter((d) => !d.is_processed && d.status !== 'error').map((d) => d.id);
    processingIds.forEach((id) => {
      if (pollingRef.current.has(id)) return;
      const intervalId = setInterval(async () => {
        try {
          const status = await stacksApi.getDocumentStatus(id);
          if (status.ready || status.status === 'error') {
            clearInterval(pollingRef.current.get(id)!);
            pollingRef.current.delete(id);
            setDocs((prev) => prev.map((d) => d.id === id ? { ...d, is_processed: status.ready, status: status.status, chunk_count: status.chunk_count ?? d.chunk_count } : d));
            if (status.ready) onChange();
          }
        } catch {/* */}
      }, 2000);
      pollingRef.current.set(id, intervalId);
    });
    return () => { pollingRef.current.forEach((id) => clearInterval(id)); pollingRef.current.clear(); };
  }, [docs, onChange]);

  const handleUpload = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    try {
      await stacksApi.uploadBatch(stack.id, files);
      await reload();
      onChange();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [stack.id, reload, onChange, onError]);

  const handleDelete = useCallback(async (docId: string) => {
    try {
      await stacksApi.deleteDocument(stack.id, docId, true);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      onChange();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Delete failed');
    }
  }, [stack.id, onChange, onError]);

  const handleReindex = useCallback(async () => {
    setReindexing(true);
    try {
      await stacksApi.reindex(stack.id);
      await reload();
      onChange();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Reindex failed');
    } finally {
      setReindexing(false);
    }
  }, [stack.id, reload, onChange, onError]);

  const handleViewDoc = useCallback((doc: StackDocument) => {
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
    onView(kbDoc);
  }, [onView]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Stack hero card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '20px 22px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${accent}, transparent)`, opacity: 0.8 }} />
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 16, flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: `${accent}22`, border: `1px solid ${accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
            {stack.icon || '📚'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text)', letterSpacing: '-0.015em' }}>{stack.name}</h2>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                · Updated {timeAgo(stack.updated_at)}
              </span>
            </div>
            {stack.description && (
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.55 }}>{stack.description}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            <PrimaryButton onClick={onUseInChat}>
              <MessageSquare size={13} /> Use in chat
            </PrimaryButton>
            <SecondaryButton onClick={onEdit}><Pencil size={12} /> Edit</SecondaryButton>
            <SecondaryButton onClick={onDelete} danger><Trash2 size={12} /></SecondaryButton>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: 10, marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          {[
            { label: 'Documents', value: String(stack.document_count).padStart(2, '0'), icon: FileText, tone: accent },
            { label: 'Chunks', value: String(stack.total_chunks).padStart(2, '0'), icon: Boxes, tone: '#60A5FA' },
            { label: 'Size', value: formatBytes(stack.total_size_bytes), icon: HardDrive, tone: '#34D399' },
            { label: 'Chunk size', value: String(stack.settings?.chunk_size ?? 1500), icon: SettingsIcon, tone: '#A78BFA' },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: `${tone}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={13} color={tone} />
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: 'var(--text)', letterSpacing: '-0.01em', lineHeight: 1 }}>{value}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleUpload(Array.from(e.dataTransfer.files)); }}
        style={{
          background: dragActive ? `${accent}10` : 'var(--bg-card)',
          border: `2px dashed ${dragActive ? accent : 'var(--border)'}`,
          borderRadius: 14,
          padding: '22px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all .15s',
        }}
      >
        {uploading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Loader2 size={18} color={accent} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Uploading…</span>
          </div>
        ) : (
          <>
            <Upload size={20} color={accent} style={{ marginBottom: 8 }} />
            <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600, margin: '0 0 3px' }}>
              {dragActive ? 'Drop files into this stack' : 'Click or drag files to add to this stack'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 11.5, margin: 0 }}>PDF · DOCX · CSV · TXT · MD · JSON · XLSX</p>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.doc,.docx,.csv,.md,.json,.xml,.html,.xlsx,.xls,.rtf"
        style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files) handleUpload(Array.from(e.target.files)); e.target.value = ''; }}
      />

      {/* Reindex */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SecondaryButton size="sm" onClick={handleReindex} disabled={reindexing}>
          {reindexing ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCcw size={11} />}
          Reindex stack
        </SecondaryButton>
      </div>

      {/* Docs */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Documents · {docs.length}
          </span>
        </div>

        {loading ? (
          <LoadingBlock message="Loading documents…" />
        ) : docs.length === 0 ? (
          <div style={{ padding: '44px 24px', textAlign: 'center' }}>
            <FileText size={32} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: 10 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>No documents in this stack yet. Drag files above to add some.</p>
          </div>
        ) : (
          docs.map((doc, idx) => (
            <StackDocRow
              key={doc.id}
              doc={doc}
              isLast={idx === docs.length - 1}
              onView={() => handleViewDoc(doc)}
              onMove={() => setMoveDoc(doc)}
              onDelete={() => handleDelete(doc.id)}
            />
          ))
        )}
      </div>

      {/* Move modal */}
      {moveDoc && (
        <MoveDocModal
          doc={moveDoc}
          fromStack={stack}
          onClose={() => setMoveDoc(null)}
          onMoved={(id) => { setMoveDoc(null); setDocs((prev) => prev.filter((d) => d.id !== id)); onChange(); }}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  Shared doc-list pieces
// ════════════════════════════════════════════════════════════════════════════

function DocumentGrid({ docs, onView, onDelete, emptyMessage }: {
  docs: KBDocument[];
  onView: (d: KBDocument) => void;
  onDelete: (id: string) => void;
  emptyMessage: string;
}) {
  if (docs.length === 0) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: 14, padding: '60px 24px', textAlign: 'center' }}>
        <Sparkles size={28} color="var(--text-muted)" style={{ opacity: 0.35, marginBottom: 10 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
      {docs.map((doc) => (
        <DocumentCard key={doc.id} doc={doc} onView={() => onView(doc)} onDelete={() => onDelete(doc.id)} />
      ))}
    </div>
  );
}

function DocumentCard({ doc, onView, onDelete }: { doc: KBDocument; onView: () => void; onDelete: () => void }) {
  const tone = getFileTone(doc.filename);
  const ext = doc.filename.split('.').pop()?.toUpperCase() ?? 'FILE';
  return (
    <div
      onClick={onView}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '12px 14px',
        cursor: 'pointer',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        transition: 'transform .15s, border-color .15s, background .15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${tone}55`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 9, background: `${tone}18`, border: `1px solid ${tone}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <FileText size={15} color={tone} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {doc.title || doc.filename}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: tone, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{ext}</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, color: 'var(--text-muted)' }}>
            {formatBytes(doc.file_size)}
          </span>
          {doc.is_processed ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#22c55e' }}>
              <CheckCircle2 size={9} /> ready
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#f59e0b' }}>
              <Loader2 size={9} style={{ animation: 'spin 1s linear infinite' }} /> processing
            </span>
          )}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Delete"
        style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}

function StackDocRow({ doc, isLast, onView, onMove, onDelete }: { doc: StackDocument; isLast: boolean; onView: () => void; onMove: () => void; onDelete: () => void }) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', borderBottom: isLast ? 'none' : '1px solid var(--border)', transition: 'background .15s' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ flexShrink: 0 }}>
        {doc.is_processed ? (
          <CheckCircle2 size={14} color="#22c55e" />
        ) : doc.status === 'error' ? (
          <AlertTriangle size={14} color="#ef4444" />
        ) : (
          <Loader2 size={14} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={onView}>
        <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {doc.title || doc.filename}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}>{formatBytes(doc.file_size ?? 0)}</span>
          {doc.chunk_count != null && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}>{doc.chunk_count} chunks</span>
          )}
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: doc.is_processed ? '#22c55e' : doc.status === 'error' ? '#ef4444' : '#f59e0b' }}>
            {doc.is_processed ? 'ready' : doc.status === 'error' ? 'error' : 'processing'}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button onClick={onMove} title="Move to another stack" style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          <ArrowRightLeft size={11} />
        </button>
        <button onClick={onDelete} title="Remove" style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

function UploadList({
  items,
  onClear,
  onCancel,
}: {
  items: UploadItem[];
  onClear: () => void;
  onCancel?: () => void;
}) {
  const ready     = items.filter((i) => i.status === 'ready').length;
  const dupes     = items.filter((i) => i.status === 'duplicate').length;
  const errors    = items.filter((i) => i.status === 'error').length;
  const total     = items.length;
  const settled   = ready + dupes + errors;
  const inFlight  = total - settled;
  const pct       = total ? Math.round((settled / total) * 100) : 0;

  const statusLabel: Record<UploadItem['status'], string> = {
    queued:    'queued',
    hashing:   'hashing…',
    parsing:   'parsing…',
    uploading: 'uploading…',
    ready:     'ready',
    duplicate: 'duplicate',
    error:     'error',
  };
  const statusColor: Record<UploadItem['status'], string> = {
    queued:    'var(--text-muted)',
    hashing:   'var(--accent)',
    parsing:   'var(--accent)',
    uploading: 'var(--accent)',
    ready:     '#22c55e',
    duplicate: '#f59e0b',
    error:     '#ef4444',
  };

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Uploads · {settled}/{total} ({pct}%)
          </span>
          {ready > 0 && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#22c55e' }}>
              ✓ {ready} ready
            </span>
          )}
          {dupes > 0 && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#f59e0b' }}>
              ~ {dupes} duplicate
            </span>
          )}
          {errors > 0 && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#ef4444' }}>
              ✗ {errors} failed
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {onCancel && inFlight > 0 && (
            <button
              onClick={onCancel}
              title="Stop after the current file"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer', fontSize: 11, fontFamily: "'DM Mono', monospace", padding: '2px 9px', borderRadius: 6 }}
            >
              Cancel
            </button>
          )}
          <button onClick={onClear} title="Clear list" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, padding: 0 }}>
            <X size={13} />
          </button>
        </div>
      </div>
      {/* Aggregate progress bar */}
      {total > 0 && (
        <div style={{ height: 3, background: 'var(--bg-raised)' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s ease' }} />
        </div>
      )}
      {items.map((item, idx) => (
        <div key={`${item.file.name}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderTop: '1px solid var(--border)' }}>
          {item.status === 'ready' ? (
            <CheckCircle2 size={13} color="#22c55e" />
          ) : item.status === 'duplicate' ? (
            <CheckCircle2 size={13} color="#f59e0b" />
          ) : item.status === 'error' ? (
            <AlertTriangle size={13} color="#ef4444" />
          ) : item.status === 'queued' ? (
            <span style={{ width: 13, height: 13, display: 'inline-block' }} />
          ) : (
            <Loader2 size={13} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
          )}
          <span style={{ flex: 1, fontSize: 12.5, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.file.name}
          </span>
          {item.chunkCount != null && item.status === 'ready' && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}>
              {item.chunkCount} chunks
            </span>
          )}
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: statusColor[item.status] }}>
            {item.status === 'error' ? (item.error || 'error') : statusLabel[item.status]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  Stack editor / delete / move modals
// ════════════════════════════════════════════════════════════════════════════

function StackEditorModal({ mode, stack, onClose, onSaved, isDark }: { mode: 'create' | 'edit'; stack?: KnowledgeStack; onClose: () => void; onSaved: (s: KnowledgeStack) => void; isDark: boolean }) {
  const [name, setName] = useState(stack?.name ?? '');
  const [description, setDescription] = useState(stack?.description ?? '');
  const [icon, setIcon] = useState(stack?.icon ?? '📚');
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
        if (reindexOnSave && settingsChanged) await stacksApi.reindex(stack!.id);
      }
      onSaved(saved);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed');
      setSaving(false);
    }
  };

  return (
    <ModalFrame title={mode === 'create' ? 'New stack' : 'Edit stack'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Name *">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Earnings reports 2024" style={fieldInput} />
        </Field>
        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What documents will live in this stack?" rows={2} style={{ ...fieldInput, resize: 'vertical', fontFamily: 'inherit' }} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Icon">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {STACK_ICON_CHOICES.slice(0, 12).map((ic) => (
                <button key={ic} onClick={() => setIcon(ic)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${icon === ic ? 'var(--accent)' : 'var(--border)'}`, background: icon === ic ? 'rgba(254,192,15,0.1)' : 'transparent', cursor: 'pointer', fontSize: 15 }}>{ic}</button>
              ))}
            </div>
          </Field>
          <Field label="Color">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {STACK_COLOR_CHOICES.map((c) => (
                <button key={c} onClick={() => setColor(c)} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: `2px solid ${color === c ? 'var(--text)' : 'transparent'}`, cursor: 'pointer' }} />
              ))}
            </div>
          </Field>
        </div>

        <button onClick={() => setShowSettings((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: 0 }}>
          <SettingsIcon size={11} />
          <ChevronRight size={11} style={{ transform: showSettings ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .15s' }} />
          RAG settings
        </button>

        {showSettings && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
            {[
              { key: 'chunk_size', label: 'Chunk size', hint: '200–8000 chars', min: 200, max: 8000, step: 100 },
              { key: 'chunk_count', label: 'Top-K chunks', hint: '1–100', min: 1, max: 100, step: 1 },
              { key: 'overlap', label: 'Overlap', hint: '0–2000 chars', min: 0, max: 2000, step: 50 },
            ].map(({ key, label, hint, min, max, step }) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                  <label style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 600 }}>{label}</label>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}>{hint}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12.5, color: 'var(--accent)', fontWeight: 700, minWidth: 50, textAlign: 'right' }}>
                      {(settings as unknown as Record<string, number>)[key]}
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={(settings as unknown as Record<string, number>)[key]}
                  onChange={(e) => { setSettings({ ...settings, [key]: Number(e.target.value) }); setSettingsChanged(true); }}
                  style={{ width: '100%', accentColor: '#FEC00F' }}
                />
              </div>
            ))}
            <Field label="Load mode">
              <select
                value={settings.load_mode}
                onChange={(e) => { setSettings({ ...settings, load_mode: e.target.value as StackSettings['load_mode'] }); setSettingsChanged(true); }}
                style={fieldInput}
              >
                <option value="static">Static — index once</option>
                <option value="dynamic">Dynamic — re-index on every query</option>
                <option value="sync">Sync — re-index when files change</option>
              </select>
            </Field>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>
              <input
                type="checkbox"
                checked={settings.generate_embeddings}
                onChange={(e) => { setSettings({ ...settings, generate_embeddings: e.target.checked }); setSettingsChanged(true); }}
              />
              Generate embeddings (semantic vector search)
            </label>
            {settingsChanged && mode === 'edit' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 12.5, color: 'var(--accent)', paddingTop: 6, borderTop: '1px dashed var(--border)' }}>
                <input type="checkbox" checked={reindexOnSave} onChange={(e) => setReindexOnSave(e.target.checked)} />
                Re-index existing documents with the new chunk settings
              </label>
            )}
          </div>
        )}

        {err && <ErrorBanner message={err} />}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <SecondaryButton onClick={onClose} disabled={saving}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {mode === 'create' ? 'Create stack' : 'Save changes'}
          </PrimaryButton>
        </div>
      </div>
    </ModalFrame>
  );
}

function DeleteStackModal({ stack, onClose, onDeleted }: { stack: KnowledgeStack; onClose: () => void; onDeleted: (id: string) => void }) {
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
    <ModalFrame title="Delete stack" onClose={onClose} width={440}>
      <p style={{ margin: '0 0 14px', fontSize: 13.5, color: 'var(--text)', lineHeight: 1.55 }}>
        Are you sure you want to delete <strong>{stack.name}</strong>?
      </p>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text)', padding: 12, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-raised)', marginBottom: 14 }}>
        <input type="checkbox" checked={cascade} onChange={(e) => setCascade(e.target.checked)} style={{ marginTop: 2 }} />
        <span>
          <strong>Also delete all {stack.document_count} document{stack.document_count !== 1 ? 's' : ''}</strong> inside this stack and remove their files from storage.
          <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
            If unchecked, documents are unlinked from the stack but kept in your library.
          </span>
        </span>
      </label>
      {err && <ErrorBanner message={err} />}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
        <SecondaryButton onClick={handleDelete} danger disabled={busy}>
          {busy ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={12} />}
          Delete
        </SecondaryButton>
      </div>
    </ModalFrame>
  );
}

function MoveDocModal({ doc, fromStack, onClose, onMoved }: { doc: StackDocument; fromStack: KnowledgeStack; onClose: () => void; onMoved: (id: string) => void }) {
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
    <ModalFrame title="Move document" onClose={onClose}>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)' }}>
        Move <strong style={{ color: 'var(--text)' }}>{doc.title || doc.filename}</strong> to:
      </p>
      {loading ? (
        <LoadingBlock message="Loading stacks…" />
      ) : stacks.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No other stacks. Create one first.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 340, overflowY: 'auto' }}>
          {stacks.map((s) => (
            <button
              key={s.id}
              disabled={busy}
              onClick={() => handleMove(s.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, cursor: busy ? 'not-allowed' : 'pointer', textAlign: 'left', color: 'var(--text)' }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 9, background: `${s.color || '#FEC00F'}22`, border: `1px solid ${s.color || '#FEC00F'}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                {s.icon || '📚'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.document_count} docs · {s.total_chunks} chunks</div>
              </div>
            </button>
          ))}
        </div>
      )}
      {err && <div style={{ marginTop: 10 }}><ErrorBanner message={err} /></div>}
    </ModalFrame>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  Form primitives
// ════════════════════════════════════════════════════════════════════════════

const fieldInput: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 9,
  border: '1px solid var(--border)',
  background: 'var(--bg-raised)',
  color: 'var(--text)',
  fontSize: 13.5,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', fontSize: 12.5 }}>{message}</div>
  );
}

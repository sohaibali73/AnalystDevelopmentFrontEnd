'use client';

/**
 * KnowledgeBasePage — rebuilt against the backend brief.
 *
 * Preview path:  kbApi → /knowledge-base/files + /brain/documents/{id}/download
 * Model path:    stacksApi → /stacks/{id}/context  (handled in ChatPage, NOT here)
 *
 * The viewer NEVER shows chunked text. Chunks are for the model only.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  Search,
  Upload,
  FolderOpen,
  HardDrive,
  Loader2,
  AlertCircle,
  X,
  TrendingUp,
  Clock,
  BookOpen,
  MessageSquarePlus,
  RefreshCw,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import kbApi from '@/lib/kbApi';
import type { KBDocument, KBStats } from '@/types/kb';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';
import FeedbackModal from '@/components/FeedbackModal';
import KBFileViewerModal from '@/components/knowledge/KBFileViewerModal';

// ─── Tab Type ─────────────────────────────────────────────────────────────────

type TabId = 'discover' | 'documents' | 'upload';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'discover', label: 'DISCOVER', icon: Sparkles },
  { id: 'documents', label: 'DOCUMENTS', icon: FileText },
  { id: 'upload', label: 'UPLOAD', icon: Upload },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number | null | undefined) {
  const n = Number(bytes ?? 0);
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function getFileColor(filename: string): string {
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

const catColors: Record<string, { bg: string; text: string }> = {
  afl: { bg: 'rgba(254,192,15,0.12)', text: 'var(--accent)' },
  strategy: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e' },
  indicator: { bg: 'rgba(99,102,241,0.12)', text: '#818cf8' },
  documentation: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6' },
  general: { bg: 'rgba(156,163,175,0.12)', text: '#9ca3af' },
};

// ─── Upload item state ────────────────────────────────────────────────────────

interface UploadItem {
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'ready' | 'error';
  documentId?: string;
  chunkCount?: number;
  error?: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function KnowledgeBasePage() {
  const { resolvedTheme } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const isDark = resolvedTheme === 'dark';

  const colors = useMemo(
    () => ({
      background: 'var(--bg)',
      cardBg: 'var(--bg-card)',
      inputBg: 'var(--bg-raised)',
      border: 'var(--border)',
      text: 'var(--text)',
      textMuted: 'var(--text-muted)',
      hoverBg: 'var(--bg-card-hover)',
      accent: 'var(--accent)',
      shadow: 'var(--shadow-card)',
    }),
    [],
  );

  // ─── State ────────────────────────────────────────────────────────────────

  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [stats, setStats] = useState<KBStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('discover');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewerDoc, setViewerDoc] = useState<KBDocument | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [showFeedback, setShowFeedback] = useState(false);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const pollingRefs = React.useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // ─── Data Loading ─────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [filesRes, statsRes] = await Promise.all([
        kbApi.listFiles({ limit: 200 }),
        kbApi.getStats(),
      ]);
      setDocuments(filesRes.files);
      setStats(statsRes);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    return () => {
      pollingRefs.current.forEach((id) => clearInterval(id));
    };
  }, [loadData]);

  // ─── Status polling for uploaded docs ─────────────────────────────────────

  const startPolling = useCallback((documentId: string, itemIndex: number) => {
    if (pollingRefs.current.has(documentId)) return;

    const intervalId = setInterval(async () => {
      try {
        const status = await kbApi.getStatus(documentId);
        setUploadItems((prev) =>
          prev.map((item, idx) => {
            if (idx !== itemIndex) return item;
            if (status.ready) {
              clearInterval(pollingRefs.current.get(documentId)!);
              pollingRefs.current.delete(documentId);
              loadData();
              return { ...item, status: 'ready', chunkCount: status.chunk_count };
            }
            if (status.status === 'error') {
              clearInterval(pollingRefs.current.get(documentId)!);
              pollingRefs.current.delete(documentId);
              return { ...item, status: 'error', error: status.error ?? 'Processing failed' };
            }
            return { ...item, status: 'processing' };
          }),
        );
      } catch {
        /* ignore transient errors */
      }
    }, 2000);

    pollingRefs.current.set(documentId, intervalId);
  }, [loadData]);

  // ─── Upload handler ───────────────────────────────────────────────────────

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setActiveTab('upload');

      const newItems: UploadItem[] = files.map((f) => ({ file: f, status: 'pending' }));
      setUploadItems((prev) => [...newItems, ...prev]);

      for (let i = 0; i < newItems.length; i++) {
        const globalIdx = i;
        setUploadItems((prev) =>
          prev.map((item, idx) => (idx === globalIdx ? { ...item, status: 'uploading' } : item)),
        );
        try {
          const result = await kbApi.upload(newItems[i].file);
          setUploadItems((prev) =>
            prev.map((item, idx) =>
              idx === globalIdx
                ? { ...item, status: 'processing', documentId: result.document_id }
                : item,
            ),
          );
          if (result.document_id) {
            startPolling(result.document_id, globalIdx);
          }
        } catch (err) {
          setUploadItems((prev) =>
            prev.map((item, idx) =>
              idx === globalIdx
                ? { ...item, status: 'error', error: err instanceof Error ? err.message : 'Upload failed' }
                : item,
            ),
          );
        }
      }
    },
    [startPolling],
  );

  // ─── Delete handler ───────────────────────────────────────────────────────

  const handleDelete = useCallback(async (id: string) => {
    try {
      await kbApi.deleteFile(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (stats) setStats({ ...stats, total_documents: stats.total_documents - 1 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }, [stats]);

  // ─── Computed ─────────────────────────────────────────────────────────────

  const categories = useMemo(
    () => (stats ? ['all', ...Object.keys(stats.categories)] : ['all']),
    [stats],
  );

  const filteredDocs = useMemo(() => {
    let docs = activeCategory === 'all' ? documents : documents.filter((d) => d.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.filename.toLowerCase().includes(q) ||
          (d.title ?? '').toLowerCase().includes(q) ||
          (d.category ?? '').toLowerCase().includes(q),
      );
    }
    return docs;
  }, [documents, activeCategory, searchQuery]);

  const recentDocs = useMemo(
    () =>
      [...documents]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6),
    [documents],
  );

  const bookmarkedDocs = useMemo(
    () => documents.filter((d) => bookmarkedIds.has(d.id)),
    [documents, bookmarkedIds],
  );

  const handleBookmark = useCallback((id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────

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
          height: '1px',
          background:
            'linear-gradient(90deg, transparent 0%, var(--accent) 45%, rgba(254,192,15,0.25) 65%, transparent 100%)',
          opacity: 0.45,
        }}
      />

      {/* ═══ HEADER ═══ */}
      <div
        style={{
          borderBottom: `1px solid ${colors.border}`,
          padding: isMobile ? '24px 20px 0' : '40px 52px 0',
        }}
      >
        <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
          {/* Title row */}
          <div
            style={{
              display: 'flex',
              alignItems: isMobile ? 'flex-start' : 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexDirection: isMobile ? 'column' : 'row',
              marginBottom: '24px',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(254,192,15,0.08)',
                  border: '1px solid rgba(254,192,15,0.2)',
                  borderRadius: '100px',
                  padding: '4px 14px 4px 10px',
                  marginBottom: '14px',
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
                    fontSize: '9px',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'var(--accent)',
                  }}
                >
                  Knowledge Base · {stats ? `${stats.total_documents} docs` : 'Loading'}
                </span>
              </div>
              <h1
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: isMobile ? '28px' : '42px',
                  fontWeight: 800,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.08,
                  color: colors.text,
                  margin: 0,
                }}
              >
                Knowledge <span style={{ color: 'var(--accent)' }}>Base</span>
              </h1>
              <p style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.7, margin: '6px 0 0' }}>
                Upload, search, and manage your documents
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                onClick={loadData}
                title="Refresh"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '9px',
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
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(254,192,15,0.35)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textMuted; }}
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={() => setShowFeedback(true)}
                style={{
                  height: 38,
                  padding: '0 16px',
                  borderRadius: '9px',
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBg,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  color: colors.textMuted,
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  boxShadow: colors.shadow,
                  transition: 'border-color .2s, color .2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(254,192,15,0.35)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textMuted; }}
              >
                <MessageSquarePlus size={13} />
                {!isMobile && 'Feedback'}
              </button>
            </div>
          </div>

          {/* Stats pills */}
          {stats && !loading && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
              {[
                { label: 'Documents', value: stats.total_documents, icon: FileText, color: 'var(--accent)' },
                { label: 'Total Size', value: formatFileSize(stats.total_size), icon: HardDrive, color: '#60A5FA' },
                { label: 'Categories', value: Object.keys(stats.categories).length, icon: FolderOpen, color: '#34D399' },
                { label: 'Bookmarks', value: bookmarkedIds.size, icon: BookOpen, color: '#A78BFA' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 16px',
                    background: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    boxShadow: colors.shadow,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '1.5px',
                      background: `linear-gradient(90deg, ${color}, transparent)`,
                      opacity: 0.55,
                    }}
                  />
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '8px',
                      background: `${color}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={14} color={color} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: isMobile ? '20px' : '24px',
                        fontWeight: 400,
                        color: colors.text,
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                      }}
                    >
                      {typeof value === 'number' ? String(value).padStart(2, '0') : value}
                    </div>
                    <div
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '8.5px',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: colors.textMuted,
                        marginTop: '2px',
                      }}
                    >
                      {label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: '2px', marginTop: '20px' }}>
            {TABS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: isMobile ? '10px 14px' : '11px 22px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                    color: isActive ? 'var(--accent)' : colors.textMuted,
                    fontFamily: "'Syne', sans-serif",
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'color .2s, border-color .2s',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = colors.text; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = colors.textMuted; }}
                >
                  <Icon size={13} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div
        style={{
          padding: isMobile ? '20px' : '28px 52px 64px',
          maxWidth: '1360px',
          margin: '0 auto',
        }}
      >
        {/* Error banner */}
        {error && (
          <div
            style={{
              background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '12px',
              padding: '11px 18px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={15} color="#EF4444" />
              <p style={{ color: isDark ? '#FCA5A5' : '#DC2626', fontSize: '12.5px', margin: 0 }}>{error}</p>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button
                onClick={() => { setError(''); loadData(); }}
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  cursor: 'pointer',
                  color: isDark ? '#FCA5A5' : '#DC2626',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: '0.06em',
                }}
              >
                Retry
              </button>
              <button
                onClick={() => setError('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, padding: '2px 4px', fontSize: '16px' }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '100px 0',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '14px',
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
                fontSize: '11px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: colors.textMuted,
              }}
            >
              Loading knowledge base…
            </p>
          </div>
        ) : (
          <>
            {/* ═══ DISCOVER TAB ═══ */}
            {activeTab === 'discover' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : '1fr 300px',
                  gap: '20px',
                }}
              >
                {/* Main column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Search bar */}
                  <div
                    style={{
                      background: colors.cardBg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '16px',
                      padding: '20px 22px',
                      boxShadow: colors.shadow,
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <Search
                        size={16}
                        color={colors.textMuted}
                        style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setActiveTab('documents'); }}
                        placeholder="Search documents by name, category…"
                        style={{
                          width: '100%',
                          height: '44px',
                          paddingLeft: '42px',
                          paddingRight: '16px',
                          backgroundColor: colors.inputBg,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '10px',
                          color: colors.text,
                          fontSize: '13.5px',
                          fontFamily: "'Quicksand', sans-serif",
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* Recently Added */}
                  {recentDocs.length > 0 && (
                    <div
                      style={{
                        background: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: colors.shadow,
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '1.5px',
                          background: 'linear-gradient(90deg, var(--accent) 0%, rgba(254,192,15,0.1) 60%, transparent 100%)',
                        }}
                      />
                      <div
                        style={{
                          padding: '16px 22px',
                          borderBottom: `1px solid ${colors.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Clock size={13} color="var(--accent)" />
                          <span
                            style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: '9px',
                              letterSpacing: '0.18em',
                              textTransform: 'uppercase',
                              color: colors.textMuted,
                            }}
                          >
                            Recently Added
                          </span>
                        </div>
                        <button
                          onClick={() => setActiveTab('documents')}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: "'DM Mono', monospace",
                            fontSize: '9px',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'var(--accent)',
                            opacity: 0.7,
                            transition: 'opacity .15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                        >
                          View All →
                        </button>
                      </div>
                      {recentDocs.map((doc, idx) => {
                        const cc = catColors[doc.category ?? 'general'] ?? catColors.general;
                        const fColor = getFileColor(doc.filename);
                        return (
                          <div
                            key={doc.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '11px 22px',
                              borderBottom: idx < recentDocs.length - 1 ? `1px solid ${colors.border}` : 'none',
                              cursor: 'pointer',
                              transition: 'background .15s',
                            }}
                            onClick={() => setViewerDoc(doc)}
                            onMouseEnter={(e) => (e.currentTarget.style.background = colors.hoverBg)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: '9px',
                                background: `${fColor}14`,
                                border: `1px solid ${fColor}30`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <FileText size={14} color={fColor} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p
                                style={{
                                  color: colors.text,
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  margin: 0,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {doc.filename}
                              </p>
                              <span
                                style={{
                                  fontFamily: "'DM Mono', monospace",
                                  fontSize: '9.5px',
                                  color: colors.textMuted,
                                }}
                              >
                                {new Date(doc.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                              {doc.category && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    padding: '2px 8px',
                                    borderRadius: '5px',
                                    background: cc.bg,
                                    color: cc.text,
                                    fontFamily: "'DM Mono', monospace",
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {doc.category}
                                </span>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleBookmark(doc.id); }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: bookmarkedIds.has(doc.id) ? 'var(--accent)' : colors.textMuted,
                                  padding: 2,
                                  display: 'flex',
                                  opacity: bookmarkedIds.has(doc.id) ? 1 : 0.45,
                                  transition: 'all .2s',
                                }}
                              >
                                {bookmarkedIds.has(doc.id) ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Bookmarked */}
                  {bookmarkedDocs.length > 0 && (
                    <div
                      style={{
                        background: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: colors.shadow,
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '1.5px',
                          background: 'linear-gradient(90deg, #A78BFA 0%, rgba(167,139,250,0.1) 60%, transparent 100%)',
                        }}
                      />
                      <div
                        style={{
                          padding: '16px 22px',
                          borderBottom: `1px solid ${colors.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        <BookOpen size={13} color="#A78BFA" />
                        <span
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: '9px',
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            color: colors.textMuted,
                          }}
                        >
                          Bookmarked
                        </span>
                        <span
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: '9px',
                            padding: '2px 8px',
                            borderRadius: '5px',
                            background: 'rgba(167,139,250,0.12)',
                            color: '#A78BFA',
                          }}
                        >
                          {bookmarkedDocs.length}
                        </span>
                      </div>
                      {bookmarkedDocs.map((doc, idx) => (
                        <div
                          key={doc.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '11px 22px',
                            borderBottom: idx < bookmarkedDocs.length - 1 ? `1px solid ${colors.border}` : 'none',
                            cursor: 'pointer',
                            transition: 'background .15s',
                          }}
                          onClick={() => setViewerDoc(doc)}
                          onMouseEnter={(e) => (e.currentTarget.style.background = colors.hoverBg)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <FileText size={13} color="#A78BFA" style={{ flexShrink: 0 }} />
                          <span
                            style={{
                              color: colors.text,
                              fontSize: '13px',
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                            }}
                          >
                            {doc.filename}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleBookmark(doc.id); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 2, display: 'flex', flexShrink: 0 }}
                          >
                            <BookmarkCheck size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Category filter */}
                  {stats && (
                    <div
                      style={{
                        background: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '16px',
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
                          gap: '8px',
                        }}
                      >
                        <TrendingUp size={13} color="var(--accent)" />
                        <span
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: '9px',
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            color: colors.textMuted,
                          }}
                        >
                          Categories
                        </span>
                      </div>
                      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {categories.map((cat) => {
                          const count = cat === 'all' ? stats.total_documents : (stats.categories[cat] ?? 0);
                          const isActive = activeCategory === cat;
                          const cc = catColors[cat] ?? catColors.general;
                          return (
                            <button
                              key={cat}
                              onClick={() => { setActiveCategory(cat); setActiveTab('documents'); }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '7px 10px',
                                borderRadius: '8px',
                                border: `1px solid ${isActive ? (cat === 'all' ? 'var(--accent)' : cc.text) : 'transparent'}`,
                                backgroundColor: isActive ? (cat === 'all' ? 'rgba(254,192,15,0.08)' : cc.bg) : 'transparent',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: isActive ? (cat === 'all' ? 'var(--accent)' : cc.text) : colors.text,
                                  fontFamily: "'Syne', sans-serif",
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                }}
                              >
                                {cat === 'all' ? 'All' : cat}
                              </span>
                              <span
                                style={{
                                  fontFamily: "'DM Mono', monospace",
                                  fontSize: '11px',
                                  color: isActive ? (cat === 'all' ? 'var(--accent)' : cc.text) : colors.textMuted,
                                }}
                              >
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick upload */}
                  <div
                    style={{
                      background: colors.cardBg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '16px',
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
                        gap: '8px',
                      }}
                    >
                      <Upload size={13} color="var(--accent)" />
                      <span
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: '9px',
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          color: colors.textMuted,
                        }}
                      >
                        Quick Upload
                      </span>
                    </div>
                    <div style={{ padding: '16px 18px' }}>
                      <button
                        onClick={() => { setActiveTab('upload'); fileInputRef.current?.click(); }}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '10px',
                          border: '2px dashed rgba(254,192,15,0.3)',
                          background: 'rgba(254,192,15,0.04)',
                          color: 'var(--accent)',
                          cursor: 'pointer',
                          fontFamily: "'Syne', sans-serif",
                          fontSize: '12px',
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                        }}
                      >
                        <Upload size={14} /> Choose Files
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ DOCUMENTS TAB ═══ */}
            {activeTab === 'documents' && (
              <div>
                {/* Search + filter bar */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search
                      size={14}
                      color={colors.textMuted}
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter documents…"
                      style={{
                        width: '100%',
                        height: '38px',
                        paddingLeft: '34px',
                        paddingRight: '12px',
                        backgroundColor: colors.inputBg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '9px',
                        color: colors.text,
                        fontSize: '13px',
                        fontFamily: "'Quicksand', sans-serif",
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        style={{
                          padding: '5px 14px',
                          borderRadius: '100px',
                          border: `1px solid ${activeCategory === cat ? 'var(--accent)' : colors.border}`,
                          background: activeCategory === cat ? 'rgba(254,192,15,0.1)' : 'transparent',
                          color: activeCategory === cat ? 'var(--accent)' : colors.textMuted,
                          fontFamily: "'DM Mono', monospace",
                          fontSize: '9.5px',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          transition: 'all .2s',
                        }}
                      >
                        {cat === 'all' ? 'All' : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Document list */}
                <div
                  style={{
                    background: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: colors.shadow,
                  }}
                >
                  {filteredDocs.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center' }}>
                      <FolderOpen size={40} color={colors.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                      <p style={{ color: colors.textMuted, fontSize: '14px', margin: 0 }}>
                        {searchQuery ? `No documents matching "${searchQuery}"` : 'No documents yet'}
                      </p>
                    </div>
                  ) : (
                    filteredDocs.map((doc, idx) => {
                      const fColor = getFileColor(doc.filename);
                      const cc = catColors[doc.category ?? 'general'] ?? catColors.general;
                      return (
                        <div
                          key={doc.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 22px',
                            borderBottom: idx < filteredDocs.length - 1 ? `1px solid ${colors.border}` : 'none',
                            transition: 'background .15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = colors.hoverBg)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          {/* File icon */}
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '9px',
                              background: `${fColor}14`,
                              border: `1px solid ${fColor}30`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              cursor: 'pointer',
                            }}
                            onClick={() => setViewerDoc(doc)}
                          >
                            <FileText size={16} color={fColor} />
                          </div>

                          {/* Info */}
                          <div
                            style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                            onClick={() => setViewerDoc(doc)}
                          >
                            <p
                              style={{
                                color: colors.text,
                                fontSize: '13px',
                                fontWeight: 600,
                                margin: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {doc.filename}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                              {doc.category && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                    background: cc.bg,
                                    color: cc.text,
                                    fontFamily: "'DM Mono', monospace",
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {doc.category}
                                </span>
                              )}
                              <span style={{ color: colors.textMuted, fontSize: '11px' }}>
                                {formatFileSize(doc.file_size ?? doc.size)}
                              </span>
                              {doc.chunk_count != null && (
                                <span style={{ color: colors.textMuted, fontSize: '11px', fontFamily: "'DM Mono', monospace" }}>
                                  {doc.chunk_count} chunks
                                </span>
                              )}
                              <span style={{ color: colors.textMuted, fontSize: '11px' }}>
                                {new Date(doc.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            <button
                              onClick={() => handleBookmark(doc.id)}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '7px',
                                border: `1px solid ${bookmarkedIds.has(doc.id) ? 'var(--accent)' : colors.border}`,
                                background: 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: bookmarkedIds.has(doc.id) ? 'var(--accent)' : colors.textMuted,
                              }}
                            >
                              {bookmarkedIds.has(doc.id) ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                            </button>
                            <button
                              onClick={() => setViewerDoc(doc)}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '7px',
                                border: `1px solid ${colors.border}`,
                                background: 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: colors.textMuted,
                              }}
                              title="View document"
                            >
                              <Search size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '7px',
                                border: '1px solid rgba(239,68,68,0.3)',
                                background: 'rgba(239,68,68,0.06)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ef4444',
                              }}
                              title="Delete document"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ═══ UPLOAD TAB ═══ */}
            {activeTab === 'upload' && (
              <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Drop zone */}
                <div
                  style={{
                    background: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: colors.shadow,
                  }}
                >
                  <div
                    style={{
                      padding: '20px 24px',
                      borderBottom: `1px solid ${colors.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <Upload size={16} color="var(--accent)" />
                    <h3
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: '14px',
                        fontWeight: 700,
                        color: colors.text,
                        margin: 0,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Upload Documents
                    </h3>
                  </div>
                  <div style={{ padding: '20px 24px' }}>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        handleFiles(Array.from(e.dataTransfer.files));
                      }}
                      style={{
                        border: `2px dashed ${dragOver ? 'var(--accent)' : colors.border}`,
                        borderRadius: '12px',
                        padding: '40px 24px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: dragOver ? 'rgba(254,192,15,0.04)' : 'transparent',
                        transition: 'all .2s',
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '12px',
                          background: 'rgba(254,192,15,0.08)',
                          border: '1px solid rgba(254,192,15,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 14px',
                        }}
                      >
                        <Upload size={22} color="var(--accent)" />
                      </div>
                      <p style={{ color: colors.text, fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>
                        {dragOver ? 'Drop files here' : 'Click or drag files to upload'}
                      </p>
                      <p style={{ color: colors.textMuted, fontSize: '12px', margin: 0 }}>
                        PDF, TXT, DOC, DOCX, CSV, MD, JSON, XML, HTML, XLSX, RTF
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upload queue */}
                {uploadItems.length > 0 && (
                  <div
                    style={{
                      background: colors.cardBg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: colors.shadow,
                    }}
                  >
                    <div
                      style={{
                        padding: '14px 20px',
                        borderBottom: `1px solid ${colors.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: '9px',
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          color: colors.textMuted,
                        }}
                      >
                        Upload Queue
                      </span>
                      <button
                        onClick={() => setUploadItems([])}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: colors.textMuted,
                          fontSize: '11px',
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        Clear
                      </button>
                    </div>
                    <div style={{ maxHeight: '320px', overflow: 'auto' }}>
                      {uploadItems.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 20px',
                            borderBottom: idx < uploadItems.length - 1 ? `1px solid ${colors.border}` : 'none',
                          }}
                        >
                          {/* Status icon */}
                          {item.status === 'pending' && <FileText size={14} color={colors.textMuted} style={{ flexShrink: 0 }} />}
                          {item.status === 'uploading' && <Loader2 size={14} color="var(--accent)" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
                          {item.status === 'processing' && <Loader2 size={14} color="#f59e0b" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
                          {item.status === 'ready' && <CheckCircle2 size={14} color="#22c55e" style={{ flexShrink: 0 }} />}
                          {item.status === 'error' && <AlertTriangle size={14} color="#ef4444" style={{ flexShrink: 0 }} />}

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                color: item.status === 'error' ? '#ef4444' : item.status === 'ready' ? '#22c55e' : colors.text,
                                fontSize: '12.5px',
                                margin: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {item.file.name}
                            </p>
                            <p
                              style={{
                                color: colors.textMuted,
                                fontSize: '10.5px',
                                margin: '2px 0 0',
                                fontFamily: "'DM Mono', monospace",
                              }}
                            >
                              {item.status === 'pending' && 'Waiting…'}
                              {item.status === 'uploading' && 'Uploading…'}
                              {item.status === 'processing' && 'Processing & chunking…'}
                              {item.status === 'ready' && `Ready · ${item.chunkCount ?? 0} chunks`}
                              {item.status === 'error' && (item.error ?? 'Failed')}
                            </p>
                          </div>
                          <span
                            style={{
                              color: colors.textMuted,
                              fontSize: '10px',
                              flexShrink: 0,
                              fontFamily: "'DM Mono', monospace",
                            }}
                          >
                            {(item.file.size / 1024).toFixed(0)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══ VIEWER MODAL ═══ */}
      {viewerDoc && (
        <KBFileViewerModal
          doc={viewerDoc}
          onClose={() => setViewerDoc(null)}
          isDark={isDark}
          colors={colors}
        />
      )}

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.doc,.docx,.csv,.md,.json,.xml,.html,.htm,.xlsx,.xls,.rtf"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) handleFiles(Array.from(e.target.files));
          e.target.value = '';
        }}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes kb-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.55); }
        }
      `}</style>
    </div>
  );
}

export default KnowledgeBasePage;

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Database,
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
} from 'lucide-react';
import apiClient from '@/lib/api';
import { Document, SearchResult, BrainStats } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';
import FeedbackModal from '@/components/FeedbackModal';
import KBSearchPanel from '@/components/knowledge/KBSearchPanel';
import KBDocumentGrid from '@/components/knowledge/KBDocumentGrid';
import KBArticlePreview from '@/components/knowledge/KBArticlePreview';
import KBTagCloud from '@/components/knowledge/KBTagCloud';
import KBUploadPanel from '@/components/knowledge/KBUploadPanel';

// ─── Tab Type ─────────────────────────────────────────────────
type TabId = 'discover' | 'documents' | 'upload';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: TabConfig[] = [
  { id: 'discover', label: 'DISCOVER', icon: Sparkles, description: 'Search & explore' },
  { id: 'documents', label: 'DOCUMENTS', icon: FileText, description: 'Browse all files' },
  { id: 'upload', label: 'UPLOAD', icon: Upload, description: 'Add new content' },
];

// ─── Helpers ─────────────────────────────────────────────────
function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// ─── Main Component ─────────────────────────────────────────
export function KnowledgeBasePage() {
  const { resolvedTheme } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const isDark = resolvedTheme === 'dark';

  // ─── State ─────────────────────────────────────────────────
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<BrainStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('discover');
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewerDoc, setViewerDoc] = useState<Document | null>(null);
  const [viewerContent, setViewerContent] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [showFeedback, setShowFeedback] = useState(false);

  // ─── Theme tokens (matches dashboard/chat) ─────────────────
  const colors = useMemo(
    () => ({
      background: isDark ? '#0A0A0A' : '#FFFFFF',
      cardBg:     isDark ? '#141414' : '#FFFFFF',
      inputBg:    isDark ? '#1E1E1E' : '#F8FAFC',
      border:     isDark ? 'rgba(96,165,250,0.15)' : 'rgba(96,165,250,0.1)',
      text:       isDark ? '#FFFFFF' : '#0F172A',
      textMuted:  isDark ? '#94A3B8' : '#64748B',
      hoverBg:    isDark ? '#1A1A1A' : '#F8FAFC',
      accent:     '#60A5FA',
      shadow:     isDark
        ? '0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(96,165,250,0.1)'
        : '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(96,165,250,0.08)',
    }),
    [isDark]
  );

  // ─── Data Loading ──────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [docsData, statsData] = await Promise.all([
        apiClient.getDocuments(),
        apiClient.getBrainStats(),
      ]);
      setDocuments(docsData || []);
      setStats(statsData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load data';
      if (
        msg.includes('fetch') ||
        msg.includes('connect') ||
        msg.includes('network')
      ) {
        setError(
          'Cannot connect to the backend server. Please check your connection and try again.'
        );
      } else if (msg.includes('401') || msg.includes('auth')) {
        setError('Authentication expired. Please log in again.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Handlers ──────────────────────────────────────────────
  const handleSearch = useCallback(
    async (query: string, category?: string): Promise<SearchResult[]> => {
      const results = await apiClient.searchKnowledge(query, category);
      return results;
    },
    []
  );

  const handleUploadFile = useCallback(async (file: File): Promise<Document> => {
    const doc = await apiClient.uploadDocument(file);
    setDocuments((prev) => [doc, ...prev]);
    return doc;
  }, []);

  const handleUploadComplete = useCallback(async () => {
    try {
      const statsData = await apiClient.getBrainStats();
      setStats(statsData);
    } catch {
      // silently fail stats refresh
    }
  }, []);

  const handleDelete = useCallback(
    async (documentId: string) => {
      try {
        await apiClient.deleteDocument(documentId);
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
        if (stats) {
          setStats({ ...stats, total_documents: stats.total_documents - 1 });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed');
      }
    },
    [stats]
  );

  const handleViewDocument = useCallback(async (doc: Document) => {
    setViewerDoc(doc);
    setViewerLoading(true);
    setViewerContent(null);
    try {
      const results = await apiClient.searchKnowledge(doc.filename, undefined, 1);
      if (results && results.length > 0) {
        setViewerContent(results[0].content);
      } else {
        setViewerContent(
          `Document: ${doc.filename}\nCategory: ${doc.category}\nSize: ${formatFileSize(doc.size)}\nUploaded: ${new Date(doc.created_at).toLocaleString()}\n\n---\n\nContent preview is not available for this document type. You can search the knowledge base to find relevant excerpts from this document.`
        );
      }
    } catch {
      setViewerContent(
        `Document: ${doc.filename}\nCategory: ${doc.category}\nSize: ${formatFileSize(doc.size)}\nUploaded: ${new Date(doc.created_at).toLocaleString()}\n\n---\n\nUnable to retrieve document content at this time.`
      );
    } finally {
      setViewerLoading(false);
    }
  }, []);

  const handleBookmark = useCallback((id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ─── Computed ──────────────────────────────────────────────
  const categories = useMemo(
    () => (stats ? ['all', ...Object.keys(stats.categories)] : ['all']),
    [stats]
  );

  const recentDocuments = useMemo(
    () =>
      [...documents]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )
        .slice(0, 6),
    [documents]
  );

  const bookmarkedDocuments = useMemo(
    () => documents.filter((doc) => bookmarkedIds.has(doc.id)),
    [documents, bookmarkedIds]
  );

  const catColors: Record<string, { bg: string; text: string }> = {
    afl: { bg: 'rgba(254, 192, 15, 0.12)', text: '#FEC00F' },
    strategy: { bg: 'rgba(34, 197, 94, 0.12)', text: '#22c55e' },
    indicator: { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8' },
    documentation: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6' },
    general: { bg: 'rgba(156, 163, 175, 0.12)', text: '#9ca3af' },
  };

  // ─── Render ────────────────────────────────────────────────
  const dot = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.background,
      backgroundImage: [
        `radial-gradient(ellipse 120% 50% at 60% -8%, rgba(254,192,15,0.045) 0%, transparent 55%)`,
        `radial-gradient(${dot} 1px, transparent 1px)`,
      ].join(', '),
      backgroundSize: 'auto, 24px 24px',
      fontFamily: "'Instrument Sans', 'Quicksand', sans-serif",
      color: colors.text,
      transition: 'background-color 0.3s ease',
    }}>

      {/* ── Top accent line ── */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, #FEC00F 45%, rgba(254,192,15,0.25) 65%, transparent 100%)',
        opacity: 0.45,
      }} />

      {/* ═══ HEADER ═══ */}
      <div style={{
        borderBottom: `1px solid ${colors.border}`,
        padding: isMobile ? '24px 20px 0' : '40px 52px 0',
        background: 'transparent',
      }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto' }}>

          {/* Title row */}
          <div style={{
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexDirection: isMobile ? 'column' : 'row' as const,
            marginBottom: '24px',
          }}>
            {/* Left: eyebrow + title */}
            <div>
              {/* Eyebrow pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: isDark ? 'rgba(254,192,15,0.07)' : 'rgba(254,192,15,0.08)',
                border: '1px solid rgba(254,192,15,0.2)',
                borderRadius: '100px',
                padding: '4px 14px 4px 10px',
                marginBottom: '14px',
              }}>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#FEC00F',
                  animation: 'kb-pulse 2.4s ease-in-out infinite',
                }} />
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '9px', letterSpacing: '0.16em',
                  textTransform: 'uppercase' as const, color: '#FEC00F',
                }}>
                  Knowledge Base · {stats ? `${stats.total_documents} docs` : 'Loading'}
                </span>
              </div>

              <h1 style={{
                fontFamily: "'Syne', var(--font-rajdhani), sans-serif",
                fontSize: isMobile ? '28px' : '42px',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                lineHeight: 1.08,
                color: colors.text,
                margin: 0,
              }}>
                Knowledge{' '}
                <span style={{ color: '#FEC00F' }}>Base</span>
              </h1>
              <p style={{
                fontSize: '13px', color: colors.textMuted,
                lineHeight: 1.7, margin: '6px 0 0',
              }}>
                Upload, search, and manage your trading knowledge
              </p>
            </div>

            {/* Right: action buttons */}
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                onClick={loadData}
                title="Refresh"
                style={{
                  width: 38, height: 38,
                  borderRadius: '9px',
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBg,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: colors.textMuted,
                  boxShadow: colors.shadow,
                  transition: 'border-color .2s, color .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(254,192,15,0.35)'; e.currentTarget.style.color = '#FEC00F'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textMuted; }}
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={() => setShowFeedback(true)}
                style={{
                  height: 38, padding: '0 16px',
                  borderRadius: '9px',
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBg,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '7px',
                  color: colors.textMuted,
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '11px', fontWeight: 600,
                  letterSpacing: '0.07em', textTransform: 'uppercase' as const,
                  boxShadow: colors.shadow,
                  transition: 'border-color .2s, color .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(254,192,15,0.35)'; e.currentTarget.style.color = '#FEC00F'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textMuted; }}
              >
                <MessageSquarePlus size={13} />
                {!isMobile && 'Feedback'}
              </button>
            </div>
          </div>

          {/* ═══ STAT PILLS ═══ */}
          {stats && !loading && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const, marginBottom: '4px' }}>
              {([
                { label: 'Documents',  value: stats.total_documents,               icon: FileText,   color: '#FEC00F' },
                { label: 'Total Size', value: formatFileSize(stats.total_size),     icon: HardDrive,  color: '#60A5FA' },
                { label: 'Categories', value: Object.keys(stats.categories).length, icon: FolderOpen, color: '#34D399' },
                { label: 'Bookmarks',  value: bookmarkedIds.size,                   icon: BookOpen,   color: '#A78BFA' },
              ] as const).map(({ label, value, icon: Icon, color }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 16px',
                  background: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '10px',
                  boxShadow: colors.shadow,
                  position: 'relative' as const,
                  overflow: 'hidden',
                }}>
                  {/* micro top line */}
                  <div style={{
                    position: 'absolute' as const, top: 0, left: 0, right: 0, height: '1.5px',
                    background: `linear-gradient(90deg, ${color}, transparent)`,
                    opacity: 0.55,
                  }} />
                  <div style={{
                    width: 30, height: 30, borderRadius: '8px',
                    background: `${color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={14} color={color} />
                  </div>
                  <div>
                    <div style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: isMobile ? '20px' : '24px',
                      fontWeight: 400,
                      color: colors.text,
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                    }}>
                      {typeof value === 'number' ? String(value).padStart(2, '0') : value}
                    </div>
                    <div style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '8.5px', letterSpacing: '0.12em',
                      textTransform: 'uppercase' as const,
                      color: colors.textMuted,
                      marginTop: '2px',
                    }}>
                      {label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ═══ TAB BAR ═══ */}
          <div style={{ display: 'flex', gap: '2px', marginTop: '20px' }}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: isMobile ? '10px 14px' : '11px 22px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `2px solid ${isActive ? '#FEC00F' : 'transparent'}`,
                    color: isActive ? '#FEC00F' : colors.textMuted,
                    fontFamily: "'Syne', sans-serif",
                    fontSize: '11px', fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                    cursor: 'pointer',
                    transition: 'color .2s, border-color .2s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = colors.text; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = colors.textMuted; }}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div style={{
        padding: isMobile ? '20px 20px' : '28px 52px 64px',
        maxWidth: '1360px',
        margin: '0 auto',
      }}>

        {/* Error Banner */}
        {error && (
          <div style={{
            background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '12px',
            padding: '11px 18px',
            marginBottom: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={15} color="#EF4444" />
              <p style={{ color: isDark ? '#FCA5A5' : '#DC2626', fontSize: '12.5px', margin: 0 }}>{error}</p>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button onClick={() => { setError(''); loadData(); }} style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                cursor: 'pointer', color: isDark ? '#FCA5A5' : '#DC2626',
                padding: '4px 12px', borderRadius: '6px', fontSize: '11px',
                fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em',
              }}>Retry</button>
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, padding: '2px 4px', fontSize: '16px' }}>×</button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '16px' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '14px',
              background: 'rgba(254,192,15,0.08)',
              border: '1px solid rgba(254,192,15,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Loader2 size={22} color="#FEC00F" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: colors.textMuted }}>
              Loading knowledge base…
            </p>
          </div>
        ) : (
          <>
            {/* ═══ DISCOVER TAB ═══ */}
            {activeTab === 'discover' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : '1fr 300px',
                gap: '20px',
              }}>
                {/* Main column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <KBSearchPanel onSearch={handleSearch} categories={categories} isDark={isDark} colors={colors} isMobile={isMobile} />

                  {/* Recently Added */}
                  {recentDocuments.length > 0 && (
                    <div style={{
                      background: colors.cardBg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: colors.shadow,
                      position: 'relative' as const,
                    }}>
                      {/* Top accent */}
                      <div style={{ position: 'absolute' as const, top: 0, left: 0, right: 0, height: '1.5px', background: 'linear-gradient(90deg, #FEC00F 0%, rgba(254,192,15,0.1) 60%, transparent 100%)' }} />
                      <div style={{ padding: isMobile ? '14px 16px' : '16px 22px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {/* Section header style */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: 3, height: 14, borderRadius: 3, background: 'linear-gradient(to bottom, #FEC00F, rgba(254,192,15,0.2))' }} />
                          <Clock size={13} color="#FEC00F" />
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: colors.textMuted }}>Recently Added</span>
                        </div>
                        <button onClick={() => setActiveTab('documents')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#FEC00F', opacity: 0.7, transition: 'opacity .15s' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                        >View All →</button>
                      </div>
                      {recentDocuments.map((doc, idx) => {
                        const cc = catColors[doc.category] || catColors.general;
                        return (
                          <div key={doc.id}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: isMobile ? '10px 16px' : '11px 22px', borderBottom: idx < recentDocuments.length - 1 ? `1px solid ${colors.border}` : 'none', cursor: 'pointer', transition: 'background .15s', position: 'relative' as const }}
                            onClick={() => handleViewDocument(doc)}
                            onMouseEnter={e => (e.currentTarget.style.background = colors.hoverBg)}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div style={{ width: 32, height: 32, borderRadius: '9px', background: `rgba(254,192,15,0.08)`, border: '1px solid rgba(254,192,15,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <FileText size={14} color="#FEC00F" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ color: colors.text, fontSize: '13px', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, letterSpacing: '-0.01em' }}>{doc.filename}</p>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9.5px', color: colors.textMuted }}>{new Date(doc.created_at).toLocaleDateString()}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                              <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '5px', background: cc.bg, color: cc.text, fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>{doc.category}</span>
                              <button onClick={e => { e.stopPropagation(); handleBookmark(doc.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: bookmarkedIds.has(doc.id) ? '#FEC00F' : colors.textMuted, padding: 2, display: 'flex', opacity: bookmarkedIds.has(doc.id) ? 1 : 0.45, transition: 'all .2s' }}>
                                {bookmarkedIds.has(doc.id) ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Bookmarked */}
                  {bookmarkedDocuments.length > 0 && (
                    <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: colors.shadow, position: 'relative' as const }}>
                      <div style={{ position: 'absolute' as const, top: 0, left: 0, right: 0, height: '1.5px', background: 'linear-gradient(90deg, #A78BFA 0%, rgba(167,139,250,0.1) 60%, transparent 100%)' }} />
                      <div style={{ padding: isMobile ? '14px 16px' : '16px 22px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 3, height: 14, borderRadius: 3, background: 'linear-gradient(to bottom, #A78BFA, rgba(167,139,250,0.2))' }} />
                        <BookOpen size={13} color="#A78BFA" />
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: colors.textMuted }}>Bookmarked</span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', padding: '2px 8px', borderRadius: '5px', background: 'rgba(167,139,250,0.12)', color: '#A78BFA' }}>{bookmarkedDocuments.length}</span>
                      </div>
                      {bookmarkedDocuments.map((doc, idx) => (
                        <div key={doc.id}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: isMobile ? '10px 16px' : '11px 22px', borderBottom: idx < bookmarkedDocuments.length - 1 ? `1px solid ${colors.border}` : 'none', cursor: 'pointer', transition: 'background .15s' }}
                          onClick={() => handleViewDocument(doc)}
                          onMouseEnter={e => (e.currentTarget.style.background = colors.hoverBg)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <FileText size={13} color="#A78BFA" style={{ flexShrink: 0 }} />
                          <span style={{ color: colors.text, fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, flex: 1, letterSpacing: '-0.01em' }}>{doc.filename}</span>
                          <button onClick={e => { e.stopPropagation(); handleBookmark(doc.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FEC00F', padding: 2, display: 'flex', flexShrink: 0 }}><BookmarkCheck size={13} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <KBTagCloud stats={stats} categories={categories} activeCategory={activeCategory} onCategoryChange={cat => { setActiveCategory(cat); setActiveTab('documents'); }} isDark={isDark} colors={colors} isMobile={isMobile} totalBookmarks={bookmarkedIds.size} />
                  <KBUploadPanel onUpload={handleUploadFile} onUploadComplete={handleUploadComplete} isDark={isDark} colors={colors} isMobile={isMobile} />
                </div>
              </div>
            )}

            {/* ═══ DOCUMENTS TAB ═══ */}
            {activeTab === 'documents' && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : '1fr 260px', gap: '20px' }}>
                <KBDocumentGrid documents={documents} activeCategory={activeCategory} onViewDocument={handleViewDocument} onDeleteDocument={handleDelete} onBookmark={handleBookmark} bookmarkedIds={bookmarkedIds} isDark={isDark} colors={colors} isMobile={isMobile} isTablet={isTablet} />
                {!isMobile && (
                  <KBTagCloud stats={stats} categories={categories} activeCategory={activeCategory} onCategoryChange={setActiveCategory} isDark={isDark} colors={colors} isMobile={isMobile} totalBookmarks={bookmarkedIds.size} />
                )}
                {isMobile && categories.length > 1 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, padding: '0 0 16px 0', order: -1 }}>
                    {categories.map(cat => (
                      <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                        padding: '5px 14px', borderRadius: '100px',
                        border: `1px solid ${activeCategory === cat ? '#FEC00F' : colors.border}`,
                        background: activeCategory === cat ? 'rgba(254,192,15,0.1)' : 'transparent',
                        color: activeCategory === cat ? '#FEC00F' : colors.textMuted,
                        fontFamily: "'DM Mono', monospace", fontSize: '9.5px', letterSpacing: '0.1em',
                        textTransform: 'uppercase' as const, cursor: 'pointer',
                        transition: 'all .2s',
                      }}>
                        {cat === 'all' ? 'All' : cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══ UPLOAD TAB ═══ */}
            {activeTab === 'upload' && (
              <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <KBUploadPanel onUpload={handleUploadFile} onUploadComplete={handleUploadComplete} isDark={isDark} colors={colors} isMobile={isMobile} />

                {/* Upload Tips card */}
                <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: colors.shadow, position: 'relative' as const }}>
                  <div style={{ position: 'absolute' as const, top: 0, left: 0, right: 0, height: '1.5px', background: 'linear-gradient(90deg, #FEC00F 0%, rgba(254,192,15,0.1) 60%, transparent 100%)' }} />
                  <div style={{ padding: isMobile ? '14px 16px' : '16px 22px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 3, height: 14, borderRadius: 3, background: 'linear-gradient(to bottom, #FEC00F, rgba(254,192,15,0.2))' }} />
                    <TrendingUp size={13} color="#FEC00F" />
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: colors.textMuted }}>Upload Tips</span>
                  </div>
                  <div style={{ padding: isMobile ? '16px' : '20px 22px' }}>
                    {[
                      { title: 'Expanded Format Support', desc: 'Upload PDF, TXT, DOC, DOCX, CSV, MD, JSON, XML, HTML, XLSX, and RTF files to accommodate diverse content types.' },
                      { title: 'Auto-Categorization',     desc: 'Documents are automatically categorized based on content analysis. Filter by category later for quick retrieval.' },
                      { title: 'Instant Search',          desc: 'Uploaded documents become searchable immediately through advanced search with filters, tags, and file type options.' },
                      { title: 'Batch Upload',            desc: 'Select multiple files at once or drag them into the upload area for efficient batch processing.' },
                      { title: 'Bookmarking',             desc: 'Bookmark important documents for quick access from the Discover tab. Bookmarks persist across sessions.' },
                    ].map((tip, i, arr) => (
                      <div key={i} style={{ padding: '11px 0', borderBottom: i < arr.length - 1 ? `1px solid ${colors.border}` : 'none', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: '#FEC00F', opacity: 0.55, flexShrink: 0, paddingTop: '2px', width: '16px' }}>{String(i + 1).padStart(2, '0')}</span>
                        <div>
                          <p style={{ color: colors.text, fontSize: '13px', fontWeight: 600, margin: '0 0 3px', letterSpacing: '-0.01em' }}>{tip.title}</p>
                          <p style={{ color: colors.textMuted, fontSize: '12px', lineHeight: 1.65, margin: 0 }}>{tip.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══ MODALS ═══ */}
      {viewerDoc && (
        <KBArticlePreview
          doc={viewerDoc}
          content={viewerContent}
          loading={viewerLoading}
          onClose={() => { setViewerDoc(null); setViewerContent(null); }}
          isDark={isDark}
          colors={colors}
          isBookmarked={bookmarkedIds.has(viewerDoc.id)}
          onBookmark={() => handleBookmark(viewerDoc.id)}
        />
      )}

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />

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

export default KnowledgeBasePage;

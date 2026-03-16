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

  // ─── Theme colors ──────────────────────────────────────────
  const colors = useMemo(
    () => ({
      background: isDark ? '#121212' : '#F5F5F5',
      cardBg: isDark ? '#1E1E1E' : '#FFFFFF',
      inputBg: isDark ? '#2A2A2A' : '#F8F8F8',
      border: isDark ? '#2E2E2E' : '#E5E5E5',
      text: isDark ? '#FFFFFF' : '#212121',
      textMuted: isDark ? '#9E9E9E' : '#757575',
      hoverBg: isDark ? '#262626' : '#F5F5F5',
      accent: '#FEC00F',
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
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.background,
        fontFamily: "'Quicksand', sans-serif",
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* ═══ HEADER ═══ */}
      <div
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #1E1E1E 0%, #2A2A2A 100%)'
            : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          borderBottom: `1px solid ${colors.border}`,
          padding: isMobile ? '20px 16px' : '32px 32px 0',
          transition: 'background 0.3s ease',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Title Row */}
          <div
            style={{
              display: 'flex',
              alignItems: isMobile ? 'flex-start' : 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexDirection: isMobile ? 'column' : 'row',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: `${colors.accent}14`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Database size={24} color={colors.accent} />
              </div>
              <div>
                <h1
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: isMobile ? '24px' : '32px',
                    fontWeight: 700,
                    color: colors.text,
                    letterSpacing: '1.5px',
                    lineHeight: 1.1,
                    margin: 0,
                  }}
                >
                  KNOWLEDGE BASE
                </h1>
                <p
                  style={{
                    color: colors.textMuted,
                    fontSize: isMobile ? '12px' : '14px',
                    lineHeight: 1.5,
                    margin: '3px 0 0 0',
                  }}
                >
                  Upload, search, and manage your trading knowledge
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={loadData}
                title="Refresh data"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  border: `1px solid ${colors.border}`,
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.textMuted,
                  transition: 'all 0.2s',
                }}
              >
                <RefreshCw size={15} />
              </button>
              <button
                onClick={() => setShowFeedback(true)}
                style={{
                  height: '38px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: `1px solid ${colors.border}`,
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: colors.textMuted,
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  fontSize: '12px',
                  letterSpacing: '0.5px',
                  transition: 'all 0.2s',
                }}
              >
                <MessageSquarePlus size={14} />
                {!isMobile && 'FEEDBACK'}
              </button>
            </div>
          </div>

          {/* ═══ STATS ROW ═══ */}
          {stats && !loading && (
            <div
              style={{
                display: 'flex',
                gap: isMobile ? '8px' : '16px',
                marginTop: '20px',
                flexWrap: 'wrap',
              }}
            >
              {[
                {
                  label: 'Documents',
                  value: stats.total_documents,
                  icon: FileText,
                  iconColor: colors.accent,
                },
                {
                  label: 'Total Size',
                  value: formatFileSize(stats.total_size),
                  icon: HardDrive,
                  iconColor: '#3b82f6',
                },
                {
                  label: 'Categories',
                  value: Object.keys(stats.categories).length,
                  icon: FolderOpen,
                  iconColor: '#22c55e',
                },
                {
                  label: 'Bookmarks',
                  value: bookmarkedIds.size,
                  icon: BookOpen,
                  iconColor: '#818cf8',
                },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(0,0,0,0.02)',
                      borderRadius: '8px',
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <Icon size={16} color={stat.iconColor} />
                    <div>
                      <p
                        style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: '18px',
                          fontWeight: 700,
                          color: colors.text,
                          margin: 0,
                          lineHeight: 1,
                        }}
                      >
                        {stat.value}
                      </p>
                      <p
                        style={{
                          color: colors.textMuted,
                          fontSize: '10px',
                          margin: 0,
                        }}
                      >
                        {stat.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ TAB BAR ═══ */}
          <div
            style={{
              display: 'flex',
              gap: '2px',
              marginTop: '20px',
            }}
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: isMobile ? '10px 14px' : '12px 20px',
                    border: 'none',
                    borderBottom: `2px solid ${
                      isActive ? colors.accent : 'transparent'
                    }`,
                    backgroundColor: 'transparent',
                    color: isActive ? colors.accent : colors.textMuted,
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div
        style={{
          padding: isMobile ? '20px 16px' : '24px 32px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        {/* Error Banner */}
        {error && (
          <div
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.08)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '12px',
              padding: '12px 18px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <AlertCircle size={16} color="#DC2626" />
              <p style={{ color: '#DC2626', fontSize: '13px', margin: 0 }}>
                {error}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button
                onClick={() => {
                  setError('');
                  loadData();
                }}
                style={{
                  background: 'none',
                  border: '1px solid rgba(220, 38, 38, 0.4)',
                  cursor: 'pointer',
                  color: '#DC2626',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  fontFamily: "'Rajdhani', sans-serif",
                }}
              >
                Retry
              </button>
              <button
                onClick={() => setError('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#DC2626',
                  padding: '4px',
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px',
              gap: '14px',
            }}
          >
            <Loader2
              size={32}
              color={colors.accent}
              style={{ animation: 'spin 1s linear infinite' }}
            />
            <p style={{ color: colors.textMuted, fontSize: '14px' }}>
              Loading knowledge base...
            </p>
          </div>
        ) : (
          <>
            {/* ═══ DISCOVER TAB ═══ */}
            {activeTab === 'discover' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? '1fr'
                    : isTablet
                    ? '1fr'
                    : '1fr 300px',
                  gap: '20px',
                }}
              >
                {/* Main Column */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                  }}
                >
                  {/* Search Panel */}
                  <KBSearchPanel
                    onSearch={handleSearch}
                    categories={categories}
                    isDark={isDark}
                    colors={colors}
                    isMobile={isMobile}
                  />

                  {/* Recent Documents */}
                  {recentDocuments.length > 0 && (
                    <div
                      style={{
                        backgroundColor: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '16px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          padding: isMobile ? '14px 16px' : '16px 20px',
                          borderBottom: `1px solid ${colors.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <Clock size={14} color={colors.accent} />
                          <h3
                            style={{
                              fontFamily: "'Rajdhani', sans-serif",
                              fontSize: '13px',
                              fontWeight: 700,
                              color: colors.text,
                              letterSpacing: '1px',
                              margin: 0,
                            }}
                          >
                            RECENTLY ADDED
                          </h3>
                        </div>
                        <button
                          onClick={() => setActiveTab('documents')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: colors.accent,
                            fontSize: '11px',
                            fontWeight: 600,
                            fontFamily: "'Rajdhani', sans-serif",
                            letterSpacing: '0.5px',
                            cursor: 'pointer',
                          }}
                        >
                          VIEW ALL
                        </button>
                      </div>
                      {recentDocuments.map((doc, idx) => {
                        const cc = catColors[doc.category] || catColors.general;
                        return (
                          <div
                            key={doc.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: isMobile ? '10px 16px' : '10px 20px',
                              borderBottom:
                                idx < recentDocuments.length - 1
                                  ? `1px solid ${colors.border}`
                                  : 'none',
                              cursor: 'pointer',
                              transition: 'background-color 0.15s',
                            }}
                            onClick={() => handleViewDocument(doc)}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                colors.hoverBg)
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                'transparent')
                            }
                          >
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '8px',
                                backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <FileText size={16} color={colors.accent} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
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
                              <span
                                style={{
                                  color: colors.textMuted,
                                  fontSize: '11px',
                                }}
                              >
                                {new Date(doc.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                              <span
                                style={{
                                  fontSize: '9px',
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  backgroundColor: cc.bg,
                                  color: cc.text,
                                  fontWeight: 700,
                                  fontFamily: "'Rajdhani', sans-serif",
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.3px',
                                }}
                              >
                                {doc.category}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBookmark(doc.id);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: bookmarkedIds.has(doc.id)
                                    ? colors.accent
                                    : colors.textMuted,
                                  padding: '2px',
                                  display: 'flex',
                                  opacity: bookmarkedIds.has(doc.id) ? 1 : 0.4,
                                  transition: 'all 0.2s',
                                }}
                              >
                                {bookmarkedIds.has(doc.id) ? (
                                  <BookmarkCheck size={13} />
                                ) : (
                                  <Bookmark size={13} />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Bookmarked Documents */}
                  {bookmarkedDocuments.length > 0 && (
                    <div
                      style={{
                        backgroundColor: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '16px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          padding: isMobile ? '14px 16px' : '16px 20px',
                          borderBottom: `1px solid ${colors.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <BookOpen size={14} color="#818cf8" />
                        <h3
                          style={{
                            fontFamily: "'Rajdhani', sans-serif",
                            fontSize: '13px',
                            fontWeight: 700,
                            color: colors.text,
                            letterSpacing: '1px',
                            margin: 0,
                          }}
                        >
                          BOOKMARKED
                        </h3>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(99, 102, 241, 0.12)',
                            color: '#818cf8',
                            fontWeight: 700,
                            fontFamily: "'Rajdhani', sans-serif",
                          }}
                        >
                          {bookmarkedDocuments.length}
                        </span>
                      </div>
                      {bookmarkedDocuments.map((doc, idx) => (
                        <div
                          key={doc.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: isMobile ? '10px 16px' : '10px 20px',
                            borderBottom:
                              idx < bookmarkedDocuments.length - 1
                                ? `1px solid ${colors.border}`
                                : 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s',
                          }}
                          onClick={() => handleViewDocument(doc)}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              colors.hoverBg)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              'transparent')
                          }
                        >
                          <FileText size={14} color="#818cf8" />
                          <span
                            style={{
                              color: colors.text,
                              fontSize: '13px',
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                            }}
                          >
                            {doc.filename}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookmark(doc.id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: colors.accent,
                              padding: '2px',
                              display: 'flex',
                              flexShrink: 0,
                            }}
                          >
                            <BookmarkCheck size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <KBTagCloud
                    stats={stats}
                    categories={categories}
                    activeCategory={activeCategory}
                    onCategoryChange={(cat) => {
                      setActiveCategory(cat);
                      setActiveTab('documents');
                    }}
                    isDark={isDark}
                    colors={colors}
                    isMobile={isMobile}
                    totalBookmarks={bookmarkedIds.size}
                  />

                  {/* Quick Upload */}
                  <KBUploadPanel
                    onUpload={handleUploadFile}
                    onUploadComplete={handleUploadComplete}
                    isDark={isDark}
                    colors={colors}
                    isMobile={isMobile}
                  />
                </div>
              </div>
            )}

            {/* ═══ DOCUMENTS TAB ═══ */}
            {activeTab === 'documents' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? '1fr'
                    : isTablet
                    ? '1fr'
                    : '1fr 260px',
                  gap: '20px',
                }}
              >
                <KBDocumentGrid
                  documents={documents}
                  activeCategory={activeCategory}
                  onViewDocument={handleViewDocument}
                  onDeleteDocument={handleDelete}
                  onBookmark={handleBookmark}
                  bookmarkedIds={bookmarkedIds}
                  isDark={isDark}
                  colors={colors}
                  isMobile={isMobile}
                  isTablet={isTablet}
                />

                {/* Sidebar */}
                {!isMobile && (
                  <KBTagCloud
                    stats={stats}
                    categories={categories}
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                    isDark={isDark}
                    colors={colors}
                    isMobile={isMobile}
                    totalBookmarks={bookmarkedIds.size}
                  />
                )}

                {/* Mobile Category Filter */}
                {isMobile && categories.length > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap',
                      padding: '0 0 16px 0',
                      order: -1,
                    }}
                  >
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${
                            activeCategory === cat
                              ? colors.accent
                              : colors.border
                          }`,
                          backgroundColor:
                            activeCategory === cat
                              ? `${colors.accent}14`
                              : 'transparent',
                          color:
                            activeCategory === cat
                              ? colors.accent
                              : colors.textMuted,
                          fontSize: '11px',
                          fontWeight: 600,
                          fontFamily: "'Rajdhani', sans-serif",
                          letterSpacing: '0.5px',
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                        }}
                      >
                        {cat === 'all' ? 'All' : cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══ UPLOAD TAB ═══ */}
            {activeTab === 'upload' && (
              <div
                style={{
                  maxWidth: '640px',
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                <KBUploadPanel
                  onUpload={handleUploadFile}
                  onUploadComplete={handleUploadComplete}
                  isDark={isDark}
                  colors={colors}
                  isMobile={isMobile}
                />

                {/* Upload Tips */}
                <div
                  style={{
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '16px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: isMobile ? '14px 16px' : '16px 20px',
                      borderBottom: `1px solid ${colors.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <TrendingUp size={14} color={colors.accent} />
                    <h3
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: '13px',
                        fontWeight: 700,
                        color: colors.text,
                        letterSpacing: '1px',
                        margin: 0,
                      }}
                    >
                      UPLOAD TIPS
                    </h3>
                  </div>
                  <div style={{ padding: isMobile ? '16px' : '20px' }}>
                    {[
                      {
                        title: 'Expanded Format Support',
                        desc: 'Upload PDF, TXT, DOC, DOCX, CSV, MD, JSON, XML, HTML, XLSX, and RTF files to accommodate diverse content types.',
                      },
                      {
                        title: 'Auto-Categorization',
                        desc: 'Documents are automatically categorized based on content analysis. Filter by category later for quick retrieval.',
                      },
                      {
                        title: 'Instant Search',
                        desc: 'Uploaded documents become searchable immediately through the advanced search with filters, tags, and file type options.',
                      },
                      {
                        title: 'Batch Upload',
                        desc: 'Select multiple files at once or drag them into the upload area for efficient batch processing.',
                      },
                      {
                        title: 'Bookmarking',
                        desc: 'Bookmark important documents for quick access from the Discover tab. Bookmarks persist across sessions.',
                      },
                    ].map((tip, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '10px 0',
                          borderBottom:
                            i < 4 ? `1px solid ${colors.border}` : 'none',
                        }}
                      >
                        <p
                          style={{
                            color: colors.text,
                            fontSize: '13px',
                            fontWeight: 600,
                            margin: '0 0 3px 0',
                          }}
                        >
                          {tip.title}
                        </p>
                        <p
                          style={{
                            color: colors.textMuted,
                            fontSize: '12px',
                            lineHeight: 1.6,
                            margin: 0,
                          }}
                        >
                          {tip.desc}
                        </p>
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
          onClose={() => {
            setViewerDoc(null);
            setViewerContent(null);
          }}
          isDark={isDark}
          colors={colors}
          isBookmarked={bookmarkedIds.has(viewerDoc.id)}
          onBookmark={() => handleBookmark(viewerDoc.id)}
        />
      )}

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default KnowledgeBasePage;

'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Trash2,
  Eye,
  Clock,
  ArrowUpDown,
  LayoutGrid,
  List,
  Bookmark,
  BookmarkCheck,
  HardDrive,
  FolderOpen,
  FileImage,
  FileCode,
  FileSpreadsheet,
  File,
  Search,
} from 'lucide-react';
import { Document } from '@/types/api';

type SortField = 'filename' | 'created_at' | 'size' | 'category';
type SortDir = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

interface KBDocumentGridProps {
  documents: Document[];
  activeCategory: string;
  onViewDocument: (doc: Document) => void;
  onDeleteDocument: (id: string) => void;
  onBookmark?: (id: string) => void;
  bookmarkedIds?: Set<string>;
  isDark: boolean;
  colors: Record<string, string>;
  isMobile: boolean;
  isTablet: boolean;
}

const catColors: Record<string, { bg: string; text: string }> = {
  afl: { bg: 'rgba(254, 192, 15, 0.12)', text: '#FEC00F' },
  strategy: { bg: 'rgba(34, 197, 94, 0.12)', text: '#22c55e' },
  indicator: { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8' },
  documentation: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6' },
  general: { bg: 'rgba(156, 163, 175, 0.12)', text: '#9ca3af' },
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'pdf':
      return { Icon: FileText, color: '#ef4444' };
    case 'doc':
    case 'docx':
      return { Icon: FileText, color: '#3b82f6' };
    case 'txt':
    case 'md':
      return { Icon: FileCode, color: '#22c55e' };
    case 'csv':
    case 'xlsx':
    case 'xls':
      return { Icon: FileSpreadsheet, color: '#22c55e' };
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      return { Icon: FileImage, color: '#a855f7' };
    case 'json':
    case 'xml':
    case 'html':
      return { Icon: FileCode, color: '#f59e0b' };
    default:
      return { Icon: File, color: '#9ca3af' };
  }
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toUpperCase() || 'FILE';
}

function CategoryBadge({ category }: { category: string }) {
  const c = catColors[category] || catColors.general;
  return (
    <span
      style={{
        fontSize: '10px',
        padding: '2px 8px',
        borderRadius: '4px',
        backgroundColor: c.bg,
        color: c.text,
        fontWeight: 700,
        fontFamily: "'Rajdhani', sans-serif",
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
      }}
    >
      {category}
    </span>
  );
}

export default function KBDocumentGrid({
  documents,
  activeCategory,
  onViewDocument,
  onDeleteDocument,
  onBookmark,
  bookmarkedIds = new Set(),
  isDark,
  colors,
  isMobile,
  isTablet,
}: KBDocumentGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  const filteredDocs = useMemo(() => {
    let filtered =
      activeCategory === 'all'
        ? documents
        : documents.filter((doc) => doc.category === activeCategory);

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.filename.toLowerCase().includes(q) ||
          doc.category.toLowerCase().includes(q)
      );
    }

    return [...filtered].sort((a, b) => {
      let compare = 0;
      switch (sortField) {
        case 'filename':
          compare = a.filename.localeCompare(b.filename);
          break;
        case 'created_at':
          compare =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'size':
          compare = a.size - b.size;
          break;
        case 'category':
          compare = a.category.localeCompare(b.category);
          break;
      }
      return sortDir === 'asc' ? compare : -compare;
    });
  }, [documents, activeCategory, sortField, sortDir, searchFilter]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      onDeleteDocument(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  return (
    <div
      style={{
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: isMobile ? '16px' : '20px 24px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexDirection: isMobile ? 'column' : 'row',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '15px',
                fontWeight: 700,
                color: colors.text,
                letterSpacing: '1px',
                margin: 0,
              }}
            >
              DOCUMENTS
            </h3>
            <p
              style={{
                color: colors.textMuted,
                fontSize: '12px',
                marginTop: '3px',
                marginBottom: 0,
              }}
            >
              {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}
              {activeCategory !== 'all' ? ` in ${activeCategory}` : ''}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {/* Sort Buttons */}
            {[
              { field: 'created_at' as SortField, label: 'Date' },
              { field: 'filename' as SortField, label: 'Name' },
              { field: 'size' as SortField, label: 'Size' },
            ].map((s) => (
              <button
                key={s.field}
                onClick={() => toggleSort(s.field)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${
                    sortField === s.field ? colors.accent : colors.border
                  }`,
                  backgroundColor:
                    sortField === s.field ? `${colors.accent}14` : 'transparent',
                  color: sortField === s.field ? colors.accent : colors.textMuted,
                  fontSize: '11px',
                  fontWeight: 600,
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s',
                }}
              >
                {s.label}
                {sortField === s.field && <ArrowUpDown size={10} />}
              </button>
            ))}

            {/* View Toggle */}
            {!isMobile && (
              <div
                style={{
                  display: 'flex',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  overflow: 'hidden',
                  marginLeft: '2px',
                }}
              >
                {[
                  { mode: 'list' as ViewMode, Icon: List },
                  { mode: 'grid' as ViewMode, Icon: LayoutGrid },
                ].map(({ mode, Icon }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    style={{
                      width: '30px',
                      height: '30px',
                      border: 'none',
                      backgroundColor:
                        viewMode === mode ? `${colors.accent}14` : 'transparent',
                      color: viewMode === mode ? colors.accent : colors.textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Icon size={13} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Inline Search */}
        <div style={{ position: 'relative' }}>
          <Search
            size={14}
            color={colors.textMuted}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter documents..."
            style={{
              width: '100%',
              height: '36px',
              paddingLeft: '34px',
              paddingRight: searchFilter ? '32px' : '12px',
              backgroundColor: colors.inputBg,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              color: colors.text,
              fontSize: '12px',
              fontFamily: "'Quicksand', sans-serif",
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: colors.textMuted,
                padding: '2px',
                display: 'flex',
              }}
            >
              <Search size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Document Content */}
      {filteredDocs.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <FolderOpen
            size={44}
            color={colors.textMuted}
            style={{ marginBottom: '14px', opacity: 0.3 }}
          />
          <p
            style={{
              color: colors.textMuted,
              fontSize: '14px',
              fontWeight: 500,
              margin: '0 0 4px 0',
            }}
          >
            {searchFilter
              ? `No documents matching "${searchFilter}"`
              : activeCategory !== 'all'
              ? `No documents in "${activeCategory}"`
              : 'No documents yet'}
          </p>
          <p
            style={{
              color: colors.textMuted,
              fontSize: '12px',
              opacity: 0.7,
              margin: 0,
            }}
          >
            {searchFilter
              ? 'Try a different search term'
              : 'Upload documents to get started'}
          </p>
        </div>
      ) : viewMode === 'grid' && !isMobile ? (
        /* Grid View */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isTablet
              ? 'repeat(2, 1fr)'
              : 'repeat(3, 1fr)',
            gap: '14px',
            padding: '20px 24px',
          }}
        >
          {filteredDocs.map((doc) => {
            const isBookmarked = bookmarkedIds.has(doc.id);
            const { Icon: FIcon, color: fColor } = getFileIcon(doc.filename);
            const ext = getFileExtension(doc.filename);
            return (
              <div
                key={doc.id}
                style={{
                  backgroundColor: isDark ? '#161616' : '#FAFAFA',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '12px',
                  padding: '18px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.accent;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => onViewDocument(doc)}
              >
                {/* Bookmark */}
                {onBookmark && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookmark(doc.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: isBookmarked ? colors.accent : colors.textMuted,
                      padding: '4px',
                      opacity: isBookmarked ? 1 : 0.5,
                      transition: 'all 0.2s',
                    }}
                    title={isBookmarked ? 'Remove bookmark' : 'Bookmark document'}
                  >
                    {isBookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                  </button>
                )}

                {/* File Icon with Extension Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: `${fColor}14`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FIcon size={20} color={fColor} />
                  </div>
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      backgroundColor: `${fColor}14`,
                      color: fColor,
                      fontWeight: 700,
                      fontFamily: "'Rajdhani', sans-serif",
                      letterSpacing: '0.5px',
                    }}
                  >
                    {ext}
                  </span>
                </div>

                <p
                  style={{
                    color: colors.text,
                    fontSize: '13px',
                    fontWeight: 600,
                    margin: '0 0 8px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.3,
                  }}
                >
                  {doc.filename}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap',
                    marginBottom: '10px',
                  }}
                >
                  <CategoryBadge category={doc.category} />
                  <span style={{ color: colors.textMuted, fontSize: '11px' }}>
                    {formatFileSize(doc.size)}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: colors.textMuted,
                    fontSize: '11px',
                    marginBottom: '12px',
                  }}
                >
                  <Clock size={11} />
                  {new Date(doc.created_at).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    borderTop: `1px solid ${colors.border}`,
                    paddingTop: '12px',
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDocument(doc);
                    }}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '6px',
                      border: `1px solid ${colors.border}`,
                      backgroundColor: 'transparent',
                      color: colors.textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: "'Rajdhani', sans-serif",
                      transition: 'all 0.2s',
                    }}
                  >
                    <Eye size={13} />
                    VIEW
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.id);
                    }}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      border: `1px solid ${
                        confirmDeleteId === doc.id ? '#DC2626' : colors.border
                      }`,
                      backgroundColor:
                        confirmDeleteId === doc.id
                          ? 'rgba(220, 38, 38, 0.08)'
                          : 'transparent',
                      color:
                        confirmDeleteId === doc.id ? '#DC2626' : colors.textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div>
          {filteredDocs.map((doc, idx) => {
            const isBookmarked = bookmarkedIds.has(doc.id);
            const { Icon: FIcon, color: fColor } = getFileIcon(doc.filename);
            const ext = getFileExtension(doc.filename);
            return (
              <div
                key={doc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: isMobile ? '12px 16px' : '12px 24px',
                  borderBottom:
                    idx < filteredDocs.length - 1
                      ? `1px solid ${colors.border}`
                      : 'none',
                  transition: 'background-color 0.15s',
                  gap: '12px',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = colors.hoverBg)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flex: 1,
                    minWidth: 0,
                    cursor: 'pointer',
                  }}
                  onClick={() => onViewDocument(doc)}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      backgroundColor: `${fColor}14`,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      position: 'relative',
                    }}
                  >
                    <FIcon size={18} color={fColor} />
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-4px',
                        fontSize: '8px',
                        padding: '0px 4px',
                        borderRadius: '3px',
                        backgroundColor: fColor,
                        color: '#fff',
                        fontWeight: 700,
                        fontFamily: "'Rajdhani', sans-serif",
                        letterSpacing: '0.3px',
                        lineHeight: '14px',
                      }}
                    >
                      {ext}
                    </span>
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
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '3px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <CategoryBadge category={doc.category} />
                      <span style={{ color: colors.textMuted, fontSize: '11px' }}>
                        {formatFileSize(doc.size)}
                      </span>
                      {!isMobile && (
                        <span
                          style={{
                            color: colors.textMuted,
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Clock size={10} />
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  {onBookmark && (
                    <button
                      onClick={() => onBookmark(doc.id)}
                      title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                      style={{
                        width: '34px',
                        height: '34px',
                        backgroundColor: 'transparent',
                        border: `1px solid ${
                          isBookmarked ? colors.accent : colors.border
                        }`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isBookmarked ? colors.accent : colors.textMuted,
                        transition: 'all 0.2s',
                      }}
                    >
                      {isBookmarked ? (
                        <BookmarkCheck size={14} />
                      ) : (
                        <Bookmark size={14} />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => onViewDocument(doc)}
                    style={{
                      width: '34px',
                      height: '34px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.textMuted,
                      transition: 'all 0.2s',
                    }}
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    style={{
                      width: '34px',
                      height: '34px',
                      backgroundColor:
                        confirmDeleteId === doc.id
                          ? 'rgba(220,38,38,0.08)'
                          : 'transparent',
                      border: `1px solid ${
                        confirmDeleteId === doc.id ? '#DC2626' : colors.border
                      }`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color:
                        confirmDeleteId === doc.id ? '#DC2626' : colors.textMuted,
                      transition: 'all 0.2s',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

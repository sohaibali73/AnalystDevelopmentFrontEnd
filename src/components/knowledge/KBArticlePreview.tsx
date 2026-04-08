'use client';

import React from 'react';
import {
  FileText,
  X,
  Clock,
  HardDrive,
  Loader2,
  AlertCircle,
  Copy,
  CheckCircle,
  Bookmark,
  BookmarkCheck,
  FileCode,
  FileSpreadsheet,
  File,
  FileImage,
  ExternalLink,
  Download,
  Eye,
} from 'lucide-react';
import { Document } from '@/types/api';
import { getFileExtension } from '@/lib/filePreview';

function formatFileSize(bytes: number | undefined | null) {
  // Guard against undefined / null / NaN coming from the backend
  const n = (bytes != null && !isNaN(Number(bytes))) ? Number(bytes) : 0;
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

const catColors: Record<string, { bg: string; text: string }> = {
  afl: { bg: 'rgba(254, 192, 15, 0.12)', text: '#FEC00F' },
  strategy: { bg: 'rgba(34, 197, 94, 0.12)', text: '#22c55e' },
  indicator: { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8' },
  documentation: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6' },
  general: { bg: 'rgba(156, 163, 175, 0.12)', text: '#9ca3af' },
};

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

function generateSummary(content: string, filename: string): string {
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
  if (sentences.length === 0) return `Preview of ${filename}`;
  const summary = sentences.slice(0, 3).join('. ').trim();
  return summary.length > 250 ? summary.substring(0, 250) + '...' : summary + '.';
}

function estimateReadTime(content: string): string {
  const words = content.split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

interface ParsedTable {
  headers: string[];
  rows: string[][];
  name?: string;
}

interface KBArticlePreviewProps {
  doc: Document;
  content: string | null;
  contentType?: 'html' | 'text' | 'table' | 'json' | 'unsupported';
  tables?: ParsedTable[];
  loading: boolean;
  onClose: () => void;
  isDark: boolean;
  colors: Record<string, string>;
  isBookmarked?: boolean;
  onBookmark?: () => void;
  /** Callback to view original (non-parsed) document - receives the document */
  onViewOriginal?: (doc: Document) => void;
  /** URL to download the original file */
  originalFileUrl?: string;
}

export default function KBArticlePreview({
  doc,
  content,
  contentType = 'text',
  tables,
  loading,
  onClose,
  isDark,
  colors,
  isBookmarked,
  onBookmark,
  onViewOriginal,
  originalFileUrl,
}: KBArticlePreviewProps) {
  const [copied, setCopied] = React.useState(false);
  const c = catColors[doc.category] || catColors.general;
  const { Icon: FIcon, color: fColor } = getFileIcon(doc.filename);
  const ext = getFileExtension(doc.filename).toUpperCase() || 'FILE';

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              flex: 1,
              minWidth: 0,
            }}
          >
            {/* File Type Icon */}
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: `${fColor}14`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                position: 'relative',
              }}
            >
              <FIcon size={24} color={fColor} />
              <span
                style={{
                  position: 'absolute',
                  bottom: '-3px',
                  right: '-6px',
                  fontSize: '8px',
                  padding: '1px 5px',
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
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '18px',
                  fontWeight: 700,
                  color: colors.text,
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.5px',
                }}
              >
                {doc.filename}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    backgroundColor: c.bg,
                    color: c.text,
                    fontWeight: 700,
                    fontFamily: "'Rajdhani', sans-serif",
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}
                >
                  {doc.category}
                </span>
                <span
                  style={{
                    color: colors.textMuted,
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <HardDrive size={11} />
                  {formatFileSize(doc.size)}
                </span>
                <span
                  style={{
                    color: colors.textMuted,
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Clock size={11} />
                  {new Date(doc.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                {content && (
                  <span
                    style={{
                      color: colors.textMuted,
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <ExternalLink size={11} />
                    {estimateReadTime(content)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            {/* View Original / Download button */}
            {(onViewOriginal || originalFileUrl) && (
              <button
                onClick={() => {
                  if (originalFileUrl) {
                    // Open in new tab or download
                    window.open(originalFileUrl, '_blank');
                  } else if (onViewOriginal) {
                    onViewOriginal(doc);
                  }
                }}
                style={{
                  height: '34px',
                  padding: '0 12px',
                  backgroundColor: isDark ? 'rgba(254, 192, 15, 0.1)' : 'rgba(254, 192, 15, 0.12)',
                  border: '1px solid rgba(254, 192, 15, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  color: '#FEC00F',
                  fontSize: '11px',
                  fontWeight: 600,
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: '0.5px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(254, 192, 15, 0.15)' : 'rgba(254, 192, 15, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(254, 192, 15, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(254, 192, 15, 0.1)' : 'rgba(254, 192, 15, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(254, 192, 15, 0.3)';
                }}
                title="View or download original file"
              >
                {originalFileUrl ? <Download size={13} /> : <Eye size={13} />}
                <span>VIEW ORIGINAL</span>
              </button>
            )}
            {onBookmark && (
              <button
                onClick={onBookmark}
                style={{
                  width: '34px',
                  height: '34px',
                  backgroundColor: isDark ? '#2A2A2A' : '#EEEEEE',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isBookmarked ? colors.accent : colors.textMuted,
                  transition: 'all 0.2s',
                }}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
              >
                {isBookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
              </button>
            )}
            {content && (
              <button
                onClick={handleCopy}
                style={{
                  width: '34px',
                  height: '34px',
                  backgroundColor: isDark ? '#2A2A2A' : '#EEEEEE',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: copied ? '#22c55e' : colors.textMuted,
                  transition: 'all 0.2s',
                }}
                title={copied ? 'Copied!' : 'Copy content'}
              >
                {copied ? <CheckCircle size={15} /> : <Copy size={15} />}
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                width: '34px',
                height: '34px',
                backgroundColor: isDark ? '#2A2A2A' : '#EEEEEE',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.textMuted,
                transition: 'all 0.2s',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {loading ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px',
                gap: '14px',
              }}
            >
              <Loader2
                size={28}
                color={colors.accent}
                style={{ animation: 'spin 1s linear infinite' }}
              />
              <p style={{ color: colors.textMuted, fontSize: '13px' }}>
                Loading document content...
              </p>
            </div>
          ) : content ? (
            <div>
              {/* Auto-Generated Summary */}
              <div
                style={{
                  padding: '16px 18px',
                  backgroundColor: `${colors.accent}08`,
                  borderRadius: '10px',
                  border: `1px solid ${colors.accent}20`,
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      backgroundColor: `${colors.accent}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileText size={11} color={colors.accent} />
                  </div>
                  <p
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: colors.accent,
                      fontFamily: "'Rajdhani', sans-serif",
                      letterSpacing: '0.5px',
                      margin: 0,
                    }}
                  >
                    SUMMARY
                  </p>
                </div>
                <p
                  style={{
                    color: isDark ? '#C8C8C8' : '#555',
                    fontSize: '13px',
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {generateSummary(content, doc.filename)}
                </p>
              </div>

              {/* Metadata Bar */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '16px',
                  padding: '10px 14px',
                  backgroundColor: isDark ? '#161616' : '#FAFAFA',
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: colors.textMuted, fontSize: '11px' }}>
                  Words: {content.split(/\s+/).length.toLocaleString()}
                </span>
                <span style={{ color: colors.textMuted, fontSize: '11px' }}>
                  Characters: {content.length.toLocaleString()}
                </span>
                <span style={{ color: colors.textMuted, fontSize: '11px' }}>
                  Lines: {content.split('\n').length.toLocaleString()}
                </span>
                {contentType !== 'text' && (
                  <span style={{ color: colors.textMuted, fontSize: '11px' }}>
                    Format: {contentType.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Format-Aware Content Rendering */}
              {contentType === 'html' ? (
                <div
                  style={{
                    fontFamily: "'Quicksand', 'Consolas', 'Monaco', monospace",
                    fontSize: '13px',
                    lineHeight: 1.7,
                    color: colors.text,
                    backgroundColor: isDark ? '#161616' : '#FAFAFA',
                    borderRadius: '10px',
                    padding: '20px',
                    border: `1px solid ${colors.border}`,
                    overflow: 'auto',
                  }}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : contentType === 'json' ? (
                <pre
                  style={{
                    fontFamily: "'Quicksand', 'Consolas', 'Monaco', monospace",
                    fontSize: '13px',
                    lineHeight: 1.7,
                    color: '#22c55e',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: 0,
                    backgroundColor: isDark ? '#0a0a0a' : '#FAFAFA',
                    borderRadius: '10px',
                    padding: '20px',
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  {content}
                </pre>
              ) : contentType === 'table' && tables && tables.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {tables.map((table, tIdx) => (
                    <div key={tIdx}>
                      {table.name && (
                        <p
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: colors.accent,
                            fontFamily: "'Rajdhani', sans-serif",
                            letterSpacing: '0.5px',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                          }}
                        >
                          Sheet: {table.name}
                        </p>
                      )}
                      <div
                        style={{
                          overflow: 'auto',
                          borderRadius: '10px',
                          border: `1px solid ${colors.border}`,
                          backgroundColor: isDark ? '#161616' : '#FAFAFA',
                        }}
                      >
                        <table
                          style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '12px',
                            fontFamily: "'Quicksand', sans-serif",
                          }}
                        >
                          <thead>
                            <tr>
                              {table.headers.map((header, hIdx) => (
                                <th
                                  key={hIdx}
                                  style={{
                                    padding: '10px 14px',
                                    textAlign: 'left',
                                    fontWeight: 700,
                                    color: colors.text,
                                    borderBottom: `1px solid ${colors.border}`,
                                    backgroundColor: isDark ? '#1a1a1a' : '#F5F5F5',
                                    whiteSpace: 'nowrap',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 1,
                                  }}
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {table.rows.slice(0, 100).map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                style={{
                                  borderBottom: `1px solid ${colors.border}`,
                                  transition: 'background-color 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = isDark
                                    ? 'rgba(255,255,255,0.03)'
                                    : 'rgba(0,0,0,0.02)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    style={{
                                      padding: '8px 14px',
                                      color: colors.text,
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {table.rows.length > 100 && (
                          <p
                            style={{
                              padding: '10px 14px',
                              fontSize: '11px',
                              color: colors.textMuted,
                              textAlign: 'center',
                              borderTop: `1px solid ${colors.border}`,
                              margin: 0,
                            }}
                          >
                            Showing first 100 of {table.rows.length} rows
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <pre
                  style={{
                    fontFamily: "'Quicksand', 'Consolas', 'Monaco', monospace",
                    fontSize: '13px',
                    lineHeight: 1.7,
                    color: colors.text,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: 0,
                    backgroundColor: isDark ? '#161616' : '#FAFAFA',
                    borderRadius: '10px',
                    padding: '20px',
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  {content}
                </pre>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px',
                gap: '12px',
              }}
            >
              <AlertCircle
                size={32}
                color={colors.textMuted}
                style={{ opacity: 0.5 }}
              />
              <p
                style={{
                  color: colors.textMuted,
                  fontSize: '13px',
                  textAlign: 'center',
                  maxWidth: '380px',
                  lineHeight: 1.6,
                }}
              >
                Unable to load document content. The document may be in a binary
                format that cannot be displayed as text.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

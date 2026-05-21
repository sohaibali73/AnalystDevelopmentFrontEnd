'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Download, FileText, FileCode, FileSpreadsheet, File, Loader2, AlertCircle, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import kbApi from '@/lib/kbApi';
import { parseFileForPreview } from '@/lib/filePreview';
import type { KBDocument } from '@/types/kb';

function getExt(filename: string): string { return filename.split('.').pop()?.toLowerCase() || ''; }

function getFileIcon(filename: string) {
  const ext = getExt(filename);
  switch (ext) {
    case 'pdf': return { Icon: FileText, color: '#ef4444' };
    case 'doc': case 'docx': return { Icon: FileText, color: '#3b82f6' };
    case 'txt': case 'md': return { Icon: FileCode, color: '#22c55e' };
    case 'csv': case 'xlsx': case 'xls': return { Icon: FileSpreadsheet, color: '#22c55e' };
    case 'json': case 'xml': case 'html': case 'htm': return { Icon: FileCode, color: '#f59e0b' };
    default: return { Icon: File, color: '#9ca3af' };
  }
}

function formatSize(bytes: number | null | undefined): string {
  const n = Number(bytes ?? 0);
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

const TEXT_EXTS = ['txt', 'md', 'json', 'xml', 'html', 'htm', 'csv'];
const PARSEABLE_EXTS = ['docx', 'doc', 'xlsx', 'xls', 'csv', 'txt', 'md', 'json', 'html', 'htm', 'xml'];
const PDF_EXTS = ['pdf'];
const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'];

export interface KBFileViewerModalProps {
  doc: KBDocument;
  onClose: () => void;
  isDark: boolean;
  colors: Record<string, string>;
  chunkPreview?: string;
}

export default function KBFileViewerModal({ doc, onClose, isDark, colors, chunkPreview }: KBFileViewerModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentType, setContentType] = useState<'html' | 'text' | 'table' | 'json' | 'pdf' | 'image' | 'unsupported'>('text');
  const [content, setContent] = useState<string | null>(null);
  const [tables, setTables] = useState<{ headers: string[]; rows: string[][]; name?: string }[] | undefined>(undefined);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRawFallback, setShowRawFallback] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const ext = getExt(doc.filename);
  const { Icon: FIcon, color: fColor } = getFileIcon(doc.filename);
  const downloadUrl = kbApi.getDownloadUrl(doc.id);
  const attachmentUrl = kbApi.getAttachmentUrl(doc.id);

  const loadContent = useCallback(async () => {
    setLoading(true); setError(null); setContent(null); setTables(undefined);
    setBlobUrl(null); // existing URL gets revoked by the cleanup effect below
    try {
      // Native-render path: render the ORIGINAL file (PDF or image) in the
      // browser. The auth'd /download endpoint can't be loaded directly into
      // an iframe (no way to pass Bearer headers), so fetch the blob and
      // hand the iframe a blob: URL instead.
      if (PDF_EXTS.includes(ext) || IMAGE_EXTS.includes(ext)) {
        const blob = await kbApi.fetchBlob(doc.id);
        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          setContentType(PDF_EXTS.includes(ext) ? 'pdf' : 'image');
          setLoading(false); return;
        }
      }
      if (PARSEABLE_EXTS.includes(ext)) {
        const blob = await kbApi.fetchBlob(doc.id);
        if (blob.size > 0) {
          const parsed = await parseFileForPreview(blob, doc.filename);
          if (parsed.type !== 'unsupported') {
            setContentType(parsed.type as any); setContent(parsed.content); setTables(parsed.tables);
            setLoading(false); return;
          }
        }
      }
      try {
        const raw = await kbApi.getRawDocument(doc.id);
        if (raw.raw_content) {
          setContentType('text'); setContent(raw.raw_content); setShowRawFallback(true);
          setLoading(false); return;
        }
      } catch { /* ignore */ }
      setContentType('unsupported'); setContent(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally { setLoading(false); }
  }, [doc.id, doc.filename, ext]);

  useEffect(() => { loadContent(); }, [loadContent]);

  // Revoke the blob URL on unmount so we don't leak memory across views.
  useEffect(() => {
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [blobUrl]);

  useEffect(() => {
    if (!chunkPreview || !content || !contentRef.current) return;
    const needle = chunkPreview.slice(0, 80).toLowerCase();
    const text = contentRef.current.innerText?.toLowerCase() ?? '';
    const idx = text.indexOf(needle);
    if (idx > -1) {
      const ratio = idx / text.length;
      const el = contentRef.current;
      el.scrollTop = ratio * el.scrollHeight;
    }
  }, [chunkPreview, content]);

  const handleCopy = () => {
    if (content) { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: '960px', maxHeight: '90vh', backgroundColor: colors.cardBg, border: '1px solid ' + colors.border, borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid ' + colors.border, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: 0 }}>
            <div style={{ width: 46, height: 46, borderRadius: '11px', backgroundColor: fColor + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
              <FIcon size={22} color={fColor} />
              <span style={{ position: 'absolute', bottom: '-3px', right: '-6px', fontSize: '7px', padding: '1px 4px', borderRadius: '3px', backgroundColor: fColor, color: '#fff', fontWeight: 700, fontFamily: "'DM Mono', monospace", lineHeight: '13px', textTransform: 'uppercase' }}>{ext.toUpperCase() || 'FILE'}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '16px', fontWeight: 700, color: colors.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{doc.title || doc.filename}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                {doc.category && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(254,192,15,0.1)', color: 'var(--accent)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em', textTransform: 'uppercase' }}>{doc.category}</span>}
                <span style={{ color: colors.textMuted, fontSize: '11px' }}>{formatSize(doc.file_size ?? doc.size)}</span>
                {showRawFallback && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(251,146,60,0.1)', color: '#fb923c', fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em' }}>Extracted text</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" style={{ height: '34px', padding: '0 12px', borderRadius: '8px', border: '1px solid rgba(254,192,15,0.3)', backgroundColor: 'rgba(254,192,15,0.08)', color: 'var(--accent)', fontSize: '11px', fontWeight: 600, fontFamily: "'Syne', sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none', cursor: 'pointer' }} title="Open original file"><ExternalLink size={12} />Open</a>
            <a href={attachmentUrl} download={doc.filename} style={{ height: '34px', width: '34px', borderRadius: '8px', border: '1px solid ' + colors.border, backgroundColor: 'transparent', color: colors.textMuted, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', cursor: 'pointer' }} title="Download file"><Download size={14} /></a>
            {content && <button onClick={handleCopy} style={{ height: '34px', width: '34px', borderRadius: '8px', border: '1px solid ' + colors.border, backgroundColor: 'transparent', color: copied ? '#22c55e' : colors.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={copied ? 'Copied!' : 'Copy text'}>{copied ? <CheckCircle size={14} /> : <Copy size={14} />}</button>}
            <button onClick={onClose} style={{ height: '34px', width: '34px', borderRadius: '8px', border: '1px solid ' + colors.border, backgroundColor: 'transparent', color: colors.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
          </div>
        </div>
        <div ref={contentRef} style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '14px' }}>
              <Loader2 size={28} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ color: colors.textMuted, fontSize: '13px', margin: 0 }}>Loading document...</p>
            </div>
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
              <AlertCircle size={32} color="#ef4444" style={{ opacity: 0.7 }} />
              <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>{error}</p>
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '12px' }}>Open original file</a>
            </div>
          ) : contentType === 'pdf' && blobUrl ? (
            <iframe
              src={blobUrl}
              title={doc.filename}
              style={{ width: '100%', height: 'calc(90vh - 140px)', minHeight: '500px', border: '1px solid ' + colors.border, borderRadius: '10px', backgroundColor: isDark ? '#161616' : '#FAFAFA' }}
            />
          ) : contentType === 'image' && blobUrl ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', padding: '12px', backgroundColor: isDark ? '#161616' : '#FAFAFA', border: '1px solid ' + colors.border, borderRadius: '10px' }}>
              <img src={blobUrl} alt={doc.filename} style={{ maxWidth: '100%', maxHeight: 'calc(90vh - 200px)', objectFit: 'contain', borderRadius: '6px' }} />
            </div>
          ) : contentType === 'unsupported' || !content ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '14px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '16px', backgroundColor: fColor + '14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FIcon size={28} color={fColor} /></div>
              <p style={{ color: colors.text, fontSize: '15px', fontWeight: 600, margin: 0, fontFamily: "'Syne', sans-serif" }}>{doc.filename}</p>
              <p style={{ color: colors.textMuted, fontSize: '13px', margin: 0, textAlign: 'center', maxWidth: 380 }}>This file type cannot be previewed in the browser. Open or download the original file.</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 18px', borderRadius: '9px', border: '1px solid rgba(254,192,15,0.4)', backgroundColor: 'rgba(254,192,15,0.1)', color: 'var(--accent)', fontSize: '12px', fontWeight: 600, fontFamily: "'Syne', sans-serif", textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ExternalLink size={13} /> Open Original</a>
                <a href={attachmentUrl} download={doc.filename} style={{ padding: '8px 18px', borderRadius: '9px', border: '1px solid ' + colors.border, backgroundColor: 'transparent', color: colors.textMuted, fontSize: '12px', fontWeight: 600, fontFamily: "'Syne', sans-serif", textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Download size={13} /> Download</a>
              </div>
            </div>
          ) : contentType === 'html' ? (
            <div style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '13px', lineHeight: 1.7, color: colors.text, backgroundColor: isDark ? '#161616' : '#FAFAFA', borderRadius: '10px', padding: '20px', border: '1px solid ' + colors.border, overflow: 'auto' }} dangerouslySetInnerHTML={{ __html: content }} />
          ) : contentType === 'json' ? (
            <pre style={{ fontFamily: "'DM Mono', monospace", fontSize: '12.5px', lineHeight: 1.7, color: '#22c55e', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, backgroundColor: isDark ? '#0a0a0a' : '#FAFAFA', borderRadius: '10px', padding: '20px', border: '1px solid ' + colors.border }}>{content}</pre>
          ) : contentType === 'table' && tables && tables.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {tables.map((table, tIdx) => (
                <div key={tIdx}>
                  {table.name && <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em', marginBottom: '8px', textTransform: 'uppercase' }}>Sheet: {table.name}</p>}
                  <div style={{ overflow: 'auto', borderRadius: '10px', border: '1px solid ' + colors.border, backgroundColor: isDark ? '#161616' : '#FAFAFA' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead><tr>{table.headers.map((h, hIdx) => <th key={hIdx} style={{ padding: '9px 13px', textAlign: 'left', fontWeight: 700, color: colors.text, borderBottom: '1px solid ' + colors.border, backgroundColor: isDark ? '#1a1a1a' : '#F5F5F5', whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 1, fontFamily: "'DM Mono', monospace", fontSize: '11px' }}>{h}</th>)}</tr></thead>
                      <tbody>{table.rows.slice(0, 200).map((row, rIdx) => <tr key={rIdx} style={{ borderBottom: '1px solid ' + colors.border }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>{row.map((cell, cIdx) => <td key={cIdx} style={{ padding: '7px 13px', color: colors.text, whiteSpace: 'nowrap', fontSize: '12px' }}>{cell}</td>)}</tr>)}</tbody>
                    </table>
                    {table.rows.length > 200 && <p style={{ padding: '9px 13px', fontSize: '11px', color: colors.textMuted, textAlign: 'center', borderTop: '1px solid ' + colors.border, margin: 0, fontFamily: "'DM Mono', monospace" }}>Showing first 200 of {table.rows.length} rows</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <pre style={{ fontFamily: "'Quicksand', 'Consolas', monospace", fontSize: '13px', lineHeight: 1.75, color: colors.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, backgroundColor: isDark ? '#161616' : '#FAFAFA', borderRadius: '10px', padding: '20px', border: '1px solid ' + colors.border }}>{content}</pre>
          )}
        </div>
      </div>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
}

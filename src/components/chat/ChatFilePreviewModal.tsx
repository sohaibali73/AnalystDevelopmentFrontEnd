'use client';

/**
 * ChatFilePreviewModal — Full-featured file preview modal.
 *
 * Supports: PDF (native iframe), DOCX (mammoth.js), XLSX (SheetJS),
 * Images (Viewer.js), HTML (srcdoc iframe), Text/Code (pre block).
 *
 * Extracted from ChatPage.tsx for better separation of concerns.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Loader2, X, Download, Info } from 'lucide-react';
import {
  API_BASE_URL_CHAT,
  getAuthToken,
  getChatFileIcon,
  formatChatFileSize,
  getFileExtension,
  type ChatPreviewFile,
} from './chat-utils';

// ─── Constants ───────────────────────────────────────────────────────────────

const BINARY_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'docx', 'doc', 'xlsx', 'xls'];
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];
const HTML_EXTENSIONS = ['html', 'htm'];
const TEXT_EXTENSIONS = ['txt', 'md', 'csv', 'json', 'xml', 'log', 'sql', 'py', 'js', 'ts'];
const DOCX_EXTENSIONS = ['docx', 'doc'];
const XLSX_EXTENSIONS = ['xlsx', 'xls'];

// ─── External Script Loader ──────────────────────────────────────────────────

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(script);
  });
}

// ─── File Fetcher ────────────────────────────────────────────────────────────

async function fetchFileBlob(file: ChatPreviewFile): Promise<Blob | null> {
  if (file.url) {
    return fetch(file.url).then((r) => r.blob());
  }
  if (file.fileId) {
    const resp = await fetch(`${API_BASE_URL_CHAT}/upload/files/${file.fileId}/download`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.blob();
  }
  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ChatFilePreviewModalProps {
  file: ChatPreviewFile;
  onClose: () => void;
  isDark: boolean;
}

export function ChatFilePreviewModal({ file, onClose, isDark }: ChatFilePreviewModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const ext = getFileExtension(file.filename);
  const isBinaryRender = BINARY_EXTENSIONS.includes(ext);
  const isHtml = HTML_EXTENSIONS.includes(ext);
  const isText = TEXT_EXTENSIONS.includes(ext);
  const FIcon = getChatFileIcon(file.filename);

  // DOCX state
  const [docxHtml, setDocxHtml] = useState('');
  // XLSX state
  const [xlsxHtml, setXlsxHtml] = useState('');
  const [xlsxSheets, setXlsxSheets] = useState<string[]>([]);
  const [xlsxAllHtml, setXlsxAllHtml] = useState<string[]>([]);
  const [xlsxActive, setXlsxActive] = useState(0);
  // Viewer.js state
  const imgRef = useRef<HTMLImageElement>(null);
  const viewerRef = useRef<any>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  // ── Load file content ────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError('');
    let objectUrl = '';

    const run = async () => {
      try {
        const blob = await fetchFileBlob(file);
        if (!blob) {
          setError('No file data available');
          setLoading(false);
          return;
        }

        if (isBinaryRender) {
          objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);

          // DOCX rendering
          if (DOCX_EXTENSIONS.includes(ext)) {
            if (!(window as any).mammoth) {
              await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js');
            }
            const ab = await blob.arrayBuffer();
            const result = await (window as any).mammoth.convertToHtml({ arrayBuffer: ab });
            setDocxHtml(result.value);
          }

          // XLSX rendering
          if (XLSX_EXTENSIONS.includes(ext)) {
            if (!(window as any).XLSX) {
              await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
            }
            const XLSX = (window as any).XLSX;
            const ab = await blob.arrayBuffer();
            const wb = XLSX.read(ab, { type: 'array' });
            const names: string[] = wb.SheetNames;
            const pages = names.map((n: string) =>
              XLSX.utils.sheet_to_html(wb.Sheets[n], { id: 'chat-xlsx-table', editable: false }),
            );
            setXlsxSheets(names);
            setXlsxAllHtml(pages);
            setXlsxHtml(pages[0] || '');
          }
        } else if (isHtml || isText) {
          setTextContent(await blob.text());
        }

        setLoading(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
        setLoading(false);
      }
    };

    run();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.url, file.fileId]);

  // ── Viewer.js init for images ────────────────────────────────────────────
  useEffect(() => {
    if (!imgLoaded || !imgRef.current || !IMAGE_EXTENSIONS.includes(ext)) return;

    const init = async () => {
      if (!document.getElementById('viewerjs-css')) {
        const link = document.createElement('link');
        link.id = 'viewerjs-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/viewerjs@1.11.6/dist/viewer.min.css';
        document.head.appendChild(link);
      }
      if (!(window as any).Viewer) {
        await loadScript('https://cdn.jsdelivr.net/npm/viewerjs@1.11.6/dist/viewer.min.js');
      }
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
      viewerRef.current = new (window as any).Viewer(imgRef.current!, {
        inline: true,
        toolbar: {
          zoomIn: 1, zoomOut: 1, oneToOne: 1, reset: 1,
          rotateLeft: 1, rotateRight: 1, flipHorizontal: 1, flipVertical: 1,
        },
        navbar: false,
      });
    };

    init().catch(() => {});
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgLoaded]);

  // ── Download handler ─────────────────────────────────────────────────────
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await fetchFileBlob(file);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Download failed: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setDownloading(false);
    }
  };

  // ── Theme ────────────────────────────────────────────────────────────────
  const colors = {
    cardBg: isDark ? '#1E1E1E' : '#FFFFFF',
    border: isDark ? '#2E2E2E' : '#E5E5E5',
    text: isDark ? '#FFFFFF' : '#212121',
    textMuted: isDark ? '#9E9E9E' : '#757575',
    accent: '#FEC00F',
  };

  // ── Content renderer ─────────────────────────────────────────────────────
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center flex-1 gap-2.5 p-10">
          <Loader2 size={22} color={colors.accent} className="animate-spin" />
          <span style={{ color: colors.textMuted, fontSize: '13px' }}>
            Loading {ext.toUpperCase()}...
          </span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 gap-2.5 p-10">
          <Info size={28} color="#ef4444" />
          <span style={{ color: '#ef4444', fontSize: '13px' }}>{error}</span>
        </div>
      );
    }

    // PDF
    if (ext === 'pdf' && blobUrl) {
      return (
        <iframe
          src={`${blobUrl}#toolbar=1`}
          className="flex-1 w-full border-none min-h-[520px]"
          title={file.filename}
        />
      );
    }

    // Images
    if (IMAGE_EXTENSIONS.includes(ext) && blobUrl) {
      return (
        <div className="flex-1 min-h-[480px]" style={{ backgroundColor: isDark ? '#0d0d0d' : '#1a1a1a' }}>
          <img
            ref={imgRef}
            src={blobUrl}
            alt={file.filename}
            onLoad={() => setImgLoaded(true)}
            className="max-w-full block"
          />
          <style>{'.viewer-container,.viewer-canvas{background:#111!important}'}</style>
        </div>
      );
    }

    // DOCX
    if (DOCX_EXTENSIONS.includes(ext) && docxHtml) {
      return (
        <div className="flex-1 overflow-auto" style={{ backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0' }}>
          <div
            className="docx-body"
            style={{ padding: '40px 60px', maxWidth: '820px', margin: '0 auto' }}
            dangerouslySetInnerHTML={{ __html: docxHtml }}
          />
          <style>{`
            .docx-body h1{font-size:22px;font-weight:700;color:${colors.text};margin:0 0 14px}
            .docx-body h2{font-size:18px;font-weight:700;color:${colors.text};margin:20px 0 8px}
            .docx-body p{font-size:14px;line-height:1.7;color:${colors.text};margin:0 0 10px}
            .docx-body table{border-collapse:collapse;width:100%;margin:14px 0}
            .docx-body td,.docx-body th{border:1px solid ${colors.border};padding:6px 10px;font-size:13px;color:${colors.text}}
            .docx-body th{background:${isDark ? '#2a2a2a' : '#f5f5f5'};font-weight:600}
            .docx-body ul,.docx-body ol{padding-left:22px;margin:6px 0}
            .docx-body li{font-size:14px;line-height:1.6;color:${colors.text}}
            .docx-body img{max-width:100%;border-radius:4px}
          `}</style>
        </div>
      );
    }

    // XLSX
    if (XLSX_EXTENSIONS.includes(ext) && xlsxHtml) {
      return (
        <div className="flex-1 flex flex-col overflow-hidden">
          {xlsxSheets.length > 1 && (
            <div
              className="flex gap-1 px-3.5 py-2 flex-wrap"
              style={{ borderBottom: `1px solid ${colors.border}` }}
            >
              {xlsxSheets.map((name, idx) => (
                <button
                  key={name}
                  onClick={() => {
                    setXlsxActive(idx);
                    setXlsxHtml(xlsxAllHtml[idx]);
                  }}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${idx === xlsxActive ? colors.accent : colors.border}`,
                    backgroundColor: idx === xlsxActive ? `${colors.accent}14` : 'transparent',
                    color: idx === xlsxActive ? colors.accent : colors.textMuted,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
          <div
            className="flex-1 overflow-auto p-3.5"
            style={{ backgroundColor: isDark ? '#111' : '#fff' }}
            dangerouslySetInnerHTML={{ __html: xlsxHtml }}
          />
          <style>{`
            #chat-xlsx-table{border-collapse:collapse;font-size:12px;width:100%}
            #chat-xlsx-table td,#chat-xlsx-table th{border:1px solid ${isDark ? '#333' : '#ddd'};padding:4px 8px;color:${isDark ? '#e0e0e0' : '#212121'};white-space:nowrap}
            #chat-xlsx-table tr:first-child td{background:${isDark ? '#2a2a2a' : '#f5f5f5'};font-weight:600}
          `}</style>
        </div>
      );
    }

    // HTML
    if (isHtml && textContent) {
      return (
        <iframe
          srcDoc={textContent}
          sandbox="allow-scripts allow-same-origin"
          className="flex-1 w-full border-none min-h-[480px] bg-white"
          title={file.filename}
        />
      );
    }

    // Text/Code
    if (textContent) {
      return (
        <div className="flex-1 overflow-auto px-6 py-5">
          <pre
            className="m-0 whitespace-pre-wrap break-words font-mono text-[13px] leading-7"
            style={{ color: colors.text }}
          >
            {textContent}
          </pre>
        </div>
      );
    }

    // Fallback
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 p-10">
        <Info size={32} color={colors.textMuted} />
        <p style={{ color: colors.textMuted, fontSize: '13px', textAlign: 'center', margin: 0 }}>
          No preview available. Use Download to get the file.
        </p>
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[840px] max-h-[88vh] flex flex-col overflow-hidden rounded-[18px]"
        style={{
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center gap-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${colors.border}` }}
        >
          <div
            className="w-[38px] h-[38px] rounded-[9px] flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(254,192,15,0.12)' }}
          >
            <FIcon size={20} color="#FEC00F" />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="m-0 text-sm font-bold truncate"
              style={{ color: colors.text }}
            >
              {file.filename}
            </p>
            {file.size != null && (
              <p className="mt-0.5 text-[11px]" style={{ color: colors.textMuted, margin: '2px 0 0' }}>
                {formatChatFileSize(file.size)}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-[7px] rounded-[7px] text-xs font-bold"
              style={{
                border: `1px solid ${colors.accent}`,
                backgroundColor: `${colors.accent}14`,
                color: colors.accent,
                cursor: downloading ? 'not-allowed' : 'pointer',
                opacity: downloading ? 0.6 : 1,
              }}
            >
              {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              DOWNLOAD
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-[7px] flex items-center justify-center bg-transparent"
              style={{ border: `1px solid ${colors.border}`, cursor: 'pointer', color: colors.textMuted }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

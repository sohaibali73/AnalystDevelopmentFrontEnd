'use client';

/**
 * DocumentDownloadCard
 *
 * Shows a generated file card with an inline collapsible preview panel.
 *
 * Preview engines (all client-side, zero server round-trips):
 *   DOCX  → docx-preview          (renderAsync into a ref'd <div>)
 *   PPTX  → @kandiforge/pptx-renderer (slide-by-slide HTML rendering)
 *   XLSX  → SheetJS (xlsx)        (sheet_to_html into a <div>)
 *   HTML  → sandboxed <iframe srcDoc>
 *   PDF   → pdfjs-dist            (canvas rendering)
 *
 * Downloads always serve the original file type.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  FileText, Download, CheckCircle, Loader2, FileIcon,
  Eye, EyeOff, Table2, Film, File,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { getApiUrl } from '@/lib/env';

// ─── MIME map ─────────────────────────────────────────────────────────────────

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf:  'application/pdf',
    csv:  'text/csv',
    txt:  'text/plain',
    json: 'application/json',
    html: 'text/html',
  };
  return map[ext?.toLowerCase()] || 'application/octet-stream';
}

// ─── File type detection ─────────────────────────────────────────────────────

interface FileTypeInfo {
  ext: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  iconClass: string;
}

function detectFileType(output: DocumentDownloadCardProps['output']): FileTypeInfo {
  let ext = (output.doc_type || '').toLowerCase().replace(/^\./, '');

  if (!ext && output.filename) {
    ext = output.filename.split('.').pop()?.toLowerCase() || '';
  }

  if (!ext && output.tool) {
    const tool = output.tool.toLowerCase();
    if (tool.includes('docx') || tool.includes('word') || tool.includes('document')) ext = 'docx';
    else if (tool.includes('pptx') || tool.includes('presentation') || tool.includes('powerpoint') || tool.includes('slide')) ext = 'pptx';
    else if (tool.includes('xlsx') || tool.includes('excel') || tool.includes('spreadsheet')) ext = 'xlsx';
    else if (tool.includes('pdf')) ext = 'pdf';
    else if (tool.includes('csv')) ext = 'csv';
    else if (tool.includes('html')) ext = 'html';
  }

  switch (ext) {
    case 'docx': case 'doc':
      return { ext: 'docx', label: 'Word Document',       Icon: FileText,  accentClass: 'border-blue-500/30  bg-gradient-to-br from-blue-500/10  to-blue-600/5',  iconClass: 'text-blue-400'  };
    case 'pptx': case 'ppt':
      return { ext: 'pptx', label: 'Presentation',         Icon: Film,      accentClass: 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5', iconClass: 'text-amber-400' };
    case 'xlsx': case 'xls':
      return { ext: 'xlsx', label: 'Excel Spreadsheet',    Icon: Table2,    accentClass: 'border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-600/5', iconClass: 'text-green-400' };
    case 'pdf':
      return { ext: 'pdf',  label: 'PDF Document',         Icon: FileText,  accentClass: 'border-red-500/30   bg-gradient-to-br from-red-500/10   to-red-600/5',   iconClass: 'text-red-400'   };
    case 'html': case 'htm':
      return { ext: 'html', label: 'HTML File',             Icon: FileText,  accentClass: 'border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/5', iconClass: 'text-purple-400' };
    case 'csv':
      return { ext: 'csv',  label: 'CSV File',              Icon: Table2,    accentClass: 'border-teal-500/30  bg-gradient-to-br from-teal-500/10  to-teal-600/5',  iconClass: 'text-teal-400'  };
    default:
      return { ext: ext || 'bin', label: 'Generated File', Icon: File,      accentClass: 'border-zinc-500/30  bg-gradient-to-br from-zinc-500/10  to-zinc-600/5',  iconClass: 'text-zinc-400'  };
  }
}

// ─── Script loader (deduplicated) ────────────────────────────────────────────

const _scriptCache = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  if (_scriptCache.has(src)) return _scriptCache.get(src)!;
  const p = new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload  = () => resolve();
    s.onerror = () => { _scriptCache.delete(src); reject(new Error(`Failed: ${src}`)); };
    document.head.appendChild(s);
  });
  _scriptCache.set(src, p);
  return p;
}

// ─── Authenticated fetch helper ───────────────────────────────────────────────

async function fetchFileBlob(downloadUrl: string): Promise<Blob> {
  const API_BASE = getApiUrl();
  const fullUrl  = downloadUrl.startsWith('http') ? downloadUrl : `${API_BASE}${downloadUrl}`;
  const token    = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(fullUrl, { headers, mode: 'cors', credentials: 'omit' });
  if (!response.ok) throw new Error(`HTTP ${response.status} — ${response.statusText}`);
  return response.blob();
}

// ─── Preview state ────────────────────────────────────────────────────────────

type PreviewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'docx' }                                          // rendered into docxContainerRef
  | { status: 'xlsx'; sheets: string[]; pages: string[]; active: number }
  | { status: 'pptx'; slides: string[]; active: number }
  | { status: 'html'; content: string }
  | { status: 'pdf'; blobUrl: string; page: number; totalPages: number };

// ─── Props ────────────────────────────────────────────────────────────────────

interface DocumentDownloadCardProps {
  output: {
    success?: boolean;
    tool?: string;
    title?: string;
    subtitle?: string;
    filename?: string;
    doc_type?: string;
    document_id?: string;
    presentation_id?: string;
    download_url?: string;
    file_size_kb?: number;
    slide_count?: number;
    skill_used?: string;
    execution_time?: number;
    method?: string;
    content_preview?: string;
    error?: string;
  };
  /** Legacy prop kept for external callers — not used for the built-in preview */
  onPreview?: (file: { url?: string; filename: string; mediaType?: string }) => void;
}

// ─── Unique ID for XLSX table (avoid selector collisions) ─────────────────────

let _xlsxIdCounter = 0;

// ─── Component ────────────────────────────────────────────────────────────────

export default function DocumentDownloadCard({ output, onPreview }: DocumentDownloadCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded,  setDownloaded]  = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview,     setPreview]     = useState<PreviewState>({ status: 'idle' });

  const docxContainerRef = useRef<HTMLDivElement>(null);
  const xlsxTableId      = useRef(`xlsxt_${++_xlsxIdCounter}`).current;
  // Keep a live ref to pptx slide state so we can navigate without re-fetching
  const pptxSlidesRef    = useRef<string[]>([]);

  if (!output || !output.success) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 my-3">
        <div className="flex items-center gap-2 text-red-400">
          <FileIcon className="h-5 w-5" />
          <span className="font-medium">Document Generation Failed</span>
        </div>
        <p className="text-sm text-red-300 mt-2">{output?.error || 'Unknown error occurred'}</p>
      </div>
    );
  }

  const { ext, label, Icon, accentClass, iconClass } = detectFileType(output);
  const displayFilename = output.filename || `document.${ext}`;

  // ── Download ───────────────────────────────────────────────────────────────

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const downloadUrl = output.download_url;
      if (!downloadUrl) throw new Error('No download URL available');
      const blob = await fetchFileBlob(downloadUrl);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = displayFilename;   // always original file extension
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error('Download error:', err);
      alert(`Download failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDownloading(false);
    }
  };

  // ── Preview toggle ─────────────────────────────────────────────────────────

  const handlePreviewToggle = useCallback(async () => {
    if (previewOpen) {
      setPreviewOpen(false);
      return;
    }

    // Open preview — if already loaded keep the state
    setPreviewOpen(true);
    if (preview.status !== 'idle' && preview.status !== 'error') return;

    const downloadUrl = output.download_url;
    if (!downloadUrl) {
      setPreview({ status: 'error', message: 'No download URL available' });
      return;
    }

    setPreview({ status: 'loading' });

    try {
      const blob = await fetchFileBlob(downloadUrl);

      // ─────────────────────── DOCX ────────────────────────────────────────
      if (ext === 'docx' || ext === 'doc') {
        // Render into a ref'd container via docx-preview
        setPreview({ status: 'docx' });
        // Wait a tick for the ref'd div to mount
        await new Promise(r => setTimeout(r, 50));
        if (docxContainerRef.current) {
          const { renderAsync } = await import('docx-preview');
          docxContainerRef.current.innerHTML = '';
          await renderAsync(blob, docxContainerRef.current, undefined, {
            className:                   'docx-preview-body',
            ignoreLastRenderedPageBreak: false,
          });
        }
        return;
      }

      // ─────────────────────── PPTX ────────────────────────────────────────
      if (ext === 'pptx' || ext === 'ppt') {
        const { renderPptx } = await import('@kandiforge/pptx-renderer');
        const ab = await blob.arrayBuffer();
        
        // Create a temporary container for rendering
        const container = document.createElement('div');
        container.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
        document.body.appendChild(container);
        
        try {
          await renderPptx(ab, container, {
            slideWidth: 960,
            slideHeight: 540,
          });
          
          // Extract rendered slides as HTML strings
          const slideElements = container.querySelectorAll('.pptx-slide, [class*="slide"]');
          const slides: string[] = slideElements.length > 0
            ? Array.from(slideElements).map(el => el.outerHTML)
            : [container.innerHTML || '<p>No slides found</p>'];
          
          pptxSlidesRef.current = slides;
          setPreview({ status: 'pptx', slides, active: 0 });
        } finally {
          document.body.removeChild(container);
        }
        return;
      }

      // ─────────────────────── XLSX ────────────────────────────────────────
      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        const XLSX        = await import('xlsx');
        const ab          = await blob.arrayBuffer();
        const workbook    = XLSX.read(ab, { type: 'array' });
        const sheetNames  = workbook.SheetNames;
        const pages       = sheetNames.map(name =>
          XLSX.utils.sheet_to_html(workbook.Sheets[name], { id: xlsxTableId, editable: false }),
        );
        setPreview({ status: 'xlsx', sheets: sheetNames, pages, active: 0 });
        return;
      }

      // ─────────────────────── HTML ────────────────────────────────────────
      if (ext === 'html' || ext === 'htm') {
        const content = await blob.text();
        setPreview({ status: 'html', content });
        return;
      }

      // ─────────────────────── PDF ─────────────────────────────────────────
      if (ext === 'pdf') {
        const blobUrl = URL.createObjectURL(blob);
        setPreview({ status: 'pdf', blobUrl, page: 1, totalPages: 1 });
        return;
      }

      // ─────────────────────── Unsupported ─────────────────────────────────
      setPreview({ status: 'error', message: `In-card preview is not supported for .${ext} files. Use the Download button to open the file.` });
    } catch (err) {
      console.error('Preview error:', err);
      setPreview({ status: 'error', message: err instanceof Error ? err.message : 'Failed to load preview' });
    }
  }, [previewOpen, preview.status, ext, output.download_url, xlsxTableId]);

  // ─── Rendered preview panel ────────────────────────────────────────────────

  const renderPreviewPanel = () => {
    if (!previewOpen) return null;

    const panelBase = 'mt-3 rounded-lg border border-zinc-700/50 overflow-hidden bg-black/20';

    if (preview.status === 'loading') {
      return (
        <div className={`${panelBase} flex items-center justify-center gap-2.5 p-10`}>
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          <span className="text-sm text-zinc-400">Loading preview…</span>
        </div>
      );
    }

    if (preview.status === 'error') {
      return (
        <div className={`${panelBase} p-4 text-sm text-red-400`}>
          {preview.message}
        </div>
      );
    }

    // ── DOCX ──────────────────────────────────────────────────────────────
    if (preview.status === 'docx') {
      return (
        <div className={`${panelBase}`}>
          <style>{`
            .docx-preview-body { padding: 32px 48px; background: #fff; color: #111; font-size: 14px; line-height: 1.7; }
            .docx-preview-body table { border-collapse: collapse; width: 100%; }
            .docx-preview-body td, .docx-preview-body th { border: 1px solid #d1d5db; padding: 6px 10px; }
            .docx-preview-body img { max-width: 100%; }
          `}</style>
          <div
            ref={docxContainerRef}
            className="max-h-[520px] overflow-y-auto"
            style={{ background: '#fff' }}
          />
        </div>
      );
    }

    // ── XLSX ──────────────────────────────────────────────────────────────
    if (preview.status === 'xlsx') {
      return (
        <div className={`${panelBase} flex flex-col`}>
          {/* Sheet tabs */}
          {preview.sheets.length > 1 && (
            <div className="flex gap-1 p-2 border-b border-zinc-700/50 flex-wrap">
              {preview.sheets.map((name, idx) => (
                <button
                  key={name}
                  onClick={() => setPreview({ ...preview, active: idx })}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                    idx === preview.active
                      ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                      : 'text-zinc-400 border border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
          <div
            className="overflow-auto max-h-[480px] p-3"
            style={{ background: '#fff' }}
            dangerouslySetInnerHTML={{ __html: preview.pages[preview.active] ?? '' }}
          />
          <style>{`
            #${xlsxTableId} { border-collapse: collapse; font-size: 12px; width: 100%; }
            #${xlsxTableId} td, #${xlsxTableId} th { border: 1px solid #d1d5db; padding: 4px 8px; color: #111; white-space: nowrap; }
            #${xlsxTableId} tr:first-child td { background: #f3f4f6; font-weight: 600; }
          `}</style>
        </div>
      );
    }

    // ── PPTX ──────────────────────────────────────────────────────────────
    if (preview.status === 'pptx') {
      const total = preview.slides.length;
      return (
        <div className={`${panelBase} flex flex-col`}>
          {/* Slide navigation */}
          {total > 1 && (
            <div className="flex items-center justify-center gap-3 p-2 border-b border-zinc-700/50">
              <button
                onClick={() => setPreview({ ...preview, active: Math.max(0, preview.active - 1) })}
                disabled={preview.active === 0}
                className="p-1 rounded hover:bg-zinc-700 disabled:opacity-30 text-zinc-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-zinc-400 font-medium min-w-[60px] text-center">
                {preview.active + 1} / {total}
              </span>
              <button
                onClick={() => setPreview({ ...preview, active: Math.min(total - 1, preview.active + 1) })}
                disabled={preview.active === total - 1}
                className="p-1 rounded hover:bg-zinc-700 disabled:opacity-30 text-zinc-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          <div
            className="overflow-auto max-h-[480px] flex items-center justify-center p-4"
            style={{ background: '#1a1a1a' }}
            dangerouslySetInnerHTML={{ __html: preview.slides[preview.active] ?? '' }}
          />
        </div>
      );
    }

    // ── HTML ──────────────────────────────────────────────────────────────
    if (preview.status === 'html') {
      return (
        <div className={`${panelBase}`}>
          <iframe
            srcDoc={preview.content}
            sandbox="allow-scripts allow-same-origin"
            className="w-full border-none"
            style={{ height: '520px', background: '#fff' }}
            title={displayFilename}
          />
        </div>
      );
    }

    // ── PDF ───────────────────────────────────────────────────────────────
    if (preview.status === 'pdf') {
      return (
        <div className={`${panelBase}`}>
          <iframe
            src={`${preview.blobUrl}#toolbar=1`}
            className="w-full border-none"
            style={{ height: '560px' }}
            title={displayFilename}
          />
        </div>
      );
    }

    return null;
  };

  // ─── Main render ──────────────────────────────────────────────────────────

  const canPreview = ['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'csv', 'html', 'htm', 'pdf'].includes(ext);

  return (
    <div className={`rounded-xl border ${accentClass} p-4 my-3 backdrop-blur-sm`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-white/5">
            <Icon className={`h-6 w-6 ${iconClass}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">
              {output.title || displayFilename}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {label}
              {output.file_size_kb ? ` • ${output.file_size_kb} KB` : ''}
              {output.slide_count  ? ` • ${output.slide_count} slides` : ''}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Preview toggle — only for supported types */}
          {canPreview && output.download_url && (
            <button
              onClick={handlePreviewToggle}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                previewOpen
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-zinc-800 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {previewOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {previewOpen ? 'Close' : 'Preview'}
            </button>
          )}

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              downloaded
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : downloading
                ? 'bg-zinc-700 text-zinc-400 cursor-wait border border-transparent'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
          >
            {downloaded ? (
              <><CheckCircle className="h-4 w-4" />Downloaded</>
            ) : downloading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Downloading…</>
            ) : (
              <><Download className="h-4 w-4" />Download .{ext}</>
            )}
          </button>
        </div>
      </div>

      {/* Inline preview panel */}
      {renderPreviewPanel()}

      {/* Subtitle */}
      {output.subtitle && !previewOpen && (
        <p className="text-xs text-zinc-500 mt-2 ml-14">{output.subtitle}</p>
      )}

      {/* Content preview (text snippet) */}
      {output.content_preview && !previewOpen && (
        <div className="mt-3 ml-14">
          <details className="group">
            <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors">
              Preview content…
            </summary>
            <div className="mt-2 p-3 rounded-lg bg-black/30 border border-zinc-700/50 max-h-32 overflow-y-auto">
              <p className="text-xs text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">
                {output.content_preview}
              </p>
            </div>
          </details>
        </div>
      )}

      {/* Footer metadata */}
      <div className="flex items-center gap-4 mt-3 ml-14">
        {output.skill_used && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700/50">
            ⚡ {output.skill_used}
          </span>
        )}
        {output.execution_time && (
          <span className="text-[10px] text-zinc-500">
            Generated in {output.execution_time}s
          </span>
        )}
        {output.method && (
          <span className="text-[10px] text-zinc-500">
            via {output.method.replace(/_/g, ' ')}
          </span>
        )}
      </div>
    </div>
  );
}

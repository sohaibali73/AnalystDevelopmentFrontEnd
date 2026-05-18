'use client';

/**
 * PdfReadCard
 * -----------
 * Render target for the `read_pdf` tool. Replaces the old "agent runs
 * execute_python(pdfplumber) and dumps page text into the console panel"
 * UX. Surface, top → bottom:
 *
 *   ┌─ Eyebrow: "PDF · YANG read"  ──  filename · pages · size ───┐
 *   │  doc icon │ {filename}                                       │
 *   │           │ {pages} pages · {size} · {chars} extracted       │
 *   │           │ extractor pill · truncated badge (if any)        │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │  Metadata strip (title / author / producer if present)       │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │  Pages accordion (collapsed by default)                      │
 *   │   ▸ Page 1 · 1,820 chars       ───────  preview snippet      │
 *   │   ▸ Page 2 · 1,710 chars       ───────  preview snippet      │
 *   │   ...                                                        │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │  Footer toolbar: Copy all · Download .txt · Pages: X / Y     │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Card payload shape (see backend core/tools.py read_pdf → genui_card.data):
 *   filename:       string
 *   file_id:        string
 *   size_bytes:     number
 *   total_pages:    number
 *   pages_returned: number
 *   total_chars:    number
 *   truncated:      boolean
 *   extractor:      'pymupdf' | 'pdfplumber'
 *   metadata:       { title?, author?, subject?, creator?, producer? }
 *   page_range:     string | null
 *   page_previews:  Array<{ number, char_count, preview }>
 *   duration_ms:    number
 *   summary:        string
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  FileText, ChevronDown, ChevronRight,
  Copy, Check, Download, BookOpen, User, Sparkles,
  AlertTriangle, ScanLine,
} from 'lucide-react';

// ─── palette (mirrors WorkspaceCards.tsx) ──────────────────────────────────
const RED    = '#ef4444';
const AMBER  = '#d29922';
const INDIGO = '#818cf8';
const ROSE   = '#fb7185';
const SLATE  = 'rgba(255,255,255,0.55)';
const SUBTLE = 'rgba(255,255,255,0.06)';
const PANEL  = '#0d1117';
const SHELL  = '#0a0a0a';

// PDFs get a rose accent — different from any of the language tones.
const PDF_ACCENT = ROSE;

interface PageEntry {
  number:     number;
  char_count: number;
  preview:    string;
}

export interface PdfReadCardPayload {
  filename?:       string;
  file_id?:        string;
  size_bytes?:     number;
  total_pages?:    number;
  pages_returned?: number;
  total_chars?:    number;
  truncated?:      boolean;
  extractor?:      string;
  metadata?: {
    title?:    string;
    author?:   string;
    subject?:  string;
    creator?:  string;
    producer?: string;
  };
  page_range?:     string | null;
  page_previews?:  PageEntry[];
  duration_ms?:    number;
  summary?:        string;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function formatBytes(n: number | null | undefined): string {
  const b = Number(n ?? 0);
  if (!b) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function formatNumber(n: number | null | undefined): string {
  return Number(n ?? 0).toLocaleString();
}

// ─── small UI atoms ─────────────────────────────────────────────────────────

function Chip({
  color, children, icon, title,
}: {
  color: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 10.5, padding: '3px 7px', borderRadius: 5,
        background: `${color}1A`, color, border: `1px solid ${color}33`,
        fontWeight: 600, whiteSpace: 'nowrap',
        fontFamily: "'DM Mono', monospace", letterSpacing: '0.04em',
      }}
    >
      {icon}
      {children}
    </span>
  );
}

// ─── main component ────────────────────────────────────────────────────────

export function PdfReadCard({ payload }: { payload: PdfReadCardPayload }) {
  const filename     = payload.filename || 'document.pdf';
  const totalPages   = payload.total_pages ?? 0;
  const pagesReturned = payload.pages_returned ?? (payload.page_previews?.length ?? 0);
  const totalChars   = payload.total_chars ?? 0;
  const truncated    = !!payload.truncated;
  const metadata     = payload.metadata || {};
  const previews     = payload.page_previews || [];
  const extractor    = payload.extractor || '';
  const pageRange    = payload.page_range;

  const [open, setOpen]       = useState(false);
  const [openPages, setOpenPages] = useState<Set<number>>(new Set());
  const [copied, setCopied]   = useState(false);

  const togglePage = useCallback((n: number) => {
    setOpenPages((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n); else next.add(n);
      return next;
    });
  }, []);

  const fullText = useMemo(
    () => previews.map((p) => `── PAGE ${p.number} ──\n${p.preview}`).join('\n\n'),
    [previews],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {/* */}
  }, [fullText]);

  const handleDownload = useCallback(() => {
    try {
      const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename.replace(/\.pdf$/i, '')}.txt`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {/* */}
  }, [fullText, filename]);

  const hasMetadata =
    !!(metadata.title || metadata.author || metadata.subject ||
       metadata.creator || metadata.producer);

  const subtitleParts: string[] = [];
  if (totalPages) subtitleParts.push(`${pagesReturned} of ${totalPages} pages`);
  if (payload.size_bytes) subtitleParts.push(formatBytes(payload.size_bytes));
  if (totalChars) subtitleParts.push(`${formatNumber(totalChars)} chars`);
  const subtitle = subtitleParts.join(' · ');

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 14,
        overflow: 'hidden',
        border: `1px solid ${PDF_ACCENT}33`,
        maxWidth: 820,
        marginTop: 8,
        backgroundColor: SHELL,
        boxShadow: `0 4px 28px rgba(0,0,0,0.4), 0 0 0 1px ${PDF_ACCENT}08`,
      }}
    >
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          padding: '14px 16px',
          background: `
            radial-gradient(ellipse 80% 140% at 0% 0%, ${PDF_ACCENT}22 0%, transparent 55%),
            linear-gradient(180deg, ${PDF_ACCENT}08 0%, transparent 100%)
          `,
          borderBottom: `1px solid ${SUBTLE}`,
        }}
      >
        <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 14px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 9,
              background: `linear-gradient(135deg, ${PDF_ACCENT}33 0%, ${PDF_ACCENT}14 100%)`,
              border: `1px solid ${PDF_ACCENT}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: PDF_ACCENT, flexShrink: 0,
              boxShadow: `0 4px 12px ${PDF_ACCENT}14`,
            }}
          >
            <FileText size={17} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 1 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: PDF_ACCENT, opacity: 0.9, fontFamily: "'DM Mono', monospace" }}>
                YANG read · PDF
              </span>
              {truncated && (
                <Chip color={AMBER} icon={<AlertTriangle size={10} />} title="Output truncated to 200 KB">truncated</Chip>
              )}
              {pageRange && (
                <Chip color={INDIGO} icon={<BookOpen size={10} />}>pages {pageRange}</Chip>
              )}
            </div>
            <div
              style={{
                fontWeight: 700, fontSize: 15,
                color: 'rgba(255,255,255,0.97)', lineHeight: 1.3,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              }}
              title={filename}
            >
              {filename}
            </div>
            {subtitle && (
              <div style={{ fontSize: 12, color: SLATE, marginTop: 3, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {subtitle}
              </div>
            )}
          </div>
          {extractor && (
            <div style={{ flexShrink: 0 }}>
              <Chip color={SLATE} icon={<ScanLine size={10} />} title={`Extracted via ${extractor}`}>
                {extractor}
              </Chip>
            </div>
          )}
        </div>
      </div>

      {/* ── Metadata strip (only when the PDF carried any) ────────────────── */}
      {hasMetadata && (
        <div
          style={{
            display: 'flex', flexWrap: 'wrap', gap: 12,
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.015)',
            borderBottom: `1px solid ${SUBTLE}`,
            fontSize: 11.5,
            fontFamily: "'Inter', -apple-system, sans-serif",
          }}
        >
          {metadata.title && (
            <span style={{ color: 'rgba(255,255,255,0.78)' }}>
              <span style={{ color: SLATE, marginRight: 5 }}>Title:</span>
              {metadata.title}
            </span>
          )}
          {metadata.author && (
            <span style={{ color: 'rgba(255,255,255,0.78)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <User size={11} color={SLATE} />
              {metadata.author}
            </span>
          )}
          {metadata.subject && (
            <span style={{ color: 'rgba(255,255,255,0.78)' }}>
              <span style={{ color: SLATE, marginRight: 5 }}>Subject:</span>
              {metadata.subject}
            </span>
          )}
          {metadata.producer && !metadata.author && (
            <span style={{ color: SLATE, fontSize: 11 }}>
              produced by {metadata.producer}
            </span>
          )}
        </div>
      )}

      {/* ── Pages accordion ──────────────────────────────────────────────── */}
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: open ? `1px solid ${SUBTLE}` : 'none',
            color: 'rgba(255,255,255,0.78)',
            fontSize: 12, fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.06em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          <span style={{ flex: 1, textAlign: 'left' }}>
            {previews.length} page{previews.length === 1 ? '' : 's'} · previews
          </span>
          <span style={{ color: SLATE, fontSize: 10 }}>
            {open ? 'collapse' : 'expand'}
          </span>
        </button>

        {open && (
          <div style={{ background: PANEL, padding: '8px 6px', maxHeight: 460, overflowY: 'auto' }}>
            {previews.length === 0 ? (
              <div style={{ padding: '24px 16px', color: SLATE, fontSize: 12, textAlign: 'center' }}>
                No page previews available.
              </div>
            ) : (
              previews.map((p) => {
                const isOpen = openPages.has(p.number);
                return (
                  <div
                    key={p.number}
                    style={{
                      margin: '4px 8px',
                      borderRadius: 7,
                      border: `1px solid ${SUBTLE}`,
                      overflow: 'hidden',
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => togglePage(p.number)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 12px',
                        background: 'transparent', border: 'none',
                        color: 'rgba(255,255,255,0.85)',
                        fontSize: 12,
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      {isOpen ? <ChevronDown size={12} color={PDF_ACCENT} /> : <ChevronRight size={12} color={SLATE} />}
                      <span style={{ flex: 1 }}>
                        Page {p.number}
                      </span>
                      <span style={{ color: SLATE, fontSize: 10.5 }}>
                        {formatNumber(p.char_count)} chars
                      </span>
                    </button>
                    {isOpen && (
                      <pre
                        style={{
                          margin: 0,
                          padding: '0 14px 12px 30px',
                          color: 'rgba(255,255,255,0.85)',
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: 12,
                          lineHeight: 1.55,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {p.preview || <span style={{ color: SLATE, fontStyle: 'italic' }}>(empty page)</span>}
                      </pre>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── Footer toolbar ───────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px',
          borderTop: `1px solid ${SUBTLE}`,
          background: 'rgba(255,255,255,0.015)',
        }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, color: SLATE, fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
          {payload.summary ? (
            <span style={{ color: 'rgba(255,255,255,0.72)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={payload.summary}>
              <Sparkles size={11} style={{ verticalAlign: '-1.5px', marginRight: 6, color: PDF_ACCENT }} />
              {payload.summary}
            </span>
          ) : (
            <span>read in {(payload.duration_ms ?? 0).toLocaleString()} ms</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy all page text"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 9px',
            background: copied ? `${PDF_ACCENT}1A` : 'rgba(255,255,255,0.03)',
            border: `1px solid ${copied ? PDF_ACCENT + '55' : SUBTLE}`,
            borderRadius: 6,
            color: copied ? PDF_ACCENT : 'rgba(255,255,255,0.78)',
            fontSize: 11, fontFamily: "'DM Mono', monospace",
            cursor: 'pointer',
          }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? 'copied' : 'copy'}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          title="Download extracted text as .txt"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 9px',
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${SUBTLE}`,
            borderRadius: 6,
            color: 'rgba(255,255,255,0.78)',
            fontSize: 11, fontFamily: "'DM Mono', monospace",
            cursor: 'pointer',
          }}
        >
          <Download size={11} />
          .txt
        </button>
      </div>
    </div>
  );
}

export default PdfReadCard;

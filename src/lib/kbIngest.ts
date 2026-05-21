'use client';

/**
 * KB ingest helpers — parse files in the browser into plain text, hash the
 * bytes locally, then ship only the text to /brain/upload-preparsed.
 *
 * Mirrors the local kb_uploader_gui.py flow (parse → hash → POST JSON) so
 * uploads never trigger server-side parsing and can't get stuck in
 * "processing" because of a slow extractor on the backend.
 *
 * Re-uses the parser libs already pulled in by filePreview.ts — no new deps.
 */

// ─── File-extension → MIME ───────────────────────────────────────────────────

const MIME: Record<string, string> = {
  pdf:  'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc:  'application/msword',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls:  'application/vnd.ms-excel',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppt:  'application/vnd.ms-powerpoint',
  csv:  'text/csv',
  txt:  'text/plain',
  md:   'text/markdown',
  html: 'text/html',
  htm:  'text/html',
  json: 'application/json',
  xml:  'application/xml',
  rtf:  'application/rtf',
};

export const KB_INGEST_EXTS = Object.keys(MIME);

function extOf(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function mimeFor(filename: string): string {
  return MIME[extOf(filename)] || 'application/octet-stream';
}

export function isParseableForKB(filename: string): boolean {
  return KB_INGEST_EXTS.includes(extOf(filename));
}

// ─── SHA-256 of a Blob (Web Crypto) ──────────────────────────────────────────

export async function sha256OfBlob(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(digest);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

// ─── Text extractors ─────────────────────────────────────────────────────────

async function extractPdf(blob: Blob): Promise<{ text: string; pages: number }> {
  const pdfjsLib: any = await import('pdfjs-dist');

  const majorVersion = parseInt(pdfjsLib.version.split('.')[0], 10);
  if (majorVersion >= 4) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  } else {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }

  const buf = await blob.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pageCount = pdf.numPages;
  const parts: string[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const text = tc.items.map((it: any) => it.str).join(' ');
    parts.push(`--- Page ${i} ---\n${text}`);
  }

  return { text: parts.join('\n\n'), pages: pageCount };
}

async function extractDocx(blob: Blob): Promise<{ text: string }> {
  const { renderAsync } = await import('docx-preview');
  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:800px;';
  document.body.appendChild(container);
  try {
    await renderAsync(blob, container, undefined, {
      className: 'docx-text-only',
      ignoreLastRenderedPageBreak: false,
    });
    const text = (container.textContent || '').replace(/ /g, ' ').trim();
    return { text };
  } finally {
    try { document.body.removeChild(container); } catch { /* ignore */ }
  }
}

async function extractXlsx(blob: Blob): Promise<{ text: string }> {
  const XLSX: any = await import('xlsx');
  const buf = await blob.arrayBuffer();
  const workbook = XLSX.read(buf, { type: 'array' });
  const parts: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
    if (!rows.length) continue;
    parts.push(`--- Sheet: ${sheetName} ---`);
    for (const row of rows) {
      if (!row || row.length === 0) continue;
      parts.push(row.map((c) => (c == null ? '' : String(c))).join('\t'));
    }
  }
  return { text: parts.join('\n').trim() };
}

async function extractCsv(blob: Blob): Promise<{ text: string }> {
  // CSV is already plain text — just hand it through.
  const text = await blob.text();
  return { text };
}

async function extractPlainText(blob: Blob): Promise<{ text: string }> {
  return { text: await blob.text() };
}

async function extractHtml(blob: Blob): Promise<{ text: string }> {
  const raw = await blob.text();
  // Strip tags but keep block-level whitespace so the result reads naturally.
  const container = document.createElement('div');
  container.innerHTML = raw;
  // Replace block elements with newlines for readability
  container.querySelectorAll('br').forEach((b) => b.replaceWith('\n'));
  container.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6').forEach((el) => {
    el.append('\n');
  });
  const text = (container.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
  return { text };
}

async function extractJson(blob: Blob): Promise<{ text: string }> {
  const raw = await blob.text();
  try {
    return { text: JSON.stringify(JSON.parse(raw), null, 2) };
  } catch {
    return { text: raw };
  }
}

async function extractPptx(blob: Blob): Promise<{ text: string; pages?: number }> {
  try {
    const { parsePptx } = await import('@/lib/pptx-parser');
    const pres: any = await parsePptx(blob);
    const out: string[] = [];
    (pres.slides as any[]).forEach((slide, i) => {
      out.push(`--- Slide ${i + 1} ---`);
      (slide.elements as any[]).forEach((el) => {
        if (el.type === 'textbox' || (el.type === 'shape' && el.paragraphs)) {
          const paras = el.type === 'textbox' ? el.paragraphs : (el.paragraphs || []);
          (paras as any[]).forEach((p) => {
            (p.runs as any[]).forEach((r) => { out.push(r.text); });
          });
        }
        if (el.type === 'table') {
          (el.rows as any[]).forEach((row) => {
            (row.cells as any[]).forEach((cell) => {
              (cell.text as any[]).forEach((p) => {
                (p.runs as any[]).forEach((r) => { out.push(r.text); });
              });
            });
          });
        }
      });
    });
    return { text: out.join('\n').trim(), pages: pres.slides.length };
  } catch (e) {
    console.warn('pptx text extraction failed:', e);
    return { text: '' };
  }
}

// ─── Public entry point ──────────────────────────────────────────────────────

export interface ExtractedText {
  text: string;
  charCount: number;
  pages?: number;
}

export async function extractTextForKB(blob: Blob, filename: string): Promise<ExtractedText> {
  const ext = extOf(filename);
  let result: { text: string; pages?: number };

  switch (ext) {
    case 'pdf':  result = await extractPdf(blob); break;
    case 'docx':
    case 'doc':  result = await extractDocx(blob); break;
    case 'xlsx':
    case 'xls':  result = await extractXlsx(blob); break;
    case 'csv':  result = await extractCsv(blob); break;
    case 'txt':
    case 'md':
    case 'rtf':  result = await extractPlainText(blob); break;
    case 'html':
    case 'htm':  result = await extractHtml(blob); break;
    case 'xml':  result = await extractPlainText(blob); break;
    case 'json': result = await extractJson(blob); break;
    case 'pptx':
    case 'ppt':  result = await extractPptx(blob); break;
    default:
      // Last-ditch: try as text. If it's binary garbage we'll get nonsense
      // and the upload code can detect "empty after trim".
      result = await extractPlainText(blob).catch(() => ({ text: '' }));
  }

  const text = (result.text || '').replace(/\x00/g, '').trim();
  return { text, charCount: text.length, pages: result.pages };
}

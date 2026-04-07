'use client';

/**
 * FilePreviewService
 * 
 * Client-side document parsing for previewing files in the browser.
 * Supports: PDF, DOCX/DOC, CSV, XLSX/XLS, TXT, MD, JSON, HTML
 * 
 * Libraries used:
 *   - DOCX: docx-preview
 *   - XLSX: SheetJS (xlsx)
 *   - PDF: pdfjs-dist
 *   - CSV: PapaParse
 * 
 * Note: PPTX preview is handled by UI components using PPTXjs CDN.
 * 
 * No server changes required — all parsing happens in-browser.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ParsedDocument {
  type: 'html' | 'text' | 'table' | 'json' | 'unsupported';
  content: string;
  tables?: ParsedTable[];
  metadata?: {
    pages?: number;
    wordCount?: number;
    charCount?: number;
    lineCount?: number;
  };
}

export interface ParsedTable {
  headers: string[];
  rows: string[][];
  name?: string;
}

// ─── Extension helpers ───────────────────────────────────────────────────────

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isSupportedForPreview(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['pdf', 'docx', 'doc', 'csv', 'xlsx', 'xls', 'pptx', 'ppt', 'txt', 'md', 'json', 'html', 'htm', 'xml'].includes(ext);
}

// ─── Blob/URL helpers ────────────────────────────────────────────────────────

export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

export async function blobToText(blob: Blob): Promise<string> {
  return blob.text();
}

// ─── PDF Parser (pdf.js) ────────────────────────────────────────────────────

export async function parsePdf(blob: Blob): Promise<ParsedDocument> {
  const pdfjsLib = await import('pdfjs-dist');
  
  // pdfjs-dist v4+ uses .mjs worker files; v3 and below used .js
  // Use unpkg CDN which reliably hosts the correct format for every version.
  const majorVersion = parseInt(pdfjsLib.version.split('.')[0], 10);
  if (majorVersion >= 4) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  } else {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
  
  const arrayBuffer = await blobToArrayBuffer(blob);
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageCount = pdf.numPages;
  
  const pageTexts: string[] = [];
  
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    pageTexts.push(`--- Page ${i} ---\n${pageText}`);
  }
  
  const fullText = pageTexts.join('\n\n');
  const wordCount = fullText.split(/\s+/).filter(w => w.length > 0).length;
  
  return {
    type: 'text',
    content: fullText,
    metadata: {
      pages: pageCount,
      wordCount,
      charCount: fullText.length,
      lineCount: fullText.split('\n').length,
    },
  };
}

// ─── DOCX Parser (docx-preview) ─────────────────────────────────────────────

export async function parseDocx(blob: Blob): Promise<ParsedDocument> {
  // docx-preview renders directly into a DOM element, so we create a temporary container
  // and extract the HTML for preview
  const { renderAsync } = await import('docx-preview');
  
  // Create a temporary container
  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
  document.body.appendChild(container);
  
  try {
    await renderAsync(blob, container, undefined, {
      className: 'docx-preview-body',
      ignoreLastRenderedPageBreak: false,
    });
    
    const html = container.innerHTML;
    
    // Extract text for metadata
    const text = container.textContent || '';
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    
    return {
      type: 'html',
      content: html,
      metadata: {
        wordCount,
        charCount: text.length,
        lineCount: text.split('\n').length,
      },
    };
  } finally {
    document.body.removeChild(container);
  }
}

// ─── CSV Parser (PapaParse) ─────────────────────────────────────────────────

export async function parseCsv(blob: Blob): Promise<ParsedDocument> {
  const Papa = (await import('papaparse')).default;
  const text = await blobToText(blob);
  
  const result = Papa.parse(text, {
    header: false,
    skipEmptyLines: true,
  });
  
  const data = result.data as string[][];
  if (data.length === 0) {
    return { type: 'text', content: 'Empty CSV file' };
  }
  
  const headers = data[0] || [];
  const rows = data.slice(1);
  
  return {
    type: 'table',
    content: text,
    tables: [{
      headers,
      rows,
    }],
    metadata: {
      lineCount: data.length,
      charCount: text.length,
    },
  };
}

// ─── Excel Parser (SheetJS) ─────────────────────────────────────────────────

export async function parseExcel(blob: Blob): Promise<ParsedDocument> {
  const XLSX = await import('xlsx');
  const arrayBuffer = await blobToArrayBuffer(blob);
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  
  const tables: ParsedTable[] = [];
  let allText = '';
  
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
    
    if (data.length > 0) {
      const headers = (data[0] || []).map(String);
      const rows = data.slice(1).map(row => (row || []).map(String));
      
      tables.push({
        headers,
        rows,
        name: sheetName,
      });
      
      allText += `\n--- Sheet: ${sheetName} ---\n`;
      allText += headers.join(', ') + '\n';
      for (const row of rows.slice(0, 100)) {
        allText += row.join(', ') + '\n';
      }
    }
  }
  
  return {
    type: 'table',
    content: allText.trim(),
    tables,
    metadata: {
      lineCount: tables.reduce((sum, t) => sum + t.rows.length + 1, 0),
      charCount: allText.length,
    },
  };
}

// ─── Text Parser ────────────────────────────────────────────────────────────

export async function parseText(blob: Blob): Promise<ParsedDocument> {
  const text = await blobToText(blob);
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  
  return {
    type: 'text',
    content: text,
    metadata: {
      wordCount,
      charCount: text.length,
      lineCount: text.split('\n').length,
    },
  };
}

// ─── JSON Parser ────────────────────────────────────────────────────────────

export async function parseJson(blob: Blob): Promise<ParsedDocument> {
  const text = await blobToText(blob);
  
  try {
    const parsed = JSON.parse(text);
    const formatted = JSON.stringify(parsed, null, 2);
    
    return {
      type: 'json',
      content: formatted,
      metadata: {
        charCount: formatted.length,
        lineCount: formatted.split('\n').length,
      },
    };
  } catch {
    return {
      type: 'text',
      content: text,
      metadata: {
        charCount: text.length,
        lineCount: text.split('\n').length,
      },
    };
  }
}

// ─── PPTX Parser (not supported in browser - returns placeholder) ───────────
// PPTX parsing requires server-side processing or CDN scripts loaded at runtime.
// Use ChatFilePreviewModal or DocumentDownloadCard for PPTX preview which use PPTXjs CDN.

export async function parsePptx(_blob: Blob): Promise<ParsedDocument> {
  // PPTX parsing is handled by the UI components using PPTXjs CDN
  // This function returns a placeholder - use the preview components instead
  return {
    type: 'html',
    content: '<div style="padding:40px;text-align:center;color:#666;"><p>PPTX preview is available in the document viewer</p></div>',
    metadata: {
      pages: 0,
      wordCount: 0,
      charCount: 0,
    },
  };
}

// ─── HTML Parser ────────────────────────────────────────────────────────────

export async function parseHtml(blob: Blob): Promise<ParsedDocument> {
  const html = await blobToText(blob);
  
  return {
    type: 'html',
    content: html,
    metadata: {
      charCount: html.length,
      lineCount: html.split('\n').length,
    },
  };
}

// ─── Main entry point ───────────────────────────────────────────────────────

/**
 * Parse a file blob for preview. Returns a ParsedDocument with type and content.
 */
export async function parseFileForPreview(
  blob: Blob,
  filename: string
): Promise<ParsedDocument> {
  const ext = getFileExtension(filename);
  
  try {
    switch (ext) {
      case 'pdf':
        return await parsePdf(blob);
      case 'docx':
      case 'doc':
        return await parseDocx(blob);
      case 'csv':
        return await parseCsv(blob);
      case 'xlsx':
      case 'xls':
        return await parseExcel(blob);
      case 'pptx':
      case 'ppt':
        return await parsePptx(blob);
      case 'txt':
      case 'md':
        return await parseText(blob);
      case 'json':
        return await parseJson(blob);
      case 'html':
      case 'htm':
        return await parseHtml(blob);
      case 'xml':
        return await parseText(blob);
      default:
        return {
          type: 'unsupported',
          content: `Preview is not available for .${ext} files.`,
        };
    }
  } catch (error) {
    console.error(`Failed to parse ${filename}:`, error);
    return {
      type: 'unsupported',
      content: `Failed to parse ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export default parseFileForPreview;

/**
 * PPTX Parser — Client-Side PowerPoint File Parser
 * 
 * Based on BrowserPPTX documentation. Parses .pptx files (Office Open XML)
 * entirely in the browser using JSZip for extraction and DOMParser for XML.
 * 
 * Supports:
 * - Text boxes and styled runs (fonts, sizes, colors, bold/italic/underline)
 * - Shapes (rectangles, ellipses, rounded rects, triangles, etc.)
 * - Images (PNG, JPEG, GIF, SVG) with cropping
 * - Tables with cell merging
 * - Groups with nested elements
 * - Gradients and solid fills
 * - Shadows and rotation
 * - Theme colors and fonts
 */

import JSZip from 'jszip';

// ─── EMU (English Metric Units) Conversion ──────────────────────────────────
// PowerPoint uses EMU for all measurements: 914400 EMU = 1 inch

const EMU_PER_PX = 9525; // at 96 DPI

export function emuToPx(emu: number): number {
  return emu / EMU_PER_PX;
}

export function emuToPt(emu: number): number {
  return emu / 12700;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PptxPresentation {
  slideWidth: number;  // EMU
  slideHeight: number; // EMU
  slides: PptxSlide[];
  images: Map<string, string>; // path -> blob URL
  theme?: PptxTheme;
}

export interface PptxTheme {
  colors: Record<string, string>;
  majorFont?: string;
  minorFont?: string;
}

export interface PptxSlide {
  index: number;
  background?: PptxBackground;
  layoutBackground?: PptxBackground;
  masterBackground?: PptxBackground;
  elements: PptxElement[];
}

export interface PptxBackground {
  type: 'solid' | 'gradient' | 'image';
  color?: string;
  gradient?: PptxGradient;
  imageUrl?: string;
}

export interface PptxGradient {
  type: 'linear' | 'radial';
  angle?: number;
  stops: { position: number; color: string }[];
}

// Base element with position info
export interface PptxBaseElement {
  x: number; // EMU
  y: number; // EMU
  w: number; // EMU
  h: number; // EMU
  rotation?: number; // degrees
  flipH?: boolean;
  flipV?: boolean;
}

// Discriminated union for all element types
export type PptxElement =
  | PptxTextBox
  | PptxShape
  | PptxImage
  | PptxTable
  | PptxGroup;

export interface PptxTextBox extends PptxBaseElement {
  type: 'textbox';
  paragraphs: PptxParagraph[];
  fill?: string;
  stroke?: PptxStroke;
  shadow?: PptxShadow;
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

export interface PptxShape extends PptxBaseElement {
  type: 'shape';
  shapeType: string; // rect, ellipse, roundRect, triangle, etc.
  fill?: string;
  gradientFill?: PptxGradient;
  stroke?: PptxStroke;
  shadow?: PptxShadow;
  paragraphs?: PptxParagraph[]; // shapes can contain text
}

export interface PptxImage extends PptxBaseElement {
  type: 'image';
  src: string; // blob URL
  cropRect?: { left: number; top: number; right: number; bottom: number }; // percentages
}

export interface PptxTable extends PptxBaseElement {
  type: 'table';
  rows: PptxTableRow[];
  colWidths: number[]; // EMU
}

export interface PptxTableRow {
  height: number; // EMU
  cells: PptxTableCell[];
}

export interface PptxTableCell {
  text: PptxParagraph[];
  colSpan?: number;
  rowSpan?: number;
  fill?: string;
  borderTop?: PptxStroke;
  borderBottom?: PptxStroke;
  borderLeft?: PptxStroke;
  borderRight?: PptxStroke;
}

export interface PptxGroup extends PptxBaseElement {
  type: 'group';
  children: PptxElement[];
  chOff?: { x: number; y: number }; // child offset
  chExt?: { cx: number; cy: number }; // child extent
}

export interface PptxParagraph {
  alignment?: 'left' | 'center' | 'right' | 'justify';
  bulletType?: 'none' | 'bullet' | 'number';
  bulletChar?: string;
  indent?: number;
  level?: number;
  runs: PptxRun[];
  lineSpacing?: number;
  spaceBefore?: number;
  spaceAfter?: number;
}

export interface PptxRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: number; // points
  fontFamily?: string;
  color?: string;
  highlight?: string;
  superscript?: boolean;
  subscript?: boolean;
  hyperlink?: string;
}

export interface PptxStroke {
  color?: string;
  width?: number; // EMU
  dashStyle?: string;
}

export interface PptxShadow {
  color?: string;
  blur?: number;
  distance?: number;
  direction?: number;
}

// ─── XML Namespaces ─────────────────────────────────────────────────────────

const NS = {
  a: 'http://schemas.openxmlformats.org/drawingml/2006/main',
  p: 'http://schemas.openxmlformats.org/presentationml/2006/main',
  r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
};

// ─── Parser Class ───────────────────────────────────────────────────────────

export async function parsePptx(
  file: File | Blob,
  onProgress?: (message: string, percent: number) => void
): Promise<PptxPresentation> {
  onProgress?.('Unzipping PPTX file...', 5);
  
  // Stage 1: Unzip
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  
  // Stage 2: Extract images
  onProgress?.('Extracting images...', 10);
  const images = await extractImages(zip);
  
  // Stage 3: Parse theme
  onProgress?.('Parsing theme...', 15);
  const theme = await parseTheme(zip);
  
  // Stage 4: Parse presentation metadata
  onProgress?.('Parsing presentation...', 20);
  const presentationXml = await zip.file('ppt/presentation.xml')?.async('text');
  if (!presentationXml) {
    throw new Error('Invalid PPTX: missing presentation.xml');
  }
  
  const parser = new DOMParser();
  const presDoc = parser.parseFromString(presentationXml, 'application/xml');
  
  // Get slide dimensions
  const sldSz = presDoc.getElementsByTagName('p:sldSz')[0];
  const slideWidth = parseInt(sldSz?.getAttribute('cx') || '9144000', 10);
  const slideHeight = parseInt(sldSz?.getAttribute('cy') || '6858000', 10);
  
  // Get slide IDs and ordering
  const slideIdList = presDoc.getElementsByTagName('p:sldId');
  const slideRels = await parseRelationships(zip, 'ppt/_rels/presentation.xml.rels');
  
  // Stage 5: Parse slides
  const slides: PptxSlide[] = [];
  const totalSlides = slideIdList.length;
  
  for (let i = 0; i < totalSlides; i++) {
    const slideId = slideIdList[i];
    const rId = slideId.getAttribute('r:id');
    const slidePath = slideRels.get(rId || '');
    
    if (slidePath) {
      const percent = 25 + Math.round((i / totalSlides) * 65);
      onProgress?.(`Rendering slide ${i + 1} of ${totalSlides}...`, percent);
      
      const slide = await parseSlide(zip, slidePath, i, images, theme);
      slides.push(slide);
    }
  }
  
  onProgress?.('Complete!', 100);
  
  return {
    slideWidth,
    slideHeight,
    slides,
    images,
    theme,
  };
}

// ─── Image Extraction ───────────────────────────────────────────────────────

async function extractImages(zip: JSZip): Promise<Map<string, string>> {
  const images = new Map<string, string>();
  
  const mediaFolder = zip.folder('ppt/media');
  if (!mediaFolder) return images;
  
  const mediaFiles: string[] = [];
  mediaFolder.forEach((relativePath) => {
    mediaFiles.push(`ppt/media/${relativePath}`);
  });
  
  for (const path of mediaFiles) {
    const file = zip.file(path);
    if (file) {
      const blob = await file.async('blob');
      const blobUrl = URL.createObjectURL(blob);
      images.set(path, blobUrl);
    }
  }
  
  return images;
}

// ─── Theme Parsing ──────────────────────────────────────────────────────────

async function parseTheme(zip: JSZip): Promise<PptxTheme | undefined> {
  const themeXml = await zip.file('ppt/theme/theme1.xml')?.async('text');
  if (!themeXml) return undefined;
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(themeXml, 'application/xml');
  
  const colors: Record<string, string> = {};
  
  // Parse color scheme
  const clrScheme = doc.getElementsByTagName('a:clrScheme')[0];
  if (clrScheme) {
    const colorTypes = ['dk1', 'dk2', 'lt1', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink'];
    
    for (const colorType of colorTypes) {
      const element = clrScheme.getElementsByTagName(`a:${colorType}`)[0];
      if (element) {
        // Try srgbClr first
        const srgbClr = element.getElementsByTagName('a:srgbClr')[0];
        if (srgbClr) {
          colors[colorType] = srgbClr.getAttribute('val') || '';
          continue;
        }
        // Try sysClr
        const sysClr = element.getElementsByTagName('a:sysClr')[0];
        if (sysClr) {
          colors[colorType] = sysClr.getAttribute('lastClr') || '';
        }
      }
    }
  }
  
  // Parse fonts
  let majorFont: string | undefined;
  let minorFont: string | undefined;
  
  const fontScheme = doc.getElementsByTagName('a:fontScheme')[0];
  if (fontScheme) {
    const majorLatin = fontScheme.querySelector('a\\:majorFont a\\:latin, majorFont latin');
    const minorLatin = fontScheme.querySelector('a\\:minorFont a\\:latin, minorFont latin');
    majorFont = majorLatin?.getAttribute('typeface') || undefined;
    minorFont = minorLatin?.getAttribute('typeface') || undefined;
  }
  
  return { colors, majorFont, minorFont };
}

// ─── Relationships Parsing ──────────────────────────────────────────────────

async function parseRelationships(zip: JSZip, path: string): Promise<Map<string, string>> {
  const rels = new Map<string, string>();
  
  const relsXml = await zip.file(path)?.async('text');
  if (!relsXml) return rels;
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(relsXml, 'application/xml');
  
  const relationships = doc.getElementsByTagName('Relationship');
  for (let i = 0; i < relationships.length; i++) {
    const rel = relationships[i];
    const id = rel.getAttribute('Id');
    let target = rel.getAttribute('Target');
    
    if (id && target) {
      // Resolve relative paths
      if (target.startsWith('../')) {
        target = 'ppt/' + target.substring(3);
      } else if (!target.startsWith('ppt/')) {
        target = 'ppt/' + target;
      }
      rels.set(id, target);
    }
  }
  
  return rels;
}

// ─── Slide Parsing ──────────────────────────────────────────────────────────

async function parseSlide(
  zip: JSZip,
  slidePath: string,
  index: number,
  images: Map<string, string>,
  theme?: PptxTheme
): Promise<PptxSlide> {
  const slideXml = await zip.file(slidePath)?.async('text');
  if (!slideXml) {
    return { index, elements: [] };
  }
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(slideXml, 'application/xml');
  
  // Parse slide relationships
  const slideDir = slidePath.substring(0, slidePath.lastIndexOf('/'));
  const slideFileName = slidePath.substring(slidePath.lastIndexOf('/') + 1);
  const relsPath = `${slideDir}/_rels/${slideFileName}.rels`;
  const slideRels = await parseRelationships(zip, relsPath);
  
  // Parse background
  const bgPr = doc.getElementsByTagName('p:bg')[0];
  const background = bgPr ? parseBackground(bgPr, theme) : undefined;
  
  // Parse shape tree
  const spTree = doc.getElementsByTagName('p:spTree')[0];
  const elements: PptxElement[] = [];
  
  if (spTree) {
    for (let i = 0; i < spTree.children.length; i++) {
      const child = spTree.children[i];
      const element = parseElement(child, slideRels, images, theme);
      if (element) {
        elements.push(element);
      }
    }
  }
  
  return {
    index,
    background,
    elements,
  };
}

// ─── Background Parsing ─────────────────────────────────────────────────────

function parseBackground(bgElement: Element, theme?: PptxTheme): PptxBackground | undefined {
  const bgPr = bgElement.getElementsByTagName('p:bgPr')[0];
  if (!bgPr) return undefined;
  
  // Solid fill
  const solidFill = bgPr.getElementsByTagName('a:solidFill')[0];
  if (solidFill) {
    const color = parseColor(solidFill, theme);
    if (color) {
      return { type: 'solid', color };
    }
  }
  
  // Gradient fill
  const gradFill = bgPr.getElementsByTagName('a:gradFill')[0];
  if (gradFill) {
    const gradient = parseGradient(gradFill, theme);
    if (gradient) {
      return { type: 'gradient', gradient };
    }
  }
  
  return undefined;
}

// ─── Element Parsing ────────────────────────────────────────────────────────

function parseElement(
  element: Element,
  slideRels: Map<string, string>,
  images: Map<string, string>,
  theme?: PptxTheme
): PptxElement | null {
  const tagName = element.tagName;
  
  switch (tagName) {
    case 'p:sp':
      return parseShape(element, theme);
    case 'p:pic':
      return parsePicture(element, slideRels, images);
    case 'p:graphicFrame':
      return parseGraphicFrame(element, theme);
    case 'p:grpSp':
      return parseGroup(element, slideRels, images, theme);
    case 'p:cxnSp':
      return parseConnector(element, theme);
    default:
      return null;
  }
}

// ─── Position Parsing ───────────────────────────────────────────────────────

function parsePosition(element: Element): PptxBaseElement {
  const xfrm = element.getElementsByTagName('a:xfrm')[0] ||
               element.getElementsByTagName('p:xfrm')[0];
  
  const off = xfrm?.getElementsByTagName('a:off')[0];
  const ext = xfrm?.getElementsByTagName('a:ext')[0];
  
  const x = parseInt(off?.getAttribute('x') || '0', 10);
  const y = parseInt(off?.getAttribute('y') || '0', 10);
  const w = parseInt(ext?.getAttribute('cx') || '0', 10);
  const h = parseInt(ext?.getAttribute('cy') || '0', 10);
  
  // Rotation (in 60,000ths of a degree)
  const rotAttr = xfrm?.getAttribute('rot');
  const rotation = rotAttr ? parseInt(rotAttr, 10) / 60000 : undefined;
  
  const flipH = xfrm?.getAttribute('flipH') === '1';
  const flipV = xfrm?.getAttribute('flipV') === '1';
  
  return { x, y, w, h, rotation, flipH: flipH || undefined, flipV: flipV || undefined };
}

// ─── Shape Parsing ──────────────────────────────────────────────────────────

function parseShape(element: Element, theme?: PptxTheme): PptxTextBox | PptxShape | null {
  const pos = parsePosition(element);
  
  // Get shape properties
  const spPr = element.getElementsByTagName('a:spPr')[0];
  const prstGeom = spPr?.getElementsByTagName('a:prstGeom')[0];
  const shapeType = prstGeom?.getAttribute('prst') || 'rect';
  
  // Parse fill
  const fill = parseFill(spPr, theme);
  const gradientFill = parseGradient(spPr?.getElementsByTagName('a:gradFill')[0], theme);
  
  // Parse stroke
  const stroke = parseStroke(spPr, theme);
  
  // Parse shadow
  const shadow = parseShadow(spPr);
  
  // Parse text body
  const txBody = element.getElementsByTagName('p:txBody')[0];
  const paragraphs = txBody ? parseParagraphs(txBody, theme) : [];
  
  // If it has text content, treat as textbox
  if (paragraphs.length > 0 && paragraphs.some(p => p.runs.some(r => r.text.trim()))) {
    // Parse vertical alignment
    const bodyPr = txBody?.getElementsByTagName('a:bodyPr')[0];
    const anchor = bodyPr?.getAttribute('anchor');
    const verticalAlign = anchor === 'ctr' ? 'middle' : anchor === 'b' ? 'bottom' : 'top';
    
    return {
      type: 'textbox',
      ...pos,
      paragraphs,
      fill,
      stroke,
      shadow,
      verticalAlign,
    };
  }
  
  // Otherwise it's a shape
  return {
    type: 'shape',
    ...pos,
    shapeType,
    fill,
    gradientFill,
    stroke,
    shadow,
    paragraphs: paragraphs.length > 0 ? paragraphs : undefined,
  };
}

// ─── Picture Parsing ────────────────────────────────────────────────────────

function parsePicture(
  element: Element,
  slideRels: Map<string, string>,
  images: Map<string, string>
): PptxImage | null {
  const pos = parsePosition(element);
  
  // Get image reference
  const blipFill = element.getElementsByTagName('p:blipFill')[0];
  const blip = blipFill?.getElementsByTagName('a:blip')[0];
  const embedId = blip?.getAttribute('r:embed');
  
  if (!embedId) return null;
  
  // Resolve image path
  const imagePath = slideRels.get(embedId);
  if (!imagePath) return null;
  
  const src = images.get(imagePath);
  if (!src) return null;
  
  // Parse crop rectangle
  const srcRect = blipFill?.getElementsByTagName('a:srcRect')[0];
  let cropRect: PptxImage['cropRect'];
  
  if (srcRect) {
    const l = parseInt(srcRect.getAttribute('l') || '0', 10) / 1000;
    const t = parseInt(srcRect.getAttribute('t') || '0', 10) / 1000;
    const r = parseInt(srcRect.getAttribute('r') || '0', 10) / 1000;
    const b = parseInt(srcRect.getAttribute('b') || '0', 10) / 1000;
    
    if (l || t || r || b) {
      cropRect = { left: l, top: t, right: r, bottom: b };
    }
  }
  
  return {
    type: 'image',
    ...pos,
    src,
    cropRect,
  };
}

// ─── Table Parsing ──────────────────────────────────────────────────────────

function parseGraphicFrame(element: Element, theme?: PptxTheme): PptxTable | null {
  const pos = parsePosition(element);
  
  const tbl = element.getElementsByTagName('a:tbl')[0];
  if (!tbl) return null;
  
  // Parse column widths
  const tblGrid = tbl.getElementsByTagName('a:tblGrid')[0];
  const gridCols = tblGrid?.getElementsByTagName('a:gridCol');
  const colWidths: number[] = [];
  
  if (gridCols) {
    for (let i = 0; i < gridCols.length; i++) {
      const w = parseInt(gridCols[i].getAttribute('w') || '0', 10);
      colWidths.push(w);
    }
  }
  
  // Parse rows
  const trElements = tbl.getElementsByTagName('a:tr');
  const rows: PptxTableRow[] = [];
  
  for (let i = 0; i < trElements.length; i++) {
    const tr = trElements[i];
    const height = parseInt(tr.getAttribute('h') || '0', 10);
    
    const tcElements = tr.getElementsByTagName('a:tc');
    const cells: PptxTableCell[] = [];
    
    for (let j = 0; j < tcElements.length; j++) {
      const tc = tcElements[j];
      
      // Parse cell properties
      const tcPr = tc.getElementsByTagName('a:tcPr')[0];
      const colSpan = parseInt(tc.getAttribute('gridSpan') || '1', 10);
      const rowSpan = parseInt(tc.getAttribute('rowSpan') || '1', 10);
      
      // Parse cell fill
      const fill = tcPr ? parseFill(tcPr, theme) : undefined;
      
      // Parse cell text
      const txBody = tc.getElementsByTagName('a:txBody')[0];
      const text = txBody ? parseParagraphs(txBody, theme) : [];
      
      cells.push({
        text,
        colSpan: colSpan > 1 ? colSpan : undefined,
        rowSpan: rowSpan > 1 ? rowSpan : undefined,
        fill,
      });
    }
    
    rows.push({ height, cells });
  }
  
  return {
    type: 'table',
    ...pos,
    rows,
    colWidths,
  };
}

// ─── Group Parsing ──────────────────────────────────────────────────────────

function parseGroup(
  element: Element,
  slideRels: Map<string, string>,
  images: Map<string, string>,
  theme?: PptxTheme
): PptxGroup | null {
  const pos = parsePosition(element);
  
  // Get child coordinate space
  const grpSpPr = element.getElementsByTagName('p:grpSpPr')[0];
  const xfrm = grpSpPr?.getElementsByTagName('a:xfrm')[0];
  const chOff = xfrm?.getElementsByTagName('a:chOff')[0];
  const chExt = xfrm?.getElementsByTagName('a:chExt')[0];
  
  const childOffset = chOff ? {
    x: parseInt(chOff.getAttribute('x') || '0', 10),
    y: parseInt(chOff.getAttribute('y') || '0', 10),
  } : undefined;
  
  const childExtent = chExt ? {
    cx: parseInt(chExt.getAttribute('cx') || '0', 10),
    cy: parseInt(chExt.getAttribute('cy') || '0', 10),
  } : undefined;
  
  // Parse child elements
  const children: PptxElement[] = [];
  
  for (let i = 0; i < element.children.length; i++) {
    const child = element.children[i];
    if (child.tagName !== 'p:grpSpPr' && child.tagName !== 'p:nvGrpSpPr') {
      const parsed = parseElement(child, slideRels, images, theme);
      if (parsed) {
        children.push(parsed);
      }
    }
  }
  
  return {
    type: 'group',
    ...pos,
    children,
    chOff: childOffset,
    chExt: childExtent,
  };
}

// ─── Connector Parsing ──────────────────────────────────────────────────────

function parseConnector(element: Element, theme?: PptxTheme): PptxShape | null {
  const pos = parsePosition(element);
  
  const spPr = element.getElementsByTagName('a:spPr')[0];
  const stroke = parseStroke(spPr, theme);
  
  return {
    type: 'shape',
    ...pos,
    shapeType: 'line',
    stroke,
  };
}

// ─── Paragraph Parsing ──────────────────────────────────────────────────────

function parseParagraphs(txBody: Element, theme?: PptxTheme): PptxParagraph[] {
  const paragraphs: PptxParagraph[] = [];
  const pElements = txBody.getElementsByTagName('a:p');
  
  for (let i = 0; i < pElements.length; i++) {
    const p = pElements[i];
    
    // Parse paragraph properties
    const pPr = p.getElementsByTagName('a:pPr')[0];
    const alignment = parseAlignment(pPr?.getAttribute('algn'));
    const level = parseInt(pPr?.getAttribute('lvl') || '0', 10);
    
    // Parse bullet
    let bulletType: PptxParagraph['bulletType'] = 'none';
    let bulletChar: string | undefined;
    
    const buChar = pPr?.getElementsByTagName('a:buChar')[0];
    const buAutoNum = pPr?.getElementsByTagName('a:buAutoNum')[0];
    const buNone = pPr?.getElementsByTagName('a:buNone')[0];
    
    if (buChar) {
      bulletType = 'bullet';
      bulletChar = buChar.getAttribute('char') || '•';
    } else if (buAutoNum) {
      bulletType = 'number';
    } else if (!buNone && level > 0) {
      bulletType = 'bullet';
      bulletChar = '•';
    }
    
    // Parse runs
    const runs: PptxRun[] = [];
    
    for (let j = 0; j < p.children.length; j++) {
      const child = p.children[j];
      
      if (child.tagName === 'a:r') {
        const run = parseRun(child, theme);
        if (run) {
          runs.push(run);
        }
      } else if (child.tagName === 'a:br') {
        runs.push({ text: '\n' });
      }
    }
    
    paragraphs.push({
      alignment,
      bulletType,
      bulletChar,
      level,
      runs,
    });
  }
  
  return paragraphs;
}

// ─── Run Parsing ────────────────────────────────────────────────────────────

function parseRun(runElement: Element, theme?: PptxTheme): PptxRun | null {
  const t = runElement.getElementsByTagName('a:t')[0];
  const text = t?.textContent || '';
  
  if (!text) return null;
  
  const rPr = runElement.getElementsByTagName('a:rPr')[0];
  
  // Parse formatting
  const bold = rPr?.getAttribute('b') === '1';
  const italic = rPr?.getAttribute('i') === '1';
  const underline = rPr?.getAttribute('u') === 'sng';
  const strikethrough = rPr?.getAttribute('strike') === 'sngStrike';
  
  // Font size (in hundredths of a point)
  const szAttr = rPr?.getAttribute('sz');
  const fontSize = szAttr ? parseInt(szAttr, 10) / 100 : undefined;
  
  // Font family
  const latin = rPr?.getElementsByTagName('a:latin')[0];
  const fontFamily = latin?.getAttribute('typeface') || theme?.minorFont;
  
  // Color
  const solidFill = rPr?.getElementsByTagName('a:solidFill')[0];
  const color = solidFill ? parseColor(solidFill, theme) : undefined;
  
  // Superscript/subscript
  const baseline = rPr?.getAttribute('baseline');
  const superscript = baseline && parseInt(baseline, 10) > 0;
  const subscript = baseline && parseInt(baseline, 10) < 0;
  
  // Hyperlink
  const hlinkClick = rPr?.getElementsByTagName('a:hlinkClick')[0];
  const hyperlink = hlinkClick?.getAttribute('r:id') || undefined;
  
  return {
    text,
    bold: bold || undefined,
    italic: italic || undefined,
    underline: underline || undefined,
    strikethrough: strikethrough || undefined,
    fontSize,
    fontFamily,
    color,
    superscript: superscript || undefined,
    subscript: subscript || undefined,
    hyperlink,
  };
}

// ─── Color Parsing ──────────────────────────────────────────────────────────

function parseColor(fillElement: Element | undefined, theme?: PptxTheme): string | undefined {
  if (!fillElement) return undefined;
  
  // Try srgbClr
  const srgbClr = fillElement.getElementsByTagName('a:srgbClr')[0];
  if (srgbClr) {
    const val = srgbClr.getAttribute('val');
    return val ? `#${val}` : undefined;
  }
  
  // Try schemeClr
  const schemeClr = fillElement.getElementsByTagName('a:schemeClr')[0];
  if (schemeClr && theme?.colors) {
    const colorName = schemeClr.getAttribute('val');
    if (colorName && theme.colors[colorName]) {
      return `#${theme.colors[colorName]}`;
    }
  }
  
  // Try prstClr (preset color)
  const prstClr = fillElement.getElementsByTagName('a:prstClr')[0];
  if (prstClr) {
    const val = prstClr.getAttribute('val');
    return getPresetColor(val);
  }
  
  return undefined;
}

// ─── Fill Parsing ───────────────────────────────────────────────────────────

function parseFill(element: Element | undefined, theme?: PptxTheme): string | undefined {
  if (!element) return undefined;
  
  const solidFill = element.getElementsByTagName('a:solidFill')[0];
  return parseColor(solidFill, theme);
}

// ─── Gradient Parsing ───────────────────────────────────────────────────────

function parseGradient(gradFill: Element | undefined, theme?: PptxTheme): PptxGradient | undefined {
  if (!gradFill) return undefined;
  
  const gsLst = gradFill.getElementsByTagName('a:gsLst')[0];
  if (!gsLst) return undefined;
  
  const stops: { position: number; color: string }[] = [];
  const gsElements = gsLst.getElementsByTagName('a:gs');
  
  for (let i = 0; i < gsElements.length; i++) {
    const gs = gsElements[i];
    const pos = parseInt(gs.getAttribute('pos') || '0', 10) / 1000; // Convert from 0-100000 to 0-100
    const color = parseColor(gs, theme);
    if (color) {
      stops.push({ position: pos, color });
    }
  }
  
  // Get angle (for linear gradients)
  const lin = gradFill.getElementsByTagName('a:lin')[0];
  const angAttr = lin?.getAttribute('ang');
  const angle = angAttr ? parseInt(angAttr, 10) / 60000 : 0; // Convert from 60,000ths to degrees
  
  return {
    type: 'linear',
    angle,
    stops,
  };
}

// ─── Stroke Parsing ─────────────────────────────────────────────────────────

function parseStroke(element: Element | undefined, theme?: PptxTheme): PptxStroke | undefined {
  if (!element) return undefined;
  
  const ln = element.getElementsByTagName('a:ln')[0];
  if (!ln) return undefined;
  
  const width = parseInt(ln.getAttribute('w') || '0', 10);
  const solidFill = ln.getElementsByTagName('a:solidFill')[0];
  const color = parseColor(solidFill, theme);
  
  return {
    color,
    width: width || undefined,
  };
}

// ─── Shadow Parsing ─────────────────────────────────────────────────────────

function parseShadow(element: Element | undefined): PptxShadow | undefined {
  if (!element) return undefined;
  
  const effectLst = element.getElementsByTagName('a:effectLst')[0];
  const outerShdw = effectLst?.getElementsByTagName('a:outerShdw')[0];
  
  if (!outerShdw) return undefined;
  
  const blur = parseInt(outerShdw.getAttribute('blurRad') || '0', 10);
  const dist = parseInt(outerShdw.getAttribute('dist') || '0', 10);
  const dir = parseInt(outerShdw.getAttribute('dir') || '0', 10) / 60000;
  
  // Try to get shadow color
  const srgbClr = outerShdw.getElementsByTagName('a:srgbClr')[0];
  const color = srgbClr ? `#${srgbClr.getAttribute('val')}` : 'rgba(0,0,0,0.3)';
  
  return {
    color,
    blur: emuToPx(blur),
    distance: emuToPx(dist),
    direction: dir,
  };
}

// ─── Helper Functions ───────────────────────────────────────────────────────

function parseAlignment(align: string | null | undefined): PptxParagraph['alignment'] {
  switch (align) {
    case 'l': return 'left';
    case 'ctr': return 'center';
    case 'r': return 'right';
    case 'just': return 'justify';
    default: return 'left';
  }
}

function getPresetColor(name: string | null | undefined): string | undefined {
  const presetColors: Record<string, string> = {
    black: '#000000',
    white: '#FFFFFF',
    red: '#FF0000',
    green: '#00FF00',
    blue: '#0000FF',
    yellow: '#FFFF00',
    cyan: '#00FFFF',
    magenta: '#FF00FF',
    gray: '#808080',
    grey: '#808080',
    lightGray: '#D3D3D3',
    darkGray: '#A9A9A9',
  };
  
  return name ? presetColors[name] : undefined;
}

// ─── Cleanup ────────────────────────────────────────────────────────────────

export function cleanupPptxPresentation(presentation: PptxPresentation): void {
  // Revoke all blob URLs to free memory
  for (const url of presentation.images.values()) {
    URL.revokeObjectURL(url);
  }
}

export default parsePptx;

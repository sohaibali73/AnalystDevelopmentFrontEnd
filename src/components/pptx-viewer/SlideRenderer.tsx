'use client';

import React, { useMemo } from 'react';
import {
  PptxSlide,
  PptxElement,
  PptxTextBox,
  PptxShape,
  PptxImage,
  PptxTable,
  PptxGroup,
  PptxParagraph,
  PptxRun,
  PptxGradient,
  emuToPx,
} from '@/lib/pptx-parser';

// ─── Props ──────────────────────────────────────────────────────────────────

interface SlideRendererProps {
  slide: PptxSlide;
  slideWidth: number;   // EMU
  slideHeight: number;  // EMU
  /** Scale factor — the outer wrapper is sized to widthPx*scale × heightPx*scale */
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
}

// ─── Main Component ─────────────────────────────────────────────────────────
// Pattern: outer wrapper is sized to scaled dimensions; inner canvas is full
// native size and then CSS-transformed. This prevents layout bleed-out.

export function SlideRenderer({
  slide,
  slideWidth,
  slideHeight,
  scale = 1,
  className,
  style,
}: SlideRendererProps) {
  const nativeW = emuToPx(slideWidth);
  const nativeH = emuToPx(slideHeight);
  const scaledW = Math.round(nativeW * scale);
  const scaledH = Math.round(nativeH * scale);

  const background = useMemo(
    () => slide.background || slide.layoutBackground || slide.masterBackground,
    [slide]
  );

  const backgroundStyle = useMemo((): React.CSSProperties => {
    if (!background) return { background: '#ffffff' };
    if (background.type === 'solid' && background.color)
      return { background: background.color };
    if (background.type === 'gradient' && background.gradient)
      return { background: gradientToCss(background.gradient) };
    if (background.type === 'image' && background.imageUrl)
      return {
        backgroundImage: `url(${background.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    return { background: '#ffffff' };
  }, [background]);

  return (
    // Outer box: exactly the scaled size — this is the layout footprint
    <div
      className={className}
      style={{
        width: scaledW,
        height: scaledH,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Inner canvas: native size, scaled via transform */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: nativeW,
          height: nativeH,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
          overflow: 'hidden',
          ...backgroundStyle,
        }}
      >
        {slide.elements.map((el, i) => (
          <ElementRenderer key={i} element={el} />
        ))}
      </div>
    </div>
  );
}

// ─── Element Dispatcher ─────────────────────────────────────────────────────

function ElementRenderer({ element }: { element: PptxElement }) {
  switch (element.type) {
    case 'textbox': return <TextBoxRenderer element={element} />;
    case 'shape':   return <ShapeRenderer element={element} />;
    case 'image':   return <ImageRenderer element={element} />;
    case 'table':   return <TableRenderer element={element} />;
    case 'group':   return <GroupRenderer element={element} />;
    default:        return null;
  }
}

// ─── TextBox ────────────────────────────────────────────────────────────────

function TextBoxRenderer({ element }: { element: PptxTextBox }) {
  const { x, y, w, h, rotation, flipH, flipV, paragraphs, fill, stroke, shadow, verticalAlign } = element;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: emuToPx(x),
    top:  emuToPx(y),
    width:  emuToPx(w),
    height: emuToPx(h),
    transform: buildTransform(rotation, flipH, flipV),
    display: 'flex',
    flexDirection: 'column',
    justifyContent:
      verticalAlign === 'middle' ? 'center' :
      verticalAlign === 'bottom' ? 'flex-end' : 'flex-start',
    padding: '4px 8px',
    boxSizing: 'border-box',
    overflow: 'hidden',
  };

  if (fill) style.backgroundColor = fill;
  if (stroke?.color) style.border = `${emuToPx(stroke.width || 12700)}px solid ${stroke.color}`;
  if (shadow) style.boxShadow = shadowToCss(shadow);

  return (
    <div style={style}>
      {paragraphs.map((p, i) => <ParagraphRenderer key={i} paragraph={p} />)}
    </div>
  );
}

// ─── Shape ──────────────────────────────────────────────────────────────────

function ShapeRenderer({ element }: { element: PptxShape }) {
  const { x, y, w, h, rotation, flipH, flipV, shapeType, fill, gradientFill, stroke, shadow, paragraphs } = element;

  if (shapeType === 'line') {
    return (
      <div style={{
        position: 'absolute',
        left: emuToPx(x),
        top: emuToPx(y),
        width: emuToPx(w) || 1,
        height: emuToPx(h) || 1,
        transform: buildTransform(rotation, flipH, flipV),
        overflow: 'visible',
      }}>
        <svg style={{ position: 'absolute', width: '100%', height: '100%', overflow: 'visible' }}>
          <line x1={0} y1={0} x2={emuToPx(w)} y2={emuToPx(h)} stroke={stroke?.color || '#000'} strokeWidth={stroke?.width ? emuToPx(stroke.width) : 1} />
        </svg>
      </div>
    );
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    left: emuToPx(x),
    top:  emuToPx(y),
    width:  emuToPx(w),
    height: emuToPx(h),
    transform: buildTransform(rotation, flipH, flipV),
    boxSizing: 'border-box',
    ...shapeClipStyle(shapeType),
  };

  if (gradientFill)  style.background = gradientToCss(gradientFill);
  else if (fill)     style.backgroundColor = fill;
  if (stroke?.color) style.border = `${emuToPx(stroke.width || 12700)}px solid ${stroke.color}`;
  if (shadow)        style.boxShadow = shadowToCss(shadow);

  if (paragraphs && paragraphs.length > 0) {
    return (
      <div style={style}>
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '4px 8px', boxSizing: 'border-box' }}>
          {paragraphs.map((p, i) => <ParagraphRenderer key={i} paragraph={p} />)}
        </div>
      </div>
    );
  }

  return <div style={style} />;
}

// ─── Image ──────────────────────────────────────────────────────────────────

function ImageRenderer({ element }: { element: PptxImage }) {
  const { x, y, w, h, rotation, flipH, flipV, src, cropRect } = element;

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: emuToPx(x),
    top:  emuToPx(y),
    width:  emuToPx(w),
    height: emuToPx(h),
    transform: buildTransform(rotation, flipH, flipV),
    overflow: 'hidden',
  };

  // Compute image scale + offset so the uncropped area fills the container
  // (instead of squishing the whole image into the clipped area)
  let imgStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
  };

  if (cropRect) {
    const { top = 0, bottom = 0, left = 0, right = 0 } = cropRect;
    const widthScale  = 100 / (100 - left - right);
    const heightScale = 100 / (100 - top - bottom);
    imgStyle = {
      position: 'absolute',
      width:  `${widthScale  * 100}%`,
      height: `${heightScale * 100}%`,
      left:   `-${left  * widthScale}%`,
      top:    `-${top   * heightScale}%`,
      objectFit: 'cover',
      display: 'block',
    };
  }

  return (
    <div style={containerStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" style={imgStyle} crossOrigin="anonymous" />
    </div>
  );
}

// ─── Table ──────────────────────────────────────────────────────────────────

function TableRenderer({ element }: { element: PptxTable }) {
  const { x, y, w, h, rotation, rows, colWidths } = element;
  const totalColW = colWidths.reduce((s, v) => s + v, 0);

  return (
    <div style={{ position: 'absolute', left: emuToPx(x), top: emuToPx(y), width: emuToPx(w), height: emuToPx(h), transform: buildTransform(rotation), overflow: 'hidden' }}>
      <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          {colWidths.map((cw, i) => <col key={i} style={{ width: `${(cw / totalColW) * 100}%` }} />)}
        </colgroup>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ height: emuToPx(row.height) }}>
              {row.cells.map((cell, ci) => (
                <td
                  key={ci}
                  colSpan={cell.colSpan}
                  rowSpan={cell.rowSpan}
                  style={{
                    backgroundColor: cell.fill || 'transparent',
                    borderTop:    cell.borderTop    ? `${emuToPx(cell.borderTop.width    || 12700)}px solid ${cell.borderTop.color    || '#000'}` : undefined,
                    borderBottom: cell.borderBottom ? `${emuToPx(cell.borderBottom.width || 12700)}px solid ${cell.borderBottom.color || '#000'}` : undefined,
                    borderLeft:   cell.borderLeft   ? `${emuToPx(cell.borderLeft.width   || 12700)}px solid ${cell.borderLeft.color   || '#000'}` : undefined,
                    borderRight:  cell.borderRight  ? `${emuToPx(cell.borderRight.width  || 12700)}px solid ${cell.borderRight.color  || '#000'}` : undefined,
                    padding: '4px 6px',
                    verticalAlign: 'middle',
                    overflow: 'hidden',
                  }}
                >
                  {cell.text.map((p, pi) => <ParagraphRenderer key={pi} paragraph={p} />)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Group ──────────────────────────────────────────────────────────────────

function GroupRenderer({ element }: { element: PptxGroup }) {
  const { x, y, w, h, rotation, flipH, flipV, children, chOff, chExt } = element;

  let innerTransform = '';
  if (chOff && chExt && chExt.cx > 0 && chExt.cy > 0) {
    const sx = emuToPx(w) / emuToPx(chExt.cx);
    const sy = emuToPx(h) / emuToPx(chExt.cy);
    // scale() must come before translate() so the offset is in child coordinate
    // space, not in the already-scaled space (CSS applies left-to-right)
    innerTransform = `scale(${sx}, ${sy}) translate(${-emuToPx(chOff.x)}px, ${-emuToPx(chOff.y)}px)`;
  }

  return (
    <div style={{ position: 'absolute', left: emuToPx(x), top: emuToPx(y), width: emuToPx(w), height: emuToPx(h), transform: buildTransform(rotation, flipH, flipV), overflow: 'hidden' }}>
      {/* position:relative is required so absolute child elements resolve
          against this transformed div, not the outer group container */}
      <div style={{ position: 'relative', transform: innerTransform, transformOrigin: 'top left' }}>
        {children.map((child, i) => <ElementRenderer key={i} element={child} />)}
      </div>
    </div>
  );
}

// ─── Paragraph & Run ────────────────────────────────────────────────────────

function ParagraphRenderer({ paragraph }: { paragraph: PptxParagraph }) {
  const { alignment, bulletType, bulletChar, level, runs, lineSpacing, spaceBefore, spaceAfter } = paragraph;

  const bulletContent =
    bulletType === 'bullet' ? (bulletChar || '•') :
    bulletType === 'number' ? '1.' : '';

  return (
    <p style={{
      // textAlign has no effect on flex containers — use justifyContent instead
      justifyContent:
        alignment === 'center'  ? 'center'   :
        alignment === 'right'   ? 'flex-end' :
        alignment === 'justify' ? undefined  : 'flex-start',
      margin: 0,
      marginTop:    spaceBefore ? `${spaceBefore}pt` : undefined,
      marginBottom: spaceAfter  ? `${spaceAfter}pt`  : undefined,
      paddingLeft:  level       ? `${level * 16}px`  : undefined,
      lineHeight: lineSpacing || 1.2,
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'baseline',
    }}>
      {bulletContent && (
        <span style={{ marginRight: '5px', flexShrink: 0 }}>{bulletContent}</span>
      )}
      {runs.map((run, i) => <RunRenderer key={i} run={run} />)}
    </p>
  );
}

function RunRenderer({ run }: { run: PptxRun }) {
  const { text, bold, italic, underline, strikethrough, fontSize, fontFamily, color, superscript, subscript, hyperlink } = run;

  const style: React.CSSProperties = {
    fontWeight:     bold          ? 'bold'         : undefined,
    fontStyle:      italic        ? 'italic'        : undefined,
    textDecoration: [underline && 'underline', strikethrough && 'line-through']
      .filter(Boolean).join(' ') || undefined,
    fontSize:       fontSize      ? `${fontSize}pt` : undefined,
    fontFamily:     fontFamily    || undefined,
    color:          color         || undefined,
    verticalAlign:  superscript   ? 'super'         : subscript ? 'sub' : undefined,
    whiteSpace: 'pre-wrap',
  };

  if (hyperlink) {
    return <a href={hyperlink} target="_blank" rel="noopener noreferrer" style={{ ...style, color: color || '#0066cc' }}>{text}</a>;
  }
  return <span style={style}>{text}</span>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildTransform(rotation?: number, flipH?: boolean, flipV?: boolean): string {
  const parts: string[] = [];
  if (rotation) parts.push(`rotate(${rotation}deg)`);
  if (flipH)    parts.push('scaleX(-1)');
  if (flipV)    parts.push('scaleY(-1)');
  return parts.length > 0 ? parts.join(' ') : 'none';
}

function shadowToCss(shadow: { color?: string; blur?: number; distance?: number; direction?: number }): string {
  // distance and blur come from the parser in EMUs — convert to pixels
  const distancePx = emuToPx(shadow.distance || 0);
  const blurPx     = emuToPx(shadow.blur     || 0);
  const angleRad   = (shadow.direction || 0) * Math.PI / 180;
  const ox = Math.cos(angleRad) * distancePx;
  const oy = Math.sin(angleRad) * distancePx;
  return `${ox}px ${oy}px ${blurPx}px ${shadow.color || 'rgba(0,0,0,0.3)'}`;
}

function shapeClipStyle(shapeType: string): React.CSSProperties {
  switch (shapeType) {
    case 'ellipse':       return { borderRadius: '50%' };
    case 'roundRect':     return { borderRadius: '10%' };
    case 'triangle':      return { clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' };
    case 'rtTriangle':    return { clipPath: 'polygon(0% 0%, 0% 100%, 100% 100%)' };
    case 'diamond':       return { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' };
    case 'hexagon':       return { clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' };
    case 'parallelogram': return { clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' };
    case 'trapezoid':     return { clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' };
    case 'pentagon':      return { clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' };
    case 'chevron':       return { clipPath: 'polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%)' };
    case 'rightArrow':
    case 'arrow':         return { clipPath: 'polygon(0% 25%, 75% 25%, 75% 0%, 100% 50%, 75% 100%, 75% 75%, 0% 75%)' };
    case 'leftArrow':     return { clipPath: 'polygon(25% 0%, 25% 25%, 100% 25%, 100% 75%, 25% 75%, 25% 100%, 0% 50%)' };
    case 'star5':         return { clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' };
    case 'star4':         return { clipPath: 'polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)' };
    case 'plus':
    case 'cross':         return { clipPath: 'polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)' };
    default:              return {};
  }
}

function gradientToCss(gradient: PptxGradient): string {
  if (!gradient.stops?.length) return 'transparent';
  const stops = [...gradient.stops].sort((a, b) => a.position - b.position).map(s => `${s.color} ${s.position}%`);
  if (gradient.type === 'radial') return `radial-gradient(circle, ${stops.join(', ')})`;
  // PPTX angle 0° = top-to-bottom = CSS 180°.
  // Correct mapping: cssAngle = (180 - pptxAngle + 360) % 360
  const cssAngle = (180 - (gradient.angle || 0) + 360) % 360;
  return `linear-gradient(${cssAngle}deg, ${stops.join(', ')})`;
}

export default SlideRenderer;

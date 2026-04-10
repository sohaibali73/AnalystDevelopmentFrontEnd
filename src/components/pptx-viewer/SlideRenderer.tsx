'use client';

/**
 * SlideRenderer — Renders parsed PPTX slides to HTML/CSS
 * 
 * Based on BrowserPPTX documentation. Uses absolute positioning
 * and CSS transforms to faithfully render PowerPoint slides.
 */

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
  PptxBackground,
  emuToPx,
} from '@/lib/pptx-parser';

// ─── Props ──────────────────────────────────────────────────────────────────

interface SlideRendererProps {
  slide: PptxSlide;
  slideWidth: number;  // EMU
  slideHeight: number; // EMU
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function SlideRenderer({
  slide,
  slideWidth,
  slideHeight,
  scale = 1,
  className,
  style,
}: SlideRendererProps) {
  const widthPx = emuToPx(slideWidth);
  const heightPx = emuToPx(slideHeight);
  
  // Resolve background (slide -> layout -> master -> white fallback)
  const background = useMemo(() => {
    return slide.background || slide.layoutBackground || slide.masterBackground;
  }, [slide]);
  
  const backgroundStyle = useMemo(() => {
    if (!background) return { background: '#ffffff' };
    
    if (background.type === 'solid' && background.color) {
      return { background: background.color };
    }
    
    if (background.type === 'gradient' && background.gradient) {
      return { background: gradientToCss(background.gradient) };
    }
    
    if (background.type === 'image' && background.imageUrl) {
      return {
        backgroundImage: `url(${background.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    
    return { background: '#ffffff' };
  }, [background]);
  
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: widthPx,
        height: heightPx,
        overflow: 'hidden',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        ...backgroundStyle,
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        borderRadius: '2px',
        ...style,
      }}
    >
      {slide.elements.map((element, idx) => (
        <ElementRenderer key={idx} element={element} />
      ))}
    </div>
  );
}

// ─── Element Renderer ───────────────────────────────────────────────────────

function ElementRenderer({ element }: { element: PptxElement }) {
  switch (element.type) {
    case 'textbox':
      return <TextBoxRenderer element={element} />;
    case 'shape':
      return <ShapeRenderer element={element} />;
    case 'image':
      return <ImageRenderer element={element} />;
    case 'table':
      return <TableRenderer element={element} />;
    case 'group':
      return <GroupRenderer element={element} />;
    default:
      return null;
  }
}

// ─── TextBox Renderer ───────────────────────────────────────────────────────

function TextBoxRenderer({ element }: { element: PptxTextBox }) {
  const { x, y, w, h, rotation, flipH, flipV, paragraphs, fill, stroke, shadow, verticalAlign } = element;
  
  const style: React.CSSProperties = {
    position: 'absolute',
    left: emuToPx(x),
    top: emuToPx(y),
    width: emuToPx(w),
    height: emuToPx(h),
    transform: getTransformString(rotation, flipH, flipV),
    display: 'flex',
    flexDirection: 'column',
    justifyContent: verticalAlign === 'middle' ? 'center' : verticalAlign === 'bottom' ? 'flex-end' : 'flex-start',
    padding: '4px 8px',
    boxSizing: 'border-box',
    overflow: 'hidden',
  };
  
  if (fill) {
    style.backgroundColor = fill;
  }
  
  if (stroke?.color) {
    style.border = `${emuToPx(stroke.width || 12700)}px solid ${stroke.color}`;
  }
  
  if (shadow) {
    const offsetX = Math.cos((shadow.direction || 0) * Math.PI / 180) * (shadow.distance || 0);
    const offsetY = Math.sin((shadow.direction || 0) * Math.PI / 180) * (shadow.distance || 0);
    style.boxShadow = `${offsetX}px ${offsetY}px ${shadow.blur || 0}px ${shadow.color || 'rgba(0,0,0,0.3)'}`;
  }
  
  return (
    <div style={style}>
      {paragraphs.map((para, idx) => (
        <ParagraphRenderer key={idx} paragraph={para} />
      ))}
    </div>
  );
}

// ─── Shape Renderer ─────────────────────────────────────────────────────────

function ShapeRenderer({ element }: { element: PptxShape }) {
  const { x, y, w, h, rotation, flipH, flipV, shapeType, fill, gradientFill, stroke, shadow, paragraphs } = element;
  
  // Special handling for lines
  if (shapeType === 'line') {
    return (
      <svg
        style={{
          position: 'absolute',
          left: emuToPx(x),
          top: emuToPx(y),
          width: emuToPx(w) || 1,
          height: emuToPx(h) || 1,
          overflow: 'visible',
        }}
      >
        <line
          x1={0}
          y1={0}
          x2={emuToPx(w)}
          y2={emuToPx(h)}
          stroke={stroke?.color || '#000000'}
          strokeWidth={stroke?.width ? emuToPx(stroke.width) : 1}
        />
      </svg>
    );
  }
  
  const clipStyle = getShapeClipStyle(shapeType);
  
  const style: React.CSSProperties = {
    position: 'absolute',
    left: emuToPx(x),
    top: emuToPx(y),
    width: emuToPx(w),
    height: emuToPx(h),
    transform: getTransformString(rotation, flipH, flipV),
    ...clipStyle,
  };
  
  if (gradientFill) {
    style.background = gradientToCss(gradientFill);
  } else if (fill) {
    style.backgroundColor = fill;
  }
  
  if (stroke?.color) {
    style.border = `${emuToPx(stroke.width || 12700)}px solid ${stroke.color}`;
  }
  
  if (shadow) {
    const offsetX = Math.cos((shadow.direction || 0) * Math.PI / 180) * (shadow.distance || 0);
    const offsetY = Math.sin((shadow.direction || 0) * Math.PI / 180) * (shadow.distance || 0);
    style.boxShadow = `${offsetX}px ${offsetY}px ${shadow.blur || 0}px ${shadow.color || 'rgba(0,0,0,0.3)'}`;
  }
  
  // If shape has text, render it inside
  if (paragraphs && paragraphs.length > 0) {
    return (
      <div style={style}>
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '4px 8px',
          boxSizing: 'border-box',
        }}>
          {paragraphs.map((para, idx) => (
            <ParagraphRenderer key={idx} paragraph={para} />
          ))}
        </div>
      </div>
    );
  }
  
  return <div style={style} />;
}

// ─── Image Renderer ─────────────────────────────────────────────────────────

function ImageRenderer({ element }: { element: PptxImage }) {
  const { x, y, w, h, rotation, flipH, flipV, src, cropRect } = element;
  
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: emuToPx(x),
    top: emuToPx(y),
    width: emuToPx(w),
    height: emuToPx(h),
    transform: getTransformString(rotation, flipH, flipV),
    overflow: 'hidden',
  };
  
  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };
  
  if (cropRect) {
    containerStyle.clipPath = `inset(${cropRect.top}% ${cropRect.right}% ${cropRect.bottom}% ${cropRect.left}%)`;
  }
  
  return (
    <div style={containerStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" style={imgStyle} crossOrigin="anonymous" />
    </div>
  );
}

// ─── Table Renderer ─────────────────────────────────────────────────────────

function TableRenderer({ element }: { element: PptxTable }) {
  const { x, y, w, h, rotation, rows, colWidths } = element;
  
  const totalWidth = colWidths.reduce((sum, cw) => sum + cw, 0);
  
  return (
    <div
      style={{
        position: 'absolute',
        left: emuToPx(x),
        top: emuToPx(y),
        width: emuToPx(w),
        height: emuToPx(h),
        transform: getTransformString(rotation),
        overflow: 'hidden',
      }}
    >
      <table
        style={{
          width: '100%',
          height: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}
      >
        <colgroup>
          {colWidths.map((cw, idx) => (
            <col key={idx} style={{ width: `${(cw / totalWidth) * 100}%` }} />
          ))}
        </colgroup>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} style={{ height: emuToPx(row.height) }}>
              {row.cells.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  colSpan={cell.colSpan}
                  rowSpan={cell.rowSpan}
                  style={{
                    backgroundColor: cell.fill || 'transparent',
                    borderTop: cell.borderTop ? `${emuToPx(cell.borderTop.width || 12700)}px solid ${cell.borderTop.color || '#000'}` : undefined,
                    borderBottom: cell.borderBottom ? `${emuToPx(cell.borderBottom.width || 12700)}px solid ${cell.borderBottom.color || '#000'}` : undefined,
                    borderLeft: cell.borderLeft ? `${emuToPx(cell.borderLeft.width || 12700)}px solid ${cell.borderLeft.color || '#000'}` : undefined,
                    borderRight: cell.borderRight ? `${emuToPx(cell.borderRight.width || 12700)}px solid ${cell.borderRight.color || '#000'}` : undefined,
                    padding: '4px 6px',
                    verticalAlign: 'middle',
                    overflow: 'hidden',
                  }}
                >
                  {cell.text.map((para, pIdx) => (
                    <ParagraphRenderer key={pIdx} paragraph={para} />
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Group Renderer ─────────────────────────────────────────────────────────

function GroupRenderer({ element }: { element: PptxGroup }) {
  const { x, y, w, h, rotation, flipH, flipV, children, chOff, chExt } = element;
  
  // Calculate transform for mapping child coordinate space
  let innerTransform = '';
  if (chOff && chExt && chExt.cx > 0 && chExt.cy > 0) {
    const scaleX = emuToPx(w) / emuToPx(chExt.cx);
    const scaleY = emuToPx(h) / emuToPx(chExt.cy);
    const translateX = -emuToPx(chOff.x);
    const translateY = -emuToPx(chOff.y);
    innerTransform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
  }
  
  return (
    <div
      style={{
        position: 'absolute',
        left: emuToPx(x),
        top: emuToPx(y),
        width: emuToPx(w),
        height: emuToPx(h),
        transform: getTransformString(rotation, flipH, flipV),
        overflow: 'hidden',
      }}
    >
      <div style={{ transform: innerTransform, transformOrigin: 'top left' }}>
        {children.map((child, idx) => (
          <ElementRenderer key={idx} element={child} />
        ))}
      </div>
    </div>
  );
}

// ─── Paragraph Renderer ─────────────────────────────────────────────────────

function ParagraphRenderer({ paragraph }: { paragraph: PptxParagraph }) {
  const { alignment, bulletType, bulletChar, level, runs, lineSpacing, spaceBefore, spaceAfter } = paragraph;
  
  const style: React.CSSProperties = {
    textAlign: alignment || 'left',
    margin: 0,
    marginTop: spaceBefore ? `${spaceBefore}pt` : undefined,
    marginBottom: spaceAfter ? `${spaceAfter}pt` : undefined,
    paddingLeft: level ? `${level * 20}px` : undefined,
    lineHeight: lineSpacing ? lineSpacing : 1.4,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
  };
  
  const bulletContent = bulletType === 'bullet' ? (bulletChar || '•') + ' ' : bulletType === 'number' ? '1. ' : '';
  
  return (
    <p style={style}>
      {bulletContent && (
        <span style={{ marginRight: '4px', flexShrink: 0 }}>{bulletContent}</span>
      )}
      {runs.map((run, idx) => (
        <RunRenderer key={idx} run={run} />
      ))}
    </p>
  );
}

// ─── Run Renderer ───────────────────────────────────────────────────────────

function RunRenderer({ run }: { run: PptxRun }) {
  const { text, bold, italic, underline, strikethrough, fontSize, fontFamily, color, superscript, subscript, hyperlink } = run;
  
  const style: React.CSSProperties = {
    fontWeight: bold ? 'bold' : undefined,
    fontStyle: italic ? 'italic' : undefined,
    textDecoration: underline ? 'underline' : strikethrough ? 'line-through' : undefined,
    fontSize: fontSize ? `${fontSize}pt` : undefined,
    fontFamily: fontFamily || undefined,
    color: color || undefined,
    verticalAlign: superscript ? 'super' : subscript ? 'sub' : undefined,
    whiteSpace: 'pre-wrap',
  };
  
  if (hyperlink) {
    return (
      <a href={hyperlink} target="_blank" rel="noopener noreferrer" style={{ ...style, color: color || '#0066cc' }}>
        {text}
      </a>
    );
  }
  
  return <span style={style}>{text}</span>;
}

// ─── Helper Functions ───────────────────────────────────────────────────────

function getTransformString(rotation?: number, flipH?: boolean, flipV?: boolean): string {
  const transforms: string[] = [];
  
  if (rotation) {
    transforms.push(`rotate(${rotation}deg)`);
  }
  
  if (flipH) {
    transforms.push('scaleX(-1)');
  }
  
  if (flipV) {
    transforms.push('scaleY(-1)');
  }
  
  return transforms.length > 0 ? transforms.join(' ') : 'none';
}

function getShapeClipStyle(shapeType: string): React.CSSProperties {
  switch (shapeType) {
    case 'ellipse':
      return { borderRadius: '50%' };
    case 'roundRect':
      return { borderRadius: '10%' };
    case 'triangle':
      return { clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' };
    case 'rtTriangle':
      return { clipPath: 'polygon(0% 0%, 0% 100%, 100% 100%)' };
    case 'diamond':
      return { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' };
    case 'hexagon':
      return { clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' };
    case 'octagon':
      return { clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' };
    case 'parallelogram':
      return { clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' };
    case 'trapezoid':
      return { clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' };
    case 'pentagon':
      return { clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' };
    case 'chevron':
      return { clipPath: 'polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%)' };
    case 'arrow':
    case 'rightArrow':
      return { clipPath: 'polygon(0% 25%, 75% 25%, 75% 0%, 100% 50%, 75% 100%, 75% 75%, 0% 75%)' };
    case 'leftArrow':
      return { clipPath: 'polygon(25% 0%, 25% 25%, 100% 25%, 100% 75%, 25% 75%, 25% 100%, 0% 50%)' };
    case 'star5':
      return { clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' };
    case 'star4':
      return { clipPath: 'polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)' };
    case 'plus':
    case 'cross':
      return { clipPath: 'polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)' };
    case 'heart':
      return { clipPath: 'path("M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z")' };
    case 'rect':
    default:
      return {};
  }
}

function gradientToCss(gradient: PptxGradient): string {
  if (!gradient.stops || gradient.stops.length === 0) {
    return 'transparent';
  }
  
  const sortedStops = [...gradient.stops].sort((a, b) => a.position - b.position);
  const stopStrings = sortedStops.map(stop => `${stop.color} ${stop.position}%`);
  
  if (gradient.type === 'radial') {
    return `radial-gradient(circle, ${stopStrings.join(', ')})`;
  }
  
  // Linear gradient - convert PowerPoint angle to CSS angle
  // PowerPoint: 0 = left-to-right, 90 = top-to-bottom
  // CSS: 0 = bottom-to-top, 90 = left-to-right
  const cssAngle = (gradient.angle || 0) + 90;
  
  return `linear-gradient(${cssAngle}deg, ${stopStrings.join(', ')})`;
}

export default SlideRenderer;

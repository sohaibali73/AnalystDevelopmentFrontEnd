/**
 * SVGArtifact - Renders SVG graphics with zoom and pan capabilities
 */

import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface SVGArtifactProps {
  code: string;
  isDark: boolean;
}

export function SVGArtifact({ code, isDark }: SVGArtifactProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.25));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.25, Math.min(3, prev + delta)));
  };

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    backgroundColor: isDark ? '#2A2A2A' : '#f5f5f5',
    border: `1px solid ${isDark ? '#424242' : '#e0e0e0'}`,
    borderRadius: '6px',
    cursor: 'pointer',
    color: isDark ? '#9E9E9E' : '#757575',
    transition: 'all 0.2s ease',
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: isDark ? '#1E1E1E' : '#ffffff',
    }}>
      {/* Zoom Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderBottom: `1px solid ${isDark ? '#424242' : '#e0e0e0'}`,
      }}>
        <button
          onClick={handleZoomIn}
          style={buttonStyle}
          title="Zoom in"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={handleZoomOut}
          style={buttonStyle}
          title="Zoom out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={handleReset}
          style={buttonStyle}
          title="Reset view"
        >
          <RotateCcw size={16} />
        </button>
        <span style={{
          fontSize: '12px',
          color: isDark ? '#9E9E9E' : '#757575',
          marginLeft: '8px',
        }}>
          {Math.round(scale * 100)}%
        </span>
      </div>

      {/* SVG Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        style={{
          flex: 1,
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease',
            transformOrigin: 'center',
          }}
          dangerouslySetInnerHTML={{ __html: code }}
        />
      </div>
    </div>
  );
}

export default SVGArtifact;

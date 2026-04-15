'use client';

/**
 * PptxViewer — Full-featured PPTX viewer with:
 * - Thumbnail sidebar
 * - Main slide area with zoom
 * - Keyboard navigation
 * - Loading progress
 * 
 * Uses the custom pptx-parser for client-side rendering.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Maximize2, Minimize2, 
  ZoomIn, ZoomOut, X, Loader2, Download 
} from 'lucide-react';
import { parsePptx, PptxPresentation, cleanupPptxPresentation, emuToPx } from '@/lib/pptx-parser';
import { SlideRenderer } from './SlideRenderer';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PptxViewerProps {
  /** File blob to display */
  file?: Blob | File | null;
  /** Pre-parsed presentation (skips parsing) */
  presentation?: PptxPresentation;
  /** Filename for download */
  filename?: string;
  /** Show header with controls */
  showHeader?: boolean;
  /** Show thumbnail sidebar */
  showThumbnails?: boolean;
  /** Initial slide (0-indexed) */
  initialSlide?: number;
  /** Callback when slide changes */
  onSlideChange?: (slideIndex: number) => void;
  /** Callback to close viewer */
  onClose?: () => void;
  /** Callback to download */
  onDownload?: () => void;
  /** Height of the viewer */
  height?: string | number;
  /** Dark mode override */
  darkMode?: boolean;
  /** Class name for container */
  className?: string;
}

type ViewerState = 'idle' | 'loading' | 'ready' | 'error';

// ─── Zoom Levels ────────────────────────────────────────────────────────────

const ZOOM_LEVELS = [
  { value: 0, label: 'Fit' },
  { value: 0.5, label: '50%' },
  { value: 0.75, label: '75%' },
  { value: 1, label: '100%' },
  { value: 1.5, label: '150%' },
  { value: 2, label: '200%' },
];

// ─── Component ──────────────────────────────────────────────────────────────

export function PptxViewer({
  file,
  presentation: externalPresentation,
  filename = 'presentation.pptx',
  showHeader = true,
  showThumbnails = true,
  initialSlide = 0,
  onSlideChange,
  onClose,
  onDownload,
  height = '100%',
  darkMode,
  className,
}: PptxViewerProps) {
  // State
  const [state, setState] = useState<ViewerState>(externalPresentation ? 'ready' : 'idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [presentation, setPresentation] = useState<PptxPresentation | null>(externalPresentation || null);
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [zoom, setZoom] = useState(0); // 0 = fit
  const [sidebarOpen, setSidebarOpen] = useState(showThumbnails);
  const [fullscreen, setFullscreen] = useState(false);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const mainAreaRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0.8);
  
  // Detect dark mode — reactive to OS theme changes
  const [systemDark, setSystemDark] = useState<boolean>(() =>
    typeof window !== 'undefined' &&
    (document.documentElement.getAttribute('data-theme') === 'dark' ||
     window.matchMedia?.('(prefers-color-scheme: dark)').matches)
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const isDark = darkMode ?? systemDark;
  
  // Parse file when provided
  useEffect(() => {
    if (!file || externalPresentation) return;
    
    const pptxFile = file; // capture narrowed value for use inside async function
    let cancelled = false;
    
    async function parse() {
      setState('loading');
      setProgress(0);
      setErrorMessage('');
      
      try {
        const result = await parsePptx(pptxFile, (msg, pct) => {
          if (!cancelled) {
            setProgressMessage(msg);
            setProgress(pct);
          }
        });
        
        if (!cancelled) {
          setPresentation(result);
          setState('ready');
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to parse presentation');
          setState('error');
        }
      }
    }
    
    parse();
    
    return () => {
      cancelled = true;
    };
  }, [file, externalPresentation]);
  
  // Update from external presentation
  useEffect(() => {
    if (externalPresentation) {
      setPresentation(externalPresentation);
      setState('ready');
    }
  }, [externalPresentation]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (presentation && !externalPresentation) {
        cleanupPptxPresentation(presentation);
      }
    };
  }, [presentation, externalPresentation]);
  
  // Calculate fit scale when container resizes
  useEffect(() => {
    if (!presentation || !mainAreaRef.current) return;
    
    const calculateFitScale = () => {
      const container = mainAreaRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const slideWidthPx = emuToPx(presentation.slideWidth);
      const slideHeightPx = emuToPx(presentation.slideHeight);
      
      const padding = 48;
      const scaleX = (rect.width - padding) / slideWidthPx;
      const scaleY = (rect.height - padding) / slideHeightPx;
      
      setFitScale(Math.min(scaleX, scaleY, 2));
    };
    
    calculateFitScale();
    
    const observer = new ResizeObserver(calculateFitScale);
    observer.observe(mainAreaRef.current);
    
    return () => observer.disconnect();
  }, [presentation]);
  
  // Sync initialSlide prop changes from parent after mount
  useEffect(() => {
    setCurrentSlide(initialSlide);
  }, [initialSlide]);

  // Slide navigation
  const goToSlide = useCallback((index: number) => {
    if (!presentation) return;
    const newIndex = Math.max(0, Math.min(presentation.slides.length - 1, index));
    setCurrentSlide(newIndex);
    onSlideChange?.(newIndex);
  }, [presentation, onSlideChange]);

  // Keyboard navigation
  useEffect(() => {
    if (state !== 'ready' || !presentation) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept keystrokes when user is typing in a form element
      const target = e.target as HTMLElement;
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
        target.isContentEditable
      ) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          goToSlide(Math.max(0, currentSlide - 1));
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          goToSlide(Math.min(presentation.slides.length - 1, currentSlide + 1));
          break;
        case 'Home':
          goToSlide(0);
          break;
        case 'End':
          goToSlide(presentation.slides.length - 1);
          break;
        case 'Escape':
          if (fullscreen) setFullscreen(false);
          else onClose?.();
          break;
        case '1': case '2': case '3': case '4': case '5':
        case '6': case '7': case '8': case '9':
          const slideNum = parseInt(e.key, 10) - 1;
          if (slideNum < presentation.slides.length) {
            goToSlide(slideNum);
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, presentation, currentSlide, fullscreen, onClose, goToSlide]);
  
  // Calculate effective scale
  const effectiveScale = useMemo(() => {
    return zoom === 0 ? fitScale : zoom;
  }, [zoom, fitScale]);
  
  // Thumbnail scale (for sidebar)
  const thumbnailScale = useMemo(() => {
    if (!presentation) return 0.15;
    const slideWidthPx = emuToPx(presentation.slideWidth);
    return 180 / slideWidthPx;
  }, [presentation]);
  
  // Theme tokens
  const T = useMemo(() => ({
    bg: isDark ? '#0a0a0c' : '#f8f9fa',
    cardBg: isDark ? '#111114' : '#ffffff',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    text: isDark ? '#f0f0f3' : '#111111',
    muted: isDark ? '#71717a' : '#6b7280',
    primary: '#6366f1',
    viewerBg: isDark ? '#06060a' : '#e5e7eb',
  }), [isDark]);
  
  // ─── Render Loading ───────────────────────────────────────────────────────
  
  if (state === 'loading') {
    return (
      <div
        className={className}
        style={{
          height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          background: T.bg,
          color: T.text,
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: T.primary }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>{progressMessage}</p>
          <div style={{
            width: '200px',
            height: '4px',
            borderRadius: '2px',
            background: T.border,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: T.primary,
              borderRadius: '2px',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <p style={{ fontSize: '12px', color: T.muted, marginTop: '8px' }}>{progress}%</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  
  // ─── Render Error ─────────────────────────────────────────────────────────
  
  if (state === 'error') {
    return (
      <div
        className={className}
        style={{
          height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          background: T.bg,
          color: T.text,
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <div style={{
          padding: '12px 20px',
          background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)',
          borderRadius: '8px',
          border: '1px solid rgba(239,68,68,0.2)',
          color: '#ef4444',
          fontSize: '14px',
        }}>
          {errorMessage}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: T.cardBg,
              border: `1px solid ${T.border}`,
              borderRadius: '6px',
              color: T.text,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        )}
      </div>
    );
  }
  
  // ─── Render Idle (no file) ────────────────────────────────────────────────
  
  if (state === 'idle' || !presentation) {
    return (
      <div
        className={className}
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: T.bg,
          color: T.muted,
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: '14px',
        }}
      >
        No presentation loaded
      </div>
    );
  }
  
  // ─── Render Ready ─────────────────────────────────────────────────────────
  
  const totalSlides = presentation.slides.length;
  const currentSlideData = presentation.slides[currentSlide];
  
  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        height,
        display: 'flex',
        flexDirection: 'column',
        background: T.bg,
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: 'hidden',
        ...(fullscreen && {
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          height: '100vh',
        }),
      }}
    >
      {/* Header */}
      {showHeader && (
        <div style={{
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          borderBottom: `1px solid ${T.border}`,
          background: T.cardBg,
          flexShrink: 0,
        }}>
          {/* Left: Close + Sidebar toggle + Filename */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  padding: '6px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: T.muted,
                  display: 'flex',
                }}
                title="Close"
              >
                <X size={18} />
              </button>
            )}
            {showThumbnails && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  padding: '6px 10px',
                  background: sidebarOpen ? T.border : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: T.text,
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                Slides
              </button>
            )}
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: T.text,
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {filename}
            </span>
          </div>
          
          {/* Center: Slide navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => goToSlide(currentSlide - 1)}
              disabled={currentSlide === 0}
              style={{
                padding: '6px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
                opacity: currentSlide === 0 ? 0.3 : 1,
                color: T.text,
                display: 'flex',
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <span style={{
              fontSize: '12px',
              color: T.muted,
              minWidth: '80px',
              textAlign: 'center',
            }}>
              {currentSlide + 1} / {totalSlides}
            </span>
            <button
              onClick={() => goToSlide(currentSlide + 1)}
              disabled={currentSlide === totalSlides - 1}
              style={{
                padding: '6px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: currentSlide === totalSlides - 1 ? 'not-allowed' : 'pointer',
                opacity: currentSlide === totalSlides - 1 ? 0.3 : 1,
                color: T.text,
                display: 'flex',
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          
          {/* Right: Zoom + Fullscreen + Download */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <select
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              style={{
                padding: '4px 8px',
                background: T.cardBg,
                border: `1px solid ${T.border}`,
                borderRadius: '4px',
                color: T.text,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {ZOOM_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
            <button
              onClick={() => {
                const currentIdx = ZOOM_LEVELS.findIndex(l => l.value === zoom);
                if (currentIdx > 0) setZoom(ZOOM_LEVELS[currentIdx - 1].value);
              }}
              style={{
                padding: '6px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                color: T.muted,
                display: 'flex',
              }}
              title="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={() => {
                const currentIdx = ZOOM_LEVELS.findIndex(l => l.value === zoom);
                if (currentIdx < ZOOM_LEVELS.length - 1) setZoom(ZOOM_LEVELS[currentIdx + 1].value);
              }}
              style={{
                padding: '6px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                color: T.muted,
                display: 'flex',
              }}
              title="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={() => setFullscreen(!fullscreen)}
              style={{
                padding: '6px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                color: T.muted,
                display: 'flex',
              }}
              title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            {onDownload && (
              <button
                onClick={onDownload}
                style={{
                  padding: '6px 10px',
                  background: T.primary,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Download size={14} />
                Download
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Thumbnail sidebar */}
        {sidebarOpen && showThumbnails && (
          <div style={{
            width: '220px',
            borderRight: `1px solid ${T.border}`,
            background: T.cardBg,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '12px',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {presentation.slides.map((slide, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  style={{
                    padding: '4px',
                    background: idx === currentSlide ? T.border : 'transparent',
                    border: idx === currentSlide 
                      ? `2px solid ${T.primary}` 
                      : `1px solid ${T.border}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '4px',
                  }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: T.muted,
                      minWidth: '18px',
                    }}>
                      {idx + 1}
                    </span>
                    <div style={{
                      width: '180px',
                      overflow: 'hidden',
                      borderRadius: '2px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}>
                      <SlideRenderer
                        slide={slide}
                        slideWidth={presentation.slideWidth}
                        slideHeight={presentation.slideHeight}
                        scale={thumbnailScale}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Main slide view */}
        <div
          ref={mainAreaRef}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: T.viewerBg,
            overflow: 'auto',
            padding: '24px',
          }}
        >
          {currentSlideData && (
            <div style={{
              animation: 'fadeIn 0.2s ease-out',
            }}>
              <SlideRenderer
                slide={currentSlideData}
                slideWidth={presentation.slideWidth}
                slideHeight={presentation.slideHeight}
                scale={effectiveScale}
              />
            </div>
          )}
        </div>
      </div>
      
      <style>{VIEWER_KEYFRAMES}</style>
    </div>
  );
}

// ─── Static keyframes (defined once outside the component) ───────────────────
const VIEWER_KEYFRAMES = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default PptxViewer;

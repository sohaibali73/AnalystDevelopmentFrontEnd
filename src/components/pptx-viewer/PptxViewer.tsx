'use client';

/**
 * PptxViewer — High-fidelity PPTX viewer powered by pptx-preview.
 *
 * pptx-preview renders slides as HTML into a DOM container using
 * init(element, options).preview(arrayBuffer). This gives pixel-accurate
 * slide rendering without any server-side conversion.
 *
 * Features:
 *  - Accurate slide rendering (text, shapes, images, gradients, backgrounds)
 *  - Built-in filmstrip / slide navigation provided by the library
 *  - Header with filename, fullscreen toggle, close + download buttons
 *  - Keyboard shortcut: Escape = close / exit fullscreen
 *  - Responsive: resizes canvas when container changes
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Download, Maximize2, Minimize2, Loader2 } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PptxViewerProps {
  /** Blob / File containing the .pptx bytes */
  file?: Blob | File | null;
  /** Display name shown in the header */
  filename?: string;
  /** Show the top control bar */
  showHeader?: boolean;
  /** Zero-indexed slide to open first (currently informational) */
  initialSlide?: number;
  /** Fired whenever the active slide changes */
  onSlideChange?: (slideIndex: number) => void;
  /** Called when the × button is clicked */
  onClose?: () => void;
  /** Called when the Download button is clicked */
  onDownload?: () => void;
  /** CSS height of the entire viewer */
  height?: string | number;
  /** Override system dark-mode detection */
  darkMode?: boolean;
  /** Extra className on the root div */
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PptxViewer({
  file,
  filename = 'presentation.pptx',
  showHeader = true,
  onClose,
  onDownload,
  height = '100%',
  darkMode,
  className,
}: PptxViewerProps) {
  const [arrayBuffer, setArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [fullscreen, setFullscreen]   = useState(false);
  const [containerW, setContainerW]   = useState(800);

  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef   = useRef<HTMLDivElement>(null);

  // ── Dark-mode detection ────────────────────────────────────────────────
  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      document.documentElement.getAttribute('data-theme') === 'dark' ||
      window.matchMedia?.('(prefers-color-scheme: dark)').matches
    );
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const isDark = darkMode ?? systemDark;

  // ── Convert Blob → ArrayBuffer ─────────────────────────────────────────
  useEffect(() => {
    if (!file) { setArrayBuffer(null); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    file
      .arrayBuffer()
      .then(ab => { if (!cancelled) { setArrayBuffer(ab); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError('Failed to read presentation file'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [file]);

  // ── Measure container width for responsive slide sizing ────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerW(Math.floor(entry.contentRect.width) || 800);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [fullscreen]);

  // ── Render slides via pptx-preview ────────────────────────────────────
  useEffect(() => {
    if (!arrayBuffer || !previewRef.current) return;
    const el = previewRef.current;

    // Compute slide canvas dimensions (16:9 ratio)
    const HEADER_H = showHeader ? 48 : 0;
    const availW = Math.max(containerW, 400);
    const slideW = availW;
    const slideH = Math.round(slideW * (9 / 16));

    // Clear previous render
    el.innerHTML = '';

    let cancelled = false;

    import('pptx-preview')
      .then(mod => {
        if (cancelled || !previewRef.current) return;
        // The library exports { init }
        const initFn = (mod as any).init ?? (mod as any).default?.init ?? (mod as any).default;
        if (typeof initFn !== 'function') {
          setError('Preview library could not be initialised');
          return;
        }
        const previewer = initFn(el, { width: slideW, height: slideH });
        if (typeof previewer?.preview === 'function') {
          // Clone buffer so it's not detached on next render
          previewer.preview(arrayBuffer.slice(0));
        }
      })
      .catch(err => {
        console.error('pptx-preview failed:', err);
        if (!cancelled) setError('Could not load preview');
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrayBuffer, containerW, showHeader]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (fullscreen) setFullscreen(false);
      else onClose?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fullscreen, onClose]);

  // ── Theme tokens ───────────────────────────────────────────────────────
  const T = {
    bg:     isDark ? '#0a0a0c'                 : '#f3f4f6',
    cardBg: isDark ? '#111114'                 : '#ffffff',
    border: isDark ? 'rgba(255,255,255,0.08)'  : 'rgba(0,0,0,0.08)',
    text:   isDark ? '#f0f0f3'                 : '#111111',
    muted:  isDark ? '#71717a'                 : '#6b7280',
    accent: '#D24726',
    viewer: isDark ? '#06060a'                 : '#f0f0f0',
  };

  const rootStyle: React.CSSProperties = {
    height,
    display: 'flex',
    flexDirection: 'column',
    background: T.bg,
    fontFamily: "'Inter', system-ui, sans-serif",
    overflow: 'hidden',
    ...(fullscreen ? {
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      height: '100vh',
    } : {}),
  };

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading || (file && !arrayBuffer && !error)) {
    return (
      <div className={className} style={{ ...rootStyle, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Loader2 size={28} style={{ color: T.accent, animation: 'pv-spin 1s linear infinite' }} />
        <span style={{ fontSize: 13, color: T.muted }}>Loading presentation…</span>
        <style>{`@keyframes pv-spin { to { transform:rotate(360deg) } }`}</style>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={className} style={{ ...rootStyle, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{
          padding: '10px 18px', borderRadius: 8,
          border: '1px solid rgba(239,68,68,0.25)',
          background: 'rgba(239,68,68,0.08)',
          color: '#ef4444', fontSize: 13,
        }}>
          ⚠ {error}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.cardBg, color: T.text, fontSize: 12, cursor: 'pointer' }}
          >
            Close
          </button>
        )}
      </div>
    );
  }

  // ── No file ────────────────────────────────────────────────────────────
  if (!file) {
    return (
      <div className={className} style={{ ...rootStyle, alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 13, color: T.muted }}>No presentation loaded</span>
      </div>
    );
  }

  // ── Ready ──────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className={className} style={rootStyle}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      {showHeader && (
        <div style={{
          height: 48, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 12px',
          background: T.cardBg,
          borderBottom: `1px solid ${T.border}`,
        }}>
          {/* Left: close + icon + filename */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {onClose && (
              <button
                onClick={onClose}
                title="Close"
                style={{ padding: 6, background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', color: T.muted, display: 'flex', flexShrink: 0 }}
              >
                <X size={18} />
              </button>
            )}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <rect x="3" y="3" width="18" height="14" rx="2" fill={T.accent} opacity="0.14" stroke={T.accent} strokeWidth="1.5" />
              <path d="M8 10h3a1.5 1.5 0 0 1 0 3H8V7h3a1.5 1.5 0 0 1 0 3" stroke={T.accent} strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span style={{
              fontSize: 13, fontWeight: 600, color: T.text,
              maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {filename}
            </span>
          </div>

          {/* Right: fullscreen + download */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => setFullscreen(f => !f)}
              title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              style={{ padding: 6, background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', color: T.muted, display: 'flex' }}
            >
              {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            {onDownload && (
              <button
                onClick={onDownload}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 13px', borderRadius: 6, border: 'none',
                  background: T.accent, color: '#fff',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Download size={13} />
                Download
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Slide render area ────────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflow: 'auto',
        background: T.viewer,
        display: 'flex',
        justifyContent: 'center',
      }}>
        {/* pptx-preview mounts its HTML here */}
        <div
          ref={previewRef}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
}

export default PptxViewer;

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
 *  - Graceful fallback when pptx-preview fails or renders nothing
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
  /** Public download URL (used for Office Online fallback link) */
  downloadUrl?: string;
}

type RenderStatus = 'idle' | 'loading' | 'rendering' | 'success' | 'failed';

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
  downloadUrl,
}: PptxViewerProps) {
  const [arrayBuffer, setArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [blobError, setBlobError]     = useState<string | null>(null);
  const [fullscreen, setFullscreen]   = useState(false);
  const [containerW, setContainerW]   = useState(0);
  const [renderStatus, setRenderStatus] = useState<RenderStatus>('idle');

  const containerRef  = useRef<HTMLDivElement>(null);
  const previewRef    = useRef<HTMLDivElement>(null);
  const previewerRef  = useRef<any>(null);
  const renderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (!file) { setArrayBuffer(null); setBlobError(null); setRenderStatus('idle'); return; }
    let cancelled = false;
    setRenderStatus('loading');
    setBlobError(null);
    file
      .arrayBuffer()
      .then(ab => {
        if (!cancelled) {
          setArrayBuffer(ab);
          setRenderStatus('rendering');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBlobError('Failed to read presentation file');
          setRenderStatus('failed');
        }
      });
    return () => { cancelled = true; };
  }, [file]);

  // ── Measure container width for responsive slide sizing ────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width);
      if (w > 0) setContainerW(w);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [fullscreen]);

  // ── Render slides via pptx-preview ────────────────────────────────────
  useEffect(() => {
    if (!arrayBuffer || !previewRef.current || containerW < 100) return;

    const el = previewRef.current;
    let cancelled = false;

    // Destroy previous previewer instance
    if (previewerRef.current?.destroy) {
      try { previewerRef.current.destroy(); } catch { /* ignore */ }
      previewerRef.current = null;
    }

    // Clear previous render
    el.innerHTML = '';

    // Compute slide canvas dimensions (16:9 ratio)
    const HEADER_H = showHeader ? 48 : 0;
    const availW   = Math.min(Math.max(containerW, 400), 1280);
    const slideW   = availW;
    const slideH   = Math.round(slideW * (9 / 16));

    setRenderStatus('rendering');

    // Timeout guard — if nothing renders in 12s, show fallback
    if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
    renderTimerRef.current = setTimeout(() => {
      if (!cancelled && renderStatus !== 'success') {
        // Check if library actually inserted any slide nodes
        const hasSlides = el.querySelector('[class*="slide"], [class*="pptx"], canvas, svg') !== null;
        if (!hasSlides) {
          setRenderStatus('failed');
        }
      }
    }, 12000);

    import('pptx-preview')
      .then(mod => {
        if (cancelled || !previewRef.current) return;
        const initFn = (mod as any).init ?? (mod as any).default?.init ?? (mod as any).default;
        if (typeof initFn !== 'function') {
          if (!cancelled) setRenderStatus('failed');
          return;
        }

        try {
          const previewer = initFn(el, { width: slideW, height: slideH });
          previewerRef.current = previewer;

          if (typeof previewer?.preview === 'function') {
            // Clone buffer so it's not detached on next render
            const renderPromise = previewer.preview(arrayBuffer.slice(0));

            // After preview resolves, check if anything was actually rendered
            Promise.resolve(renderPromise)
              .then(() => {
                if (cancelled) return;
                // Give the DOM a tick to paint
                setTimeout(() => {
                  if (cancelled) return;
                  const hasContent = el.querySelector('[class*="slide"], [class*="pptx"], canvas, svg, img') !== null;
                  // Also check if the wrapper has children beyond the nav buttons
                  const wrapper = el.querySelector('.pptx-preview-wrapper');
                  const childCount = wrapper ? wrapper.children.length : 0;
                  if (hasContent || childCount > 2) {
                    setRenderStatus('success');
                  } else {
                    setRenderStatus('failed');
                  }
                  if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
                }, 500);
              })
              .catch(() => {
                if (!cancelled) setRenderStatus('failed');
                if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
              });
          } else {
            if (!cancelled) setRenderStatus('failed');
          }
        } catch (err) {
          console.error('pptx-preview init error:', err);
          if (!cancelled) setRenderStatus('failed');
        }
      })
      .catch(err => {
        console.error('pptx-preview load error:', err);
        if (!cancelled) setRenderStatus('failed');
        if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
      });

    return () => {
      cancelled = true;
      if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
    };
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
  if (renderStatus === 'loading' || (file && !arrayBuffer && !blobError)) {
    return (
      <div className={className} style={{ ...rootStyle, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Loader2 size={28} style={{ color: T.accent, animation: 'pv-spin 1s linear infinite' }} />
        <span style={{ fontSize: 13, color: T.muted }}>Loading presentation…</span>
        <style>{`@keyframes pv-spin { to { transform:rotate(360deg) } }`}</style>
      </div>
    );
  }

  // ── Blob error state ───────────────────────────────────────────────────
  if (blobError) {
    return (
      <div className={className} style={{ ...rootStyle, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{
          padding: '10px 18px', borderRadius: 8,
          border: '1px solid rgba(239,68,68,0.25)',
          background: 'rgba(239,68,68,0.08)',
          color: '#ef4444', fontSize: 13,
        }}>
          ⚠ {blobError}
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

  // ── Fallback UI (render failed) ────────────────────────────────────────
  const FallbackPanel = () => {
    const officeOnlineUrl = downloadUrl
      ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(downloadUrl)}`
      : null;

    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 16, padding: '32px 24px', background: T.viewer,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: isDark ? 'rgba(210,71,38,0.12)' : 'rgba(210,71,38,0.08)',
          border: `1px solid rgba(210,71,38,0.2)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="14" rx="2" fill={T.accent} opacity="0.14" stroke={T.accent} strokeWidth="1.5" />
            <path d="M8 10h3a1.5 1.5 0 0 1 0 3H8V7h3a1.5 1.5 0 0 1 0 3" stroke={T.accent} strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>

        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6 }}>
            Inline preview unavailable
          </div>
          <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
            This presentation uses advanced formatting that can't be rendered in the browser.
            Download the file to view it in PowerPoint or Keynote.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {onDownload && (
            <button
              onClick={onDownload}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 8, border: 'none',
                background: T.accent, color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                boxShadow: `0 4px 12px rgba(210,71,38,0.3)`,
              }}
            >
              <Download size={14} />
              Download PPTX
            </button>
          )}
          {offlineOnlineUrl(officeOnlineUrl)}
        </div>
      </div>
    );
  };

  function offlineOnlineUrl(url: string | null) {
    if (!url) return null;
    // Only show Office Online link if the URL looks publicly accessible
    const isPublic = url.startsWith('http') && !url.includes('localhost') && !url.includes('127.0.0.1');
    if (!isPublic) return null;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '9px 18px', borderRadius: 8,
          border: `1px solid ${T.border}`,
          background: 'transparent', color: T.muted,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          textDecoration: 'none',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        Open in Office Online
      </a>
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
        flexDirection: 'column',
        justifyContent: 'flex-start',
        position: 'relative',
      }}>
        {/* Rendering spinner overlay — shown while pptx-preview is working */}
        {renderStatus === 'rendering' && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 12, background: T.viewer,
          }}>
            <Loader2 size={24} style={{ color: T.accent, animation: 'pv-spin 1s linear infinite' }} />
            <span style={{ fontSize: 12, color: T.muted }}>Rendering slides…</span>
            <style>{`@keyframes pv-spin { to { transform:rotate(360deg) } }`}</style>
          </div>
        )}

        {/* Fallback panel — shown when render failed */}
        {renderStatus === 'failed' && <FallbackPanel />}

        {/* pptx-preview mounts its HTML here — always in DOM so library can write to it */}
        <div
          ref={previewRef}
          style={{
            width: '100%',
            // Hide the raw library output while rendering or if failed
            visibility: renderStatus === 'success' ? 'visible' : 'hidden',
            position: renderStatus === 'success' ? 'relative' : 'absolute',
          }}
        />

        {/* Override the library's hard-coded black background */}
        <style>{`
          .pptx-preview-wrapper {
            background: ${isDark ? '#1a1a1e' : '#ffffff'} !important;
            margin: 0 auto !important;
          }
          .pptx-preview-wrapper-next {
            background: rgba(100,100,100,0.7) !important;
          }
        `}</style>
      </div>
    </div>
  );
}

export default PptxViewer;

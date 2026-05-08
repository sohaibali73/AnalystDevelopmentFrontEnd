'use client';

/**
 * PptxViewer — High-fidelity PPTX viewer powered by our in-house parser.
 *
 * Renders slides using `parsePptx` (JSZip + DOMParser) and `SlideRenderer`
 * (the same engine used by StudioSlidePreview). This avoids the flaky
 * `pptx-preview` library which often produces empty output and triggers
 * the "Inline preview unavailable" fallback.
 *
 * Features:
 *  - Accurate slide rendering (text, shapes, images, gradients, backgrounds)
 *  - Slide navigation (prev / next buttons, ← / → keys, slide counter)
 *  - Optional thumbnail filmstrip
 *  - Header with filename, fullscreen toggle, close + download buttons
 *  - Keyboard shortcut: Escape = close / exit fullscreen
 *  - Responsive: resizes when container changes
 *  - Graceful error fallback when parsing fails
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Download, Maximize2, Minimize2, Loader2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import {
  parsePptx,
  cleanupPptxPresentation,
  emuToPx,
  type PptxPresentation,
} from '@/lib/pptx-parser';
import { SlideRenderer } from './SlideRenderer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PptxViewerProps {
  /** Blob / File containing the .pptx bytes */
  file?: Blob | File | null;
  /** Display name shown in the header */
  filename?: string;
  /** Show the top control bar */
  showHeader?: boolean;
  /** Zero-indexed slide to open first */
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
  /** Public download URL (used for Office Online fallback link in error state) */
  downloadUrl?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PptxViewer({
  file,
  filename = 'presentation.pptx',
  showHeader = true,
  initialSlide = 0,
  onSlideChange,
  onClose,
  onDownload,
  height = '100%',
  darkMode,
  className,
  downloadUrl,
}: PptxViewerProps) {
  const [pres, setPres]         = useState<PptxPresentation | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [active, setActive]     = useState(initialSlide);
  const [fullscreen, setFullscreen] = useState(false);
  const [stageW, setStageW]     = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef     = useRef<HTMLDivElement>(null);

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

  // ── Parse PPTX ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!file) {
      setPres(null);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    let parsedRef: PptxPresentation | null = null;
    setLoading(true);
    setError(null);
    setActive(initialSlide || 0);

    (async () => {
      try {
        const parsed = await parsePptx(file);
        if (cancelled) {
          cleanupPptxPresentation(parsed);
          return;
        }
        parsedRef = parsed;
        setPres(parsed);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to parse presentation');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (parsedRef) cleanupPptxPresentation(parsedRef);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // ── Notify slide changes ───────────────────────────────────────────────
  useEffect(() => {
    onSlideChange?.(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // ── Measure stage width ────────────────────────────────────────────────
  useEffect(() => {
    if (!stageRef.current) return;
    const el = stageRef.current;
    const initial = el.clientWidth || el.getBoundingClientRect().width;
    if (initial > 0) setStageW(Math.floor(initial));
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width || (entry.target as HTMLElement).clientWidth);
      if (w > 0) setStageW(w);
    });
    ro.observe(el);
    const raf = requestAnimationFrame(() => {
      const w = Math.floor(el.clientWidth);
      if (w > 0) setStageW((prev) => (prev === 0 ? w : prev));
    });
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [pres, fullscreen]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (e.key === 'Escape') {
        if (fullscreen) setFullscreen(false);
        else onClose?.();
        return;
      }
      if (!pres) return;
      if (e.key === 'ArrowRight') setActive((i) => Math.min(i + 1, pres.slides.length - 1));
      if (e.key === 'ArrowLeft')  setActive((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fullscreen, onClose, pres]);

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

  // ── No file ────────────────────────────────────────────────────────────
  if (!file) {
    return (
      <div className={className} style={{ ...rootStyle, alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 13, color: T.muted }}>No presentation loaded</span>
      </div>
    );
  }

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={className} style={{ ...rootStyle, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Loader2 size={28} style={{ color: T.accent, animation: 'pv-spin 1s linear infinite' }} />
        <span style={{ fontSize: 13, color: T.muted }}>Loading presentation…</span>
        <style>{`@keyframes pv-spin { to { transform:rotate(360deg) } }`}</style>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error || !pres) {
    const officeOnlineUrl = downloadUrl
      ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(downloadUrl)}`
      : null;
    const isPublic = officeOnlineUrl && downloadUrl?.startsWith('http') && !downloadUrl.includes('localhost') && !downloadUrl.includes('127.0.0.1');

    return (
      <div className={className} style={{ ...rootStyle, alignItems: 'center', justifyContent: 'center', gap: 14, padding: '32px 24px' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: isDark ? 'rgba(210,71,38,0.12)' : 'rgba(210,71,38,0.08)',
          border: `1px solid rgba(210,71,38,0.25)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlertCircle size={26} color={T.accent} />
        </div>
        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6 }}>
            Couldn't render presentation
          </div>
          <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
            {error ?? 'The presentation file could not be parsed.'}
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
          {isPublic && officeOnlineUrl && (
            <a
              href={officeOnlineUrl}
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
              Open in Office Online
            </a>
          )}
        </div>
      </div>
    );
  }

  // ── Ready: render slides ───────────────────────────────────────────────
  const total      = pres.slides.length;
  const slide      = pres.slides[Math.min(active, total - 1)];
  const nativeWpx  = emuToPx(pres.slideWidth);
  const stagePad   = 24;
  // Reserve space for filmstrip & nav
  const targetW    = Math.max(0, stageW - stagePad * 2);
  const scale      = targetW > 0 && nativeWpx > 0 ? Math.min(1, targetW / nativeWpx) : 0;

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

          {/* Right: slide counter + fullscreen + download */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {total > 1 && (
              <span style={{ fontSize: 11, color: T.muted, fontFamily: "'DM Mono', monospace", letterSpacing: '0.05em' }}>
                {active + 1} / {total}
              </span>
            )}
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

      {/* ── Stage ────────────────────────────────────────────────────────── */}
      <div
        ref={stageRef}
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: stagePad,
          background: T.viewer,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {scale > 0 && slide && (
          <div
            style={{
              position: 'relative',
              borderRadius: 8,
              overflow: 'hidden',
              boxShadow: isDark
                ? '0 18px 50px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05)'
                : '0 18px 50px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)',
            }}
          >
            <SlideRenderer
              slide={slide}
              slideWidth={pres.slideWidth}
              slideHeight={pres.slideHeight}
              scale={scale}
            />
          </div>
        )}

        {/* Nav arrows */}
        {total > 1 && (
          <>
            <NavBtn
              side="left"
              disabled={active === 0}
              onClick={() => setActive((i) => Math.max(0, i - 1))}
              theme={T}
            />
            <NavBtn
              side="right"
              disabled={active === total - 1}
              onClick={() => setActive((i) => Math.min(total - 1, i + 1))}
              theme={T}
            />
          </>
        )}
      </div>

      {/* ── Filmstrip ────────────────────────────────────────────────────── */}
      {total > 1 && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '10px 14px',
            borderTop: `1px solid ${T.border}`,
            background: T.cardBg,
            overflowX: 'auto',
            overflowY: 'hidden',
            flexShrink: 0,
          }}
        >
          {pres.slides.map((s, i) => {
            const isActive = i === active;
            const thumbW = 110;
            const thumbScale = nativeWpx > 0 ? thumbW / nativeWpx : 0;
            return (
              <button
                key={i}
                onClick={() => setActive(i)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  padding: 2,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    borderRadius: 4,
                    overflow: 'hidden',
                    border: isActive ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
                    boxShadow: isActive ? `0 0 12px rgba(210,71,38,0.4)` : 'none',
                    transition: 'all 0.15s ease',
                    background: '#fff',
                  }}
                >
                  {thumbScale > 0 && (
                    <SlideRenderer
                      slide={s}
                      slideWidth={pres.slideWidth}
                      slideHeight={pres.slideHeight}
                      scale={thumbScale}
                    />
                  )}
                </div>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9,
                    letterSpacing: '0.1em',
                    color: isActive ? T.accent : T.muted,
                    textTransform: 'uppercase',
                  }}
                >
                  {i + 1}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Nav button ──────────────────────────────────────────────────────────────

function NavBtn({
  side,
  onClick,
  disabled,
  theme,
}: {
  side: 'left' | 'right';
  onClick: () => void;
  disabled: boolean;
  theme: { cardBg: string; border: string; text: string; muted: string };
}) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={side === 'left' ? 'Previous slide' : 'Next slide'}
      style={{
        position: 'absolute',
        [side]: 14,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: theme.cardBg,
        border: `1px solid ${theme.border}`,
        color: disabled ? theme.muted : theme.text,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 0.9,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s ease',
        boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
        zIndex: 4,
      } as React.CSSProperties}
    >
      <Icon size={18} />
    </button>
  );
}

export default PptxViewer;

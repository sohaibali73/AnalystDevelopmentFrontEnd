'use client';

/**
 * StudioSlidePreview — robust client-side PPTX renderer for the workspace
 * preview pane.
 *
 *   - Uses parsePptx from @/lib/pptx-parser (JSZip + DOMParser, no external lib)
 *   - Renders each slide via the project's existing SlideRenderer
 *   - Filmstrip on the side, large slide on the right
 *   - Auto-scales to container width
 *   - Resilient: shows a clean fallback panel if parsing fails
 */

import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, AlertCircle } from 'lucide-react';
import { parsePptx, cleanupPptxPresentation, type PptxPresentation, emuToPx } from '@/lib/pptx-parser';
import { SlideRenderer } from '@/components/pptx-viewer/SlideRenderer';
import { studioTheme as T } from './theme';
import { Spinner, StudioButton } from './StudioPrimitives';

interface Props {
  blob: Blob | null;
  filename?: string;
  onDownload?: () => void;
}

export function StudioSlidePreview({ blob, filename, onDownload }: Props) {
  const [pres, setPres] = useState<PptxPresentation | null>(null);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stageW, setStageW] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);

  // ── Parse the .pptx ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    let parsedRef: PptxPresentation | null = null;
    setError(null);
    setLoading(true);
    setActive(0);
    if (!blob) return;

    (async () => {
      try {
        const parsed = await parsePptx(blob);
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
  }, [blob]);

  // ── Measure container (works whether parent uses flex or fixed sizing) ──
  useEffect(() => {
    if (!stageRef.current) return;
    const el = stageRef.current;
    // Initial measurement
    const initial = el.clientWidth || el.getBoundingClientRect().width;
    if (initial > 0) setStageW(Math.floor(initial));

    const ro = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width || (entry.target as HTMLElement).clientWidth);
      if (w > 0) setStageW(w);
    });
    ro.observe(el);

    // Fallback: re-measure after first paint in case ResizeObserver missed it
    const raf = requestAnimationFrame(() => {
      const w = Math.floor(el.clientWidth);
      if (w > 0) setStageW((prev) => (prev === 0 ? w : prev));
    });
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [pres]);

  // ── Keyboard nav ───────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!pres) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (e.key === 'ArrowRight') setActive((i) => Math.min(i + 1, pres.slides.length - 1));
      if (e.key === 'ArrowLeft') setActive((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pres]);

  if (loading) {
    return (
      <Center>
        <Spinner size={28} />
        <span style={{ color: T.textMuted, fontSize: 13 }}>Loading slides…</span>
      </Center>
    );
  }

  if (error || !pres) {
    return (
      <Center>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: T.errorDim,
            border: `1px solid ${T.errorBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
          }}
        >
          <AlertCircle size={26} color={T.error} />
        </div>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 16, color: T.text, marginBottom: 6 }}>
          Couldn't render slides
        </div>
        <div style={{ fontSize: 12, color: T.textMuted, maxWidth: 320, textAlign: 'center', marginBottom: 18 }}>
          {error ?? 'The presentation file could not be parsed.'}
        </div>
        {onDownload && (
          <StudioButton iconLeft={<Download size={14} />} onClick={onDownload}>
            Download {filename ?? '.pptx'}
          </StudioButton>
        )}
      </Center>
    );
  }

  const total = pres.slides.length;
  const slide = pres.slides[active];
  const slideAspect = pres.slideHeight / pres.slideWidth; // h/w

  // Padding around the stage
  const stagePad = 32;
  const targetW = Math.max(0, stageW - stagePad * 2);
  const nativeWpx = emuToPx(pres.slideWidth);
  const scale = targetW > 0 && nativeWpx > 0 ? Math.min(1, targetW / nativeWpx) : 0;

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: T.bg,
        overflow: 'hidden',
      }}
    >
      {/* Stage */}
      <div
        ref={stageRef}
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: stagePad,
          position: 'relative',
        }}
      >
        {scale > 0 && slide && (
          <div
            style={{
              boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
              borderRadius: 8,
              overflow: 'hidden',
              animation: 'studio-fadein 0.2s ease-out',
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
            <NavBtn side="left" disabled={active === 0} onClick={() => setActive((i) => Math.max(0, i - 1))} />
            <NavBtn side="right" disabled={active === total - 1} onClick={() => setActive((i) => Math.min(total - 1, i + 1))} />
          </>
        )}

        {/* Slide counter */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            padding: '4px 10px',
            background: T.bgRaised,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            fontFamily: T.fontMono,
            fontSize: 11,
            letterSpacing: '0.08em',
            color: T.textMuted,
          }}
        >
          {active + 1} / {total}
        </div>
      </div>

      {/* Filmstrip */}
      {total > 1 && (
        <div
          className="studio-scroll"
          style={{
            display: 'flex',
            gap: 10,
            padding: '12px 16px',
            borderTop: `1px solid ${T.border}`,
            background: T.bgChat,
            overflowX: 'auto',
            overflowY: 'hidden',
            flexShrink: 0,
          }}
        >
          {pres.slides.map((s, i) => {
            const isActive = i === active;
            const thumbW = 140;
            const thumbScale = thumbW / nativeWpx;
            return (
              <button
                key={i}
                onClick={() => setActive(i)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: 4,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    borderRadius: 6,
                    overflow: 'hidden',
                    border: isActive ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
                    boxShadow: isActive ? `0 0 16px ${T.accentGlow}` : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <SlideRenderer
                    slide={s}
                    slideWidth={pres.slideWidth}
                    slideHeight={pres.slideHeight}
                    scale={thumbScale}
                  />
                </div>
                <span
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 9,
                    letterSpacing: '0.1em',
                    color: isActive ? T.accent : T.textMuted,
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

function NavBtn({
  side,
  onClick,
  disabled,
}: {
  side: 'left' | 'right';
  onClick: () => void;
  disabled: boolean;
}) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={side === 'left' ? 'Previous slide' : 'Next slide'}
      style={{
        position: 'absolute',
        [side]: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: T.bgRaised,
        border: `1px solid ${T.border}`,
        color: disabled ? T.textMuted : T.text,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 0.9,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s ease',
        boxShadow: T.shadowDeep,
        zIndex: 4,
      } as React.CSSProperties}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = T.bgCard;
        e.currentTarget.style.borderColor = T.accentBorder;
        e.currentTarget.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = T.bgRaised;
        e.currentTarget.style.borderColor = T.border;
        e.currentTarget.style.opacity = '0.9';
      }}
    >
      <Icon size={18} />
    </button>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 32,
      }}
    >
      {children}
    </div>
  );
}

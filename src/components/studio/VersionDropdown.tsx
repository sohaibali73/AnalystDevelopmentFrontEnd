'use client';

import React from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, Layers } from 'lucide-react';
import { studioTheme as T, relativeTime } from './theme';
import type { StudioArtifact } from '@/lib/studioApi';

interface Props {
  artifacts: StudioArtifact[];
  current: StudioArtifact | null;
  onSelect: (a: StudioArtifact) => void;
}

export function VersionDropdown({ artifacts, current, onSelect }: Props) {
  const [open, setOpen] = React.useState(false);
  const [anchor, setAnchor] = React.useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const sorted = [...artifacts].sort((a, b) => b.version - a.version);

  React.useEffect(() => {
    if (!open) return;
    const update = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (r) {
        const dropdownW = Math.max(240, r.width);
        setAnchor({ top: r.bottom + 6, left: Math.max(8, r.right - dropdownW), width: dropdownW });
      }
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  if (artifacts.length === 0) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          background: 'rgba(245,158,11,0.08)',
          color: T.text,
          border: '1px solid rgba(245,158,11,0.20)',
          borderRadius: 10,
          cursor: 'pointer',
          fontFamily: T.fontDisplay,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.04em',
        }}
      >
        <Layers size={14} color={T.accent} />
        {current ? `v${current.version}` : 'Versions'}
        <ChevronDown size={14} />
      </button>
      {open && anchor && typeof document !== 'undefined' && ReactDOM.createPortal(
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
          />
          <div
            className="studio-scroll"
            style={{
              position: 'fixed',
              top: anchor.top,
              left: anchor.left,
              width: anchor.width,
              maxHeight: 360,
              overflowY: 'auto',
              background: T.bgRaised,
              border: `1px solid rgba(255,255,255,0.10)`,
              borderRadius: 12,
              boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
              zIndex: 9999,
              padding: 4,
              animation: 'studio-fadein 0.15s ease-out',
            }}
          >
            {sorted.map((a) => {
              const active = current?.id === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    onSelect(a);
                    setOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 2,
                    padding: '10px 12px',
                    background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    color: T.text,
                    textAlign: 'left',
                    fontFamily: T.font,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = 'rgba(245,158,11,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span
                    style={{
                      fontFamily: T.fontDisplay,
                      fontSize: 13,
                      fontWeight: 600,
                      color: active ? T.accent : T.text,
                    }}
                  >
                    v{a.version} · {a.kind.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 11, color: T.textDim }}>
                    {relativeTime(a.created_at)}
                    {a.slide_count != null && ` · ${a.slide_count} slides`}
                    {a.page_count != null && ` · ${a.page_count} pages`}
                  </span>
                </button>
              );
            })}
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}

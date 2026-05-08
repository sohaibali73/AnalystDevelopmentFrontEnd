'use client';

/**
 * PreviewPane — renders the right-hand pane of the workspace.
 * For PPTX it uses the existing PptxViewer (pptx-preview based).
 * For DOCX it uses docx-preview's renderAsync into a container ref.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Download, FileText, Presentation as PresentationIcon } from 'lucide-react';
import { studioApi, type StudioArtifact } from '@/lib/studioApi';
import { studioTheme as T, formatBytes } from './theme';
import { Spinner, StudioButton } from './StudioPrimitives';
import { StudioSlidePreview } from './StudioSlidePreview';
import { toast } from 'sonner';

interface Props {
  projectId: string;
  artifact: StudioArtifact | null;
  onDownload?: () => void;
}

export function PreviewPane({ projectId, artifact, onDownload }: Props) {
  if (!artifact) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 18,
          color: T.textDim,
          padding: 32,
          textAlign: 'center',
          background:
            `radial-gradient(ellipse at 50% 30%, var(--accent-dim, rgba(245,158,11,0.05)) 0%, transparent 70%), ${T.bg}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            maskImage:
              'radial-gradient(ellipse at 50% 50%, #000 30%, transparent 75%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at 50% 50%, #000 30%, transparent 75%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'relative',
            width: 104,
            height: 104,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(245,158,11,0.18), rgba(245,158,11,0.04) 70%)',
            border: '1px dashed rgba(245,158,11,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 60px rgba(245,158,11,0.20)',
          }}
        >
          <PresentationIcon size={42} color={T.accent} style={{ opacity: 0.85 }} />
        </div>
        <div style={{ maxWidth: 380, position: 'relative' }}>
          <h3
            style={{
              fontFamily: T.fontDisplay,
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              color: T.text,
              marginBottom: 8,
            }}
          >
            Your canvas is ready
          </h3>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: T.textSoft }}>
            Ask YANG to build a deck or document. New versions appear here
            automatically with smooth previews and full edit history.
          </p>
        </div>
      </div>
    );
  }

  return artifact.kind === 'pptx' ? (
    <PptxPreview projectId={projectId} artifact={artifact!} onDownload={onDownload} />
  ) : (
    <DocxPreview projectId={projectId} artifact={artifact!} onDownload={onDownload} />
  );
}

// ─── PPTX preview ──────────────────────────────────────────────────────

function PptxPreview({ projectId, artifact, onDownload }: Props & { artifact: StudioArtifact }) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    studioApi
      .downloadArtifact(projectId, artifact.id)
      .then((b) => {
        if (!cancelled) {
          setBlob(b);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.message || 'Failed to load preview');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, artifact!.id]);

  if (loading) {
    return (
      <div style={centerStyle}>
        <Spinner size={28} />
        <span style={{ color: T.textDim, fontSize: 13 }}>Loading slides…</span>
      </div>
    );
  }
  if (error) {
    return <div style={{ ...centerStyle, color: '#FCA5A5' }}>{error}</div>;
  }
  if (!blob) return null;

  return (
    <StudioSlidePreview
      blob={blob}
      filename={artifact.filename}
      onDownload={onDownload}
    />
  );
}

// ─── DOCX preview ──────────────────────────────────────────────────────

function DocxPreview({ projectId, artifact, onDownload }: Props & { artifact: StudioArtifact }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const blob = await studioApi.downloadArtifact(projectId, artifact.id);
        if (cancelled) return;
        if (!containerRef.current) return;
        containerRef.current.innerHTML = '';
        const docxPreview = await import('docx-preview');
        await docxPreview.renderAsync(blob, containerRef.current, undefined, {
          className: 'studio-docx',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          experimental: false,
          useBase64URL: true,
        });
        if (!cancelled) setLoading(false);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to render document');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, artifact.id]);

  return (
    <div
      className="studio-scroll"
      style={{
        height: '100%',
        overflowY: 'auto',
        background:
          `radial-gradient(ellipse at 50% 0%, rgba(96,165,250,0.08) 0%, rgba(99,102,241,0.05) 30%, transparent 70%), ${T.bg}`,
        position: 'relative',
      }}
    >
      {/* Dot grid */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage:
            'radial-gradient(ellipse at 50% 30%, #000 30%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at 50% 30%, #000 30%, transparent 80%)',
          pointerEvents: 'none',
        }}
      />
      {loading && (
        <div
          style={{
            ...centerStyle,
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            background: T.bg,
            opacity: 0.85,
            backdropFilter: 'blur(6px)',
          }}
        >
          <Spinner size={28} />
          <span style={{ color: T.textDim, fontSize: 13 }}>Rendering document…</span>
        </div>
      )}
      {error && <div style={{ ...centerStyle, color: '#FCA5A5' }}>{error}</div>}
      <div
        ref={containerRef}
        style={{
          padding: '36px 24px 60px',
          minHeight: '100%',
          color: '#000',
          position: 'relative',
          zIndex: 1,
        }}
      />
      <style jsx global>{`
        .studio-docx {
          color: #1a1a1c;
        }
        .studio-docx .docx-wrapper {
          background: transparent !important;
          padding: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          gap: 24px !important;
        }
        .studio-docx section.docx {
          margin: 0 !important;
          background: #ffffff !important;
          box-shadow:
            0 24px 60px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.06),
            0 0 50px rgba(96, 165, 250, 0.08) !important;
          color: #1a1a1c !important;
          border-radius: 6px !important;
          overflow: hidden !important;
        }
      `}</style>
    </div>
  );
}

const centerStyle: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: 12,
};

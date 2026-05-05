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
          gap: 16,
          color: T.textDim,
          padding: 32,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: 'rgba(245,158,11,0.05)',
            border: '1px dashed rgba(245,158,11,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PresentationIcon size={36} color={T.accent} style={{ opacity: 0.5 }} />
        </div>
        <div style={{ maxWidth: 340 }}>
          <h3 style={{ fontFamily: T.fontDisplay, fontSize: 18, color: T.text, marginBottom: 6 }}>
            No artifacts yet
          </h3>
          <p style={{ fontSize: 13, lineHeight: 1.5 }}>
            Ask the assistant to build a deck or document for you. New versions will appear here automatically.
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
    <div style={{ height: '100%', overflowY: 'auto', background: '#1a1a1c', position: 'relative' }}>
      {loading && (
        <div style={{ ...centerStyle, position: 'absolute', inset: 0, zIndex: 2, background: 'rgba(0,0,0,0.5)' }}>
          <Spinner size={28} />
          <span style={{ color: T.textDim, fontSize: 13 }}>Rendering document…</span>
        </div>
      )}
      {error && <div style={{ ...centerStyle, color: '#FCA5A5' }}>{error}</div>}
      <div
        ref={containerRef}
        style={{
          padding: '24px',
          minHeight: '100%',
          color: '#000',
        }}
      />
      <style jsx global>{`
        .studio-docx {
          color: #1a1a1c;
        }
        .studio-docx .docx-wrapper {
          background: transparent !important;
          padding: 0 !important;
        }
        .studio-docx section.docx {
          margin: 0 auto 24px !important;
          background: #fff !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
          color: #1a1a1c !important;
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

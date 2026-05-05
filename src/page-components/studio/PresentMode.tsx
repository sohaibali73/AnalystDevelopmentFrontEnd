'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { studioApi, type StudioArtifact } from '@/lib/studioApi';
import { studioTheme as T } from '@/components/studio/theme';
import { Spinner } from '@/components/studio/StudioPrimitives';
import { PptxViewer } from '@/components/pptx-viewer/PptxViewer';

export default function PresentMode() {
  const params = useParams();
  const router = useRouter();
  const pid = params?.id as string;
  const aid = params?.aid as string;
  const [blob, setBlob] = useState<Blob | null>(null);
  const [artifact, setArtifact] = useState<StudioArtifact | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [a, b] = await Promise.all([
          studioApi.getArtifact(pid, aid),
          studioApi.downloadArtifact(pid, aid),
        ]);
        if (cancelled) return;
        setArtifact(a.artifact);
        setBlob(b);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pid, aid]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') router.push(`/studio/projects/${pid}`);
      if (e.key.toLowerCase() === 'f') {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pid, router]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <button
        onClick={() => router.push(`/studio/projects/${pid}`)}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="Exit present mode"
      >
        <X size={18} />
      </button>

      {error && (
        <div style={{ color: '#FCA5A5', textAlign: 'center', marginTop: 80 }}>{error}</div>
      )}
      {!blob && !error && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            gap: 12,
          }}
        >
          <Spinner size={28} color="#fff" />
          Loading…
        </div>
      )}
      {blob && (
        <div style={{ flex: 1, position: 'relative' }}>
          <PptxViewer
            file={blob}
            filename={artifact?.filename ?? 'presentation.pptx'}
            showHeader={false}
            height="100%"
          />
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.5)',
          fontFamily: T.fontMono,
          fontSize: 11,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          padding: '6px 14px',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: 8,
          backdropFilter: 'blur(8px)',
        }}
      >
        ← / → · F = Fullscreen · Esc = Exit
      </div>
    </div>
  );
}

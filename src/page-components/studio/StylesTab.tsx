'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Mic2, Sparkles } from 'lucide-react';
import { studioApi, onStudioRefresh, type StudioStyle } from '@/lib/studioApi';
import { studioTheme as T, relativeTime } from '@/components/studio/theme';
import { StudioBadge, StudioButton, Spinner } from '@/components/studio/StudioPrimitives';

export function StylesTab() {
  const router = useRouter();
  const [styles, setStyles] = useState<StudioStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await studioApi.listStyles();
      setStyles(r.styles);
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => onStudioRefresh((d) => d.scope === 'styles' && load()), [load]);

  if (loading && styles.length === 0) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 180,
              background: T.bgCard,
              border: '1px solid rgba(245,158,11,0.08)',
              borderRadius: 14,
            }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 24,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 12,
          color: '#FCA5A5',
        }}
      >
        {error}
      </div>
    );
  }

  if (styles.length === 0) {
    return (
      <div
        style={{
          padding: '60px 24px',
          background: 'rgba(245,158,11,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
          textAlign: 'center',
        }}
      >
        <Mic2 size={42} style={{ color: T.accent, marginBottom: 16 }} />
        <h3 style={{ fontFamily: T.fontDisplay, fontSize: 24, marginBottom: 8 }}>
          Train your first voice clone
        </h3>
        <p style={{ color: T.textDim, marginBottom: 22, maxWidth: 460, margin: '0 auto 22px' }}>
          Paste 3+ samples of someone's writing and we'll learn their cadence, vocabulary,
          and idiosyncrasies. Then attach the voice to any project.
        </p>
        <StudioButton iconLeft={<Sparkles size={16} />} onClick={() => router.push('/studio/styles/new')}>
          Create voice
        </StudioButton>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
      {styles.map((s) => (
        <StyleCard key={s.id} style={s} onClick={() => router.push(`/studio/styles/${s.id}`)} />
      ))}
    </div>
  );
}

function StyleCard({ style, onClick }: { style: StudioStyle; onClick: () => void }) {
  const statusColor =
    style.status === 'ready' ? 'green' :
    style.status === 'analyzing' ? 'gold' :
    style.status === 'failed' ? 'red' : 'gray';

  const fidelityPct = style.fidelity_score != null ? Math.round(style.fidelity_score * 100) : null;
  const cardColor = style.color || '#A78BFA';

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        background: T.bgCard,
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: 20,
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(245,158,11,0.30)';
        e.currentTarget.style.boxShadow = `0 12px 36px ${cardColor}33`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${cardColor}33 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `${cardColor}22`,
            border: `1px solid ${cardColor}55`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}
        >
          {style.icon || '🎙️'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: T.fontDisplay,
              fontSize: 17,
              fontWeight: 700,
              color: T.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {style.name}
          </div>
          <div style={{ fontSize: 11, color: T.textDim }}>{relativeTime(style.updated_at)}</div>
        </div>
        <StudioBadge color={statusColor as any}>{style.status}</StudioBadge>
      </div>

      {style.description && (
        <p
          style={{
            fontSize: 13,
            color: T.textDim,
            margin: '0 0 14px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {style.description}
        </p>
      )}

      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: T.textDim, marginBottom: 12 }}>
        <span>{style.sample_count} samples</span>
        <span>·</span>
        <span>{style.total_words.toLocaleString()} words</span>
      </div>

      {fidelityPct !== null && style.status === 'ready' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
            <span style={{ color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Fidelity
            </span>
            <span style={{ color: T.accent, fontWeight: 600 }}>{fidelityPct}%</span>
          </div>
          <div
            style={{
              height: 6,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${fidelityPct}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${cardColor}, ${T.accent})`,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      )}

      {style.status === 'analyzing' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.accent, fontSize: 12 }}>
          <Spinner size={12} />
          <span>Analyzing voice…</span>
        </div>
      )}
    </div>
  );
}

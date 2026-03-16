'use client';
import React, { useState } from 'react';
import { FileDown, Presentation, ChevronDown, ChevronUp, StickyNote, LayoutGrid, Columns2, Square } from 'lucide-react';

interface SlidePreview {
  number: number;
  title: string;
  bullet_count: number;
  layout: string;
  has_notes: boolean;
  preview_text: string;
}

interface PresentationCardProps {
  success?: boolean;
  error?: string;
  presentation_id?: string;
  filename?: string;
  title?: string;
  subtitle?: string;
  theme?: string;
  template_used?: string;
  template_id?: string;
  author?: string;
  slide_count?: number;
  file_size_kb?: number;
  slides?: SlidePreview[];
  download_url?: string;
  fetch_time_ms?: number;
}

const themeColors: Record<string, { bg: string; accent: string; text: string; muted: string }> = {
  potomac:   { bg: '#121212', accent: '#FEC00F', text: '#FFFFFF', muted: '#9E9E9E' },
  dark:      { bg: '#1E1E2E', accent: '#82AAFF', text: '#E0E0E0', muted: '#9E9E9E' },
  light:     { bg: '#FFFFFF', accent: '#3B82F6', text: '#212121', muted: '#757575' },
  corporate: { bg: '#F8F9FA', accent: '#0066CC', text: '#1A1A2E', muted: '#666666' },
};

export function PresentationCard(props: PresentationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!props.success && props.error) {
    return (
      <div style={{ padding: '16px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '12px', color: '#ef4444' }}>
        Presentation Error: {props.error}
      </div>
    );
  }

  const theme = themeColors[props.theme || 'potomac'] || themeColors.potomac;
  const slides = props.slides || [];

  const handleDownload = async () => {
    if (!props.download_url) return;
    setDownloading(true);
    try {
      const token = localStorage.getItem('auth_token') || '';
      const resp = await fetch(`/api/presentation/${props.presentation_id}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });
      if (!resp.ok) throw new Error('Download failed');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = props.filename || 'presentation.pptx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const layoutIcon = (layout: string) => {
    switch (layout) {
      case 'two_column': return <Columns2 size={12} />;
      case 'blank': return <Square size={12} />;
      default: return <LayoutGrid size={12} />;
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      borderRadius: '16px',
      padding: '20px',
      color: '#fff',
      maxWidth: '620px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: `linear-gradient(135deg, ${theme.accent}33, ${theme.accent}11)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Presentation size={18} color={theme.accent} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: theme.accent }}>{props.title}</div>
          {props.subtitle && (
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{props.subtitle}</div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{props.slide_count} slides</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{props.file_size_kb} KB</div>
        </div>
      </div>

      {/* Mini slide preview strip */}
      <div style={{
        display: 'flex', gap: '6px', marginBottom: '14px', overflowX: 'auto',
        paddingBottom: '4px',
      }}>
        {/* Title slide thumbnail */}
        <div style={{
          minWidth: '80px', height: '50px', borderRadius: '6px',
          background: theme.bg, border: `1.5px solid ${theme.accent}44`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '4px', flexShrink: 0,
        }}>
          <div style={{ width: '40px', height: '1px', background: theme.accent, marginBottom: '3px' }} />
          <div style={{ fontSize: '6px', fontWeight: 700, color: theme.accent, textAlign: 'center', lineHeight: 1.1 }}>
            {(props.title || '').slice(0, 18)}
          </div>
        </div>
        {slides.slice(0, 6).map((s, i) => (
          <div key={i} style={{
            minWidth: '80px', height: '50px', borderRadius: '6px',
            background: theme.bg, border: '1px solid rgba(255,255,255,0.08)',
            padding: '4px 6px', flexShrink: 0, overflow: 'hidden',
          }}>
            <div style={{ fontSize: '6px', fontWeight: 600, color: theme.accent, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {s.title}
            </div>
            {s.preview_text && (
              <div style={{ fontSize: '5px', color: theme.text, opacity: 0.5, lineHeight: 1.2, overflow: 'hidden', maxHeight: '24px' }}>
                • {s.preview_text.slice(0, 50)}
              </div>
            )}
          </div>
        ))}
        {slides.length > 6 && (
          <div style={{
            minWidth: '40px', height: '50px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', color: 'rgba(255,255,255,0.4)', flexShrink: 0,
          }}>
            +{slides.length - 6}
          </div>
        )}
      </div>

      {/* Info row */}
      <div style={{
        display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap',
      }}>
        {props.template_used ? (
          <span style={{
            fontSize: '10px', padding: '3px 8px', borderRadius: '4px',
            background: 'rgba(16,185,129,0.2)', color: '#10b981', fontWeight: 600,
          }}>
            🎨 BRAND TEMPLATE: {props.template_used}
          </span>
        ) : (
          <span style={{
            fontSize: '10px', padding: '3px 8px', borderRadius: '4px',
            background: `${theme.accent}22`, color: theme.accent, fontWeight: 600,
          }}>
            {props.theme?.toUpperCase()} THEME
          </span>
        )}
        <span style={{
          fontSize: '10px', padding: '3px 8px', borderRadius: '4px',
          background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
        }}>
          by {props.author}
        </span>
        {props.fetch_time_ms && (
          <span style={{
            fontSize: '10px', padding: '3px 8px', borderRadius: '4px',
            background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)',
          }}>
            {props.fetch_time_ms}ms
          </span>
        )}
      </div>

      {/* Expandable slide list */}
      {slides.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px',
              padding: '4px 0',
            }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Hide' : 'Show'} slide details
          </button>

          {expanded && (
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {slides.map((s, i) => (
                <div key={i} style={{
                  padding: '8px 10px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.04)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, color: theme.accent,
                    minWidth: '20px', textAlign: 'center',
                  }}>
                    {s.number}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{s.title}</div>
                    {s.preview_text && (
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                        • {s.preview_text}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {layoutIcon(s.layout)}
                    {s.bullet_count > 0 && (
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>{s.bullet_count} pts</span>
                    )}
                    {s.has_notes && <StickyNote size={10} color="rgba(255,255,255,0.3)" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={downloading || !props.download_url}
        style={{
          width: '100%', padding: '12px', borderRadius: '10px',
          background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}CC)`,
          color: theme.bg === '#FFFFFF' ? '#fff' : '#121212',
          border: 'none', cursor: downloading ? 'wait' : 'pointer',
          fontWeight: 700, fontSize: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          opacity: downloading ? 0.7 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        <FileDown size={16} />
        {downloading ? 'Downloading...' : `Download ${props.filename || 'Presentation'}`}
      </button>
    </div>
  );
}

export default PresentationCard;

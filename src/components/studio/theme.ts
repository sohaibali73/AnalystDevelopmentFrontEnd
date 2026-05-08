/**
 * Studio "Dark Forge" theme — exact tokens shared across the entire studio surface.
 *
 *   - Gold/amber primary accent (#F59E0B)
 *   - Layered dark backgrounds (#0A0A0B → #0C0C0E → #0D0D10 → #111114)
 *   - Three-font stack: Syne (display), Inter (body), DM Mono (metadata/caps)
 *   - 6% opacity borders, 0.15s ease-out transitions, snappy micro-interactions
 */

export const studioTheme = {
  // Fonts
  fontDisplay: "'Syne', sans-serif",
  font: "'Inter', system-ui, sans-serif",
  fontMono: "'DM Mono', ui-monospace, monospace",

  // Backgrounds — driven by ThemeContext CSS variables so studio respects
  // light/dark + theme-style switches (default, midnight, ocean, forest, …)
  bg: 'var(--bg, #0A0A0B)',
  bgChat: 'var(--bg, #0C0C0E)',
  bgCard: 'var(--bg-card, #0D0D10)',
  bgRaised: 'var(--bg-raised, #111114)',
  bgInput: 'var(--bg-card, rgba(12,12,14,0.9))',
  bgCardHover: 'var(--bg-card-hover, rgba(255,255,255,0.04))',

  // Text — driven by CSS variables
  text: 'var(--text, #F5F5F7)',
  textSoft: 'var(--text, #C4C4CC)',
  textMuted: 'var(--text-muted, #8B8B95)',
  textDim: 'var(--text-dim, #8B8B95)',

  // Borders
  border: 'var(--border, rgba(255,255,255,0.06))',
  borderHover: 'var(--border-hover, rgba(255,255,255,0.10))',
  inputBorder: 'var(--border, rgba(255,255,255,0.06))',

  // Primary accent — driven by ThemeContext accent (so accent-color picker works)
  accent: 'var(--accent, #F59E0B)',
  accentDim: 'var(--accent-dim, rgba(245,158,11,0.10))',
  accentGlow: 'var(--accent-glow, rgba(245,158,11,0.25))',
  accentBorder: 'var(--border-hover, rgba(245,158,11,0.30))',


  // Secondary accent — indigo (Yang ring, scrollbars, file drop)
  accent2: '#6366F1',
  accent2Dim: 'rgba(99,102,241,0.15)',
  accent2Glow: 'rgba(99,102,241,0.25)',

  // Shadows
  shadowCard: '0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04)',
  shadowDeep: '0 12px 40px rgba(0,0,0,0.55)',

  // Semantic
  error: '#EF4444',
  errorDim: 'rgba(239,68,68,0.10)',
  errorBorder: 'rgba(239,68,68,0.20)',

  success: '#10B981',
  successDim: 'rgba(16,185,129,0.12)',
  successBorder: 'rgba(16,185,129,0.30)',

  warning: '#FBBF24',
  warningDim: 'rgba(251,191,36,0.12)',
} as const;

export function relativeTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 86400 * 7) return `${Math.floor(sec / 86400)}d ago`;
  return d.toLocaleDateString();
}

export function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Inject global keyframes + scrollbar once ───────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('studio-globals')) {
  const style = document.createElement('style');
  style.id = 'studio-globals';
  style.textContent = `
    @keyframes studio-spin { to { transform: rotate(360deg); } }
    @keyframes studio-fadein {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes studio-shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    @keyframes studio-pulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
    @keyframes studio-wave {
      0%   { transform: scaleY(0.4); opacity: 0.45; }
      50%  { transform: scaleY(1.0); opacity: 1; }
      100% { transform: scaleY(0.4); opacity: 0.45; }
    }
    @keyframes studio-text-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @keyframes studio-orbit {
      0%   { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes studio-ring-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(99,102,241,0.45), 0 0 20px rgba(99,102,241,0.5); }
      70%  { box-shadow: 0 0 0 12px rgba(99,102,241,0); 0 0 28px rgba(99,102,241,0.55); }
      100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); 0 0 20px rgba(99,102,241,0.5); }
    }
    .studio-shimmer-text {
      background: linear-gradient(
        90deg,
        rgba(245,158,11,0.4) 0%,
        rgba(245,158,11,1) 50%,
        rgba(245,158,11,0.4) 100%
      );
      background-size: 200% 100%;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: studio-text-shimmer 1.6s linear infinite;
    }
    .studio-fadein { animation: studio-fadein 0.15s ease-out; }
    .studio-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
    .studio-scroll::-webkit-scrollbar-track { background: transparent; }
    .studio-scroll::-webkit-scrollbar-thumb {
      background: rgba(99,102,241,0.15);
      border-radius: 6px;
      border: 2px solid transparent;
      background-clip: padding-box;
    }
    .studio-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(99,102,241,0.30);
      background-clip: padding-box;
    }
  `;
  document.head.appendChild(style);
}

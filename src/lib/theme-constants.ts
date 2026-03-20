/**
 * Centralized theme constants for consistent styling across all pages.
 * Import this in page components instead of defining local color objects.
 */

// Primary accent colors (blue/purple gradient theme)
export const ACCENT_COLORS = {
  primary: '#60A5FA',        // Blue-400
  secondary: '#A78BFA',      // Violet-400
  tertiary: '#818CF8',       // Indigo-400
  success: '#34D399',        // Emerald-400
  warning: '#FBBF24',        // Amber-400
  error: '#F87171',          // Red-400
  info: '#38BDF8',           // Sky-400
} as const;

// Gradient definitions
export const GRADIENTS = {
  primary: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
  secondary: 'linear-gradient(135deg, #A78BFA 0%, #818CF8 100%)',
  success: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
  warm: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
  glow: 'radial-gradient(ellipse at 50% 0%, rgba(96, 165, 250, 0.15) 0%, transparent 60%)',
} as const;

// Get theme colors based on dark/light mode
export function getThemeColors(isDark: boolean) {
  return {
    // Backgrounds
    background: isDark ? '#0A0A0A' : '#FFFFFF',
    backgroundSecondary: isDark ? '#0D0D0D' : '#F8FAFC',
    backgroundTertiary: isDark ? '#111111' : '#F1F5F9',
    
    // Cards & Surfaces
    card: isDark ? '#141414' : '#FFFFFF',
    cardHover: isDark ? '#1A1A1A' : '#F8FAFC',
    cardElevated: isDark ? '#1E1E1E' : '#FFFFFF',
    
    // Borders
    border: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(96, 165, 250, 0.1)',
    borderHover: isDark ? 'rgba(96, 165, 250, 0.3)' : 'rgba(96, 165, 250, 0.25)',
    borderActive: isDark ? 'rgba(96, 165, 250, 0.5)' : 'rgba(96, 165, 250, 0.4)',
    
    // Text
    text: isDark ? '#FFFFFF' : '#0F172A',
    textSecondary: isDark ? '#E2E8F0' : '#334155',
    textMuted: isDark ? '#94A3B8' : '#64748B',
    textDim: isDark ? '#64748B' : '#94A3B8',
    
    // Accent colors
    accent: ACCENT_COLORS.primary,
    accentSecondary: ACCENT_COLORS.secondary,
    accentGlow: isDark ? 'rgba(96, 165, 250, 0.25)' : 'rgba(96, 165, 250, 0.15)',
    accentMuted: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(96, 165, 250, 0.1)',
    
    // Interactive states
    hoverBg: isDark ? 'rgba(96, 165, 250, 0.12)' : 'rgba(96, 165, 250, 0.08)',
    activeBg: isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(96, 165, 250, 0.15)',
    
    // Inputs
    inputBg: isDark ? '#1E1E1E' : '#FFFFFF',
    inputBorder: isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(96, 165, 250, 0.15)',
    inputFocusBorder: ACCENT_COLORS.primary,
    
    // Status colors
    success: ACCENT_COLORS.success,
    warning: ACCENT_COLORS.warning,
    error: ACCENT_COLORS.error,
    info: ACCENT_COLORS.info,
    
    // Gradients
    gradient: GRADIENTS.primary,
    gradientSecondary: GRADIENTS.secondary,
    
    // Shadows
    shadowColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)',
    shadowAccent: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(96, 165, 250, 0.1)',
    
    // Code/Monospace
    codeBg: isDark ? '#1E1E1E' : '#F1F5F9',
    codeText: isDark ? '#E2E8F0' : '#334155',
  };
}

// Animation keyframes as CSS string (for injected styles)
export const ANIMATION_KEYFRAMES = `
  @keyframes theme-fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes theme-fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  
  @keyframes theme-scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1); }
  }
  
  @keyframes theme-slideInLeft {
    from { opacity: 0; transform: translateX(-20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  
  @keyframes theme-slideInRight {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  
  @keyframes theme-shimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  @keyframes theme-pulse {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.5; }
  }
  
  @keyframes theme-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(96, 165, 250, 0.15); }
    50%      { box-shadow: 0 0 30px rgba(96, 165, 250, 0.3); }
  }
`;

// Animation delay classes
export const getAnimationDelayClass = (index: number) => {
  const delays = ['0ms', '50ms', '100ms', '150ms', '200ms', '250ms', '300ms', '350ms', '400ms'];
  return `animation-delay: ${delays[Math.min(index, delays.length - 1)]}`;
};

// Common transition timing
export const TRANSITIONS = {
  fast: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
  normal: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  slow: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  spring: 'all 0.5s cubic-bezier(0.22, 0.68, 0, 1.15)',
} as const;

// Typography
export const FONTS = {
  sans: "'Instrument Sans', system-ui, sans-serif",
  heading: "'Syne', 'Instrument Sans', system-ui, sans-serif",
  mono: "'DM Mono', 'Fira Code', monospace",
} as const;

// Border radius presets
export const RADII = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '18px',
  full: '9999px',
} as const;

// Shadow presets
export function getShadows(isDark: boolean) {
  return {
    sm: isDark 
      ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
      : '0 2px 8px rgba(0, 0, 0, 0.08)',
    md: isDark 
      ? '0 4px 16px rgba(0, 0, 0, 0.4)' 
      : '0 4px 16px rgba(0, 0, 0, 0.1)',
    lg: isDark 
      ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
      : '0 8px 32px rgba(0, 0, 0, 0.12)',
    glow: '0 0 20px rgba(96, 165, 250, 0.2)',
    glowStrong: '0 0 30px rgba(96, 165, 250, 0.35)',
    card: isDark
      ? '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(96, 165, 250, 0.1)'
      : '0 4px 24px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(96, 165, 250, 0.08)',
  };
}

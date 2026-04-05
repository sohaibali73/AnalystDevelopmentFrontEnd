'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '@/lib/storage';

type ThemeMode = 'light' | 'dark' | 'system';
type ThemeStyle = 'default' | 'midnight' | 'ocean' | 'forest' | 'sunset' | 'rose';

interface ThemeContextType {
  theme: ThemeMode;
  themeStyle: ThemeStyle;
  actualTheme: 'light' | 'dark';
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  setThemeStyle: (style: ThemeStyle) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme style configurations
const themeStyles: Record<ThemeStyle, { dark: Record<string, string>; light: Record<string, string> }> = {
  default: {
    dark: {
      '--accent': '#FEC00F',
      '--accent-dim': 'rgba(254,192,15,0.08)',
      '--accent-glow': 'rgba(254,192,15,0.3)',
      '--bg': '#080809',
      '--bg-card': '#0D0D10',
      '--bg-card-hover': '#121216',
      '--bg-raised': '#111115',
      '--border': 'rgba(255,255,255,0.06)',
      '--border-hover': 'rgba(254,192,15,0.4)',
      '--text': '#EFEFEF',
      '--text-muted': '#606068',
      '--text-dim': '#2E2E36',
      '--shadow-card': '0 1px 0 rgba(255,255,255,0.03), 0 4px 24px rgba(0,0,0,0.4)',
    },
    light: {
      '--accent': '#FEC00F',
      '--accent-dim': 'rgba(254,192,15,0.07)',
      '--accent-glow': 'rgba(254,192,15,0.3)',
      '--bg': '#F5F5F6',
      '--bg-card': '#FFFFFF',
      '--bg-card-hover': '#F9F9FA',
      '--bg-raised': '#FAFAFA',
      '--border': 'rgba(0,0,0,0.07)',
      '--border-hover': 'rgba(254,192,15,0.4)',
      '--text': '#0A0A0B',
      '--text-muted': '#808088',
      '--text-dim': '#D8D8DC',
      '--shadow-card': '0 1px 0 rgba(255,255,255,0.9), 0 4px 16px rgba(0,0,0,0.06)',
    },
  },
  midnight: {
    dark: {
      '--accent': '#818CF8',
      '--accent-dim': 'rgba(129,140,248,0.1)',
      '--accent-glow': 'rgba(129,140,248,0.35)',
      '--bg': '#0A0A1A',
      '--bg-card': '#0F0F23',
      '--bg-card-hover': '#141430',
      '--bg-raised': '#12122A',
      '--border': 'rgba(129,140,248,0.12)',
      '--border-hover': 'rgba(129,140,248,0.5)',
      '--text': '#E8E8F0',
      '--text-muted': '#6B6B8A',
      '--text-dim': '#2A2A45',
      '--shadow-card': '0 1px 0 rgba(129,140,248,0.05), 0 4px 24px rgba(0,0,20,0.5)',
    },
    light: {
      '--accent': '#6366F1',
      '--accent-dim': 'rgba(99,102,241,0.08)',
      '--accent-glow': 'rgba(99,102,241,0.3)',
      '--bg': '#F0F0FF',
      '--bg-card': '#FFFFFF',
      '--bg-card-hover': '#F5F5FF',
      '--bg-raised': '#FAFAFF',
      '--border': 'rgba(99,102,241,0.1)',
      '--border-hover': 'rgba(99,102,241,0.4)',
      '--text': '#1A1A2E',
      '--text-muted': '#6B6B8A',
      '--text-dim': '#D0D0E8',
      '--shadow-card': '0 1px 0 rgba(255,255,255,0.9), 0 4px 16px rgba(99,102,241,0.08)',
    },
  },
  ocean: {
    dark: {
      '--accent': '#22D3EE',
      '--accent-dim': 'rgba(34,211,238,0.1)',
      '--accent-glow': 'rgba(34,211,238,0.35)',
      '--bg': '#0A1418',
      '--bg-card': '#0F1C22',
      '--bg-card-hover': '#14252D',
      '--bg-raised': '#122028',
      '--border': 'rgba(34,211,238,0.12)',
      '--border-hover': 'rgba(34,211,238,0.5)',
      '--text': '#E0F4F8',
      '--text-muted': '#5A8A98',
      '--text-dim': '#1E3A45',
      '--shadow-card': '0 1px 0 rgba(34,211,238,0.05), 0 4px 24px rgba(0,10,15,0.5)',
    },
    light: {
      '--accent': '#0891B2',
      '--accent-dim': 'rgba(8,145,178,0.08)',
      '--accent-glow': 'rgba(8,145,178,0.3)',
      '--bg': '#ECFEFF',
      '--bg-card': '#FFFFFF',
      '--bg-card-hover': '#F0FEFF',
      '--bg-raised': '#F5FEFF',
      '--border': 'rgba(8,145,178,0.1)',
      '--border-hover': 'rgba(8,145,178,0.4)',
      '--text': '#0C4A5E',
      '--text-muted': '#5A8A98',
      '--text-dim': '#C0E8F0',
      '--shadow-card': '0 1px 0 rgba(255,255,255,0.9), 0 4px 16px rgba(8,145,178,0.08)',
    },
  },
  forest: {
    dark: {
      '--accent': '#4ADE80',
      '--accent-dim': 'rgba(74,222,128,0.1)',
      '--accent-glow': 'rgba(74,222,128,0.35)',
      '--bg': '#0A1410',
      '--bg-card': '#0F1E18',
      '--bg-card-hover': '#142820',
      '--bg-raised': '#122218',
      '--border': 'rgba(74,222,128,0.12)',
      '--border-hover': 'rgba(74,222,128,0.5)',
      '--text': '#E0F8E8',
      '--text-muted': '#5A9A6A',
      '--text-dim': '#1E4028',
      '--shadow-card': '0 1px 0 rgba(74,222,128,0.05), 0 4px 24px rgba(0,10,5,0.5)',
    },
    light: {
      '--accent': '#16A34A',
      '--accent-dim': 'rgba(22,163,74,0.08)',
      '--accent-glow': 'rgba(22,163,74,0.3)',
      '--bg': '#F0FFF4',
      '--bg-card': '#FFFFFF',
      '--bg-card-hover': '#F5FFF8',
      '--bg-raised': '#FAFFFC',
      '--border': 'rgba(22,163,74,0.1)',
      '--border-hover': 'rgba(22,163,74,0.4)',
      '--text': '#0A3D1A',
      '--text-muted': '#5A9A6A',
      '--text-dim': '#C0E8D0',
      '--shadow-card': '0 1px 0 rgba(255,255,255,0.9), 0 4px 16px rgba(22,163,74,0.08)',
    },
  },
  sunset: {
    dark: {
      '--accent': '#FB923C',
      '--accent-dim': 'rgba(251,146,60,0.1)',
      '--accent-glow': 'rgba(251,146,60,0.35)',
      '--bg': '#140A08',
      '--bg-card': '#1E100E',
      '--bg-card-hover': '#281614',
      '--bg-raised': '#221210',
      '--border': 'rgba(251,146,60,0.12)',
      '--border-hover': 'rgba(251,146,60,0.5)',
      '--text': '#F8EDE8',
      '--text-muted': '#9A7A6A',
      '--text-dim': '#452A20',
      '--shadow-card': '0 1px 0 rgba(251,146,60,0.05), 0 4px 24px rgba(15,5,3,0.5)',
    },
    light: {
      '--accent': '#EA580C',
      '--accent-dim': 'rgba(234,88,12,0.08)',
      '--accent-glow': 'rgba(234,88,12,0.3)',
      '--bg': '#FFF7ED',
      '--bg-card': '#FFFFFF',
      '--bg-card-hover': '#FFFAF5',
      '--bg-raised': '#FFFCFA',
      '--border': 'rgba(234,88,12,0.1)',
      '--border-hover': 'rgba(234,88,12,0.4)',
      '--text': '#431407',
      '--text-muted': '#9A7A6A',
      '--text-dim': '#F0D8C8',
      '--shadow-card': '0 1px 0 rgba(255,255,255,0.9), 0 4px 16px rgba(234,88,12,0.08)',
    },
  },
  rose: {
    dark: {
      '--accent': '#F472B6',
      '--accent-dim': 'rgba(244,114,182,0.1)',
      '--accent-glow': 'rgba(244,114,182,0.35)',
      '--bg': '#140A12',
      '--bg-card': '#1E1018',
      '--bg-card-hover': '#28161E',
      '--bg-raised': '#221218',
      '--border': 'rgba(244,114,182,0.12)',
      '--border-hover': 'rgba(244,114,182,0.5)',
      '--text': '#F8E8F0',
      '--text-muted': '#9A6A80',
      '--text-dim': '#452030',
      '--shadow-card': '0 1px 0 rgba(244,114,182,0.05), 0 4px 24px rgba(15,5,10,0.5)',
    },
    light: {
      '--accent': '#DB2777',
      '--accent-dim': 'rgba(219,39,119,0.08)',
      '--accent-glow': 'rgba(219,39,119,0.3)',
      '--bg': '#FFF1F6',
      '--bg-card': '#FFFFFF',
      '--bg-card-hover': '#FFF5FA',
      '--bg-raised': '#FFFAFC',
      '--border': 'rgba(219,39,119,0.1)',
      '--border-hover': 'rgba(219,39,119,0.4)',
      '--text': '#500724',
      '--text-muted': '#9A6A80',
      '--text-dim': '#F0C8D8',
      '--shadow-card': '0 1px 0 rgba(255,255,255,0.9), 0 4px 16px rgba(219,39,119,0.08)',
    },
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [themeStyle, setThemeStyleState] = useState<ThemeStyle>('default');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');
  const [accentColor, setAccentColorState] = useState<string>('#FEC00F');

  useEffect(() => {
    const savedTheme = storage.getItem('theme') as ThemeMode;
    if (savedTheme) {
      setThemeState(savedTheme);
    }
    const savedThemeStyle = storage.getItem('themeStyle') as ThemeStyle;
    if (savedThemeStyle) {
      setThemeStyleState(savedThemeStyle);
    }
    const savedAccentColor = storage.getItem('accentColor');
    if (savedAccentColor) {
      setAccentColorState(savedAccentColor);
    }
  }, []);

  useEffect(() => {
    const updateActualTheme = () => {
      let resolvedTheme: 'light' | 'dark';

      if (theme === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      } else {
        resolvedTheme = theme as 'light' | 'dark';
      }

      setActualTheme(resolvedTheme);
      document.documentElement.className = resolvedTheme;
      document.documentElement.style.colorScheme = resolvedTheme;
      
      // Apply theme style
      applyThemeStyle(resolvedTheme, themeStyle, accentColor);
    };

    updateActualTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateActualTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, themeStyle, accentColor]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    storage.setItem('theme', newTheme);
  };

  const setThemeStyle = (newStyle: ThemeStyle) => {
    setThemeStyleState(newStyle);
    storage.setItem('themeStyle', newStyle);
  };

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
    storage.setItem('accentColor', color);
    document.documentElement.style.setProperty('--accent-color', color);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      themeStyle,
      actualTheme, 
      resolvedTheme: actualTheme,
      setTheme,
      setThemeStyle,
      accentColor,
      setAccentColor
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Helper function to convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Helper function to apply theme style
function applyThemeStyle(mode: 'light' | 'dark', style: ThemeStyle, accentColor: string) {
  const root = document.documentElement;
  const themeConfig = themeStyles[style][mode];
  
  Object.entries(themeConfig).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  
  // Always apply custom accent color if provided (works for all theme styles)
  if (accentColor) {
    root.style.setProperty('--accent', accentColor);
    root.style.setProperty('--accent-dim', hexToRgba(accentColor, 0.08));
    root.style.setProperty('--accent-glow', hexToRgba(accentColor, 0.3));
    root.style.setProperty('--border-hover', hexToRgba(accentColor, 0.4));
  }
}

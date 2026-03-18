'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '@/lib/storage';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  resolvedTheme: 'light' | 'dark';  // Alias for actualTheme for compatibility
  setTheme: (theme: Theme) => void;
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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');
  const [accentColor, setAccentColorState] = useState<string>('#FEC00F');

  useEffect(() => {
    const savedTheme = storage.getItem('theme') as Theme;
    if (savedTheme) {
      setThemeState(savedTheme);
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
      
      // Apply dashboard-style CSS variables
      applyDashboardTheme(resolvedTheme, accentColor);
    };

    updateActualTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateActualTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, accentColor]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    storage.setItem('theme', newTheme);
  };

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
    storage.setItem('accentColor', color);
    // Apply to CSS variable for global use
    document.documentElement.style.setProperty('--accent-color', color);
    // Re-apply theme with new accent color
    applyDashboardTheme(actualTheme, color);
  };

  useEffect(() => {
    // Apply accent color to CSS variable
    document.documentElement.style.setProperty('--accent-color', accentColor);
    // Apply dashboard theme on initial load
    applyDashboardTheme(actualTheme, accentColor);
  }, [accentColor, actualTheme]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      actualTheme, 
      resolvedTheme: actualTheme,  // Alias for compatibility
      setTheme,
      accentColor,
      setAccentColor
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Helper function to apply dashboard-style CSS variables
function applyDashboardTheme(theme: 'light' | 'dark', accentColor: string) {
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.style.setProperty('--accent', accentColor);
    root.style.setProperty('--accent-dim', 'rgba(254,192,15,0.08)');
    root.style.setProperty('--accent-glow', 'rgba(254,192,15,0.3)');
    root.style.setProperty('--bg', '#080809');
    root.style.setProperty('--bg-card', '#0D0D10');
    root.style.setProperty('--bg-card-hover', '#121216');
    root.style.setProperty('--bg-raised', '#111115');
    root.style.setProperty('--border', 'rgba(255,255,255,0.06)');
    root.style.setProperty('--border-hover', 'rgba(254,192,15,0.4)');
    root.style.setProperty('--text', '#EFEFEF');
    root.style.setProperty('--text-muted', '#606068');
    root.style.setProperty('--text-dim', '#2E2E36');
    root.style.setProperty('--shadow-card', '0 1px 0 rgba(255,255,255,0.03), 0 4px 24px rgba(0,0,0,0.4)');
  } else {
    root.style.setProperty('--accent', accentColor);
    root.style.setProperty('--accent-dim', 'rgba(254,192,15,0.07)');
    root.style.setProperty('--accent-glow', 'rgba(254,192,15,0.3)');
    root.style.setProperty('--bg', '#F5F5F6');
    root.style.setProperty('--bg-card', '#FFFFFF');
    root.style.setProperty('--bg-card-hover', '#F9F9FA');
    root.style.setProperty('--bg-raised', '#FAFAFA');
    root.style.setProperty('--border', 'rgba(0,0,0,0.07)');
    root.style.setProperty('--border-hover', 'rgba(254,192,15,0.4)');
    root.style.setProperty('--text', '#0A0A0B');
    root.style.setProperty('--text-muted', '#808088');
    root.style.setProperty('--text-dim', '#D8D8DC');
    root.style.setProperty('--shadow-card', '0 1px 0 rgba(255,255,255,0.9), 0 4px 16px rgba(0,0,0,0.06)');
  }
}

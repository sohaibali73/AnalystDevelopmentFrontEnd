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
    };

    updateActualTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateActualTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    storage.setItem('theme', newTheme);
  };

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
    storage.setItem('accentColor', color);
    // Apply to CSS variable for global use
    document.documentElement.style.setProperty('--accent-color', color);
  };

  useEffect(() => {
    // Apply accent color to CSS variable
    document.documentElement.style.setProperty('--accent-color', accentColor);
  }, [accentColor]);

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

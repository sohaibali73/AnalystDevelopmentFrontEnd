'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '@/lib/storage';

type FontSize = 'small' | 'medium' | 'large';

interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export const useFontSize = () => {
  const context = useContext(FontSizeContext);
  if (!context) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
};

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');

  useEffect(() => {
    const savedSize = storage.getItem('fontSize') as FontSize;
    if (savedSize) {
      setFontSizeState(savedSize);
      applyFontSize(savedSize);
    }
  }, []);

  const applyFontSize = (size: FontSize) => {
    const root = document.documentElement;
    switch (size) {
      case 'small':
        root.style.fontSize = '14px';
        break;
      case 'medium':
        root.style.fontSize = '16px';
        break;
      case 'large':
        root.style.fontSize = '18px';
        break;
    }
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    storage.setItem('fontSize', size);
    applyFontSize(size);
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
}

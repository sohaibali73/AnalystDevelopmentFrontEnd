import { useState, useEffect } from 'react';

interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

export function useResponsive(): BreakpointState {
  const [state, setState] = useState<BreakpointState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: 1200,
        height: 800,
      };
    }

    const width = window.innerWidth;
    return {
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      width,
      height: window.innerHeight,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setState({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        width,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
}

// Helper function to get responsive styles
export function getResponsiveStyles(
  mobile: React.CSSProperties,
  tablet?: React.CSSProperties,
  desktop?: React.CSSProperties
): React.CSSProperties {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
  
  if (width < 768) {
    return mobile;
  } else if (width < 1024 && tablet) {
    return { ...mobile, ...tablet };
  } else if (desktop) {
    return { ...mobile, ...tablet, ...desktop };
  }
  
  return mobile;
}

// Helper function to get responsive padding
export function getResponsivePadding(): string {
  if (typeof window === 'undefined') return '32px';
  const width = window.innerWidth;
  
  if (width < 768) return '16px';
  if (width < 1024) return '24px';
  return '32px';
}

// Helper function to get responsive font size
export function getResponsiveFontSize(desktop: number): number {
  if (typeof window === 'undefined') return desktop;
  const width = window.innerWidth;
  
  if (width < 768) return desktop * 0.75; // 75% on mobile
  if (width < 1024) return desktop * 0.875; // 87.5% on tablet
  return desktop;
}

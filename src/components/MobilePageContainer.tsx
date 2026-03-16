import React from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/contexts/ThemeContext';

interface MobilePageContainerProps {
  children: React.ReactNode;
  maxWidth?: string;
  noPadding?: boolean;
}

export function MobilePageContainer({ 
  children, 
  maxWidth = '1400px',
  noPadding = false 
}: MobilePageContainerProps) {
  const { isMobile, isTablet } = useResponsive();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const paddingClass = noPadding ? 'p-0' : (
    isMobile ? 'p-4' : (isTablet ? 'p-8' : 'p-12')
  );

  // FIXED: Tailwind can't use dynamic interpolation like max-w-[${maxWidth}]
  // Use inline style for dynamic maxWidth instead
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-white'} transition-colors duration-300`}>
      <div className={`${paddingClass} mx-auto w-full`} style={{ maxWidth }}>
        {children}
      </div>
    </div>
  );
}

interface MobileSectionProps {
  children: React.ReactNode;
  spacing?: 'tight' | 'normal' | 'loose';
}

export function MobileSection({ children, spacing = 'normal' }: MobileSectionProps) {
  const { isMobile, isTablet } = useResponsive();
  
  const spacingClass = spacing === 'tight' 
    ? (isMobile ? 'mb-4' : 'mb-5') 
    : spacing === 'normal'
    ? (isMobile ? 'mb-6' : 'mb-10')
    : (isMobile ? 'mb-8' : 'mb-16');

  return (
    <div className={spacingClass}>
      {children}
    </div>
  );
}

interface MobileGridProps {
  children: React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: string;
  minColumnWidth?: string;
}

export function MobileGrid({ 
  children, 
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap,
  minColumnWidth
}: MobileGridProps) {
  const { isMobile, isTablet } = useResponsive();
  
  // FIXED: Tailwind can't process dynamic class names like grid-cols-${n}
  // Use a lookup map with complete class strings instead
  const colsMap: Record<number, string> = {
    1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4',
  };
  const mdColsMap: Record<number, string> = {
    1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4',
  };
  const lgColsMap: Record<number, string> = {
    1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4',
  };

  const gridClass = minColumnWidth 
    ? `grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3`
    : `grid ${colsMap[columns.mobile || 1]} ${mdColsMap[columns.tablet || 2]} ${lgColsMap[columns.desktop || 3]}`;

  const gapClass = gap || (isMobile ? 'gap-4' : (isTablet ? 'gap-5' : 'gap-6'));

  return (
    <div className={`${gridClass} ${gapClass}`}>
      {children}
    </div>
  );
}

interface MobileCardProps {
  children: React.ReactNode;
  padding?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  hoverable?: boolean;
}

export function MobileCard({ 
  children, 
  padding = 'medium',
  onClick,
  hoverable = false
}: MobileCardProps) {
  const { isMobile, isTablet } = useResponsive();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const paddingClass = padding === 'small'
    ? (isMobile ? 'p-4' : 'p-5')
    : padding === 'medium'
    ? (isMobile ? 'p-5' : 'p-7')
    : (isMobile ? 'p-6' : 'p-10');

  const borderRadiusClass = isMobile ? 'rounded-xl' : 'rounded-2xl';
  const bgColorClass = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const borderColorClass = isDark ? 'border-gray-800' : 'border-gray-200';

  const baseClasses = `${bgColorClass} ${borderColorClass} border ${paddingClass} ${borderRadiusClass} transition-all duration-300 cursor-${onClick ? 'pointer' : 'default'}`;
  
  const hoverClasses = hoverable || onClick 
    ? 'hover:border-yellow-400 hover:shadow-lg hover:-translate-y-1'
    : '';

  return (
    <div 
      onClick={onClick}
      className={`${baseClasses} ${hoverClasses}`}
    >
      {children}
    </div>
  );
}

interface MobileHeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4;
  spacing?: 'tight' | 'normal' | 'loose';
}

export function MobileHeading({ children, level = 1, spacing = 'normal' }: MobileHeadingProps) {
  const { isMobile, isTablet } = useResponsive();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const levelClasses = {
    1: 'text-2xl md:text-3xl lg:text-5xl font-bold tracking-[1.5px]',
    2: 'text-xl md:text-2xl lg:text-3xl font-bold tracking-[1px]',
    3: 'text-lg md:text-xl lg:text-2xl font-semibold tracking-[0.8px]',
    4: 'text-base md:text-lg lg:text-xl font-semibold tracking-[0.5px]',
  };

  const spacingClasses = {
    tight: isMobile ? 'mb-2' : 'mb-2.5',
    normal: isMobile ? 'mb-3' : 'mb-4',
    loose: isMobile ? 'mb-4' : 'mb-6',
  };

  const colorClass = isDark ? 'text-white' : 'text-gray-900';
  const fontClass = 'font-rajdhani';

  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;

  return (
    <Tag className={`${levelClasses[level]} ${colorClass} ${fontClass} ${spacingClasses[spacing]} leading-tight transition-colors duration-300`}>
      {children}
    </Tag>
  );
}

interface MobileTextProps {
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  muted?: boolean;
  spacing?: 'tight' | 'normal' | 'loose';
}

export function MobileText({ 
  children, 
  size = 'medium', 
  muted = false,
  spacing = 'normal'
}: MobileTextProps) {
  const { isMobile } = useResponsive();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const sizeClasses = {
    small: isMobile ? 'text-sm' : 'text-sm',
    medium: isMobile ? 'text-base' : 'text-base',
    large: isMobile ? 'text-lg' : 'text-lg',
  };

  const spacingClasses = {
    tight: 'mb-2',
    normal: 'mb-3',
    loose: 'mb-5',
  };

  const colorClass = muted 
    ? (isDark ? 'text-gray-400' : 'text-gray-600')
    : (isDark ? 'text-white' : 'text-gray-900');

  return (
    <p className={`${sizeClasses[size]} leading-relaxed ${colorClass} ${spacingClasses[spacing]} transition-colors duration-300`}>
      {children}
    </p>
  );
}

interface MobileButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function MobileButton({ 
  children, 
  onClick,
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  size = 'medium',
}: MobileButtonProps) {
  const { isMobile } = useResponsive();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const sizeClasses = {
    small: isMobile ? 'px-4 py-2.5 text-sm h-11' : 'px-5 py-2.5 text-sm h-11',
    medium: isMobile ? 'px-6 py-3.5 text-base h-12.5' : 'px-7 py-3.5 text-base h-12.5',
    large: isMobile ? 'px-7 py-4 text-lg h-14' : 'px-9 py-4 text-lg h-14',
  };

  const variantClasses = {
    primary: 'bg-yellow-400 text-gray-900 border-none shadow-lg hover:shadow-xl hover:-translate-y-0.5',
    secondary: 'bg-transparent text-yellow-400 border border-gray-700 hover:border-yellow-400 hover:bg-yellow-400 hover:text-gray-900',
    ghost: 'bg-transparent text-gray-900 dark:text-white border-none hover:bg-gray-100 dark:hover:bg-gray-800',
  };

  const baseClasses = `inline-flex items-center justify-center gap-2.5 font-rajdhani font-bold tracking-wide rounded-xl transition-all duration-200 ${
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
  } ${fullWidth ? 'w-full' : ''}`;

  const hoverClasses = onClick && !disabled 
    ? variant === 'primary' 
      ? 'hover:shadow-xl hover:-translate-y-0.5' 
      : 'hover:scale-105'
    : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${hoverClasses}`}
    >
      {children}
    </button>
  );
}

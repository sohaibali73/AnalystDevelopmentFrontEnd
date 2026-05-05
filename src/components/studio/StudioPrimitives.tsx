'use client';

/**
 * Studio "Dark Forge" primitives — buttons, inputs, badges, modals, etc.
 * All styling driven by tokens in `theme.ts`.
 */

import React from 'react';
import { studioTheme as T } from './theme';

// ─── Button ─────────────────────────────────────────────────────────────

export function StudioButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  style,
  title,
  iconLeft,
  iconRight,
}: {
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  variant?: 'primary' | 'ghost' | 'outline' | 'danger' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit';
  disabled?: boolean;
  style?: React.CSSProperties;
  title?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}) {
  const padding = size === 'sm' ? '6px 12px' : size === 'lg' ? '12px 22px' : '9px 16px';
  const fontSize = size === 'sm' ? 12 : size === 'lg' ? 14 : 13;

  const palette = {
    primary: {
      bg: T.accent,
      color: '#0A0A0B',
      border: '1px solid transparent',
      shadow: `0 4px 16px ${T.accentGlow}`,
      hoverShadow: `0 8px 24px ${T.accentGlow}`,
    },
    ghost: {
      bg: 'transparent',
      color: T.text,
      border: '1px solid transparent',
      shadow: 'none',
      hoverShadow: 'none',
    },
    subtle: {
      bg: T.bgRaised,
      color: T.text,
      border: `1px solid ${T.border}`,
      shadow: 'none',
      hoverShadow: 'none',
    },
    outline: {
      bg: T.accentDim,
      color: T.accent,
      border: `1px solid ${T.accentBorder}`,
      shadow: 'none',
      hoverShadow: `0 0 0 1px ${T.accentBorder}`,
    },
    danger: {
      bg: T.errorDim,
      color: T.error,
      border: `1px solid ${T.errorBorder}`,
      shadow: 'none',
      hoverShadow: 'none',
    },
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding,
        fontSize,
        fontWeight: 600,
        fontFamily: T.font,
        letterSpacing: '-0.01em',
        borderRadius: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        background: palette.bg,
        color: palette.color,
        border: palette.border,
        boxShadow: palette.shadow,
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (variant === 'ghost') {
          e.currentTarget.style.background = T.bgCardHover;
          e.currentTarget.style.borderColor = T.borderHover;
        } else if (variant === 'subtle') {
          e.currentTarget.style.borderColor = T.borderHover;
          e.currentTarget.style.background = T.bgCardHover;
        } else {
          e.currentTarget.style.boxShadow = palette.hoverShadow;
        }
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.boxShadow = palette.shadow;
        if (variant === 'ghost') {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
        } else if (variant === 'subtle') {
          e.currentTarget.style.background = T.bgRaised;
          e.currentTarget.style.borderColor = T.border;
        }
      }}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────

export function StudioCard({
  children,
  style,
  onClick,
  hoverable = false,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  hoverable?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: 18,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        boxShadow: T.shadowCard,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!hoverable) return;
        e.currentTarget.style.borderColor = T.borderHover;
        e.currentTarget.style.background = T.bgRaised;
      }}
      onMouseLeave={(e) => {
        if (!hoverable) return;
        e.currentTarget.style.borderColor = T.border;
        e.currentTarget.style.background = T.bgCard;
      }}
    >
      {children}
    </div>
  );
}

// ─── Input ─────────────────────────────────────────────────────────────

export function StudioInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  style,
  autoFocus,
  onKeyDown,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  style?: React.CSSProperties;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      type={type}
      value={value}
      autoFocus={autoFocus}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      style={{
        width: '100%',
        padding: '10px 14px',
        background: T.bgInput,
        color: T.text,
        border: `1px solid ${T.inputBorder}`,
        borderRadius: 10,
        fontSize: 13,
        fontFamily: T.font,
        letterSpacing: '-0.01em',
        outline: 'none',
        transition: 'all 0.15s ease',
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = T.accentBorder;
        e.currentTarget.style.boxShadow = `0 0 0 3px ${T.accentDim}`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = T.inputBorder;
        e.currentTarget.style.boxShadow = 'none';
      }}
    />
  );
}

// ─── Select ────────────────────────────────────────────────────────────

export function StudioSelect<V extends string>({
  value,
  onChange,
  options,
  style,
}: {
  value: V;
  onChange: (v: V) => void;
  options: { value: V; label: string }[];
  style?: React.CSSProperties;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as V)}
      style={{
        padding: '8px 32px 8px 12px',
        background: T.bgInput,
        color: T.text,
        border: `1px solid ${T.inputBorder}`,
        borderRadius: 10,
        fontSize: 12,
        fontFamily: T.fontMono,
        letterSpacing: '0.02em',
        outline: 'none',
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage:
          'url("data:image/svg+xml,%3Csvg width=\'10\' height=\'6\' viewBox=\'0 0 10 6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1L5 5L9 1\' stroke=\'%23606068\' stroke-width=\'1.5\' stroke-linecap=\'round\' fill=\'none\'/%3E%3C/svg%3E")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        ...style,
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: T.bgRaised }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ─── Badge / Chip ──────────────────────────────────────────────────────

export function StudioBadge({
  children,
  color = 'gold',
  style,
}: {
  children: React.ReactNode;
  color?: 'gold' | 'green' | 'red' | 'blue' | 'gray' | 'indigo';
  style?: React.CSSProperties;
}) {
  const palette = {
    gold: { bg: T.accentDim, fg: T.accent, border: T.accentBorder },
    indigo: { bg: T.accent2Dim, fg: T.accent2, border: 'rgba(99,102,241,0.30)' },
    green: { bg: T.successDim, fg: T.success, border: T.successBorder },
    red: { bg: T.errorDim, fg: T.error, border: T.errorBorder },
    blue: { bg: 'rgba(96,165,250,0.12)', fg: '#60A5FA', border: 'rgba(96,165,250,0.30)' },
    gray: { bg: T.bgRaised, fg: T.textMuted, border: T.border },
  }[color];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 8,
        fontWeight: 700,
        padding: '2px 7px',
        borderRadius: 4,
        background: palette.bg,
        color: palette.fg,
        border: `1px solid ${palette.border}`,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontFamily: T.fontMono,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────

export function StudioModal({
  open,
  onClose,
  children,
  title,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  width?: number;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'studio-fadein 0.15s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: width,
          background: T.bgRaised,
          border: `1px solid ${T.border}`,
          borderRadius: 14,
          boxShadow: T.shadowDeep,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        className="studio-scroll"
      >
        {title && (
          <div
            style={{
              padding: '18px 22px',
              borderBottom: `1px solid ${T.border}`,
              fontFamily: T.fontDisplay,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              color: T.text,
            }}
          >
            {title}
          </div>
        )}
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Section header ────────────────────────────────────────────────────

export function StudioSectionHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 24,
        marginBottom: 28,
        flexWrap: 'wrap',
      }}
    >
      <div>
        {eyebrow && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 4,
                height: 16,
                background: T.accent,
                borderRadius: 2,
                boxShadow: `0 0 12px ${T.accentGlow}`,
              }}
            />
            <span
              style={{
                fontFamily: T.fontMono,
                fontSize: 9,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: T.textMuted,
              }}
            >
              {eyebrow}
            </span>
          </div>
        )}
        <h1
          style={{
            fontFamily: T.fontDisplay,
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            margin: 0,
            color: T.text,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 13,
              color: T.textMuted,
              maxWidth: 580,
              fontFamily: T.font,
              lineHeight: 1.55,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

// ─── Spinner ───────────────────────────────────────────────────────────

export function Spinner({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `2px solid rgba(245,158,11,0.15)`,
        borderTopColor: color ?? T.accent,
        borderRadius: '50%',
        animation: 'studio-spin 0.7s linear infinite',
        flexShrink: 0,
      }}
    />
  );
}

// ─── Eyebrow label (DM Mono uppercase) ─────────────────────────────────

export function Eyebrow({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: T.fontMono,
        fontSize: 9,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: T.textMuted,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

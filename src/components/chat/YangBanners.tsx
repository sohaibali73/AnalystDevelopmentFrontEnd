'use client';

/**
 * Sticky banners that appear above the message list when Plan / Yolo mode is on.
 * Both are dismissable — clicking the action button flips the feature off.
 */

import React from 'react';
import { Shield, Zap, X } from 'lucide-react';

interface BannerProps {
  isDark: boolean;
  onDisable: () => void;
}

export function PlanModeBanner({
  isDark, onDisable, toolsAllowed,
}: BannerProps & { toolsAllowed?: number }) {
  return (
    <Banner
      isDark={isDark}
      accent="#3B82F6"
      Icon={Shield}
      label="Plan Mode"
      description={
        toolsAllowed
          ? `Read-only exploration · ${toolsAllowed} tool${toolsAllowed === 1 ? '' : 's'} allowed`
          : 'Read-only exploration — no destructive tools will run'
      }
      actionLabel="Start Implementation"
      onAction={onDisable}
    />
  );
}

export function YoloBanner({ isDark, onDisable }: BannerProps) {
  return (
    <Banner
      isDark={isDark}
      accent="#EF4444"
      Icon={Zap}
      label="Yolo Mode"
      description="All tools auto-approved · iteration cap 10"
      actionLabel="Turn Off"
      onAction={onDisable}
      pulse
    />
  );
}

function Banner({
  isDark, accent, Icon, label, description, actionLabel, onAction, pulse,
}: {
  isDark: boolean;
  accent: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>;
  label: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  pulse?: boolean;
}) {
  const bg = isDark ? accent + '1A' : accent + '0F';
  const border = accent + '55';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        margin: '8px 16px 0',
        borderRadius: 12,
        background: bg,
        border: `1px solid ${border}`,
        color: accent,
        fontSize: 12,
        position: 'relative',
        animation: 'chat-fadeIn 0.2s ease-out',
      }}
    >
      <span style={{
        width: 22, height: 22,
        borderRadius: 999,
        background: accent + '25',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={12} strokeWidth={2.25} />
        {pulse && (
          <span style={{
            position: 'absolute', inset: 0,
            borderRadius: 12,
            boxShadow: `0 0 0 1px ${accent}55`,
            pointerEvents: 'none',
            animation: 'chat-pulse 2s ease-in-out infinite',
          }} />
        )}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          fontWeight: 700,
        }}>{label}</span>
        <span style={{ fontSize: 11.5, color: isDark ? '#DCDCE0' : '#30303A', lineHeight: 1.3 }}>
          {description}
        </span>
      </div>
      <button
        onClick={onAction}
        style={{
          padding: '6px 12px',
          borderRadius: 999,
          border: `1px solid ${accent}55`,
          background: isDark ? '#0D0D10' : '#FFFFFF',
          color: accent,
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all .15s',
          whiteSpace: 'nowrap' as const,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = accent + '10'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? '#0D0D10' : '#FFFFFF'; }}
      >
        {actionLabel}
      </button>
    </div>
  );
}

'use client';

import React from 'react';
import {
  Tag,
  FolderOpen,
  FileText,
  HardDrive,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { BrainStats } from '@/types/api';

interface KBTagCloudProps {
  stats: BrainStats | null;
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  isDark: boolean;
  colors: Record<string, string>;
  isMobile: boolean;
  totalBookmarks?: number;
}

const catColors: Record<string, { bg: string; text: string }> = {
  afl: { bg: 'rgba(254, 192, 15, 0.12)', text: '#FEC00F' },
  strategy: { bg: 'rgba(34, 197, 94, 0.12)', text: '#22c55e' },
  indicator: { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8' },
  documentation: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6' },
  general: { bg: 'rgba(156, 163, 175, 0.12)', text: '#9ca3af' },
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export default function KBTagCloud({
  stats,
  categories,
  activeCategory,
  onCategoryChange,
  isDark,
  colors,
  isMobile,
  totalBookmarks = 0,
}: KBTagCloudProps) {
  if (!stats) return null;

  const totalDocs = stats.total_documents;
  const catEntries = Object.entries(stats.categories);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Quick Stats Card */}
      <div
        style={{
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: isMobile ? '14px 16px' : '16px 20px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <TrendingUp size={14} color={colors.accent} />
          <h3
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '13px',
              fontWeight: 700,
              color: colors.text,
              letterSpacing: '1px',
              margin: 0,
            }}
          >
            OVERVIEW
          </h3>
        </div>
        <div
          style={{
            padding: isMobile ? '14px 16px' : '16px 20px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          {[
            {
              label: 'Documents',
              value: totalDocs.toString(),
              icon: FileText,
              iconColor: colors.accent,
            },
            {
              label: 'Total Size',
              value: formatFileSize(stats.total_size),
              icon: HardDrive,
              iconColor: '#3b82f6',
            },
            {
              label: 'Categories',
              value: catEntries.length.toString(),
              icon: FolderOpen,
              iconColor: '#22c55e',
            },
            {
              label: 'Bookmarks',
              value: totalBookmarks.toString(),
              icon: Clock,
              iconColor: '#818cf8',
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${colors.border}`,
                  textAlign: 'center',
                }}
              >
                <Icon size={16} color={stat.iconColor} style={{ marginBottom: '4px' }} />
                <p
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '18px',
                    fontWeight: 700,
                    color: colors.text,
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </p>
                <p
                  style={{
                    color: colors.textMuted,
                    fontSize: '10px',
                    margin: '3px 0 0 0',
                    fontFamily: "'Rajdhani', sans-serif",
                    letterSpacing: '0.3px',
                    fontWeight: 600,
                  }}
                >
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Categories Card */}
      <div
        style={{
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: isMobile ? '14px 16px' : '16px 20px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Tag size={14} color={colors.accent} />
          <h3
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '13px',
              fontWeight: 700,
              color: colors.text,
              letterSpacing: '1px',
              margin: 0,
            }}
          >
            CATEGORIES
          </h3>
        </div>

        <div style={{ padding: isMobile ? '12px 16px' : '14px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* All button */}
            <button
              onClick={() => onCategoryChange('all')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${
                  activeCategory === 'all' ? colors.accent : 'transparent'
                }`,
                backgroundColor:
                  activeCategory === 'all'
                    ? `${colors.accent}14`
                    : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderOpen
                  size={14}
                  color={activeCategory === 'all' ? colors.accent : colors.textMuted}
                />
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: activeCategory === 'all' ? colors.accent : colors.text,
                    fontFamily: "'Rajdhani', sans-serif",
                    letterSpacing: '0.5px',
                  }}
                >
                  ALL
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: activeCategory === 'all' ? colors.accent : colors.textMuted,
                  fontFamily: "'Rajdhani', sans-serif",
                }}
              >
                {totalDocs}
              </span>
            </button>

            {/* Category buttons */}
            {catEntries.map(([cat, count]) => {
              const cc = catColors[cat] || catColors.general;
              const isActive = activeCategory === cat;
              const pct = totalDocs > 0 ? (count / totalDocs) * 100 : 0;
              return (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${isActive ? cc.text : 'transparent'}`,
                    backgroundColor: isActive ? cc.bg : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: cc.text,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: isActive ? cc.text : colors.text,
                        fontFamily: "'Rajdhani', sans-serif",
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {cat}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <div
                      style={{
                        width: '36px',
                        height: '3px',
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.06)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          backgroundColor: cc.text,
                          borderRadius: '2px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: isActive ? cc.text : colors.textMuted,
                        fontFamily: "'Rajdhani', sans-serif",
                        minWidth: '18px',
                        textAlign: 'right',
                      }}
                    >
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

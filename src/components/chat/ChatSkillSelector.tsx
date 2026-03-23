'use client';

/**
 * ChatSkillSelector — Toolbar button that opens a floating skill picker.
 * Fetches skills from /api/skills on first open, caches in component state.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Zap, X, Search, Check } from 'lucide-react';
import type { SkillDefinition, SkillCategory } from '@/types/skills';
import { SKILL_CATEGORY_META } from '@/types/skills';

// ─── Category badge colors ──────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  afl:                { bg: 'rgba(99,102,241,0.12)',  text: '#818CF8', border: 'rgba(99,102,241,0.3)' },
  document:           { bg: 'rgba(16,185,129,0.12)',  text: '#34D399', border: 'rgba(16,185,129,0.3)' },
  presentation:       { bg: 'rgba(245,158,11,0.12)',  text: '#FBBF24', border: 'rgba(245,158,11,0.3)' },
  ui:                 { bg: 'rgba(236,72,153,0.12)',   text: '#F472B6', border: 'rgba(236,72,153,0.3)' },
  backtest:           { bg: 'rgba(59,130,246,0.12)',   text: '#60A5FA', border: 'rgba(59,130,246,0.3)' },
  market_analysis:    { bg: 'rgba(239,68,68,0.12)',    text: '#F87171', border: 'rgba(239,68,68,0.3)' },
  quant:              { bg: 'rgba(139,92,246,0.12)',   text: '#A78BFA', border: 'rgba(139,92,246,0.3)' },
  research:           { bg: 'rgba(20,184,166,0.12)',   text: '#2DD4BF', border: 'rgba(20,184,166,0.3)' },
  financial_modeling: { bg: 'rgba(249,115,22,0.12)',   text: '#FB923C', border: 'rgba(249,115,22,0.3)' },
  data:               { bg: 'rgba(6,182,212,0.12)',    text: '#22D3EE', border: 'rgba(6,182,212,0.3)' },
};

const DEFAULT_CATEGORY_COLOR = { bg: 'rgba(156,163,175,0.12)', text: '#9CA3AF', border: 'rgba(156,163,175,0.3)' };

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] || DEFAULT_CATEGORY_COLOR;
}

function getCategoryLabel(category: string): string {
  return SKILL_CATEGORY_META[category as SkillCategory]?.label || category;
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface ChatSkillSelectorProps {
  forcedSkillSlug: string | null;
  forcedSkillName: string | null;
  onSkillChange: (slug: string | null, name: string | null) => void;
  isDark: boolean;
  disabled?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ChatSkillSelector({
  forcedSkillSlug,
  forcedSkillName,
  onSkillChange,
  isDark,
  disabled,
}: ChatSkillSelectorProps) {
  const [open, setOpen] = useState(false);
  const [skills, setSkills] = useState<SkillDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const hasActiveSkill = forcedSkillSlug !== null;

  // Fetch skills on first open
  const fetchSkills = useCallback(async () => {
    if (fetched) return;
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '';
      const resp = await fetch('/api/skills?include_builtins=true', {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (resp.ok) {
        const data = await resp.json();
        setSkills(data.skills || []);
      }
    } catch {
      // Silently fail — panel will show empty state
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [fetched]);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    setOpen((prev) => {
      if (!prev && !fetched) {
        fetchSkills();
      }
      return !prev;
    });
  }, [disabled, fetched, fetchSkills]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = useCallback(
    (skill: SkillDefinition) => {
      if (forcedSkillSlug === skill.slug) {
        // Deselect
        onSkillChange(null, null);
      } else {
        onSkillChange(skill.slug, skill.name);
      }
      setOpen(false);
      setSearch('');
      setActiveCategory('ALL');
    },
    [forcedSkillSlug, onSkillChange]
  );

  // Derive categories from fetched skills
  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    skills.forEach((s) => cats.add(s.category));
    return ['ALL', ...Array.from(cats).sort()];
  }, [skills]);

  // Filter skills
  const filteredSkills = React.useMemo(() => {
    let result = skills;
    if (activeCategory !== 'ALL') {
      result = result.filter((s) => s.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q)
      );
    }
    return result;
  }, [skills, activeCategory, search]);

  // Theme tokens
  const T = {
    text: isDark ? '#EFEFEF' : '#0A0A0B',
    muted: isDark ? '#606068' : '#808088',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    bg: isDark ? '#0D0D10' : '#FFFFFF',
    bgHover: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    panelBg: isDark ? '#141418' : '#FFFFFF',
    panelBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    panelShadow: isDark
      ? '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
      : '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
    accent: '#60A5FA',
    accentBg: isDark ? 'rgba(96,165,250,0.08)' : 'rgba(96,165,250,0.06)',
    accentBorder: 'rgba(96,165,250,0.35)',
    inputBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    pillActiveBg: isDark ? 'rgba(96,165,250,0.15)' : 'rgba(96,165,250,0.1)',
    pillActiveText: '#60A5FA',
    pillActiveBorder: 'rgba(96,165,250,0.4)',
    pillBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    pillBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        disabled={disabled}
        title="Select skill"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: hasActiveSkill ? '4px 10px 4px 7px' : '6px',
          borderRadius: '8px',
          border: `1px solid ${open || hasActiveSkill ? T.accentBorder : T.border}`,
          background: open || hasActiveSkill ? T.accentBg : 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: hasActiveSkill ? T.accent : T.muted,
          opacity: disabled ? 0.4 : 1,
          transition: 'all .15s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          if (!disabled && !open && !hasActiveSkill) {
            e.currentTarget.style.background = T.bgHover;
            e.currentTarget.style.borderColor = T.accentBorder;
            e.currentTarget.style.color = T.accent;
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !open && !hasActiveSkill) {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.borderColor = T.border;
            e.currentTarget.style.color = T.muted;
          }
        }}
      >
        <Zap size={14} />
        {hasActiveSkill && forcedSkillName && (
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.02em',
              maxWidth: '100px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {forcedSkillName}
          </span>
        )}
      </button>

      {/* Floating panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: '8px',
            width: '360px',
            maxHeight: '420px',
            borderRadius: '12px',
            border: `1px solid ${T.panelBorder}`,
            background: T.panelBg,
            boxShadow: T.panelShadow,
            overflow: 'hidden',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            animation: 'chat-fadeIn 0.15s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '10px 14px 6px',
              fontFamily: "'DM Mono', monospace",
              fontSize: '9px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase' as const,
              color: T.muted,
            }}
          >
            Select Skill
          </div>

          {/* Search */}
          <div style={{ padding: '0 10px 8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: `1px solid ${T.border}`,
                background: T.inputBg,
              }}
            >
              <Search size={12} color={T.muted} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search skills..."
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: T.text,
                  fontSize: '12px',
                  fontFamily: "'Instrument Sans', sans-serif",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: T.muted,
                    padding: 0,
                    display: 'flex',
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Category pills */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              padding: '0 10px 8px',
              overflowX: 'auto',
              flexShrink: 0,
            }}
          >
            {categories.map((cat) => {
              const isActive = cat === activeCategory;
              const isAll = cat === 'ALL';
              const catColor = isAll ? null : getCategoryColor(cat);
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 9px',
                    borderRadius: '100px',
                    border: `1px solid ${
                      isActive
                        ? isAll
                          ? T.pillActiveBorder
                          : catColor?.border || T.pillActiveBorder
                        : T.pillBorder
                    }`,
                    background: isActive
                      ? isAll
                        ? T.pillActiveBg
                        : catColor?.bg || T.pillActiveBg
                      : T.pillBg,
                    cursor: 'pointer',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '9px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase' as const,
                    color: isActive
                      ? isAll
                        ? T.pillActiveText
                        : catColor?.text || T.pillActiveText
                      : T.muted,
                    whiteSpace: 'nowrap',
                    transition: 'all .15s',
                    flexShrink: 0,
                  }}
                >
                  {isAll ? 'ALL' : getCategoryLabel(cat)}
                </button>
              );
            })}
          </div>

          {/* Skill list */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0 6px 6px',
            }}
          >
            {loading ? (
              // Shimmer loading
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    marginBottom: '2px',
                  }}
                >
                  <div
                    style={{
                      height: '12px',
                      width: '60%',
                      borderRadius: '4px',
                      background: isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.06)',
                      marginBottom: '6px',
                      animation: 'chat-shimmer 1.5s ease-in-out infinite',
                    }}
                  />
                  <div
                    style={{
                      height: '10px',
                      width: '80%',
                      borderRadius: '4px',
                      background: isDark
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(0,0,0,0.04)',
                      animation: 'chat-shimmer 1.5s ease-in-out infinite 0.1s',
                    }}
                  />
                </div>
              ))
            ) : filteredSkills.length === 0 ? (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: T.muted,
                  fontSize: '12px',
                }}
              >
                {fetched ? 'No skills found' : 'Failed to load skills'}
              </div>
            ) : (
              filteredSkills.map((skill) => {
                const isSelected = skill.slug === forcedSkillSlug;
                const catColor = getCategoryColor(skill.category);
                return (
                  <button
                    key={skill.slug}
                    onClick={() => handleSelect(skill)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: isSelected
                        ? `1px solid ${T.accentBorder}`
                        : '1px solid transparent',
                      background: isSelected ? T.accentBg : 'none',
                      cursor: 'pointer',
                      textAlign: 'left' as const,
                      transition: 'all .15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = T.bgHover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'none';
                      }
                    }}
                  >
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Skill name */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '4px',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Syne', sans-serif",
                            fontSize: '13px',
                            fontWeight: 600,
                            color: T.text,
                            letterSpacing: '-0.01em',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap' as const,
                          }}
                        >
                          {skill.name}
                        </span>
                      </div>

                      {/* Category badge */}
                      <span
                        style={{
                          display: 'inline-block',
                          fontFamily: "'DM Mono', monospace",
                          fontSize: '8px',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase' as const,
                          color: catColor.text,
                          background: catColor.bg,
                          border: `1px solid ${catColor.border}`,
                          padding: '1px 6px',
                          borderRadius: '3px',
                          marginBottom: '4px',
                        }}
                      >
                        {getCategoryLabel(skill.category)}
                      </span>

                      {/* Description */}
                      <div
                        style={{
                          fontSize: '11px',
                          color: T.muted,
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {skill.description}
                      </div>
                    </div>

                    {/* Check icon */}
                    {isSelected && (
                      <Check
                        size={14}
                        color={T.accent}
                        style={{ flexShrink: 0, marginTop: 2 }}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatSkillSelector;
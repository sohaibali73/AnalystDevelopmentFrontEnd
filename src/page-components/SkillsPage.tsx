'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { Skill, SkillCategoryInfo } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import MarkdownRenderer from '@/components/MarkdownRenderer';

// ── Category icons & colors ───────────────────────────────────────────────
const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  afl:              { icon: '📊', color: '#6366F1' },
  document:         { icon: '📄', color: '#10B981' },
  presentation:     { icon: '📑', color: '#F59E0B' },
  ui:               { icon: '🎨', color: '#EC4899' },
  backtest:         { icon: '📈', color: '#3B82F6' },
  market_analysis:  { icon: '🔍', color: '#EF4444' },
  quant:            { icon: '🧮', color: '#8B5CF6' },
  research:         { icon: '🔬', color: '#14B8A6' },
};

export default function SkillsPage() {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  // ── State ────────────────────────────────────────────────────────────────
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<SkillCategoryInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  // ── Colors ───────────────────────────────────────────────────────────────
  const colors = {
    bg: isDark ? '#121212' : '#ffffff',
    card: isDark ? '#1E1E1E' : '#f8f8f8',
    cardHover: isDark ? '#2A2A2A' : '#f0f0f0',
    border: isDark ? '#333' : '#e0e0e0',
    text: isDark ? '#FFFFFF' : '#212121',
    textMuted: isDark ? '#9E9E9E' : '#757575',
    accent: '#FEC00F',
    accentText: '#212121',
    inputBg: isDark ? '#2A2A2A' : '#fff',
    tagBg: isDark ? '#333' : '#e8e8e8',
  };

  // ── Load skills & categories ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [skillsRes, catRes] = await Promise.all([
          apiClient.getSkills(selectedCategory || undefined),
          apiClient.getSkillCategories(),
        ]);
        if (!cancelled) {
          setSkills(skillsRes.skills);
          setCategories(catRes.categories);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [selectedCategory]);

  // ── Execute skill (streaming) ────────────────────────────────────────────
  const handleExecute = useCallback(async () => {
    if (!activeSkill || !prompt.trim() || isStreaming) return;

    setIsStreaming(true);
    setResponse('');
    setError(null);
    setExecutionTime(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await apiClient.streamSkill(activeSkill.slug, prompt, {
        signal: controller.signal,
        onText: (text) => {
          setResponse(prev => prev + text);
          // Auto-scroll
          if (responseRef.current) {
            responseRef.current.scrollTop = responseRef.current.scrollHeight;
          }
        },
        onError: (err) => {
          setError(err);
        },
        onFinish: (data) => {
          if (data?.executionTime) setExecutionTime(data.executionTime);
        },
      });
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setError(e.message);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [activeSkill, prompt, isStreaming]);

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: colors.textMuted }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '18px', fontWeight: 600 }}>Loading Skills...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Quicksand', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: '28px',
          fontWeight: 700,
          color: colors.text,
          letterSpacing: '1px',
          margin: 0,
        }}>
          ⚡ AI SKILLS
        </h1>
        <p style={{ color: colors.textMuted, fontSize: '14px', marginTop: '4px' }}>
          {skills.length} custom Claude beta skills available • Select a skill and provide a prompt to execute
        </p>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button
          onClick={() => setSelectedCategory(null)}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: `1px solid ${!selectedCategory ? colors.accent : colors.border}`,
            backgroundColor: !selectedCategory ? colors.accent : 'transparent',
            color: !selectedCategory ? colors.accentText : colors.textMuted,
            fontWeight: 600,
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: "'Rajdhani', sans-serif",
            letterSpacing: '0.5px',
            transition: 'all 0.2s',
          }}
        >
          ALL ({categories.reduce((s, c) => s + c.count, 0)})
        </button>
        {categories.filter(c => c.count > 0).map(cat => (
          <button
            key={cat.category}
            onClick={() => setSelectedCategory(cat.category)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: `1px solid ${selectedCategory === cat.category ? (CATEGORY_META[cat.category]?.color || colors.accent) : colors.border}`,
              backgroundColor: selectedCategory === cat.category ? (CATEGORY_META[cat.category]?.color || colors.accent) : 'transparent',
              color: selectedCategory === cat.category ? '#fff' : colors.textMuted,
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: "'Rajdhani', sans-serif",
              letterSpacing: '0.5px',
              transition: 'all 0.2s',
            }}
          >
            {CATEGORY_META[cat.category]?.icon || '📦'} {cat.label.toUpperCase()} ({cat.count})
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: activeSkill ? '1fr 2fr' : '1fr', gap: '24px' }}>
        {/* Skills Grid */}
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: activeSkill ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '12px',
          }}>
            {skills.map(skill => {
              const meta = CATEGORY_META[skill.category] || { icon: '📦', color: '#666' };
              const isActive = activeSkill?.slug === skill.slug;
              return (
                <button
                  key={skill.slug}
                  onClick={() => { setActiveSkill(skill); setResponse(''); setError(null); setExecutionTime(null); }}
                  style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderRadius: '12px',
                    border: `1px solid ${isActive ? meta.color : colors.border}`,
                    backgroundColor: isActive ? (isDark ? '#2A2A2A' : '#f0f0f0') : colors.card,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isActive ? `0 0 0 2px ${meta.color}40` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{meta.icon}</span>
                    <span style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 700,
                      fontSize: '14px',
                      color: colors.text,
                      letterSpacing: '0.5px',
                    }}>
                      {skill.name}
                    </span>
                  </div>
                  <p style={{ color: colors.textMuted, fontSize: '12px', lineHeight: 1.5, margin: 0 }}>
                    {skill.description.length > (activeSkill ? 120 : 150)
                      ? skill.description.slice(0, activeSkill ? 120 : 150) + '...'
                      : skill.description}
                  </p>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {skill.tags.slice(0, 4).map(tag => (
                      <span key={tag} style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: colors.tagBg,
                        color: colors.textMuted,
                        fontWeight: 600,
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Skill Execution Panel */}
        {activeSkill && (
          <div style={{
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.card,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 200px)',
          }}>
            {/* Skill Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{CATEGORY_META[activeSkill.category]?.icon}</span>
                  <h2 style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    fontSize: '18px',
                    color: colors.text,
                    margin: 0,
                  }}>
                    {activeSkill.name}
                  </h2>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: isDark ? 'rgba(254, 192, 15, 0.2)' : 'rgba(254, 192, 15, 0.3)',
                    color: isDark ? '#FEC00F' : '#996600',
                    letterSpacing: '0.5px',
                  }}>
                    BETA
                  </span>
                </div>
                <p style={{ color: colors.textMuted, fontSize: '12px', margin: '4px 0 0' }}>
                  {activeSkill.description}
                </p>
              </div>
              <button
                onClick={() => { setActiveSkill(null); setResponse(''); setError(null); }}
                style={{
                  background: 'none', border: 'none', color: colors.textMuted,
                  cursor: 'pointer', fontSize: '20px', padding: '4px 8px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Input Area */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}` }}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleExecute();
                }}
                placeholder={`Describe what you want ${activeSkill.name} to do...`}
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  fontSize: '14px',
                  fontFamily: "'Quicksand', sans-serif",
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
                {isStreaming ? (
                  <button
                    onClick={handleStop}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#EF4444',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontFamily: "'Rajdhani', sans-serif",
                      letterSpacing: '0.5px',
                    }}
                  >
                    ■ STOP
                  </button>
                ) : (
                  <button
                    onClick={handleExecute}
                    disabled={!prompt.trim()}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: prompt.trim() ? colors.accent : colors.tagBg,
                      color: prompt.trim() ? colors.accentText : colors.textMuted,
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: prompt.trim() ? 'pointer' : 'not-allowed',
                      fontFamily: "'Rajdhani', sans-serif",
                      letterSpacing: '0.5px',
                    }}
                  >
                    ▶ EXECUTE SKILL
                  </button>
                )}
                <span style={{ color: colors.textMuted, fontSize: '11px' }}>
                  ⌘+Enter to send
                </span>
                {executionTime && (
                  <span style={{ color: colors.textMuted, fontSize: '11px', marginLeft: 'auto' }}>
                    ⏱ {executionTime}s
                  </span>
                )}
              </div>
            </div>

            {/* Response Area */}
            <div
              ref={responseRef}
              style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                minHeight: '200px',
              }}
            >
              {error && (
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: isDark ? '#3B1515' : '#FEE2E2',
                  border: `1px solid ${isDark ? '#7F1D1D' : '#FECACA'}`,
                  color: isDark ? '#FCA5A5' : '#991B1B',
                  fontSize: '13px',
                  marginBottom: '12px',
                }}>
                  ⚠️ {error}
                </div>
              )}
              {response ? (
                <div style={{ color: colors.text, fontSize: '14px', lineHeight: 1.7 }}>
                  <MarkdownRenderer content={response} />
                </div>
              ) : !isStreaming && !error ? (
                <div style={{ textAlign: 'center', color: colors.textMuted, paddingTop: '40px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
                  <div style={{ fontSize: '14px' }}>Enter a prompt and click Execute to use this skill</div>
                </div>
              ) : isStreaming && !response ? (
                <div style={{ textAlign: 'center', color: colors.textMuted, paddingTop: '40px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }}>⚡</div>
                  <div style={{ fontSize: '14px' }}>Executing {activeSkill.name}...</div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

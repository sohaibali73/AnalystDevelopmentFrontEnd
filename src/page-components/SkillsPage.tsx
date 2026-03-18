'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { Skill, SkillCategoryInfo } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import MarkdownRenderer from '@/components/MarkdownRenderer';

// ── Category icons & colors (all 10 categories) ──────────────────────────
const CATEGORY_META: Record<string, { icon: string; color: string; label: string }> = {
  afl:                { icon: '📊', color: '#6366F1', label: 'AFL' },
  document:           { icon: '📄', color: '#10B981', label: 'Document' },
  presentation:       { icon: '📑', color: '#F59E0B', label: 'Presentation' },
  ui:                 { icon: '🎨', color: '#EC4899', label: 'UI' },
  backtest:           { icon: '📈', color: '#3B82F6', label: 'Backtest' },
  market_analysis:    { icon: '🔍', color: '#EF4444', label: 'Market Analysis' },
  quant:              { icon: '🧮', color: '#8B5CF6', label: 'Quant' },
  research:           { icon: '🔬', color: '#14B8A6', label: 'Research' },
  financial_modeling:  { icon: '💰', color: '#F97316', label: 'Financial Modeling' },
  data:               { icon: '📦', color: '#0EA5E9', label: 'Data' },
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
  const [tokenUsage, setTokenUsage] = useState<{ input: number; output: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  // ── Colors ───────────────────────────────────────────────────────────────
  const colors = {
    bg: isDark ? '#0A0A0A' : '#ffffff',
    card: isDark ? '#141414' : '#f8f8f8',
    cardHover: isDark ? '#1E1E1E' : '#f0f0f0',
    border: isDark ? 'rgba(96,165,250,0.15)' : 'rgba(96,165,250,0.1)',
    text: isDark ? '#FFFFFF' : '#111111',
    textMuted: isDark ? '#93C5FD' : '#6B7280',
    accent: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
    accentSolid: '#60A5FA',
    accentText: '#0A0A0B',
    inputBg: isDark ? '#1E1E1E' : '#fff',
    tagBg: isDark ? 'rgba(96,165,250,0.1)' : '#e8e8e8',
  };

  // ── Filtered skills ──────────────────────────────────────────────────────
  const filteredSkills = selectedCategory
    ? skills.filter(s => s.category === selectedCategory)
    : skills;

  // ── Load skills ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const skillsRes = await apiClient.getSkills();
        if (!cancelled) {
          setSkills(skillsRes.skills);
          // Build categories from skills data
          const categoryCounts = skillsRes.skills.reduce((acc: Record<string, number>, skill: Skill) => {
            acc[skill.category] = (acc[skill.category] || 0) + 1;
            return acc;
          }, {});

          const categoriesList = Object.entries(categoryCounts).map(([category, count]) => ({
            category,
            label: CATEGORY_META[category]?.label || category.toUpperCase(),
            count: count as number,
          }));

          setCategories(categoriesList);
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
  }, []);

  // ── Auto-scroll response ────────────────────────────────────────────────
  useEffect(() => {
    if (responseRef.current && isStreaming) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response, isStreaming]);

  // ── Execute skill with streaming ─────────────────────────────────────────
  const handleExecute = useCallback(async () => {
    if (!activeSkill || !prompt.trim() || isStreaming) return;

    setIsStreaming(true);
    setResponse('');
    setError(null);
    setExecutionTime(null);
    setTokenUsage(null);

    const startTime = Date.now();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      if (activeSkill.supports_streaming) {
        // Use callback-based streaming API
        let accumulated = '';
        const result = await apiClient.executeSkillStream(activeSkill.slug, prompt, {
          signal: controller.signal,
          onText: (text: string) => {
            accumulated += text;
            setResponse(accumulated);
          },
          onData: (data: any) => {
            if (data?.execution_time) setExecutionTime(data.execution_time);
            if (data?.usage) {
              setTokenUsage({
                input: data.usage.input_tokens || 0,
                output: data.usage.output_tokens || 0,
              });
            }
          },
          onError: (errMsg: string) => {
            setError(errMsg);
          },
        });

        // Final result text (if callbacks didn't capture everything)
        if (!accumulated && result.text) {
          setResponse(result.text);
        }
      } else {
        // Non-streaming fallback
        const result = await apiClient.executeSkill(activeSkill.slug, prompt);
        setResponse(result.text);
        if (result.execution_time) setExecutionTime(result.execution_time);
        if (result.usage) {
          setTokenUsage({ input: result.usage.input_tokens, output: result.usage.output_tokens });
        }
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      if (!executionTime) setExecutionTime(parseFloat(elapsed));
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setError(e.message || 'Skill execution failed');
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [activeSkill, prompt, isStreaming, executionTime]);

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const handleCopyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(response);
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', color: colors.textMuted, backgroundColor: colors.bg,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 700, letterSpacing: '1px' }}>
            Loading Skills...
          </div>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      height: '100vh', overflow: 'auto', backgroundColor: colors.bg,
      fontFamily: "'Instrument Sans', sans-serif",
    }}>
      <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '28px',
            fontWeight: 800,
            color: colors.text,
            letterSpacing: '2px',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '40px', height: '40px', borderRadius: '12px',
              background: colors.accent,
              boxShadow: '0 4px 16px rgba(96,165,250,0.3)',
            }}>
              <span style={{ fontSize: '20px' }}>⚡</span>
            </span>
            AI SKILLS
          </h1>
          <p style={{ color: colors.textMuted, fontSize: '14px', marginTop: '8px' }}>
            {skills.length} custom Claude beta skills across {categories.length} categories • Select a skill and provide a prompt
          </p>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: '8px 16px',
              borderRadius: '24px',
              border: !selectedCategory ? 'none' : `1px solid ${colors.border}`,
              background: !selectedCategory ? colors.accent : 'transparent',
              color: !selectedCategory ? colors.accentText : colors.textMuted,
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: "'Syne', sans-serif",
              letterSpacing: '0.5px',
              transition: 'all 0.2s',
              boxShadow: !selectedCategory ? '0 4px 12px rgba(96,165,250,0.3)' : 'none',
            }}
          >
            ALL ({skills.length})
          </button>
          {categories.filter(c => c.count > 0).map(cat => {
            const meta = CATEGORY_META[cat.category] || { icon: '📦', color: '#666', label: cat.category };
            const isSelected = selectedCategory === cat.category;
            return (
              <button
                key={cat.category}
                onClick={() => setSelectedCategory(isSelected ? null : cat.category)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '24px',
                  border: `1px solid ${isSelected ? meta.color : colors.border}`,
                  backgroundColor: isSelected ? meta.color : 'transparent',
                  color: isSelected ? '#fff' : colors.textMuted,
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontFamily: "'Syne', sans-serif",
                  letterSpacing: '0.5px',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? `0 4px 12px ${meta.color}40` : 'none',
                }}
              >
                {meta.icon} {meta.label.toUpperCase()} ({cat.count})
              </button>
            );
          })}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: activeSkill ? '1fr 2fr' : '1fr',
          gap: '24px',
        }}>
          {/* Skills Grid */}
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: activeSkill ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '12px',
            }}>
              {filteredSkills.map(skill => {
                const meta = CATEGORY_META[skill.category] || { icon: '📦', color: '#666', label: skill.category };
                const isActive = activeSkill?.slug === skill.slug;
                return (
                  <button
                    key={skill.slug}
                    onClick={() => {
                      setActiveSkill(skill);
                      setResponse('');
                      setError(null);
                      setExecutionTime(null);
                      setTokenUsage(null);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '16px',
                      borderRadius: '14px',
                      border: `1px solid ${isActive ? meta.color : colors.border}`,
                      backgroundColor: isActive ? (isDark ? '#1E1E1E' : '#f0f0f0') : colors.card,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isActive
                        ? `0 0 0 2px ${meta.color}40, 0 4px 16px ${meta.color}20`
                        : isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '18px',
                        width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '8px',
                        backgroundColor: `${meta.color}15`,
                        border: `1px solid ${meta.color}30`,
                      }}>{meta.icon}</span>
                      <span style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 700,
                        fontSize: '13px',
                        color: colors.text,
                        letterSpacing: '0.5px',
                        flex: 1,
                      }}>
                        {skill.name}
                      </span>
                      {skill.supports_streaming && (
                        <span style={{
                          fontSize: '9px', fontWeight: 700,
                          padding: '2px 6px', borderRadius: '4px',
                          backgroundColor: isDark ? 'rgba(96,165,250,0.15)' : 'rgba(96,165,250,0.1)',
                          color: '#60A5FA',
                          letterSpacing: '0.5px',
                        }}>
                          STREAM
                        </span>
                      )}
                    </div>
                    <p style={{ color: colors.textMuted, fontSize: '12px', lineHeight: 1.5, margin: 0 }}>
                      {skill.description.length > (activeSkill ? 100 : 140)
                        ? skill.description.slice(0, activeSkill ? 100 : 140) + '...'
                        : skill.description}
                    </p>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
                      <span style={{
                        fontSize: '9px', fontWeight: 700, padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: `${meta.color}15`,
                        color: meta.color,
                        letterSpacing: '0.5px',
                      }}>
                        {meta.label.toUpperCase()}
                      </span>
                      {skill.tags.slice(0, 3).map(tag => (
                        <span key={tag} style={{
                          fontSize: '9px', padding: '2px 6px',
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
              {filteredSkills.length === 0 && (
                <div style={{ textAlign: 'center', color: colors.textMuted, padding: '40px 0' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                  <div style={{ fontSize: '14px' }}>No skills found in this category</div>
                </div>
              )}
            </div>
          </div>

          {/* Skill Execution Panel */}
          {activeSkill && (() => {
            const meta = CATEGORY_META[activeSkill.category] || { icon: '📦', color: '#666', label: activeSkill.category };
            return (
              <div style={{
                borderRadius: '14px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.card,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'calc(100vh - 200px)',
                boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.08)',
              }}>
                {/* Skill Header */}
                <div style={{
                  padding: '16px 20px',
                  borderBottom: `1px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: isDark
                    ? `linear-gradient(135deg, ${meta.color}10, transparent)`
                    : `linear-gradient(135deg, ${meta.color}08, transparent)`,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '20px' }}>{meta.icon}</span>
                      <h2 style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 800,
                        fontSize: '18px',
                        color: colors.text,
                        margin: 0,
                        letterSpacing: '1px',
                      }}>
                        {activeSkill.name}
                      </h2>
                      <span style={{
                        fontSize: '9px', fontWeight: 700,
                        padding: '3px 8px', borderRadius: '6px',
                        background: `${meta.color}20`,
                        color: meta.color,
                        letterSpacing: '0.5px',
                        border: `1px solid ${meta.color}30`,
                      }}>
                        {meta.label.toUpperCase()}
                      </span>
                      <span style={{
                        fontSize: '9px', fontWeight: 700,
                        padding: '3px 8px', borderRadius: '6px',
                        background: isDark ? 'rgba(167,139,250,0.15)' : 'rgba(167,139,250,0.1)',
                        color: '#A78BFA',
                        letterSpacing: '0.5px',
                        border: '1px solid rgba(167,139,250,0.2)',
                      }}>
                        BETA SKILL
                      </span>
                    </div>
                    <p style={{ color: colors.textMuted, fontSize: '12px', margin: '6px 0 0', lineHeight: 1.5 }}>
                      {activeSkill.description}
                    </p>
                  </div>
                  <button
                    onClick={() => { setActiveSkill(null); setResponse(''); setError(null); }}
                    style={{
                      background: 'none', border: 'none', color: colors.textMuted,
                      cursor: 'pointer', fontSize: '20px', padding: '4px 8px',
                      borderRadius: '8px', transition: 'all 0.2s',
                      flexShrink: 0,
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
                      borderRadius: '10px',
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.inputBg,
                      color: colors.text,
                      fontSize: '14px',
                      fontFamily: "'Instrument Sans', sans-serif",
                      resize: 'vertical',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = meta.color; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = isDark ? 'rgba(96,165,250,0.15)' : 'rgba(96,165,250,0.1)'; }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {isStreaming ? (
                      <button
                        onClick={handleStop}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '10px',
                          border: 'none',
                          backgroundColor: '#EF4444',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          fontFamily: "'Syne', sans-serif",
                          letterSpacing: '0.5px',
                          boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
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
                          borderRadius: '10px',
                          border: 'none',
                          background: prompt.trim() ? colors.accent : colors.tagBg,
                          color: prompt.trim() ? colors.accentText : colors.textMuted,
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: prompt.trim() ? 'pointer' : 'not-allowed',
                          fontFamily: "'Syne', sans-serif",
                          letterSpacing: '0.5px',
                          boxShadow: prompt.trim() ? '0 4px 12px rgba(96,165,250,0.3)' : 'none',
                          transition: 'all 0.2s',
                        }}
                      >
                        ▶ EXECUTE SKILL
                      </button>
                    )}
                    <span style={{ color: colors.textMuted, fontSize: '11px' }}>
                      ⌘+Enter to send
                    </span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {executionTime != null && (
                        <span style={{ color: colors.textMuted, fontSize: '11px' }}>
                          ⏱ {executionTime}s
                        </span>
                      )}
                      {tokenUsage && (
                        <span style={{ color: colors.textMuted, fontSize: '11px' }}>
                          🔤 {tokenUsage.input + tokenUsage.output} tokens
                        </span>
                      )}
                      {response && (
                        <button
                          onClick={handleCopyResponse}
                          style={{
                            background: 'none', border: `1px solid ${colors.border}`,
                            color: colors.textMuted, cursor: 'pointer',
                            fontSize: '11px', padding: '4px 10px', borderRadius: '6px',
                            fontWeight: 600, transition: 'all 0.2s',
                          }}
                        >
                          📋 Copy
                        </button>
                      )}
                    </div>
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
                      borderRadius: '10px',
                      backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEE2E2',
                      border: `1px solid ${isDark ? 'rgba(239,68,68,0.3)' : '#FECACA'}`,
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
                      {isStreaming && (
                        <span style={{
                          display: 'inline-block',
                          width: '8px', height: '16px',
                          backgroundColor: meta.color,
                          borderRadius: '2px',
                          animation: 'blink 1s infinite',
                          marginLeft: '2px',
                          verticalAlign: 'text-bottom',
                        }} />
                      )}
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
            );
          })()}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

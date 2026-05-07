'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api';
import { Skill, SkillCategoryInfo } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Copy,
  Download,
  Trash2,
  Search,
  Zap,
  Play,
  Square,
  Loader2,
  X,
  Check,
  AlertCircle,
  ClipboardCopy,
  Hash,
  Clock,
  // Category icons (no emojis anywhere)
  BarChart3,
  FileText,
  Presentation,
  LayoutGrid,
  TrendingUp,
  ScanSearch,
  Sigma,
  Microscope,
  DollarSign,
  Database,
  Code2,
  Sparkles,
  Wrench,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';
import { CreateSkillModal } from '@/components/skills/CreateSkillModal';
import { EditSkillModal } from '@/components/skills/EditSkillModal';
import { useSkillsVersion, bumpSkillsVersion } from '@/stores/skills';
import {
  deleteSkill,
  duplicateSkill,
  downloadSkillURL,
} from '@/lib/skills/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { explainSkillError, type SkillDefinition } from '@/types/skills';

// ── Category metadata (lucide icons only — no emojis) ────────────────────────
type CategoryMeta = {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  label: string;
};

const CATEGORY_META: Record<string, CategoryMeta> = {
  afl:                { icon: BarChart3,    color: '#6366F1', label: 'AFL' },
  document:           { icon: FileText,     color: '#10B981', label: 'Document' },
  presentation:       { icon: Presentation, color: '#F59E0B', label: 'Presentation' },
  ui:                 { icon: LayoutGrid,   color: '#EC4899', label: 'UI' },
  backtest:           { icon: TrendingUp,   color: '#3B82F6', label: 'Backtest' },
  market_analysis:    { icon: ScanSearch,   color: '#EF4444', label: 'Market Analysis' },
  quant:              { icon: Sigma,        color: '#8B5CF6', label: 'Quant' },
  research:           { icon: Microscope,   color: '#14B8A6', label: 'Research' },
  financial_modeling: { icon: DollarSign,   color: '#F97316', label: 'Financial Modeling' },
  data:               { icon: Database,     color: '#0EA5E9', label: 'Data' },
  code:               { icon: Code2,        color: '#84CC16', label: 'Code' },
  design:             { icon: Sparkles,     color: '#D946EF', label: 'Design' },
  finance:            { icon: Briefcase,    color: '#F59E0B', label: 'Finance' },
  general:            { icon: Wrench,       color: '#9CA3AF', label: 'General' },
};

const DEFAULT_META: CategoryMeta = { icon: Wrench, color: '#9CA3AF', label: 'General' };

function getMeta(category: string | undefined | null): CategoryMeta {
  return (category && CATEGORY_META[category]) || DEFAULT_META;
}

function prettyCategoryLabel(category: string): string {
  return CATEGORY_META[category]?.label ||
    category
      .split('_')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
}

// ── Source badge mapping ─────────────────────────────────────────────────────
const SOURCE_LABEL: Record<string, { label: string; color: string }> = {
  upload:  { label: 'Custom',    color: '#A78BFA' },
  inline:  { label: 'Inline',    color: '#A78BFA' },
  portal:  { label: 'Anthropic', color: '#60A5FA' },
  system:  { label: 'Built-in',  color: '#9CA3AF' },
};

export default function SkillsPage() {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';
  const { user } = useAuth();
  const skillsVersion = useSkillsVersion();

  // ── State ────────────────────────────────────────────────────────────────
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'mine'>('all');
  const [search, setSearch] = useState('');
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [tokenUsage, setTokenUsage] = useState<{ input: number; output: number } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  // ── Theme tokens ─────────────────────────────────────────────────────────
  const T = {
    bg:           isDark ? '#0A0A0B' : '#F8FAFC',
    surface:      isDark ? '#0F0F12' : '#FFFFFF',
    surfaceHover: isDark ? '#15151A' : '#F1F5F9',
    surfaceMuted: isDark ? '#0C0C10' : '#F8FAFC',
    border:       isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)',
    borderStrong: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.14)',
    text:         isDark ? '#F4F4F5' : '#0F172A',
    textMuted:    isDark ? '#A1A1AA' : '#64748B',
    textFaint:    isDark ? '#71717A' : '#94A3B8',
    accent:       '#60A5FA',
    accentSoft:   isDark ? 'rgba(96,165,250,0.12)' : 'rgba(96,165,250,0.10)',
    accentBorder: 'rgba(96,165,250,0.35)',
    danger:       '#EF4444',
    success:      '#10B981',
  };

  // ── Load skills ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('auth_token') || ''
            : '';
        const qs = new URLSearchParams();
        qs.set('include_builtins', 'true');
        if (ownerFilter === 'mine') qs.set('owned', 'me');
        const resp = await fetch(`/api/skills?${qs.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = (await resp.json()) as { skills: Skill[] };
        if (!cancelled) {
          setSkills(data.skills || []);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [skillsVersion, ownerFilter]);

  // ── Owner-action handlers ────────────────────────────────────────────────
  const isMine = useCallback(
    (skill: Skill) => !!user?.id && skill.created_by === user.id,
    [user?.id]
  );
  const canModify = useCallback(
    (skill: Skill) =>
      isMine(skill) && skill.source !== 'system' && skill.source !== 'portal',
    [isMine]
  );

  const handleDeleteSkill = useCallback(
    async (skill: Skill) => {
      if (!confirm(`Delete "${skill.name}"? This cannot be undone.`)) return;
      try {
        await deleteSkill(skill.slug);
        toast.success(`Deleted ${skill.name}`);
        if (activeSkill?.slug === skill.slug) setActiveSkill(null);
        bumpSkillsVersion();
      } catch (e) {
        toast.error(explainSkillError(e));
      }
    },
    [activeSkill?.slug]
  );
  const handleDuplicateSkill = useCallback(async (skill: Skill) => {
    try {
      const r = await duplicateSkill(skill.slug);
      toast.success(`Duplicated as ${r.skill.slug}`);
      bumpSkillsVersion();
    } catch (e) {
      toast.error(explainSkillError(e));
    }
  }, []);

  // ── Auto-scroll response ─────────────────────────────────────────────────
  useEffect(() => {
    if (responseRef.current && isStreaming) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response, isStreaming]);

  // ── Execute skill ────────────────────────────────────────────────────────
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
          onError: (errMsg: string) => setError(errMsg),
        });
        if (!accumulated && result.text) setResponse(result.text);
      } else {
        const result = await apiClient.executeSkill(activeSkill.slug, prompt);
        setResponse(result.text);
        if (result.execution_time) setExecutionTime(result.execution_time);
        if (result.usage) {
          setTokenUsage({
            input: result.usage.input_tokens,
            output: result.usage.output_tokens,
          });
        }
      }
      const elapsed = parseFloat(((Date.now() - startTime) / 1000).toFixed(1));
      setExecutionTime((prev) => prev ?? elapsed);
    } catch (e: any) {
      if (e.name !== 'AbortError') setError(e.message || 'Skill execution failed');
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [activeSkill, prompt, isStreaming]);

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };
  const handleCopyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(response);
      toast.success('Copied');
    }
  };

  // ── Filtered skills + category counts ────────────────────────────────────
  const filteredSkills = useMemo(() => {
    let result = skills;
    if (ownerFilter === 'mine' && user?.id) {
      result = result.filter((s) => s.created_by === user.id);
    }
    if (selectedCategory) {
      result = result.filter((s) => s.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q) ||
          (s.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [skills, ownerFilter, user?.id, selectedCategory, search]);

  // Categories computed from owner-scoped skills (so My Skills shows correct counts)
  const ownerScopedSkills = useMemo(() => {
    return ownerFilter === 'mine' && user?.id
      ? skills.filter((s) => s.created_by === user.id)
      : skills;
  }, [skills, ownerFilter, user?.id]);

  const categoryCounts = useMemo(() => {
    const m: Record<string, number> = {};
    ownerScopedSkills.forEach((s) => {
      m[s.category as string] = (m[s.category as string] || 0) + 1;
    });
    return m;
  }, [ownerScopedSkills]);

  const sortedCategories = useMemo(
    () =>
      Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).map(([k]) => k),
    [categoryCounts]
  );

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: T.bg,
          color: T.textMuted,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Loader2
            className="animate-spin"
            style={{ width: 28, height: 28, margin: '0 auto 12px', color: T.accent }}
          />
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Loading skills
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        overflow: 'auto',
        backgroundColor: T.bg,
        color: T.text,
        fontFamily: "'Instrument Sans', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '32px 32px 64px' }}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
            marginBottom: 24,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
                  boxShadow: '0 8px 24px rgba(96,165,250,0.28)',
                }}
              >
                <Zap size={20} color="#fff" strokeWidth={2.4} />
              </div>
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 28,
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    color: T.text,
                  }}
                >
                  Skills
                </h1>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 13,
                    color: T.textMuted,
                  }}
                >
                  {ownerScopedSkills.length} {ownerFilter === 'mine' ? 'personal' : 'available'} skills &middot; pick one and provide a prompt
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 10,
                border: `1px solid ${T.border}`,
                background: T.surface,
                width: 240,
              }}
            >
              <Search size={14} color={T.textFaint} />
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
                  fontSize: 13,
                  color: T.text,
                  fontFamily: 'inherit',
                  minWidth: 0,
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: T.textFaint,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    padding: 0,
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Owner segmented control */}
            <div
              style={{
                display: 'inline-flex',
                padding: 3,
                borderRadius: 10,
                border: `1px solid ${T.border}`,
                background: T.surface,
              }}
            >
              {(['all', 'mine'] as const).map((opt) => {
                const active = ownerFilter === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setOwnerFilter(opt)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 7,
                      border: 'none',
                      background: active ? T.accent : 'transparent',
                      color: active ? '#fff' : T.textMuted,
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                      fontSize: 11,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt === 'all' ? 'All' : 'My skills'}
                  </button>
                );
              })}
            </div>

            {/* New skill button */}
            <button
              onClick={() => setCreateOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 16px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
                color: '#fff',
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(96,165,250,0.28)',
              }}
            >
              <Plus size={14} strokeWidth={2.6} />
              New skill
            </button>
          </div>
        </header>

        {/* ── Category chips row ─────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 24,
            paddingBottom: 4,
          }}
        >
          <CategoryChip
            label="All"
            count={ownerScopedSkills.length}
            active={!selectedCategory}
            onClick={() => setSelectedCategory(null)}
            color={T.accent}
            T={T}
          />
          {sortedCategories.map((cat) => {
            const meta = getMeta(cat);
            return (
              <CategoryChip
                key={cat}
                Icon={meta.icon}
                label={prettyCategoryLabel(cat)}
                count={categoryCounts[cat]}
                active={selectedCategory === cat}
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat ? null : cat)
                }
                color={meta.color}
                T={T}
              />
            );
          })}
        </div>

        {/* ── Main grid ──────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: activeSkill ? 'minmax(0, 1fr) minmax(0, 1.6fr)' : 'minmax(0, 1fr)',
            gap: 20,
            alignItems: 'start',
          }}
        >
          {/* Skills grid */}
          <div>
            {filteredSkills.length === 0 ? (
              <EmptyState
                T={T}
                title={search ? 'No skills match your search' : 'No skills yet'}
                hint={
                  ownerFilter === 'mine'
                    ? 'Create your first skill with the + New skill button.'
                    : 'Try a different category or search term.'
                }
              />
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: activeSkill
                    ? '1fr'
                    : 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: 14,
                }}
              >
                {filteredSkills.map((skill) => (
                  <SkillCard
                    key={skill.slug}
                    skill={skill}
                    isActive={activeSkill?.slug === skill.slug}
                    canModify={canModify(skill)}
                    isMine={isMine(skill)}
                    onSelect={() => {
                      setActiveSkill(skill);
                      setResponse('');
                      setError(null);
                      setExecutionTime(null);
                      setTokenUsage(null);
                    }}
                    onEdit={() => setEditingSkill(skill)}
                    onDuplicate={() => handleDuplicateSkill(skill)}
                    onDelete={() => handleDeleteSkill(skill)}
                    T={T}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Execution panel */}
          {activeSkill && (
            <ExecutionPanel
              skill={activeSkill}
              prompt={prompt}
              setPrompt={setPrompt}
              response={response}
              isStreaming={isStreaming}
              error={error}
              executionTime={executionTime}
              tokenUsage={tokenUsage}
              onClose={() => {
                setActiveSkill(null);
                setResponse('');
                setError(null);
              }}
              onExecute={handleExecute}
              onStop={handleStop}
              onCopy={handleCopyResponse}
              responseRef={responseRef}
              T={T}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateSkillModal open={createOpen} onOpenChange={setCreateOpen} />
      <EditSkillModal
        skill={editingSkill as unknown as SkillDefinition | null}
        open={!!editingSkill}
        onOpenChange={(v) => {
          if (!v) setEditingSkill(null);
        }}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Subcomponents
// ──────────────────────────────────────────────────────────────────────────────

type ThemeT = ReturnType<typeof useTheme> extends infer _ ? any : any;

function CategoryChip({
  Icon,
  label,
  count,
  active,
  onClick,
  color,
  T,
}: {
  Icon?: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color: string;
  T: any;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '7px 13px',
        borderRadius: 999,
        border: `1px solid ${active ? color : T.border}`,
        background: active ? `${color}1A` : T.surface,
        color: active ? color : T.textMuted,
        fontFamily: "'Syne', sans-serif",
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: '0.04em',
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {Icon ? <Icon size={13} /> : null}
      <span>{label}</span>
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          fontWeight: 600,
          opacity: active ? 1 : 0.7,
        }}
      >
        {count}
      </span>
    </button>
  );
}

function SkillCard({
  skill,
  isActive,
  canModify,
  isMine,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  T,
}: {
  skill: Skill;
  isActive: boolean;
  canModify: boolean;
  isMine: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  T: any;
}) {
  const meta = getMeta(skill.category as string);
  const Icon = meta.icon;
  const showActions = canModify || isMine;
  const src = skill.source ? SOURCE_LABEL[skill.source] : null;

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      style={{
        position: 'relative',
        padding: 18,
        borderRadius: 14,
        border: `1px solid ${isActive ? meta.color : T.border}`,
        background: T.surface,
        boxShadow: isActive
          ? `0 0 0 1px ${meta.color}55, 0 8px 28px ${meta.color}1A`
          : '0 1px 2px rgba(0,0,0,0.04)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.borderColor = T.borderStrong;
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.borderColor = T.border;
      }}
    >
      {/* Top row: icon + name + (menu) */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${meta.color}18`,
            color: meta.color,
            flexShrink: 0,
          }}
        >
          <Icon size={17} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: T.text,
                letterSpacing: '-0.005em',
                lineHeight: 1.2,
              }}
            >
              {skill.name}
            </span>
            {skill.supports_streaming && (
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 8.5,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(96,165,250,0.12)',
                  color: '#60A5FA',
                }}
              >
                Stream
              </span>
            )}
          </div>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10.5,
              color: T.textFaint,
              marginTop: 3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {skill.slug}
          </div>
        </div>

        {/* Actions menu */}
        <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Skill actions"
                style={{
                  width: 28,
                  height: 28,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  background: 'transparent',
                  color: T.textMuted,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.surfaceHover;
                  e.currentTarget.style.color = T.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = T.textMuted;
                }}
              >
                <MoreHorizontal size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a href={downloadSkillURL(skill.slug)} download>
                  <Download className="mr-2 h-4 w-4" /> Download
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="mr-2 h-4 w-4" /> Duplicate
              </DropdownMenuItem>
              {showActions && canModify && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.5,
          color: T.textMuted,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {skill.description}
      </p>

      {/* Tags row */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '3px 7px',
            borderRadius: 5,
            background: `${meta.color}15`,
            color: meta.color,
          }}
        >
          {meta.label}
        </span>
        {src && (
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '3px 7px',
              borderRadius: 5,
              background: `${src.color}18`,
              color: src.color,
            }}
          >
            {src.label}
          </span>
        )}
        {(skill.tags || []).slice(0, 3).map((t) => (
          <span
            key={t}
            style={{
              fontSize: 10.5,
              fontWeight: 500,
              padding: '3px 8px',
              borderRadius: 5,
              background: T.surfaceMuted,
              color: T.textMuted,
              border: `1px solid ${T.border}`,
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function EmptyState({
  T,
  title,
  hint,
}: {
  T: any;
  title: string;
  hint?: string;
}) {
  return (
    <div
      style={{
        padding: '64px 24px',
        textAlign: 'center',
        borderRadius: 14,
        border: `1px dashed ${T.border}`,
        background: T.surface,
      }}
    >
      <Search size={28} color={T.textFaint} style={{ marginBottom: 12 }} />
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 15,
          fontWeight: 700,
          color: T.text,
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      {hint && (
        <div style={{ fontSize: 13, color: T.textMuted }}>{hint}</div>
      )}
    </div>
  );
}

function ExecutionPanel({
  skill,
  prompt,
  setPrompt,
  response,
  isStreaming,
  error,
  executionTime,
  tokenUsage,
  onClose,
  onExecute,
  onStop,
  onCopy,
  responseRef,
  T,
}: {
  skill: Skill;
  prompt: string;
  setPrompt: (s: string) => void;
  response: string;
  isStreaming: boolean;
  error: string | null;
  executionTime: number | null;
  tokenUsage: { input: number; output: number } | null;
  onClose: () => void;
  onExecute: () => void;
  onStop: () => void;
  onCopy: () => void;
  responseRef: React.RefObject<HTMLDivElement | null>;
  T: any;
}) {
  const meta = getMeta(skill.category as string);
  const Icon = meta.icon;

  return (
    <div
      style={{
        position: 'sticky',
        top: 24,
        borderRadius: 14,
        border: `1px solid ${T.border}`,
        background: T.surface,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 56px)',
        boxShadow: '0 8px 28px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${T.border}`,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          background: `linear-gradient(135deg, ${meta.color}0F, transparent 70%)`,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `${meta.color}1A`,
                color: meta.color,
              }}
            >
              <Icon size={15} />
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 17,
                color: T.text,
                letterSpacing: '-0.005em',
              }}
            >
              {skill.name}
            </h2>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9.5,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 5,
                background: `${meta.color}1A`,
                color: meta.color,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {meta.label}
            </span>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 12.5, color: T.textMuted, lineHeight: 1.5 }}>
            {skill.description}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          style={{
            width: 28,
            height: 28,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: `1px solid ${T.border}`,
            color: T.textMuted,
            borderRadius: 8,
            cursor: 'pointer',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = T.surfaceHover;
            e.currentTarget.style.color = T.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = T.textMuted;
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Input */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onExecute();
          }}
          placeholder={`Describe what you want ${skill.name} to do...`}
          rows={4}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 10,
            border: `1px solid ${T.border}`,
            background: T.surfaceMuted,
            color: T.text,
            fontSize: 13.5,
            lineHeight: 1.5,
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = meta.color;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = T.border;
          }}
        />
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginTop: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {isStreaming ? (
            <button
              onClick={onStop}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                borderRadius: 10,
                border: 'none',
                background: T.danger,
                color: '#fff',
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(239,68,68,0.3)',
              }}
            >
              <Square size={12} fill="#fff" />
              Stop
            </button>
          ) : (
            <button
              onClick={onExecute}
              disabled={!prompt.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                borderRadius: 10,
                border: 'none',
                background: prompt.trim()
                  ? 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)'
                  : T.surfaceMuted,
                color: prompt.trim() ? '#fff' : T.textFaint,
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.04em',
                cursor: prompt.trim() ? 'pointer' : 'not-allowed',
                boxShadow: prompt.trim() ? '0 4px 14px rgba(96,165,250,0.28)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <Play size={12} fill="currentColor" />
              Execute
            </button>
          )}
          <span style={{ fontSize: 11, color: T.textFaint }}>Ctrl+Enter to run</span>

          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              gap: 14,
              alignItems: 'center',
            }}
          >
            {executionTime != null && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  color: T.textMuted,
                }}
              >
                <Clock size={11} />
                {executionTime}s
              </span>
            )}
            {tokenUsage && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  color: T.textMuted,
                }}
              >
                <Hash size={11} />
                {tokenUsage.input + tokenUsage.output}
              </span>
            )}
            {response && (
              <button
                onClick={onCopy}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'none',
                  border: `1px solid ${T.border}`,
                  color: T.textMuted,
                  cursor: 'pointer',
                  fontSize: 11,
                  padding: '5px 10px',
                  borderRadius: 7,
                  fontWeight: 600,
                }}
              >
                <ClipboardCopy size={11} />
                Copy
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Response */}
      <div
        ref={responseRef}
        style={{
          flex: 1,
          padding: 20,
          overflowY: 'auto',
          minHeight: 200,
        }}
      >
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: 12,
              borderRadius: 10,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: T.danger,
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            <AlertCircle size={15} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
        {response ? (
          <div style={{ color: T.text, fontSize: 14, lineHeight: 1.7 }}>
            <MarkdownRenderer content={response} />
            {isStreaming && (
              <span
                style={{
                  display: 'inline-block',
                  width: 7,
                  height: 16,
                  background: meta.color,
                  borderRadius: 2,
                  marginLeft: 2,
                  verticalAlign: 'text-bottom',
                  animation: 'skill-blink 1s infinite',
                }}
              />
            )}
          </div>
        ) : !isStreaming && !error ? (
          <div style={{ textAlign: 'center', color: T.textFaint, paddingTop: 32 }}>
            <Zap size={26} style={{ marginBottom: 10, opacity: 0.6 }} />
            <div style={{ fontSize: 13 }}>
              Enter a prompt and click Execute to run this skill.
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: T.textMuted, paddingTop: 32 }}>
            <Loader2 size={22} className="animate-spin" style={{ marginBottom: 10, color: meta.color }} />
            <div style={{ fontSize: 13 }}>Executing {skill.name}...</div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes skill-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

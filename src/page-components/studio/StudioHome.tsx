'use client';

/**
 * StudioHome — /studio
 * Beautiful hero + tabbed shell hosting Projects · Styles · Humanize.
 */

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Sparkles,
  Mic2,
  Wand2,
  FolderOpen,
  Presentation,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { StudioSectionHeader, StudioButton } from '@/components/studio/StudioPrimitives';
import { studioTheme as T } from '@/components/studio/theme';
import { ProjectsTab } from './ProjectsTab';
import { StylesTab } from './StylesTab';
import { HumanizePlayground } from './HumanizePlayground';
import { NewProjectModal } from '@/components/studio/NewProjectModal';

type Tab = 'projects' | 'styles' | 'humanize';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'styles', label: 'Styles', icon: Mic2 },
  { id: 'humanize', label: 'Humanize', icon: Wand2 },
];

const FEATURE_CARDS: {
  id: Tab;
  title: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  glow: string;
  highlights: string[];
}[] = [
  {
    id: 'projects',
    title: 'Projects',
    description: 'Generate decks and documents through chat with full provenance and your own brand styles applied.',
    icon: Presentation,
    accent: '#F59E0B',
    glow: 'rgba(245,158,11,0.45)',
    highlights: ['PowerPoint', 'Word', 'Chat-driven'],
  },
  {
    id: 'styles',
    title: 'Voice Styles',
    description: 'Train custom writing voices from your samples — tone, pacing, vocabulary — and reuse them anywhere.',
    icon: Mic2,
    accent: '#6366F1',
    glow: 'rgba(99,102,241,0.45)',
    highlights: ['Custom voices', 'Sample-based', 'Reusable'],
  },
  {
    id: 'humanize',
    title: 'Humanize',
    description: 'Rewrite anything to sound undeniably human. Strip AI patterns while preserving your meaning.',
    icon: Wand2,
    accent: '#10B981',
    glow: 'rgba(16,185,129,0.45)',
    highlights: ['Anti-AI patterns', 'Tone preserved', 'Instant'],
  },
];

export default function StudioHome() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = (params?.get('tab') as Tab) ?? 'projects';
  const [tab, setTab] = useState<Tab>(initial);
  const [showNewProject, setShowNewProject] = useState(false);

  useEffect(() => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', tab);
    window.history.replaceState({}, '', newUrl.toString());
  }, [tab]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.bg,
        color: T.text,
        fontFamily: T.font,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Ambient gradient orbs ─────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -180,
          left: -120,
          width: 520,
          height: 520,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(245,158,11,0.18), rgba(245,158,11,0) 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -120,
          right: -160,
          width: 540,
          height: 540,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(99,102,241,0.15), rgba(99,102,241,0) 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage:
            'radial-gradient(ellipse at 50% 0%, #000 40%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at 50% 0%, #000 40%, transparent 75%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* YANG · DESIGN brand mark — top right */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 28,
          right: 36,
          zIndex: 2,
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
          padding: '8px 14px',
          borderRadius: 999,
          background:
            'linear-gradient(135deg, rgba(99,102,241,0.14), rgba(245,158,11,0.10))',
          border: '1px solid rgba(99,102,241,0.35)',
          boxShadow:
            '0 0 24px rgba(99,102,241,0.35), 0 0 48px rgba(245,158,11,0.18), inset 0 1px 0 rgba(255,255,255,0.06)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          pointerEvents: 'none',
          animation: 'studio-pulse 3.6s ease-in-out infinite',
        }}
      >
        <span
          style={{
            fontFamily: T.fontDisplay,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '0.04em',
            background:
              'linear-gradient(135deg, #FFFFFF 0%, #C7D2FE 60%, #6366F1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 18px rgba(99,102,241,0.55)',
            lineHeight: 1,
          }}
        >
          YANG
        </span>
        <sub
          style={{
            fontFamily: T.fontMono,
            fontSize: 9,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: T.accent2,
            fontWeight: 700,
            verticalAlign: 'sub',
            position: 'relative',
            top: 2,
            textShadow:
              '0 0 10px rgba(99,102,241,0.7), 0 0 20px rgba(99,102,241,0.4)',
          }}
        >
          DESIGN
        </sub>
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1280,
          margin: '0 auto',
          padding: '56px 32px 80px',
        }}
      >
        {/* ── HERO ──────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 32,
            marginBottom: 36,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 480px', maxWidth: 720 }}>
            {/* Eyebrow pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 14px',
                borderRadius: 999,
                background:
                  'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(99,102,241,0.10))',
                border: '1px solid rgba(245,158,11,0.25)',
                marginBottom: 22,
                boxShadow: '0 0 24px rgba(245,158,11,0.10)',
              }}
            >
              <Sparkles size={13} color={T.accent} />
              <span
                style={{
                  fontFamily: T.fontMono,
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: T.accent,
                  fontWeight: 600,
                }}
              >
                Content Studio · Beta
              </span>
            </div>

            <h1
              style={{
                fontFamily: T.fontDisplay,
                fontSize: 'clamp(40px, 6vw, 64px)',
                fontWeight: 700,
                lineHeight: 1.02,
                letterSpacing: '-0.03em',
                margin: 0,
                background:
                  'linear-gradient(135deg, #FFFFFF 0%, #F5F5F7 40%, #F59E0B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Build, voice,
              <br />
              <span
                style={{
                  background:
                    'linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #6366F1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                humanize.
              </span>
            </h1>

            <p
              style={{
                margin: '20px 0 0',
                fontSize: 16,
                lineHeight: 1.65,
                color: T.textSoft,
                maxWidth: 620,
              }}
            >
              Generate decks and documents through natural conversation, train
              custom voices that sound like you, and rewrite anything to read
              undeniably human — all in one studio.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 12,
                marginTop: 28,
                flexWrap: 'wrap',
              }}
            >
              <StudioButton
                size="lg"
                iconLeft={<Plus size={16} />}
                onClick={() => setShowNewProject(true)}
              >
                Start a New Project
              </StudioButton>
              <StudioButton
                size="lg"
                variant="subtle"
                iconLeft={<Wand2 size={16} />}
                onClick={() => setTab('humanize')}
              >
                Try Humanize
              </StudioButton>
            </div>
          </div>

          {/* Stat cluster */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))',
              gap: 12,
              flex: '0 1 320px',
            }}
          >
            {[
              { label: 'Decks', value: 'PPTX', tint: T.accent },
              { label: 'Docs', value: 'DOCX', tint: '#60A5FA' },
              { label: 'Voices', value: '∞', tint: T.accent2 },
              { label: 'Humanize', value: 'AI→You', tint: T.success },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  padding: '16px 18px',
                  background: T.bgCard,
                  border: `1px solid ${T.border}`,
                  borderRadius: 14,
                  boxShadow: T.shadowCard,
                }}
              >
                <div
                  style={{
                    fontFamily: T.fontDisplay,
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: s.tint,
                    lineHeight: 1.1,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 9,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: T.textMuted,
                    marginTop: 4,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Feature cards (clickable → switches tab) ─────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 18,
            marginBottom: 44,
          }}
        >
          {FEATURE_CARDS.map((f) => {
            const Icon = f.icon;
            const active = tab === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setTab(f.id)}
                style={{
                  textAlign: 'left',
                  padding: 22,
                  background: active
                    ? `linear-gradient(135deg, ${f.accent}10, ${f.accent}04)`
                    : T.bgCard,
                  border: `1px solid ${active ? `${f.accent}55` : T.border}`,
                  borderRadius: 16,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: active
                    ? `0 12px 36px ${f.glow.replace('0.45', '0.18')}, inset 0 1px 0 rgba(255,255,255,0.04)`
                    : T.shadowCard,
                  fontFamily: T.font,
                  color: T.text,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = `${f.accent}55`;
                  e.currentTarget.style.boxShadow = `0 16px 44px ${f.glow.replace('0.45', '0.20')}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = active
                    ? `${f.accent}55`
                    : T.border;
                  e.currentTarget.style.boxShadow = active
                    ? `0 12px 36px ${f.glow.replace('0.45', '0.18')}`
                    : T.shadowCard;
                }}
              >
                {/* Accent top line */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, transparent, ${f.accent}, transparent)`,
                    opacity: active ? 1 : 0.4,
                  }}
                />

                {/* Soft glow on hover side */}
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: -60,
                    right: -60,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${f.accent}22, transparent 70%)`,
                    filter: 'blur(20px)',
                    pointerEvents: 'none',
                  }}
                />

                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `${f.accent}14`,
                      border: `1px solid ${f.accent}40`,
                      boxShadow: `0 0 24px ${f.accent}25, inset 0 1px 0 rgba(255,255,255,0.08)`,
                    }}
                  >
                    <Icon size={22} color={f.accent} />
                  </div>
                  <h3
                    style={{
                      fontFamily: T.fontDisplay,
                      fontSize: 20,
                      fontWeight: 600,
                      margin: 0,
                      letterSpacing: '-0.01em',
                      color: T.text,
                    }}
                  >
                    {f.title}
                  </h3>
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    color: T.textSoft,
                    minHeight: 64,
                  }}
                >
                  {f.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    flexWrap: 'wrap',
                    marginTop: 16,
                    marginBottom: 14,
                  }}
                >
                  {f.highlights.map((h) => (
                    <span
                      key={h}
                      style={{
                        fontFamily: T.fontMono,
                        fontSize: 9,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: f.accent,
                        background: `${f.accent}12`,
                        border: `1px solid ${f.accent}30`,
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontWeight: 600,
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: T.fontMono,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: f.accent,
                  }}
                >
                  {active ? 'Currently viewing' : 'Open tab'}
                  <ArrowRight size={12} />
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Header for active tab ──────────────────────────── */}
        <StudioSectionHeader
          eyebrow={`${TABS.find((t) => t.id === tab)?.label ?? ''} Workspace`}
          title={
            tab === 'projects'
              ? 'Your Projects'
              : tab === 'styles'
              ? 'Your Voice Library'
              : 'Humanize Anything'
          }
          subtitle={
            tab === 'projects'
              ? 'Pick up where you left off, or start a new deck or document.'
              : tab === 'styles'
              ? 'Train and manage custom writing voices from your samples.'
              : 'Paste any text and rewrite it to sound like a real human wrote it.'
          }
          right={
            tab === 'projects' ? (
              <StudioButton iconLeft={<Plus size={16} />} onClick={() => setShowNewProject(true)}>
                New Project
              </StudioButton>
            ) : tab === 'styles' ? (
              <StudioButton
                iconLeft={<Sparkles size={16} />}
                onClick={() => router.push('/studio/styles/new')}
              >
                New Voice
              </StudioButton>
            ) : null
          }
        />

        {/* ── Tabs ──────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: 5,
            background: 'rgba(12,12,14,0.9)',
            border: `1px solid ${T.border}`,
            borderRadius: 14,
            marginBottom: 28,
            width: 'fit-content',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  background: active
                    ? 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.06))'
                    : 'transparent',
                  color: active ? T.accent : T.textDim,
                  border: active ? '1px solid rgba(245,158,11,0.35)' : '1px solid transparent',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontFamily: T.fontDisplay,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s ease',
                  boxShadow: active ? '0 0 24px rgba(245,158,11,0.2)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = T.text;
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = T.textDim;
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </div>

        <div className="studio-fadein" key={tab}>
          {tab === 'projects' && <ProjectsTab onCreate={() => setShowNewProject(true)} />}
          {tab === 'styles' && <StylesTab />}
          {tab === 'humanize' && <HumanizePlayground />}
        </div>
      </div>

      <NewProjectModal open={showNewProject} onClose={() => setShowNewProject(false)} />
    </div>
  );
}

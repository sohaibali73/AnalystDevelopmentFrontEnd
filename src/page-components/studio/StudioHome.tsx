'use client';

/**
 * StudioHome — /studio
 * Tabbed shell hosting Projects · Styles · Humanize.
 * Hidden from the main nav; reachable only by URL.
 */

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Sparkles, Mic2, Wand2, FolderOpen } from 'lucide-react';
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
        padding: '40px 32px 60px',
        background: T.bg,
        color: T.text,
        fontFamily: T.font,
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <StudioSectionHeader
          eyebrow="Content Studio"
          title="Build, voice, humanize"
          subtitle="Generate decks and documents through chat, train custom voices for your writing, and rewrite anything to sound undeniably human."
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

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: 4,
            background: 'rgba(12,12,14,0.9)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14,
            marginBottom: 32,
            width: 'fit-content',
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
                    ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.08))'
                    : 'transparent',
                  color: active ? T.accent : T.textDim,
                  border: active ? '1px solid rgba(245,158,11,0.30)' : '1px solid transparent',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontFamily: T.fontDisplay,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s ease',
                  boxShadow: active ? '0 0 24px rgba(245,158,11,0.15)' : 'none',
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </div>

        <div>
          {tab === 'projects' && <ProjectsTab onCreate={() => setShowNewProject(true)} />}
          {tab === 'styles' && <StylesTab />}
          {tab === 'humanize' && <HumanizePlayground />}
        </div>
      </div>

      <NewProjectModal open={showNewProject} onClose={() => setShowNewProject(false)} />
    </div>
  );
}

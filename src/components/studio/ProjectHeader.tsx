'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Trash2,
  Archive,
  Mic2,
  Wand2,
  Eye,
  Edit3,
  Play,
  Presentation as PresentationIcon,
  FileText,
  MessageCircle,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { studioApi, emitStudioRefresh, type StudioProject, type StudioArtifact } from '@/lib/studioApi';
import { studioTheme as T } from './theme';
import { StudioBadge, StudioButton, Spinner } from './StudioPrimitives';
import { VersionDropdown } from './VersionDropdown';

interface Props {
  project: StudioProject;
  artifacts: StudioArtifact[];
  currentArtifact: StudioArtifact | null;
  onSelectArtifact: (a: StudioArtifact) => void;
  mode: 'preview' | 'edit' | 'present';
  onModeChange: (m: 'preview' | 'edit' | 'present') => void;
  onProjectChanged: (p: StudioProject) => void;
}

const KIND_META = {
  pptx: { icon: PresentationIcon, color: '#FB923C' },
  docx: { icon: FileText, color: '#60A5FA' },
  chat: { icon: MessageCircle, color: '#A78BFA' },
  site: { icon: Globe, color: '#34D399' },
} as const;

export function ProjectHeader({
  project,
  artifacts,
  currentArtifact,
  onSelectArtifact,
  mode,
  onModeChange,
  onProjectChanged,
}: Props) {
  const router = useRouter();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(project.title);
  const KindIcon = KIND_META[project.kind].icon;

  useEffect(() => setTitleValue(project.title), [project.title]);

  async function saveTitle() {
    if (!titleValue.trim() || titleValue === project.title) {
      setEditingTitle(false);
      setTitleValue(project.title);
      return;
    }
    try {
      const r = await studioApi.patchProject(project.id, { title: titleValue.trim() });
      onProjectChanged(r.project);
      emitStudioRefresh('projects');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to rename');
      setTitleValue(project.title);
    } finally {
      setEditingTitle(false);
    }
  }

  async function handleDownload() {
    if (!currentArtifact) return;
    try {
      const blob = await studioApi.downloadArtifact(project.id, currentArtifact.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentArtifact.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e: any) {
      toast.error(e?.message || 'Download failed');
    }
  }

  async function handleArchive() {
    try {
      const r = await studioApi.patchProject(project.id, { is_archived: !project.is_archived });
      onProjectChanged(r.project);
      emitStudioRefresh('projects');
      toast.success(project.is_archived ? 'Unarchived' : 'Archived');
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${project.title}"?`)) return;
    try {
      await studioApi.deleteProject(project.id, true);
      emitStudioRefresh('projects');
      router.push('/studio');
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 20px',
        background: T.bgCard,
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
        flexWrap: 'wrap',
      }}
    >
      <button
        onClick={() => router.push('/studio')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          background: 'transparent',
          color: T.textDim,
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 13,
          fontFamily: T.font,
        }}
      >
        <ArrowLeft size={14} /> Studio
      </button>

      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${KIND_META[project.kind].color}22`,
          border: `1px solid ${KIND_META[project.kind].color}55`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <KindIcon size={18} color={KIND_META[project.kind].color} />
      </div>

      {editingTitle ? (
        <input
          value={titleValue}
          autoFocus
          onChange={(e) => setTitleValue(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'Escape') {
              setTitleValue(project.title);
              setEditingTitle(false);
            }
          }}
          style={{
            background: 'transparent',
            border: '1px solid rgba(245,158,11,0.30)',
            borderRadius: 8,
            padding: '6px 10px',
            color: T.text,
            fontFamily: T.fontDisplay,
            fontSize: 18,
            fontWeight: 700,
            minWidth: 240,
            outline: 'none',
          }}
        />
      ) : (
        <h1
          onClick={() => setEditingTitle(true)}
          style={{
            margin: 0,
            fontFamily: T.fontDisplay,
            fontSize: 18,
            fontWeight: 700,
            color: T.text,
            cursor: 'text',
            padding: '4px 8px',
            borderRadius: 6,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(245,158,11,0.06)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title="Click to rename"
        >
          {project.title || 'Untitled'}
        </h1>
      )}

      {project.style_profile_id && (
        <StudioBadge color="blue">
          <Mic2 size={10} /> Voice
        </StudioBadge>
      )}
      {project.humanize_settings?.enabled && (
        <StudioBadge color="gold">
          <Wand2 size={10} /> Humanize
        </StudioBadge>
      )}

      <div style={{ flex: 1 }} />

      {/* Mode toggle */}
      {project.kind !== 'chat' && (
        <ModeToggle mode={mode} onChange={onModeChange} kind={project.kind} />
      )}

      <VersionDropdown
        artifacts={artifacts}
        current={currentArtifact}
        onSelect={onSelectArtifact}
      />

      {currentArtifact && (
        <StudioButton variant="outline" iconLeft={<Download size={14} />} onClick={handleDownload}>
          Download
        </StudioButton>
      )}

      <button
        onClick={handleArchive}
        title={project.is_archived ? 'Unarchive' : 'Archive'}
        style={iconBtn()}
      >
        <Archive size={14} />
      </button>
      <button onClick={handleDelete} title="Delete" style={iconBtn('#EF4444')}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function iconBtn(color: string = T.textDim): React.CSSProperties {
  return {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: 'transparent',
    color,
    border: '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

function ModeToggle({
  mode,
  onChange,
  kind,
}: {
  mode: 'preview' | 'edit' | 'present';
  onChange: (m: 'preview' | 'edit' | 'present') => void;
  kind: 'pptx' | 'docx' | 'chat' | 'site';
}) {
  const items: Array<{ id: 'preview' | 'edit' | 'present'; label: string; icon: React.ElementType }> = [
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'edit', label: 'Edit', icon: Edit3 },
  ];
  if (kind === 'pptx') items.push({ id: 'present', label: 'Present', icon: Play });

  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        padding: 3,
        background: 'rgba(12,12,14,0.9)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
      }}
    >
      {items.map(({ id, label, icon: Icon }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: active ? 'rgba(245,158,11,0.15)' : 'transparent',
              color: active ? T.accent : T.textDim,
              border: active ? '1px solid rgba(245,158,11,0.30)' : '1px solid transparent',
              borderRadius: 7,
              cursor: 'pointer',
              fontFamily: T.fontDisplay,
              fontSize: 12,
              letterSpacing: '0.06em',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            <Icon size={12} /> {label}
          </button>
        );
      })}
    </div>
  );
}

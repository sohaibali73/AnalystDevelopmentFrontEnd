'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { studioApi, onStudioRefresh, emitStudioRefresh, type StudioProject, type ProjectKind } from '@/lib/studioApi';
import { studioTheme as T } from '@/components/studio/theme';
import { ProjectCard } from '@/components/studio/ProjectCard';
import { StudioButton, StudioSelect, Spinner, StudioInput, StudioModal } from '@/components/studio/StudioPrimitives';

interface Props {
  onCreate: () => void;
}

type KindFilter = '' | 'pptx' | 'docx' | 'chat';
type SortOrder = 'recent' | 'name';

export function ProjectsTab({ onCreate }: Props) {
  const router = useRouter();
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<KindFilter>('');
  const [sort, setSort] = useState<SortOrder>('recent');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [search, setSearch] = useState('');
  const [renameTarget, setRenameTarget] = useState<StudioProject | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await studioApi.listProjects({
        kind: (kind || undefined) as ProjectKind | undefined,
        include_archived: includeArchived,
        limit: 100,
      });
      setProjects(r.projects);
    } catch (e: any) {
      setError(e?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [kind, includeArchived]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return onStudioRefresh((d) => {
      if (d.scope === 'projects' || d.scope === 'project') load();
    });
  }, [load]);

  const filtered = projects
    .filter((p) => (search ? p.title.toLowerCase().includes(search.toLowerCase()) : true))
    .sort((a, b) => {
      if (sort === 'name') return (a.title || '').localeCompare(b.title || '');
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  async function handleArchive(p: StudioProject) {
    try {
      await studioApi.patchProject(p.id, { is_archived: !p.is_archived });
      toast.success(p.is_archived ? 'Project unarchived' : 'Project archived');
      emitStudioRefresh('projects');
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    }
  }

  async function handleDelete(p: StudioProject) {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try {
      await studioApi.deleteProject(p.id, true);
      toast.success('Project deleted');
      emitStudioRefresh('projects');
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    }
  }

  async function handleRenameSave() {
    if (!renameTarget) return;
    const v = renameValue.trim();
    if (!v) return;
    try {
      await studioApi.patchProject(renameTarget.id, { title: v });
      toast.success('Renamed');
      setRenameTarget(null);
      emitStudioRefresh('projects');
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    }
  }

  return (
    <div>
      {/* Filters */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 400 }}>
          <Search
            size={16}
            color={T.textDim}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
          />
          <StudioInput
            value={search}
            onChange={setSearch}
            placeholder="Search projects…"
            style={{ paddingLeft: 38 }}
          />
        </div>
        <StudioSelect
          value={kind}
          onChange={setKind}
          options={[
            { value: '', label: 'All kinds' },
            { value: 'pptx', label: 'PowerPoint' },
            { value: 'docx', label: 'Word' },
            { value: 'chat', label: 'Chat only' },
          ]}
        />
        <StudioSelect
          value={sort}
          onChange={setSort}
          options={[
            { value: 'recent', label: 'Recent' },
            { value: 'name', label: 'Name' },
          ]}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.textDim, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
            style={{ accentColor: T.accent }}
          />
          Show archived
        </label>
      </div>

      {/* Body */}
      {loading && projects.length === 0 ? (
        <SkeletonGrid />
      ) : error ? (
        <div
          style={{
            padding: 32,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12,
            color: '#FCA5A5',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div>Couldn't load projects: {error}</div>
          <StudioButton variant="outline" onClick={load}>
            Retry
          </StudioButton>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onCreate={onCreate} hasSearch={!!search} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 18,
          }}
        >
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onClick={() => router.push(`/studio/projects/${p.id}`)}
              onRename={() => {
                setRenameTarget(p);
                setRenameValue(p.title);
              }}
              onArchive={() => handleArchive(p)}
              onDelete={() => handleDelete(p)}
            />
          ))}
          {/* + tile */}
          <div
            onClick={onCreate}
            style={{
              minHeight: 240,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed rgba(245,158,11,0.20)',
              borderRadius: 14,
              cursor: 'pointer',
              color: T.textDim,
              transition: 'all 0.2s ease',
              flexDirection: 'column',
              gap: 8,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(245,158,11,0.50)';
              e.currentTarget.style.color = T.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(245,158,11,0.20)';
              e.currentTarget.style.color = T.textDim;
            }}
          >
            <Plus size={28} />
            <span style={{ fontFamily: T.fontDisplay, fontSize: 13, letterSpacing: '0.08em' }}>
              NEW PROJECT
            </span>
          </div>
        </div>
      )}

      <StudioModal
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title="Rename project"
        width={460}
      >
        <StudioInput
          value={renameValue}
          onChange={setRenameValue}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRenameSave();
          }}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
          <StudioButton variant="ghost" onClick={() => setRenameTarget(null)}>
            Cancel
          </StudioButton>
          <StudioButton onClick={handleRenameSave}>Save</StudioButton>
        </div>
      </StudioModal>
    </div>
  );
}

function EmptyState({ onCreate, hasSearch }: { onCreate: () => void; hasSearch: boolean }) {
  return (
    <div
      style={{
        padding: '60px 24px',
        background: 'rgba(245,158,11,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        textAlign: 'center',
      }}
    >
      <h3 style={{ fontFamily: T.fontDisplay, fontSize: 22, marginBottom: 8 }}>
        {hasSearch ? 'No projects match' : 'No projects yet'}
      </h3>
      <p style={{ color: T.textDim, marginBottom: 20 }}>
        {hasSearch ? 'Try a different search.' : 'Start a new pitch deck or fund memo to begin.'}
      </p>
      {!hasSearch && (
        <StudioButton iconLeft={<Plus size={16} />} onClick={onCreate}>
          Create your first project
        </StudioButton>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 240,
            background: '#0D0D10',
            border: '1px solid rgba(245,158,11,0.08)',
            borderRadius: 14,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div className="studio-skeleton" />
        </div>
      ))}
      <style jsx>{`
        .studio-skeleton {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(212, 169, 68, 0) 0%,
            rgba(212, 169, 68, 0.05) 50%,
            rgba(212, 169, 68, 0) 100%
          );
          animation: shimmer 1.6s infinite;
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

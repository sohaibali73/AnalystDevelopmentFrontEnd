'use client';

/**
 * ProjectWorkspace — /studio/projects/:id
 * Two-pane: chat (left) | preview/editor (right). For 'chat' kind, chat takes full width.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  studioApi,
  onStudioRefresh,
  type StudioProject,
  type StudioArtifact,
  type EditOp,
} from '@/lib/studioApi';
import { studioTheme as T } from '@/components/studio/theme';
import { ProjectHeader } from '@/components/studio/ProjectHeader';
import { PreviewPane } from '@/components/studio/PreviewPane';
import { SitePreviewPane } from '@/components/studio/SitePreviewPane';
import { StudioChatPane } from '@/components/studio/StudioChatPane';
import { EditOpsBuffer, FindReplaceBar } from '@/components/studio/EditOpsBuffer';
import { Spinner, StudioButton } from '@/components/studio/StudioPrimitives';
import { StudioProvider } from '@/components/studio/StudioContext';
import { Trash2, Copy as CopyIcon } from 'lucide-react';

type Mode = 'preview' | 'edit' | 'present';

export default function ProjectWorkspace() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<StudioProject | null>(null);
  const [artifacts, setArtifacts] = useState<StudioArtifact[]>([]);
  const [currentArtifactId, setCurrentArtifactId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('preview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingOps, setPendingOps] = useState<EditOp[]>([]);
  const [saving, setSaving] = useState(false);
  const [splitX, setSplitX] = useState(0.42); // chat pane width fraction

  const load = useCallback(async () => {
    try {
      const r = await studioApi.getProject(projectId);
      setProject(r.project);
      setArtifacts(r.artifacts);
      setCurrentArtifactId((prev) => {
        if (prev && r.artifacts.some((a) => a.id === prev)) return prev;
        // Prefer URL param, then current_artifact_id, then latest
        const verParam = searchParams?.get('ver');
        if (verParam) {
          const v = parseInt(verParam);
          const match = r.artifacts.find((a) => a.version === v);
          if (match) return match.id;
        }
        if (r.project.current_artifact_id) return r.project.current_artifact_id;
        if (r.artifacts.length > 0) {
          const latest = [...r.artifacts].sort((a, b) => b.version - a.version)[0];
          return latest.id;
        }
        return null;
      });
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Project not found');
    } finally {
      setLoading(false);
    }
  }, [projectId, searchParams]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return onStudioRefresh((d) => {
      if (d.scope === 'project' && d.id === projectId) load();
    });
  }, [load, projectId]);

  // URL sync for ver
  useEffect(() => {
    const a = artifacts.find((x) => x.id === currentArtifactId);
    if (a) {
      const url = new URL(window.location.href);
      url.searchParams.set('ver', String(a.version));
      window.history.replaceState({}, '', url.toString());
    }
  }, [currentArtifactId, artifacts]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const cmd = e.metaKey || e.ctrlKey;
      if (cmd && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (pendingOps.length > 0) handleSave();
      }
      if (cmd && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setMode((m) => (m === 'edit' ? 'preview' : 'edit'));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const currentArtifact = artifacts.find((a) => a.id === currentArtifactId) ?? null;

  function pushOp(op: EditOp) {
    setPendingOps((prev) => [...prev, op]);
  }

  async function handleSave() {
    if (!currentArtifact || pendingOps.length === 0) return;
    setSaving(true);
    try {
      const r = await studioApi.applyEdits(projectId, currentArtifact.id, pendingOps);
      setPendingOps([]);
      // Refresh project + artifacts to pick up the new version
      await load();
      setCurrentArtifactId(r.artifact.id);
      toast.success(`Saved as v${r.artifact.version}`);
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <FullCenter>
        <Spinner size={28} />
        <span style={{ color: T.textDim, fontSize: 13 }}>Loading project…</span>
      </FullCenter>
    );
  }
  if (error || !project) {
    return (
      <FullCenter>
        <div style={{ color: '#FCA5A5', marginBottom: 14 }}>{error || 'Not found'}</div>
        <StudioButton onClick={() => router.push('/studio')}>Back to Studio</StudioButton>
      </FullCenter>
    );
  }

  const chatOnly = project.kind === 'chat';
  const isSite = project.kind === 'site';

  // Present mode
  if (mode === 'present' && currentArtifact?.kind === 'pptx') {
    router.push(`/studio/projects/${projectId}/present/${currentArtifact.id}`);
    return null;
  }

  return (
    <StudioProvider>
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: T.bg,
        color: T.text,
        fontFamily: T.font,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Ambient glow backdrop */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -200,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 900,
          height: 500,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(245,158,11,0.10), rgba(99,102,241,0.06) 40%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <ProjectHeader
        project={project}
        artifacts={artifacts}
        currentArtifact={currentArtifact}
        onSelectArtifact={(a) => setCurrentArtifactId(a.id)}
        mode={mode}
        onModeChange={(m) => setMode(m)}
        onProjectChanged={(p) => setProject(p)}
      />

      <div
        style={{
          flex: 1,
          display: 'flex',
          minHeight: 0,
          position: 'relative',
        }}
      >
        {/* Chat pane */}
        <div
          style={{
            width: chatOnly ? '100%' : `${splitX * 100}%`,
            minWidth: chatOnly ? '100%' : 320,
            borderRight: chatOnly ? 'none' : '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <StudioChatPane project={project} onChatFinished={load} />
        </div>

        {/* Splitter */}
        {!chatOnly && (
          <div
            onMouseDown={(e) => {
              const start = e.clientX;
              const startFrac = splitX;
              const containerWidth = (e.currentTarget.parentElement as HTMLDivElement).clientWidth;
              function onMove(ev: MouseEvent) {
                const dx = ev.clientX - start;
                const next = Math.max(0.25, Math.min(0.7, startFrac + dx / containerWidth));
                setSplitX(next);
              }
              function onUp() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
              }
              document.addEventListener('mousemove', onMove);
              document.addEventListener('mouseup', onUp);
            }}
            style={{
              width: 6,
              cursor: 'col-resize',
              flexShrink: 0,
              position: 'relative',
              background:
                'linear-gradient(180deg, rgba(245,158,11,0.04) 0%, rgba(99,102,241,0.06) 50%, rgba(245,158,11,0.04) 100%)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                'linear-gradient(180deg, rgba(245,158,11,0.20) 0%, rgba(99,102,241,0.25) 50%, rgba(245,158,11,0.20) 100%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                'linear-gradient(180deg, rgba(245,158,11,0.04) 0%, rgba(99,102,241,0.06) 50%, rgba(245,158,11,0.04) 100%)';
            }}
          >
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 2,
                height: 36,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.18)',
                pointerEvents: 'none',
              }}
            />
          </div>
        )}

        {/* Preview pane */}
        {!chatOnly && (
          <div style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
            {isSite ? (
              <SitePreviewPane project={project} artifacts={artifacts} onArtifactsChanged={load} />
            ) : (
              <>
                {mode === 'edit' && currentArtifact && (
                  <EditToolbar
                    artifact={currentArtifact}
                    onAddOp={pushOp}
                    pendingOps={pendingOps}
                    onRemoveOp={(idx) =>
                      setPendingOps((prev) => prev.filter((_, i) => i !== idx))
                    }
                  />
                )}
                <div style={{ flex: 1, minHeight: 0 }}>
                  <PreviewPane projectId={projectId} artifact={currentArtifact} />
                </div>
                <EditOpsBuffer
                  ops={pendingOps}
                  saving={saving}
                  onSave={handleSave}
                  onDiscard={() => setPendingOps([])}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
    </StudioProvider>
  );
}

function FullCenter({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        background: T.bg,
      }}
    >
      {children}
    </div>
  );
}

// ─── Edit toolbar ───────────────────────────────────────────────────────

function EditToolbar({
  artifact,
  onAddOp,
  pendingOps,
  onRemoveOp,
}: {
  artifact: StudioArtifact;
  onAddOp: (op: EditOp) => void;
  pendingOps: EditOp[];
  onRemoveOp: (idx: number) => void;
}) {
  const [slideTarget, setSlideTarget] = useState<number>(1);
  const [appendVal, setAppendVal] = useState('');

  return (
    <div
      style={{
        padding: 12,
        borderBottom: '1px solid rgba(245,158,11,0.10)',
        background: 'rgba(12,12,14,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {artifact.kind !== 'site' && (
        <FindReplaceBar onAddOp={onAddOp} kind={artifact.kind} />
      )}

      {artifact.kind === 'pptx' && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: T.fontMono }}>
            Slide ops:
          </span>
          <input
            type="number"
            value={slideTarget}
            min={1}
            max={artifact.slide_count ?? 99}
            onChange={(e) => setSlideTarget(parseInt(e.target.value || '1'))}
            style={{
              width: 70,
              padding: '6px 8px',
              background: 'rgba(12,12,14,0.9)',
              color: T.text,
              border: '1px solid rgba(245,158,11,0.15)',
              borderRadius: 6,
              fontFamily: T.font,
              fontSize: 13,
            }}
          />
          <ToolBtn onClick={() => onAddOp({ type: 'duplicate_slide', slide: slideTarget })}>
            <CopyIcon size={12} /> Duplicate slide
          </ToolBtn>
          <ToolBtn
            danger
            onClick={() => onAddOp({ type: 'delete_slide', slide: slideTarget })}
          >
            <Trash2 size={12} /> Delete slide
          </ToolBtn>
        </div>
      )}

      {artifact.kind === 'docx' && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={appendVal}
            onChange={(e) => setAppendVal(e.target.value)}
            placeholder="Append paragraph or heading text…"
            style={{
              flex: 1,
              minWidth: 200,
              padding: '8px 10px',
              background: 'rgba(12,12,14,0.9)',
              color: T.text,
              border: '1px solid rgba(245,158,11,0.15)',
              borderRadius: 6,
              fontFamily: T.font,
              fontSize: 13,
            }}
          />
          <ToolBtn
            onClick={() => {
              if (!appendVal) return;
              onAddOp({ type: 'append_paragraph', value: appendVal });
              setAppendVal('');
            }}
          >
            + Paragraph
          </ToolBtn>
          <ToolBtn
            onClick={() => {
              if (!appendVal) return;
              onAddOp({ type: 'append_heading', value: appendVal, level: 2 });
              setAppendVal('');
            }}
          >
            + Heading
          </ToolBtn>
        </div>
      )}

      {pendingOps.length > 0 && (
        <details>
          <summary style={{ cursor: 'pointer', fontSize: 12, color: T.accent }}>
            View staged ops ({pendingOps.length})
          </summary>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pendingOps.map((op, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  background: 'rgba(12,12,14,0.7)',
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: T.fontMono,
                  color: T.textDim,
                }}
              >
                <span>{describeOp(op)}</span>
                <button
                  onClick={() => onRemoveOp(i)}
                  style={{
                    background: 'transparent',
                    color: '#EF4444',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function ToolBtn({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.08)',
        color: danger ? '#EF4444' : T.accent,
        border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.20)'}`,
        borderRadius: 6,
        cursor: 'pointer',
        fontFamily: T.fontDisplay,
        fontSize: 11,
        letterSpacing: '0.05em',
        fontWeight: 700,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </button>
  );
}

function describeOp(op: EditOp): string {
  switch (op.type) {
    case 'text_replace':
      return `replace "${(op as any).find}" → "${(op as any).replace}"`;
    case 'delete_slide':
      return `delete slide ${(op as any).slide}`;
    case 'duplicate_slide':
      return `duplicate slide ${(op as any).slide}`;
    case 'reorder_slides':
      return `reorder slides`;
    case 'append_paragraph':
      return `append paragraph: "${truncate((op as any).value)}"`;
    case 'append_heading':
      return `append H${(op as any).level || 2}: "${truncate((op as any).value)}"`;
    case 'replace_paragraph':
      return `replace paragraph #${(op as any).index}`;
    case 'text':
      return `edit slide ${(op as any).slide} shape #${(op as any).shape_index}`;
    case 'add_slide_note':
      return `add note to slide ${(op as any).slide}`;
    default:
      return JSON.stringify(op).slice(0, 80);
  }
}

function truncate(s: string, n = 40) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

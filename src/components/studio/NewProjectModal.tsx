'use client';

import React, { useEffect, useState } from 'react';
import { Presentation, FileText, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { studioApi, emitStudioRefresh, type ProjectKind, type StudioStyle } from '@/lib/studioApi';
import { StudioModal, StudioInput, StudioButton, StudioSelect, Spinner } from './StudioPrimitives';
import { studioTheme as T } from './theme';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultStyleId?: string;
}

const KIND_OPTIONS = [
  { value: 'pptx' as ProjectKind, label: 'PowerPoint (.pptx)', icon: Presentation, color: '#FB923C' },
  { value: 'docx' as ProjectKind, label: 'Word document (.docx)', icon: FileText, color: '#60A5FA' },
  { value: 'chat' as ProjectKind, label: 'Just chat (no document)', icon: MessageCircle, color: '#A78BFA' },
];

export function NewProjectModal({ open, onClose, defaultStyleId }: Props) {
  const router = useRouter();
  const [kind, setKind] = useState<ProjectKind>('pptx');
  const [title, setTitle] = useState('');
  const [styleId, setStyleId] = useState<string>(defaultStyleId ?? '');
  const [humanizeOn, setHumanizeOn] = useState(false);
  const [intensity, setIntensity] = useState<'light' | 'standard' | 'max'>('standard');
  const [seo, setSeo] = useState<'' | 'linkedin'>('');
  const [styles, setStyles] = useState<StudioStyle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    studioApi
      .listStyles()
      .then((r) => setStyles(r.styles.filter((s) => s.status === 'ready')))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (open) {
      setStyleId(defaultStyleId ?? '');
      setTitle('');
      setKind('pptx');
      setHumanizeOn(false);
    }
  }, [open, defaultStyleId]);

  async function handleCreate() {
    setLoading(true);
    try {
      const { project } = await studioApi.createProject({
        kind,
        title: title.trim() || undefined,
        style_profile_id: styleId || null,
        humanize_settings: humanizeOn
          ? {
              enabled: true,
              intensity,
              seo_target: seo || null,
              preserve_facts: true,
              auto_apply: false,
            }
          : undefined,
      });
      emitStudioRefresh('projects');
      toast.success('Project created');
      onClose();
      router.push(`/studio/projects/${project.id}`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <StudioModal open={open} onClose={onClose} title="New project" width={580}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <Label>What are you making?</Label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
            {KIND_OPTIONS.map((o) => {
              const Icon = o.icon;
              const active = kind === o.value;
              return (
                <button
                  key={o.value}
                  onClick={() => setKind(o.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    background: active ? 'rgba(245,158,11,0.10)' : 'rgba(12,12,14,0.7)',
                    border: `1px solid ${active ? 'rgba(245,158,11,0.40)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 12,
                    cursor: 'pointer',
                    color: T.text,
                    textAlign: 'left',
                    fontFamily: T.font,
                    fontSize: 14,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon size={22} color={o.color} />
                  <span style={{ flex: 1, fontWeight: 600 }}>{o.label}</span>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: `2px solid ${active ? T.accent : 'rgba(255,255,255,0.2)'}`,
                      background: active ? T.accent : 'transparent',
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label>Title</Label>
          <StudioInput value={title} onChange={setTitle} placeholder="Untitled project" autoFocus />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <Label>Voice clone</Label>
            <StudioSelect<string>
              value={styleId}
              onChange={setStyleId}
              options={[
                { value: '', label: 'None' },
                ...styles.map((s) => ({ value: s.id, label: s.name })),
              ]}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <Label>Humanize</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 38 }}>
              <Toggle on={humanizeOn} onChange={setHumanizeOn} />
              <span style={{ fontSize: 13, color: humanizeOn ? T.text : T.textDim }}>
                {humanizeOn ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </div>

        {humanizeOn && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <Label>Intensity</Label>
              <StudioSelect
                value={intensity}
                onChange={(v) => setIntensity(v as any)}
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'standard', label: 'Standard' },
                  { value: 'max', label: 'Max' },
                ]}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <Label>SEO target</Label>
              <StudioSelect
                value={seo}
                onChange={(v) => setSeo(v as any)}
                options={[
                  { value: '', label: 'None' },
                  { value: 'linkedin', label: 'LinkedIn' },
                ]}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
          <StudioButton variant="ghost" onClick={onClose}>
            Cancel
          </StudioButton>
          <StudioButton onClick={handleCreate} disabled={loading}>
            {loading ? <Spinner size={14} color="#0a0a0a" /> : null}
            Create &amp; Open
          </StudioButton>
        </div>
      </div>
    </StudioModal>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: T.fontMono,
        fontSize: 10,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: T.textDim,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 44,
        height: 24,
        background: on ? T.accent : 'rgba(255,255,255,0.1)',
        border: `1px solid ${on ? T.accent : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 999,
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 22 : 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: on ? '#0a0a0a' : '#fff',
          transition: 'left 0.2s ease',
        }}
      />
    </button>
  );
}

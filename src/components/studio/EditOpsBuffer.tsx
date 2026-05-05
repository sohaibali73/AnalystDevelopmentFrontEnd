'use client';

import React from 'react';
import { Save, X, Search, Plus, Trash2 } from 'lucide-react';
import { studioTheme as T } from './theme';
import { StudioButton, Spinner } from './StudioPrimitives';
import type { EditOp } from '@/lib/studioApi';

interface Props {
  ops: EditOp[];
  onSave: () => void;
  onDiscard: () => void;
  saving: boolean;
}

export function EditOpsBuffer({ ops, onSave, onDiscard, saving }: Props) {
  if (ops.length === 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        right: 18,
        bottom: 18,
        zIndex: 30,
        background: '#111114',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(245,158,11,0.30)',
        borderRadius: 14,
        padding: '12px 14px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 32px rgba(245,158,11,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontFamily: T.fontDisplay,
            fontSize: 14,
            fontWeight: 700,
            color: T.text,
            letterSpacing: '0.04em',
          }}
        >
          {ops.length} unsaved {ops.length === 1 ? 'change' : 'changes'}
        </span>
        <span style={{ fontSize: 11, color: T.textDim }}>Cmd+S to save</span>
      </div>
      <StudioButton variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>
        <X size={14} /> Discard
      </StudioButton>
      <StudioButton onClick={onSave} disabled={saving} size="sm">
        {saving ? <Spinner size={12} color="#0a0a0a" /> : <Save size={14} />}
        Save → new version
      </StudioButton>
    </div>
  );
}

interface FindReplaceProps {
  onAddOp: (op: EditOp) => void;
  kind: 'pptx' | 'docx';
}

export function FindReplaceBar({ onAddOp, kind }: FindReplaceProps) {
  const [find, setFind] = React.useState('');
  const [replace, setReplace] = React.useState('');
  const apply = () => {
    if (!find) return;
    onAddOp({
      type: 'text_replace',
      find,
      replace,
      all: true,
    } as EditOp);
    setFind('');
    setReplace('');
  };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: 10,
        background: 'rgba(12,12,14,0.9)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
      }}
    >
      <Search size={14} color={T.textDim} />
      <input
        value={find}
        onChange={(e) => setFind(e.target.value)}
        placeholder="Find"
        style={inputStyle}
      />
      <span style={{ color: T.textDim }}>→</span>
      <input
        value={replace}
        onChange={(e) => setReplace(e.target.value)}
        placeholder="Replace"
        style={inputStyle}
      />
      <button
        onClick={apply}
        disabled={!find}
        style={{
          padding: '6px 10px',
          fontSize: 12,
          fontFamily: T.fontDisplay,
          letterSpacing: '0.05em',
          fontWeight: 700,
          background: 'rgba(255,255,255,0.06)',
          color: T.accent,
          border: '1px solid rgba(245,158,11,0.30)',
          borderRadius: 6,
          cursor: find ? 'pointer' : 'not-allowed',
          opacity: find ? 1 : 0.5,
        }}
      >
        Replace all
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  color: 'var(--text, #fafafa)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 6,
  padding: '6px 10px',
  fontFamily: T.font,
  fontSize: 13,
  outline: 'none',
  minWidth: 0,
};

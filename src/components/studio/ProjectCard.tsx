'use client';

import React from 'react';
import { Presentation, FileText, MessageCircle, Globe, Archive, Trash2, Edit2 } from 'lucide-react';
import { studioTheme as T, relativeTime } from './theme';
import type { StudioProject } from '@/lib/studioApi';
import { StudioBadge } from './StudioPrimitives';

interface ProjectCardProps {
  project: StudioProject;
  onClick: () => void;
  onRename?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

const KIND_ICONS = {
  pptx: Presentation,
  docx: FileText,
  chat: MessageCircle,
  site: Globe,
} as const;

const KIND_COLORS = {
  pptx: '#FB923C',
  docx: '#60A5FA',
  chat: '#A78BFA',
  site: '#34D399',
} as const;

export function ProjectCard({ project, onClick, onRename, onArchive, onDelete }: ProjectCardProps) {
  const Icon = KIND_ICONS[project.kind];
  const color = KIND_COLORS[project.kind];
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenuOpen(true);
      }}
      style={{
        position: 'relative',
        background: '#0D0D10',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(245,158,11,0.30)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 12px 36px rgba(255,255,255,0.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          height: 140,
          background: `linear-gradient(135deg, ${color}22 0%, ${color}08 100%)`,
          borderBottom: '1px solid rgba(245,158,11,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Icon size={48} color={color} style={{ opacity: 0.7 }} />
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <StudioBadge color="gold">{project.kind.toUpperCase()}</StudioBadge>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div
          style={{
            fontFamily: T.fontDisplay,
            fontSize: 16,
            fontWeight: 700,
            color: T.text,
            letterSpacing: '0.02em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {project.title || 'Untitled'}
        </div>
        <div
          style={{
            fontSize: 12,
            color: T.textDim,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>{relativeTime(project.updated_at)}</span>
          {project.current_artifact_id && (
            <>
              <span>·</span>
              <span style={{ color: T.accent }}>has artifact</span>
            </>
          )}
          {project.style_profile_id && (
            <>
              <span>·</span>
              <span style={{ color: '#A78BFA' }}>voice</span>
            </>
          )}
        </div>
      </div>

      {/* Context menu */}
      {menuOpen && (
        <>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
            }}
            style={{ position: 'fixed', inset: 0, zIndex: 50 }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              right: 12,
              top: 12,
              background: '#111114',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 10,
              padding: 4,
              minWidth: 160,
              zIndex: 60,
              boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
            }}
          >
            {onRename && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onRename();
                }}
                style={menuItemStyle()}
              >
                <Edit2 size={14} /> Rename
              </button>
            )}
            {onArchive && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onArchive();
                }}
                style={menuItemStyle()}
              >
                <Archive size={14} /> {project.is_archived ? 'Unarchive' : 'Archive'}
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                style={menuItemStyle('#EF4444')}
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function menuItemStyle(color: string = T.text): React.CSSProperties {
  return {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    fontSize: 13,
    fontFamily: T.font,
    background: 'transparent',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    color,
    textAlign: 'left',
  };
}

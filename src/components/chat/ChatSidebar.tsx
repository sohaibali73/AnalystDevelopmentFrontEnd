'use client';

/**
 * ChatSidebar — Modern frosted glass conversation list sidebar with search, rename, delete.
 * Redesigned with contemporary visual elements and clean aesthetic.
 */

import React, { useState } from 'react';
import {
  Plus, MessageSquare, Trash2, ChevronLeft,
  Search, Pencil, X, Wifi, WifiOff, Sparkles,
  CheckSquare, Square, ListChecks,
} from 'lucide-react';
import { toast } from 'sonner';
import { Shimmer } from '@/components/ai-elements/shimmer';
import apiClient from '@/lib/api';
import { Conversation as ConversationType } from '@/types/api';
import { stripSystemInstructions, type ChatColors } from './chat-utils';

const logo = '/potomac-icon.png';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatSidebarProps {
  conversations: ConversationType[];
  selectedConversation: ConversationType | null;
  loadingConversations: boolean;
  sidebarCollapsed: boolean;
  isDark: boolean;
  colors: ChatColors;
  connStatus: 'connected' | 'checking' | 'disconnected' | 'unknown';
  isCurrentConversationBlank?: boolean;
  onSelectConversation: (conv: ConversationType) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onBulkDeleteConversations?: (ids: string[]) => void | Promise<void>;
  onCollapse: () => void;
  onRecheckConnection: () => void;
  onConversationsUpdate: (updater: (prev: ConversationType[]) => ConversationType[]) => void;
  onSelectedUpdate: (conv: ConversationType) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ChatSidebar({
  conversations,
  selectedConversation,
  loadingConversations,
  sidebarCollapsed,
  isDark,
  colors,
  connStatus,
  isCurrentConversationBlank = false,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onBulkDeleteConversations,
  onCollapse,
  onRecheckConnection,
  onConversationsUpdate,
  onSelectedUpdate,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [hoveredConvId, setHoveredConvId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} conversation${ids.length === 1 ? '' : 's'}? This cannot be undone.`)) return;
    try {
      if (onBulkDeleteConversations) {
        await onBulkDeleteConversations(ids);
      } else {
        for (const id of ids) onDeleteConversation(id);
      }
      toast.success(`Deleted ${ids.length} conversation${ids.length === 1 ? '' : 's'}`);
    } catch {
      toast.error('Failed to delete some conversations');
    } finally {
      exitSelectionMode();
    }
  };

  const handleRename = (conv: ConversationType, newTitle: string) => {
    const title = newTitle || conv.title || 'New Conversation';
    onConversationsUpdate((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, title } : c)),
    );
    if (selectedConversation?.id === conv.id) {
      onSelectedUpdate({ ...conv, title });
    }
    setRenamingId(null);
    apiClient.renameConversation(conv.id, title).then(
      () => toast.success('Chat renamed'),
      () => toast.error('Failed to save rename'),
    );
  };

  const filtered = searchQuery.trim()
    ? conversations.filter((c) =>
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : conversations;

  // Theme-aware color palette using CSS variables
  const modernColors = {
    // Base surfaces
    sidebarBg: 'var(--bg-card)',
    cardBg: isDark
      ? 'rgba(255, 255, 255, 0.03)'
      : 'rgba(0, 0, 0, 0.02)',
    cardHover: 'var(--accent-dim)',
    cardActive: 'var(--accent-dim)',
    // Borders
    border: 'var(--border)',
    borderHover: 'var(--border-hover)',
    borderActive: 'var(--accent)',
    // Text
    text: 'var(--text)',
    textSecondary: 'var(--text-muted)',
    textMuted: 'var(--text-muted)',
    // Accent
    accent: 'var(--accent)',
    accentLight: 'var(--accent-dim)',
    accentGlow: 'var(--accent-glow)',
    // Status
    success: '#22C55E',
    error: '#EF4444',
  };

  return (
    <div
      style={{
        width: sidebarCollapsed ? '0px' : '300px',
        background: modernColors.sidebarBg,
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRight: sidebarCollapsed ? 'none' : `1px solid ${modernColors.border}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Subtle gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '200px',
        background: isDark
          ? 'linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, transparent 100%)'
          : 'linear-gradient(180deg, rgba(99, 102, 241, 0.05) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div
        style={{
          padding: '20px 20px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: isDark
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1))',
            border: `1px solid ${modernColors.borderHover}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isDark
              ? '0 4px 12px rgba(99, 102, 241, 0.2)'
              : '0 4px 12px rgba(99, 102, 241, 0.15)',
          }}>
            <img src={logo} alt="Logo" style={{ width: '22px', height: '22px' }} />
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 600,
                color: modernColors.text,
                letterSpacing: '-0.01em',
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              Conversations
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '2px',
            }}>
              <div
                onClick={onRecheckConnection}
                title={
                  connStatus === 'connected'
                    ? 'Connected'
                    : connStatus === 'disconnected'
                      ? 'Disconnected — click to retry'
                      : 'Checking...'
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: connStatus === 'connected' 
                    ? modernColors.success 
                    : connStatus === 'disconnected'
                      ? modernColors.error
                      : modernColors.textMuted,
                  boxShadow: connStatus === 'connected'
                    ? `0 0 8px ${modernColors.success}`
                    : 'none',
                }} />
                <span style={{
                  fontSize: '11px',
                  color: modernColors.textMuted,
                  fontWeight: 500,
                }}>
                  {connStatus === 'connected' ? 'Online' : connStatus === 'disconnected' ? 'Offline' : 'Checking'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => {
              if (selectionMode) exitSelectionMode();
              else setSelectionMode(true);
            }}
            title={selectionMode ? 'Cancel selection' : 'Select multiple'}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: selectionMode ? modernColors.accentLight : modernColors.cardBg,
              border: `1px solid ${selectionMode ? modernColors.borderActive : modernColors.border}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: selectionMode ? modernColors.accent : modernColors.textSecondary,
              transition: 'all 0.2s ease',
            }}
          >
            <ListChecks size={16} />
          </button>
          <button
            onClick={onCollapse}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: modernColors.cardBg,
              border: `1px solid ${modernColors.border}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: modernColors.textSecondary,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = modernColors.cardHover;
              e.currentTarget.style.borderColor = modernColors.borderHover;
              e.currentTarget.style.color = modernColors.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = modernColors.cardBg;
              e.currentTarget.style.borderColor = modernColors.border;
              e.currentTarget.style.color = modernColors.textSecondary;
            }}
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/* Bulk selection bar */}
      {selectionMode && (
        <div style={{
          padding: '0 16px 12px',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <button
            onClick={() => {
              const allIds = filtered.map((c) => c.id);
              const allSelected = allIds.every((id) => selectedIds.has(id));
              setSelectedIds(allSelected ? new Set() : new Set(allIds));
            }}
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '8px',
              border: `1px solid ${modernColors.border}`,
              background: modernColors.cardBg,
              color: modernColors.text,
              cursor: 'pointer',
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            {filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id))
              ? 'Deselect all'
              : 'Select all'}
            <span style={{ marginLeft: 6, color: modernColors.textMuted, fontWeight: 500 }}>
              ({selectedIds.size})
            </span>
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={selectedIds.size === 0}
            title="Delete selected"
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '8px',
              border: `1px solid ${selectedIds.size === 0 ? modernColors.border : 'rgba(239, 68, 68, 0.5)'}`,
              background: selectedIds.size === 0 ? modernColors.cardBg : 'rgba(239, 68, 68, 0.12)',
              color: selectedIds.size === 0 ? modernColors.textMuted : modernColors.error,
              cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      )}

      {/* New Chat Button */}
      <div style={{ padding: '0 16px 12px', position: 'relative', zIndex: 1 }}>
        <button
          onClick={onNewConversation}
          disabled={isCurrentConversationBlank}
          title={isCurrentConversationBlank ? 'Current conversation is empty' : 'Start a new conversation'}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            border: 'none',
            cursor: isCurrentConversationBlank ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '13px',
            letterSpacing: '-0.01em',
            color: isCurrentConversationBlank ? 'rgba(255, 255, 255, 0.5)' : '#0A0A0B',
            background: isCurrentConversationBlank 
              ? 'var(--accent-dim)'
              : 'var(--accent)',
            boxShadow: isCurrentConversationBlank 
              ? 'none'
              : '0 4px 16px var(--accent-glow), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            fontFamily: "'Inter', system-ui, sans-serif",
            opacity: isCurrentConversationBlank ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isCurrentConversationBlank) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px var(--accent-glow), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isCurrentConversationBlank) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px var(--accent-glow), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
            }
          }}
        >
          <Sparkles size={16} />
          New Conversation
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '0 16px 16px', position: 'relative', zIndex: 1 }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}>
          <Search
            size={15}
            color={modernColors.textMuted}
            style={{
              position: 'absolute',
              left: '12px',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            style={{
              width: '100%',
              padding: '10px 36px 10px 38px',
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: '10px',
              border: `1px solid ${modernColors.border}`,
              background: modernColors.cardBg,
              color: modernColors.text,
              outline: 'none',
              transition: 'all 0.2s ease',
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = modernColors.borderHover;
              e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
              e.currentTarget.style.boxShadow = `0 0 0 3px ${modernColors.accentLight}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = modernColors.border;
              e.currentTarget.style.background = modernColors.cardBg;
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                width: '20px',
                height: '20px',
                borderRadius: '5px',
                background: modernColors.cardHover,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: modernColors.textMuted,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = modernColors.accent;
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = modernColors.cardHover;
                e.currentTarget.style.color = modernColors.textMuted;
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Conversation list */}
      <div 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '0 12px 16px',
          position: 'relative',
          zIndex: 1,
        }}
        className="modern-scrollbar"
      >
        {loadingConversations ? (
          <div style={{ padding: '12px 8px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i} 
                style={{
                  padding: '14px 12px',
                  marginBottom: '6px',
                  borderRadius: '10px',
                  background: modernColors.cardBg,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                }} />
                <div style={{ flex: 1 }}>
                  <Shimmer duration={1.5 + i * 0.2} className="text-xs">
                    Loading...
                  </Shimmer>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 && searchQuery.trim() ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: modernColors.textMuted,
            }}
          >
            <Search size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p style={{ 
              fontSize: '13px', 
              fontWeight: 500,
              margin: 0,
              fontFamily: "'Inter', system-ui, sans-serif",
            }}>
              No results for &quot;{searchQuery}&quot;
            </p>
          </div>
        ) : (
          filtered.map((conv, index) => {
            const isSelected = selectedConversation?.id === conv.id;
            const isHovered = hoveredConvId === conv.id;
            const isChecked = selectedIds.has(conv.id);

            return (
              <div
                key={conv.id}
                onClick={() => {
                  if (renamingId === conv.id) return;
                  if (selectionMode) {
                    toggleSelected(conv.id);
                    return;
                  }
                  onSelectConversation(conv);
                }}
                onMouseEnter={() => setHoveredConvId(conv.id)}
                onMouseLeave={() => setHoveredConvId(null)}
                style={{
                  marginBottom: '4px',
                  padding: '12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: (selectionMode && isChecked)
                    ? modernColors.cardActive
                    : isSelected
                      ? modernColors.cardActive
                      : isHovered
                        ? modernColors.cardHover
                        : 'transparent',
                  border: (selectionMode && isChecked)
                    ? `1px solid ${modernColors.borderActive}`
                    : isSelected
                      ? `1px solid ${modernColors.borderActive}`
                      : `1px solid transparent`,
                  transform: isHovered && !isSelected ? 'translateX(4px)' : 'none',
                  animation: `fadeInSlide 0.3s ease-out ${index * 0.03}s both`,
                }}
              >
                {/* Checkbox (selection mode) */}
                {selectionMode && (
                  <div
                    onClick={(e) => { e.stopPropagation(); toggleSelected(conv.id); }}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '6px',
                      border: `1.5px solid ${isChecked ? modernColors.accent : modernColors.borderHover}`,
                      background: isChecked ? modernColors.accent : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isChecked && <CheckSquare size={14} style={{ color: '#0A0A0B' }} />}
                  </div>
                )}

                {/* Icon */}
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: isSelected
                    ? 'var(--accent)'
                    : isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected
                    ? '0 4px 12px var(--accent-glow)'
                    : 'none',
                }}>
                  <MessageSquare
                    size={16}
                    style={{
                      color: isSelected 
                        ? '#ffffff'
                        : modernColors.textSecondary,
                    }}
                  />
                </div>

                {/* Title */}
                {renamingId === conv.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(conv, renameValue);
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    onBlur={() => handleRename(conv, renameValue)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flex: 1,
                      fontSize: '13px',
                      fontWeight: 500,
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: `2px solid ${modernColors.accent}`,
                      background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.9)',
                      color: modernColors.text,
                      outline: 'none',
                      minWidth: 0,
                      fontFamily: "'Inter', system-ui, sans-serif",
                    }}
                  />
                ) : (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0,
                      fontSize: '13px',
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? modernColors.text : modernColors.textSecondary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontFamily: "'Inter', system-ui, sans-serif",
                      letterSpacing: '-0.01em',
                    }}>
                      {stripSystemInstructions(conv.title || 'New Conversation')}
                    </p>
                    {conv.updated_at && (
                      <p style={{
                        margin: '2px 0 0',
                        fontSize: '11px',
                        color: modernColors.textMuted,
                        fontWeight: 400,
                      }}>
                        {new Date(conv.updated_at).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                {renamingId !== conv.id && !selectionMode && (isHovered || isSelected) && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '4px',
                    opacity: isHovered ? 1 : 0.7,
                    transition: 'opacity 0.15s ease',
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingId(conv.id);
                        setRenameValue(conv.title || '');
                      }}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: modernColors.textMuted,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = modernColors.cardHover;
                        e.currentTarget.style.color = modernColors.text;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = modernColors.textMuted;
                      }}
                      title="Rename"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: modernColors.textMuted,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.color = modernColors.error;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = modernColors.textMuted;
                      }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer gradient */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '40px',
        background: isDark
          ? 'linear-gradient(0deg, rgba(12, 12, 14, 0.95) 0%, transparent 100%)'
          : 'linear-gradient(0deg, rgba(255, 255, 255, 0.85) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      <style>{`
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .modern-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .modern-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .modern-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
          border-radius: 3px;
        }
        .modern-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
        }
      `}</style>
    </div>
  );
}

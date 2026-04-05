'use client';

/**
 * ChatSidebar — Conversation list sidebar with search, rename, delete.
 * Extracted from ChatPage.tsx for separation of concerns.
 */

import React, { useState } from 'react';
import {
  Plus, MessageSquare, Trash2, ChevronLeft,
  Search, Pencil, X, Wifi, WifiOff,
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
  onSelectConversation: (conv: ConversationType) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onCollapse: () => void;
  onRecheckConnection: () => void;
  onConversationsUpdate: (updater: (prev: ConversationType[]) => ConversationType[]) => void;
  onSelectedUpdate: (conv: ConversationType) => void;
  isCurrentConversationEmpty?: boolean;
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
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onCollapse,
  onRecheckConnection,
  onConversationsUpdate,
  onSelectedUpdate,
  isCurrentConversationEmpty = false,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

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

  return (
    <div
      style={{
        width: sidebarCollapsed ? '0px' : '280px',
        backgroundColor: colors.sidebar,
        borderRight: sidebarCollapsed ? 'none' : `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-6 flex items-center justify-between flex-shrink-0"
        style={{
          borderBottom: `2px solid ${colors.primaryYellow}`,
          backgroundColor: isDark
            ? 'rgba(254, 192, 15, 0.06)'
            : 'rgba(254, 192, 15, 0.08)',
          transition: 'all 0.2s ease',
        }}
      >
        <div className="flex items-center gap-3">
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            background: isDark ? 'rgba(254, 192, 15, 0.12)' : 'rgba(254, 192, 15, 0.1)',
            border: `1px solid ${colors.primaryYellow}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img src={logo} alt="Logo" className="w-5 h-5" />
          </div>
          <h2
            className="m-0 text-sm font-bold uppercase tracking-wider"
            style={{
              fontFamily: "var(--font-rajdhani), 'Rajdhani', sans-serif",
              color: colors.text,
              letterSpacing: '0.08em',
            }}
          >
            Chats
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div
            onClick={onRecheckConnection}
            title={
              connStatus === 'connected'
                ? 'API Connected'
                : connStatus === 'disconnected'
                  ? 'API Disconnected — click to retry'
                  : 'Checking...'
            }
            className="cursor-pointer flex items-center p-1 rounded transition-colors"
            style={{
              backgroundColor: connStatus === 'connected' ? 'rgba(34, 197, 94, 0.1)' : 
                              connStatus === 'disconnected' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
            }}
          >
            {connStatus === 'connected' ? (
              <Wifi size={14} color="#22c55e" />
            ) : connStatus === 'disconnected' ? (
              <WifiOff size={14} color="#ef4444" />
            ) : (
              <Wifi size={14} color={colors.textMuted} style={{ opacity: 0.5 }} />
            )}
          </div>
          <button
            onClick={onCollapse}
            className="bg-transparent border-none cursor-pointer p-1 rounded transition-colors"
            style={{
              color: colors.textMuted,
              hover: `background ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ChevronLeft size={16} color={colors.textMuted} />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 flex flex-col gap-3">
        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
          <button
            onClick={isCurrentConversationEmpty ? undefined : onNewConversation}
            disabled={isCurrentConversationEmpty}
            title={isCurrentConversationEmpty ? 'Start a conversation to enable new chat' : 'Start a new conversation'}
            className="w-full py-3 border-none rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition-all"
            style={{
              backgroundColor: isCurrentConversationEmpty ? colors.textMuted + '33' : colors.primaryYellow,
              color: isCurrentConversationEmpty ? colors.textMuted : colors.darkGray,
              fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
              boxShadow: isCurrentConversationEmpty ? 'none' : '0 2px 8px rgba(254, 192, 15, 0.2)',
              fontWeight: 600,
              letterSpacing: '0.02em',
              cursor: isCurrentConversationEmpty ? 'not-allowed' : 'pointer',
              opacity: isCurrentConversationEmpty ? 0.5 : 1,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseOver={(e) => {
              if (!isCurrentConversationEmpty) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(254, 192, 15, 0.3)';
              }
            }}
            onMouseOut={(e) => {
              if (!isCurrentConversationEmpty) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(254, 192, 15, 0.2)';
              }
            }}
          >
            <Plus size={18} /> New Chat
          </button>
          
          {/* Tooltip for disabled state */}
          {isCurrentConversationEmpty && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: isDark ? '#0A0A0B' : '#212121',
                color: colors.primaryYellow,
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 1000,
                border: `1px solid rgba(254, 192, 15, 0.3)`,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                animation: 'empty-chat-tooltip-fade 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                letterSpacing: '0.02em',
              }}
            >
              Start a conversation first
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            color={colors.textMuted}
            className="absolute left-2.5 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full py-2 pr-2.5 pl-8 text-xs outline-none transition-colors"
            style={{
              backgroundColor: colors.inputBg,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              color: colors.text,
              fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
              boxSizing: 'border-box',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = colors.primaryYellow)}
            onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0.5"
            >
              <X size={12} color={colors.textMuted} />
            </button>
          )}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3" style={{ minHeight: 0 }}>
        {loadingConversations ? (
          <div className="space-y-3 px-2 py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2">
                <div className="w-4 h-4 rounded bg-muted animate-pulse" />
                <Shimmer duration={2 + i * 0.3} className="text-xs">
                  Loading conversations...
                </Shimmer>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 && searchQuery.trim() ? (
          <div
            className="text-center p-5 text-xs"
            style={{ color: colors.textMuted }}
          >
            No chats matching &quot;{searchQuery}&quot;
          </div>
        ) : (
          filtered.map((conv) => (
            <div
              key={conv.id}
              onClick={() => {
                if (renamingId !== conv.id) onSelectConversation(conv);
              }}
              className="mb-2 rounded-lg cursor-pointer text-[13px] flex items-center gap-2 transition-all"
              style={{
                padding: '10px 12px',
                backgroundColor:
                  selectedConversation?.id === conv.id
                    ? `rgba(254, 192, 15, 0.12)`
                    : 'transparent',
                border:
                  selectedConversation?.id === conv.id
                    ? `1.5px solid ${colors.primaryYellow}`
                    : `1px solid transparent`,
                color: colors.text,
                fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseOver={(e) => {
                if (selectedConversation?.id !== conv.id) {
                  e.currentTarget.style.backgroundColor = isDark
                    ? 'rgba(254, 192, 15, 0.06)'
                    : 'rgba(254, 192, 15, 0.06)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }
              }}
              onMouseOut={(e) => {
                if (selectedConversation?.id !== conv.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              }}
            >
              <MessageSquare
                size={14}
                className="flex-shrink-0"
                style={{
                  color:
                    selectedConversation?.id === conv.id
                      ? colors.primaryYellow
                      : colors.textMuted,
                }}
              />

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
                  className="flex-1 text-[13px] px-2 py-1 outline-none min-w-0"
                  style={{
                    background: colors.inputBg,
                    border: `2px solid ${colors.primaryYellow}`,
                    borderRadius: '4px',
                    color: colors.text,
                    fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
                  }}
                />
              ) : (
                <span
                  className="overflow-hidden text-ellipsis whitespace-nowrap flex-1"
                  style={{
                    fontWeight: selectedConversation?.id === conv.id ? 600 : 400,
                  }}
                >
                  {stripSystemInstructions(conv.title || 'New Conversation')}
                </span>
              )}

              {renamingId !== conv.id && (
                <div className="flex gap-0.5 opacity-50">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingId(conv.id);
                      setRenameValue(conv.title || '');
                    }}
                    className="bg-transparent border-none cursor-pointer p-1"
                    title="Rename"
                  >
                    <Pencil size={12} color={colors.textMuted} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                    className="bg-transparent border-none cursor-pointer p-1"
                    title="Delete"
                  >
                    <Trash2 size={12} color={colors.textMuted} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

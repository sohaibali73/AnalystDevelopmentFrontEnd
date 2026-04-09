'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, ArrowUpFromLine, Trash2, ChevronLeft, ChevronRight, 
  Loader2, RefreshCw, Search, Pencil, X, Copy, ThumbsUp, 
  ThumbsDown, Download, Code2, Settings2, Sparkles, Check, 
  Database, BookOpen, PanelLeft, FileText, Zap, TrendingUp,
  BarChart3, Activity, MessageSquare, Clock, ChevronDown, History
} from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { Conversation as ConversationType } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import Editor from '@monaco-editor/react';
import FeedbackModal from '@/components/FeedbackModal';

// AI Elements
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { ConversationEmptyState } from '@/components/ai-elements/conversation';
import { Message as AIMessage, MessageContent, MessageActions, MessageAction } from '@/components/ai-elements/message';
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputHeader, PromptInputTools, PromptInputButton, PromptInputSubmit, usePromptInputAttachments } from '@/components/ai-elements/prompt-input';
import {
  AFLGenerateCard,
  AFLValidateCard,
  AFLDebugCard,
  AFLExplainCard,
  AFLSanityCheckCard,
  KnowledgeBaseResults,
  WebSearchResults,
  ToolLoading,
} from '@/components/generative-ui';
import { KnowledgeBasePanel, getAuthToken, getFileExtension, getFileChipColor } from '@/components/chat';

const logo = '/potomac-icon.png';

// ─── KB Document type ─────────────────────────────────────────────────────────
interface KBDocument {
  id: string;
  title?: string;
  filename: string;
  category: string;
  file_size?: number;
}

// ─── Extract AFL Code ─────────────────────────────────────────────────────────
function extractAFLCode(text: string): string | null {
  const aflMatch = text.match(/```(?:afl|amibroker)\s*\n([\s\S]*?)```/i);
  if (aflMatch) return aflMatch[1].trim();
  const codeMatch = text.match(/```\w*\s*\n([\s\S]*?)```/);
  if (codeMatch) return codeMatch[1].trim();
  return null;
}

// ─── Attachments Display ──────────────────────────────────────────────────────
function AttachmentsDisplay({ 
  attachedKbDocs = [], 
  onRemoveKbDoc 
}: { 
  attachedKbDocs?: KBDocument[];
  onRemoveKbDoc?: (id: string) => void;
}) {
  const attachments = usePromptInputAttachments();
  const hasFiles = attachments.files.length > 0;
  const hasKbDocs = attachedKbDocs.length > 0;

  if (!hasFiles && !hasKbDocs) return null;

  return (
    <PromptInputHeader>
      <div className="flex flex-wrap gap-2 py-2">
        {attachedKbDocs.map((doc) => {
          const ext = getFileExtension(doc.filename);
          const docColor = getFileChipColor(ext);
          return (
            <div
              key={doc.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium max-w-[180px]"
              style={{
                border: `1px solid ${docColor}40`,
                background: `${docColor}15`,
                color: docColor,
              }}
            >
              <Database size={12} className="opacity-80 shrink-0" />
              <span className="truncate">{doc.title || doc.filename}</span>
              {onRemoveKbDoc && (
                <button
                  onClick={() => onRemoveKbDoc(doc.id)}
                  className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}
        
        {attachments.files.map((file) => (
          <div
            key={file.id}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium max-w-[180px] border border-white/10 bg-white/5 text-white/90"
          >
            <FileText size={12} className="opacity-70 shrink-0" />
            <span className="truncate">{file.filename || 'file'}</span>
            <button
              onClick={() => attachments.remove(file.id)}
              className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </PromptInputHeader>
  );
}

// ─── Attachment Button ────────────────────────────────────────────────────────
function AttachmentButton({ disabled }: { disabled?: boolean }) {
  const attachments = usePromptInputAttachments();
  return (
    <PromptInputButton 
      onClick={() => !disabled && attachments.openFileDialog()} 
      disabled={disabled} 
      tooltip="Attach files"
    >
      <ArrowUpFromLine className="size-4" />
    </PromptInputButton>
  );
}

// ─── Settings Modal ───────────────────────────────────────────────────────────
function SettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  onSettingsChange,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  settings: any;
  onSettingsChange: (settings: any) => void;
}) {
  if (!isOpen) return null;

  const settingsFields = [
    { label: 'Initial Equity', key: 'initial_equity', type: 'number', description: 'Starting capital' },
    { label: 'Max Positions', key: 'max_positions', type: 'number', description: 'Max simultaneous' },
    { label: 'Position Size', key: 'position_size', type: 'text', description: '% of equity' },
    { label: 'Commission', key: 'commission', type: 'number', description: 'Rate (0.001 = 0.1%)' },
    { label: 'Margin %', key: 'margin_requirement', type: 'number', description: 'Requirement %' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md mx-5 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 20, 24, 0.95) 0%, rgba(12, 12, 16, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(254, 192, 15, 0.1)',
        }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FEC00F 0%, #F59E0B 100%)' }}
            >
              <Settings2 size={20} className="text-black" strokeWidth={2.5} />
            </div>
            <div>
                  <h2 className="text-base font-bold text-white tracking-wide uppercase">
                    Backtest Settings
                  </h2>
              <p className="text-xs text-white/50">Configure parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X size={18} className="text-white/60" />
          </button>
        </div>

        {/* Settings Grid */}
        <div className="p-6 space-y-4">
          {settingsFields.map(({ label, key, type, description }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-white/90">{label}</label>
                <span className="text-[10px] text-white/40">{description}</span>
              </div>
              <input
                type={type}
                value={settings[key]}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  [key]: type === 'number' ? Number(e.target.value) : e.target.value,
                })}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm outline-none transition-all focus:border-[#FEC00F] focus:bg-[#FEC00F]/5"
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-white/10 text-white/70 text-sm font-semibold hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-black text-sm font-bold transition-all hover:shadow-lg"
            style={{ 
              background: 'linear-gradient(135deg, #FEC00F 0%, #F59E0B 100%)',
              boxShadow: '0 4px 12px rgba(254, 192, 15, 0.3)'
            }}
          >
            Save Settings
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Conversation Item ────────────────────────────────────────────────────────
function ConversationItem({ 
  conv, 
  isSelected, 
  onSelect, 
  onRename, 
  onDelete,
  isRenaming,
  renameValue,
  setRenameValue,
  onRenameSubmit,
  onRenameCancel
}: {
  conv: ConversationType;
  isSelected: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
  isRenaming: boolean;
  renameValue: string;
  setRenameValue: (v: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`
        group relative px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'bg-gradient-to-r from-[#FEC00F]/15 to-[#FEC00F]/5 border border-[#FEC00F]/20' 
          : 'hover:bg-white/[0.04] border border-transparent'}
      `}
      onClick={onSelect}
    >
      {isRenaming ? (
        <input
          autoFocus
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onRenameSubmit();
            if (e.key === 'Escape') onRenameCancel();
          }}
          onBlur={onRenameCancel}
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-black/30 border border-[#FEC00F]/40 rounded-lg px-2 py-1 text-sm text-white outline-none"
        />
      ) : (
        <>
          <div className="flex items-center gap-2.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#FEC00F]' : 'bg-white/20'}`} />
            <span className={`text-sm truncate ${isSelected ? 'text-white font-medium' : 'text-white/70'}`}>
              {conv.title || 'Untitled Strategy'}
            </span>
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onRename(); }}
              className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <Pencil size={12} className="text-white/60" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-6 h-6 rounded-md bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-colors"
            >
              <Trash2 size={12} className="text-white/60 hover:text-red-400" />
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AFLGeneratorPage() {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const isDark = resolvedTheme === 'dark';

  // State
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationType | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [pageError, setPageError] = useState('');
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Code panel state
  const [generatedCode, setGeneratedCode] = useState('');
  const [editorCode, setEditorCode] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showStrategyHistory, setShowStrategyHistory] = useState(false);
  const [backtestSettings, setBacktestSettings] = useState({
    initial_equity: 100000,
    position_size: '100',
    position_size_type: 'spsPercentOfEquity',
    max_positions: 10,
    commission: 0.001,
    trade_delays: [0, 0, 0, 0] as [number, number, number, number],
    margin_requirement: 100,
  });
  const [copied, setCopied] = useState(false);

  // Knowledge Base
  const [showKBPanel, setShowKBPanel] = useState(false);
  const [selectedKBDocIds, setSelectedKBDocIds] = useState<Set<string>>(new Set());
  const [attachedKBDocs, setAttachedKBDocs] = useState<KBDocument[]>([]);

  // Feedback
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // Code loading
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const lastExtractedCodeRef = useRef<string | null>(null);
  const lastFetchedFileIdRef = useRef<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string | null>(null);
  const skipNextLoadRef = useRef(false);
  const editorRef = useRef<any>(null);

  // Auth token
  const getToken = () => {
    try { return localStorage.getItem('auth_token') || ''; } catch { return ''; }
  };

  // API base URL
  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://developer-potomaac.up.railway.app').replace(/\/+$/, '');

  // AI SDK useChat
  const { messages: streamMessages, sendMessage, status, stop, error: chatError, setMessages, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      headers: () => {
        const token = getToken();
        return { 'Authorization': token ? `Bearer ${token}` : '' };
      },
      body: () => ({
        conversationId: conversationIdRef.current,
        skill_slug: 'amibroker_afl_developer',
      }),
    }),
    onFinish: () => {
      loadConversations();
    },
    onError: (error) => {
      const msg = error.message || 'An error occurred';
      setPageError(msg);
      toast.error('Chat Error', {
        description: msg,
        action: { label: 'Retry', onClick: () => regenerate() },
        duration: 8000,
      });
    },
    experimental_throttle: 50,
  });

  const isStreaming = status === 'streaming' || status === 'submitted';

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (skipNextLoadRef.current) {
      skipNextLoadRef.current = false;
      return;
    }
    try {
      const list = await apiClient.getConversations('afl');
      setConversations(list);
    } catch (e) {
      console.error('Failed to load conversations', e);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load conversation messages
  const loadConversationMessages = useCallback(async (conv: ConversationType) => {
    try {
      const messages = await apiClient.getMessages(conv.id);
      const formatted = messages.map((m: any) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        parts: m.parts || [{ type: 'text', text: m.content }],
        createdAt: new Date(m.created_at),
      }));
      setMessages(formatted);
    } catch (e) {
      console.error('Failed to load messages', e);
    }
  }, [setMessages]);

  // Select conversation
  const handleSelectConversation = useCallback((conv: ConversationType) => {
    setSelectedConversation(conv);
    conversationIdRef.current = conv.id;
    loadConversationMessages(conv);
  }, [loadConversationMessages]);

  // New conversation
  const handleNewConversation = useCallback(() => {
    setSelectedConversation(null);
    conversationIdRef.current = null;
    setMessages([]);
    setEditorCode('');
    setGeneratedCode('');
  }, [setMessages]);

  // Delete conversation
  const handleDeleteConversation = useCallback(async (id: string) => {
    try {
      await apiClient.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (selectedConversation?.id === id) {
        handleNewConversation();
      }
      toast.success('Conversation deleted');
    } catch {
      toast.error('Failed to delete conversation');
    }
  }, [selectedConversation, handleNewConversation]);

  // Rename conversation
  const handleRenameConversation = useCallback(async (id: string, newTitle: string) => {
    try {
      await apiClient.updateConversation(id, { title: newTitle });
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
      toast.success('Conversation renamed');
    } catch {
      toast.error('Failed to rename conversation');
    }
    setRenamingId(null);
  }, []);

  // Remove KB doc
  const handleRemoveKBDoc = useCallback((id: string) => {
    setAttachedKBDocs(prev => prev.filter(d => d.id !== id));
  }, []);

  // Copy code
  const handleCopyCode = useCallback(() => {
    if (editorCode) {
      navigator.clipboard.writeText(editorCode);
      setCopied(true);
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [editorCode]);

  // Download code
  const handleDownloadCode = useCallback(() => {
    if (editorCode) {
      const blob = new Blob([editorCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `strategy_${Date.now()}.afl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('AFL file downloaded');
    }
  }, [editorCode]);

  // Auto-extract AFL code from messages
  useEffect(() => {
    const lastAssistant = [...streamMessages].reverse().find(m => m.role === 'assistant');
    if (lastAssistant) {
      const textPart = lastAssistant.parts?.find((p: any) => p.type === 'text');
      const text = textPart?.text || (typeof lastAssistant.content === 'string' ? lastAssistant.content : '');
      const code = extractAFLCode(text);
      if (code && code !== lastExtractedCodeRef.current) {
        lastExtractedCodeRef.current = code;
        setEditorCode(code);
        setGeneratedCode(code);
      }
    }
  }, [streamMessages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [streamMessages]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(c => c.title?.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  // All messages
  const allMessages = useMemo(() => streamMessages, [streamMessages]);

  // Render message
  const renderMessage = useCallback((msg: any, idx: number) => {
    const isUser = msg.role === 'user';
    const textPart = msg.parts?.find((p: any) => p.type === 'text');
    const toolParts = msg.parts?.filter((p: any) => p.type === 'tool-invocation') || [];
    const content = textPart?.text || (typeof msg.content === 'string' ? msg.content : '');

    return (
      <motion.div
        key={msg.id || idx}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6"
      >
        <AIMessage from={isUser ? 'user' : 'assistant'}>
          {/* Header */}
          <div className="flex items-center gap-2 text-xs mb-3">
            <div 
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{
                background: isUser ? 'rgba(0, 222, 209, 0.15)' : 'rgba(254, 192, 15, 0.15)',
              }}
            >
              {isUser ? (
                <span className="text-[10px] font-bold text-[#00DED1]">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              ) : (
                <img src={logo} alt="Yang" className="w-4 h-4" />
              )}
            </div>
            <span className="font-semibold text-white">
              {isUser ? (user?.username || 'You') : 'Yang'}
            </span>
            <span className="text-white/30 text-[10px]">
              {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Tool invocations */}
          {toolParts.map((tool: any, tIdx: number) => {
            const toolName = tool.toolInvocation?.toolName || tool.toolName || '';
            const toolState = tool.toolInvocation?.state || tool.state || 'input-available';
            const toolInput = tool.toolInvocation?.args || tool.args || {};
            const toolOutput = tool.toolInvocation?.result || tool.result;

            if (toolName.includes('afl_generate') || toolName.includes('generate_afl')) {
              return <AFLGenerateCard key={tIdx} toolCallId={tool.toolCallId} toolName={toolName} input={toolInput} output={toolOutput} state={toolState} />;
            }
            if (toolName.includes('afl_validate') || toolName.includes('validate_afl')) {
              return <AFLValidateCard key={tIdx} toolCallId={tool.toolCallId} toolName={toolName} input={toolInput} output={toolOutput} state={toolState} />;
            }
            if (toolName.includes('afl_debug') || toolName.includes('debug_afl')) {
              return <AFLDebugCard key={tIdx} toolCallId={tool.toolCallId} toolName={toolName} input={toolInput} output={toolOutput} state={toolState} />;
            }
            if (toolName.includes('afl_explain') || toolName.includes('explain_afl')) {
              return <AFLExplainCard key={tIdx} toolCallId={tool.toolCallId} toolName={toolName} input={toolInput} output={toolOutput} state={toolState} />;
            }
            if (toolName.includes('knowledge_base') || toolName.includes('kb_search')) {
              return <KnowledgeBaseResults key={tIdx} toolCallId={tool.toolCallId} toolName={toolName} input={toolInput} output={toolOutput} state={toolState} />;
            }
            if (toolName.includes('web_search')) {
              return <WebSearchResults key={tIdx} toolCallId={tool.toolCallId} toolName={toolName} input={toolInput} output={toolOutput} state={toolState} />;
            }
            if (toolState === 'input-streaming' || toolState === 'input-available') {
              return <ToolLoading key={tIdx} toolName={toolName} />;
            }
            return null;
          })}

          {/* Text content */}
          {content && (
            <MessageContent className="prose prose-invert prose-sm max-w-none">
              <div 
                className="text-sm leading-relaxed text-white/90"
                dangerouslySetInnerHTML={{ 
                  __html: content
                    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-black/30 rounded-lg p-4 overflow-x-auto text-xs my-3"><code>$2</code></pre>')
                    .replace(/`([^`]+)`/g, '<code class="bg-[#FEC00F]/10 text-[#FEC00F] px-1.5 py-0.5 rounded text-xs">$1</code>')
                    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                    .replace(/\n/g, '<br />')
                }}
              />
            </MessageContent>
          )}

          {/* Actions */}
          {!isUser && (
            <MessageActions>
              <MessageAction tooltip="Copy" onClick={() => navigator.clipboard.writeText(content)}>
                <Copy className="size-3.5" />
              </MessageAction>
              <MessageAction tooltip="Like" onClick={() => {}}>
                <ThumbsUp className="size-3.5" />
              </MessageAction>
              <MessageAction tooltip="Dislike" onClick={() => setShowFeedbackModal(true)}>
                <ThumbsDown className="size-3.5" />
              </MessageAction>
            </MessageActions>
          )}
        </AIMessage>
      </motion.div>
    );
  }, [user, setShowFeedbackModal]);

  return (
    <>
      <style jsx global>{`
        @keyframes afl-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .afl-glass {
          background: linear-gradient(135deg, rgba(16, 16, 20, 0.9) 0%, rgba(8, 8, 12, 0.95) 100%);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
        }
        .afl-glass-subtle {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .afl-glow {
          box-shadow: 0 0 60px -12px rgba(254, 192, 15, 0.15);
        }
        .afl-border {
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .afl-scrollbar::-webkit-scrollbar { width: 4px; }
        .afl-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .afl-scrollbar::-webkit-scrollbar-thumb { 
          background: rgba(254, 192, 15, 0.2); 
          border-radius: 2px; 
        }
        .afl-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: rgba(254, 192, 15, 0.4); 
        }
      `}</style>

      <div 
        className="h-screen flex overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse 100% 100% at 0% 0%, rgba(254, 192, 15, 0.05) 0%, transparent 50%),
            radial-gradient(ellipse 80% 80% at 100% 100%, rgba(0, 222, 209, 0.03) 0%, transparent 40%),
            linear-gradient(180deg, #0a0a0c 0%, #08080a 100%)
          `,
        }}
      >
        {/* ─── Sidebar ─── */}
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="h-full flex flex-col afl-glass afl-border border-r border-l-0 border-t-0 border-b-0"
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-white/[0.06]">
                <button
                  onClick={handleNewConversation}
                  className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-black transition-all hover:shadow-lg active:scale-[0.98]"
                  style={{ 
                    background: 'linear-gradient(135deg, #FEC00F 0%, #F59E0B 100%)',
                    boxShadow: '0 4px 12px rgba(254, 192, 15, 0.25)'
                  }}
                >
                  <Plus size={16} strokeWidth={2.5} />
                  New Strategy
                </button>

                {/* Search */}
                <div className="relative mt-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search strategies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-[#FEC00F]/30 focus:bg-white/[0.06]"
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto afl-scrollbar p-3 space-y-1">
                {loadingConversations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-[#FEC00F]" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare size={24} className="mx-auto text-white/20 mb-2" />
                    <p className="text-xs text-white/40">No strategies yet</p>
                  </div>
                ) : (
                  filteredConversations.map(conv => (
                    <ConversationItem
                      key={conv.id}
                      conv={conv}
                      isSelected={selectedConversation?.id === conv.id}
                      onSelect={() => handleSelectConversation(conv)}
                      onRename={() => { setRenamingId(conv.id); setRenameValue(conv.title || ''); }}
                      onDelete={() => handleDeleteConversation(conv.id)}
                      isRenaming={renamingId === conv.id}
                      renameValue={renameValue}
                      setRenameValue={setRenameValue}
                      onRenameSubmit={() => handleRenameConversation(conv.id, renameValue)}
                      onRenameCancel={() => setRenamingId(null)}
                    />
                  ))
                )}
              </div>

              {/* Sidebar Footer */}
              <div className="p-4 border-t border-white/[0.06]">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FEC00F]/20 to-[#00DED1]/20 flex items-center justify-center">
                    <Zap size={14} className="text-[#FEC00F]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{user?.username || 'User'}</p>
                    <p className="text-[10px] text-white/40">AFL Developer Mode</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ─── Main Content ─── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 px-4 flex items-center justify-between border-b border-white/[0.06] bg-black/20">
            <div className="flex items-center gap-3">
              {/* Sidebar Toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
              >
                {sidebarOpen ? <ChevronLeft size={18} className="text-white/60" /> : <PanelLeft size={18} className="text-white/60" />}
              </button>

              {/* Logo & Title */}
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center afl-glow"
                  style={{ background: 'linear-gradient(135deg, #FEC00F 0%, #F59E0B 100%)' }}
                >
                  <Activity size={20} className="text-black" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                    AFL Generator
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider bg-[#00DED1]/15 text-[#00DED1] border border-[#00DED1]/20">
                      SKILL
                    </span>
                  </h1>
                  <p className="text-[11px] text-white/40">AmiBroker Strategy Builder</p>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStrategyHistory(!showStrategyHistory)}
                className={`px-3.5 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold transition-all ${
                  showStrategyHistory 
                    ? 'bg-[#00DED1]/15 border border-[#00DED1]/30 text-[#00DED1]' 
                    : 'bg-white/[0.04] border border-white/[0.06] text-white/60 hover:text-white/80 hover:bg-white/[0.06]'
                }`}
              >
                <History size={14} />
                <span className="hidden sm:inline">Strategy History</span>
              </button>

              <button
                onClick={() => setShowKBPanel(!showKBPanel)}
                className={`px-3.5 py-2 rounded-lg flex items-center gap-2 text-xs font-semibold transition-all ${
                  showKBPanel 
                    ? 'bg-[#FEC00F]/15 border border-[#FEC00F]/30 text-[#FEC00F]' 
                    : 'bg-white/[0.04] border border-white/[0.06] text-white/60 hover:text-white/80 hover:bg-white/[0.06]'
                }`}
              >
                <Database size={14} />
                <span className="hidden sm:inline">Knowledge Base</span>
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
              >
                <Settings2 size={16} className="text-white/60" />
              </button>
            </div>
          </header>

          {/* Main Split View */}
          <div className="flex-1 flex overflow-hidden">
            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto afl-scrollbar">
                <div className="max-w-3xl mx-auto px-6 py-8">
                  {allMessages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="flex flex-col items-center justify-center min-h-[60vh]"
                    >
                      {/* Hero Icon */}
                      <div 
                        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 afl-glow"
                        style={{ 
                          background: 'linear-gradient(135deg, rgba(254, 192, 15, 0.2) 0%, rgba(254, 192, 15, 0.05) 100%)',
                          border: '1px solid rgba(254, 192, 15, 0.2)'
                        }}
                      >
                        <Sparkles size={36} className="text-[#FEC00F]" strokeWidth={1.5} />
                      </div>

                      <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">AFL Code Generator</h2>
                      <p className="text-sm text-white/50 mb-8 text-center max-w-md">
                        Generate, debug, and optimize AmiBroker Formula Language strategies with AI
                      </p>

                      {/* Suggestions */}
                      <div className="w-full max-w-lg">
                        <Suggestions className="flex flex-col gap-2">
                          {[
                            { icon: TrendingUp, text: "Generate a moving average crossover strategy" },
                            { icon: BarChart3, text: "Create an RSI-based mean reversion system" },
                            { icon: Activity, text: "Build a Bollinger Band breakout with sizing" },
                            { icon: Code2, text: "Debug my AFL code for syntax errors" },
                          ].map((suggestion, index) => (
                            <motion.div
                              key={suggestion.text}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 + index * 0.1 }}
                            >
                              <button
                                onClick={() => setInput(suggestion.text)}
                                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-[#FEC00F]/20 transition-all text-left flex items-center gap-3 group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-[#FEC00F]/10 flex items-center justify-center group-hover:bg-[#FEC00F]/15 transition-colors">
                                  <suggestion.icon size={14} className="text-[#FEC00F]" />
                                </div>
                                <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                                  {suggestion.text}
                                </span>
                              </button>
                            </motion.div>
                          ))}
                        </Suggestions>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
                        {allMessages.map((msg, idx) => renderMessage(msg, idx))}
                      </motion.div>

                      {status === 'submitted' && allMessages.length > 0 && allMessages[allMessages.length - 1]?.role === 'user' && (
                        <AIMessage from="assistant">
                          <div className="flex items-center gap-2 text-xs mb-3">
                            <div className="w-6 h-6 rounded-lg bg-[#FEC00F]/15 flex items-center justify-center">
                              <img src={logo} alt="Yang" className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-white">Yang</span>
                          </div>
                          <MessageContent>
                            <Shimmer duration={1.5}>Generating AFL code...</Shimmer>
                          </MessageContent>
                        </AIMessage>
                      )}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Error Banner */}
              {(pageError || chatError) && (
                <div className="px-6 py-3 bg-red-500/10 border-t border-red-500/20 flex items-center justify-between">
                  <span className="text-sm text-red-400">{pageError || chatError?.message}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => regenerate()} 
                      className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-1.5 hover:bg-red-500/10 transition-colors"
                    >
                      <RefreshCw size={12} /> Retry
                    </button>
                    <button onClick={() => setPageError('')} className="text-red-400 text-xl font-bold px-2">
                      &times;
                    </button>
                  </div>
                </div>
              )}

              {/* Prompt Input */}
              <div className="border-t border-white/[0.06]" style={{ background: 'linear-gradient(to top, rgba(254, 192, 15, 0.02) 0%, transparent 100%)' }}>
                <div className="max-w-3xl mx-auto px-6 py-5">
                  <TooltipProvider>
                    <PromptInput
                      accept=".pdf,.csv,.json,.txt,.afl,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      multiple
                      globalDrop={false}
                      maxFiles={10}
                      maxFileSize={52428800}
                      onError={(err) => {
                        if (err.code === 'max_file_size') toast.error('File too large (max 50MB)');
                        else if (err.code === 'max_files') toast.error('Too many files (max 10)');
                        else if (err.code === 'accept') toast.error('File type not supported');
                      }}
                      onSubmit={async ({ text, files }: { text: string; files: any[] }) => {
                        if ((!text.trim() && files.length === 0 && attachedKBDocs.length === 0) || isStreaming) return;
                        setInput('');
                        setPageError('');

                        let convId = selectedConversation?.id || conversationIdRef.current;
                        if (!convId) {
                          try {
                            skipNextLoadRef.current = true;
                            const convTitle = text.trim().slice(0, 50).trim() || 'New Strategy';
                            const conv = await apiClient.createConversation(convTitle, 'afl');
                            setConversations(prev => [conv, ...prev]);
                            setSelectedConversation(conv);
                            conversationIdRef.current = conv.id;
                            convId = conv.id;
                          } catch { setPageError('Failed to create conversation'); return; }
                        }

                        let messageText = text;
                        if (attachedKBDocs.length > 0) {
                          const kbContext = attachedKBDocs.map(d => `[KB Doc: ${d.title || d.filename}]`).join(', ');
                          messageText = `${kbContext}\n\n${text}`;
                          setAttachedKBDocs([]);
                        }

                        if (files.length > 0) {
                          const token = getToken();
                          const uploaded: string[] = [];
                          for (const f of files) {
                            const fd = new FormData();
                            fd.append('file', f.rawFile);
                            try {
                              const res = await fetch(`${API_BASE_URL}/chat/files/upload`, {
                                method: 'POST',
                                headers: { Authorization: `Bearer ${token}` },
                                body: fd,
                              });
                              if (res.ok) {
                                const data = await res.json();
                                if (data.file_id) uploaded.push(data.file_id);
                              }
                            } catch {}
                          }
                          if (uploaded.length > 0) {
                            messageText = `[Attached file IDs: ${uploaded.join(', ')}]\n\n${messageText}`;
                          }
                        }

                        sendMessage({ content: messageText });
                      }}
                    >
                      <AttachmentsDisplay 
                        attachedKbDocs={attachedKBDocs}
                        onRemoveKbDoc={handleRemoveKBDoc}
                      />
                      <PromptInputTextarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isStreaming ? 'Generating AFL code...' : 'Describe your trading strategy...'}
                        disabled={status !== 'ready' && status !== 'error'}
                      />
                      <PromptInputFooter>
                        <PromptInputTools>
                          <AttachmentButton disabled={isStreaming} />
                          <PromptInputButton
                            onClick={() => setShowKBPanel(true)}
                            disabled={isStreaming}
                            tooltip="Add from Knowledge Base"
                          >
                            <Database className="size-4" />
                          </PromptInputButton>
                        </PromptInputTools>
                        <PromptInputSubmit
                          status={status}
                          onStop={() => stop()}
                          disabled={!input.trim() && !isStreaming && attachedKBDocs.length === 0}
                        />
                      </PromptInputFooter>
                    </PromptInput>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            {/* Code Editor Panel */}
            {!isMobile && (
              <div 
                className="w-[420px] flex flex-col border-l border-white/[0.06] afl-glass"
              >
                {/* Editor Header */}
                <div 
                  className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between"
                  style={{ background: 'linear-gradient(135deg, rgba(254, 192, 15, 0.06) 0%, transparent 100%)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#FEC00F]/15 flex items-center justify-center">
                      <Code2 size={16} className="text-[#FEC00F]" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white tracking-wide uppercase">AFL Code</h3>
                      <span className={`text-[10px] flex items-center gap-1.5 ${isLoadingCode ? 'text-[#FEC00F]' : 'text-white/40'}`}>
                        {isLoadingCode ? (
                          <>
                            <Loader2 size={10} className="animate-spin" />
                            Loading...
                          </>
                        ) : editorCode ? 'Ready to edit' : 'Awaiting generation'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleCopyCode}
                      disabled={!editorCode}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        copied 
                          ? 'bg-[#FEC00F]/15 border border-[#FEC00F]/30' 
                          : 'bg-white/[0.04] hover:bg-white/[0.08]'
                      } ${!editorCode ? 'opacity-30 cursor-not-allowed' : ''}`}
                      title="Copy code"
                    >
                      {copied ? <Check size={14} className="text-[#FEC00F]" /> : <Copy size={14} className="text-white/60" />}
                    </button>
                    <button
                      onClick={handleDownloadCode}
                      disabled={!editorCode}
                      className={`w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors ${!editorCode ? 'opacity-30 cursor-not-allowed' : ''}`}
                      title="Download .afl"
                    >
                      <Download size={14} className="text-white/60" />
                    </button>
                  </div>
                </div>

                {/* Monaco Editor */}
                <div className="flex-1 min-h-0 relative">
                  {editorCode ? (
                    <Editor
                      height="100%"
                      defaultLanguage="cpp"
                      theme="vs-dark"
                      value={editorCode}
                      onChange={(value) => setEditorCode(value || '')}
                      onMount={(editor) => { editorRef.current = editor; }}
                      options={{
                        fontSize: 12,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        padding: { top: 16, bottom: 16 },
                        lineNumbers: 'on',
                        wordWrap: 'on',
                        automaticLayout: true,
                        scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                        lineHeight: 20,
                        letterSpacing: 0.3,
                      }}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8">
                      <div 
                        className="w-16 h-16 rounded-xl flex items-center justify-center mb-4"
                        style={{ 
                          background: 'linear-gradient(135deg, rgba(254, 192, 15, 0.1) 0%, rgba(254, 192, 15, 0.02) 100%)',
                          border: '1px solid rgba(254, 192, 15, 0.1)'
                        }}
                      >
                        <Code2 size={24} className="text-[#FEC00F]/50" />
                      </div>
                      <p className="text-sm font-medium text-white/60 mb-1">No Code Yet</p>
                      <p className="text-xs text-white/30 text-center">
                        Your generated AFL code will appear here
                      </p>
                    </div>
                  )}
                </div>

                {/* Editor Footer */}
                {editorCode && (
                  <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between bg-black/20">
                    <div className="flex items-center gap-4 text-[10px] text-white/40">
                      <span>{editorCode.split('\n').length} lines</span>
                      <span>{(editorCode.length / 1024).toFixed(1)} KB</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-1 rounded bg-[#FEC00F]/15 text-[#FEC00F] text-[9px] font-bold tracking-wider">
                        AFL
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Knowledge Base Panel */}
        <AnimatePresence>
          {showKBPanel && (
            <KnowledgeBasePanel
              isOpen={showKBPanel}
              onClose={() => setShowKBPanel(false)}
              selectedDocIds={selectedKBDocIds}
              onSelectionChange={setSelectedKBDocIds}
              onAttachDocs={(docs) => {
                setAttachedKBDocs(prev => {
                  const existingIds = new Set(prev.map(d => d.id));
                  const newDocs = docs.filter(d => !existingIds.has(d.id));
                  return [...prev, ...newDocs];
                });
                setShowKBPanel(false);
              }}
            />
          )}
        </AnimatePresence>

        {/* Strategy History Panel */}
        <AnimatePresence>
          {showStrategyHistory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 flex items-center justify-end bg-black/60 backdrop-blur-md"
              onClick={() => setShowStrategyHistory(false)}
            >
              <motion.div
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="h-full w-full max-w-md flex flex-col afl-glass"
                style={{
                  background: 'linear-gradient(135deg, rgba(12, 12, 16, 0.98) 0%, rgba(8, 8, 10, 0.95) 100%)',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '-24px 0 48px -12px rgba(0, 0, 0, 0.5)',
                }}
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #00DED1 0%, #00B8AC 100%)' }}
                    >
                      <History size={20} className="text-black" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white tracking-wide uppercase">
                        Strategy History
                      </h2>
                      <p className="text-xs text-white/50">Generated AFL codes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowStrategyHistory(false)}
                    className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <X size={18} className="text-white/60" />
                  </button>
                </div>

                {/* Strategy List */}
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-3">
                    {allMessages.filter(m => {
                      if (m.role !== 'assistant') return false;
                      const content = typeof m.content === 'string' ? m.content : '';
                      return extractAFLCode(content) !== null;
                    }).map((msg, idx) => {
                      const content = typeof msg.content === 'string' ? msg.content : '';
                      const code = extractAFLCode(content);
                      const preview = code?.split('\n').slice(0, 3).join('\n') || '';
                      const timestamp = msg.createdAt || new Date();
                      
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group relative p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-[#00DED1]/20 transition-all cursor-pointer"
                          onClick={() => {
                            if (code) {
                              setEditorCode(code);
                              setGeneratedCode(code);
                              setShowStrategyHistory(false);
                              toast.success('Strategy loaded into editor');
                            }
                          }}
                        >
                          {/* Strategy Info */}
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-9 h-9 rounded-lg bg-[#00DED1]/15 flex items-center justify-center shrink-0">
                              <Code2 size={16} className="text-[#00DED1]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-white mb-1">
                                Strategy #{allMessages.filter(m => {
                                  if (m.role !== 'assistant') return false;
                                  const c = typeof m.content === 'string' ? m.content : '';
                                  return extractAFLCode(c) !== null;
                                }).length - idx}
                              </h4>
                              <p className="text-[10px] text-white/40 flex items-center gap-1.5">
                                <Clock size={10} />
                                {new Date(timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Code Preview */}
                          <div className="relative">
                            <pre className="text-[10px] leading-relaxed text-white/60 font-mono bg-black/30 rounded-lg p-3 overflow-hidden">
                              {preview}...
                            </pre>
                            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                          </div>

                          {/* Hover Actions */}
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (code) {
                                  navigator.clipboard.writeText(code);
                                  toast.success('Code copied to clipboard');
                                }
                              }}
                              className="w-7 h-7 rounded-lg bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                            >
                              <Copy size={12} className="text-white/80" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Empty State */}
                    {allMessages.filter(m => {
                      if (m.role !== 'assistant') return false;
                      const content = typeof m.content === 'string' ? m.content : '';
                      return extractAFLCode(content) !== null;
                    }).length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div 
                          className="w-16 h-16 rounded-xl flex items-center justify-center mb-4"
                          style={{ 
                            background: 'linear-gradient(135deg, rgba(0, 222, 209, 0.1) 0%, rgba(0, 222, 209, 0.02) 100%)',
                            border: '1px solid rgba(0, 222, 209, 0.1)'
                          }}
                        >
                          <History size={24} className="text-[#00DED1]/50" />
                        </div>
                        <p className="text-sm font-medium text-white/60 mb-1">No Strategies Yet</p>
                        <p className="text-xs text-white/30 text-center px-8">
                          Generated AFL codes will appear here for quick access
                        </p>
                      </div>
                    )}
                  </div>
                  <ScrollBar />
                </ScrollArea>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            settings={backtestSettings}
            onSettingsChange={setBacktestSettings}
          />
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        feedbackType="negative"
        context={{}}
      />
    </>
  );
}

export default AFLGeneratorPage;

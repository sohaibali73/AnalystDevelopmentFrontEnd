'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, ArrowUpFromLine, Trash2, ChevronLeft, ChevronRight, 
  Loader2, RefreshCw, Search, Pencil, X, CopyIcon, ThumbsUpIcon, 
  ThumbsDownIcon, Download, Code2, Settings2, Sparkles, Check, 
  Database, BookOpen, PanelLeft, FileText
} from 'lucide-react';
import { Glow, Pulse } from '@/components/AnimatedComponents';
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
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { Tool as AITool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
import { ConversationEmptyState } from '@/components/ai-elements/conversation';
import { Message as AIMessage, MessageContent, MessageActions, MessageAction, MessageResponse } from '@/components/ai-elements/message';
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputHeader, PromptInputTools, PromptInputButton, PromptInputSubmit, usePromptInputAttachments } from '@/components/ai-elements/prompt-input';
import { Attachments, Attachment, AttachmentPreview, AttachmentRemove } from '@/components/ai-elements/attachments';
import { ChainOfThought, ChainOfThoughtHeader, ChainOfThoughtContent, ChainOfThoughtStep } from '@/components/ai-elements/chain-of-thought';
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
import { InlineReactPreview, stripReactCodeBlocks } from '@/components/InlineReactPreview';
import { KnowledgeBasePanel, getAuthToken, getFileExtension, getFileChipColor } from '@/components/chat';

const logo = '/potomac-icon.png';

// ─── Styles ───────────────────────────────────────────────────────────────────
const AFL_STYLES = `
  @keyframes afl-fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes afl-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .afl-root {
    background-color: var(--bg);
    background-image:
      radial-gradient(ellipse 100% 80% at 50% -20%, rgba(254, 192, 15, 0.06) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 100%, rgba(254, 192, 15, 0.04) 0%, transparent 50%);
  }
  
  .afl-glass-panel {
    background: rgba(13, 13, 16, 0.7);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }
  
  .afl-glass-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }
  
  .afl-msg-enter { animation: afl-fadeUp .3s cubic-bezier(.16, 1, .3, 1) both; }
  .afl-msg-row:hover .msg-actions { opacity: 1 !important; }
  
  [data-scroll-container]::-webkit-scrollbar { width: 6px; }
  [data-scroll-container]::-webkit-scrollbar-track { background: transparent; }
  [data-scroll-container]::-webkit-scrollbar-thumb { 
    background: rgba(254, 192, 15, 0.15); 
    border-radius: 3px; 
  }
  [data-scroll-container]::-webkit-scrollbar-thumb:hover { 
    background: rgba(254, 192, 15, 0.3); 
  }
`;

// ─── KB Document type ─────────────────────────────────────────────────────────
interface KBDocument {
  id: string;
  title?: string;
  filename: string;
  category: string;
  file_size?: number;
}

// ─── Attachments Display ──────────────────────────────────────────────────────
function AttachmentsDisplay({ 
  isDark, 
  attachedKbDocs = [], 
  onRemoveKbDoc 
}: { 
  isDark: boolean;
  attachedKbDocs?: KBDocument[];
  onRemoveKbDoc?: (id: string) => void;
}) {
  const attachments = usePromptInputAttachments();
  const hasFiles = attachments.files.length > 0;
  const hasKbDocs = attachedKbDocs.length > 0;

  if (!hasFiles && !hasKbDocs) return null;

  return (
    <PromptInputHeader>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px 0' }}>
        {/* KB Document attachments */}
        {attachedKbDocs.map((doc) => {
          const ext = getFileExtension(doc.filename);
          const docColor = getFileChipColor(ext);
          return (
            <div
              key={doc.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px 6px 8px',
                borderRadius: '8px',
                border: `1px solid ${docColor}40`,
                background: `${docColor}10`,
                fontSize: '13px',
                fontWeight: 500,
                color: docColor,
                maxWidth: '200px',
              }}
            >
              <Database size={14} style={{ opacity: 0.8, flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {doc.title || doc.filename}
              </span>
              {onRemoveKbDoc && (
                <button
                  onClick={() => onRemoveKbDoc(doc.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: docColor,
                    opacity: 0.6,
                    marginLeft: '2px',
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}
        
        {/* File attachments */}
        {attachments.files.map((file) => (
          <div
            key={file.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px 6px 8px',
              borderRadius: '8px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              fontSize: '13px',
              fontWeight: 500,
              color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
              maxWidth: '200px',
            }}
          >
            <FileText size={14} style={{ opacity: 0.7, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.filename || 'file'}
            </span>
            <button
              onClick={() => attachments.remove(file.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                flexShrink: 0,
                marginLeft: '2px',
              }}
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

// ─── Extract AFL Code ─────────────────────────────────────────────────────────
function extractAFLCode(text: string): string | null {
  const aflMatch = text.match(/```(?:afl|amibroker)\s*\n([\s\S]*?)```/i);
  if (aflMatch) return aflMatch[1].trim();
  const codeMatch = text.match(/```\w*\s*\n([\s\S]*?)```/);
  if (codeMatch) return codeMatch[1].trim();
  return null;
}

// ─── Settings Modal ───────────────────────────────────────────────────────────
function SettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  onSettingsChange,
  isDark 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  settings: any;
  onSettingsChange: (settings: any) => void;
  isDark: boolean;
}) {
  if (!isOpen) return null;

  const settingsFields = [
    { label: 'Initial Equity', key: 'initial_equity', type: 'number', description: 'Starting capital for backtests' },
    { label: 'Max Positions', key: 'max_positions', type: 'number', description: 'Maximum simultaneous positions' },
    { label: 'Position Size', key: 'position_size', type: 'text', description: 'Size per trade (e.g., 100 for 100%)' },
    { label: 'Commission', key: 'commission', type: 'number', description: 'Commission rate (e.g., 0.001 = 0.1%)' },
    { label: 'Margin %', key: 'margin_requirement', type: 'number', description: 'Margin requirement percentage' },
  ];

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="afl-glass-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          margin: '0 20px',
          borderRadius: '20px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #FEC00F 0%, #F59E0B 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Settings2 size={18} color="#1A1A1A" strokeWidth={2.5} />
            </div>
            <div>
              <h2 style={{
                fontFamily: "var(--font-rajdhani), 'Rajdhani', sans-serif",
                fontSize: '16px',
                fontWeight: 700,
                color: '#FFFFFF',
                margin: 0,
                letterSpacing: '0.5px',
              }}>
                Backtest Settings
              </h2>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: 0,
                fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
              }}>
                Configure strategy parameters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
          >
            <X size={18} color="rgba(255, 255, 255, 0.6)" />
          </button>
        </div>

        {/* Settings Grid */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {settingsFields.map(({ label, key, type, description }) => (
            <div key={key}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
                }}>
                  {label}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
                }}>
                  {description}
                </span>
              </label>
              <input
                type={type}
                value={settings[key]}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  [key]: type === 'number' ? Number(e.target.value) : e.target.value,
                })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#FEC00F';
                  e.currentTarget.style.backgroundColor = 'rgba(254, 192, 15, 0.05)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                }}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
              transition: 'all 0.2s',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #FEC00F 0%, #F59E0B 100%)',
              color: '#1A1A1A',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
              boxShadow: '0 4px 12px rgba(254, 192, 15, 0.3)',
            }}
          >
            Save Settings
          </button>
        </div>
      </motion.div>
    </div>
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
  const [sidebarOpen, setSidebarOpen] = useState(false); // Collapsed by default
  const [pageError, setPageError] = useState('');
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Code panel state
  const [generatedCode, setGeneratedCode] = useState('');
  const [editorCode, setEditorCode] = useState('');
  const [showSettings, setShowSettings] = useState(false);
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
  
  // Auto-download tracking
  const lastDownloadedCodeRef = useRef<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string | null>(null);
  const skipNextLoadRef = useRef(false);
  const editorRef = useRef<any>(null);

  // Auth token
  const getToken = () => {
    try { return localStorage.getItem('auth_token') || ''; } catch { return ''; }
  };

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

  // Auto-extract AFL code and auto-download
  const lastExtractedCodeRef = useRef<string | null>(null);
  const lastFetchedFileIdRef = useRef<string | null>(null);
  const [isLoadingCode, setIsLoadingCode] = useState(false);

  // API base URL for fetching files
  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://developer-potomaac.up.railway.app').replace(/\/+$/, '');

  // Fetch AFL file content from download URL
  const fetchAFLContent = useCallback(async (downloadUrl: string, filename: string, fileId: string) => {
    // Don't fetch the same file twice
    if (lastFetchedFileIdRef.current === fileId) return;
    lastFetchedFileIdRef.current = fileId;
    
    setIsLoadingCode(true);
    try {
      const token = getToken();
      // Make URL absolute if it's relative
      const absoluteUrl = downloadUrl.startsWith('/') 
        ? `${API_BASE_URL}${downloadUrl}` 
        : downloadUrl;
      
      console.log('[v0] Fetching AFL file from:', absoluteUrl);
      
      const response = await fetch(absoluteUrl, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }
      
      const code = await response.text();
      console.log('[v0] Fetched AFL code length:', code.length);
      
      if (code && code.trim()) {
        setGeneratedCode(code);
        setEditorCode(code);
        lastExtractedCodeRef.current = code;
        
        // Auto-download the file
        if (lastDownloadedCodeRef.current !== code) {
          lastDownloadedCodeRef.current = code;
          const blob = new Blob([code], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename || 'strategy.afl';
          a.click();
          URL.revokeObjectURL(url);
          toast.success('AFL file auto-downloaded', { description: filename || 'strategy.afl' });
        }
      }
    } catch (err) {
      console.error('[v0] Error fetching AFL file:', err);
      toast.error('Failed to load AFL code');
    } finally {
      setIsLoadingCode(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    if (streamMessages.length === 0) return;
    
    for (let i = streamMessages.length - 1; i >= 0; i--) {
      const msg = streamMessages[i];
      if (msg.role !== 'assistant') continue;
      const parts = msg.parts || [];
      const fullText = parts.filter((p: any) => p.type === 'text').map((p: any) => p.text || '').join('');

      let extractedCode: string | null = null;
      let strategyName: string | undefined;

      // Check for invoke_skill tool with AFL file output
      for (const part of parts) {
        // Handle invoke_skill tool output with file_type: "afl"
        if ((part.type === 'tool-invoke_skill' || part.type === 'dynamic-tool') && part.state === 'output-available') {
          const output = (part as any).output || {};
          const fileType = output.file_type || '';
          const downloadUrl = output.download_url || '';
          const filename = output.filename || '';
          const fileId = output.file_id || '';
          
          console.log('[v0] Found tool output:', { fileType, filename, fileId, hasDownloadUrl: !!downloadUrl });
          
          if (fileType === 'afl' && downloadUrl && fileId) {
            // Fetch the AFL content from the download URL
            fetchAFLContent(downloadUrl, filename, fileId);
            return; // Exit early, the fetch will update the state
          }
        }
        
        // Also check for generate_afl_code tool
        if (part.type === 'tool-generate_afl_code' && part.state === 'output-available') {
          const aflCode = (part as any).output?.code || (part as any).output?.afl_code;
          if (aflCode) {
            extractedCode = aflCode;
            strategyName = (part as any).output?.strategy_name || (part as any).output?.name;
            break;
          }
        }
      }

      // Fallback: try to extract code from text (code blocks)
      if (!extractedCode) {
        extractedCode = extractAFLCode(fullText);
      }

      if (extractedCode) {
        if (lastExtractedCodeRef.current === extractedCode) break;
        lastExtractedCodeRef.current = extractedCode;
        
        setGeneratedCode(extractedCode);
        setEditorCode(extractedCode);
        
        // Auto-download if this is new code
        if (lastDownloadedCodeRef.current !== extractedCode && !isStreaming) {
          lastDownloadedCodeRef.current = extractedCode;
          const fileName = strategyName 
            ? `${strategyName.replace(/\s+/g, '_').toLowerCase()}.afl`
            : 'strategy.afl';
          const blob = new Blob([extractedCode], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('AFL file auto-downloaded', { description: fileName });
        }
      }
      break;
    }
  }, [streamMessages, isStreaming, fetchAFLContent]);

  // Sync conversationIdRef
  useEffect(() => {
    conversationIdRef.current = selectedConversation?.id || null;
  }, [selectedConversation]);

  // Load conversations
  useEffect(() => { loadConversations(); }, []);
  useEffect(() => {
    if (selectedConversation) {
      if (skipNextLoadRef.current) { skipNextLoadRef.current = false; return; }
      loadPreviousMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      const scrollContainer = messagesEndRef.current.closest('[data-scroll-container]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      } else {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  }, [streamMessages]);

  useEffect(() => { if (chatError) setPageError(chatError.message); }, [chatError]);

  const loadConversations = async () => {
    try {
      const allData = await apiClient.getConversations();
      const data = allData.filter((c: any) => c.conversation_type === 'afl');
      setConversations(data);
      if (data.length > 0 && !selectedConversation) setSelectedConversation(data[0]);
    } catch { setPageError('Failed to load conversations'); }
    finally { setLoadingConversations(false); }
  };

  const loadPreviousMessages = async (conversationId: string) => {
    try {
      const data = await apiClient.getMessages(conversationId);
      setMessages(data.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content || '',
        parts: m.metadata?.parts || [{ type: 'text', text: m.content || '' }],
        createdAt: m.created_at ? new Date(m.created_at) : new Date(),
      })));
      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].role === 'assistant') {
          const code = extractAFLCode(data[i].content || '');
          if (code) { 
            setGeneratedCode(code); 
            setEditorCode(code);
            break; 
          }
        }
      }
    } catch { setMessages([]); }
  };

  const handleNewConversation = async () => {
    try {
      skipNextLoadRef.current = true;
      const newConv = await apiClient.createConversation('New Strategy', 'afl');
      setConversations(prev => [newConv, ...prev]);
      setSelectedConversation(newConv);
      conversationIdRef.current = newConv.id;
      setMessages([]);
      setGeneratedCode('');
      setEditorCode('');
      setPageError('');
    } catch (err) { setPageError(err instanceof Error ? err.message : 'Failed'); }
  };

  const handleDeleteConversation = async (id: string) => {
    if (!confirm('Delete this conversation?')) return;
    try {
      await apiClient.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (selectedConversation?.id === id) { 
        setSelectedConversation(null); 
        setMessages([]); 
        setGeneratedCode(''); 
        setEditorCode('');
      }
    } catch { setPageError('Failed to delete'); }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      await apiClient.renameConversation(id, newTitle);
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
      if (selectedConversation?.id === id) {
        setSelectedConversation(prev => prev ? { ...prev, title: newTitle } : prev);
      }
    } catch { toast.error('Failed to rename'); }
    setRenamingId(null);
  };

  const handleCopyCode = () => {
    if (!editorCode) return;
    navigator.clipboard.writeText(editorCode);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    if (!editorCode) return;
    const blob = new Blob([editorCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'strategy.afl';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('AFL file downloaded');
  };

  const handleCopyMessage = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied!')).catch(() => toast.error('Copy failed'));
  }, []);

  // KB Panel handlers
  const handleAddKBDocs = (docs: KBDocument[]) => {
    setAttachedKBDocs(prev => {
      const existingIds = new Set(prev.map(d => d.id));
      const newDocs = docs.filter(d => !existingIds.has(d.id));
      return [...prev, ...newDocs];
    });
    setSelectedKBDocIds(new Set());
    setShowKBPanel(false);
  };

  const handleRemoveKBDoc = (id: string) => {
    setAttachedKBDocs(prev => prev.filter(d => d.id !== id));
  };

  const allMessages = useMemo(() => streamMessages, [streamMessages]);
  const lastIdx = allMessages.length - 1;
  const userName = user?.name || 'You';

  const lastIdxRef = useRef(lastIdx);
  lastIdxRef.current = lastIdx;
  const isStreamingRef = useRef(isStreaming);
  isStreamingRef.current = isStreaming;

  // Render a single message
  const renderMessage = useCallback((message: any, idx: number) => {
    const parts = message.parts || [];
    const isLast = idx === lastIdxRef.current;
    const msgIsStreaming = isStreamingRef.current && isLast && message.role === 'assistant';
    const fullText = parts.filter((p: any) => p.type === 'text').map((p: any) => p.text || '').join('');
    const toolParts = parts.filter((p: any) => p.type?.startsWith('tool-') || p.type === 'dynamic-tool');
    const hasMultipleTools = toolParts.length >= 2;

    return (
      <AIMessage key={message.id} from={message.role}>
        <div className={`flex items-center gap-2 text-xs mb-2 ${message.role === 'user' ? 'justify-end' : ''}`}>
          {message.role === 'user' ? (
            <>
              <span className="font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{userName}</span>
              {message.createdAt && (
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </>
          ) : (
            <>
              <div style={{ 
                width: '22px', 
                height: '22px', 
                borderRadius: '6px', 
                overflow: 'hidden',
                backgroundColor: 'rgba(254, 192, 15, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img src={logo} alt="Yang AI" style={{ width: '16px', height: '16px' }} />
              </div>
              <span className="font-semibold" style={{ color: '#FFFFFF' }}>Yang</span>
              {message.createdAt && (
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {msgIsStreaming && <Shimmer duration={1.5}>Streaming...</Shimmer>}
            </>
          )}
        </div>

        <MessageContent>
          {hasMultipleTools && message.role === 'assistant' && !msgIsStreaming && (
            <ChainOfThought defaultOpen={false}>
              <ChainOfThoughtHeader>Used {toolParts.length} tools</ChainOfThoughtHeader>
              <ChainOfThoughtContent>
                {toolParts.map((tp: any, tIdx: number) => {
                  const tName = tp.type === 'dynamic-tool' ? (tp.toolName || 'unknown') : (tp.type?.replace('tool-', '') || 'unknown');
                  return <ChainOfThoughtStep key={tIdx}>{tName}</ChainOfThoughtStep>;
                })}
              </ChainOfThoughtContent>
            </ChainOfThought>
          )}

          {parts.map((part: any, pIdx: number) => {
            switch (part.type) {
              case 'text':
                const hasReactBlocks = /```(?:jsx|tsx|react)/i.test(part.text || '');
                if (hasReactBlocks) {
                  const strippedText = stripReactCodeBlocks(part.text || '');
                  return (
                    <React.Fragment key={pIdx}>
                      {strippedText.trim() && <MessageResponse>{strippedText}</MessageResponse>}
                      {!msgIsStreaming && <InlineReactPreview text={part.text} isDark={isDark} />}
                    </React.Fragment>
                  );
                }
                return (
                  <p key={pIdx} className="whitespace-pre-wrap break-words text-sm leading-relaxed" style={{ color: '#E8E8E8', fontWeight: 400 }}>
                    {part.text}
                  </p>
                );

              case 'reasoning':
                return (
                  <Reasoning key={pIdx} isStreaming={msgIsStreaming} defaultOpen={msgIsStreaming}>
                    <ReasoningTrigger />
                    <ReasoningContent>{part.text || ''}</ReasoningContent>
                  </Reasoning>
                );

              case 'tool-generate_afl_code':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="generate_afl_code" input={part.input} />;
                  case 'output-available': return <AFLGenerateCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>AFL generation error: {part.errorText}</div>;
                  default: return null;
                }
              case 'tool-validate_afl':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="validate_afl" input={part.input} />;
                  case 'output-available': return <AFLValidateCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>AFL validation error: {part.errorText}</div>;
                  default: return null;
                }
              case 'tool-debug_afl_code':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="debug_afl_code" input={part.input} />;
                  case 'output-available': return <AFLDebugCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>AFL debug error: {part.errorText}</div>;
                  default: return null;
                }
              case 'tool-explain_afl_code':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="explain_afl_code" input={part.input} />;
                  case 'output-available': return <AFLExplainCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>AFL explain error: {part.errorText}</div>;
                  default: return null;
                }
              case 'tool-sanity_check_afl':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="sanity_check_afl" input={part.input} />;
                  case 'output-available': return <AFLSanityCheckCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>AFL sanity check error: {part.errorText}</div>;
                  default: return null;
                }
              case 'tool-search_knowledge_base':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="search_knowledge_base" input={part.input} />;
                  case 'output-available': return <KnowledgeBaseResults key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>KB search error: {part.errorText}</div>;
                  default: return null;
                }
              case 'tool-web_search':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="web_search" input={part.input} />;
                  case 'output-available': return <WebSearchResults key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Web search error: {part.errorText}</div>;
                  default: return null;
                }

              default:
                if (part.type?.startsWith('tool-')) {
                  const toolName = part.type.replace('tool-', '');
                  switch (part.state) {
                    case 'input-streaming': case 'input-available':
                      return <ToolLoading key={pIdx} toolName={toolName} input={part.input} />;
                    case 'output-available':
                      return (
                        <AITool key={pIdx}>
                          <ToolHeader type={part.type} state={part.state} />
                          <ToolContent>
                            <ToolInput input={part.input} />
                            <ToolOutput output={part.output} errorText={part.errorText} />
                          </ToolContent>
                        </AITool>
                      );
                    case 'output-error':
                      return (
                        <AITool key={pIdx}>
                          <ToolHeader type={part.type} state={part.state} />
                          <ToolContent>
                            <ToolOutput output={part.output} errorText={part.errorText} />
                          </ToolContent>
                        </AITool>
                      );
                    default: return null;
                  }
                }
                return null;
            }
          })}

          {status === 'submitted' && isLast && message.role === 'assistant' && parts.every((p: any) => !p.text) && (
            <Shimmer duration={1.5}>Generating AFL code...</Shimmer>
          )}
        </MessageContent>

        {message.role === 'assistant' && !msgIsStreaming && fullText && (
          <MessageActions className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MessageAction tooltip="Copy" onClick={() => handleCopyMessage(fullText)}>
              <CopyIcon className="size-3.5" />
            </MessageAction>
            <MessageAction tooltip="Helpful" onClick={() => toast.success('Thanks for the feedback!')}>
              <ThumbsUpIcon className="size-3.5" />
            </MessageAction>
            <MessageAction tooltip="Not helpful" onClick={() => setShowFeedbackModal(true)}>
              <ThumbsDownIcon className="size-3.5" />
            </MessageAction>
          </MessageActions>
        )}
      </AIMessage>
    );
  }, [userName, isDark, handleCopyMessage, status]);

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    return conversations.filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [conversations, searchQuery]);

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{AFL_STYLES}</style>
      
      <div className="afl-root" style={{ height: '100%', display: 'flex', overflow: 'hidden', position: 'relative' }}>
        
        {/* ═══════════════════════════════════════════════════════════════════════
            COLLAPSIBLE SIDEBAR
        ═══════════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="afl-glass-panel"
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                flexShrink: 0,
                borderRight: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              {/* Sidebar Header */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(254, 192, 15, 0.08) 0%, transparent 100%)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #FEC00F 0%, #F59E0B 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(254, 192, 15, 0.3)',
                  }}>
                    <Code2 size={18} color="#1A1A1A" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 style={{
                      fontFamily: "var(--font-rajdhani), 'Rajdhani', sans-serif",
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      margin: 0,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                    }}>
                      Strategies
                    </h2>
                    <p style={{
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      margin: 0,
                      fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
                    }}>
                      {conversations.length} saved
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}
                >
                  <ChevronLeft size={16} color="rgba(255, 255, 255, 0.6)" />
                </button>
              </div>

              {/* New Strategy + Search */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNewConversation}
                  disabled={streamMessages.length === 0}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: streamMessages.length === 0
                      ? 'rgba(254, 192, 15, 0.2)'
                      : 'linear-gradient(135deg, #FEC00F 0%, #F59E0B 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: streamMessages.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: 700,
                    color: streamMessages.length === 0 ? 'rgba(26, 26, 26, 0.5)' : '#1A1A1A',
                    fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
                    fontSize: '13px',
                    boxShadow: streamMessages.length === 0 ? 'none' : '0 4px 12px rgba(254, 192, 15, 0.3)',
                    opacity: streamMessages.length === 0 ? 0.6 : 1,
                  }}
                >
                  <Plus size={18} strokeWidth={2.5} /> New Strategy
                </motion.button>

                <div style={{ position: 'relative' }}>
                  <Search size={14} color="rgba(255, 255, 255, 0.4)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search strategies..."
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(254, 192, 15, 0.5)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                    }}
                  />
                </div>
              </div>

              {/* Conversation List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
                {loadingConversations ? (
                  <div className="flex items-center justify-center py-10 gap-2">
                    <Loader2 size={18} color="#FEC00F" className="animate-spin" />
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>Loading...</span>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255, 255, 255, 0.4)', fontSize: '13px' }}>
                    {searchQuery.trim() ? `No strategies matching "${searchQuery}"` : 'No strategies yet'}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredConversations.map((conv) => (
                      <motion.div
                        key={conv.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ x: 4 }}
                        onClick={() => setSelectedConversation(conv)}
                        className="group"
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          backgroundColor: selectedConversation?.id === conv.id 
                            ? 'rgba(254, 192, 15, 0.12)' 
                            : 'transparent',
                          border: selectedConversation?.id === conv.id
                            ? '1px solid rgba(254, 192, 15, 0.3)'
                            : '1px solid transparent',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: selectedConversation?.id === conv.id
                            ? 'rgba(254, 192, 15, 0.2)'
                            : 'rgba(255, 255, 255, 0.04)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Code2 
                            size={14} 
                            color={selectedConversation?.id === conv.id ? '#FEC00F' : 'rgba(255, 255, 255, 0.5)'} 
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {renamingId === conv.id ? (
                            <input
                              autoFocus
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameConversation(conv.id, renameValue);
                                if (e.key === 'Escape') setRenamingId(null);
                              }}
                              onBlur={() => handleRenameConversation(conv.id, renameValue)}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: '13px',
                                fontWeight: 600,
                                outline: 'none',
                                fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
                              }}
                            />
                          ) : (
                            <p style={{
                              margin: 0,
                              fontSize: '13px',
                              fontWeight: 600,
                              color: selectedConversation?.id === conv.id ? '#FEC00F' : '#FFFFFF',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
                            }}>
                              {conv.title || 'Untitled Strategy'}
                            </p>
                          )}
                          <p style={{
                            margin: 0,
                            fontSize: '11px',
                            color: 'rgba(255, 255, 255, 0.4)',
                            marginTop: '2px',
                          }}>
                            {conv.created_at ? new Date(conv.created_at).toLocaleDateString() : 'No date'}
                          </p>
                        </div>
                        <div 
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ display: 'flex', gap: '4px' }}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); setRenamingId(conv.id); setRenameValue(conv.title || ''); }}
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Pencil size={12} color="rgba(255, 255, 255, 0.6)" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }}
                            style={{
                              background: 'rgba(220, 38, 38, 0.1)',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Trash2 size={12} color="#DC2626" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════════════════
            MAIN CONTENT AREA
        ═══════════════════════════════════════════════════════════════════════ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
          
          {/* Header Bar */}
          <div 
            className="afl-glass-card"
            style={{
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Sidebar Toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  background: sidebarOpen ? 'rgba(254, 192, 15, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${sidebarOpen ? 'rgba(254, 192, 15, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '10px',
                  padding: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <PanelLeft size={18} color={sidebarOpen ? '#FEC00F' : 'rgba(255, 255, 255, 0.6)'} />
              </button>

              {/* Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Glow color="#FEC00F">
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #FEC00F 0%, #F59E0B 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(254, 192, 15, 0.3)',
                  }}>
                    <Code2 size={18} color="#1A1A1A" strokeWidth={2.5} />
                  </div>
                </Glow>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h1 style={{
                      fontFamily: "var(--font-rajdhani), 'Rajdhani', sans-serif",
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      margin: 0,
                      letterSpacing: '0.5px',
                    }}>
                      AFL Generator
                    </h1>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(139, 92, 246, 0.15)',
                      color: '#A78BFA',
                      letterSpacing: '0.5px',
                      fontFamily: "'DM Mono', monospace",
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                    }}>
                      SKILL
                    </span>
                  </div>
                  <p style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    margin: 0,
                    fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
                  }}>
                    AmiBroker Strategy Builder
                  </p>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* KB Toggle */}
              <button
                onClick={() => setShowKBPanel(!showKBPanel)}
                style={{
                  background: showKBPanel ? 'rgba(254, 192, 15, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${showKBPanel ? 'rgba(254, 192, 15, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '10px',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: showKBPanel ? '#FEC00F' : 'rgba(255, 255, 255, 0.7)',
                  fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
                  transition: 'all 0.2s',
                }}
              >
                <Database size={14} />
                Knowledge Base
              </button>

              {/* Settings */}
              <button
                onClick={() => setShowSettings(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <Settings2 size={18} color="rgba(255, 255, 255, 0.6)" />
              </button>
            </div>
          </div>

          {/* Main Split View */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            
            {/* Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {/* Messages */}
              <div 
                data-scroll-container 
                style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  overflowX: 'hidden',
                }}
              >
                <div className="max-w-[800px] mx-auto px-6 py-8">
                  {allMessages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <ConversationEmptyState
                        icon={
                          <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '20px',
                            background: 'linear-gradient(135deg, rgba(254, 192, 15, 0.2) 0%, rgba(254, 192, 15, 0.1) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '8px',
                          }}>
                            <Sparkles size={40} color="#FEC00F" strokeWidth={1.5} />
                          </div>
                        }
                        title="AFL Code Generator"
                        description="Generate, debug, and optimize AmiBroker Formula Language strategies with AI"
                      >
                        <div className="flex flex-col items-center gap-6 mt-4" style={{ maxWidth: '500px' }}>
                          <Suggestions className="justify-center">
                            {[
                              "Generate a moving average crossover strategy with stop loss",
                              "Create an RSI-based mean reversion system",
                              "Build a Bollinger Band breakout with position sizing",
                              "Debug my AFL code for syntax errors"
                            ].map((suggestion, index) => (
                              <motion.div
                                key={suggestion}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                              >
                                <Suggestion suggestion={suggestion} onClick={(s) => setInput(s)} />
                              </motion.div>
                            ))}
                          </Suggestions>
                        </div>
                      </ConversationEmptyState>
                    </motion.div>
                  ) : (
                    <>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
                        {allMessages.map((msg, idx) => renderMessage(msg, idx))}
                      </motion.div>

                      {status === 'submitted' && allMessages.length > 0 && allMessages[allMessages.length - 1]?.role === 'user' && (
                        <AIMessage from="assistant">
                          <div className="flex items-center gap-2 text-xs mb-2">
                            <div style={{ 
                              width: '22px', height: '22px', borderRadius: '6px',
                              backgroundColor: 'rgba(254, 192, 15, 0.15)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <img src={logo} alt="Yang AI" style={{ width: '16px', height: '16px' }} />
                            </div>
                            <span className="font-semibold" style={{ color: '#FFFFFF' }}>Yang</span>
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
                <div style={{
                  padding: '12px 20px',
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  borderTop: '1px solid rgba(220, 38, 38, 0.3)',
                  color: '#DC2626',
                  fontSize: '13px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span>{pageError || chatError?.message}</span>
                  <div className="flex gap-2">
                    <button onClick={() => regenerate()} style={{
                      border: '1px solid #DC2626',
                      borderRadius: '6px',
                      color: '#DC2626',
                      cursor: 'pointer',
                      padding: '6px 12px',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: 'transparent',
                      fontWeight: 600,
                    }}>
                      <RefreshCw size={12} /> Retry
                    </button>
                    <button onClick={() => setPageError('')} style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#DC2626',
                      cursor: 'pointer',
                      fontSize: '18px',
                      padding: '0 8px',
                      fontWeight: 700
                    }}>
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* Prompt Input */}
              <div style={{
                flexShrink: 0,
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                background: 'linear-gradient(to top, rgba(254, 192, 15, 0.03) 0%, transparent 100%)',
              }}>
                <div className="max-w-[800px] mx-auto px-6 py-5">
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

                        // Build message with KB context
                        let messageText = text;
                        if (attachedKBDocs.length > 0) {
                          const kbContext = attachedKBDocs.map(d => `[KB Doc: ${d.title || d.filename}]`).join(', ');
                          messageText = `${kbContext}\n\n${text}`;
                          setAttachedKBDocs([]);
                        }

                        // Handle file uploads
                        if (files.length > 0) {
                          const token = getToken();
                          const uploaded: string[] = [];
                          for (const f of files) {
                            const fd = new FormData();
                            fd.append('file', f.rawFile);
                            try {
                              const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://developer-potomaac.up.railway.app').replace(/\/+$/, '');
                              const res = await fetch(`${baseUrl}/chat/files/upload`, {
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
                        isDark={isDark} 
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
            <div 
              className="afl-glass-panel"
              style={{
                width: isMobile ? '100%' : '480px',
                display: 'flex',
                flexDirection: 'column',
                borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
                flexShrink: 0,
              }}
            >
              {/* Editor Header */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(254, 192, 15, 0.08) 0%, transparent 100%)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Pulse>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(254, 192, 15, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Code2 size={16} color="#FEC00F" strokeWidth={2.5} />
                    </div>
                  </Pulse>
                  <div>
                    <h3 style={{
                      fontFamily: "var(--font-rajdhani), 'Rajdhani', sans-serif",
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      margin: 0,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                    }}>
                      AFL Code
                    </h3>
                    <span style={{
                      fontSize: '10px',
                      color: isLoadingCode ? '#FEC00F' : 'rgba(255, 255, 255, 0.5)',
                      fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      {isLoadingCode ? (
                        <>
                          <Loader2 size={10} className="animate-spin" />
                          Loading code...
                        </>
                      ) : editorCode ? 'Editable' : 'Waiting for generation'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={handleCopyCode}
                    disabled={!editorCode}
                    style={{
                      background: copied ? 'rgba(254, 192, 15, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${copied ? 'rgba(254, 192, 15, 0.3)' : 'transparent'}`,
                      borderRadius: '8px',
                      padding: '8px',
                      cursor: editorCode ? 'pointer' : 'default',
                      opacity: editorCode ? 1 : 0.3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                    title="Copy code"
                  >
                    {copied ? <Check size={14} color="#FEC00F" /> : <CopyIcon size={14} color="rgba(255, 255, 255, 0.6)" />}
                  </button>
                  <button
                    onClick={handleDownloadCode}
                    disabled={!editorCode}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid transparent',
                      borderRadius: '8px',
                      padding: '8px',
                      cursor: editorCode ? 'pointer' : 'default',
                      opacity: editorCode ? 1 : 0.3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                    title="Download .afl"
                  >
                    <Download size={14} color="rgba(255, 255, 255, 0.6)" />
                  </button>
                </div>
              </div>

              {/* Monaco Editor */}
              <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                {editorCode ? (
                  <Editor
                    height="100%"
                    defaultLanguage="cpp"
                    theme="vs-dark"
                    value={editorCode}
                    onChange={(value) => setEditorCode(value || '')}
                    onMount={(editor) => { editorRef.current = editor; }}
                    options={{
                      fontSize: 13,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      padding: { top: 16, bottom: 16 },
                      lineNumbers: 'on',
                      wordWrap: 'on',
                      automaticLayout: true,
                      scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                      lineHeight: 22,
                      letterSpacing: 0.3,
                    }}
                  />
                ) : (
                  <div style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    padding: '60px 40px',
                  }}>
                    {isLoadingCode ? (
                      <>
                        <div style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '16px',
                          background: 'rgba(254, 192, 15, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Loader2 size={28} color="#FEC00F" className="animate-spin" />
                        </div>
                        <div className="text-center" style={{ maxWidth: '280px' }}>
                          <h4 style={{
                            fontFamily: "var(--font-rajdhani), 'Rajdhani', sans-serif",
                            fontSize: '16px',
                            fontWeight: 700,
                            color: '#FFFFFF',
                            marginBottom: '8px',
                          }}>
                            Loading Code...
                          </h4>
                          <p style={{
                            fontSize: '13px',
                            color: 'rgba(255, 255, 255, 0.5)',
                            textAlign: 'center',
                            lineHeight: 1.6,
                            margin: 0,
                          }}>
                            Fetching generated AFL code from the server.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '16px',
                          background: 'rgba(254, 192, 15, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Code2 size={32} color="rgba(255, 255, 255, 0.3)" strokeWidth={1.5} />
                        </div>
                        <div className="text-center" style={{ maxWidth: '280px' }}>
                          <h4 style={{
                            fontFamily: "var(--font-rajdhani), 'Rajdhani', sans-serif",
                            fontSize: '16px',
                            fontWeight: 700,
                            color: '#FFFFFF',
                            marginBottom: '8px',
                          }}>
                            Code Will Appear Here
                          </h4>
                          <p style={{
                            fontSize: '13px',
                            color: 'rgba(255, 255, 255, 0.5)',
                            textAlign: 'center',
                            lineHeight: 1.6,
                            margin: 0,
                          }}>
                            Describe your trading strategy to generate AFL code. The file will auto-download when ready.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {editorCode && (
                <div style={{
                  padding: '12px 20px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  background: 'rgba(0, 0, 0, 0.2)',
                }}>
                  {[
                    { label: 'Optimize', prompt: `Optimize this AFL code for better performance:\n\`\`\`afl\n${editorCode}\n\`\`\`` },
                    { label: 'Debug', prompt: `Debug this AFL code and find potential issues:\n\`\`\`afl\n${editorCode}\n\`\`\`` },
                    { label: 'Explain', prompt: `Explain this AFL code line by line:\n\`\`\`afl\n${editorCode}\n\`\`\`` },
                    { label: 'Feedback', prompt: '' },
                  ].map(({ label, prompt }) => (
                    <button
                      key={label}
                      onClick={() => {
                        if (label === 'Feedback') {
                          setShowFeedbackModal(true);
                          return;
                        }
                        setInput(prompt);
                      }}
                      style={{
                        padding: '8px 16px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: 'transparent',
                        color: 'rgba(255, 255, 255, 0.6)',
                        cursor: 'pointer',
                        fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
                        transition: 'all 0.2s',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Knowledge Base Panel */}
        <KnowledgeBasePanel
          isOpen={showKBPanel}
          onClose={() => setShowKBPanel(false)}
          selectedDocIds={selectedKBDocIds}
          onSelectedDocIdsChange={setSelectedKBDocIds}
          onAddToMessage={handleAddKBDocs}
          isDark={isDark}
        />

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <SettingsModal
              isOpen={showSettings}
              onClose={() => setShowSettings(false)}
              settings={backtestSettings}
              onSettingsChange={setBacktestSettings}
              isDark={isDark}
            />
          )}
        </AnimatePresence>

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <FeedbackModal
            isOpen={showFeedbackModal}
            onClose={() => setShowFeedbackModal(false)}
            generatedCode={editorCode || generatedCode}
            conversationId={selectedConversation?.id}
          />
        )}
      </div>
    </>
  );
}

export default AFLGeneratorPage;

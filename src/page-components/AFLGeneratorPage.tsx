'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, MessageSquare, Paperclip, Trash2, ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, Pencil, X, CopyIcon, ThumbsUpIcon, ThumbsDownIcon, Download, Code2, PanelRightClose, PanelRightOpen, Settings2, Zap, Layers, Sparkles, Check, FileText, FileSpreadsheet, ImageIcon } from 'lucide-react';
import { FadeIn, AnimatedCard, AnimatedListItem, StaggerContainer, StaggerItem, Glow, AnimatedProgress, Pulse } from '@/components/AnimatedComponents';
import { renderToolPart } from '@/components/chat/tool-registry';
import { Switch } from '@/components/ui/switch';
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
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
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

const logo = '/potomac-icon.png';

// Helper to get file extension
function getFileExtension(filename: string): string {
  const match = filename.match(/\.([a-zA-Z0-9]+)$/i);
  return match ? match[1].toLowerCase() : '';
}

// Helper to get file icon based on extension
function getFileTypeIcon(filename: string) {
  const ext = getFileExtension(filename);
  if (['pdf', 'doc', 'docx', 'rtf'].includes(ext)) return FileText;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return FileSpreadsheet;
  if (['json', 'xml', 'html', 'md', 'txt', 'afl'].includes(ext)) return Code2;
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return ImageIcon;
  return FileText;
}

// Component to display file attachments inside PromptInput - Claude/ChatGPT style
function AttachmentsDisplay({ isDark }: { isDark: boolean }) {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) return null;
  
  return (
    <PromptInputHeader>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '8px',
        padding: '8px 0',
      }}>
        {attachments.files.map((file) => {
          const fname = file.filename || 'file';
          const Icon = getFileTypeIcon(fname);
          
          return (
            <div
              key={file.id}
              className="group"
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
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={14} style={{ flexShrink: 0, opacity: 0.6 }} />
              <span style={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                fontFamily: "'Inter', system-ui, sans-serif",
              }}>
                {fname}
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
                  marginLeft: '2px',
                  transition: 'opacity 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { 
                  e.currentTarget.style.opacity = '1'; 
                  e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
                }}
                onMouseLeave={e => { 
                  e.currentTarget.style.opacity = '0.7'; 
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </PromptInputHeader>
  );
}

// Simple attachment button
function AttachmentButton({ disabled }: { disabled?: boolean }) {
  const attachments = usePromptInputAttachments();
  const handleClick = useCallback(() => {
    if (!disabled) attachments.openFileDialog();
  }, [attachments, disabled]);
  return (
<PromptInputButton onClick={handleClick} disabled={disabled} tooltip="Attach files (PDF, AFL, CSV, images, etc.)">
    <Paperclip className="size-4" />
  </PromptInputButton>
  );
}

// Extract AFL code from message text
function extractAFLCode(text: string): string | null {
  const aflMatch = text.match(/```(?:afl|amibroker)\s*\n([\s\S]*?)```/i);
  if (aflMatch) return aflMatch[1].trim();
  const codeMatch = text.match(/```\w*\s*\n([\s\S]*?)```/);
  if (codeMatch) return codeMatch[1].trim();
  return null;
}

export function AFLGeneratorPage() {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const isDark = resolvedTheme === 'dark';

  // State
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationType | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const [pageError, setPageError] = useState('');
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Code panel state
  const [codePanelOpen, setCodePanelOpen] = useState(!isMobile);
  const [generatedCode, setGeneratedCode] = useState('');
  const [strategyType] = useState<'standalone'>('standalone');
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

  // Composite Model Mode
  const [compositeMode, setCompositeMode] = useState(false);
  const [strategies, setStrategies] = useState<{
    id: string;
    name: string;
    code: string;
    description?: string;
    strategyType?: string;
    createdAt: Date;
  }[]>([]);
  const [activeTab, setActiveTab] = useState<string>('composite');

  // Feedback
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string | null>(null);
  const skipNextLoadRef = useRef(false);
  const editorRef = useRef<any>(null);

  // Auth token
  const getAuthToken = () => {
    try { return localStorage.getItem('auth_token') || ''; } catch { return ''; }
  };

  // Theme-aware colors using CSS variables
  const colors = useMemo(() => ({
    background: 'var(--bg)',
    sidebar: 'var(--bg-card)',
    cardBg: 'var(--bg-card)',
    inputBg: 'var(--bg-raised)',
    border: 'var(--border)',
    borderLight: 'var(--border)',
    text: 'var(--text)',
    textMuted: 'var(--text-muted)',
    textSubtle: 'var(--text-muted)',
    primaryBlue: 'var(--accent)',
    primaryBlueHover: 'var(--accent)',
    primaryViolet: 'var(--accent)',
    primaryVioletHover: 'var(--accent)',
    darkGray: '#1A1A1A',
    codePanelBg: isDark ? '#0D0D0D' : '#FAFAFA',
    hoverBg: 'var(--bg-card-hover)',
    activeBg: 'var(--accent-dim)',
    accentGlow: 'var(--accent-glow)',
  }), [isDark]);

  // AI SDK useChat
  const { messages: streamMessages, sendMessage, status, stop, error: chatError, setMessages, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      headers: () => {
        const token = getAuthToken();
        return { 'Authorization': token ? `Bearer ${token}` : '' };
      },
      body: () => ({
        conversationId: conversationIdRef.current,
        skill_slug: 'amibroker_afl_developer', // Force AFL skill for this page
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

  // Auto-extract AFL code from the latest assistant message
  const lastExtractedCodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (streamMessages.length === 0) return;
    for (let i = streamMessages.length - 1; i >= 0; i--) {
      const msg = streamMessages[i];
      if (msg.role !== 'assistant') continue;
      const parts = msg.parts || [];
      const fullText = parts.filter((p: any) => p.type === 'text').map((p: any) => p.text || '').join('');

      let extractedCode: string | null = null;
      let extractedDescription: string | undefined;
      let extractedStrategyType: string | undefined;

      for (const part of parts) {
        // Handle direct AFL tool
        if (part.type === 'tool-generate_afl_code' && part.state === 'output-available') {
          const aflCode = (part as any).output?.code || (part as any).output?.afl_code;
          if (aflCode) {
            extractedCode = aflCode;
            extractedDescription = (part as any).output?.description;
            extractedStrategyType = (part as any).output?.strategy_type;
            break;
          }
        }
        // Handle invoke_skill which wraps AFL code generation
        if (part.type === 'tool-invoke_skill' && part.state === 'output-available') {
          const output = (part as any).output;
          // Check for AFL code in various possible locations
          const aflCode = output?.afl_code || output?.code || output?.fixed_code || 
                         output?.result?.afl_code || output?.result?.code;
          if (aflCode) {
            extractedCode = aflCode;
            extractedDescription = output?.description || output?.result?.description;
            extractedStrategyType = output?.strategy_type || output?.result?.strategy_type;
            break;
          }
        }
      }

      if (!extractedCode) {
        extractedCode = extractAFLCode(fullText);
      }

      if (extractedCode) {
        if (lastExtractedCodeRef.current === extractedCode) break;
        lastExtractedCodeRef.current = extractedCode;

        if (compositeMode) {
          setStrategies(prev => {
            const alreadyExists = prev.some(s => s.code === extractedCode);
            if (alreadyExists) return prev;
            const newStrategy = {
              id: `strategy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: `Strategy ${prev.length + 1}`,
              code: extractedCode!,
              description: extractedDescription,
              strategyType: extractedStrategyType,
              createdAt: new Date(),
            };
            setTimeout(() => setActiveTab(newStrategy.id), 0);
            return [...prev, newStrategy];
          });
        } else {
          setGeneratedCode(extractedCode);
        }
        if (!codePanelOpen && !isMobile) setCodePanelOpen(true);
      }
      break;
    }
  }, [streamMessages, isMobile, compositeMode, codePanelOpen]);

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
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
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
          if (code) { setGeneratedCode(code); break; }
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
      setStrategies([]);
      setActiveTab('composite');
      setPageError('');
    } catch (err) { setPageError(err instanceof Error ? err.message : 'Failed'); }
  };

  const handleDeleteConversation = async (id: string) => {
    if (!confirm('Delete this conversation?')) return;
    try {
      await apiClient.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (selectedConversation?.id === id) { setSelectedConversation(null); setMessages([]); setGeneratedCode(''); }
    } catch { setPageError('Failed to delete'); }
  };

  const handleCopyCode = () => {
    const codeToCopy = getActiveCode();
    if (!codeToCopy) return;
    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Composite code generation
  const compositeCode = useMemo(() => {
    if (strategies.length === 0) {
      return '// ===== COMPOSITE MODEL =====\n// No strategies yet. Generate individual strategies to build the composite.\n// Each strategy you generate will appear as a separate tab.\n// The composite code will auto-update as you add strategies.\n';
    }

    const lines: string[] = [];
    lines.push('// ===== COMPOSITE MODEL =====');
    lines.push(`// Auto-generated from ${strategies.length} ${strategies.length === 1 ? 'strategy' : 'strategies'}`);
    lines.push(`// Generated: ${new Date().toLocaleDateString()}`);
    lines.push('');
    lines.push('// ----- Include Individual Strategy Signals -----');
    lines.push('');

    strategies.forEach((s, i) => {
      lines.push(`// --- ${s.name}${s.strategyType ? ` (${s.strategyType})` : ''} ---`);
      lines.push(`StaticVarSet("Buy_${i + 1}", Nz(StaticVarGet("Buy_${i + 1}")));`);
      lines.push(`StaticVarSet("Sell_${i + 1}", Nz(StaticVarGet("Sell_${i + 1}")));`);
      lines.push(`StaticVarSet("Short_${i + 1}", Nz(StaticVarGet("Short_${i + 1}")));`);
      lines.push(`StaticVarSet("Cover_${i + 1}", Nz(StaticVarGet("Cover_${i + 1}")));`);
      lines.push('');
    });

    lines.push('// ----- Composite Scoring (Majority Voting) -----');
    lines.push('CompositeBuy = 0;');
    lines.push('CompositeSell = 0;');
    lines.push('CompositeShort = 0;');
    lines.push('CompositeCover = 0;');
    lines.push('');

    strategies.forEach((_, i) => {
      lines.push(`CompositeBuy += Nz(StaticVarGet("Buy_${i + 1}"));`);
      lines.push(`CompositeSell += Nz(StaticVarGet("Sell_${i + 1}"));`);
      lines.push(`CompositeShort += Nz(StaticVarGet("Short_${i + 1}"));`);
      lines.push(`CompositeCover += Nz(StaticVarGet("Cover_${i + 1}"));`);
    });

    lines.push('');
    const threshold = Math.max(1, Math.ceil(strategies.length / 2));
    lines.push(`Threshold = ${threshold}; // Majority voting (${threshold} of ${strategies.length})`);
    lines.push('');
    lines.push('Buy = CompositeBuy >= Threshold;');
    lines.push('Sell = CompositeSell >= Threshold;');
    lines.push('Short = CompositeShort >= Threshold;');
    lines.push('Cover = CompositeCover >= Threshold;');
    lines.push('');
    lines.push('// ----- Execution -----');
    lines.push('Buy = ExRem(Buy, Sell);');
    lines.push('Sell = ExRem(Sell, Buy);');
    lines.push('Short = ExRem(Short, Cover);');
    lines.push('Cover = ExRem(Cover, Short);');

    return lines.join('\n');
  }, [strategies]);

  const getActiveCode = useCallback(() => {
    if (!compositeMode) return generatedCode;
    if (activeTab === 'composite') return compositeCode;
    return strategies.find(s => s.id === activeTab)?.code || '';
  }, [compositeMode, generatedCode, activeTab, compositeCode, strategies]);

  const handleRemoveStrategy = useCallback((id: string) => {
    setStrategies(prev => prev.filter(s => s.id !== id));
    if (activeTab === id) setActiveTab('composite');
  }, [activeTab]);

  const handleDownloadCode = () => {
    const codeToDownload = getActiveCode();
    const fileName = compositeMode
      ? (activeTab === 'composite' ? 'composite_strategy.afl' : `${strategies.find(s => s.id === activeTab)?.name?.replace(/\s+/g, '_').toLowerCase() || 'strategy'}.afl`)
      : 'strategy.afl';
    const blob = new Blob([codeToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('AFL file downloaded');
  };

  const handleCopyMessage = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied!')).catch(() => toast.error('Copy failed'));
  }, []);

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
              <span className="font-medium" style={{ color: colors.textMuted }}>{userName}</span>
              {message.createdAt && <span style={{ color: colors.textSubtle }}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
            </>
          ) : (
            <>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                borderRadius: '6px', 
                overflow: 'hidden',
                backgroundColor: colors.primaryBlue + '15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img src={logo} alt="Yang AI" style={{ width: '16px', height: '16px' }} />
              </div>
              <span className="font-semibold" style={{ color: colors.text }}>Yang</span>
              {message.createdAt && <span style={{ color: colors.textSubtle }}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
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
                  const tStatus = tp.state === 'output-available' ? 'complete' : tp.state === 'output-error' ? 'complete' : 'active';
                  return (
                    <ChainOfThoughtStep key={`cot-${tIdx}`} label={tName.replace(/_/g, ' ')} status={tStatus} description={tp.state === 'output-available' ? 'Completed' : tp.state === 'output-error' ? 'Error' : 'Running...'} />
                  );
                })}
              </ChainOfThoughtContent>
            </ChainOfThought>
          )}

          {parts.map((part: any, pIdx: number) => {
            switch (part.type) {
              case 'text':
                if (!part.text) return null;
                if (message.role === 'assistant') {
                  const strippedText = !msgIsStreaming ? stripReactCodeBlocks(part.text) : part.text;
                  return (
                    <React.Fragment key={pIdx}>
                      {strippedText.trim() && <MessageResponse>{strippedText}</MessageResponse>}
                      {!msgIsStreaming && <InlineReactPreview text={part.text} isDark={isDark} />}
                    </React.Fragment>
                  );
                }
                return (
                  <p key={pIdx} className="whitespace-pre-wrap break-words text-sm leading-relaxed" style={{ color: colors.text, fontWeight: 400 }}>
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
                // Use centralized tool registry for all other tools including invoke_skill
                if (part.type?.startsWith('tool-') || part.type === 'dynamic-tool' || part.type === 'tool-invocation') {
                  return renderToolPart(part, pIdx, message.id, conversationIdRef.current);
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
            <MessageAction tooltip="Not helpful" onClick={() => { setShowFeedbackModal(true); }}>
              <ThumbsDownIcon className="size-3.5" />
            </MessageAction>
          </MessageActions>
        )}
      </AIMessage>
    );
  }, [lastIdxRef, isStreamingRef, userName, logo, isDark, colors, handleCopyMessage, setShowFeedbackModal, status, stripReactCodeBlocks]);

  // RENDER
  return (
    <div style={{ height: '100%', backgroundColor: colors.background, display: 'flex', overflow: 'hidden', position: 'relative' }}>
      {/* SIDEBAR */}
      <div style={{ 
        width: sidebarCollapsed ? '0px' : '280px', 
        backgroundColor: 'rgba(13, 13, 16, 0.6)', 
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: sidebarCollapsed ? 'none' : `1px solid ${colors.border}`, 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        overflow: 'hidden', 
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)', 
        flexShrink: 0,
        boxShadow: sidebarCollapsed ? 'none' : isDark ? '2px 0 12px rgba(0,0,0,0.3)' : '2px 0 12px rgba(0,0,0,0.04)'
      }}>
        {/* Sidebar Header */}
        <div style={{ 
          padding: '20px', 
          borderBottom: `1px solid ${colors.border}`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: isDark 
            ? 'linear-gradient(135deg, var(--accent-dim) 0%, transparent 100%)'
            : 'linear-gradient(135deg, var(--accent-dim) 0%, transparent 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Glow color={colors.primaryBlue}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 0.68, 0, 1.15] }}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: `linear-gradient(135deg, ${colors.primaryBlue} 0%, ${colors.primaryBlueHover} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px var(--accent-glow)'
                }}
              >
                <Code2 size={18} color="#1A1A1A" strokeWidth={2.5} />
              </motion.div>
            </Glow>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ 
                  fontFamily: "'Syne', sans-serif", 
                  fontSize: '13px', 
                  fontWeight: 700, 
                  color: colors.text, 
                  margin: 0, 
                  letterSpacing: '1px', 
                  textTransform: 'uppercase' 
                }}>AFL Generator</h2>
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  style={{
                    fontSize: '8px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                    color: '#A78BFA',
                    letterSpacing: '0.5px',
                    fontFamily: "'DM Mono', monospace",
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                  }}
                >
                  SKILL
                </motion.span>
              </div>
              <p style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '10px',
                color: colors.textMuted,
                margin: 0,
                letterSpacing: '0.3px'
              }}>AmiBroker Strategies</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarCollapsed(true)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '6px',
              borderRadius: '6px',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.hoverBg}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ChevronLeft size={16} color={colors.textMuted} />
          </button>
        </div>

        {/* New Chat + Search */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <motion.button 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            whileHover={streamMessages.length > 0 ? { scale: 1.02, y: -2 } : {}}
            whileTap={streamMessages.length > 0 ? { scale: 0.98 } : {}}
            onClick={handleNewConversation}
            disabled={streamMessages.length === 0}
            title={streamMessages.length === 0 ? 'Current conversation is empty' : 'Start a new strategy'}
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: streamMessages.length === 0
                ? `linear-gradient(135deg, var(--accent-glow) 0%, var(--accent-dim) 100%)`
                : `linear-gradient(135deg, ${colors.primaryBlue} 0%, ${colors.primaryBlueHover} 100%)`, 
              border: 'none', 
              borderRadius: '10px', 
              cursor: streamMessages.length === 0 ? 'not-allowed' : 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px', 
              fontWeight: 700, 
              color: streamMessages.length === 0 ? 'rgba(26, 26, 26, 0.5)' : colors.darkGray, 
              fontFamily: "'Inter', system-ui, sans-serif", 
              fontSize: '13px', 
              boxShadow: streamMessages.length === 0 ? 'none' : '0 2px 8px var(--accent-glow)',
              letterSpacing: '0.3px',
              opacity: streamMessages.length === 0 ? 0.7 : 1
            }} 
          >
            <Plus size={18} strokeWidth={2.5} /> New Strategy
          </motion.button>
          <div style={{ position: 'relative' }}>
            <Search size={14} color={colors.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search strategies..."
              style={{ 
                width: '100%', 
                padding: '10px 12px 10px 36px', 
                backgroundColor: colors.inputBg, 
                border: `1px solid ${colors.border}`, 
                borderRadius: '8px', 
                color: colors.text, 
                fontSize: '12px', 
                outline: 'none', 
                boxSizing: 'border-box', 
                fontFamily: "'Inter', system-ui, sans-serif", 
                transition: 'all 0.2s ease' 
              }}
                onFocus={(e) => { 
                e.currentTarget.style.borderColor = colors.primaryBlue; 
                e.currentTarget.style.backgroundColor = isDark ? '#1F1F1F' : '#FFFFFF';
              }}
              onBlur={(e) => { 
                e.currentTarget.style.borderColor = colors.border; 
                e.currentTarget.style.backgroundColor = colors.inputBg;
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                style={{ 
                  position: 'absolute', 
                  right: '10px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.hoverBg}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={12} color={colors.textMuted} />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px', minHeight: 0 }}>
          {loadingConversations ? (
            <div className="space-y-3 px-2 py-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2">
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '8px', 
                    backgroundColor: colors.inputBg,
                    animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      height: '14px', 
                      backgroundColor: colors.inputBg, 
                      borderRadius: '4px',
                      width: '80%',
                      marginBottom: '6px',
                      animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }} />
                    <div style={{ 
                      height: '10px', 
                      backgroundColor: colors.inputBg, 
                      borderRadius: '3px',
                      width: '50%',
                      animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (() => {
            const filtered = searchQuery.trim()
              ? conversations.filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()))
              : conversations;
            if (filtered.length === 0 && searchQuery.trim()) {
              return (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px 20px', 
                  color: colors.textMuted, 
                  fontSize: '12px',
                  fontFamily: "'Inter', system-ui, sans-serif"
                }}>
                  No strategies matching "{searchQuery}"
                </div>
              );
            }
            if (filtered.length === 0) {
              return (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px 20px', 
                  color: colors.textMuted, 
                  fontSize: '12px',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  lineHeight: 1.6
                }}>
                  No strategies yet.<br/>Click "New Strategy" to begin
                </div>
              );
            }
            return (
              <AnimatePresence mode="popLayout">
                {filtered.map((conv, index) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.03,
                  ease: [0.22, 0.68, 0, 1.15] 
                }}
                whileHover={{ x: 4 }}
                onClick={() => { if (renamingId !== conv.id) setSelectedConversation(conv); }} 
                style={{ 
                  padding: '12px', 
                  marginBottom: '6px', 
                  backgroundColor: selectedConversation?.id === conv.id ? colors.activeBg : 'transparent', 
                  border: selectedConversation?.id === conv.id ? `1px solid ${colors.primaryBlue}` : '1px solid transparent', 
                  borderRadius: '10px', 
                  cursor: 'pointer', 
                  color: colors.text, 
                  fontSize: '13px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  fontFamily: "'Inter', system-ui, sans-serif", 
                  transition: 'background-color 0.2s ease, border-color 0.2s ease',
                  position: 'relative'
                }} 
                onMouseOver={(e) => {
                  if (selectedConversation?.id !== conv.id) {
                    e.currentTarget.style.backgroundColor = colors.hoverBg;
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedConversation?.id !== conv.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: selectedConversation?.id === conv.id 
                    ? colors.primaryBlue + '20'
                    : colors.inputBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}>
                  <Code2 
                    size={16} 
                    color={selectedConversation?.id === conv.id ? colors.primaryBlue : colors.textMuted}
                    strokeWidth={2}
                  />
                </div>
                {renamingId === conv.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const newTitle = renameValue || conv.title;
                        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, title: newTitle } : c));
                        if (selectedConversation?.id === conv.id) setSelectedConversation({ ...conv, title: newTitle });
                        setRenamingId(null);
                        apiClient.renameConversation(conv.id, newTitle).then(() => toast.success('Renamed')).catch(() => toast.error('Failed to rename'));
                      }
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    onBlur={() => {
                      const newTitle = renameValue || conv.title;
                      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, title: newTitle } : c));
                      if (selectedConversation?.id === conv.id) setSelectedConversation({ ...conv, title: newTitle });
                      setRenamingId(null);
                      apiClient.renameConversation(conv.id, newTitle).catch(() => {});
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ 
                      flex: 1, 
                      background: colors.inputBg, 
                      border: `2px solid ${colors.primaryBlue}`, 
                      borderRadius: '6px', 
                      color: colors.text, 
                      fontSize: '13px', 
                      padding: '6px 8px', 
                      outline: 'none', 
                      minWidth: 0, 
                      fontFamily: "'Inter', system-ui, sans-serif" 
                    }}
                  />
                ) : (
                  <>
                    <span style={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap', 
                      flex: 1, 
                      fontWeight: selectedConversation?.id === conv.id ? 600 : 400,
                      color: selectedConversation?.id === conv.id ? colors.text : colors.textMuted
                    }}>
                      {conv.title}
                    </span>
                    <div className="conversation-actions" style={{ 
                      display: 'flex', 
                      gap: '4px', 
                      opacity: 0,
                      transition: 'opacity 0.2s ease'
                    }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setRenamingId(conv.id); setRenameValue(conv.title || ''); }} 
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          padding: '4px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background-color 0.2s'
                        }} 
                        title="Rename"
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.hoverBg}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Pencil size={12} color={colors.textMuted} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }} 
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          padding: '4px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background-color 0.2s'
                        }} 
                        title="Delete"
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                          e.currentTarget.querySelector('svg')?.setAttribute('stroke', '#DC2626');
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.querySelector('svg')?.setAttribute('stroke', colors.textMuted);
                        }}
                      >
                        <Trash2 size={12} color={colors.textMuted} />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
              </AnimatePresence>
            );
          })()}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', height: '100%' }}>
        {/* Collapsed sidebar toggle */}
        {sidebarCollapsed && (
          <button 
            onClick={() => setSidebarCollapsed(false)} 
            style={{ 
              position: 'absolute', 
              top: '20px', 
              left: '20px', 
              zIndex: 100, 
              background: colors.cardBg, 
              border: `1px solid ${colors.border}`, 
              borderRadius: '10px', 
              padding: '10px', 
              cursor: 'pointer',
              boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.08)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = colors.primaryBlue;
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <ChevronRight size={18} color={colors.primaryBlue} strokeWidth={2.5} />
          </button>
        )}

        {/* Top toolbar */}
        <div style={{ 
          padding: '12px 20px', 
          borderBottom: `1px solid ${colors.border}`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          backgroundColor: colors.background, 
          flexShrink: 0 
        }}>
          {/* Strategy Type Label - Standalone only */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              fontSize: '11px', 
              color: colors.textMuted, 
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>Strategy</span>
            <span
              style={{
                padding: '6px 14px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '8px',
                border: `1.5px solid ${colors.primaryBlue}`,
                backgroundColor: colors.activeBg,
                color: colors.primaryBlue,
                fontFamily: "'Inter', system-ui, sans-serif",
                letterSpacing: '0.3px'
              }}
            >
              Standalone
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Composite Model Toggle */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: compositeMode ? colors.activeBg : 'transparent',
              border: `1px solid ${compositeMode ? colors.primaryBlue : colors.border}`,
              transition: 'all 0.2s ease'
            }}>
              <Switch
                checked={compositeMode}
                onCheckedChange={(checked) => {
                  setCompositeMode(checked);
                  if (checked && !codePanelOpen && !isMobile) setCodePanelOpen(true);
                }}
                className="data-[state=checked]:bg-[#FEC00F]"
                style={{ 
                  width: '32px', 
                  height: '18px',
                  '--switch-thumb-size': '14px'
                } as any}
              />
              <Layers size={14} color={compositeMode ? colors.primaryBlue : colors.textMuted} strokeWidth={2} />
              <span style={{
                fontSize: '11px',
                color: compositeMode ? colors.primaryBlue : colors.textMuted,
                fontWeight: compositeMode ? 600 : 500,
                fontFamily: "'Inter', system-ui, sans-serif",
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                letterSpacing: '0.3px'
              }}>
                Composite Mode
              </span>
            </div>

            <div style={{ width: '1px', height: '20px', backgroundColor: colors.border }} />

            <button
              onClick={() => setCodePanelOpen(!codePanelOpen)}
              style={{ 
                background: codePanelOpen ? colors.activeBg : 'transparent', 
                border: `1px solid ${codePanelOpen ? colors.primaryBlue : colors.border}`, 
                borderRadius: '8px', 
                padding: '6px 12px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                color: codePanelOpen ? colors.primaryBlue : colors.textMuted, 
                fontSize: '11px', 
                fontFamily: "'Inter', system-ui, sans-serif", 
                transition: 'all 0.2s ease',
                fontWeight: 600,
                letterSpacing: '0.3px'
              }}
              title={codePanelOpen ? 'Hide code panel' : 'Show code panel'}
              onMouseOver={(e) => {
                if (!codePanelOpen) {
                  e.currentTarget.style.backgroundColor = colors.hoverBg;
                  e.currentTarget.style.borderColor = colors.primaryBlue + '80';
                }
              }}
              onMouseOut={(e) => {
                if (!codePanelOpen) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = colors.border;
                }
              }}
            >
              {codePanelOpen ? <PanelRightClose size={14} strokeWidth={2} /> : <PanelRightOpen size={14} strokeWidth={2} />}
              <span>Code Panel</span>
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1" style={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div data-scroll-container style={{ 
            flex: 1, 
            overflowY: 'auto', 
            overflowX: 'hidden', 
            WebkitOverflowScrolling: 'touch', 
            overscrollBehavior: 'contain', 
            backgroundColor: colors.background, 
            color: colors.text 
          } as React.CSSProperties}>
            <div className="max-w-[900px] mx-auto px-6 py-8" style={{ color: colors.text }}>
              {allMessages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 0.68, 0, 1.15] }}
                >
                <ConversationEmptyState
                  icon={
                  <Glow color={colors.primaryBlue}>
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 0.68, 0, 1.15] }}
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '20px',
                        background: `linear-gradient(135deg, ${colors.primaryBlue}20 0%, ${colors.primaryBlue}10 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '8px'
                      }}
                    >
                      <Code2 size={40} color={colors.primaryBlue} strokeWidth={2} />
                    </motion.div>
                  </Glow>
                  }
                  title="AFL Code Generator"
                  description="Generate, debug, and optimize AmiBroker Formula Language strategies with AI assistance"
                >
                  <div className="flex flex-col items-center gap-6" style={{ padding: '20px', maxWidth: '600px' }}>
                    <div className="space-y-2 text-center">
                      <h3 style={{ 
                        fontFamily: "'Syne', sans-serif", 
                        fontSize: '24px', 
                        fontWeight: 700, 
                        color: colors.text, 
                        margin: '8px 0', 
                        letterSpacing: '0.5px' 
                      }}>
                        Build Professional Trading Strategies
                      </h3>
                      <p style={{ 
                        fontFamily: "'Inter', system-ui, sans-serif", 
                        fontSize: '14px', 
                        color: colors.textMuted, 
                        margin: '4px 0', 
                        lineHeight: 1.6
                      }}>
                        Describe your trading strategy in plain English and receive optimized AFL code with proper risk management, backtesting settings, and validation.
                      </p>
                    </div>
                    <Suggestions className="justify-center mt-4">
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
                          transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                        >
                          <Suggestion suggestion={suggestion} onClick={(s: string) => setInput(s)} />
                        </motion.div>
                      ))}
                    </Suggestions>
                    <p className="text-xs mt-2" style={{ color: colors.textSubtle }}>
                      Click a suggestion or describe your strategy below
                    </p>
                  </div>
                </ConversationEmptyState>
                </motion.div>
              ) : (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-6"
                  >
                    {allMessages.map((msg, idx) => renderMessage(msg, idx))}
                  </motion.div>

                  {status === 'submitted' && allMessages.length > 0 && allMessages[allMessages.length - 1]?.role === 'user' && (
                    <AIMessage from="assistant">
                      <div className="flex items-center gap-2 text-xs mb-2">
                        <div style={{ 
                          width: '20px', 
                          height: '20px', 
                          borderRadius: '6px', 
                          overflow: 'hidden',
                          backgroundColor: colors.primaryBlue + '15',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <img src={logo} alt="Yang AI" style={{ width: '16px', height: '16px' }} />
                        </div>
                        <span className="font-semibold" style={{ color: colors.text }}>Yang</span>
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
        </div>

        {/* Error banner */}
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
            fontFamily: "'Inter', system-ui, sans-serif"
          }}>
            <span>{pageError || chatError?.message || 'An error occurred'}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => regenerate()} 
                style={{
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
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <RefreshCw size={12} /> Retry
              </button>
              <button 
                onClick={() => setPageError('')} 
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#DC2626',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '0 8px',
                  fontWeight: 700
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* PromptInput */}
        <div style={{ 
          flexShrink: 0, 
          borderTop: `1px solid ${colors.border}`, 
          background: isDark 
            ? 'linear-gradient(to top, rgba(254, 192, 15, 0.02) 0%, transparent 100%)'
            : 'linear-gradient(to top, rgba(254, 192, 15, 0.03) 0%, transparent 100%)',
          transition: 'all 0.2s ease' 
        }}>
          <div className="max-w-[900px] mx-auto px-6 py-5">
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
                  if ((!text.trim() && files.length === 0) || isStreaming) return;
                  setInput('');
                  setPageError('');

                  let convId = selectedConversation?.id || conversationIdRef.current;
                  if (!convId) {
                    try {
                      skipNextLoadRef.current = true;
                      const convTitle = text.trim().replace(/\[AFL Generator Context:.*?\]\s*/s, '').slice(0, 50).trim() || 'New Strategy';
                      const conv = await apiClient.createConversation(convTitle, 'afl');
                      setConversations(prev => [conv, ...prev]);
                      setSelectedConversation(conv);
                      conversationIdRef.current = conv.id;
                      convId = conv.id;
                    } catch { setPageError('Failed to create conversation'); return; }
                  } else if (selectedConversation?.title === 'New Strategy' && streamMessages.length === 0 && text.trim()) {
                    // Auto-rename conversation on first message if it was created with default title
                    const newTitle = text.trim().replace(/\[AFL Generator Context:.*?\]\s*/s, '').slice(0, 50).trim();
                    if (newTitle && newTitle !== 'New Strategy') {
                      setConversations(prev => prev.map(c => c.id === convId ? { ...c, title: newTitle } : c));
                      setSelectedConversation(prev => prev ? { ...prev, title: newTitle } : prev);
                      apiClient.renameConversation(convId, newTitle).catch(() => {});
                    }
                  }

                  let messageText = text;
                  if (files.length > 0) {
                    const token = getAuthToken();
                    const uploaded: string[] = [];
                    for (const file of files) {
                      const fileName = file.filename || 'upload';
                      try {
                        let actualFile: File;
                        if (file.url?.startsWith('blob:')) {
                          const blob = await fetch(file.url).then(r => r.blob());
                          actualFile = new File([blob], fileName, { type: file.mediaType || 'application/octet-stream' });
                        } else if (file.url?.startsWith('data:')) {
                          const resp = await fetch(file.url);
                          const blob = await resp.blob();
                          actualFile = new File([blob], fileName, { type: file.mediaType || blob.type || 'application/octet-stream' });
                        } else if (file.url) {
                          const resp = await fetch(file.url);
                          const blob = await resp.blob();
                          actualFile = new File([blob], fileName, { type: file.mediaType || blob.type || 'application/octet-stream' });
                        } else { continue; }

                        const toastId = toast.loading(`Uploading ${fileName}...`);
                        const formData = new FormData();
                        formData.append('file', actualFile);
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 30000);
                        const resp = await fetch(`/api/upload?conversationId=${convId}`, {
                          method: 'POST',
                          headers: { 'Authorization': token ? `Bearer ${token}` : '' },
                          body: formData,
                          signal: controller.signal,
                        });
                        clearTimeout(timeoutId);
                        if (!resp.ok) {
                          const errorData = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
                          throw new Error(errorData.error || `Upload failed with status ${resp.status}`);
                        }
                        uploaded.push(fileName);
                        toast.success(`Uploaded ${fileName}`, { id: toastId });
                      } catch (err) {
                        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                        toast.error(`Failed to upload ${fileName}: ${errorMsg}`);
                      }
                    }
                    if (uploaded.length > 0) {
                      const fileList = uploaded.map(f => `[file: ${f}]`).join('\n');
                      messageText = text.trim() ? `${text}\n\n${fileList}` : fileList;
                    }
                  }

                  const contextPrefix = `[AFL Generator Context: strategy_type=${strategyType}, initial_equity=${backtestSettings.initial_equity}, max_positions=${backtestSettings.max_positions}, commission=${backtestSettings.commission}]\n\n`;
                  sendMessage({ text: contextPrefix + messageText }, { 
                    body: { 
                      conversationId: convId,
                      backtest_settings: backtestSettings,
                    } 
                  });
                }}
              >
                <AttachmentsDisplay isDark={isDark} />
                <PromptInputTextarea
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                  placeholder={isStreaming ? 'Generating AFL code...' : 'Describe your trading strategy or paste AFL code to analyze...'}
                  disabled={status !== 'ready' && status !== 'error'}
                />
                <PromptInputFooter>
                  <PromptInputTools>
                    <AttachmentButton disabled={isStreaming} />
                  </PromptInputTools>
                  <PromptInputSubmit
                    status={status}
                    onStop={() => stop()}
                    disabled={!input.trim() && !isStreaming}
                  />
                </PromptInputFooter>
              </PromptInput>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* CODE PANEL */}
      <AnimatePresence>
      {codePanelOpen && (() => {
        const activeCode = getActiveCode();
        const hasCode = compositeMode ? (strategies.length > 0 || activeTab === 'composite') : !!generatedCode;
        const isCompositeTab = compositeMode && activeTab === 'composite';

        return (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 0.68, 0, 1.15] }}
          style={{ 
            width: isMobile ? '100%' : '480px', 
            backgroundColor: colors.codePanelBg, 
            borderLeft: `1px solid ${colors.border}`, 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            flexShrink: 0, 
            position: isMobile ? 'absolute' : 'relative', 
            right: 0, 
            top: 0, 
            zIndex: isMobile ? 200 : 1,
            boxShadow: isDark ? '-2px 0 12px rgba(0,0,0,0.3)' : '-2px 0 12px rgba(0,0,0,0.04)'
          }}
        >
          {/* Panel Header */}
          <div style={{ 
            padding: '16px 20px', 
            borderBottom: `1px solid ${colors.border}`, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            background: isDark 
              ? 'linear-gradient(135deg, var(--accent-dim) 0%, transparent 100%)'
              : 'linear-gradient(135deg, var(--accent-dim) 0%, transparent 100%)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Pulse>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: colors.primaryBlue + '20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {compositeMode ? (
                    <Layers size={16} color={colors.primaryBlue} strokeWidth={2.5} />
                  ) : (
                    <Code2 size={16} color={colors.primaryBlue} strokeWidth={2.5} />
                  )}
                </motion.div>
              </Pulse>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ 
                    fontFamily: "'Syne', sans-serif", 
                    fontSize: '13px', 
                    fontWeight: 700, 
                    color: colors.text, 
                    margin: 0, 
                    letterSpacing: '0.5px', 
                    textTransform: 'uppercase' 
                  }}>
                    {compositeMode ? 'Composite' : 'AFL Code'}
                  </h3>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    style={{
                      fontSize: '8px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(139, 92, 246, 0.15)',
                      color: '#A78BFA',
                      letterSpacing: '0.5px',
                      fontFamily: "'DM Mono', monospace",
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    SKILL
                  </motion.span>
                </div>
                {compositeMode ? (
                  <span style={{ 
                    fontSize: '10px', 
                    color: colors.textMuted, 
                    fontFamily: "'Inter', system-ui, sans-serif" 
                  }}>
                    {strategies.length} {strategies.length === 1 ? 'strategy' : 'strategies'}
                  </span>
                ) : (
                  <span style={{ 
                    fontSize: '10px', 
                    color: colors.textMuted, 
                    fontFamily: "'Inter', system-ui, sans-serif",
                    textTransform: 'capitalize'
                  }}>
                    {strategyType} Strategy
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button 
                onClick={() => setShowSettings(!showSettings)} 
                style={{ 
                  background: showSettings ? colors.activeBg : 'transparent',
                  border: `1px solid ${showSettings ? colors.primaryBlue : 'transparent'}`, 
                  cursor: 'pointer', 
                  padding: '8px', 
                  borderRadius: '8px', 
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }} 
                title="Backtest settings"
                onMouseOver={(e) => {
                  if (!showSettings) e.currentTarget.style.backgroundColor = colors.hoverBg;
                }}
                onMouseOut={(e) => {
                  if (!showSettings) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Settings2 size={14} color={showSettings ? colors.primaryBlue : colors.textMuted} strokeWidth={2} />
              </button>
              <button 
                onClick={handleCopyCode} 
                disabled={!activeCode} 
                style={{ 
                  background: copied ? colors.activeBg : 'transparent',
                  border: `1px solid ${copied ? colors.primaryBlue : 'transparent'}`,
                  cursor: activeCode ? 'pointer' : 'default', 
                  padding: '8px', 
                  borderRadius: '8px', 
                  opacity: activeCode ? 1 : 0.3,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }} 
                title="Copy code"
                onMouseOver={(e) => {
                  if (activeCode && !copied) e.currentTarget.style.backgroundColor = colors.hoverBg;
                }}
                onMouseOut={(e) => {
                  if (!copied) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {copied ? (
                  <Check size={14} color={colors.primaryBlue} strokeWidth={2} />
                ) : (
                  <CopyIcon size={14} color={colors.textMuted} strokeWidth={2} />
                )}
              </button>
              <button 
                onClick={handleDownloadCode} 
                disabled={!activeCode} 
                style={{ 
                  background: 'transparent',
                  border: '1px solid transparent',
                  cursor: activeCode ? 'pointer' : 'default', 
                  padding: '8px', 
                  borderRadius: '8px', 
                  opacity: activeCode ? 1 : 0.3,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }} 
                title="Download .afl"
                onMouseOver={(e) => {
                  if (activeCode) e.currentTarget.style.backgroundColor = colors.hoverBg;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Download size={14} color={colors.textMuted} strokeWidth={2} />
              </button>
              <div style={{ width: '1px', height: '16px', backgroundColor: colors.border, margin: '0 4px' }} />
              <button 
                onClick={() => setCodePanelOpen(false)} 
                style={{ 
                  background: 'transparent',
                  border: '1px solid transparent',
                  cursor: 'pointer', 
                  padding: '8px', 
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }} 
                title="Close panel"
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                  e.currentTarget.querySelector('svg')?.setAttribute('stroke', '#DC2626');
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.querySelector('svg')?.setAttribute('stroke', colors.textMuted);
                }}
              >
                <X size={14} color={colors.textMuted} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Composite Tab Bar */}
          {compositeMode && (
            <div style={{ 
              borderBottom: `1px solid ${colors.border}`, 
              backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' 
            }}>
              <ScrollArea className="w-full">
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', padding: '12px 16px 0', minWidth: 'max-content' }}>
                  {/* Composite tab */}
                  <button
                    onClick={() => setActiveTab('composite')}
                    style={{
                      padding: '8px 16px',
                      fontSize: '11px',
                      fontWeight: activeTab === 'composite' ? 700 : 500,
                      borderRadius: '8px 8px 0 0',
                      border: activeTab === 'composite' ? `1px solid ${colors.primaryBlue}` : `1px solid transparent`,
                      borderBottom: 'none',
                      backgroundColor: activeTab === 'composite' ? colors.activeBg : 'transparent',
                      color: activeTab === 'composite' ? colors.primaryBlue : colors.textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontFamily: "'Inter', system-ui, sans-serif",
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.3px'
                    }}
                    onMouseOver={(e) => {
                      if (activeTab !== 'composite') {
                        e.currentTarget.style.backgroundColor = colors.hoverBg;
                      }
                    }}
                    onMouseOut={(e) => {
                      if (activeTab !== 'composite') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <Layers size={12} strokeWidth={2} />
                    Composite
                    {strategies.length > 0 && (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        backgroundColor: colors.primaryBlue,
                        color: colors.darkGray,
                        borderRadius: '6px',
                        padding: '2px 6px',
                        lineHeight: '14px',
                        minWidth: '18px',
                        textAlign: 'center',
                      }}>
                        {strategies.length}
                      </span>
                    )}
                  </button>

                  {/* Individual strategy tabs */}
                  {strategies.map((strategy) => (
                    <button
                      key={strategy.id}
                      onClick={() => setActiveTab(strategy.id)}
                      style={{
                        padding: '8px 12px',
                        fontSize: '11px',
                        fontWeight: activeTab === strategy.id ? 600 : 500,
                        borderRadius: '8px 8px 0 0',
                        border: activeTab === strategy.id ? `1px solid ${colors.border}` : `1px solid transparent`,
                        borderBottom: 'none',
                        backgroundColor: activeTab === strategy.id ? (isDark ? '#1A1A1A' : '#FFFFFF') : 'transparent',
                        color: activeTab === strategy.id ? colors.text : colors.textMuted,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontFamily: "'Inter', system-ui, sans-serif",
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.3px'
                      }}
                      onMouseOver={(e) => {
                        if (activeTab !== strategy.id) {
                          e.currentTarget.style.backgroundColor = colors.hoverBg;
                        }
                      }}
                      onMouseOut={(e) => {
                        if (activeTab !== strategy.id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <Code2 size={11} strokeWidth={2} />
                      <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {strategy.name}
                      </span>
                      {strategy.strategyType && (
                        <span style={{ fontSize: '9px', opacity: 0.6, textTransform: 'uppercase' }}>
                          {strategy.strategyType.slice(0, 4)}
                        </span>
                      )}
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveStrategy(strategy.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') { 
                            e.stopPropagation(); 
                            handleRemoveStrategy(strategy.id); 
                          }
                        }}
                        style={{
                          opacity: 0.4,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '3px',
                          borderRadius: '4px',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseOver={(e) => { 
                          e.currentTarget.style.opacity = '1'; 
                          e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.15)'; 
                        }}
                        onMouseOut={(e) => { 
                          e.currentTarget.style.opacity = '0.4'; 
                          e.currentTarget.style.backgroundColor = 'transparent'; 
                        }}
                      >
                        <X size={11} strokeWidth={2} />
                      </span>
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {/* Backtest Settings */}
          {showSettings && (
            <div style={{ 
              padding: '16px 20px', 
              borderBottom: `1px solid ${colors.border}`, 
              backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)' 
            }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Initial Equity', key: 'initial_equity', type: 'number' },
                  { label: 'Max Positions', key: 'max_positions', type: 'number' },
                  { label: 'Position Size', key: 'position_size', type: 'text' },
                  { label: 'Commission', key: 'commission', type: 'number' },
                  { label: 'Margin %', key: 'margin_requirement', type: 'number' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label style={{ 
                      fontSize: '10px', 
                      color: colors.textMuted, 
                      fontFamily: "'Inter', system-ui, sans-serif", 
                      fontWeight: 600, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '4px'
                    }}>
                      {label}
                    </label>
                    <input
                      type={type}
                      value={(backtestSettings as any)[key]}
                      onChange={(e) => setBacktestSettings(prev => ({ 
                        ...prev, 
                        [key]: type === 'number' ? Number(e.target.value) : e.target.value 
                      }))}
                      style={{ 
                        width: '100%', 
                        padding: '8px 10px', 
                        backgroundColor: colors.inputBg, 
                        border: `1px solid ${colors.border}`, 
                        borderRadius: '8px', 
                        color: colors.text, 
                        fontSize: '12px', 
                        outline: 'none', 
                        fontFamily: "'Inter', system-ui, sans-serif", 
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = colors.primaryBlue;
                        e.currentTarget.style.backgroundColor = isDark ? '#1F1F1F' : '#FFFFFF';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = colors.border;
                        e.currentTarget.style.backgroundColor = colors.inputBg;
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monaco Editor */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            {(compositeMode || generatedCode) ? (
              <>
                {isCompositeTab && strategies.length > 0 && (
                  <div style={{
                    padding: '8px 20px',
                    backgroundColor: isDark ? 'var(--accent-dim)' : 'var(--accent-dim)',
                    borderBottom: `1px solid ${colors.borderLight}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ 
                      fontSize: '10px', 
                      color: colors.textMuted, 
                      fontFamily: "'Inter', system-ui, sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Sparkles size={12} color={colors.primaryBlue} strokeWidth={2} />
                      Auto-generated template (read-only)
                    </span>
                  </div>
                )}
                <Editor
                  height="100%"
                  language="cpp"
                  theme={isDark ? 'vs-dark' : 'light'}
                  value={compositeMode ? activeCode : generatedCode}
                  onChange={(value) => {
                    if (compositeMode) {
                      if (activeTab !== 'composite') {
                        setStrategies(prev => prev.map(s => s.id === activeTab ? { ...s, code: value || '' } : s));
                      }
                    } else {
                      setGeneratedCode(value || '');
                    }
                  }}
                  onMount={(editor) => { editorRef.current = editor; }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    padding: { top: 20, bottom: 20 },
                    renderLineHighlight: 'line',
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                    fontLigatures: true,
                    readOnly: isCompositeTab,
                    lineHeight: 22,
                    letterSpacing: 0.3,
                  }}
                />
              </>
            ) : (
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '16px', 
                padding: '60px 40px' 
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: `linear-gradient(135deg, ${colors.primaryBlue}15 0%, ${colors.primaryBlue}08 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {compositeMode ? (
                    <Layers size={32} color={colors.textSubtle} strokeWidth={1.5} />
                  ) : (
                    <Code2 size={32} color={colors.textSubtle} strokeWidth={1.5} />
                  )}
                </div>
                <div className="text-center" style={{ maxWidth: '300px' }}>
                  <h4 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: '16px',
                    fontWeight: 700,
                    color: colors.text,
                    marginBottom: '8px',
                    letterSpacing: '0.3px'
                  }}>
                    {compositeMode ? 'No Strategies Yet' : 'Code Will Appear Here'}
                  </h4>
                  <p style={{ 
                    fontSize: '13px', 
                    color: colors.textMuted, 
                    textAlign: 'center', 
                    fontFamily: "'Inter', system-ui, sans-serif", 
                    lineHeight: 1.6,
                    margin: 0
                  }}>
                    {compositeMode
                      ? 'Generate individual strategies in the chat. Each will appear as a tab, and the composite code will combine them automatically.'
                      : 'Describe your trading strategy in the chat to generate optimized AFL code with backtesting settings.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Composite AI Merge Footer */}
          {compositeMode && isCompositeTab && strategies.length >= 2 && (
            <div style={{
              padding: '12px 20px',
              borderTop: `1px solid ${colors.border}`,
              backgroundColor: isDark ? 'var(--accent-dim)' : 'var(--accent-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <button
                onClick={() => {
                  const allCodes = strategies.map((s, i) => `### ${s.name}${s.strategyType ? ` (${s.strategyType})` : ''}:\n\`\`\`afl\n${s.code}\n\`\`\``).join('\n\n');
                  setInput(`Intelligently merge these ${strategies.length} individual AFL strategies into a single composite strategy. Use a proper voting/scoring system to combine their Buy/Sell/Short/Cover signals with appropriate weighting:\n\n${allCodes}`);
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: `1px solid ${colors.primaryBlue}`,
                  background: `linear-gradient(135deg, ${colors.primaryBlue}15 0%, ${colors.primaryBlue}08 100%)`,
                  color: colors.primaryBlue,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.3px'
                }}
                onMouseOver={(e) => { 
                  e.currentTarget.style.background = `linear-gradient(135deg, ${colors.primaryBlue}25 0%, ${colors.primaryBlue}15 100%)`;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => { 
                  e.currentTarget.style.background = `linear-gradient(135deg, ${colors.primaryBlue}15 0%, ${colors.primaryBlue}08 100%)`;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Sparkles size={13} strokeWidth={2} />
                AI Merge Strategies
              </button>
              <span style={{ 
                fontSize: '10px', 
                color: colors.textSubtle, 
                fontFamily: "'Inter', system-ui, sans-serif" 
              }}>
                or use auto-template above
              </span>
            </div>
          )}

          {/* Quick Actions */}
          {(() => {
            const codeForActions = compositeMode ? activeCode : generatedCode;
            if (!codeForActions) return null;
            if (compositeMode && isCompositeTab) return null;
            return (
              <div style={{ 
                padding: '12px 20px', 
                borderTop: `1px solid ${colors.border}`, 
                display: 'flex', 
                gap: '8px', 
                flexWrap: 'wrap',
                backgroundColor: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.015)'
              }}>
                {[
                  { label: 'Optimize', prompt: `Optimize this AFL code for better performance:\n\`\`\`afl\n${codeForActions}\n\`\`\`` },
                  { label: 'Debug', prompt: `Debug this AFL code and find potential issues:\n\`\`\`afl\n${codeForActions}\n\`\`\`` },
                  { label: 'Explain', prompt: `Explain this AFL code line by line:\n\`\`\`afl\n${codeForActions}\n\`\`\`` },
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
                      padding: '6px 14px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '8px',
                      border: `1px solid ${colors.border}`,
                      backgroundColor: 'transparent',
                      color: colors.textMuted,
                      cursor: 'pointer',
                      fontFamily: "'Inter', system-ui, sans-serif",
                      transition: 'all 0.2s ease',
                      letterSpacing: '0.3px'
                    }}
                    onMouseOver={(e) => { 
                      e.currentTarget.style.borderColor = colors.primaryBlue; 
                      e.currentTarget.style.color = colors.primaryBlue;
                      e.currentTarget.style.backgroundColor = colors.activeBg;
                    }}
                    onMouseOut={(e) => { 
                      e.currentTarget.style.borderColor = colors.border; 
                      e.currentTarget.style.color = colors.textMuted;
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            );
          })()}
        </motion.div>
        );
      })()}
      </AnimatePresence>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          generatedCode={getActiveCode() || generatedCode}
          conversationId={selectedConversation?.id}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        /* Show conversation actions on hover */
        div:hover > .conversation-actions {
          opacity: 1 !important;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: ${colors.background};
        }

        ::-webkit-scrollbar-thumb {
          background: ${colors.border};
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: ${colors.primaryBlue}40;
        }
      `}</style>
    </div>
  );
}

export default AFLGeneratorPage;

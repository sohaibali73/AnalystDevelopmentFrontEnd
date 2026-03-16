'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Plus, GitBranch, Trash2, ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, Pencil, X, CopyIcon, ThumbsUpIcon, ThumbsDownIcon, Download, Code2, PanelRightClose, PanelRightOpen, Settings2, ArrowUpFromLine } from 'lucide-react';
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

// Attachment components
function AttachmentsDisplay() {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) return null;
  return (
    <PromptInputHeader>
      <Attachments variant="grid">
        {attachments.files.map((file) => (
          <Attachment key={file.id} data={file} onRemove={() => attachments.remove(file.id)}>
            <AttachmentPreview />
            <AttachmentRemove />
          </Attachment>
        ))}
      </Attachments>
    </PromptInputHeader>
  );
}

function AttachmentButton({ disabled }: { disabled?: boolean }) {
  const attachments = usePromptInputAttachments();
  const handleClick = useCallback(() => {
    if (!disabled) attachments.openFileDialog();
  }, [attachments, disabled]);
  return (
    <PromptInputButton onClick={handleClick} disabled={disabled} tooltip="Attach files">
      <ArrowUpFromLine className="size-4" />
    </PromptInputButton>
  );
}

// Extract AFL code from messages
function extractAFLCode(text: string): string | null {
  const aflMatch = text.match(/```(?:afl|amibroker)\s*\n([\s\S]*?)```/i);
  if (aflMatch) return aflMatch[1].trim();
  const codeMatch = text.match(/```\w*\s*\n([\s\S]*?)```/);
  if (codeMatch) return codeMatch[1].trim();
  return null;
}

export function ReverseEngineerPage() {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const isDark = resolvedTheme === 'dark';

  // --- State ---
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
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);

  // Feedback
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Connection
  const { status: connStatus, check: recheckConnection } = useConnectionStatus({ interval: 60000 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string | null>(null);
  const skipNextLoadRef = useRef(false);
  const editorRef = useRef<any>(null);

  const getAuthToken = () => {
    try { return localStorage.getItem('auth_token') || ''; } catch { return ''; }
  };

  // --- Colors (matching ChatPage / AFL page) ---
  const colors = {
    background: isDark ? '#0F0F0F' : '#ffffff',
    sidebar: isDark ? '#1A1A1A' : '#ffffff',
    cardBg: isDark ? '#1A1A1A' : '#ffffff',
    inputBg: isDark ? '#262626' : '#f8f8f8',
    border: isDark ? '#333333' : '#e5e5e5',
    text: isDark ? '#E8E8E8' : '#1A1A1A',
    textMuted: isDark ? '#B0B0B0' : '#666666',
    primaryYellow: '#FEC00F',
    darkGray: '#212121',
    accentYellow: '#FFD700',
    codePanelBg: isDark ? '#141414' : '#fafafa',
  };

  // --- AI SDK useChat (same pattern as ChatPage / AFL) ---
  const { messages: streamMessages, sendMessage, status, stop, error: chatError, setMessages, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      headers: () => {
        const token = getAuthToken();
        return { 'Authorization': token ? `Bearer ${token}` : '' };
      },
      body: () => ({
        conversationId: conversationIdRef.current,
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

  // --- Auto-extract AFL code from assistant messages ---
  useEffect(() => {
    if (streamMessages.length === 0) return;
    for (let i = streamMessages.length - 1; i >= 0; i--) {
      const msg = streamMessages[i];
      if (msg.role !== 'assistant') continue;
      const parts = msg.parts || [];
      const fullText = parts.filter((p: any) => p.type === 'text').map((p: any) => p.text || '').join('');
      const code = extractAFLCode(fullText);
      if (code) {
        setGeneratedCode(code);
        if (!codePanelOpen && !isMobile) setCodePanelOpen(true);
        break;
      }
      for (const part of parts) {
        if (part.type === 'tool-generate_afl_code' && part.state === 'output-available' && (part as any).output?.code) {
          setGeneratedCode((part as any).output.code);
          if (!codePanelOpen && !isMobile) setCodePanelOpen(true);
          break;
        }
      }
      break;
    }
  }, [streamMessages, isMobile]);

  // --- Sync conversationIdRef ---
  useEffect(() => {
    conversationIdRef.current = selectedConversation?.id || null;
  }, [selectedConversation]);

  // --- Load conversations ---
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
      // Filter to reverse_engineer conversations
      const data = allData.filter((c: any) => c.conversation_type === 'reverse_engineer');
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
      const newConv = await apiClient.createConversation('Reverse Engineer', 'reverse_engineer');
      setConversations(prev => [newConv, ...prev]);
      setSelectedConversation(newConv);
      conversationIdRef.current = newConv.id;
      setMessages([]);
      setGeneratedCode('');
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
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reverse_engineered.afl';
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

  // --- Render message using AI Elements ---
  const renderMessage = (message: any, idx: number) => {
    const parts = message.parts || [];
    const isLast = idx === lastIdx;
    const msgIsStreaming = isStreaming && isLast && message.role === 'assistant';
    const fullText = parts.filter((p: any) => p.type === 'text').map((p: any) => p.text || '').join('');
    const toolParts = parts.filter((p: any) => p.type?.startsWith('tool-') || p.type === 'dynamic-tool');
    const hasMultipleTools = toolParts.length >= 2;

    return (
      <AIMessage key={message.id} from={message.role}>
        <div className={`flex items-center gap-2 text-xs ${message.role === 'user' ? 'justify-end' : ''}`}>
          {message.role === 'user' ? (
            <>
              <span className="font-medium text-muted-foreground">{userName}</span>
              {message.createdAt && <span className="text-muted-foreground/60">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
            </>
          ) : (
            <>
              <img src={logo} alt="Yang AI" className="w-5 h-5 rounded flex-shrink-0" />
              <span className="font-semibold text-foreground">Yang</span>
              {message.createdAt && <span className="text-muted-foreground/60">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
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

              // AFL Tool cards
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
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Validation error: {part.errorText}</div>;
                  default: return null;
                }
              case 'tool-debug_afl_code':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="debug_afl_code" input={part.input} />;
                  case 'output-available': return <AFLDebugCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Debug error: {part.errorText}</div>;
                  default: return null;
                }
              case 'tool-explain_afl_code':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="explain_afl_code" input={part.input} />;
                  case 'output-available': return <AFLExplainCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Explain error: {part.errorText}</div>;
                  default: return null;
                }
              case 'tool-sanity_check_afl':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="sanity_check_afl" input={part.input} />;
                  case 'output-available': return <AFLSanityCheckCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Sanity check error: {part.errorText}</div>;
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
            <Shimmer duration={1.5}>Analyzing strategy...</Shimmer>
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
  };

  // --- RENDER ---
  return (
    <div style={{ height: '100%', backgroundColor: colors.background, display: 'flex', overflow: 'hidden', position: 'relative' }}>
      {/* ===== SIDEBAR ===== */}
      <div style={{ width: sidebarCollapsed ? '0px' : '280px', backgroundColor: colors.sidebar, borderRight: sidebarCollapsed ? 'none' : `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', transition: 'width 0.3s ease', flexShrink: 0 }}>
        {/* Sidebar Header */}
        <div style={{ padding: '24px 20px', borderBottom: `2px solid ${colors.primaryYellow}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDark ? 'rgba(254, 192, 15, 0.05)' : 'rgba(254, 192, 15, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <GitBranch size={22} color={colors.primaryYellow} />
            <h2 style={{ fontFamily: "var(--font-rajdhani), 'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 700, color: colors.text, margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Reverse Engineer</h2>
          </div>
          <button onClick={() => setSidebarCollapsed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <ChevronLeft size={16} color={colors.textMuted} />
          </button>
        </div>

        {/* New Chat + Search */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={handleNewConversation} style={{ width: '100%', padding: '12px', backgroundColor: colors.primaryYellow, border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700, color: colors.darkGray, fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif", fontSize: '14px', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(254, 192, 15, 0.2)' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(254, 192, 15, 0.3)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(254, 192, 15, 0.2)'; }}>
            <Plus size={18} /> New Session
          </button>
          <div style={{ position: 'relative' }}>
            <Search size={14} color={colors.textMuted} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions..."
              style={{ width: '100%', padding: '8px 10px 8px 32px', backgroundColor: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.text, fontSize: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif", transition: 'border-color 0.2s ease' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = colors.primaryYellow; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = colors.border; }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
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
                  <div className="w-4 h-4 rounded bg-muted animate-pulse" />
                  <Shimmer duration={2 + i * 0.3} className="text-xs">Loading...</Shimmer>
                </div>
              ))}
            </div>
          ) : (() => {
            const filtered = searchQuery.trim()
              ? conversations.filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()))
              : conversations;
            if (filtered.length === 0 && searchQuery.trim()) {
              return <div style={{ textAlign: 'center', padding: '20px', color: colors.textMuted, fontSize: '12px' }}>{'No sessions matching "'}{searchQuery}{'"'}</div>;
            }
            if (filtered.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <GitBranch size={36} color={colors.textMuted} style={{ margin: '0 auto 12px', opacity: 0.25, display: 'block' }} />
                  <p style={{ color: colors.textMuted, fontSize: '12px', margin: 0, lineHeight: 1.6 }}>No sessions yet. Start a new one!</p>
                </div>
              );
            }
            return filtered.map(conv => (
              <div key={conv.id} onClick={() => { if (renamingId !== conv.id) setSelectedConversation(conv); }} style={{ padding: '10px 12px', marginBottom: '4px', backgroundColor: selectedConversation?.id === conv.id ? 'rgba(254, 192, 15, 0.15)' : 'transparent', border: selectedConversation?.id === conv.id ? `2px solid ${colors.primaryYellow}` : '1px solid transparent', borderRadius: '10px', cursor: 'pointer', color: colors.text, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif", transition: 'all 0.2s ease' }} onMouseOver={(e) => selectedConversation?.id !== conv.id && (e.currentTarget.style.backgroundColor = isDark ? 'rgba(254, 192, 15, 0.05)' : 'rgba(254, 192, 15, 0.08)')} onMouseOut={(e) => selectedConversation?.id !== conv.id && (e.currentTarget.style.backgroundColor = 'transparent')}>
                <GitBranch size={14} style={{ flexShrink: 0, color: selectedConversation?.id === conv.id ? colors.primaryYellow : colors.textMuted }} />
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
                    style={{ flex: 1, background: colors.inputBg, border: `2px solid ${colors.primaryYellow}`, borderRadius: '4px', color: colors.text, fontSize: '13px', padding: '4px 8px', outline: 'none', minWidth: 0, fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif" }}
                  />
                ) : (
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontWeight: selectedConversation?.id === conv.id ? 600 : 400 }}>{conv.title}</span>
                )}
                {renamingId !== conv.id && (
                  <div style={{ display: 'flex', gap: '2px', opacity: 0.5 }}>
                    <button onClick={(e) => { e.stopPropagation(); setRenamingId(conv.id); setRenameValue(conv.title || ''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} title="Rename">
                      <Pencil size={12} color={colors.textMuted} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} title="Delete">
                      <Trash2 size={12} color={colors.textMuted} />
                    </button>
                  </div>
                )}
              </div>
            ));
          })()}
        </div>
      </div>

      {/* ===== MAIN CHAT AREA ===== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', height: '100%' }}>
        {/* Collapsed sidebar toggle */}
        {sidebarCollapsed && (
          <button onClick={() => setSidebarCollapsed(false)} style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 100, background: 'rgba(254, 192, 15, 0.3)', border: '1px solid rgba(254, 192, 15, 0.5)', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
            <ChevronRight size={18} color="#FEC00F" />
          </button>
        )}

        {/* Top toolbar */}
        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.background, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GitBranch size={18} color={colors.primaryYellow} />
            <span style={{ fontFamily: "var(--font-rajdhani), 'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 700, color: colors.text, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Reverse Engineer
            </span>
            <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '6px', backgroundColor: isDark ? 'rgba(254, 192, 15, 0.1)' : 'rgba(254, 192, 15, 0.08)', color: colors.primaryYellow, fontWeight: 600, fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif" }}>
              Strategy to AFL
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setCodePanelOpen(!codePanelOpen)}
              style={{ background: 'none', border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: colors.textMuted, fontSize: '11px', fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif", transition: 'all 0.2s ease' }}
              title={codePanelOpen ? 'Hide code panel' : 'Show code panel'}
            >
              {codePanelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
              <span>Code</span>
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1" style={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div data-scroll-container style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', backgroundColor: colors.background, color: colors.text } as React.CSSProperties}>
            <div className="max-w-[900px] mx-auto px-6 py-8" style={{ color: colors.text }}>
              {allMessages.length === 0 ? (
                <ConversationEmptyState
                  icon={<img src={logo} alt="Logo" className="w-20 opacity-30" />}
                  title="Reverse Engineer"
                  description="Transform strategy descriptions into working AFL code"
                >
                  <div className="flex flex-col items-center gap-4" style={{ padding: '20px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: isDark ? 'rgba(254, 192, 15, 0.1)' : 'rgba(254, 192, 15, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <GitBranch size={32} color={colors.primaryYellow} />
                    </div>
                    <div className="space-y-1 text-center">
                      <h3 style={{ fontFamily: "var(--font-rajdhani), 'Rajdhani', sans-serif", fontSize: '20px', fontWeight: 700, color: colors.primaryYellow, margin: '8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>REVERSE ENGINEER</h3>
                      <p style={{ fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif", fontSize: '14px', color: colors.textMuted, margin: '4px 0', maxWidth: '480px' }}>
                        Describe any trading strategy in plain English and I will research its components, build a schematic, and generate production-ready AFL code.
                      </p>
                    </div>
                    <Suggestions className="justify-center mt-4">
                      <Suggestion suggestion="Reverse engineer a turtle trading breakout strategy with 20/55 day channels" onClick={(s: string) => setInput(s)} />
                      <Suggestion suggestion="Recreate the Larry Williams' volatility breakout system" onClick={(s: string) => setInput(s)} />
                      <Suggestion suggestion="Build a Weinstein stage analysis system with proper entry/exit rules" onClick={(s: string) => setInput(s)} />
                      <Suggestion suggestion="Convert a dual momentum strategy (relative + absolute) to AFL" onClick={(s: string) => setInput(s)} />
                    </Suggestions>
                    <p className="text-xs text-muted-foreground mt-2">Click a suggestion or describe your strategy below</p>
                  </div>
                </ConversationEmptyState>
              ) : (
                <>
                  <div className="flex flex-col gap-6">
                    {allMessages.map((msg, idx) => renderMessage(msg, idx))}
                  </div>

                  {status === 'submitted' && allMessages.length > 0 && allMessages[allMessages.length - 1]?.role === 'user' && (
                    <AIMessage from="assistant">
                      <div className="flex items-center gap-2 text-xs">
                        <img src={logo} alt="Yang AI" className="w-5 h-5 rounded flex-shrink-0" />
                        <span className="font-semibold text-foreground">Yang</span>
                      </div>
                      <MessageContent>
                        <Shimmer duration={1.5}>Analyzing strategy...</Shimmer>
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
          <div className="px-6 py-3 bg-destructive/10 border-t border-destructive text-destructive text-sm flex justify-between items-center">
            <span>{pageError || chatError?.message || 'An error occurred'}</span>
            <div className="flex gap-2">
              <button onClick={() => regenerate()} className="border border-destructive rounded-md text-destructive cursor-pointer px-3 py-1 text-xs flex items-center gap-1 bg-transparent">
                <RefreshCw size={12} /> Retry
              </button>
              <button onClick={() => setPageError('')} className="bg-transparent border-none text-destructive cursor-pointer text-lg">x</button>
            </div>
          </div>
        )}

        {/* PromptInput */}
        <div className="px-6 py-5" style={{ flexShrink: 0, borderTop: `2px solid ${colors.primaryYellow}`, backgroundColor: isDark ? 'rgba(254, 192, 15, 0.03)' : 'rgba(254, 192, 15, 0.05)', transition: 'all 0.2s ease' }}>
          <div className="max-w-[900px] mx-auto">
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
                      const conv = await apiClient.createConversation('Reverse Engineer', 'reverse_engineer');
                      setConversations(prev => [conv, ...prev]);
                      setSelectedConversation(conv);
                      conversationIdRef.current = conv.id;
                      convId = conv.id;
                    } catch { setPageError('Failed to create conversation'); return; }
                  }

                  // Upload files if any
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

                  // Prepend reverse engineer context
                  const contextPrefix = `[Reverse Engineer Context: task=reverse_engineer_strategy]\n\n`;
                  sendMessage({ text: contextPrefix + messageText }, { body: { conversationId: convId } });
                }}
              >
                <AttachmentsDisplay />
                <PromptInputTextarea
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                  placeholder={isStreaming ? 'Analyzing strategy...' : 'Describe a trading strategy to reverse engineer into AFL code...'}
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

      {/* ===== CODE PANEL (Right Side) ===== */}
      {codePanelOpen && (
        <div style={{ width: isMobile ? '100%' : '420px', backgroundColor: colors.codePanelBg, borderLeft: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0, transition: 'width 0.3s ease', position: isMobile ? 'absolute' : 'relative', right: 0, top: 0, zIndex: isMobile ? 200 : 1 }}>
          {/* Panel Header */}
          <div style={{ padding: '16px 20px', borderBottom: `2px solid ${colors.primaryYellow}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDark ? 'rgba(254, 192, 15, 0.05)' : 'rgba(254, 192, 15, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Code2 size={18} color={colors.primaryYellow} />
              <h3 style={{ fontFamily: "var(--font-rajdhani), 'Rajdhani', sans-serif", fontSize: '13px', fontWeight: 700, color: colors.text, margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>AFL CODE</h3>
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: isDark ? 'rgba(254, 192, 15, 0.15)' : 'rgba(254, 192, 15, 0.1)', color: colors.primaryYellow, fontWeight: 600, fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif", textTransform: 'uppercase' }}>Reverse Engineered</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button onClick={handleCopyCode} disabled={!generatedCode} style={{ background: 'none', border: 'none', cursor: generatedCode ? 'pointer' : 'default', padding: '6px', borderRadius: '6px', opacity: generatedCode ? 1 : 0.3 }} title="Copy code">
                <CopyIcon size={14} color={colors.textMuted} />
              </button>
              <button onClick={handleDownloadCode} disabled={!generatedCode} style={{ background: 'none', border: 'none', cursor: generatedCode ? 'pointer' : 'default', padding: '6px', borderRadius: '6px', opacity: generatedCode ? 1 : 0.3 }} title="Download .afl">
                <Download size={14} color={colors.textMuted} />
              </button>
              <button onClick={() => setCodePanelOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px' }} title="Close panel">
                <X size={14} color={colors.textMuted} />
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div style={{ flex: 1, minHeight: 0 }}>
            {generatedCode ? (
              <Editor
                height="100%"
                language="cpp"
                theme={isDark ? 'vs-dark' : 'light'}
                value={generatedCode}
                onChange={(value) => setGeneratedCode(value || '')}
                onMount={(editor) => { editorRef.current = editor; }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  padding: { top: 16, bottom: 16 },
                  renderLineHighlight: 'line',
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontLigatures: true,
                }}
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '40px' }}>
                <GitBranch size={40} color={colors.border} />
                <p style={{ fontSize: '13px', color: colors.textMuted, textAlign: 'center', fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif", lineHeight: 1.5 }}>
                  Reverse engineered AFL code will appear here. Describe a strategy in the chat to get started.
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {generatedCode && (
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${colors.border}`, display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: 'Optimize', prompt: `Optimize this reverse-engineered AFL code for better performance:\n\`\`\`afl\n${generatedCode}\n\`\`\`` },
                { label: 'Debug', prompt: `Debug this AFL code and find potential issues:\n\`\`\`afl\n${generatedCode}\n\`\`\`` },
                { label: 'Explain', prompt: `Explain this reverse-engineered AFL code line by line:\n\`\`\`afl\n${generatedCode}\n\`\`\`` },
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
                    padding: '5px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: 'transparent',
                    color: colors.textMuted,
                    cursor: 'pointer',
                    fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = colors.primaryYellow; e.currentTarget.style.color = colors.primaryYellow; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textMuted; }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          generatedCode={generatedCode}
          conversationId={selectedConversation?.id}
        />
      )}
    </div>
  );
}

export default ReverseEngineerPage;

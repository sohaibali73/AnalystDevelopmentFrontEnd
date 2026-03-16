'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Plus, MessageSquare, ArrowUpFromLine, Trash2, ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, Pencil, X, CopyIcon, ThumbsUpIcon, ThumbsDownIcon, Download, Code2, PanelRightClose, PanelRightOpen, Settings2, Zap, Layers, Sparkles } from 'lucide-react';
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

// AI Elements - Composable Components
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

// Component to display file attachments inside PromptInput
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

// Simple attachment button
function AttachmentButton({ disabled }: { disabled?: boolean }) {
  const attachments = usePromptInputAttachments();
  const handleClick = useCallback(() => {
    if (!disabled) attachments.openFileDialog();
  }, [attachments, disabled]);
  return (
    <PromptInputButton onClick={handleClick} disabled={disabled} tooltip="Attach files (AFL, CSV, PDF, etc.)">
      <ArrowUpFromLine className="size-4" />
    </PromptInputButton>
  );
}

// Extract AFL code from message text (finds ```afl or ``` code blocks)
function extractAFLCode(text: string): string | null {
  // Try afl-specific blocks first
  const aflMatch = text.match(/```(?:afl|amibroker)\s*\n([\s\S]*?)```/i);
  if (aflMatch) return aflMatch[1].trim();
  // Try any code block
  const codeMatch = text.match(/```\w*\s*\n([\s\S]*?)```/);
  if (codeMatch) return codeMatch[1].trim();
  return null;
}

export function AFLGeneratorPage() {
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
  const [strategyType, setStrategyType] = useState<'standalone' | 'entry' | 'exit'>('standalone');
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

  // Connection status
  const { status: connStatus, check: recheckConnection } = useConnectionStatus({ interval: 60000 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string | null>(null);
  const skipNextLoadRef = useRef(false);
  const editorRef = useRef<any>(null);

  // Auth token
  const getAuthToken = () => {
    try { return localStorage.getItem('auth_token') || ''; } catch { return ''; }
  };

  // --- Colors (matching ChatPage) ---
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

  // --- AI SDK useChat (same pattern as ChatPage) ---
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

  // --- Auto-extract AFL code from the latest assistant message ---
  const lastExtractedCodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (streamMessages.length === 0) return;
    // Find the last assistant message
    for (let i = streamMessages.length - 1; i >= 0; i--) {
      const msg = streamMessages[i];
      if (msg.role !== 'assistant') continue;
      const parts = msg.parts || [];
      const fullText = parts.filter((p: any) => p.type === 'text').map((p: any) => p.text || '').join('');

      let extractedCode: string | null = null;
      let extractedDescription: string | undefined;
      let extractedStrategyType: string | undefined;

      // Check tool outputs for AFL code first (more structured)
      for (const part of parts) {
        if (part.type === 'tool-generate_afl_code' && part.state === 'output-available') {
          const aflCode = (part as any).output?.code || (part as any).output?.afl_code;
          if (aflCode) {
            extractedCode = aflCode;
            extractedDescription = (part as any).output?.description;
            extractedStrategyType = (part as any).output?.strategy_type;
            break;
          }
        }
      }

      // Fall back to text extraction
      if (!extractedCode) {
        extractedCode = extractAFLCode(fullText);
      }

      if (extractedCode) {
        // Skip if this is the same code we already processed
        if (lastExtractedCodeRef.current === extractedCode) break;
        lastExtractedCodeRef.current = extractedCode;

        if (compositeMode) {
          // In composite mode, add as a new strategy tab
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
            // Auto-switch to the new strategy tab
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
  }, [streamMessages, isMobile, compositeMode]);

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
      // Filter to AFL conversations only
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
      // Extract any existing AFL code from loaded messages
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
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Composite code generation (auto-template) ---
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

  // --- Get the active code (respects composite mode) ---
  const getActiveCode = useCallback(() => {
    if (!compositeMode) return generatedCode;
    if (activeTab === 'composite') return compositeCode;
    return strategies.find(s => s.id === activeTab)?.code || '';
  }, [compositeMode, generatedCode, activeTab, compositeCode, strategies]);

  // --- Remove a strategy tab ---
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

  // All messages from useChat
  const allMessages = useMemo(() => streamMessages, [streamMessages]);
  const lastIdx = allMessages.length - 1;
  const userName = user?.name || 'You';

  // Stable refs for values used in renderMessage to avoid re-renders
  const lastIdxRef = useRef(lastIdx);
  lastIdxRef.current = lastIdx;
  const isStreamingRef = useRef(isStreaming);
  isStreamingRef.current = isStreaming;

  // --- Render a single message using AI Elements ---
  const renderMessage = useCallback((message: any, idx: number) => {
    const parts = message.parts || [];
    const isLast = idx === lastIdxRef.current;
    const msgIsStreaming = isStreamingRef.current && isLast && message.role === 'assistant';
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
                // Fallback for unknown tool types
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
            <MessageAction tooltip="Not helpful" onClick={() => { setShowFeedbackModal(true); }}>
              <ThumbsDownIcon className="size-3.5" />
            </MessageAction>
          </MessageActions>
        )}
      </AIMessage>
    );
  }, [lastIdxRef, isStreamingRef, userName, logo, isDark, colors, handleCopyMessage, setShowFeedbackModal, status, stripReactCodeBlocks]);

  // --- RENDER ---
  return (
    <div style={{ height: '100%', backgroundColor: colors.background, display: 'flex', overflow: 'hidden', position: 'relative' }}>
      {/* ===== SIDEBAR ===== */}
      <div style={{ width: sidebarCollapsed ? '0px' : '280px', backgroundColor: colors.sidebar, borderRight: sidebarCollapsed ? 'none' : `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', transition: 'width 0.3s ease', flexShrink: 0 }}>
        {/* Sidebar Header */}
        <div style={{ padding: '24px 20px', borderBottom: `2px solid ${colors.primaryYellow}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDark ? 'rgba(254, 192, 15, 0.05)' : 'rgba(254, 192, 15, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={logo} alt="Logo" style={{ width: '32px', height: '32px' }} />
            <h2 style={{ fontFamily: "var(--font-rajdhani), 'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 700, color: colors.text, margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>AFL GENERATOR</h2>
          </div>
          <button onClick={() => setSidebarCollapsed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <ChevronLeft size={16} color={colors.textMuted} />
          </button>
        </div>

        {/* New Chat + Search */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={handleNewConversation} style={{ width: '100%', padding: '12px', backgroundColor: colors.primaryYellow, border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700, color: colors.darkGray, fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif", fontSize: '14px', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(254, 192, 15, 0.2)' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(254, 192, 15, 0.3)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(254, 192, 15, 0.2)'; }}>
            <Plus size={18} /> New AFL Chat
          </button>
          <div style={{ position: 'relative' }}>
            <Search size={14} color={colors.textMuted} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search AFL chats..."
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
              return <div style={{ textAlign: 'center', padding: '20px', color: colors.textMuted, fontSize: '12px' }}>{'No chats matching "'}{searchQuery}{'"'}</div>;
            }
            if (filtered.length === 0) {
              return <div style={{ textAlign: 'center', padding: '20px', color: colors.textMuted, fontSize: '12px' }}>No AFL conversations yet. Start a new chat!</div>;
            }
            return filtered.map(conv => (
              <div key={conv.id} onClick={() => { if (renamingId !== conv.id) setSelectedConversation(conv); }} style={{ padding: '10px 12px', marginBottom: '4px', backgroundColor: selectedConversation?.id === conv.id ? 'rgba(254, 192, 15, 0.15)' : 'transparent', border: selectedConversation?.id === conv.id ? `2px solid ${colors.primaryYellow}` : '1px solid transparent', borderRadius: '10px', cursor: 'pointer', color: colors.text, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif", transition: 'all 0.2s ease' }} onMouseOver={(e) => selectedConversation?.id !== conv.id && (e.currentTarget.style.backgroundColor = isDark ? 'rgba(254, 192, 15, 0.05)' : 'rgba(254, 192, 15, 0.08)')} onMouseOut={(e) => selectedConversation?.id !== conv.id && (e.currentTarget.style.backgroundColor = 'transparent')}>
                <Code2 size={14} style={{ flexShrink: 0, color: selectedConversation?.id === conv.id ? colors.primaryYellow : colors.textMuted }} />
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

        {/* Top toolbar: strategy type + code panel toggle */}
        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.background, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: colors.textMuted, fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif" }}>Strategy:</span>
            {(['standalone', 'entry', 'exit'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setStrategyType(type)}
                style={{
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: strategyType === type
                    ? `1.5px solid ${colors.primaryYellow}`
                    : `1px solid ${colors.border}`,
                  backgroundColor: strategyType === type
                    ? (isDark ? 'rgba(254, 192, 15, 0.15)' : 'rgba(254, 192, 15, 0.1)')
                    : 'transparent',
                  color: strategyType === type ? colors.primaryYellow : colors.textMuted,
                  cursor: 'pointer',
                  fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease',
                }}
              >
                {type}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Composite Model Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Switch
                checked={compositeMode}
                onCheckedChange={(checked) => {
                  setCompositeMode(checked);
                  if (checked && !codePanelOpen && !isMobile) setCodePanelOpen(true);
                }}
                className="data-[state=checked]:bg-[#FEC00F] h-4 w-8"
              />
              <span style={{
                fontSize: '11px',
                color: compositeMode ? colors.primaryYellow : colors.textMuted,
                fontWeight: compositeMode ? 600 : 400,
                fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}>
                Composite
              </span>
            </div>

            <div style={{ width: '1px', height: '18px', backgroundColor: colors.border }} />

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
                  title="AFL Code Generator"
                  description="Generate, debug, and optimize AmiBroker Formula Language strategies"
                >
                  <div className="flex flex-col items-center gap-4" style={{ padding: '20px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: isDark ? 'rgba(254, 192, 15, 0.1)' : 'rgba(254, 192, 15, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Code2 size={32} color={colors.primaryYellow} />
                    </div>
                    <div className="space-y-1 text-center">
                      <h3 style={{ fontFamily: "var(--font-rajdhani), 'Rajdhani', sans-serif", fontSize: '20px', fontWeight: 700, color: colors.primaryYellow, margin: '8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AFL CODE GENERATOR</h3>
                      <p style={{ fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif", fontSize: '14px', color: colors.textMuted, margin: '4px 0', maxWidth: '420px' }}>
                        Describe your trading strategy and I will generate optimized AmiBroker AFL code with proper risk management and backtesting settings.
                      </p>
                    </div>
                    <Suggestions className="justify-center mt-4">
                      <Suggestion suggestion="Generate a moving average crossover AFL with stop loss" onClick={(s: string) => setInput(s)} />
                      <Suggestion suggestion="Create an RSI-based mean reversion strategy" onClick={(s: string) => setInput(s)} />
                      <Suggestion suggestion="Build a Bollinger Band breakout system with position sizing" onClick={(s: string) => setInput(s)} />
                      <Suggestion suggestion="Debug my AFL code for syntax errors" onClick={(s: string) => setInput(s)} />
                    </Suggestions>
                    <p className="text-xs text-muted-foreground mt-2">Click a suggestion or describe your strategy below</p>
                  </div>
                </ConversationEmptyState>
              ) : (
                <>
                  <div className="flex flex-col gap-6">
                    {allMessages.map((msg, idx) => renderMessage(msg, idx))}
                  </div>

                  {/* Submitted state - waiting */}
                  {status === 'submitted' && allMessages.length > 0 && allMessages[allMessages.length - 1]?.role === 'user' && (
                    <AIMessage from="assistant">
                      <div className="flex items-center gap-2 text-xs">
                        <img src={logo} alt="Yang AI" className="w-5 h-5 rounded flex-shrink-0" />
                        <span className="font-semibold text-foreground">Yang</span>
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
                      // Use first 50 chars of prompt as conversation title
                      const convTitle = text.trim().replace(/\[AFL Generator Context:.*?\]\s*/s, '').slice(0, 50).trim() || 'New Strategy';
                      const conv = await apiClient.createConversation(convTitle, 'afl');
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

                  // Prepend AFL context to the message
                  const contextPrefix = `[AFL Generator Context: strategy_type=${strategyType}, initial_equity=${backtestSettings.initial_equity}, max_positions=${backtestSettings.max_positions}, commission=${backtestSettings.commission}]\n\n`;
                  sendMessage({ text: contextPrefix + messageText }, { body: { conversationId: convId } });
                }}
              >
                <AttachmentsDisplay />
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

      {/* ===== CODE PANEL (Right Side) ===== */}
      {codePanelOpen && (() => {
        const activeCode = getActiveCode();
        const hasCode = compositeMode ? (strategies.length > 0 || activeTab === 'composite') : !!generatedCode;
        const isCompositeTab = compositeMode && activeTab === 'composite';

        return (
        <div style={{ width: isMobile ? '100%' : '460px', backgroundColor: colors.codePanelBg, borderLeft: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0, transition: 'width 0.3s ease', position: isMobile ? 'absolute' : 'relative', right: 0, top: 0, zIndex: isMobile ? 200 : 1 }}>
          {/* Panel Header */}
          <div style={{ padding: '12px 16px', borderBottom: compositeMode ? `1px solid ${colors.border}` : `2px solid ${colors.primaryYellow}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDark ? 'rgba(254, 192, 15, 0.05)' : 'rgba(254, 192, 15, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {compositeMode ? <Layers size={16} color={colors.primaryYellow} /> : <Code2 size={16} color={colors.primaryYellow} />}
              <h3 style={{ fontFamily: "var(--font-rajdhani), 'Rajdhani', sans-serif", fontSize: '13px', fontWeight: 700, color: colors.text, margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {compositeMode ? 'COMPOSITE' : 'AFL CODE'}
              </h3>
              {compositeMode ? (
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: isDark ? 'rgba(254, 192, 15, 0.15)' : 'rgba(254, 192, 15, 0.1)', color: colors.primaryYellow, fontWeight: 600, fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif" }}>
                  {strategies.length} {strategies.length === 1 ? 'strategy' : 'strategies'}
                </span>
              ) : (
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: isDark ? 'rgba(254, 192, 15, 0.15)' : 'rgba(254, 192, 15, 0.1)', color: colors.primaryYellow, fontWeight: 600, fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif", textTransform: 'uppercase' }}>{strategyType}</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'background-color 0.2s' }} title="Backtest settings">
                <Settings2 size={14} color={showSettings ? colors.primaryYellow : colors.textMuted} />
              </button>
              <button onClick={handleCopyCode} disabled={!activeCode} style={{ background: 'none', border: 'none', cursor: activeCode ? 'pointer' : 'default', padding: '6px', borderRadius: '6px', opacity: activeCode ? 1 : 0.3 }} title="Copy code">
                <CopyIcon size={14} color={colors.textMuted} />
              </button>
              <button onClick={handleDownloadCode} disabled={!activeCode} style={{ background: 'none', border: 'none', cursor: activeCode ? 'pointer' : 'default', padding: '6px', borderRadius: '6px', opacity: activeCode ? 1 : 0.3 }} title="Download .afl">
                <Download size={14} color={colors.textMuted} />
              </button>
              <button onClick={() => setCodePanelOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px' }} title="Close panel">
                <X size={14} color={colors.textMuted} />
              </button>
            </div>
          </div>

          {/* === Composite Tab Bar === */}
          {compositeMode && (
            <div style={{ borderBottom: `2px solid ${colors.primaryYellow}`, backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)' }}>
              <ScrollArea className="w-full">
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', padding: '8px 12px 0', minWidth: 'max-content' }}>
                  {/* Composite tab (always first, not closable) */}
                  <button
                    onClick={() => setActiveTab('composite')}
                    style={{
                      padding: '7px 14px',
                      fontSize: '11px',
                      fontWeight: activeTab === 'composite' ? 700 : 500,
                      borderRadius: '8px 8px 0 0',
                      border: activeTab === 'composite' ? `1px solid ${colors.primaryYellow}` : `1px solid transparent`,
                      borderBottom: 'none',
                      backgroundColor: activeTab === 'composite' ? (isDark ? 'rgba(254, 192, 15, 0.12)' : 'rgba(254, 192, 15, 0.1)') : 'transparent',
                      color: activeTab === 'composite' ? colors.primaryYellow : colors.textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                      position: 'relative',
                    }}
                  >
                    <Layers size={11} />
                    Composite
                    {strategies.length > 0 && (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        backgroundColor: colors.primaryYellow,
                        color: colors.darkGray,
                        borderRadius: '6px',
                        padding: '1px 5px',
                        lineHeight: '14px',
                        minWidth: '14px',
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
                        padding: '7px 10px',
                        fontSize: '11px',
                        fontWeight: activeTab === strategy.id ? 700 : 500,
                        borderRadius: '8px 8px 0 0',
                        border: activeTab === strategy.id ? `1px solid ${colors.border}` : `1px solid transparent`,
                        borderBottom: 'none',
                        backgroundColor: activeTab === strategy.id ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'transparent',
                        color: activeTab === strategy.id ? colors.text : colors.textMuted,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                        position: 'relative',
                      }}
                    >
                      <Code2 size={10} />
                      <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{strategy.name}</span>
                      {strategy.strategyType && (
                        <span style={{ fontSize: '8px', opacity: 0.5, textTransform: 'uppercase' }}>{strategy.strategyType.slice(0, 4)}</span>
                      )}
                      {/* Close button */}
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveStrategy(strategy.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleRemoveStrategy(strategy.id); }
                        }}
                        style={{
                          opacity: 0.4,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '2px',
                          borderRadius: '3px',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'rgba(255,0,0,0.15)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <X size={10} />
                      </span>
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {/* Backtest Settings (collapsible) */}
          {showSettings && (
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { label: 'Initial Equity', key: 'initial_equity', type: 'number' },
                  { label: 'Max Positions', key: 'max_positions', type: 'number' },
                  { label: 'Position Size', key: 'position_size', type: 'text' },
                  { label: 'Commission', key: 'commission', type: 'number' },
                  { label: 'Margin %', key: 'margin_requirement', type: 'number' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label style={{ fontSize: '10px', color: colors.textMuted, fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</label>
                    <input
                      type={type}
                      value={(backtestSettings as any)[key]}
                      onChange={(e) => setBacktestSettings(prev => ({ ...prev, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', backgroundColor: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: '6px', color: colors.text, fontSize: '12px', outline: 'none', fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif", boxSizing: 'border-box', marginTop: '2px' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monaco Editor */}
          <div style={{ flex: 1, minHeight: 0 }}>
            {(compositeMode || generatedCode) ? (
              <>
                {/* Read-only indicator for composite tab */}
                {isCompositeTab && strategies.length > 0 && (
                  <div style={{
                    padding: '6px 16px',
                    backgroundColor: isDark ? 'rgba(254, 192, 15, 0.06)' : 'rgba(254, 192, 15, 0.05)',
                    borderBottom: `1px solid ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: '10px', color: colors.textMuted, fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif" }}>
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
                      // Composite tab is read-only; individual strategy tabs are editable
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
                    padding: { top: 16, bottom: 16 },
                    renderLineHighlight: 'line',
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontLigatures: true,
                    readOnly: isCompositeTab,
                  }}
                />
              </>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '40px' }}>
                {compositeMode ? <Layers size={40} color={colors.border} /> : <Code2 size={40} color={colors.border} />}
                <p style={{ fontSize: '13px', color: colors.textMuted, textAlign: 'center', fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif", lineHeight: 1.5 }}>
                  {compositeMode
                    ? 'Generate individual strategies in the chat. Each will appear as a tab, and the composite code will combine them automatically.'
                    : 'Generated AFL code will appear here. Describe your strategy in the chat to get started.'}
                </p>
              </div>
            )}
          </div>

          {/* Composite AI Merge Footer */}
          {compositeMode && isCompositeTab && strategies.length >= 2 && (
            <div style={{
              padding: '10px 16px',
              borderTop: `1px solid ${colors.border}`,
              backgroundColor: isDark ? 'rgba(254, 192, 15, 0.03)' : 'rgba(254, 192, 15, 0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <button
                onClick={() => {
                  const allCodes = strategies.map((s, i) => `### ${s.name}${s.strategyType ? ` (${s.strategyType})` : ''}:\n\`\`\`afl\n${s.code}\n\`\`\``).join('\n\n');
                  setInput(`Intelligently merge these ${strategies.length} individual AFL strategies into a single composite strategy. Use a proper voting/scoring system to combine their Buy/Sell/Short/Cover signals with appropriate weighting:\n\n${allCodes}`);
                }}
                style={{
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: `1px solid ${colors.primaryYellow}`,
                  backgroundColor: isDark ? 'rgba(254, 192, 15, 0.1)' : 'rgba(254, 192, 15, 0.08)',
                  color: colors.primaryYellow,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif",
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(254, 192, 15, 0.2)' : 'rgba(254, 192, 15, 0.15)'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(254, 192, 15, 0.1)' : 'rgba(254, 192, 15, 0.08)'; }}
              >
                <Sparkles size={12} />
                AI Merge Strategies
              </button>
              <span style={{ fontSize: '10px', color: colors.textMuted, fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif" }}>
                or use auto-generated template above
              </span>
            </div>
          )}

          {/* Quick Actions */}
          {(() => {
            const codeForActions = compositeMode ? activeCode : generatedCode;
            if (!codeForActions) return null;
            // Don't show optimize/debug/explain for the composite auto-template, only for individual strategies or non-composite mode
            if (compositeMode && isCompositeTab) return null;
            return (
              <div style={{ padding: '12px 16px', borderTop: `1px solid ${colors.border}`, display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
            );
          })()}
        </div>
        );
      })()}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          generatedCode={getActiveCode() || generatedCode}
          conversationId={selectedConversation?.id}
        />
      )}
    </div>
  );
}

export default AFLGeneratorPage;

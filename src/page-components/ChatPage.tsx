'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Plus, MessageSquare, ArrowUpFromLine, Trash2, ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, Pencil, X, Wifi, WifiOff, CopyIcon, ThumbsUpIcon, ThumbsDownIcon, Volume2, VolumeX } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api';
import { Conversation as ConversationType } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { ArtifactRenderer } from '@/components/artifacts';

// AI Elements - Composable Components
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion';
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { Tool as AITool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
import { Conversation as AIConversation, ConversationContent, ConversationScrollButton, ConversationEmptyState } from '@/components/ai-elements/conversation';
import { Message as AIMessage, MessageContent, MessageActions, MessageAction, MessageResponse, MessageToolbar } from '@/components/ai-elements/message';
import { CodeBlock, CodeBlockHeader, CodeBlockTitle, CodeBlockActions, CodeBlockCopyButton, CodeBlockContent } from '@/components/ai-elements/code-block';
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputHeader, PromptInputTools, PromptInputButton, PromptInputSubmit, usePromptInputAttachments, PromptInputActionMenu, PromptInputActionMenuTrigger, PromptInputActionMenuContent, PromptInputActionMenuContent as MenuContent, PromptInputActionAddAttachments } from '@/components/ai-elements/prompt-input';
import { Attachments, Attachment, AttachmentPreview, AttachmentInfo, AttachmentRemove } from '@/components/ai-elements/attachments';
import { Sources, SourcesTrigger, SourcesContent, Source } from '@/components/ai-elements/sources';
import { Artifact, ArtifactHeader, ArtifactTitle, ArtifactContent, ArtifactActions, ArtifactAction } from '@/components/ai-elements/artifact';
import { DocumentGenerator } from '@/components/ai-elements/document-generator';
import DocumentDownloadCard from '@/components/ai-elements/document-download-card';
import { ChainOfThought, ChainOfThoughtHeader, ChainOfThoughtContent, ChainOfThoughtStep } from '@/components/ai-elements/chain-of-thought';
import { SpeechInput } from '@/components/ai-elements/speech-input';
import { WebPreview, WebPreviewNavigation, WebPreviewNavigationButton, WebPreviewBody, WebPreviewConsole } from '@/components/ai-elements/web-preview';
import { Terminal, TerminalHeader, TerminalTitle, TerminalContent, TerminalCopyButton, TerminalActions } from '@/components/ai-elements/terminal';
import { Image as AIImage } from '@/components/ai-elements/image';
import { Plan, PlanHeader, PlanTitle, PlanDescription, PlanContent, PlanTrigger } from '@/components/ai-elements/plan';
import { Task, TaskTrigger, TaskContent, TaskItem } from '@/components/ai-elements/task';
import { StackTrace, StackTraceHeader, StackTraceError, StackTraceErrorType, StackTraceErrorMessage, StackTraceContent, StackTraceFrames, StackTraceCopyButton, StackTraceActions, StackTraceExpandButton } from '@/components/ai-elements/stack-trace';
import { Confirmation, ConfirmationTitle, ConfirmationRequest, ConfirmationAccepted, ConfirmationRejected, ConfirmationActions, ConfirmationAction } from '@/components/ai-elements/confirmation';
import { Sandbox, SandboxHeader, SandboxContent, SandboxTabs, SandboxTabsBar, SandboxTabsList, SandboxTabsTrigger, SandboxTabContent } from '@/components/ai-elements/sandbox';
import { InlineCitation, InlineCitationText, InlineCitationCard, InlineCitationCardTrigger, InlineCitationCardBody, InlineCitationSource } from '@/components/ai-elements/inline-citation';
import VoiceMode from '@/components/VoiceMode';
import { InlineReactPreview, stripReactCodeBlocks } from '@/components/InlineReactPreview';
import {
  StockCard,
  LiveStockChart,
  TechnicalAnalysis,
  WeatherCard,
  NewsHeadlines,
  CodeSandbox,
  DataChart,
  CodeExecution,
  KnowledgeBaseResults,
  AFLGenerateCard,
  AFLValidateCard,
  AFLDebugCard,
  AFLExplainCard,
  AFLSanityCheckCard,
  WebSearchResults,
  ToolLoading,
  StockScreener,
  StockComparison,
  SectorPerformance,
  PositionSizer,
  CorrelationMatrix,
  DividendCard,
  RiskMetrics,
  MarketOverview,
  BacktestResults,
  OptionsSnapshot,
  PresentationCard,
  LiveSportsScores,
  SearchTrends,
  LinkedInPost,
  WebsitePreview,
  FoodOrder,
  FlightTracker,
  FlightSearchCard,
} from '@/components/generative-ui';

const logo = '/potomac-icon.png';

// Component to display file attachments inside PromptInput
function AttachmentsDisplay() {
  const attachments = usePromptInputAttachments();

  if (attachments.files.length === 0) {
    return null;
  }

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

// Simple attachment button that opens file dialog
function AttachmentButton({ disabled }: { disabled?: boolean }) {
  const attachments = usePromptInputAttachments();

  const handleAttachmentClick = useCallback(() => {
    if (!disabled) {
      attachments.openFileDialog();
    }
  }, [attachments, disabled]);

  return (
    <PromptInputButton
      onClick={handleAttachmentClick}
      disabled={disabled}
      tooltip="Attach files (PDF, CSV, JSON, Images, Docs, etc.)"
      title="Click to upload files or drag and drop"
      style={{
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      <ArrowUpFromLine className="size-4" />
    </PromptInputButton>
  );
}

export function ChatPage() {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const isDark = resolvedTheme === 'dark';

  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationType | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const [pageError, setPageError] = useState('');

  // Local input state - per the v5 docs pattern
  const [input, setInput] = useState('');

  // Conversation search & rename state
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Artifacts state — keyed by conversationId for persistence across switches
  const [artifactsByConv, setArtifactsByConv] = useState<Record<string, any[]>>({});
  const artifacts = selectedConversation ? (artifactsByConv[selectedConversation.id] || []) : [];

  // Connection status
  const { status: connStatus, check: recheckConnection } = useConnectionStatus({ interval: 60000 });

  // Voice mode state
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceModeOpen, setVoiceModeOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenMsgId = useRef<string | null>(null);

  // TTS: Play text as speech via backend edge-tts
  const speakText = useCallback(async (text: string, messageId: string) => {
    if (!text.trim() || lastSpokenMsgId.current === messageId) return;
    lastSpokenMsgId.current = messageId;

    try {
      setIsSpeaking(true);
      const token = getAuthToken();
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ text, voice: 'en-US-AriaNeural' }),
      });

      if (!resp.ok) { setIsSpeaking(false); return; }

      const audioBlob = await resp.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Stop any currently playing audio
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(audioUrl); audioRef.current = null; };
      audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(audioUrl); audioRef.current = null; };
      audio.play().catch(() => setIsSpeaking(false));
    } catch { setIsSpeaking(false); }
  }, []);

  // Stop TTS playback
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsSpeaking(false);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ref to track current conversationId synchronously (avoids stale state in body callback)
  const conversationIdRef = useRef<string | null>(null);

  // Simplified: Use AI SDK parts directly, no manual reconstruction needed

  // Get auth token for transport
  const getAuthToken = () => {
    try { return localStorage.getItem('auth_token') || ''; } catch { return ''; }
  };

  // ===== Vercel AI SDK v6 useChat with UI Message Stream Protocol =====
  const { messages: streamMessages, sendMessage, status, stop, error: chatError, setMessages, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',  // Uses UI Message Stream protocol (SSE with x-vercel-ai-ui-message-stream: v1)
      headers: () => {
        const token = getAuthToken();
        return { 'Authorization': token ? `Bearer ${token}` : '' };
      },
      body: () => ({
        // Use ref for synchronous access to latest conversationId
        conversationId: conversationIdRef.current,
      }),
    }),
    onFinish: ({ message }) => {
      // Mark which conversation just finished streaming — scoped guard prevents
      // loadPreviousMessages from wiping rich tool UI parts for THIS conversation only
      const convId = conversationIdRef.current;
      justFinishedStreamRef.current = convId;
      setTimeout(() => {
        // Only clear if it's still the same conversation (user hasn't switched)
        if (justFinishedStreamRef.current === convId) {
          justFinishedStreamRef.current = null;
        }
      }, 3000); // Reduced from 8s — 3s is enough for the sidebar refresh cycle

      // Cache ALL message parts to localStorage so artifacts survive navigation/reload
      if (convId) {
        try {
          const partsCache: Record<string, any[]> = {};
          // Cache the just-finished message (always has the latest parts)
          if (message.parts && message.parts.length > 0) {
            partsCache[message.id] = message.parts;
          }
          // Also cache other messages with rich parts from the current stream
          // NOTE: streamMessages may be stale in this closure, so we prioritize `message`
          streamMessages.forEach((m: any) => {
            if (m.id !== message.id && m.parts && m.parts.length > 0) {
              const hasRichParts = m.parts.some((p: any) => p.type !== 'text');
              if (hasRichParts) {
                partsCache[m.id] = m.parts;
              }
            }
          });
          if (Object.keys(partsCache).length > 0) {
            // Merge with existing cache (don't overwrite old messages)
            try {
              const existing = JSON.parse(localStorage.getItem(`chat_parts_${convId}`) || '{}');
              localStorage.setItem(`chat_parts_${convId}`, JSON.stringify({ ...existing, ...partsCache }));
            } catch {
              localStorage.setItem(`chat_parts_${convId}`, JSON.stringify(partsCache));
            }
          }
        } catch {}
      }

      // Refresh conversation list sidebar (titles etc.) — but NOT message state
      loadConversations();
      // Voice mode: auto-speak assistant responses
      if (voiceMode && message.role === 'assistant') {
        const text = message.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text || '').join('') || '';
        if (text.trim()) speakText(text, message.id);
      }
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
    // experimental_throttle removed — v5-only option, not supported in AI SDK v6
  });

  const isStreaming = status === 'streaming' || status === 'submitted';

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
  };

  // Keep conversationIdRef in sync with selectedConversation state
  useEffect(() => {
    conversationIdRef.current = selectedConversation?.id || null;
  }, [selectedConversation]);

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => {
    if (selectedConversation) {
      // Skip loading messages if we just created this conversation (avoids clearing stream messages)
      if (skipNextLoadRef.current) {
        skipNextLoadRef.current = false;
        return;
      }
      loadPreviousMessages(selectedConversation.id);
    }
  }, [selectedConversation]);
  // Edge-compatible auto-scroll: use scrollTop instead of scrollIntoView for better compatibility
  useEffect(() => {
    if (messagesEndRef.current) {
      const scrollContainer = messagesEndRef.current.closest('[data-scroll-container]');
      if (scrollContainer) {
        // Use scrollTop for Edge compatibility (avoids scrollIntoView quirks)
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      } else {
        // Fallback: scrollIntoView with block:'end' for better Edge support
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
      }
    }
  }, [streamMessages]);
  useEffect(() => { if (chatError) setPageError(chatError.message); }, [chatError]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '56px';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  // Track whether initial conversations have been loaded (to distinguish initial load vs refresh)
  const initialLoadDoneRef = useRef(false);

  const loadConversations = async () => {
    try {
      const allData = await apiClient.getConversations();
      // FIXED: Explicitly filter for 'agent' type conversations (not default/afl/other types)
      const data = allData.filter((c: any) => c.conversation_type === 'agent' || !c.conversation_type);
      setConversations(data);

      // Auto-select first conversation if none is selected
      if (data.length > 0 && !conversationIdRef.current) {
        if (initialLoadDoneRef.current) {
          // This is a sidebar refresh (e.g., from onFinish) — skip loading messages
          // to avoid wiping tool UI parts that were just streamed
          skipNextLoadRef.current = true;
        }
        // On initial page load (initialLoadDoneRef.current === false), do NOT skip —
        // we WANT to load messages so the user sees their previous conversation
        setSelectedConversation(data[0]);
      }

      initialLoadDoneRef.current = true;
    } catch { setPageError('Failed to load conversations'); }
    finally { setLoadingConversations(false); }
  };

  const loadPreviousMessages = async (conversationId: string) => {
    // Guard: don't reload if streaming just finished for THIS conversation — would overwrite
    // rich tool UI parts with plain text from the backend. But allow loading OTHER conversations.
    if (justFinishedStreamRef.current === conversationId) {
      justFinishedStreamRef.current = null;
      return;
    }
    try {
      const data = await apiClient.getMessages(conversationId);

      // Load cached parts from localStorage (preserves artifacts/tool outputs across navigation)
      let cachedParts: Record<string, any[]> = {};
      try {
        const raw = localStorage.getItem(`chat_parts_${conversationId}`);
        if (raw) cachedParts = JSON.parse(raw);
      } catch {}

      setMessages(data.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content || '',
        // Priority: 1) cached parts from localStorage, 2) backend metadata.parts, 3) plain text fallback
        parts: cachedParts[m.id] || m.metadata?.parts || [{ type: 'text', text: m.content || '' }],
        createdAt: m.created_at ? new Date(m.created_at) : new Date(),
      })));
    } catch { setMessages([]); }
  };

  // Track whether we just created a new conversation (to skip re-loading messages)
  const skipNextLoadRef = useRef(false);
  // Track which conversation just finished streaming — prevents loadPreviousMessages from wiping tool UI parts
  // Stores the conversationId (not boolean) so it's scoped to the right conversation
  const justFinishedStreamRef = useRef<string | null>(null);

  const handleNewConversation = async () => {
    try {
      skipNextLoadRef.current = true; // Prevent loadPreviousMessages from running
      // FIXED: Always specify 'agent' as conversation type
      const newConv = await apiClient.createConversation('New Conversation', 'agent');
      setConversations(prev => [newConv, ...prev]);
      setSelectedConversation(newConv);
      conversationIdRef.current = newConv.id; // Sync ref immediately
      setMessages([]);
      setPageError('');
    } catch (err) { setPageError(err instanceof Error ? err.message : 'Failed'); }
  };

  const handleDeleteConversation = async (id: string) => {
    if (!confirm('Delete?')) return;
    try {
      await apiClient.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (selectedConversation?.id === id) { setSelectedConversation(null); setMessages([]); }
    } catch { setPageError('Failed to delete'); }
  };

  // Send message using v5 API: sendMessage({ text }, { body: { conversationId } })
  const doSend = async () => {
    if (!input.trim() || isStreaming) return;
    const text = input;
    setInput('');
    setPageError('');

    // Determine the conversationId to use
    let convId = selectedConversation?.id || conversationIdRef.current;

    // Auto-create conversation if needed
    if (!convId) {
      try {
        skipNextLoadRef.current = true; // Prevent loadPreviousMessages from clearing stream
        // FIXED: Always specify 'agent' as conversation type
        const conv = await apiClient.createConversation('New Conversation', 'agent');
        setConversations(prev => [conv, ...prev]);
        setSelectedConversation(conv);
        // Update ref SYNCHRONOUSLY so body() callback gets it immediately
        conversationIdRef.current = conv.id;
        convId = conv.id;
      } catch { setPageError('Failed to create conversation'); return; }
    }

    // v5 API: pass conversationId explicitly in sendMessage options
    // Per v5 docs: request-level options take precedence over hook-level options
    sendMessage({ text }, { body: { conversationId: convId } });
  };

  // Use AI SDK messages as single source of truth
  const allMessages = useMemo(() => streamMessages, [streamMessages]);
  const lastIdx = allMessages.length - 1;
  const userName = user?.name || 'You';

  // Simplified: Direct protocol handles deduplication better

  // Helper: Copy message text to clipboard
  const handleCopyMessage = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied!')).catch(() => toast.error('Copy failed'));
  }, []);

  // Handle artifact generation — store per conversation
  const handleDocumentGenerated = useCallback((artifact: any) => {
    const convId = conversationIdRef.current;
    if (convId) {
      setArtifactsByConv(prev => ({
        ...prev,
        [convId]: [...(prev[convId] || []), artifact],
      }));
    }
    toast.success('Document generated!');
  }, []);

  // Render a single message using AI Elements composable architecture
  const renderMessage = (message: any, idx: number) => {
    const parts = message.parts || [];
    const isLast = idx === lastIdx;
    const msgIsStreaming = isStreaming && isLast && message.role === 'assistant';
    const fullText = parts.filter((p: any) => p.type === 'text').map((p: any) => p.text || '').join('');
    // Detect multi-tool sequences for ChainOfThought display
    const toolParts = parts.filter((p: any) => p.type?.startsWith('tool-') || p.type === 'dynamic-tool');
    const hasMultipleTools = toolParts.length >= 2;
    // Collect source-url parts for Sources component
    const sourceParts = parts.filter((p: any) => p.type === 'source-url');
    const hasSources = sourceParts.length > 0;

    return (
      <AIMessage key={message.id} from={message.role}>
        {/* Sender label */}
        <div className={cn(
          "flex items-center gap-2 text-xs",
          message.role === 'user' ? "justify-end" : ""
        )}>
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
          {/* AI Elements: Sources collapsible list for source-url parts */}
          {hasSources && message.role === 'assistant' && !msgIsStreaming && (
            <Sources>
              <SourcesTrigger count={sourceParts.length} />
              <SourcesContent>
                {sourceParts.map((sourcePart: any, sIdx: number) => (
                  <Source
                    key={`source-${sIdx}`}
                    href={sourcePart.url}
                    title={sourcePart.title || new URL(sourcePart.url).hostname}
                  />
                ))}
              </SourcesContent>
            </Sources>
          )}

          {/* AI Elements: ChainOfThought summary for multi-tool sequences */}
          {hasMultipleTools && message.role === 'assistant' && !msgIsStreaming && (
            <ChainOfThought defaultOpen={false}>
              <ChainOfThoughtHeader>Used {toolParts.length} tools</ChainOfThoughtHeader>
              <ChainOfThoughtContent>
                {toolParts.map((tp: any, tIdx: number) => {
                  const tName = tp.type === 'dynamic-tool' ? (tp.toolName || 'unknown') : (tp.type?.replace('tool-', '') || 'unknown');
                  const tStatus = tp.state === 'output-available' ? 'complete' : tp.state === 'output-error' ? 'complete' : 'active';
                  return (
                    <ChainOfThoughtStep
                      key={`cot-${tIdx}`}
                      label={tName.replace(/_/g, ' ')}
                      status={tStatus}
                      description={tp.state === 'output-available' ? 'Completed' : tp.state === 'output-error' ? 'Error' : 'Running...'}
                    />
                  );
                })}
              </ChainOfThoughtContent>
            </ChainOfThought>
          )}

          {/* Render parts per v5 docs */}
          {parts.map((part: any, pIdx: number) => {
            switch (part.type) {
              case 'text':
                if (!part.text) return null;
                if (message.role === 'assistant') {
                  // Strip React code blocks from the markdown so they don't render as code.
                  // The InlineReactPreview shows them as live rendered previews instead.
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

              case 'source-url':
                // Now handled by Sources component above - skip individual rendering
                return null;

              // AI Elements: Step boundaries for multi-step tool flows
              case 'step-start':
                return pIdx > 0 ? (
                  <div key={pIdx} className="my-3 flex items-center gap-2 text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs">Step {pIdx}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                ) : null;

              case 'file':
                if (part.mediaType?.startsWith('image/') && part.base64) {
                  // Use AI Elements Image for base64-encoded generated images
                  return <AIImage key={pIdx} base64={part.base64} uint8Array={undefined as any} mediaType={part.mediaType} alt="Generated image" className="max-w-full rounded-lg mt-2" />;
                }
                if (part.mediaType?.startsWith('image/')) {
                  return <img key={pIdx} src={part.url} alt="Generated" className="max-w-full rounded-lg mt-2" />;
                }
                // Non-image files: display with AI Elements Attachments
                if (part.url || part.filename) {
                  return (
                    <Attachments key={pIdx} variant="inline">
                      <Attachment data={{ ...part, id: `file-${pIdx}`, type: 'file' as const }}>
                        <AttachmentPreview />
                        <AttachmentInfo showMediaType />
                      </Attachment>
                    </Attachments>
                  );
                }
                return null;

              // ===== GENERATIVE UI: Tool parts render as rich components =====
              // AI SDK v6: part.type === 'tool-${toolName}', part.state, part.output
              // States: input-streaming, input-available, output-available, output-error
              // Also handle dynamic-tool for tools without static types

              // Stock Data Tool
              case 'tool-get_stock_data':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="get_stock_data" input={part.input} />;
                  case 'output-available':
                    return <StockCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Stock data error: {part.errorText}</div>;
                  default: return null;
                }

              // Python Code Execution Tool
              case 'tool-execute_python':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="execute_python" input={part.input} />;
                  case 'output-available':
                    return <CodeExecution key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Code execution error: {part.errorText}</div>;
                  default: return null;
                }

              // Knowledge Base Search Tool
              case 'tool-search_knowledge_base':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="search_knowledge_base" input={part.input} />;
                  case 'output-available':
                    return <KnowledgeBaseResults key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>KB search error: {part.errorText}</div>;
                  default: return null;
                }

              // AFL Generate Tool
              case 'tool-generate_afl_code':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="generate_afl_code" input={part.input} />;
                  case 'output-available':
                    return <AFLGenerateCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>AFL generation error: {part.errorText}</div>;
                  default: return null;
                }

              // AFL Validate Tool
              case 'tool-validate_afl':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="validate_afl" input={part.input} />;
                  case 'output-available':
                    return <AFLValidateCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>AFL validation error: {part.errorText}</div>;
                  default: return null;
                }

              // AFL Debug Tool
              case 'tool-debug_afl_code':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="debug_afl_code" input={part.input} />;
                  case 'output-available':
                    return <AFLDebugCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>AFL debug error: {part.errorText}</div>;
                  default: return null;
                }

              // AFL Explain Tool
              case 'tool-explain_afl_code':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="explain_afl_code" input={part.input} />;
                  case 'output-available':
                    return <AFLExplainCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>AFL explain error: {part.errorText}</div>;
                  default: return null;
                }

              // AFL Sanity Check Tool
              case 'tool-sanity_check_afl':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="sanity_check_afl" input={part.input} />;
                  case 'output-available':
                    return <AFLSanityCheckCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>AFL sanity check error: {part.errorText}</div>;
                  default: return null;
                }

              // Web Search Tool (Claude built-in)
              case 'tool-web_search':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="web_search" input={part.input} />;
                  case 'output-available':
                    return <WebSearchResults key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Web search error: {part.errorText}</div>;
                  default: return null;
                }

              // ===== NEW GENERATIVE UI TOOLS =====

              // Live Stock Chart Tool
              case 'tool-get_stock_chart':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="get_stock_chart" input={part.input} />;
                  case 'output-available':
                    return <LiveStockChart key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Chart error: {part.errorText}</div>;
                  default: return null;
                }

              // Technical Analysis Tool
              case 'tool-technical_analysis':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="technical_analysis" input={part.input} />;
                  case 'output-available':
                    return <TechnicalAnalysis key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Technical analysis error: {part.errorText}</div>;
                  default: return null;
                }

              // Weather Tool
              case 'tool-get_weather':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="get_weather" input={part.input} />;
                  case 'output-available':
                    return <WeatherCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Weather error: {part.errorText}</div>;
                  default: return null;
                }

              // News Headlines Tool
              case 'tool-get_news':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="get_news" input={part.input} />;
                  case 'output-available':
                    return <NewsHeadlines key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>News error: {part.errorText}</div>;
                  default: return null;
                }

              // Data Chart Tool
              case 'tool-create_chart':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="create_chart" input={part.input} />;
                  case 'output-available':
                    return <DataChart key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Chart error: {part.errorText}</div>;
                  default: return null;
                }

              // Code Sandbox Tool
              case 'tool-code_sandbox':
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName="code_sandbox" input={part.input} />;
                  case 'output-available':
                    return <CodeSandbox key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error':
                    return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '12px', marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>Sandbox error: {part.errorText}</div>;
                  default: return null;
                }

              // ===== 10 NEW GENERATIVE UI TOOLS =====

              // Stock Screener
              case 'tool-screen_stocks':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="screen_stocks" input={part.input} />;
                  case 'output-available': return <StockScreener key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: '12px', color: '#DC2626', fontSize: '13px' }}>Screener error: {part.errorText}</div>;
                  default: return null;
                }

              // Stock Comparison
              case 'tool-compare_stocks':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="compare_stocks" input={part.input} />;
                  case 'output-available': return <StockComparison key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: '12px', color: '#DC2626', fontSize: '13px' }}>Compare error: {part.errorText}</div>;
                  default: return null;
                }

              // Sector Performance
              case 'tool-get_sector_performance':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="get_sector_performance" input={part.input} />;
                  case 'output-available': return <SectorPerformance key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: '12px', color: '#DC2626', fontSize: '13px' }}>Sector error: {part.errorText}</div>;
                  default: return null;
                }

              // Position Size Calculator
              case 'tool-calculate_position_size':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="calculate_position_size" input={part.input} />;
                  case 'output-available': return <PositionSizer key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: '12px', color: '#DC2626', fontSize: '13px' }}>Position size error: {part.errorText}</div>;
                  default: return null;
                }

              // Correlation Matrix
              case 'tool-get_correlation_matrix':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="get_correlation_matrix" input={part.input} />;
                  case 'output-available': return <CorrelationMatrix key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: '12px', color: '#DC2626', fontSize: '13px' }}>Correlation error: {part.errorText}</div>;
                  default: return null;
                }

              // Dividend Info
              case 'tool-get_dividend_info':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="get_dividend_info" input={part.input} />;
                  case 'output-available': return <DividendCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: '12px', color: '#DC2626', fontSize: '13px' }}>Dividend error: {part.errorText}</div>;
                  default: return null;
                }

              // Risk Metrics
              case 'tool-calculate_risk_metrics':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="calculate_risk_metrics" input={part.input} />;
                  case 'output-available': return <RiskMetrics key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: '12px', color: '#DC2626', fontSize: '13px' }}>Risk error: {part.errorText}</div>;
                  default: return null;
                }

              // Market Overview
              case 'tool-get_market_overview':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="get_market_overview" input={part.input} />;
                  case 'output-available': return <MarketOverview key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: '12px', color: '#DC2626', fontSize: '13px' }}>Market error: {part.errorText}</div>;
                  default: return null;
                }

              // Quick Backtest
              case 'tool-backtest_quick':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="backtest_quick" input={part.input} />;
                  case 'output-available': return <BacktestResults key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: '12px', color: '#DC2626', fontSize: '13px' }}>Backtest error: {part.errorText}</div>;
                  default: return null;
                }

              // Options Snapshot
              case 'tool-get_options_snapshot':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="get_options_snapshot" input={part.input} />;
                  case 'output-available': return <OptionsSnapshot key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: '12px', color: '#DC2626', fontSize: '13px' }}>Options error: {part.errorText}</div>;
                  default: return null;
                }

              // Create Word Document (DOCX)
              case 'tool-create_word_document':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="create_word_document" input={part.input} />;
                  case 'output-available': return <DocumentDownloadCard key={pIdx} output={typeof part.output === 'object' ? part.output : {}} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: '12px', color: '#DC2626', fontSize: '13px' }}>Document generation error: {part.errorText}</div>;
                  default: return null;
                }

              // Create PPTX with Skill (Enhanced Presentation)
              case 'tool-create_pptx_with_skill':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="create_pptx_with_skill" input={part.input} />;
                  case 'output-available': return <DocumentDownloadCard key={pIdx} output={typeof part.output === 'object' ? part.output : {}} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: '12px', color: '#DC2626', fontSize: '13px' }}>Presentation generation error: {part.errorText}</div>;
                  default: return null;
                }

              // Create Presentation (PowerPoint)
              case 'tool-create_presentation':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="create_presentation" input={part.input} />;
                  case 'output-available': return <PresentationCard key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: '12px', color: '#DC2626', fontSize: '13px' }}>Presentation error: {part.errorText}</div>;
                  default: return null;
                }

              // ===== 6 NEW LIFESTYLE / UTILITY GEN UI TOOLS =====

              // Live Sports Scores
              case 'tool-get_live_scores':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="get_live_scores" input={part.input} />;
                  case 'output-available': return <LiveSportsScores key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: '12px', color: '#DC2626', fontSize: '13px' }}>Scores error: {part.errorText}</div>;
                  default: return null;
                }

              // Search Trends
              case 'tool-get_search_trends':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="get_search_trends" input={part.input} />;
                  case 'output-available': return <SearchTrends key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: '12px', color: '#DC2626', fontSize: '13px' }}>Trends error: {part.errorText}</div>;
                  default: return null;
                }

              // LinkedIn Post
              case 'tool-create_linkedin_post':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="create_linkedin_post" input={part.input} />;
                  case 'output-available': return <LinkedInPost key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: '12px', color: '#DC2626', fontSize: '13px' }}>LinkedIn error: {part.errorText}</div>;
                  default: return null;
                }

              // Website Preview
              case 'tool-preview_website':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="preview_website" input={part.input} />;
                  case 'output-available': return <WebsitePreview key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: '12px', color: '#DC2626', fontSize: '13px' }}>Preview error: {part.errorText}</div>;
                  default: return null;
                }

              // Food Order
              case 'tool-order_food':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="order_food" input={part.input} />;
                  case 'output-available': return <FoodOrder key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: '12px', color: '#DC2626', fontSize: '13px' }}>Food order error: {part.errorText}</div>;
                  default: return null;
                }

              // Flight Tracker (track existing flight by number)
              case 'tool-track_flight':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="track_flight" input={part.input} />;
                  case 'output-available': return <FlightTracker key={pIdx} {...(typeof part.output === 'object' ? part.output : {})} />;
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: '12px', color: '#DC2626', fontSize: '13px' }}>Flight tracker error: {part.errorText}</div>;
                  default: return null;
                }

              // Flight Search (search for available flights — uses FlightSearchCard)
              case 'tool-search_flights':
              case 'tool-get_flights':
              case 'tool-find_flights':
                switch (part.state) {
                  case 'input-streaming': case 'input-available': return <ToolLoading key={pIdx} toolName="search_flights" input={part.input} />;
                  case 'output-available': {
                    const flightData = typeof part.output === 'object' ? part.output : {};
                    // FlightSearchCard expects { data: {...} }
                    return <FlightSearchCard key={pIdx} data={flightData as any} />;
                  }
                  case 'output-error': return <div key={pIdx} style={{ padding: '12px', backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: '12px', color: '#DC2626', fontSize: '13px' }}>Flight search error: {part.errorText}</div>;
                  default: return null;
                }

              // v6: Dynamic tools — use AI Elements Tool composable
              case 'dynamic-tool': {
                const dynToolName = part.toolName || 'unknown';
                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return <ToolLoading key={pIdx} toolName={dynToolName} input={part.input} />;
                  case 'output-available':
                    return (
                      <AITool key={pIdx}>
                        <ToolHeader type="dynamic-tool" state={part.state} toolName={dynToolName} />
                        <ToolContent>
                          <ToolInput input={part.input} />
                          <ToolOutput output={part.output} errorText={part.errorText} />
                        </ToolContent>
                      </AITool>
                    );
                  case 'output-error':
                    return (
                      <AITool key={pIdx}>
                        <ToolHeader type="dynamic-tool" state={part.state} toolName={dynToolName} />
                        <ToolContent>
                          <ToolOutput output={part.output} errorText={part.errorText} />
                        </ToolContent>
                      </AITool>
                    );
                  default: return null;
                }
              }

              // Fallback: Unknown tool types — use AI Elements Tool composable
              default:
                if (part.type?.startsWith('tool-')) {
                  const toolName = part.type.replace('tool-', '');
                  switch (part.state) {
                    case 'input-streaming':
                    case 'input-available':
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
                // Data parts (artifacts from backend via type code 2:)
                if (part.type?.startsWith('data-') && part.data) {
                  if (part.data.content && part.data.artifactType) {
                    const artType = part.data.artifactType;
                    const isRenderable = ['html', 'svg', 'react', 'jsx', 'tsx'].includes(artType);
                    const artLang = part.data.language || artType;
                    const artCode = part.data.content;

                    // For HTML/SVG: use WebPreview with live iframe + source code
                    if (isRenderable && artCode) {
                      const blobUrl = (() => {
                        try {
                          const htmlContent = artType === 'svg'
                            ? `<!DOCTYPE html><html><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:transparent">${artCode}</body></html>`
                            : artCode;
                          const blob = new Blob([htmlContent], { type: 'text/html' });
                          return URL.createObjectURL(blob);
                        } catch { return ''; }
                      })();

                      return (
                        <div key={pIdx} className="space-y-2">
                          {/* Live WebPreview */}
                          <WebPreview defaultUrl={blobUrl} className="h-[400px]">
                            <WebPreviewNavigation>
                              <span className="text-xs text-muted-foreground px-2 truncate flex-1">
                                {part.data.title || `${artType.toUpperCase()} Preview`}
                              </span>
                            </WebPreviewNavigation>
                            <WebPreviewBody />
                            <WebPreviewConsole />
                          </WebPreview>
                          {/* Source code with CodeBlock */}
                          <CodeBlock code={artCode} language={artLang as any} showLineNumbers>
                            <CodeBlockHeader>
                              <CodeBlockTitle>{part.data.title || artType}</CodeBlockTitle>
                              <CodeBlockActions>
                                <CodeBlockCopyButton />
                              </CodeBlockActions>
                            </CodeBlockHeader>
                          </CodeBlock>
                        </div>
                      );
                    }

                    // Non-renderable artifacts: Artifact card + ArtifactRenderer
                    return (
                      <Artifact key={pIdx}>
                        <ArtifactHeader>
                          <ArtifactTitle>{part.data.title || artType}</ArtifactTitle>
                        </ArtifactHeader>
                        <ArtifactContent>
                          <ArtifactRenderer artifact={{
                            id: part.data.id || `data-${pIdx}`,
                            type: artType,
                            language: artLang,
                            code: artCode,
                            complete: true,
                          }} />
                        </ArtifactContent>
                      </Artifact>
                    );
                  }
                }
                return null;
            }
          })}

          {/* Shimmer loading for submitted state */}
          {status === 'submitted' && isLast && message.role === 'assistant' && parts.every((p: any) => !p.text) && (
            <Shimmer duration={1.5}>Yang is Thinking...</Shimmer>
          )}
        </MessageContent>

        {/* DocumentGenerator for creating documents from assistant responses */}
        {message.role === 'assistant' && !msgIsStreaming && fullText && /\b(document|proposal|report|memo|letter|policy|guide|plan|summary|brief|outline|form|checklist)\b/i.test(fullText) && (
          <div style={{ marginTop: '12px' }}>
            <DocumentGenerator
              title="Generated Document"
              content={fullText}
              onDocumentGenerated={handleDocumentGenerated}
            />
          </div>
        )}

        {/* Message actions toolbar for assistant messages (copy, thumbs up/down) */}
        {message.role === 'assistant' && !msgIsStreaming && fullText && (
          <MessageActions className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MessageAction tooltip="Copy" onClick={() => handleCopyMessage(fullText)}>
              <CopyIcon className="size-3.5" />
            </MessageAction>
            <MessageAction tooltip="Helpful" onClick={() => toast.success('Thanks for the feedback!')}>
              <ThumbsUpIcon className="size-3.5" />
            </MessageAction>
            <MessageAction tooltip="Not helpful" onClick={() => toast.info('Feedback noted')}>
              <ThumbsDownIcon className="size-3.5" />
            </MessageAction>
          </MessageActions>
        )}
      </AIMessage>
    );
  };

  return (
    <div style={{ height: '100%', backgroundColor: colors.background, display: 'flex', overflow: 'hidden', position: 'relative' }}>
      {/* Sidebar */}
      <div style={{ width: sidebarCollapsed ? '0px' : '280px', backgroundColor: colors.sidebar, borderRight: sidebarCollapsed ? 'none' : `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', transition: 'width 0.3s ease', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px', borderBottom: `2px solid ${colors.primaryYellow}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDark ? 'rgba(254, 192, 15, 0.05)' : 'rgba(254, 192, 15, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={logo} alt="Logo" style={{ width: '32px', height: '32px' }} />
            <h2 style={{ fontFamily: "var(--font-rajdhani), 'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 700, color: colors.text, margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>CHATS</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Connection status indicator */}
            <div onClick={() => recheckConnection()} title={connStatus === 'connected' ? 'API Connected' : connStatus === 'disconnected' ? 'API Disconnected — click to retry' : 'Checking...'} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              {connStatus === 'connected' ? (
                <Wifi size={14} color="#22c55e" />
              ) : connStatus === 'disconnected' ? (
                <WifiOff size={14} color="#ef4444" />
              ) : (
                <Wifi size={14} color={colors.textMuted} style={{ opacity: 0.5 }} />
              )}
            </div>
            <button onClick={() => setSidebarCollapsed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <ChevronLeft size={16} color={colors.textMuted} />
            </button>
          </div>
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={handleNewConversation} style={{ width: '100%', padding: '12px', backgroundColor: colors.primaryYellow, border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700, color: colors.darkGray, fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif", fontSize: '14px', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(254, 192, 15, 0.2)' }} onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(254, 192, 15, 0.3)')} onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 2px 8px rgba(254, 192, 15, 0.2)')}>
            <Plus size={18} /> New Chat
          </button>
          {/* Search input */}
          <div style={{ position: 'relative' }}>
            <Search size={14} color={colors.textMuted} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              style={{ width: '100%', padding: '8px 10px 8px 32px', backgroundColor: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.text, fontSize: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif", transition: 'border-color 0.2s ease' }} onFocus={(e) => (e.currentTarget.style.borderColor = colors.primaryYellow)} onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
            />
            <style>{`
              input::placeholder {
                color: ${colors.textMuted};
                opacity: 0.7;
              }
            `}</style>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                <X size={12} color={colors.textMuted} />
              </button>
            )}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px', minHeight: 0 }}>
          {loadingConversations ? (
            <div className="space-y-3 px-2 py-4">
              {/* AI Elements: Shimmer skeleton for conversation list loading */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2">
                  <div className="w-4 h-4 rounded bg-muted animate-pulse" />
                  <Shimmer duration={2 + i * 0.3} className="text-xs">Loading conversations...</Shimmer>
                </div>
              ))}
            </div>
          ) : (() => {
            const filtered = searchQuery.trim()
              ? conversations.filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()))
              : conversations;
            if (filtered.length === 0 && searchQuery.trim()) {
              return <div style={{ textAlign: 'center', padding: '20px', color: colors.textMuted, fontSize: '12px' }}>No chats matching "{searchQuery}"</div>;
            }
            return filtered.map(conv => (
              <div key={conv.id} onClick={() => { if (renamingId !== conv.id) setSelectedConversation(conv); }} style={{ padding: '10px 12px', marginBottom: '4px', backgroundColor: selectedConversation?.id === conv.id ? 'rgba(254, 192, 15, 0.15)' : 'transparent', border: selectedConversation?.id === conv.id ? `2px solid ${colors.primaryYellow}` : '1px solid transparent', borderRadius: '10px', cursor: 'pointer', color: colors.text, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif", transition: 'all 0.2s ease' }} onMouseOver={(e) => selectedConversation?.id !== conv.id && (e.currentTarget.style.backgroundColor = isDark ? 'rgba(254, 192, 15, 0.05)' : 'rgba(254, 192, 15, 0.08)')} onMouseOut={(e) => selectedConversation?.id !== conv.id && (e.currentTarget.style.backgroundColor = 'transparent')}>
                <MessageSquare size={14} style={{ flexShrink: 0, color: selectedConversation?.id === conv.id ? colors.primaryYellow : colors.textMuted }} />
                {renamingId === conv.id ? (
                  /* Inline rename input */
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
                        // Persist to backend
                        apiClient.renameConversation(conv.id, newTitle).then(() => {
                          toast.success('Chat renamed');
                        }).catch(() => {
                          toast.error('Failed to save rename');
                        });
                      }
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    onBlur={() => {
                      const newTitle = renameValue || conv.title;
                      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, title: newTitle } : c));
                      if (selectedConversation?.id === conv.id) setSelectedConversation({ ...conv, title: newTitle });
                      setRenamingId(null);
                      // Persist to backend
                      apiClient.renameConversation(conv.id, newTitle).catch(() => { });
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

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', height: '100%' }}>
        {sidebarCollapsed && (
          <button onClick={() => setSidebarCollapsed(false)} style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 100, background: 'rgba(254, 192, 15, 0.3)', border: '1px solid rgba(254, 192, 15, 0.5)', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
            <ChevronRight size={18} color="#FEC00F" />
          </button>
        )}

        {/* AI Elements: Conversation with auto-scroll */}
        <div className="flex-1" style={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div data-scroll-container style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', backgroundColor: colors.background, color: colors.text } as React.CSSProperties}>
            <div className="max-w-[900px] mx-auto px-6 py-10" style={{ color: colors.text }}>
              {allMessages.length === 0 ? (
                <ConversationEmptyState
                  icon={<img src={logo} alt="Logo" className="w-20 opacity-30" />}
                  title="Welcome to Potomac Analyst Chat"
                  description="Advanced analysis and trading strategy guidance powered by Potomac"
                >
                  <div className="flex flex-col items-center gap-4" style={{ padding: '20px' }}>
                    <img src={logo} alt="Logo" className="w-24" style={{ filter: 'drop-shadow(0 4px 8px rgba(254, 192, 15, 0.2))' }} />
                    <div className="space-y-1 text-center">
                      <h3 style={{ fontFamily: "var(--font-rajdhani), 'Rajdhani', sans-serif", fontSize: '20px', fontWeight: 700, color: colors.primaryYellow, margin: '8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>WELCOME TO POTOMAC ANALYST CHAT</h3>
                      <p style={{ fontFamily: "var(--font-quicksand), 'Quicksand', sans-serif", fontSize: '14px', color: colors.textMuted, margin: '4px 0' }}>Advanced analysis and trading strategy guidance powered by Potomac</p>
                    </div>
                    {/* AI Elements: Quick Suggestions */}
                    <Suggestions className="justify-center mt-4">
                      <Suggestion suggestion="Generate a moving average crossover AFL" onClick={(s: string) => { setInput(s); }} />
                      <Suggestion suggestion="Explain RSI divergence strategy" onClick={(s: string) => { setInput(s); }} />
                      <Suggestion suggestion="Show me AAPL stock data" onClick={(s: string) => { setInput(s); }} />
                      <Suggestion suggestion="Search knowledge base for Bollinger Bands" onClick={(s: string) => { setInput(s); }} />
                    </Suggestions>
                    <p className="text-xs text-muted-foreground mt-2">Click a suggestion or type your own message below</p>
                  </div>
                </ConversationEmptyState>
              ) : (
                <>
                  <div className="flex flex-col gap-6">
                    {allMessages.map((msg, idx) => renderMessage(msg, idx))}
                  </div>

                  {/* Display generated artifacts */}
                  {artifacts.length > 0 && (
                    <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: `1px solid ${colors.border}` }}>
                      {artifacts.map((artifact) => (
                        <ArtifactRenderer
                          key={artifact.id}
                          artifact={artifact}
                          onClose={() => {
                            const convId = selectedConversation?.id;
                            if (convId) {
                              setArtifactsByConv(prev => ({
                                ...prev,
                                [convId]: (prev[convId] || []).filter(a => a.id !== artifact.id),
                              }));
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Submitted state — waiting for first token */}
                  {status === 'submitted' && allMessages.length > 0 && allMessages[allMessages.length - 1]?.role === 'user' && (
                    <AIMessage from="assistant">
                      <div className="flex items-center gap-2 text-xs">
                        <img src={logo} alt="Yang AI" className="w-5 h-5 rounded flex-shrink-0" />
                        <span className="font-semibold text-foreground">Yang</span>
                      </div>
                      <MessageContent>
                        <Shimmer duration={1.5}>Thinking...</Shimmer>
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
              <button onClick={() => setPageError('')} className="bg-transparent border-none text-destructive cursor-pointer text-lg">×</button>
            </div>
          </div>
        )}

        {/* AI Elements: PromptInput with file upload */}
        <div className="px-6 py-5" style={{
          flexShrink: 0,
          borderTop: `2px solid ${colors.primaryYellow}`,
          backgroundColor: isDark ? 'rgba(254, 192, 15, 0.03)' : 'rgba(254, 192, 15, 0.05)',
          transition: 'all 0.2s ease'
        }}>
          <div className="max-w-[900px] mx-auto">
            <TooltipProvider>
              <PromptInput
                accept=".pdf,.csv,.json,.txt,.afl,.doc,.docx,.xls,.xlsx,.pptx,.ppt,.png,.jpg,.jpeg,.gif,.mp3,.wav,.m4a"
                multiple
                globalDrop={false}
                maxFiles={10}
                maxFileSize={52428800}
                onError={(err) => {
                  if (err.code === 'max_file_size') {
                    toast.error('File too large (max 50MB)', { duration: 3000 });
                  } else if (err.code === 'max_files') {
                    toast.error('Too many files (max 10)', { duration: 3000 });
                  } else if (err.code === 'accept') {
                    toast.error('File type not supported', { duration: 3000 });
                  }
                }}
                onSubmit={async ({ text, files }: { text: string; files: any[] }) => {
                  if ((!text.trim() && files.length === 0) || isStreaming) return;
                  setInput('');
                  setPageError('');

                  let convId = selectedConversation?.id || conversationIdRef.current;
                  if (!convId) {
                    try {
                      skipNextLoadRef.current = true;
                      // FIXED: Always specify 'agent' as conversation type
                      const conv = await apiClient.createConversation('New Conversation', 'agent');
                      setConversations(prev => [conv, ...prev]);
                      setSelectedConversation(conv);
                      conversationIdRef.current = conv.id;
                      convId = conv.id;
                    } catch { setPageError('Failed to create conversation'); return; }
                  }

                  // Upload files first if any
                  let messageText = text;
                  if (files.length > 0) {
                    const token = getAuthToken();
                    const uploaded: string[] = [];

                    for (const file of files) {
                      const fileName = file.filename || 'upload';
                      try {
                        // Convert file URL (blob: or data:) to actual File object
                        let actualFile: File;
                        if (file.url?.startsWith('blob:')) {
                          const blob = await fetch(file.url).then(r => r.blob());
                          actualFile = new File([blob], fileName, { type: file.mediaType || 'application/octet-stream' });
                        } else if (file.url?.startsWith('data:')) {
                          // PromptInput converts blob URLs to data URLs — handle data: URIs
                          const resp = await fetch(file.url);
                          const blob = await resp.blob();
                          actualFile = new File([blob], fileName, { type: file.mediaType || blob.type || 'application/octet-stream' });
                        } else if (file.url) {
                          // Regular URL — try fetching it
                          const resp = await fetch(file.url);
                          const blob = await resp.blob();
                          actualFile = new File([blob], fileName, { type: file.mediaType || blob.type || 'application/octet-stream' });
                        } else {
                          toast.error(`Cannot upload ${fileName}: No file data`);
                          continue;
                        }

                        const toastId = toast.loading(`📤 Uploading ${fileName}...`, { duration: 10000 });
                        const formData = new FormData();
                        formData.append('file', actualFile);

                        try {
                          const controller = new AbortController();
                          const timeoutId = setTimeout(() => controller.abort(), 30000);

                          const resp = await fetch(`/api/upload?conversationId=${convId}`, {
                            method: 'POST',
                            headers: { 'Authorization': token ? `Bearer ${token}` : '' },
                            body: formData,
                            signal: controller.signal
                          });

                          clearTimeout(timeoutId);

                          if (!resp.ok) {
                            const errorData = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
                            throw new Error(errorData.error || `Upload failed with status ${resp.status}`);
                          }

                          const respData = await resp.json();
                          uploaded.push(fileName);

                          // Show special toast if .pptx was auto-registered as template
                          if (respData.is_template && respData.template_id) {
                            toast.success(`✅ ${fileName} registered as template (${respData.template_layouts} layouts)`, { id: toastId, duration: 6000 });
                            uploaded.push(`Template ID: ${respData.template_id}`);
                          } else {
                            toast.success(`✅ Uploaded ${fileName}`, { id: toastId });
                          }
                        } catch (err) {
                          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                          if (errorMsg.includes('AbortError') || errorMsg.includes('timeout')) {
                            toast.error(`⏱️ Upload timeout for ${fileName}`, { id: toastId });
                          } else {
                            toast.error(`❌ Failed to upload ${fileName}: ${errorMsg}`, { id: toastId });
                          }
                          console.error(`[v0] File upload error for ${fileName}:`, err);
                        }
                      } catch { }
                    }

                    // Add file references to message text
                    if (uploaded.length > 0) {
                      const fileList = uploaded.map(f => f.startsWith('🎨') ? f : `[file: ${f}]`).join('\n');
                      messageText = text.trim() ? `${text}\n\n${fileList}` : fileList;
                    }
                  }

                  sendMessage({ text: messageText }, { body: { conversationId: convId } });
                }}
              >
                {/* AI Elements: File attachment previews */}
                <AttachmentsDisplay />
                <PromptInputTextarea
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                  placeholder={isStreaming ? "Yang is responding..." : "Type a message to start chatting..."}
                  disabled={status !== 'ready' && status !== 'error'}
                />
                <PromptInputFooter>
                  <PromptInputTools>
                    {/* AI Elements: File attachment button */}
                    <AttachmentButton disabled={isStreaming} />

                    {/* Full Voice Mode (ChatGPT-style) */}
                    <PromptInputButton
                      tooltip="Voice conversation mode"
                      onClick={() => setVoiceModeOpen(true)}
                    >
                      <Volume2 className="size-4" />
                    </PromptInputButton>

                    {/* AI Elements: Voice dictation via Web Speech API / MediaRecorder fallback */}
                    <SpeechInput
                      size="icon-sm"
                      variant="ghost"
                      onTranscriptionChange={(text: string) => {
                        setInput(prev => {
                          const base = prev.trim();
                          return base ? `${base} ${text}` : text;
                        });
                      }}
                      onAudioRecorded={async (audioBlob: Blob) => {
                        // Fallback for Firefox/Safari: send audio to backend transcription
                        try {
                          const token = getAuthToken();
                          const convId = selectedConversation?.id || conversationIdRef.current || 'default';
                          const formData = new FormData();
                          formData.append('audio', audioBlob, 'recording.webm');
                          const resp = await fetch(`/api/upload?conversationId=${convId}`, {
                            method: 'POST',
                            headers: { 'Authorization': token ? `Bearer ${token}` : '' },
                            body: formData,
                          });
                          if (resp.ok) {
                            const data = await resp.json();
                            return data.transcript || '';
                          }
                        } catch {
                          toast.error('Voice transcription failed');
                        }
                        return '';
                      }}
                      lang="en-US"
                      disabled={isStreaming}
                    />
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

      {/* ChatGPT-style Voice Mode Overlay */}
      <VoiceMode
        isOpen={voiceModeOpen}
        onClose={() => setVoiceModeOpen(false)}
        onSendMessage={async (text) => {
          let convId = selectedConversation?.id || conversationIdRef.current;
          if (!convId) {
            try {
              skipNextLoadRef.current = true;
              // FIXED: Always specify 'agent' as conversation type
              const conv = await apiClient.createConversation('New Conversation', 'agent');
              setConversations(prev => [conv, ...prev]);
              setSelectedConversation(conv);
              conversationIdRef.current = conv.id;
              convId = conv.id;
            } catch { return; }
          }
          sendMessage({ text }, { body: { conversationId: convId } });
        }}
        lastAssistantText={(() => {
          const lastAssistant = [...allMessages].reverse().find(m => m.role === 'assistant');
          if (!lastAssistant) return '';
          const parts = lastAssistant.parts || [];
          return parts.filter((p: any) => p.type === 'text').map((p: any) => p.text || '').join('');
        })()}
        isStreaming={isStreaming}
        getAuthToken={getAuthToken}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1.0); } }
      `}</style>
    </div>
  );
}

export default ChatPage;

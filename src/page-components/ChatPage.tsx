'use client';

/**
 * ChatPage — Refactored from ~1500 lines to ~600 lines.
 * 
 * FIXES APPLIED:
 * 1. Added proper error handling for backend connection failures
 * 2. Graceful degradation when backend is unavailable
 * 3. Timeout handling for all API calls
 * 4. Better health check with exponential backoff
 * 5. AbortController cleanup to prevent memory leaks
 *
 * Extracted to dedicated modules:
 *   - Tool rendering  → src/components/chat/tool-registry.tsx   (eliminates 500-line switch)
 *   - Sidebar         → src/components/chat/ChatSidebar.tsx
 *   - File preview    → src/components/chat/ChatFilePreviewModal.tsx
 *   - KB panel        → src/components/chat/KnowledgeBasePanel.tsx
 *   - Utilities       → src/components/chat/chat-utils.ts
 *   - Message cache   → src/hooks/useMessageCache.ts
 *   - TTS             → src/hooks/useTTS.ts
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUpFromLine, ChevronRight, RefreshCw,
  CopyIcon, ThumbsUpIcon, ThumbsDownIcon, Eye, Volume2,
  FileText as FileTextIcon, FileCode as FileCodeIcon,
  FileSpreadsheet as FileSpreadsheetIcon, File as FileIconLucide,
} from 'lucide-react';
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
import { useProcessManager } from '@/contexts/ProcessManager';
import { ArtifactRenderer } from '@/components/artifacts';
import { useMessageCache } from '@/hooks/useMessageCache';
import { useTTS } from '@/hooks/useTTS';

// ── Chat module barrel ────────────────────────────────────────────────────────
import {
  ChatSidebar,
  ChatFilePreviewModal,
  KnowledgeBasePanel,
  renderToolPart,
  isToolPart,
  getAuthToken,
  stripSystemInstructions,
  getFileChipColor,
  getFileExtension,
  formatChatFileSize,
  getChatColors,
  getProcessType,
  getToolTitle,
  type ChatPreviewFile,
} from '@/components/chat';

// ── AI Elements ───────────────────────────────────────────────────────────────
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion';
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning';
import { Shimmer } from '@/components/ai-elements/shimmer';
import {
  Conversation as AIConversation,
  ConversationEmptyState,
} from '@/components/ai-elements/conversation';
import {
  Message as AIMessage, MessageContent, MessageActions, MessageAction,
  MessageResponse,
} from '@/components/ai-elements/message';
import {
  CodeBlock, CodeBlockHeader, CodeBlockTitle, CodeBlockActions, CodeBlockCopyButton,
} from '@/components/ai-elements/code-block';
import {
  PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputHeader,
  PromptInputTools, PromptInputButton, PromptInputSubmit,
  usePromptInputAttachments, PromptInputActionAddAttachments,
} from '@/components/ai-elements/prompt-input';
import { Attachments, Attachment, AttachmentPreview, AttachmentRemove } from '@/components/ai-elements/attachments';
import { Sources, SourcesTrigger, SourcesContent, Source } from '@/components/ai-elements/sources';
import {
  Artifact, ArtifactHeader, ArtifactTitle, ArtifactContent,
} from '@/components/ai-elements/artifact';
import { DocumentGenerator } from '@/components/ai-elements/document-generator';
import DocumentDownloadCard from '@/components/ai-elements/document-download-card';
import { ChainOfThought, ChainOfThoughtHeader, ChainOfThoughtContent, ChainOfThoughtStep } from '@/components/ai-elements/chain-of-thought';
import { SpeechInput } from '@/components/ai-elements/speech-input';
import {
  WebPreview, WebPreviewNavigation, WebPreviewBody, WebPreviewConsole,
} from '@/components/ai-elements/web-preview';
import { Image as AIImage } from '@/components/ai-elements/image';
import VoiceMode from '@/components/VoiceMode';
import { InlineReactPreview, stripReactCodeBlocks } from '@/components/InlineReactPreview';
import PersistentGenerationCard from '@/components/generative-ui/PersistentGenerationCard';
import { Database } from 'lucide-react';

const logo = '/potomac-icon.png';

// ─── Utility: Fetch with timeout ─────────────────────────────────────────────
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ─── Local attachment display sub-components ─────────────────────────────────

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
  return (
    <PromptInputButton
      onClick={() => { if (!disabled) attachments.openFileDialog(); }}
      disabled={disabled}
      tooltip="Attach files (PDF, CSV, JSON, Images, Docs, etc.)"
    >
      <ArrowUpFromLine className="size-4" />
    </PromptInputButton>
  );
}

// ─── Main ChatPage Component ──────────────────────────────────────────────────

export function ChatPage() {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const isDark = resolvedTheme === 'dark';
  const colors = getChatColors(isDark);

  // ── Core state ─────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationType | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const [pageError, setPageError] = useState('');
  const [previewChatFile, setPreviewChatFile] = useState<ChatPreviewFile | null>(null);
  const [input, setInput] = useState('');
  const [artifactsByConv, setArtifactsByConv] = useState<Record<string, any[]>>({});
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceModeOpen, setVoiceModeOpen] = useState(false);
  const [kbPanelOpen, setKbPanelOpen] = useState(false);
  const [selectedKbDocIds, setSelectedKbDocIds] = useState<Set<string>>(new Set());
  const [backendAvailable, setBackendAvailable] = useState(true);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { status: connStatus, check: recheckConnection } = useConnectionStatus({ interval: 60000 });
  const { addProcess, updateProcess } = useProcessManager();
  const { isSpeaking, speakText, stopSpeaking } = useTTS();
  const { saveToCache, loadFromCache, loadPartsCache, savePartsToCache } = useMessageCache();

  // ── Refs ───────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileBlobCacheRef = useRef<Map<string, ChatPreviewFile>>(new Map());
  const conversationIdRef = useRef<string | null>(null);
  const skipNextLoadRef = useRef(false);
  const justFinishedStreamRef = useRef<string | null>(null);
  const streamingConvRef = useRef<string | null>(null);
  const trackedToolsRef = useRef<Map<string, string>>(new Map());
  const initialLoadDoneRef = useRef(false);
  const healthCheckAbortControllerRef = useRef<AbortController | null>(null);

  const artifacts = selectedConversation ? (artifactsByConv[selectedConversation.id] || []) : [];

  // ── Health check with proper error handling and cleanup ────────────────────
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const checkHealth = async () => {
      // Cancel any previous health check
      if (healthCheckAbortControllerRef.current) {
        healthCheckAbortControllerRef.current.abort();
      }
      
      healthCheckAbortControllerRef.current = new AbortController();
      
      try {
        const response = await fetchWithTimeout(
          '/api/health',
          {
            signal: healthCheckAbortControllerRef.current.signal,
            headers: { 'Cache-Control': 'no-cache' },
          },
          5000 // 5 second timeout
        );
        
        if (response.ok) {
          setBackendAvailable(true);
          retryCount = 0; // Reset retry count on success
        } else {
          setBackendAvailable(false);
        }
      } catch (error: any) {
        // Only log if it's not an abort
        if (error.name !== 'AbortError') {
          console.warn('Backend health check failed:', error.message || 'Connection refused');
          setBackendAvailable(false);
          
          // Exponential backoff for retries
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(checkHealth, Math.min(1000 * Math.pow(2, retryCount), 30000));
          }
        }
      }
    };

    // Initial check
    checkHealth();
    
    // Regular interval check (every 60 seconds)
    const interval = setInterval(checkHealth, 60000);

    return () => {
      clearInterval(interval);
      if (healthCheckAbortControllerRef.current) {
        healthCheckAbortControllerRef.current.abort();
      }
    };
  }, []);

  // ── AI SDK useChat ─────────────────────────────────────────────────────────
  const {
    messages: streamMessages, sendMessage, status, stop,
    error: chatError, setMessages, regenerate,
  } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      headers: () => {
        const token = getAuthToken();
        return { Authorization: token ? `Bearer ${token}` : '' };
      },
      body: () => ({ conversationId: conversationIdRef.current }),
    }),
    onFinish: ({ message }) => {
      const convId = conversationIdRef.current;
      justFinishedStreamRef.current = convId;
      setTimeout(() => {
        if (justFinishedStreamRef.current === convId) justFinishedStreamRef.current = null;
      }, 30000);

      if (convId) savePartsToCache(convId, [...streamMessages, message]);

      loadConversations();
      if (voiceMode && message.role === 'assistant') {
        const text = message.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text || '').join('') || '';
        if (text.trim()) speakText(text, message.id);
      }
    },
    onError: (error) => {
      const msg = error.message || 'An error occurred';
      setPageError(msg);
      
      // Check if it's a connection error
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('ECONNREFUSED')) {
        setBackendAvailable(false);
        toast.error('Connection Error', {
          description: 'Unable to reach the backend server. Please check if the server is running.',
          duration: 8000,
        });
      } else {
        toast.error('Chat Error', {
          description: msg,
          action: { label: 'Retry', onClick: () => regenerate() },
          duration: 8000,
        });
      }
    },
  });

  const isStreaming = status === 'streaming' || status === 'submitted';

  // ── Sync conversationIdRef ─────────────────────────────────────────────────
  useEffect(() => {
    conversationIdRef.current = selectedConversation?.id || null;
  }, [selectedConversation]);

  // ── Streaming conv tracking ────────────────────────────────────────────────
  useEffect(() => {
    if (isStreaming) {
      streamingConvRef.current = conversationIdRef.current;
    } else {
      const convId = streamingConvRef.current;
      setTimeout(() => {
        if (streamingConvRef.current === convId && !isStreaming) streamingConvRef.current = null;
      }, 2000);
    }
  }, [isStreaming]);

  // ── Message cache sync (live during streaming) ─────────────────────────────
  useEffect(() => {
    const convId = conversationIdRef.current;
    if (convId && streamMessages.length > 0) saveToCache(convId, streamMessages);
  }, [streamMessages, saveToCache]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
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

  // ── On mount ───────────────────────────────────────────────────────────────
  useEffect(() => { loadConversations(); }, []);

  // ── Load messages when conversation changes ────────────────────────────────
  useEffect(() => {
    if (selectedConversation) {
      if (skipNextLoadRef.current) { skipNextLoadRef.current = false; return; }
      loadPreviousMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // ── Process Manager sync ───────────────────────────────────────────────────
  useEffect(() => {
    if (streamMessages.length === 0) return;
    for (const msg of streamMessages) {
      if (msg.role !== 'assistant' || !msg.parts) continue;
      for (let pIdx = 0; pIdx < msg.parts.length; pIdx++) {
        const part = msg.parts[pIdx] as any;
        if (!isToolPart(part.type)) continue;

        const toolName = part.type === 'dynamic-tool'
          ? (part.toolName || 'unknown')
          : (part.type?.replace('tool-', '') || 'unknown');

        const toolKey = `${msg.id}_${pIdx}_${toolName}`;
        const isActive = part.state === 'input-streaming' || part.state === 'input-available';
        const isDone = part.state === 'output-available';
        const isFailed = part.state === 'output-error';

        if (isActive && !trackedToolsRef.current.has(toolKey)) {
          const processId = addProcess({
            title: getToolTitle(toolName, part.input),
            type: getProcessType(toolName),
            status: 'running',
            progress: 0,
            message: `Running ${toolName.replace(/_/g, ' ')}...`,
            conversationId: conversationIdRef.current || undefined,
          });
          trackedToolsRef.current.set(toolKey, processId);
        } else if (isDone && trackedToolsRef.current.has(toolKey)) {
          updateProcess(trackedToolsRef.current.get(toolKey)!, { status: 'complete', progress: 100, message: 'Completed', result: part.output });
          trackedToolsRef.current.delete(toolKey);
        } else if (isFailed && trackedToolsRef.current.has(toolKey)) {
          updateProcess(trackedToolsRef.current.get(toolKey)!, { status: 'failed', progress: 0, message: 'Failed', error: part.errorText });
          trackedToolsRef.current.delete(toolKey);
        }
      }
    }
  }, [streamMessages, addProcess, updateProcess]);

  // ── Conversation CRUD with improved error handling ─────────────────────────
  const loadConversations = async () => {
    try {
      const allData = await apiClient.getConversations();
      const data = allData.filter((c: any) => c.conversation_type === 'agent' || !c.conversation_type);
      setConversations(data);

      const navigateToConvId = sessionStorage.getItem('pm_navigate_to_conv');
      if (navigateToConvId) {
        sessionStorage.removeItem('pm_navigate_to_conv');
        const target = data.find((c: any) => c.id === navigateToConvId);
        if (target) { setSelectedConversation(target); initialLoadDoneRef.current = true; setLoadingConversations(false); return; }
      }

      if (data.length > 0 && !conversationIdRef.current) {
        if (initialLoadDoneRef.current) skipNextLoadRef.current = true;
        setSelectedConversation(data[0]);
      }
      initialLoadDoneRef.current = true;
    } catch (error: any) {
      console.error('Failed to load conversations:', error);
      setPageError('Failed to load conversations');
      // Set backend as unavailable if it's a connection error
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        setBackendAvailable(false);
      }
    }
    finally { setLoadingConversations(false); }
  };

  const loadPreviousMessages = async (conversationId: string) => {
    if (justFinishedStreamRef.current === conversationId) { justFinishedStreamRef.current = null; return; }

    // Save current streaming messages before switching
    const prevConvId = streamingConvRef.current;
    if (prevConvId && prevConvId !== conversationId && streamMessages.length > 0) {
      saveToCache(prevConvId, streamMessages);
    }

    if (isStreaming && streamingConvRef.current === conversationId) {
      const cached = loadFromCache(conversationId);
      if (cached && cached.length > 0) setMessages(cached as any);
      return;
    }

    // Instant cache load — prevents blank screen
    const cached = loadFromCache(conversationId);
    if (cached && cached.length > 0) setMessages(cached as any);

    // Background refresh with error handling
    try {
      const data = await apiClient.getMessages(conversationId);
      if (conversationIdRef.current !== conversationId) return;

      const cachedParts = loadPartsCache(conversationId);
      const newMessages = data.map((m: any) => ({
        id: m.id, role: m.role, content: m.content || '',
        parts: cachedParts[m.id] || m.metadata?.parts || [{ type: 'text', text: m.content || '' }],
        createdAt: m.created_at ? new Date(m.created_at) : new Date(),
      }));

      if (newMessages.length > 0) {
        setMessages(newMessages as any);
        saveToCache(conversationId, newMessages);
      }
    } catch (error: any) {
      console.warn('Failed to load messages:', error);
      if (!cached || cached.length === 0) setMessages([]);
      // Set backend as unavailable if it's a connection error
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        setBackendAvailable(false);
      }
    }
  };

  const handleNewConversation = async () => {
    try {
      skipNextLoadRef.current = true;
      const newConv = await apiClient.createConversation('New Conversation', 'agent');
      setConversations((prev) => [newConv, ...prev]);
      setSelectedConversation(newConv);
      conversationIdRef.current = newConv.id;
      setMessages([]);
      setPageError('');
      setBackendAvailable(true); // Successfully created, so backend is available
    } catch (err: any) {
      console.error('Failed to create conversation:', err);
      setPageError(err instanceof Error ? err.message : 'Failed');
      if (err.message?.includes('fetch') || err.message?.includes('network')) {
        setBackendAvailable(false);
        toast.error('Cannot create conversation: Backend server is unavailable');
      }
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (!confirm('Delete?')) return;
    try {
      await apiClient.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (selectedConversation?.id === id) { setSelectedConversation(null); setMessages([]); }
    } catch (error: any) {
      console.error('Failed to delete conversation:', error);
      setPageError('Failed to delete');
    }
  };

  const handleCopyMessage = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied!')).catch(() => toast.error('Copy failed'));
  }, []);

  const handleDocumentGenerated = useCallback((artifact: any) => {
    const convId = conversationIdRef.current;
    if (convId) setArtifactsByConv((prev) => ({ ...prev, [convId]: [...(prev[convId] || []), artifact] }));
    toast.success('Document generated!');
  }, []);

  const allMessages = useMemo(() => streamMessages, [streamMessages]);
  const lastIdx = allMessages.length - 1;
  const userName = user?.name || 'You';

  // ── Ensure a conversation exists before sending ────────────────────────────
  const ensureConversation = async (): Promise<string | null> => {
    let convId = selectedConversation?.id || conversationIdRef.current;
    if (!convId) {
      try {
        skipNextLoadRef.current = true;
        const conv = await apiClient.createConversation('New Conversation', 'agent');
        setConversations((prev) => [conv, ...prev]);
        setSelectedConversation(conv);
        conversationIdRef.current = conv.id;
        convId = conv.id;
        setBackendAvailable(true); // Successfully created
      } catch (error: any) {
        console.error('Failed to create conversation:', error);
        setPageError('Failed to create conversation');
        if (error.message?.includes('fetch') || error.message?.includes('network')) {
          setBackendAvailable(false);
        }
        return null;
      }
    }
    return convId;
  };

  // ── renderMessage ─────────────────────────────────────────────────────────
  // The key improvement: tool parts now delegate to the registry (tool-registry.tsx)
  // instead of a 500-line switch statement.
  const renderMessage = (message: any, idx: number) => {
    const parts = message.parts || [];
    const isLast = idx === lastIdx;
    const msgIsStreaming = isStreaming && isLast && message.role === 'assistant';
    const fullText = parts.filter((p: any) => p.type === 'text').map((p: any) => p.text || '').join('');
    const toolParts = parts.filter((p: any) => isToolPart(p.type));
    const hasMultipleTools = toolParts.length >= 2;
    const sourceParts = parts.filter((p: any) => p.type === 'source-url');
    const hasSources = sourceParts.length > 0;

    return (
      <AIMessage key={message.id} from={message.role}>
        {/* Sender label */}
        <div className={cn('flex items-center gap-2 text-xs', message.role === 'user' ? 'justify-end' : '')}>
          {message.role === 'user' ? (
            <>
              <span className="font-medium text-muted-foreground">{userName}</span>
              {message.createdAt && (
                <span className="text-muted-foreground/60">
                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </>
          ) : (
            <>
              <img src={logo} alt="Yang AI" className="w-5 h-5 rounded flex-shrink-0" />
              <span className="font-semibold text-foreground">Yang</span>
              {message.createdAt && (
                <span className="text-muted-foreground/60">
                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {msgIsStreaming && <Shimmer duration={1.5}>Streaming...</Shimmer>}
            </>
          )}
        </div>

        <MessageContent>
          {/* Sources */}
          {hasSources && message.role === 'assistant' && !msgIsStreaming && (
            <Sources>
              <SourcesTrigger count={sourceParts.length} />
              <SourcesContent>
                {sourceParts.map((sp: any, sIdx: number) => (
                  <Source key={sIdx} href={sp.url} title={sp.title || new URL(sp.url).hostname} />
                ))}
              </SourcesContent>
            </Sources>
          )}

          {/* ChainOfThought for multi-tool sequences */}
          {hasMultipleTools && message.role === 'assistant' && !msgIsStreaming && (
            <ChainOfThought defaultOpen={false}>
              <ChainOfThoughtHeader>Used {toolParts.length} tools</ChainOfThoughtHeader>
              <ChainOfThoughtContent>
                {toolParts.map((tp: any, tIdx: number) => {
                  const tName = tp.type === 'dynamic-tool' ? (tp.toolName || 'unknown') : (tp.type?.replace('tool-', '') || 'unknown');
                  const tStatus = tp.state === 'output-available' ? 'complete' : tp.state === 'output-error' ? 'complete' : 'active';
                  return (
                    <ChainOfThoughtStep
                      key={tIdx}
                      label={tName.replace(/_/g, ' ')}
                      status={tStatus}
                      description={tp.state === 'output-available' ? 'Completed' : tp.state === 'output-error' ? 'Error' : 'Running...'}
                    />
                  );
                })}
              </ChainOfThoughtContent>
            </ChainOfThought>
          )}

          {/* Parts */}
          {parts.map((part: any, pIdx: number) => {
            // ── Tool parts → registry (replaces the entire 500-line switch) ──
            if (isToolPart(part.type)) {
              return renderToolPart(part, pIdx, message.id, conversationIdRef.current);
            }

            switch (part.type) {
              case 'text': {
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
                // User message — strip system instructions + render file chips
                const rawText = stripSystemInstructions(part.text);
                if (!rawText) return null;
                const fileRefPattern = /\[(?:uploaded\s+)?file:\s*([^\]]+)\]/gi;
                const fileRefs: string[] = [];
                let match;
                while ((match = fileRefPattern.exec(rawText)) !== null) fileRefs.push(match[1].trim());
                const cleanText = rawText
                  .replace(/\[(?:uploaded\s+)?file:\s*[^\]]+\]/gi, '')
                  .replace(/Please analyse the uploaded file\(s\):[^\n]*/gi, '')
                  .replace(/\n{3,}/g, '\n\n').trim();

                return (
                  <React.Fragment key={pIdx}>
                    {fileRefs.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: cleanText ? '8px' : 0 }}>
                        {fileRefs.map((filename, fIdx) => {
                          const ext = getFileExtension(filename);
                          const chipColor = getFileChipColor(ext);
                          const IconComp = ['doc','docx','pdf','rtf'].includes(ext) ? FileTextIcon
                            : ['xls','xlsx','csv'].includes(ext) ? FileSpreadsheetIcon
                            : ['json','xml','html','md'].includes(ext) ? FileCodeIcon
                            : FileIconLucide;
                          return (
                            <button
                              key={fIdx}
                              onClick={() => { const cached = fileBlobCacheRef.current.get(filename); setPreviewChatFile(cached || { filename }); }}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px', border: `1px solid ${chipColor}40`, backgroundColor: `${chipColor}18`, cursor: 'pointer', maxWidth: '280px' }}
                            >
                              <div style={{ width: 32, height: 32, borderRadius: 7, backgroundColor: `${chipColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconComp size={16} color={chipColor} />
                              </div>
                              <div style={{ textAlign: 'left', minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: isDark ? '#E8E8E8' : '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{filename}</p>
                                <p style={{ margin: 0, fontSize: 11, color: isDark ? '#9E9E9E' : '#666' }}>{ext.toUpperCase()} · Click to preview</p>
                              </div>
                              <Eye size={13} color={chipColor} style={{ flexShrink: 0, opacity: 0.7 }} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {cleanText && (
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed" style={{ color: isDark ? '#E8E8E8' : '#1A1A1A', margin: 0 }}>
                        {cleanText}
                      </p>
                    )}
                  </React.Fragment>
                );
              }

              case 'reasoning':
                return (
                  <Reasoning key={pIdx} isStreaming={msgIsStreaming} defaultOpen={msgIsStreaming}>
                    <ReasoningTrigger />
                    <ReasoningContent>{part.text || ''}</ReasoningContent>
                  </Reasoning>
                );

              case 'source-url':
                return null; // handled by Sources component above

              case 'step-start':
                return pIdx > 0 ? (
                  <div key={pIdx} className="my-3 flex items-center gap-2 text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs">Step {pIdx}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                ) : null;

              case 'file': {
                if (part.mediaType?.startsWith('image/') && part.base64) {
                  return (
                    <div key={pIdx} style={{ cursor: 'pointer', display: 'inline-block' }}
                      onClick={() => setPreviewChatFile({ url: `data:${part.mediaType};base64,${part.base64}`, filename: part.filename || 'image.png', mediaType: part.mediaType })}>
                      <AIImage base64={part.base64} uint8Array={undefined as any} mediaType={part.mediaType} alt="Image" className="max-w-full rounded-lg mt-2" />
                    </div>
                  );
                }
                if (part.url || part.filename || part.fileId) {
                  const fileExt = getFileExtension(part.filename || '');
                  const chipColor = getFileChipColor(fileExt);
                  return (
                    <button key={pIdx}
                      onClick={() => setPreviewChatFile({ url: part.url, fileId: part.fileId, filename: part.filename || 'file', mediaType: part.mediaType, size: part.size })}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px', border: `1px solid ${chipColor}30`, backgroundColor: `${chipColor}10`, cursor: 'pointer', marginTop: '6px' }}>
                      <FileTextIcon size={16} color={chipColor} />
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: isDark ? '#E8E8E8' : '#1A1A1A' }}>{part.filename || 'Attachment'}</p>
                        {part.size && <p style={{ margin: 0, fontSize: 11, color: isDark ? '#9E9E9E' : '#666' }}>{formatChatFileSize(part.size)} · {fileExt.toUpperCase()}</p>}
                      </div>
                      <Eye size={14} color={chipColor} style={{ opacity: 0.7 }} />
                    </button>
                  );
                }
                return null;
              }

              case 'data-file-download':
                if (part.data) {
                  return (
                    <DocumentDownloadCard key={pIdx} output={{
                      document_id: part.data.file_id || part.data.document_id,
                      filename: part.data.filename,
                      download_url: part.data.download_url,
                      doc_type: part.data.file_type || part.data.doc_type,
                      file_size_kb: part.data.size_kb || part.data.file_size_kb,
                      tool: part.data.tool_name || part.data.tool,
                      title: part.data.filename || part.data.title || 'Generated File',
                      success: true,
                    }} />
                  );
                }
                return null;

              default:
                // data-* artifact parts from backend
                if (part.type?.startsWith('data-') && part.data?.content && part.data?.artifactType) {
                  const { artifactType: artType, content: artCode, language, title } = part.data;
                  const artLang = language || artType;
                  const isRenderable = ['html','svg','react','jsx','tsx'].includes(artType);
                  if (isRenderable && artCode) {
                    const blobUrl = (() => {
                      try {
                        const html = artType === 'svg'
                          ? `<!DOCTYPE html><html><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh">${artCode}</body></html>`
                          : artCode;
                        return URL.createObjectURL(new Blob([html], { type: 'text/html' }));
                      } catch { return ''; }
                    })();
                    return (
                      <div key={pIdx} className="space-y-2">
                        <WebPreview defaultUrl={blobUrl} className="h-[400px]">
                          <WebPreviewNavigation>
                            <span className="text-xs text-muted-foreground px-2 truncate flex-1">{title || `${artType.toUpperCase()} Preview`}</span>
                          </WebPreviewNavigation>
                          <WebPreviewBody />
                          <WebPreviewConsole />
                        </WebPreview>
                        <CodeBlock code={artCode} language={artLang as any} showLineNumbers>
                          <CodeBlockHeader>
                            <CodeBlockTitle>{title || artType}</CodeBlockTitle>
                            <CodeBlockActions><CodeBlockCopyButton /></CodeBlockActions>
                          </CodeBlockHeader>
                        </CodeBlock>
                      </div>
                    );
                  }
                  return (
                    <Artifact key={pIdx}>
                      <ArtifactHeader><ArtifactTitle>{title || artType}</ArtifactTitle></ArtifactHeader>
                      <ArtifactContent>
                        <ArtifactRenderer artifact={{ id: part.data.id || `data-${pIdx}`, type: artType, language: artLang, code: artCode, complete: true }} />
                      </ArtifactContent>
                    </Artifact>
                  );
                }
                return null;
            }
          })}

          {/* Shimmer for submitted state */}
          {status === 'submitted' && isLast && message.role === 'assistant' && parts.every((p: any) => !p.text) && (
            <Shimmer duration={1.5}>Yang is Thinking...</Shimmer>
          )}
        </MessageContent>

        {/* DocumentGenerator for long-form content */}
        {message.role === 'assistant' && !msgIsStreaming && fullText &&
          /\b(document|proposal|report|memo|letter|policy|guide|plan|summary|brief|outline)\b/i.test(fullText) && (
          <div style={{ marginTop: 12 }}>
            <DocumentGenerator title="Generated Document" content={fullText} onDocumentGenerated={handleDocumentGenerated} />
          </div>
        )}

        {/* Message action toolbar */}
        {message.role === 'assistant' && !msgIsStreaming && fullText && (
          <MessageActions className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MessageAction tooltip="Copy" onClick={() => handleCopyMessage(fullText)}><CopyIcon className="size-3.5" /></MessageAction>
            <MessageAction tooltip="Helpful" onClick={() => toast.success('Thanks!')}><ThumbsUpIcon className="size-3.5" /></MessageAction>
            <MessageAction tooltip="Not helpful" onClick={() => toast.info('Noted')}><ThumbsDownIcon className="size-3.5" /></MessageAction>
          </MessageActions>
        )}
      </AIMessage>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100%', backgroundColor: colors.background, display: 'flex', overflow: 'hidden', position: 'relative' }}>

      {/* ── Backend unavailable warning banner ────────────────────────────────── */}
      {!backendAvailable && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: '#FEC00F',
            color: '#1A1A1A',
            padding: '12px 20px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          ⚠️ Backend server is unavailable. Please start the server on port 8000.
          <button
            onClick={() => {
              setBackendAvailable(true);
              recheckConnection();
            }}
            style={{
              marginLeft: '16px',
              padding: '4px 12px',
              backgroundColor: '#1A1A1A',
              color: '#FEC00F',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* ── Sidebar (extracted component) ─────────────────────────────────── */}
      <ChatSidebar
        conversations={conversations}
        selectedConversation={selectedConversation}
        loadingConversations={loadingConversations}
        sidebarCollapsed={sidebarCollapsed}
        isDark={isDark}
        colors={colors}
        connStatus={connStatus}
        onSelectConversation={setSelectedConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onCollapse={() => setSidebarCollapsed(true)}
        onRecheckConnection={recheckConnection}
        onConversationsUpdate={setConversations}
        onSelectedUpdate={setSelectedConversation}
      />

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', height: '100%', marginTop: !backendAvailable ? '48px' : 0 }}>
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            style={{ position: 'absolute', top: backendAvailable ? 24 : 72, left: 24, zIndex: 100, background: 'rgba(254,192,15,0.3)', border: '1px solid rgba(254,192,15,0.5)', borderRadius: 8, padding: 8, cursor: 'pointer' }}
          >
            <ChevronRight size={18} color="#FEC00F" />
          </button>
        )}

        {/* Message list */}
        <div className="flex-1" style={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div
            data-scroll-container
            style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', backgroundColor: colors.background, color: colors.text } as React.CSSProperties}
          >
            <div className="max-w-[900px] mx-auto px-6 py-10" style={{ color: colors.text }}>
              {allMessages.length === 0 ? (
                <ConversationEmptyState
                  icon={<img src={logo} alt="Logo" className="w-20 opacity-30" />}
                  title="Welcome to Potomac Analyst Chat"
                  description="Advanced analysis and trading strategy guidance"
                >
                  <div className="flex flex-col items-center gap-4" style={{ padding: 20 }}>
                    <img src={logo} alt="Logo" className="w-24" style={{ filter: 'drop-shadow(0 4px 8px rgba(254,192,15,0.2))' }} />
                    <div className="space-y-1 text-center">
                      <h3 style={{ fontFamily: "var(--font-rajdhani),'Rajdhani',sans-serif", fontSize: 20, fontWeight: 700, color: colors.primaryYellow, margin: '8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        WELCOME TO POTOMAC ANALYST CHAT
                      </h3>
                      <p style={{ fontFamily: "var(--font-quicksand),'Quicksand',sans-serif", fontSize: 14, color: colors.textMuted, margin: '4px 0' }}>
                        Advanced analysis and trading strategy guidance powered by Potomac
                      </p>
                    </div>
                    <Suggestions className="justify-center mt-4">
                      <Suggestion suggestion="Generate a moving average crossover AFL" onClick={(s: string) => setInput(s)} />
                      <Suggestion suggestion="Explain RSI divergence strategy" onClick={(s: string) => setInput(s)} />
                      <Suggestion suggestion="Show me AAPL stock data" onClick={(s: string) => setInput(s)} />
                      <Suggestion suggestion="Search knowledge base for Bollinger Bands" onClick={(s: string) => setInput(s)} />
                    </Suggestions>
                    <p className="text-xs text-muted-foreground mt-2">Click a suggestion or type your own message below</p>
                  </div>
                </ConversationEmptyState>
              ) : (
                <>
                  <div className="flex flex-col gap-6">
                    {allMessages.map((msg, idx) => renderMessage(msg, idx))}
                  </div>

                  {/* Artifacts */}
                  {artifacts.length > 0 && (
                    <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${colors.border}` }}>
                      {artifacts.map((artifact) => (
                        <ArtifactRenderer
                          key={artifact.id}
                          artifact={artifact}
                          onClose={() => {
                            const convId = selectedConversation?.id;
                            if (convId) setArtifactsByConv((prev) => ({ ...prev, [convId]: (prev[convId] || []).filter((a) => a.id !== artifact.id) }));
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Orphaned generation cards from localStorage */}
                  {(() => {
                    try {
                      const raw = localStorage.getItem('gen_cards');
                      if (!raw) return null;
                      const jobs = JSON.parse(raw) as Record<string, any>;
                      const convId = conversationIdRef.current;
                      const activeJobs = Object.values(jobs).filter((j: any) => j.status === 'generating' && j.conversationId === convId);
                      if (activeJobs.length === 0) return null;
                      const renderedIds = new Set<string>();
                      allMessages.forEach((m: any) => {
                        m.parts?.forEach((p: any, i: number) => {
                          if (/pptx|presentation|document|docx|word|powerpoint/.test(p.type?.replace('tool-', '') || '')) {
                            renderedIds.add(p.toolCallId || `${m.id}_${i}`);
                          }
                        });
                      });
                      return activeJobs.filter((j: any) => !renderedIds.has(j.id)).map((j: any) => (
                        <PersistentGenerationCard key={`orphan_${j.id}`} toolCallId={j.id} toolName={j.toolName} input={{ title: j.title }} state="input-available" conversationId={j.conversationId} />
                      ));
                    } catch { return null; }
                  })()}

                  {/* Submitted waiting indicator */}
                  {status === 'submitted' && allMessages.length > 0 && allMessages[allMessages.length - 1]?.role === 'user' && (
                    <AIMessage from="assistant">
                      <div className="flex items-center gap-2 text-xs">
                        <img src={logo} alt="Yang AI" className="w-5 h-5 rounded flex-shrink-0" />
                        <span className="font-semibold text-foreground">Yang</span>
                      </div>
                      <MessageContent><Shimmer duration={1.5}>Thinking...</Shimmer></MessageContent>
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

        {/* ── PromptInput ─────────────────────────────────────────────────── */}
        <div className="px-6 py-5" style={{ flexShrink: 0, borderTop: `2px solid ${colors.primaryYellow}`, backgroundColor: isDark ? 'rgba(254,192,15,0.03)' : 'rgba(254,192,15,0.05)' }}>
          <div className="max-w-[900px] mx-auto">
            <TooltipProvider>
              <PromptInput
                accept=".pdf,.csv,.json,.txt,.afl,.doc,.docx,.xls,.xlsx,.pptx,.ppt,.png,.jpg,.jpeg,.gif,.mp3,.wav,.m4a"
                multiple globalDrop={false} maxFiles={10} maxFileSize={52428800}
                onError={(err) => {
                  if (err.code === 'max_file_size') toast.error('File too large (max 50MB)');
                  else if (err.code === 'max_files') toast.error('Too many files (max 10)');
                  else if (err.code === 'accept') toast.error('File type not supported');
                }}
                onSubmit={async ({ text, files }: { text: string; files: any[] }) => {
                  if ((!text.trim() && files.length === 0) || isStreaming) return;
                  setInput('');
                  setPageError('');

                  const convId = await ensureConversation();
                  if (!convId) return;

                  let messageText = text;

                  if (files.length > 0) {
                    const token = getAuthToken();
                    const uploaded: string[] = [];
                    for (const file of files) {
                      const fileName = file.filename || 'upload';
                      try {
                        let actualFile: File;
                        if (file.url?.startsWith('blob:') || file.url?.startsWith('data:')) {
                          const resp = await fetch(file.url);
                          const blob = await resp.blob();
                          actualFile = new File([blob], fileName, { type: file.mediaType || blob.type || 'application/octet-stream' });
                        } else if (file.url) {
                          const resp = await fetch(file.url);
                          const blob = await resp.blob();
                          actualFile = new File([blob], fileName, { type: file.mediaType || blob.type || 'application/octet-stream' });
                        } else { toast.error(`Cannot upload ${fileName}: No file data`); continue; }

                        const toastId = toast.loading(`📤 Uploading ${fileName}...`, { duration: 10000 });
                        const formData = new FormData();
                        formData.append('file', actualFile);

                        try {
                          const resp = await fetchWithTimeout(
                            `/api/upload?conversationId=${convId}`,
                            {
                              method: 'POST',
                              headers: { Authorization: token ? `Bearer ${token}` : '' },
                              body: formData,
                            },
                            30000
                          );
                          if (!resp.ok) { const e = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` })); throw new Error(e.error); }
                          const respData = await resp.json();
                          uploaded.push(fileName);
                          fileBlobCacheRef.current.set(fileName, { url: file.url || undefined, fileId: respData.file_id || respData.id, filename: fileName, mediaType: file.mediaType, size: actualFile.size });
                          if (respData.is_template && respData.template_id) {
                            toast.success(`✅ ${fileName} registered as template`, { id: toastId, duration: 6000 });
                          } else {
                            toast.success(`✅ Uploaded ${fileName}`, { id: toastId });
                          }
                        } catch (err) {
                          const msg = err instanceof Error ? err.message : 'Unknown error';
                          toast.error(`❌ Failed to upload ${fileName}: ${msg}`, { id: toastId });
                          // Check for backend unavailability
                          if (msg.includes('fetch') || msg.includes('network') || msg.includes('aborted')) {
                            setBackendAvailable(false);
                          }
                        }
                      } catch { /* outer guard */ }
                    }
                    if (uploaded.length > 0) {
                      const fileList = uploaded.map((f) => `[file: ${f}]`).join('\n');
                      messageText = text.trim() ? `${text}\n\n${fileList}` : fileList;
                    }
                  }

                  // Append KB document refs
                  if (selectedKbDocIds.size > 0) {
                    setSelectedKbDocIds(new Set());
                  }

                  sendMessage({ text: messageText }, { body: { conversationId: convId } });
                }}
              >
                <AttachmentsDisplay />
                <PromptInputTextarea
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                  placeholder={isStreaming ? 'Yang is responding...' : 'Type a message to start chatting...'}
                  disabled={status !== 'ready' && status !== 'error'}
                />
                <PromptInputFooter>
                  <PromptInputTools>
                    <AttachmentButton disabled={isStreaming} />
                    <PromptInputButton
                      tooltip="Reference documents from Knowledge Base"
                      onClick={() => setKbPanelOpen((prev) => !prev)}
                      style={{ position: 'relative', color: selectedKbDocIds.size > 0 ? '#FEC00F' : undefined }}
                    >
                      <Database className="size-4" />
                      {selectedKbDocIds.size > 0 && (
                        <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#FEC00F', color: '#000', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {selectedKbDocIds.size}
                        </span>
                      )}
                    </PromptInputButton>
                    <PromptInputButton tooltip="Voice conversation mode" onClick={() => setVoiceModeOpen(true)}>
                      <Volume2 className="size-4" />
                    </PromptInputButton>
                    <SpeechInput
                      size="icon-sm" variant="ghost"
                      onTranscriptionChange={(text: string) => setInput((prev) => prev.trim() ? `${prev} ${text}` : text)}
                      onAudioRecorded={async (audioBlob: Blob) => {
                        try {
                          const token = getAuthToken();
                          const convId = selectedConversation?.id || conversationIdRef.current || 'default';
                          const formData = new FormData();
                          formData.append('audio', audioBlob, 'recording.webm');
                          const resp = await fetchWithTimeout(
                            `/api/upload?conversationId=${convId}`,
                            {
                              method: 'POST',
                              headers: { Authorization: token ? `Bearer ${token}` : '' },
                              body: formData,
                            },
                            30000
                          );
                          if (resp.ok) { const data = await resp.json(); return data.transcript || ''; }
                        } catch { 
                          toast.error('Voice transcription failed');
                          setBackendAvailable(false);
                        }
                        return '';
                      }}
                      lang="en-US" disabled={isStreaming}
                    />
                  </PromptInputTools>
                  <PromptInputSubmit status={status} onStop={() => stop()} disabled={!input.trim() && !isStreaming} />
                </PromptInputFooter>
              </PromptInput>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* ── Knowledge Base Panel (extracted component via portal) ─────────── */}
      <KnowledgeBasePanel
        isOpen={kbPanelOpen}
        onClose={() => setKbPanelOpen(false)}
        selectedDocIds={selectedKbDocIds}
        onSelectedDocIdsChange={setSelectedKbDocIds}
        isDark={isDark}
      />

      {/* ── Voice Mode overlay ────────────────────────────────────────────── */}
      <VoiceMode
        isOpen={voiceModeOpen}
        onClose={() => setVoiceModeOpen(false)}
        onSendMessage={async (text) => {
          const convId = await ensureConversation();
          if (convId) sendMessage({ text }, { body: { conversationId: convId } });
        }}
        lastAssistantText={(() => {
          const last = [...allMessages].reverse().find((m) => m.role === 'assistant');
          return last?.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text || '').join('') || '';
        })()}
        isStreaming={isStreaming}
        getAuthToken={getAuthToken}
      />

      {/* ── File Preview Modal (extracted component via portal) ───────────── */}
      {previewChatFile && typeof document !== 'undefined' && createPortal(
        <ChatFilePreviewModal
          file={previewChatFile}
          onClose={() => setPreviewChatFile(null)}
          isDark={isDark}
        />,
        document.body,
      )}
    </div>
  );
}

export default ChatPage;
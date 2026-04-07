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
  PaperclipIcon, ChevronRight, RefreshCw,
  CopyIcon, ThumbsUpIcon, ThumbsDownIcon, Eye, Volume2,
  FileText as FileTextIcon, FileCode as FileCodeIcon,
  FileSpreadsheet as FileSpreadsheetIcon, File as FileIconLucide,
  XIcon, ImageIcon, Music2Icon, VideoIcon,
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
  ChatModelSelector,
  ChatSkillSelector,
  HTMLArtifactPreview,
  ChatAgentSettings,
  API_BASE_URL_CHAT,
  type ChatPreviewFile,
} from '@/components/chat';
import {
  WeatherCard,
  StockCard,
  NewsHeadlines,
  MarketOverview,
  BacktestResults,
  FileAnalysisCard,
} from '@/components/generative-ui';

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

const CHAT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  @keyframes chat-fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes chat-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.6); }
  }
  @keyframes chat-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes chat-fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes chat-checkmark {
    0%   { opacity: 0; transform: scale(0.5); }
    50%  { opacity: 1; transform: scale(1.1); }
    100% { opacity: 0; transform: scale(1); }
  }
  @keyframes chat-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes chat-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.2); }
    50% { box-shadow: 0 0 30px rgba(99, 102, 241, 0.4); }
  }

  /* Message entrance */
  .chat-msg-enter { animation: chat-fadeUp .3s cubic-bezier(.16, 1, .3, 1) both; }

  /* Hover-reveal action bar on message rows */
  .chat-msg-row:hover .msg-actions { opacity: 1 !important; }

  /* Modern scrollbar */
  [data-scroll-container]::-webkit-scrollbar { width: 6px; }
  [data-scroll-container]::-webkit-scrollbar-track { background: transparent; }
  [data-scroll-container]::-webkit-scrollbar-thumb { 
    background: var(--scroll-thumb, rgba(99, 102, 241, 0.15)); 
    border-radius: 3px; 
  }
  [data-scroll-container]::-webkit-scrollbar-thumb:hover { 
    background: var(--scroll-thumb-hover, rgba(99, 102, 241, 0.3)); 
  }

  /* Modern frosted glass background */
  .chat-root {
    background-color: var(--chat-bg);
    background-image:
      radial-gradient(ellipse 100% 80% at 50% -20%, var(--chat-glow, rgba(99, 102, 241, 0.08)) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 100%, var(--chat-glow-secondary, rgba(139, 92, 246, 0.05)) 0%, transparent 50%);
  }

  /* Upload file card */
  .upload-file-card {
    animation: chat-fadeIn 0.3s ease-out;
    transition: all 0.2s cubic-bezier(.16, 1, .3, 1);
  }
  .upload-file-card:hover {
    transform: translateY(-2px);
  }

  /* Upload spinner */
  .upload-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(99, 102, 241, 0.15);
    border-top-color: #6366F1;
    border-radius: 50%;
    animation: chat-spin 0.8s linear infinite;
  }

  /* Checkmark flash */
  .upload-checkmark {
    animation: chat-checkmark 0.6s ease-out forwards;
  }

  /* Drag-and-drop overlay */
  .drag-drop-overlay {
    animation: chat-fadeIn 0.2s ease-out;
  }

  /* Modern message bubble styles */
  .chat-message-user {
    background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
    color: white;
    border-radius: 18px 18px 4px 18px;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.25);
  }
  
  .chat-message-assistant {
    background: var(--assistant-bg, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--assistant-border, rgba(255, 255, 255, 0.06));
    border-radius: 18px 18px 18px 4px;
    backdrop-filter: blur(10px);
  }

  /* Input area glass effect */
  .chat-input-container {
    background: var(--input-bg);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-top: 1px solid var(--input-border);
  }
`;

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

function getFileTypeIcon(filename: string | undefined) {
  const ext = getFileExtension(filename || '');
  if (['pdf','doc','docx','rtf'].includes(ext)) return FileTextIcon;
  if (['xls','xlsx','csv'].includes(ext)) return FileSpreadsheetIcon;
  if (['json','xml','html','md','txt','afl'].includes(ext)) return FileCodeIcon;
  if (['png','jpg','jpeg','gif','webp','svg','bmp'].includes(ext)) return ImageIcon;
  if (['mp3','wav','m4a','ogg','flac'].includes(ext)) return Music2Icon;
  if (['mp4','avi','mov','mkv','webm'].includes(ext)) return VideoIcon;
  return FileIconLucide;
}

  function AttachmentsDisplay({
  isDark,
  onRemoveFile,
  forcedSkillSlug,
  forcedSkillName,
  onClearSkill,
  }: {
  isDark: boolean;
  onRemoveFile: (id: string) => void;
  forcedSkillSlug: string | null;
  forcedSkillName: string | null;
  onClearSkill: () => void;
  }) {
  const attachments = usePromptInputAttachments();
  const hasFiles = attachments.files.length > 0;

  const hasSkillBadge = forcedSkillSlug !== null;

  if (!hasFiles && !hasSkillBadge) return null;

  return (
    <PromptInputHeader>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '8px',
        padding: '8px 0',
      }}>
        {/* Active skill badge */}
        {hasSkillBadge && (
          <div
            className="group"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px 6px 8px',
              borderRadius: '8px',
              border: `1px solid ${isDark ? 'rgba(96,165,250,0.3)' : 'rgba(96,165,250,0.4)'}`,
              background: isDark ? 'rgba(96,165,250,0.08)' : 'rgba(96,165,250,0.06)',
              fontSize: '13px',
              fontWeight: 500,
              color: isDark ? '#93C5FD' : '#3B82F6',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ opacity: 0.7, fontSize: '12px' }}>Skill:</span>
            <span>{forcedSkillName}</span>
            <button
              onClick={onClearSkill}
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
                color: isDark ? '#93C5FD' : '#3B82F6',
                opacity: 0.6,
                marginLeft: '2px',
                transition: 'opacity 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { 
                e.currentTarget.style.opacity = '1'; 
                e.currentTarget.style.background = isDark ? 'rgba(96,165,250,0.2)' : 'rgba(96,165,250,0.15)';
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.opacity = '0.6'; 
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <XIcon size={12} />
            </button>
          </div>
        )}
        
        {/* File attachments - Claude/ChatGPT style compact chips */}
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
              onMouseEnter={e => {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
              }}
            >
              <Icon size={14} style={{ opacity: 0.7, flexShrink: 0 }} />
              <span style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>{fname}</span>
              <button
                onClick={() => onRemoveFile(file.id)}
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
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { 
                  e.currentTarget.style.color = '#EF4444';
                  e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)';
                }}
                onMouseLeave={e => { 
                  e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <XIcon size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </PromptInputHeader>
  );
}

function AttachmentButton({ disabled }: { disabled?: boolean }) {
  const attachments = usePromptInputAttachments();
  return (
    <PromptInputButton
      onClick={() => { if (!disabled) attachments.openFileDialog(); }}
      disabled={disabled}
      tooltip="Attach files (PDF, CSV, Images, Docs, etc.)"
    >
      <PaperclipIcon className="size-4" />
    </PromptInputButton>
  );
}

// ─── Card JSON Extraction Helpers ─────────────────────────────────────────

interface CardSegment {
  type: 'text';
  text: string;
}
interface CardToken {
  type: 'card';
  cardType: string;
  data: any;
}
type TextSegment = CardSegment | CardToken;

function splitTextWithCards(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  let i = 0;

  while (i < text.length) {
    // Look for {"card":"
    const start = text.indexOf('{"card":"', i);
    if (start === -1) break;

    // Walk forward counting braces to find the matching closing }
    let depth = 0;
    let j = start;
    let found = -1;
    while (j < text.length) {
      if (text[j] === '{') depth++;
      else if (text[j] === '}') {
        depth--;
        if (depth === 0) { found = j; break; }
      }
      j++;
    }
    if (found === -1) break;

    const json = text.slice(start, found + 1);
    try {
      const parsed = JSON.parse(json);
      if (parsed.card && parsed.data !== undefined) {
        if (start > lastIndex) segments.push({ type: 'text', text: text.slice(lastIndex, start) });
        segments.push({ type: 'card', cardType: parsed.card, data: parsed.data });
        lastIndex = found + 1;
      }
    } catch { /* not valid JSON, skip */ }
    i = found + 1;
  }

  if (lastIndex < text.length) segments.push({ type: 'text', text: text.slice(lastIndex) });
  return segments;
}

function renderInlineCard(cardType: string, data: any, key: number): React.ReactNode {
  switch (cardType) {
    case 'weather':
      return <WeatherCard key={key} {...data} />;
    case 'file_analysis':
      return <FileAnalysisCard key={key} {...data} />;
    case 'stock':
    case 'stock_data':
      return <StockCard key={key} {...data} />;
    case 'news':
      return <NewsHeadlines key={key} {...data} />;
    case 'market_overview':
      return <MarketOverview key={key} {...data} />;
    case 'backtest':
      return <BacktestResults key={key} {...data} />;
    default:
      // Unknown card type — suppress the JSON, show nothing
      return null;
  }
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
  const [skillStatus, setSkillStatus] = useState<{ label: string; slug: string } | null>(null);
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-6');
  const [forcedSkillSlug, setForcedSkillSlug] = useState<string | null>(null);
  const [forcedSkillName, setForcedSkillName] = useState<string | null>(null);

  // ── Agent settings state ───────────────────────────────────────────────────
  const [thinkingEffort, setThinkingEffort] = useState('medium');
  const [usePromptCaching, setUsePromptCaching] = useState(true);
  const [maxIterations, setMaxIterations] = useState(5);
  const [pinModelVersion, setPinModelVersion] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileDownloadEvents, setFileDownloadEvents] = useState<Record<string, any>>({});
  const fileDownloadEventsRef = useRef<Record<string, any>>({});

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
  const selectedModelRef    = useRef(selectedModel);
  const forcedSkillSlugRef  = useRef<string | null>(forcedSkillSlug);
  const thinkingEffortRef   = useRef(thinkingEffort);
  const usePromptCachingRef = useRef(usePromptCaching);
  const maxIterationsRef    = useRef(maxIterations);
  const pinModelVersionRef  = useRef(pinModelVersion);

  // ── Sync refs for stable closures in transport body ────────────────────────
  useEffect(() => { selectedModelRef.current = selectedModel; }, [selectedModel]);
  useEffect(() => { forcedSkillSlugRef.current = forcedSkillSlug; }, [forcedSkillSlug]);
  useEffect(() => { thinkingEffortRef.current = thinkingEffort; }, [thinkingEffort]);
  useEffect(() => { usePromptCachingRef.current = usePromptCaching; }, [usePromptCaching]);
  useEffect(() => { maxIterationsRef.current = maxIterations; }, [maxIterations]);
  useEffect(() => { pinModelVersionRef.current = pinModelVersion; }, [pinModelVersion]);

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
  const [thinkingMode, setThinkingMode] = useState<string | undefined>(undefined);
  const [thinkingBudget, setThinkingBudget] = useState<number | undefined>(undefined);

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
      body: () => ({
        conversationId: conversationIdRef.current,
        thinking_mode: thinkingMode,
        thinking_budget: thinkingBudget,
        thinking_effort: thinkingEffortRef.current,
        model: selectedModelRef.current,
        skill_slug: forcedSkillSlugRef.current ?? undefined,
        use_prompt_caching: usePromptCachingRef.current,
        max_iterations: maxIterationsRef.current,
        pin_model_version: pinModelVersionRef.current,
      }),
    }),
    onData: (dataPart: any) => {
      // AI SDK now passes a single data part — the payload is in dataPart.data
      // Our backend wraps items in an array: 2:[{...}]
      const items: any[] = Array.isArray(dataPart?.data)
        ? dataPart.data
        : Array.isArray(dataPart)
          ? dataPart
          : [dataPart];

      for (const item of items) {
        if (!item) continue;
        // Skill status — show what skill is running during the wait
        if (item.skill_status) {
          setSkillStatus({ label: item.skill_status, slug: item.skill_slug ?? '' });
        }
        // File download — toast + store for card injection + persist to localStorage
        if (item.type === 'file_download' && item.filename) {
          const convId = conversationIdRef.current;
          setFileDownloadEvents(prev => {
            const next = { ...prev, [item.filename]: item };
            // Persist to localStorage so it survives page refreshes
            if (convId) {
              try { localStorage.setItem(`file_dl_${convId}`, JSON.stringify(next)); } catch {}
            }
            return next;
          });
          toast.success(`${item.filename} is ready`, {
            description: 'Click to download',
            action: {
              label: 'Download',
              onClick: () => {
                // download_url from the backend is a relative path like
                // /files/{uuid}/download — resolve it against the Railway origin.
                const rawUrl: string = item.download_url || '';
                const absUrl = rawUrl.startsWith('/')
                  ? `${(process.env.NEXT_PUBLIC_API_URL || 'https://developer-potomaac.up.railway.app').replace(/\/+$/, '')}${rawUrl}`
                  : rawUrl;
                window.open(absUrl, '_blank');
              },
            },
            duration: 10000,
          });
        }
      }
    },
    onFinish: ({ message }) => {
      setSkillStatus(null);
      const convId = conversationIdRef.current;
      justFinishedStreamRef.current = convId;
      setTimeout(() => {
        if (justFinishedStreamRef.current === convId) justFinishedStreamRef.current = null;
      }, 30000);

      if (convId) {
        const allMsgs = [...streamMessages, message];
        savePartsToCache(convId, allMsgs);

        // ── Persist tool results to database ────────────────────────────────
        // Extract completed tool results and save them for cross-device persistence
        const toolResultsToSave: Array<{
          message_id: string;
          tool_call_id: string;
          tool_name: string;
          input: any;
          output: any;
          state: 'pending' | 'completed' | 'error';
          error_text?: string;
        }> = [];

        for (const m of allMsgs) {
          if (m.role !== 'assistant' || !m.parts) continue;
          for (const part of m.parts as any[]) {
            if (!isToolPart(part.type)) continue;
            
            // Only persist completed/error tool results (not pending ones)
            if (part.state !== 'output-available' && part.state !== 'output-error') continue;
            
            const toolName = part.type === 'tool-invocation' 
              ? part.toolName 
              : part.type === 'dynamic-tool'
                ? (part.toolName || 'unknown')
                : part.type?.replace('tool-', '') || 'unknown';

            const toolCallId = part.toolCallId || part.toolInvocation?.toolCallId || `${m.id}_${toolName}_${Date.now()}`;
            
            toolResultsToSave.push({
              message_id: m.id,
              tool_call_id: toolCallId,
              tool_name: toolName,
              input: part.input || part.toolInvocation?.args || part.args || {},
              output: part.output || part.result || part.toolInvocation?.result || {},
              state: part.state === 'output-error' ? 'error' : 'completed',
              error_text: part.errorText,
            });
          }
        }

        if (toolResultsToSave.length > 0) {
          apiClient.saveToolResults(convId, toolResultsToSave).catch(err => {
            console.warn('Failed to persist tool results:', err);
          });
        }
      }

      loadConversations();
      if (voiceMode && message.role === 'assistant') {
        const text = message.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text || '').join('') || '';
        if (text.trim()) speakText(text, message.id);
      }
    },
    onError: (error) => {
      setSkillStatus(null); // Clear skill status on error
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
    const newConvId = selectedConversation?.id || null;
    conversationIdRef.current = newConvId;
    // Load persisted file download events for this conversation
    if (newConvId) {
      try {
        const stored = localStorage.getItem(`file_dl_${newConvId}`);
        console.log('[v0] conversation switch: file_dl keys=', stored ? Object.keys(JSON.parse(stored)).length : 0);
        if (stored) setFileDownloadEvents(JSON.parse(stored));
        else setFileDownloadEvents({});
      } catch { setFileDownloadEvents({}); }
    }
  }, [selectedConversation]);

  // ── Sync fileDownloadEvents ref for stable onData closure ──────────────────
  useEffect(() => {
    fileDownloadEventsRef.current = fileDownloadEvents;
  }, [fileDownloadEvents]);

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
    if (convId && streamMessages.length > 0) {
      saveToCache(convId, streamMessages);
      // Also persist parts on every update so tool output-available state is
      // captured immediately and survives a page reload mid-stream.
      savePartsToCache(convId, streamMessages);
    }
  }, [streamMessages, saveToCache, savePartsToCache]);

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
            type: getProcessType(toolName, part.input),
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
      // Fetch messages and tool results in parallel
      const [data, dbToolResults] = await Promise.all([
        apiClient.getMessages(conversationId),
        apiClient.getToolResults(conversationId).catch(() => [] as any[]),
      ]);
      if (conversationIdRef.current !== conversationId) return;

      // Build a lookup map: message_id -> tool_call_id -> tool result
      const toolResultsMap = new Map<string, Map<string, any>>();
      for (const tr of dbToolResults) {
        if (!toolResultsMap.has(tr.message_id)) {
          toolResultsMap.set(tr.message_id, new Map());
        }
        toolResultsMap.get(tr.message_id)!.set(tr.tool_call_id, tr);
      }

      const cachedParts = loadPartsCache(conversationId);
      const newMessages = data.map((m: any) => {
        const localParts: any[] | undefined = cachedParts[m.id];
        const serverParts: any[] | undefined = m.metadata?.parts;
        const fallbackParts = [{ type: 'text', text: m.content || '' }];
        // Prefer locally-cached parts (have the correct state values).
        // If we must use server parts, normalize AI SDK v3 state names
        // ('call' → 'input-available', 'result' → 'output-available') so
        // tool-registry renders DocumentGenerationCard correctly.
        const rawParts = localParts ?? serverParts ?? fallbackParts;
        
        // Get database tool results for this message
        const msgToolResults = toolResultsMap.get(m.id);
        
        const parts = rawParts.map((p: any) => {
          if (!p || !isToolPart(p.type)) return p;
          
          const stateMap: Record<string, string> = {
            'call':           'input-available',
            'partial-call':   'input-streaming',
            'result':         'output-available',
          };
          
          // Try to find matching database tool result
          const toolCallId = p.toolCallId || p.toolInvocation?.toolCallId;
          const dbResult = toolCallId && msgToolResults?.get(toolCallId);
          
          // If we have a database result, merge it into the part
          if (dbResult && dbResult.state === 'completed') {
            const mergedOutput = dbResult.output || p.output || p.result || p.toolInvocation?.result;
            // CRITICAL: Also merge the input from dbResult to preserve skill_slug for document generation
            const mergedInput = { ...(p.input || {}), ...(dbResult.input || {}) };
            return {
              ...p,
              state: 'output-available',
              input: mergedInput,
              output: mergedOutput,
              result: mergedOutput,
              toolInvocation: p.toolInvocation ? {
                ...p.toolInvocation,
                state: 'output-available',
                result: mergedOutput,
                args: mergedInput,
              } : undefined,
            };
          }
          
          // No database result - use existing normalization logic
          if (p.type !== 'tool-invocation') return p;
          
          const normalizedState = stateMap[p.state] ?? p.state;
          const toolInvocation = p.toolInvocation
            ? { ...p.toolInvocation, state: stateMap[p.toolInvocation.state] ?? p.toolInvocation.state }
            : undefined;
          return { ...p, state: normalizedState, ...(toolInvocation ? { toolInvocation } : {}) };
        });
        return {
          id: m.id,
          role: m.role,
          content: m.content || '',
          parts,
          createdAt: m.created_at ? new Date(m.created_at) : new Date(),
        };
      });

      if (newMessages.length > 0) {
        setMessages(newMessages as any);
        saveToCache(conversationId, newMessages);
        // Re-persist parts under real server IDs (temp streaming IDs like
        // "msg-1234567890" are never found on reload; this ensures the real
        // UUID is stored so the next reload hits localStorage instead of falling
        // back to server parts).
        savePartsToCache(conversationId, newMessages);
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

  // ── KB Add-to-message handler ──────────────────────────────────────────────
  const handleKbAddToMessage = useCallback(
    async (selectedDocs: Array<{ id: string; filename: string; title?: string; category: string }>) => {
      if (selectedDocs.length === 0) return;

      // Build a visible tag in the textarea for each doc
      const tags = selectedDocs.map((d) => `[KB: ${d.filename}]`).join(' ');
      setInput((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed}\n\n${tags}` : tags;
      });

      // Close panel and clear selection — parent owns this
      setKbPanelOpen(false);
      setSelectedKbDocIds(new Set());
    },
    []
  );

  // ── Shared token shortcuts ─────────────────────────────────────────────────
  const T = {
    text:    isDark ? '#EFEFEF'                    : '#0A0A0B',
    muted:   isDark ? '#606068'                    : '#808088',
    border:  isDark ? 'rgba(255,255,255,0.06)'     : 'rgba(0,0,0,0.07)',
    card:    isDark ? '#0D0D10'                    : '#FFFFFF',
    userBg:  isDark ? 'rgba(96,165,250,0.07)'      : 'rgba(96,165,250,0.09)',
    userBdr: isDark ? 'rgba(96,165,250,0.18)'      : 'rgba(96,165,250,0.25)',
    aiBg:    isDark ? 'rgba(255,255,255,0.03)'     : 'rgba(0,0,0,0.02)',
    aiBdr:   isDark ? 'rgba(255,255,255,0.06)'     : 'rgba(0,0,0,0.07)',
    dim:     isDark ? 'rgba(255,255,255,0.18)'     : 'rgba(0,0,0,0.25)',
  };

  // ── renderMessage ──────────────────────────────────────────────────────────
  const renderMessage = (message: any, idx: number) => {
    const isUser = message.role === 'user';
    const parts = message.parts || [];
    const isLast = idx === lastIdx;
    const msgIsStreaming = isStreaming && isLast && !isUser;
    const fullText = parts.filter((p: any) => p.type === 'text').map((p: any) => p.text || '').join('');
    const toolParts = parts.filter((p: any) => isToolPart(p.type));
    const hasMultipleTools = toolParts.length >= 2;
    const sourceParts = parts.filter((p: any) => p.type === 'source-url');
    const timeStr = message.createdAt
      ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    // ── Content renderer (same logic, just extracted) ────────────────────��─
    const renderParts = () => {
      // Deduplicate tool parts by toolCallId — keep the last (most complete) state
      // to prevent duplicate cards when both input-available + output-available
      // parts exist for the same tool call.
      const seenToolCallIds = new Map<string, number>();
      const deduped = parts.map((part: any, pIdx: number) => ({ part, pIdx }));
      // First pass: record the last index for each toolCallId
      deduped.forEach(({ part, pIdx }: { part: any; pIdx: number }) => {
        if (isToolPart(part.type) && part.toolCallId) {
          seenToolCallIds.set(part.toolCallId, pIdx);
        }
      });

      return deduped.map(({ part, pIdx }: { part: any; pIdx: number }) => {
        if (isToolPart(part.type)) {
          // Skip earlier duplicates — only render the last occurrence per toolCallId
          if (part.toolCallId && seenToolCallIds.get(part.toolCallId) !== pIdx) {
            return null;
          }
          // Find matching file_download event for externalOutput injection
          const toolInput = part.input || {};
          const toolFilename = toolInput.filename || toolInput.name || '';
          const extOut = toolFilename && fileDownloadEvents[toolFilename]
            ? fileDownloadEvents[toolFilename]
            : undefined;
          return renderToolPart(part, pIdx, message.id, conversationIdRef.current, extOut);
        }

        switch (part.type) {
        case 'text': {
          if (!part.text) return null;
          if (!isUser) {
            const stripped = !msgIsStreaming ? stripReactCodeBlocks(part.text) : part.text;

            // Only attempt card extraction on complete (non-streaming) text
            if (!msgIsStreaming) {
              const segments = splitTextWithCards(stripped);
              const hasCards = segments.some(s => s.type === 'card');

              if (hasCards) {
                return (
                  <React.Fragment key={pIdx}>
                    {segments.map((seg, i) => {
                      if (seg.type === 'card') {
                        return renderInlineCard(seg.cardType, seg.data, i);
                      }
                      const cleanText = seg.text.trim();
                      return cleanText
                        ? <MessageResponse key={i}>{cleanText}</MessageResponse>
                        : null;
                    })}
                    <InlineReactPreview text={part.text} isDark={isDark} />
                  </React.Fragment>
                );
              }
            }

            // Default path — no card tokens found (or still streaming)
            return (
              <React.Fragment key={pIdx}>
                {stripped.trim() && <MessageResponse>{stripped}</MessageResponse>}
                {!msgIsStreaming && <InlineReactPreview text={part.text} isDark={isDark} />}
              </React.Fragment>
            );
          }
          const rawText = stripSystemInstructions(part.text);
          if (!rawText) return null;
          const fileRefs: string[] = [];
          let m;
          const pat = /\[(?:uploaded\s+)?file:\s*([^\]]+)\]/gi;
          while ((m = pat.exec(rawText)) !== null) fileRefs.push(m[1].trim());
          const cleanText = rawText
            .replace(/\[(?:uploaded\s+)?file:\s*[^\]]+\]/gi, '')
            .replace(/Please analyse the uploaded file\(s\):[^\n]*/gi, '')
            .replace(/\n{3,}/g, '\n\n').trim();
          return (
            <React.Fragment key={pIdx}>
              {fileRefs.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: cleanText ? '8px' : 0 }}>
                  {fileRefs.map((filename, fIdx) => {
                    const ext = getFileExtension(filename);
                    const cc = getFileChipColor(ext);
                    const IC = ['doc','docx','pdf','rtf'].includes(ext) ? FileTextIcon : ['xls','xlsx','csv'].includes(ext) ? FileSpreadsheetIcon : ['json','xml','html','md'].includes(ext) ? FileCodeIcon : FileIconLucide;
                    return (
                      <button key={fIdx} onClick={() => { const c = fileBlobCacheRef.current.get(filename); setPreviewChatFile(c || { filename }); }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 12px', borderRadius: '9px', border: `1px solid ${cc}35`, background: `${cc}12`, cursor: 'pointer' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: `${cc}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IC size={14} color={cc} /></div>
                        <div style={{ textAlign: 'left' as const, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: 160 }}>{filename}</p>
                          <p style={{ margin: 0, fontSize: 10, color: T.muted }}>{ext.toUpperCase()} · preview</p>
                        </div>
                        <Eye size={12} color={cc} style={{ opacity: 0.6 }} />
                      </button>
                    );
                  })}
                </div>
              )}
              {cleanText && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: T.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' as const }}>{cleanText}</p>}
            </React.Fragment>
          );
        }
        case 'reasoning':
          return <Reasoning key={pIdx} isStreaming={msgIsStreaming} defaultOpen={msgIsStreaming}><ReasoningTrigger /><ReasoningContent>{part.text || ''}</ReasoningContent></Reasoning>;
        case 'source-url': return null;
        case 'step-start':
          return pIdx > 0 ? (
            <div key={pIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '12px 0' }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.12em', color: T.muted, textTransform: 'uppercase' as const }}>Step {pIdx}</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>
          ) : null;
        case 'file': {
          if (part.mediaType?.startsWith('image/') && part.base64) return (
            <div key={pIdx} style={{ cursor: 'pointer', display: 'inline-block', marginTop: 6 }} onClick={() => setPreviewChatFile({ url: `data:${part.mediaType};base64,${part.base64}`, filename: part.filename || 'image.png', mediaType: part.mediaType })}>
              <AIImage base64={part.base64} uint8Array={undefined as any} mediaType={part.mediaType} alt="Image" className="max-w-full rounded-lg" />
            </div>
          );
          if (part.url || part.filename || part.fileId) {
            const fe = getFileExtension(part.filename || ''); const cc = getFileChipColor(fe);
            return (
              <button key={pIdx} onClick={() => setPreviewChatFile({ url: part.url, fileId: part.fileId, filename: part.filename || 'file', mediaType: part.mediaType, size: part.size })}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 12px', borderRadius: '9px', border: `1px solid ${cc}30`, background: `${cc}10`, cursor: 'pointer', marginTop: 6 }}>
                <FileTextIcon size={14} color={cc} />
                <div><p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: T.text }}>{part.filename || 'Attachment'}</p>{part.size && <p style={{ margin: 0, fontSize: 10, color: T.muted }}>{formatChatFileSize(part.size)} · {fe.toUpperCase()}</p>}</div>
                <Eye size={12} color={cc} style={{ opacity: 0.6 }} />
              </button>
            );
          }
          return null;
        }
        case 'data-file-download': {
          if (!part.data) return null;
          // Absolutize download_url — backend returns relative paths like /files/{uuid}/download
          const rawDlUrl: string = part.data.download_url || '';
          const absDlUrl = rawDlUrl.startsWith('/')
            ? `${API_BASE_URL_CHAT}${rawDlUrl}`
            : rawDlUrl;
          return (
            <DocumentDownloadCard
              key={pIdx}
              output={{
                document_id: part.data.file_id || part.data.document_id,
                filename:    part.data.filename,
                download_url: absDlUrl,
                doc_type:    part.data.file_type || part.data.doc_type,
                file_size_kb: part.data.size_kb || part.data.file_size_kb,
                tool:        part.data.tool_name || part.data.tool,
                title:       part.data.filename || part.data.title || 'Generated File',
                success:     true,
              }}
              onPreview={(file) => setPreviewChatFile(file)}
            />
          );
        }
        default:
          if (part.type?.startsWith('data-') && part.data?.content && part.data?.artifactType) {
            const { artifactType: artType, content: artCode, language, title } = part.data;
            const artLang = language || artType;
            if (['html','svg','react','jsx','tsx'].includes(artType) && artCode) {
              const blobUrl = (() => { try { const h = artType === 'svg' ? `<!DOCTYPE html><html><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh">${artCode}</body></html>` : artCode; return URL.createObjectURL(new Blob([h], { type: 'text/html' })); } catch { return ''; } })();
              return <HTMLArtifactPreview key={pIdx} blobUrl={blobUrl} code={artCode} language={artLang} title={title || artType.toUpperCase()} isDark={isDark} />;
            }
            return <Artifact key={pIdx}><ArtifactHeader><ArtifactTitle>{title || artType}</ArtifactTitle></ArtifactHeader><ArtifactContent><ArtifactRenderer artifact={{ id: part.data.id || `data-${pIdx}`, type: artType, language: artLang, code: artCode, complete: true }} /></ArtifactContent></Artifact>;
          }
          return null;
      }
    });
  };

    // ── USER message ───────────────────────────────────────────────────────
    if (isUser) {
      return (
        <div key={message.id} className="chat-msg-enter" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '4px 0' }}>
          <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
            {/* Meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {timeStr && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: T.dim, letterSpacing: '0.06em' }}>{timeStr}</span>}
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '11px', fontWeight: 600, color: T.muted, letterSpacing: '0.02em' }}>{userName}</span>
            </div>
            {/* Bubble */}
            <div style={{
              background: T.userBg,
              border: `1px solid ${T.userBdr}`,
              borderRadius: '16px 4px 16px 16px',
              padding: '12px 16px',
              fontSize: 14, lineHeight: 1.7,
              color: T.text,
            }}>
              {renderParts()}
            </div>
          </div>
        </div>
      );
    }

    // ── ASSISTANT message ───────────���──────────────────────────────────────
    return (
      <div key={message.id} className="chat-msg-enter" style={{ display: 'flex', gap: '12px', padding: '4px 0' }}>
        {/* Avatar */}
        <div style={{ flexShrink: 0, paddingTop: 2 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '10px',
            background: isDark ? 'rgba(96,165,250,0.08)' : 'rgba(96,165,250,0.1)',
            border: '1px solid rgba(96,165,250,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src={logo} alt="Yang" style={{ width: 18, height: 18, borderRadius: '5px' }} />
          </div>
        </div>

        {/* Content column */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '12px', fontWeight: 700, color: T.text, letterSpacing: '-0.01em' }}>Yang</span>
            {timeStr && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: T.dim, letterSpacing: '0.06em' }}>{timeStr}</span>}
            {msgIsStreaming && (
              <Shimmer duration={1.5}>
                {skillStatus ? skillStatus.label : 'Streaming…'}
              </Shimmer>
            )}
          </div>

          {/* Sources */}
          {sourceParts.length > 0 && !msgIsStreaming && (
            <Sources><SourcesTrigger count={sourceParts.length} /><SourcesContent>{sourceParts.map((sp: any, i: number) => <Source key={i} href={sp.url} title={sp.title || new URL(sp.url).hostname} />)}</SourcesContent></Sources>
          )}

          {/* Multi-tool chain */}
          {hasMultipleTools && !msgIsStreaming && (
            <ChainOfThought defaultOpen={false}>
              <ChainOfThoughtHeader>Used {toolParts.length} tools</ChainOfThoughtHeader>
              <ChainOfThoughtContent>
                {toolParts.map((tp: any, tIdx: number) => {
                  const tName = tp.type === 'dynamic-tool' ? (tp.toolName || 'unknown') : (tp.type?.replace('tool-', '') || 'unknown');
                  const tStatus = tp.state === 'output-available' || tp.state === 'output-error' ? 'complete' : 'active';
                  return <ChainOfThoughtStep key={tIdx} label={tName.replace(/_/g, ' ')} status={tStatus} description={tp.state === 'output-available' ? 'Completed' : tp.state === 'output-error' ? 'Error' : 'Running…'} />;
                })}
              </ChainOfThoughtContent>
            </ChainOfThought>
          )}

          {/* Message body */}
          <div style={{
            background: T.aiBg,
            border: `1px solid ${T.aiBdr}`,
            borderRadius: '4px 16px 16px 16px',
            padding: '14px 18px',
          }}>
            <MessageContent>
              {renderParts()}
              {status === 'submitted' && isLast && parts.every((p: any) => !p.text) && <Shimmer duration={1.5}>Thinking…</Shimmer>}
            </MessageContent>
          </div>


          {/* Action toolbar */}
          {!msgIsStreaming && fullText && (
            <div className="msg-actions" style={{ display: 'flex', gap: '4px', opacity: 0, transition: 'opacity .15s' }}>
              {[
                { tip: 'Copy',        icon: CopyIcon,       fn: () => handleCopyMessage(fullText) },
                { tip: 'Helpful',     icon: ThumbsUpIcon,   fn: () => toast.success('Thanks!') },
                { tip: 'Not helpful', icon: ThumbsDownIcon, fn: () => toast.info('Noted') },
              ].map(({ tip, icon: Icon, fn }) => (
                <button key={tip} title={tip} onClick={fn} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 26, height: 26, borderRadius: 7,
                  background: 'none', border: `1px solid ${T.border}`,
                  cursor: 'pointer', color: T.muted,
                  transition: 'background .15s, color .15s, border-color .15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = T.text; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = T.muted; }}
                >
                  <Icon size={12} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────��─────────────────────

  const cssVars = {
    '--chat-bg':  isDark ? '#0C0C0E' : '#FAFAFA',
    '--chat-glow': isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.05)',
    '--chat-glow-secondary': isDark ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.03)',
    '--scroll-thumb': isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.12)',
    '--scroll-thumb-hover': isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.25)',
    '--assistant-bg': isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
    '--assistant-border': isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    '--input-bg': isDark ? 'rgba(12, 12, 14, 0.9)' : 'rgba(255, 255, 255, 0.85)',
    '--input-border': isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
  } as React.CSSProperties;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CHAT_STYLES }} />
    <div
      className="chat-root"
      style={{
        ...cssVars,
        height: '100%',
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
          setIsDragOver(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) {
          setIsDragOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
      }}
    >

      {/* ── Backend unavailable banner (removed) ── */}
      {false && !backendAvailable && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
          background: isDark ? 'rgba(96,165,250,0.1)' : 'rgba(96,165,250,0.12)',
          borderBottom: '1px solid rgba(96,165,250,0.3)',
          padding: '9px 20px',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#60A5FA', flexShrink: 0,
            boxShadow: '0 0 8px rgba(96,165,250,0.6)',
          }} />
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '11px', letterSpacing: '0.06em',
            color: isDark ? '#60A5FA' : '#1E40AF',
          }}>
            Backend server unavailable — start server on port 8000
          </span>
          <button
            onClick={() => { setBackendAvailable(true); recheckConnection(); }}
            style={{
              padding: '4px 14px',
              background: 'rgba(96,165,250,0.15)',
              border: '1px solid rgba(96,165,250,0.4)',
              borderRadius: '6px', cursor: 'pointer',
              fontFamily: "'DM Mono', monospace",
              fontSize: '10px', letterSpacing: '0.08em',
              color: '#60A5FA', fontWeight: 500,
              transition: 'background .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(96,165,250,0.15)'}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Drag-and-drop overlay ───────────────────────────���──────────────── */}
      {isDragOver && (
        <div
          className="drag-drop-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            background: isDark
              ? 'rgba(8,8,9,0.85)'
              : 'rgba(245,245,246,0.85)',
            backdropFilter: 'blur(8px)',
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
          }}
        >
          <div style={{
            width: '85%',
            maxWidth: '480px',
            padding: '56px 48px',
            borderRadius: '24px',
            border: `2px dashed ${isDark ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.4)'}`,
            background: isDark
              ? 'rgba(99, 102, 241, 0.08)'
              : 'rgba(99, 102, 241, 0.06)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 24px 48px rgba(99, 102, 241, 0.15)',
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
            }}>
              <PaperclipIcon size={28} color="#ffffff" />
            </div>
            <span style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '20px',
              fontWeight: 600,
              color: isDark ? '#F1F1F4' : '#18181B',
              letterSpacing: '-0.02em',
            }}>
              Drop files to upload
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              letterSpacing: '0.02em',
              color: isDark ? '#71717A' : '#A1A1AA',
            }}>
              PDF, CSV, JSON, Images, Documents, and more
            </span>
          </div>
        </div>
      )}

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <ChatSidebar
        conversations={conversations}
        selectedConversation={selectedConversation}
        loadingConversations={loadingConversations}
        sidebarCollapsed={sidebarCollapsed}
        isDark={isDark}
        colors={colors}
        connStatus={connStatus}
        isCurrentConversationBlank={streamMessages.length === 0}
        onSelectConversation={setSelectedConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onCollapse={() => setSidebarCollapsed(true)}
        onRecheckConnection={recheckConnection}
        onConversationsUpdate={setConversations}
        onSelectedUpdate={setSelectedConversation}
      />

      {/* ── Main area ─────────────────────────────────��───────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        minWidth: 0, overflow: 'hidden', height: '100%',
        marginTop: !backendAvailable ? '40px' : 0,
      }}>

        {/* Sidebar expand button when collapsed */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            style={{
              position: 'absolute',
              top: backendAvailable ? 20 : 60,
              left: 20, zIndex: 100,
              background: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)',
              border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.2)'}`,
              borderRadius: '12px', padding: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)';
              e.currentTarget.style.borderColor = isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <ChevronRight size={18} color="#6366F1" />
          </button>
        )}

        {/* ── Message scroll area ─────────────────────────────────────────── */}
        <div className="flex-1" style={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div
            data-scroll-container
            style={{
              flex: 1, overflowY: 'auto', overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
              color: T.text,
            } as React.CSSProperties}
          >
            <div style={{ maxWidth: '820px', margin: '0 auto', padding: isMobile ? '24px 16px 16px' : '40px 28px 24px' }}>

              {allMessages.length === 0 ? (
                /* ── Empty state ──────────────────────────────────────────── */
                <ConversationEmptyState
                  icon={<img src={logo} alt="Logo" style={{ width: 48, opacity: 0.25 }} />}
                  title=""
                  description=""
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', padding: '40px 20px 20px' }}>

                    {/* Logo + glow */}
                    {/* Logo with modern glow */}
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute', inset: '-30px',
                        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 60%)',
                        borderRadius: '50%', pointerEvents: 'none',
                        animation: 'chat-glow 3s ease-in-out infinite',
                      }} />
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '20px',
                        background: isDark
                          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))'
                          : 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1))',
                        border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        boxShadow: '0 8px 32px rgba(99, 102, 241, 0.25)',
                      }}>
                        <img src={logo} alt="Yang" style={{
                          width: 48,
                          filter: 'drop-shadow(0 2px 8px rgba(99, 102, 241, 0.3))',
                        }} />
                      </div>
                    </div>

                    {/* Headline - Modern typography */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)',
                        border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.2)'}`,
                        borderRadius: '100px', padding: '6px 16px 6px 12px',
                        marginBottom: '20px',
                        backdropFilter: 'blur(10px)',
                      }}>
                        <div style={{ 
                          width: 6, height: 6, borderRadius: '50%', 
                          background: '#22C55E',
                          boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
                        }} />
                        <span style={{
                          fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                          fontSize: '10px', letterSpacing: '0.12em',
                          textTransform: 'uppercase' as const, 
                          color: isDark ? '#A5B4FC' : '#6366F1',
                          fontWeight: 500,
                        }}>
                          AI Assistant · Online
                        </span>
                      </div>
                      <h2 style={{
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: isMobile ? '28px' : '38px',
                        fontWeight: 700, letterSpacing: '-0.03em',
                        color: T.text, margin: '0 0 12px',
                        lineHeight: 1.15,
                        background: isDark 
                          ? 'linear-gradient(135deg, #F1F1F4 0%, #A5B4FC 100%)'
                          : 'linear-gradient(135deg, #18181B 0%, #6366F1 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}>
                        Potomac Analyst
                      </h2>
                      <p style={{
                        fontSize: '15px', color: T.muted,
                        lineHeight: 1.7, maxWidth: '440px', margin: '0 auto',
                        fontWeight: 400,
                      }}>
                        Your intelligent assistant for AFL generation, strategy analysis, and market insights.
                      </p>
                    </div>

                    {/* Modern suggestion chips */}
                    <Suggestions className="justify-center">
                      <Suggestion suggestion="Generate a moving average crossover AFL" onClick={(s) => setInput(s)} />
                      <Suggestion suggestion="Explain RSI divergence strategy" onClick={(s) => setInput(s)} />
                      <Suggestion suggestion="Show me AAPL stock data" onClick={(s) => setInput(s)} />
                      <Suggestion suggestion="Search knowledge base for Bollinger Bands" onClick={(s) => setInput(s)} />
                    </Suggestions>

                    <span style={{
                      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                      fontSize: '10px', letterSpacing: '0.08em',
                      color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
                      textTransform: 'uppercase' as const,
                      fontWeight: 500,
                    }}>
                      Select a suggestion or start typing
                    </span>
                  </div>
                </ConversationEmptyState>
              ) : (
                <>
                  <div className="flex flex-col gap-6">
                    {allMessages.map((msg, idx) => renderMessage(msg, idx))}
                  </div>

                  {/* Artifacts */}
                  {artifacts.length > 0 && (
                    <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${T.border}` }}>
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

                  {/* Orphaned generation cards */}
                  {(() => {
                    try {
                      const raw = (() => { try { return localStorage.getItem('gen_cards'); } catch { return null; } })();
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '8px',
                          background: 'rgba(96,165,250,0.1)',
                          border: '1px solid rgba(96,165,250,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <img src={logo} alt="Yang" style={{ width: 16, height: 16, borderRadius: '4px' }} />
                        </div>
                        <span style={{
                          fontFamily: "'Syne', sans-serif",
                          fontSize: '12px', fontWeight: 700,
                          color: T.text, letterSpacing: '-0.01em',
                        }}>Yang</span>
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

        {/* ── Error banner ───────────────────────────────────────────────────── */}
        {(pageError || chatError) && (
          <div style={{
            padding: '10px 24px',
            background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)',
            borderTop: '1px solid rgba(239,68,68,0.25)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            gap: '12px',
          }}>
            <span style={{ fontSize: '12.5px', color: isDark ? '#FCA5A5' : '#DC2626', flex: 1 }}>
              {pageError || chatError?.message || 'An error occurred'}
            </span>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                onClick={() => regenerate()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '5px 12px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '7px', cursor: 'pointer',
                  fontSize: '11px', color: isDark ? '#FCA5A5' : '#DC2626',
                  fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em',
                }}
              >
                <RefreshCw size={11} /> Retry
              </button>
              <button
                onClick={() => setPageError('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: '16px', lineHeight: 1, padding: '2px 4px' }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* ── Prompt Input — Modern Frosted Glass ───────────────────────────── */}
        <div 
          className="chat-input-container"
          style={{
            padding: isMobile ? '16px 16px 20px' : '20px 28px 24px',
            flexShrink: 0,
            background: isDark
              ? 'linear-gradient(to top, rgba(12, 12, 14, 0.95) 0%, rgba(12, 12, 14, 0.85) 100%)'
              : 'linear-gradient(to top, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0.8) 100%)',
            borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          {/* Modern gradient accent line */}
          <div style={{
            height: '2px', marginBottom: '16px', borderRadius: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.5) 30%, rgba(139, 92, 246, 0.4) 70%, transparent 100%)',
          }} />
          <div style={{ maxWidth: '820px', margin: '0 auto' }}>
            <TooltipProvider>
              <PromptInput
                accept=".pdf,.csv,.json,.txt,.afl,.doc,.docx,.xls,.xlsx,.pptx,.ppt,.png,.jpg,.jpeg,.gif,.mp3,.wav,.m4a"
                multiple globalDrop={false} maxFiles={10} maxFileSize={52428800}
                onError={(err) => {
                  if (err.code === 'max_file_size') toast.error('File too large (max 50MB)');
                  else if (err.code === 'max_files') toast.error('Too many files (max 10)');
                  else if (err.code === 'accept') toast.error('File type not supported');
                }}
                onSubmit={async ({ text, files }) => {
                  if ((!text.trim() && files.length === 0) || isStreaming) return;
                  setInput('');
                  setPageError('');

                  const convId = await ensureConversation();
                  if (!convId) return;

                  let messageText = text;

        if (files.length > 0) {
        const token = getAuthToken();
        const uploaded: string[] = [];
        
        // Upload files silently in background (no spinner shown)
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
                        } else { 
                          toast.error(`Cannot upload ${fileName}: no file data`);
                          continue;
                        }

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
                          if (!resp.ok) { const e = await resp.json().catch(() => ({ detail: `HTTP ${resp.status}` })); throw new Error(e.detail || e.error || `Upload failed: ${resp.status}`); }
                          const respData = await resp.json();
                          uploaded.push(fileName);
                          fileBlobCacheRef.current.set(fileName, { url: file.url || undefined, fileId: respData.file_id || respData.id, filename: fileName, mediaType: file.mediaType, size: actualFile.size });

                          if (respData.is_template && respData.template_id) {
                            toast.success(`${fileName} registered as template`, { duration: 4000 });
                          }
                        } catch (err) {
                          const msg = err instanceof Error ? err.message : 'Unknown error';
                          toast.error(`Upload failed: ${msg}`, { duration: 5000 });
                          if (msg.includes('fetch') || msg.includes('network') || msg.includes('aborted')) {
                            setBackendAvailable(false);
                          }
                        }
                      } catch (err) { 
                        toast.error(`Failed to process file: ${fileName}`, { duration: 5000 });
                      }
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

                  sendMessage({ text: messageText }, { body: { conversationId: convId, model: selectedModelRef.current, skill_slug: forcedSkillSlugRef.current ?? undefined } });
                }}
              >
                <AttachmentsDisplay 
                  isDark={isDark} 
                  onRemoveFile={(id) => {}} 
                  forcedSkillSlug={forcedSkillSlug}
                  forcedSkillName={forcedSkillName}
                  onClearSkill={() => { setForcedSkillSlug(null); setForcedSkillName(null); }}
                />
                <PromptInputTextarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isStreaming ? 'Yang is responding...' : 'Type a message to start chatting...'}
                  disabled={status !== 'ready' && status !== 'error'}
                />
                <PromptInputFooter>
                  <PromptInputTools>
                    <AttachmentButton disabled={isStreaming} />
                    <PromptInputButton
                      tooltip="Reference documents from Knowledge Base"
                      onClick={() => setKbPanelOpen((prev) => !prev)}
                      style={{ position: 'relative', color: selectedKbDocIds.size > 0 ? '#60A5FA' : undefined }}
                    >
                      <Database className="size-4" />
                      {selectedKbDocIds.size > 0 && (
                        <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#60A5FA', color: '#000', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {selectedKbDocIds.size}
                        </span>
                      )}
                    </PromptInputButton>
                    <PromptInputButton tooltip="Voice conversation mode" onClick={() => setVoiceModeOpen(true)}>
                      <Volume2 className="size-4" />
                    </PromptInputButton>
                    <SpeechInput
                      size="icon-sm" variant="ghost"
                      onTranscriptionChange={(text) => setInput((prev) => prev.trim() ? `${prev} ${text}` : text)}
                      onAudioRecorded={async (audioBlob) => {
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
                    <ChatSkillSelector
                      forcedSkillSlug={forcedSkillSlug}
                      forcedSkillName={forcedSkillName}
                      onSkillChange={(slug, name) => { setForcedSkillSlug(slug); setForcedSkillName(name); }}
                      isDark={isDark}
                      disabled={isStreaming}
                    />
                    <ChatModelSelector
                      selectedModel={selectedModel}
                      onModelChange={setSelectedModel}
                      isDark={isDark}
                      disabled={isStreaming}
                    />
                    <ChatAgentSettings
                      isDark={isDark}
                      thinkingEffort={thinkingEffort}
                      onThinkingEffortChange={setThinkingEffort}
                      usePromptCaching={usePromptCaching}
                      onUsePromptCachingChange={setUsePromptCaching}
                      maxIterations={maxIterations}
                      onMaxIterationsChange={setMaxIterations}
                      pinModelVersion={pinModelVersion}
                      onPinModelVersionChange={setPinModelVersion}
                      disabled={isStreaming}
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
        onAddToMessage={handleKbAddToMessage}
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
    </>
  );
}

export default ChatPage;

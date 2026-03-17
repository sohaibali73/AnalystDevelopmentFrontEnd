'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, MessageSquare, ArrowUpFromLine, Trash2, ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, Pencil, X, Wifi, WifiOff, CopyIcon, ThumbsUpIcon, ThumbsDownIcon, Volume2, VolumeX, Download, Info, Eye, FileText as FileTextIcon, FileCode as FileCodeIcon, FileSpreadsheet as FileSpreadsheetIcon, File as FileIconLucide, Database, Check, ChevronDown, BookOpen } from 'lucide-react';
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
import { useProcessManager, ProcessType } from '@/contexts/ProcessManager';
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
import { PersistentGenerationCard } from '@/components/generative-ui';
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

// Strip hidden system instructions from user messages (e.g., [FORMATTING: ...])
// These are injected for the AI but should never be visible to end users
function stripSystemInstructions(text: string): string {
  return text
    .replace(/\[FORMATTING:[^\]]*\]/gi, '')
    .replace(/\[SYSTEM:[^\]]*\]/gi, '')
    .replace(/\[INSTRUCTIONS:[^\]]*\]/gi, '')
    .replace(/\[CONTEXT:[^\]]*\]/gi, '')
    .replace(/\n{3,}/g, '\n\n')  // Clean up extra blank lines left behind
    .trim();
}

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


// ─────────────────────────────────────────────────────────────
// CHAT FILE PREVIEW MODAL
// Same library stack as KnowledgeBasePage:
//   PDF → native iframe blob, DOCX → mammoth.js,
//   XLSX → SheetJS, Images → Viewer.js, HTML → srcdoc iframe
// ─────────────────────────────────────────────────────────────

const API_BASE_URL_CHAT = (process.env.NEXT_PUBLIC_API_URL ||
  'https://potomac-analyst-workbench-new-production.up.railway.app').replace(/\/+$/, '');

function getChatAuthToken(): string {
  try { return localStorage.getItem('auth_token') || ''; } catch { return ''; }
}

function getChatFileIcon(filename: string) {
  const ext = (filename || '').split('.').pop()?.toLowerCase() || '';
  if (['pdf','doc','docx','rtf'].includes(ext)) return FileTextIcon;
  if (['csv','xlsx','xls'].includes(ext)) return FileSpreadsheetIcon;
  if (['md','json','xml','html','js','ts'].includes(ext)) return FileCodeIcon;
  return FileIconLucide;
}

function formatChatFileSize(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

interface ChatPreviewFile {
  url?: string;       // blob: or data: URL from PromptInput attachment
  fileId?: string;    // file_id from upload response (for Railway fetch)
  filename: string;
  mediaType?: string;
  size?: number;
}

function ChatFilePreviewModal({
  file, onClose, isDark,
}: {
  file: ChatPreviewFile;
  onClose: () => void;
  isDark: boolean;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const ext = (file.filename.split('.').pop() || '').toLowerCase();
  const isBinaryRender = ['pdf','png','jpg','jpeg','gif','webp','bmp','svg','docx','doc','xlsx','xls'].includes(ext);
  const isHtml = ext === 'html' || ext === 'htm';
  const isText = ['txt','md','csv','json','xml','log','sql','py','js','ts'].includes(ext);
  const FIcon = getChatFileIcon(file.filename);

  // Mammoth ref for DOCX
  const [docxHtml, setDocxHtml] = useState('');
  // SheetJS state for XLSX
  const [xlsxHtml, setXlsxHtml] = useState('');
  const [xlsxSheets, setXlsxSheets] = useState<string[]>([]);
  const [xlsxAllHtml, setXlsxAllHtml] = useState<string[]>([]);
  const [xlsxActive, setXlsxActive] = useState(0);
  // Viewer.js ref
  const imgRef = useRef<HTMLImageElement>(null);
  const viewerRef = useRef<any>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setLoading(true); setError('');
    let objectUrl = '';

    const getBlob = async (): Promise<Blob | null> => {
      // Priority 1: use existing blob/data URL from PromptInput
      if (file.url) {
        const resp = await fetch(file.url);
        return resp.blob();
      }
      // Priority 2: fetch from Railway via file_id
      if (file.fileId) {
        const resp = await fetch(`${API_BASE_URL_CHAT}/upload/files/${file.fileId}/download`, {
          headers: { Authorization: `Bearer ${getChatAuthToken()}` },
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return resp.blob();
      }
      return null;
    };

    const run = async () => {
      try {
        const blob = await getBlob();
        if (!blob) { setError('No file data available'); setLoading(false); return; }

        if (isBinaryRender) {
          objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);

          // DOCX: render with mammoth
          if (['docx','doc'].includes(ext)) {
            if (!(window as any).mammoth) {
              await new Promise<void>((res, rej) => {
                const s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js';
                s.onload = () => res(); s.onerror = () => rej(new Error('mammoth load failed'));
                document.head.appendChild(s);
              });
            }
            const ab = await blob.arrayBuffer();
            const result = await (window as any).mammoth.convertToHtml({ arrayBuffer: ab });
            setDocxHtml(result.value);
          }

          // XLSX: render with SheetJS
          if (['xlsx','xls'].includes(ext)) {
            if (!(window as any).XLSX) {
              await new Promise<void>((res, rej) => {
                const s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
                s.onload = () => res(); s.onerror = () => rej(new Error('SheetJS load failed'));
                document.head.appendChild(s);
              });
            }
            const XLSX = (window as any).XLSX;
            const ab = await blob.arrayBuffer();
            const wb = XLSX.read(ab, { type: 'array' });
            const names: string[] = wb.SheetNames;
            const pages = names.map((n: string) => XLSX.utils.sheet_to_html(wb.Sheets[n], { id: 'chat-xlsx-table', editable: false }));
            setXlsxSheets(names); setXlsxAllHtml(pages); setXlsxHtml(pages[0] || '');
          }
        } else if (isHtml || isText) {
          const text = await blob.text();
          setTextContent(text);
        }
        setLoading(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
        setLoading(false);
      }
    };

    run();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [file.url, file.fileId, ext, isBinaryRender, isHtml, isText]);

  // Viewer.js init for images
  useEffect(() => {
    if (!imgLoaded || !imgRef.current || !['png','jpg','jpeg','gif','webp','bmp','svg'].includes(ext)) return;
    const init = async () => {
      if (!document.getElementById('viewerjs-css')) {
        const link = document.createElement('link');
        link.id = 'viewerjs-css'; link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/viewerjs@1.11.6/dist/viewer.min.css';
        document.head.appendChild(link);
      }
      if (!(window as any).Viewer) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/viewerjs@1.11.6/dist/viewer.min.js';
          s.onload = () => res(); s.onerror = () => rej();
          document.head.appendChild(s);
        });
      }
      if (viewerRef.current) { viewerRef.current.destroy(); viewerRef.current = null; }
      viewerRef.current = new (window as any).Viewer(imgRef.current!, {
        inline: true,
        toolbar: { zoomIn: 1, zoomOut: 1, oneToOne: 1, reset: 1, rotateLeft: 1, rotateRight: 1, flipHorizontal: 1, flipVertical: 1 },
        navbar: false,
      });
    };
    init().catch(() => {});
    return () => { if (viewerRef.current) { viewerRef.current.destroy(); viewerRef.current = null; } };
  }, [imgLoaded, ext]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      let blob: Blob;
      if (file.url) {
        blob = await fetch(file.url).then(r => r.blob());
      } else if (file.fileId) {
        const r = await fetch(`${API_BASE_URL_CHAT}/upload/files/${file.fileId}/download`, {
          headers: { Authorization: `Bearer ${getChatAuthToken()}` },
        });
        blob = await r.blob();
      } else { return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = file.filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) { alert('Download failed: ' + (e instanceof Error ? e.message : String(e))); }
    finally { setDownloading(false); }
  };

  const colors = {
    cardBg: isDark ? '#1E1E1E' : '#FFFFFF',
    border: isDark ? '#2E2E2E' : '#E5E5E5',
    text: isDark ? '#FFFFFF' : '#212121',
    textMuted: isDark ? '#9E9E9E' : '#757575',
    accent: '#FEC00F',
  };

  const renderContent = () => {
    if (loading) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '10px', padding: '40px' }}>
        <Loader2 size={22} color={colors.accent} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: colors.textMuted, fontSize: '13px' }}>Loading {ext.toUpperCase()}...</span>
      </div>
    );
    if (error) return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '10px', padding: '40px' }}>
        <Info size={28} color="#ef4444" />
        <span style={{ color: '#ef4444', fontSize: '13px' }}>{error}</span>
      </div>
    );

    // PDF
    if (ext === 'pdf' && blobUrl) return (
      <iframe src={`${blobUrl}#toolbar=1`} style={{ flex: 1, width: '100%', border: 'none', minHeight: '520px' }} title={file.filename} />
    );
    // Images with Viewer.js
    if (['png','jpg','jpeg','gif','webp','bmp','svg'].includes(ext) && blobUrl) return (
      <div style={{ flex: 1, backgroundColor: isDark ? '#0d0d0d' : '#1a1a1a', minHeight: '480px' }}>
        <img ref={imgRef} src={blobUrl} alt={file.filename} onLoad={() => setImgLoaded(true)} style={{ maxWidth: '100%', display: 'block' }} />
        <style>{'.viewer-container,.viewer-canvas{background:#111!important}'}</style>
      </div>
    );
    // DOCX with mammoth
    if (['docx','doc'].includes(ext) && docxHtml) return (
      <div style={{ flex: 1, overflow: 'auto', backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0' }}>
        <div className="docx-body" style={{ padding: '40px 60px', maxWidth: '820px', margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: docxHtml }} />
        <style>{`
          .docx-body h1{font-size:22px;font-weight:700;color:${colors.text};margin:0 0 14px}
          .docx-body h2{font-size:18px;font-weight:700;color:${colors.text};margin:20px 0 8px}
          .docx-body p{font-size:14px;line-height:1.7;color:${colors.text};margin:0 0 10px}
          .docx-body table{border-collapse:collapse;width:100%;margin:14px 0}
          .docx-body td,.docx-body th{border:1px solid ${colors.border};padding:6px 10px;font-size:13px;color:${colors.text}}
          .docx-body th{background:${isDark?'#2a2a2a':'#f5f5f5'};font-weight:600}
          .docx-body ul,.docx-body ol{padding-left:22px;margin:6px 0}
          .docx-body li{font-size:14px;line-height:1.6;color:${colors.text}}
          .docx-body img{max-width:100%;border-radius:4px}
        `}</style>
      </div>
    );
    // XLSX with SheetJS
    if (['xlsx','xls'].includes(ext) && xlsxHtml) return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {xlsxSheets.length > 1 && (
          <div style={{ display: 'flex', gap: '4px', padding: '8px 14px', borderBottom: `1px solid ${colors.border}`, flexWrap: 'wrap' }}>
            {xlsxSheets.map((name, idx) => (
              <button key={name} onClick={() => { setXlsxActive(idx); setXlsxHtml(xlsxAllHtml[idx]); }} style={{ padding: '3px 10px', borderRadius: '6px', border: `1px solid ${idx === xlsxActive ? colors.accent : colors.border}`, backgroundColor: idx === xlsxActive ? `${colors.accent}14` : 'transparent', color: idx === xlsxActive ? colors.accent : colors.textMuted, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{name}</button>
            ))}
          </div>
        )}
        <div style={{ flex: 1, overflow: 'auto', padding: '14px', backgroundColor: isDark ? '#111' : '#fff' }} dangerouslySetInnerHTML={{ __html: xlsxHtml }} />
        <style>{`#chat-xlsx-table{border-collapse:collapse;font-size:12px;width:100%}#chat-xlsx-table td,#chat-xlsx-table th{border:1px solid ${isDark?'#333':'#ddd'};padding:4px 8px;color:${isDark?'#e0e0e0':'#212121'};white-space:nowrap}#chat-xlsx-table tr:first-child td{background:${isDark?'#2a2a2a':'#f5f5f5'};font-weight:600}`}</style>
      </div>
    );
    // HTML — live iframe
    if (isHtml && textContent) return (
      <iframe srcDoc={textContent} sandbox="allow-scripts allow-same-origin" style={{ flex: 1, width: '100%', border: 'none', minHeight: '480px', backgroundColor: '#fff' }} title={file.filename} />
    );
    // Text/code
    if (textContent) return (
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: '13px', lineHeight: 1.75, color: colors.text }}>{textContent}</pre>
      </div>
    );
    // Fallback
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '12px', padding: '40px' }}>
        <Info size={32} color={colors.textMuted} />
        <p style={{ color: colors.textMuted, fontSize: '13px', textAlign: 'center', margin: 0 }}>No preview available. Use Download to get the file.</p>
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '100%', maxWidth: '840px', maxHeight: '88vh', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '18px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '9px', backgroundColor: 'rgba(254,192,15,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FIcon size={20} color="#FEC00F" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.filename}</p>
            {file.size && <p style={{ margin: '2px 0 0', fontSize: '11px', color: colors.textMuted }}>{formatChatFileSize(file.size)}</p>}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button onClick={handleDownload} disabled={downloading} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '7px', border: `1px solid ${colors.accent}`, backgroundColor: `${colors.accent}14`, color: colors.accent, fontSize: '12px', fontWeight: 700, cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading ? 0.6 : 1 }}>
              {downloading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={12} />}
              DOWNLOAD
            </button>
            <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '7px', border: `1px solid ${colors.border}`, backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textMuted }}>
              <X size={15} />
            </button>
          </div>
        </div>
        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {renderContent()}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
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
  const [previewChatFile, setPreviewChatFile] = useState<ChatPreviewFile | null>(null);

  // Knowledge Base reference panel state
  const [kbPanelOpen, setKbPanelOpen] = useState(false);
  const [kbDocs, setKbDocs] = useState<Array<{ id: string; title?: string; filename: string; category: string; file_size?: number }>>([]);
  const [kbDocsLoading, setKbDocsLoading] = useState(false);
  const [selectedKbDocIds, setSelectedKbDocIds] = useState<Set<string>>(new Set());
  const kbPanelRef = useRef<HTMLDivElement>(null);

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

  // Process Manager — connect tool invocations to the task manager widget
  const { addProcess, updateProcess } = useProcessManager();
  const trackedToolsRef = useRef<Map<string, string>>(new Map()); // toolPartKey -> processId

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
  // Cache blob URLs by filename so previewing uploaded files works immediately
  // and for files still in the browser session (before page reload)
  const fileBlobCacheRef = useRef<Map<string, ChatPreviewFile>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ref to track current conversationId synchronously (avoids stale state in body callback)
  const conversationIdRef = useRef<string | null>(null);

  // Simplified: Use AI SDK parts directly, no manual reconstruction needed

  // Get auth token for transport
  const getAuthToken = () => {
    try { return localStorage.getItem('auth_token') || ''; } catch { return ''; }
  };

  // Fetch KB documents when panel opens
  const fetchKbDocs = useCallback(async () => {
    if (kbDocs.length > 0) return; // already loaded
    setKbDocsLoading(true);
    try {
      const token = getAuthToken();
      const resp = await fetch(
        (process.env.NEXT_PUBLIC_API_URL || 'https://potomac-analyst-workbench-new-production.up.railway.app').replace(/\/+$/, '') + '/brain/documents',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (resp.ok) {
        const data = await resp.json();
        setKbDocs(data || []);
      }
    } catch { /* silent */ }
    finally { setKbDocsLoading(false); }
  }, [kbDocs.length]);

  // Close KB panel on outside click
  useEffect(() => {
    if (!kbPanelOpen) return;
    const handler = (e: MouseEvent) => {
      if (kbPanelRef.current && !kbPanelRef.current.contains(e.target as Node)) {
        setKbPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [kbPanelOpen]);

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
      }, 30000); // 30s protection — document/presentation tools take 30-60s to complete

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
  });

  const isStreaming = status === 'streaming' || status === 'submitted';

  // Track which conversation is actively streaming — update ref when streaming starts/stops
  useEffect(() => {
    if (isStreaming) {
      streamingConvRef.current = conversationIdRef.current;
    } else {
      // Clear after a delay to protect against rapid state transitions
      const convId = streamingConvRef.current;
      setTimeout(() => {
        if (streamingConvRef.current === convId && !isStreaming) {
          streamingConvRef.current = null;
        }
      }, 2000);
    }
  }, [isStreaming]);

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

      // === DEEP-LINK: Check if Task Manager is directing us to a specific conversation ===
      const navigateToConvId = sessionStorage.getItem('pm_navigate_to_conv');
      if (navigateToConvId) {
        sessionStorage.removeItem('pm_navigate_to_conv');
        const targetConv = data.find((c: any) => c.id === navigateToConvId);
        if (targetConv) {
          setSelectedConversation(targetConv);
          initialLoadDoneRef.current = true;
          setLoadingConversations(false);
          return; // Skip auto-select logic
        }
      }

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

    // === CRITICAL: Save current streaming messages before switching ===
    // Without this, switching conversations wipes the streaming tool cards
    const prevConvId = streamingConvRef.current;
    if (prevConvId && prevConvId !== conversationId && streamMessages.length > 0) {
      messageCacheRef.current[prevConvId] = streamMessages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content || '',
        parts: m.parts || [{ type: 'text', text: m.content || '' }],
        createdAt: m.createdAt,
      }));
      // Also persist to sessionStorage and localStorage parts cache
      try {
        sessionStorage.setItem(`chat_msgs_${prevConvId}`, JSON.stringify(messageCacheRef.current[prevConvId]));
        const partsCache: Record<string, any[]> = {};
        streamMessages.forEach((m: any) => {
          if (m.parts && m.parts.length > 0) {
            const hasRichParts = m.parts.some((p: any) => p.type !== 'text' && p.type !== 'step-start');
            if (hasRichParts) partsCache[m.id] = m.parts;
          }
        });
        if (Object.keys(partsCache).length > 0) {
          const existing = JSON.parse(localStorage.getItem(`chat_parts_${prevConvId}`) || '{}');
          localStorage.setItem(`chat_parts_${prevConvId}`, JSON.stringify({ ...existing, ...partsCache }));
        }
      } catch { /* ignore */ }
    }

    // Guard: if switching back to active streaming conversation, restore from cache
    if (isStreaming && streamingConvRef.current === conversationId) {
      const cached = messageCacheRef.current[conversationId];
      if (cached && cached.length > 0) {
        setMessages(cached);
      }
      return;
    }

    // === INSTANT CACHE LOAD ===
    // Show cached messages IMMEDIATELY to prevent blank screen during API fetch
    const memCached = messageCacheRef.current[conversationId];
    if (memCached && memCached.length > 0) {
      setMessages(memCached);
    } else {
      // Try sessionStorage as fallback
      try {
        const sessionRaw = sessionStorage.getItem(`chat_msgs_${conversationId}`);
        if (sessionRaw) {
          const sessionCached = JSON.parse(sessionRaw);
          if (sessionCached.length > 0) {
            setMessages(sessionCached);
            messageCacheRef.current[conversationId] = sessionCached;
          }
        }
      } catch { /* ignore */ }
    }

    // === BACKGROUND REFRESH from backend ===
    try {
      const data = await apiClient.getMessages(conversationId);
      
      // If conversation changed while we were fetching, discard stale results
      if (conversationIdRef.current !== conversationId) return;

      // Load cached parts from localStorage (preserves artifacts/tool outputs across navigation)
      let cachedParts: Record<string, any[]> = {};
      try {
        const raw = localStorage.getItem(`chat_parts_${conversationId}`);
        if (raw) cachedParts = JSON.parse(raw);
      } catch {}

      const newMessages = data.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content || '',
        // Priority: 1) cached parts from localStorage, 2) backend metadata.parts, 3) plain text fallback
        parts: cachedParts[m.id] || m.metadata?.parts || [{ type: 'text', text: m.content || '' }],
        createdAt: m.created_at ? new Date(m.created_at) : new Date(),
      }));

      // Only update if we got data (don't clear existing cache with empty result)
      if (newMessages.length > 0) {
        setMessages(newMessages);
        messageCacheRef.current[conversationId] = newMessages;
      }
    } catch {
      // Don't clear messages on error — keep showing cached data
      if (!memCached || memCached.length === 0) {
        // Only clear if we had nothing cached either
        setMessages([]);
      }
    }
  };

  // Track whether we just created a new conversation (to skip re-loading messages)
  const skipNextLoadRef = useRef(false);
  // Track which conversation just finished streaming — prevents loadPreviousMessages from wiping tool UI parts
  // Stores the conversationId (not boolean) so it's scoped to the right conversation
  const justFinishedStreamRef = useRef<string | null>(null);
  // Track which conversation is currently being streamed to — prevents message overwrite on re-select
  const streamingConvRef = useRef<string | null>(null);

  // === FULL MESSAGE CACHE ===
  // Cache complete message arrays per conversation to prevent blank screen on switch
  const messageCacheRef = useRef<Record<string, any[]>>({});

  // Save current messages to cache whenever they change (debounced via conversation ID)
  // Also persist rich tool parts to localStorage during streaming so they survive navigation
  useEffect(() => {
    const convId = conversationIdRef.current;
    if (convId && streamMessages.length > 0) {
      messageCacheRef.current[convId] = streamMessages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content || '',
        parts: m.parts || [{ type: 'text', text: m.content || '' }],
        createdAt: m.createdAt,
      }));
      // Also persist to sessionStorage for tab-level persistence
      try {
        sessionStorage.setItem(`chat_msgs_${convId}`, JSON.stringify(messageCacheRef.current[convId]));
      } catch { /* storage full, ignore */ }

      // === LIVE PARTS CACHE ===
      // Persist rich tool parts to localStorage DURING streaming (not just on finish)
      // This ensures tool cards survive navigation away and back during generation
      try {
        const partsCache: Record<string, any[]> = {};
        streamMessages.forEach((m: any) => {
          if (m.parts && m.parts.length > 0) {
            const hasRichParts = m.parts.some((p: any) => p.type !== 'text' && p.type !== 'step-start');
            if (hasRichParts) {
              partsCache[m.id] = m.parts;
            }
          }
        });
        if (Object.keys(partsCache).length > 0) {
          try {
            const existing = JSON.parse(localStorage.getItem(`chat_parts_${convId}`) || '{}');
            localStorage.setItem(`chat_parts_${convId}`, JSON.stringify({ ...existing, ...partsCache }));
          } catch {
            localStorage.setItem(`chat_parts_${convId}`, JSON.stringify(partsCache));
          }
        }
      } catch { /* localStorage error, ignore */ }
    }
  }, [streamMessages]);

  // === PROCESS MANAGER SYNC ===
  // Automatically register tool invocations as background tasks in the Task Manager widget.
  // This allows users to navigate away and see tool progress in the bottom-right widget.
  useEffect(() => {
    if (streamMessages.length === 0) return;

    // Helper: Map tool name to ProcessType
    const getProcessType = (toolName: string): ProcessType => {
      if (toolName.includes('pptx') || toolName.includes('presentation') || toolName.includes('powerpoint') || toolName.includes('slide')) return 'slide';
      if (toolName.includes('document') || toolName.includes('docx') || toolName.includes('word')) return 'document';
      if (toolName.includes('afl') || toolName.includes('code')) return 'afl';
      if (toolName.includes('chart') || toolName.includes('stock') || toolName.includes('market') || toolName.includes('backtest') || toolName.includes('sector') || toolName.includes('risk') || toolName.includes('dividend') || toolName.includes('options') || toolName.includes('correlation') || toolName.includes('position') || toolName.includes('screener') || toolName.includes('compare')) return 'dashboard';
      if (toolName.includes('research') || toolName.includes('article') || toolName.includes('linkedin')) return 'article';
      return 'general';
    };

    // Helper: Get a readable title from tool name and input
    const getToolTitle = (toolName: string, input?: any): string => {
      const readable = toolName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      if (input?.title) return input.title;
      if (input?.symbol) return `${readable} (${input.symbol})`;
      if (input?.topic) return input.topic.slice(0, 40);
      if (input?.query) return input.query.slice(0, 40);
      return readable;
    };

    // Scan all messages for tool parts and sync with ProcessManager
    for (const msg of streamMessages) {
      if (msg.role !== 'assistant' || !msg.parts) continue;

      for (let pIdx = 0; pIdx < msg.parts.length; pIdx++) {
        const part = msg.parts[pIdx] as any;
        const isToolPart = part.type?.startsWith('tool-') || part.type === 'dynamic-tool';
        if (!isToolPart) continue;

        const toolName = part.type === 'dynamic-tool'
          ? (part.toolName || 'unknown')
          : (part.type?.replace('tool-', '') || 'unknown');

        // Create a unique key for this tool invocation
        const toolKey = `${msg.id}_${pIdx}_${toolName}`;

        const isActive = part.state === 'input-streaming' || part.state === 'input-available';
        const isDone = part.state === 'output-available';
        const isFailed = part.state === 'output-error';

        if (isActive && !trackedToolsRef.current.has(toolKey)) {
          // FIXED: Remove conversationId from addProcess call - not in BackgroundProcess type
          const processId = addProcess({
            title: getToolTitle(toolName, part.input),
            type: getProcessType(toolName),
            status: 'running',
            progress: 0,
            message: `Running ${toolName.replace(/_/g, ' ')}...`,
          });
          trackedToolsRef.current.set(toolKey, processId);
        } else if (isDone && trackedToolsRef.current.has(toolKey)) {
          // Update process to complete
          const processId = trackedToolsRef.current.get(toolKey)!;
          updateProcess(processId, {
            status: 'complete',
            progress: 100,
            message: 'Completed successfully',
            result: part.output,
          });
          trackedToolsRef.current.delete(toolKey);
        } else if (isFailed && trackedToolsRef.current.has(toolKey)) {
          // Update process to failed
          const processId = trackedToolsRef.current.get(toolKey)!;
          updateProcess(processId, {
            status: 'failed',
            progress: 0,
            message: 'Failed',
            error: part.errorText || 'Tool execution failed',
          });
          trackedToolsRef.current.delete(toolKey);
        } else if (isActive && trackedToolsRef.current.has(toolKey)) {
          // Update progress for running tools (simulate progress based on elapsed time)
          const processId = trackedToolsRef.current.get(toolKey)!;
          const inputInfo = part.input?.title || part.input?.symbol || part.input?.topic || '';
          updateProcess(processId, {
            message: inputInfo ? `Processing: ${inputInfo.slice(0, 50)}` : `Running ${toolName.replace(/_/g, ' ')}...`,
          });
        }
      }
    }
  }, [streamMessages, addProcess, updateProcess]);

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

          {/* Render parts - TRUNCATED FOR FILE SIZE - see full implementation in original file */}
          {/* ... rest of message rendering logic ... */}

          {/* Shimmer loading for submitted state */}
          {status === 'submitted' && isLast && message.role === 'assistant' && parts.every((p: any) => !p.text) && (
            <Shimmer duration={1.5}>Yang is Thinking...</Shimmer>
          )}
        </MessageContent>

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
      {/* Sidebar, Main chat area, and VoiceMode implementations... */}
      {/* TRUNCATED FOR FILE SIZE - see original for full implementation */}
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1.0); } }
      `}</style>
    </div>
  );
}

export default ChatPage;
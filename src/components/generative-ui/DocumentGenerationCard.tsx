'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { parseFileForPreview, ParsedDocument } from '@/lib/filePreview';

// ─── SVG Icon Components ──────────────────────────────────────────────────────

const IconWord = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="2" width="13" height="17" rx="2" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
    <path d="M7 7h6M7 10h6M7 13h4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14 15l2 5 2-4 2 4 2-5" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconPPTX = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="14" rx="2" fill={color} opacity="0.12" stroke={color} strokeWidth="1.5"/>
    <path d="M8 10h3a1.5 1.5 0 0 1 0 3H8V7h3a1.5 1.5 0 0 1 0 3" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M7 20h10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 17v3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconXLSX = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" fill={color} opacity="0.12" stroke={color} strokeWidth="1.5"/>
    <path d="M3 9h18M3 15h18M9 3v18M15 3v18" stroke={color} strokeWidth="1.2" opacity="0.6"/>
    <path d="M6 6l3 3m0-3L6 9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconPDF = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill={color} opacity="0.12" stroke={color} strokeWidth="1.5"/>
    <path d="M14 2v6h6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 13h2a1 1 0 1 1 0 2H8v-4h2a1 1 0 1 1 0 2" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M14 11v4m0-4h1a1.5 1.5 0 0 1 0 3h-1" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const IconAFL = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconDatapack = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" fill={color} opacity="0.12" stroke={color} strokeWidth="1.5"/>
    <path d="M3 8l9 5 9-5M12 13v8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconGeneric = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill={color} opacity="0.12" stroke={color} strokeWidth="1.5"/>
    <path d="M14 2v6h6M8 13h8M8 17h5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconDownload = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconCopy = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke={color} strokeWidth="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke={color} strokeWidth="2"/>
  </svg>
);

const IconCheck = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <polyline points="20 6 9 17 4 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconAlert = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeWidth="1.8"/>
    <line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconClock = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <polyline points="12 6 12 12 16 14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ─── File Type Definitions ───────────────────────────────────────────────────

type FileType = 'docx' | 'pptx' | 'xlsx' | 'pdf' | 'afl' | 'datapack' | 'generic';

interface FileTypeMeta {
  IconComponent: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  color: string;
  gradient: string;
  bgLight: string;
  bgDark: string;
  phases: string[];
}

const FILE_TYPES: Record<FileType, FileTypeMeta> = {
  docx: {
    IconComponent: IconWord,
    label: 'Word Document',
    color: '#2B579A',
    gradient: 'linear-gradient(135deg, #2B579A 0%, #3B7DD8 100%)',
    bgLight: 'rgba(43,87,154,0.08)',
    bgDark: 'rgba(43,87,154,0.15)',
    phases: [
      'Analysing content requirements',
      'Structuring document outline',
      'Writing document content',
      'Applying formatting and styles',
      'Generating DOCX file',
      'Finalising document',
    ],
  },
  pptx: {
    IconComponent: IconPPTX,
    label: 'PowerPoint Presentation',
    color: '#D24726',
    gradient: 'linear-gradient(135deg, #D24726 0%, #FF6B47 100%)',
    bgLight: 'rgba(210,71,38,0.08)',
    bgDark: 'rgba(210,71,38,0.15)',
    phases: [
      'Analysing presentation topic',
      'Designing slide structure',
      'Creating slide content',
      'Applying themes and layouts',
      'Generating visual elements',
      'Building PPTX file',
    ],
  },
  xlsx: {
    IconComponent: IconXLSX,
    label: 'Excel Spreadsheet',
    color: '#217346',
    gradient: 'linear-gradient(135deg, #217346 0%, #33A06F 100%)',
    bgLight: 'rgba(33,115,70,0.08)',
    bgDark: 'rgba(33,115,70,0.15)',
    phases: [
      'Analysing data requirements',
      'Structuring worksheets',
      'Populating cells and formulas',
      'Formatting tables and charts',
      'Generating XLSX file',
      'Finalising spreadsheet',
    ],
  },
  pdf: {
    IconComponent: IconPDF,
    label: 'PDF Document',
    color: '#B30B00',
    gradient: 'linear-gradient(135deg, #B30B00 0%, #E8453C 100%)',
    bgLight: 'rgba(179,11,0,0.08)',
    bgDark: 'rgba(179,11,0,0.15)',
    phases: [
      'Analysing content',
      'Structuring layout',
      'Rendering pages',
      'Applying typography',
      'Generating PDF',
      'Finalising document',
    ],
  },
  afl: {
    IconComponent: IconAFL,
    label: 'AFL Code',
    color: '#6366F1',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    bgLight: 'rgba(99,102,241,0.08)',
    bgDark: 'rgba(99,102,241,0.15)',
    phases: [
      'Analysing strategy requirements',
      'Designing signal logic',
      'Writing AFL code',
      'Adding risk management',
      'Validating syntax',
      'Finalising code',
    ],
  },
  datapack: {
    IconComponent: IconDatapack,
    label: 'Data Pack',
    color: '#0EA5E9',
    gradient: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
    bgLight: 'rgba(14,165,233,0.08)',
    bgDark: 'rgba(14,165,233,0.15)',
    phases: [
      'Gathering data sources',
      'Processing financial data',
      'Building data tables',
      'Formatting output sheets',
      'Generating data pack',
      'Packaging files',
    ],
  },
  generic: {
    IconComponent: IconGeneric,
    label: 'File',
    color: '#6B7280',
    gradient: 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
    bgLight: 'rgba(107,114,128,0.08)',
    bgDark: 'rgba(107,114,128,0.15)',
    phases: [
      'Analysing request',
      'Processing content',
      'Generating output',
      'Formatting file',
      'Building file',
      'Finalising',
    ],
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface DocumentGenerationCardProps {
  toolCallId: string;
  toolName: string;
  input: any;
  output?: any;
  externalOutput?: any; // injected by ChatPage from file_download events
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  errorText?: string;
  conversationId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectFileType(toolName: string, input?: any): FileType {
  const name = (toolName || '').toLowerCase();
  const inputStr = JSON.stringify(input || {}).toLowerCase();
  if (name.includes('docx') || name.includes('word') || name.includes('document')) return 'docx';
  if (name.includes('pptx') || name.includes('powerpoint') || name.includes('presentation') || name.includes('slide') || name.includes('deck')) return 'pptx';
  if (name.includes('xlsx') || name.includes('excel') || name.includes('spreadsheet')) return 'xlsx';
  if (name.includes('pdf')) return 'pdf';
  if (name.includes('afl') || name.includes('amibroker')) return 'afl';
  if (name.includes('datapack') || name.includes('data_pack')) return 'datapack';
  if (inputStr.includes('.docx') || inputStr.includes('word')) return 'docx';
  if (inputStr.includes('.pptx') || inputStr.includes('powerpoint')) return 'pptx';
  if (inputStr.includes('.xlsx') || inputStr.includes('excel')) return 'xlsx';
  return 'generic';
}

function extractTitle(input: any, toolName: string): string {
  if (!input) return 'Generating file';
  return (
    input.title ||
    input.topic ||
    input.filename ||
    input.name ||
    input.subject ||
    input.prompt?.slice(0, 60) ||
    input.message?.slice(0, 60) ||
    toolName.replace(/_/g, ' ')
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const DocumentGenerationCard: React.FC<DocumentGenerationCardProps> = ({
  toolCallId,
  toolName,
  input,
  output,
  externalOutput,
  state,
  errorText,
  conversationId,
}) => {
  const fileType = detectFileType(toolName, input);
  const meta = FILE_TYPES[fileType];
  const title = extractTitle(input, toolName);
  const FileIcon = meta.IconComponent;

  // Resolve relative backend paths to full Railway URLs
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'https://developer-potomaac.up.railway.app').replace(/\/+$/, '');
  const resolveUrl = (url: string) => url.startsWith('/') ? `${apiBase}${url}` : url;

  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isError, setIsError] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [outputData, setOutputData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [safetyTimeout, setSafetyTimeout] = useState(false);
  const [parsedDoc, setParsedDoc] = useState<ParsedDocument | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isDark =
    typeof window !== 'undefined' &&
    (document.documentElement.getAttribute('data-theme') === 'dark' ||
      window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  // ── Progress simulation ────────────────────────────────────────────────────
  const startProgressSimulation = useCallback(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    startTimeRef.current = Date.now();
    setElapsedTime(0);
    setProgress(0);
    setCurrentPhase(0);
    setIsComplete(false);
    setIsError(false);

    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    let currentProgress = 0;
    const totalPhases = meta.phases.length;

    progressIntervalRef.current = setInterval(() => {
      const increment = 0.3 + Math.random() * 1.2;
      currentProgress = Math.min(currentProgress + increment, 88);
      const phaseIndex = Math.min(Math.floor((currentProgress / 85) * totalPhases), totalPhases - 1);
      setProgress(Math.round(currentProgress * 10) / 10);
      setCurrentPhase(phaseIndex);
    }, 800 + Math.random() * 400);
  }, [meta.phases.length]);

  useEffect(() => {
    if (state === 'input-streaming' || state === 'input-available') {
      startProgressSimulation();
    }
  }, [state, startProgressSimulation]);

  // ── Safety timeout: if stuck at ~88% for 2 minutes, show a warning ────────
  useEffect(() => {
    if (state !== 'input-streaming' && state !== 'input-available') return;
    const timeout = setTimeout(() => {
      if (!isComplete && !isError) {
        setSafetyTimeout(true);
      }
    }, 120000); // 2 minutes
    return () => clearTimeout(timeout);
  }, [state, isComplete, isError]);

  // ── Wire externalOutput (file_download events) into the card ───────────────
  useEffect(() => {
    if (!externalOutput) return;
    const data = externalOutput;
    setOutputData((prev: any) => ({ ...prev, ...data }));
    setDownloadUrl(data.download_url || data.downloadUrl || data.file_url || downloadUrl);
    setFileId(data.file_id || data.fileId || data.document_id || data.presentation_id || fileId);
    // If we were still generating, snap to complete now
    if (!isComplete && !isError) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setProgress(100);
      setCurrentPhase(meta.phases.length - 1);
      setIsComplete(true);
      setSafetyTimeout(false);
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }
  }, [externalOutput]);

  // ── Fix 1: snap to 100% when state === 'output-available' (no && output guard) ──
  useEffect(() => {
    if (state === 'output-available') {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      const snapStart = progress;
      const snapDuration = 600;
      const snapStartTime = Date.now();

      const snapInterval = setInterval(() => {
        const elapsed = Date.now() - snapStartTime;
        const t = Math.min(elapsed / snapDuration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setProgress(Math.round((snapStart + (100 - snapStart) * eased) * 10) / 10);
        if (t >= 1) {
          clearInterval(snapInterval);
          setProgress(100);
          setCurrentPhase(meta.phases.length - 1);
          setIsComplete(true);
          setSafetyTimeout(false);
        }
      }, 16);

      if (output) {
        setOutputData(output);
        setDownloadUrl(output.download_url || output.downloadUrl || output.file_url || null);
        setFileId(output.file_id || output.fileId || output.document_id || output.presentation_id || null);
      }
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }
  }, [state, output, meta.phases.length]);

  useEffect(() => {
    if (state === 'output-error') {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setIsError(true);
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }
  }, [state]);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!downloadUrl && !fileId) { toast.error('No download available'); return; }
    try {
      let response: Response;
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (downloadUrl) {
        response = await fetch(resolveUrl(downloadUrl), {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
      } else {
        response = await fetch(`${apiBase}/files/${fileId}/download`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
      }
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = outputData?.filename || outputData?.title || `generated-file.${fileType === 'generic' ? 'bin' : fileType}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('File downloaded');
    } catch {
      toast.error('Download failed — please try again');
    }
  };

  const handleCopy = () => {
    const text = outputData?.code || outputData?.content || outputData?.text || '';
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied to clipboard');
    }
  };

  const formatTime = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

  const formatSize = () => {
    if (!outputData) return null;
    const kb = outputData.file_size_kb || outputData.fileSizeKb || outputData.size_kb;
    if (kb) return `${kb} KB`;
    const bytes = outputData.file_size || outputData.size;
    if (bytes) return bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
    return null;
  };

  // ── Fetch and parse file for preview ─────────────────────────────────────
  const loadPreview = useCallback(async () => {
    if (!downloadUrl || !isComplete) return;
    const supportedTypes = ['docx', 'xlsx', 'pdf'];
    if (!supportedTypes.includes(fileType)) return;

    setPreviewLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch(resolveUrl(downloadUrl), {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      const filename = outputData?.filename || `file.${fileType}`;
      const parsed = await parseFileForPreview(blob, filename);
      setParsedDoc(parsed);
    } catch (err) {
      console.error('Preview failed:', err);
      setParsedDoc({ type: 'unsupported', content: 'Preview could not be loaded.' });
    } finally {
      setPreviewLoading(false);
    }
  }, [downloadUrl, isComplete, fileType, outputData]);

  useEffect(() => {
    if (previewOpen && isComplete && downloadUrl && (fileType === 'docx' || fileType === 'xlsx' || fileType === 'pdf')) {
      loadPreview();
    }
  }, [previewOpen, isComplete, downloadUrl, fileType, loadPreview]);

  // ── Theme tokens ───────────────────────────────────────────────────────────
  const cardBg    = isDark ? '#111114' : '#FAFAFA';
  const borderCol = isDark ? `${meta.color}28` : `${meta.color}1A`;
  const textColor = isDark ? '#F0F0F0' : '#111111';
  const mutedCol  = isDark ? '#7A7A88' : '#6B7280';
  const trackCol  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const metaBg    = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)';
  const metaBdr   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      marginTop: '12px',
      borderRadius: '14px',
      border: `1px solid ${borderCol}`,
      backgroundColor: cardBg,
      overflow: 'hidden',
      fontFamily: "'Instrument Sans', sans-serif",
      boxShadow: isDark ? `0 4px 20px ${meta.color}12` : `0 4px 20px ${meta.color}0A`,
    }}>

      {/* Accent bar */}
      <div style={{
        height: '3px',
        background: isError
          ? 'linear-gradient(90deg, #EF4444, #F97316)'
          : isComplete
            ? `linear-gradient(90deg, ${meta.color}, #10B981)`
            : meta.gradient,
        transition: 'background 0.5s ease',
      }} />

      <div style={{ padding: '16px 18px' }}>

        {/* ── Title row ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>

            {/* Icon badge */}
            <div style={{
              width: '42px', height: '42px',
              borderRadius: '11px',
              background: isDark ? meta.bgDark : meta.bgLight,
              border: `1px solid ${borderCol}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'box-shadow 0.3s ease',
              boxShadow: isComplete ? `0 4px 12px ${meta.color}20` : 'none',
            }}>
              <FileIcon size={20} color={meta.color} />
            </div>

            {/* Title + label */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: '13.5px',
                color: textColor,
                letterSpacing: '0.2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {title}
              </div>
              <div style={{
                fontSize: '11.5px',
                color: mutedCol,
                marginTop: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span>{meta.label}</span>
                <span style={{ opacity: 0.35 }}>·</span>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  backgroundColor: `${meta.color}14`,
                  color: meta.color,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  fontFamily: "'DM Mono', monospace",
                }}>
                  SKILL
                </span>
              </div>
            </div>
          </div>

          {/* Status pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '10.5px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            fontFamily: "'DM Mono', monospace",
            flexShrink: 0,
            ...(isError
              ? { backgroundColor: isDark ? 'rgba(239,68,68,0.14)' : 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }
              : isComplete
                ? { backgroundColor: isDark ? 'rgba(16,185,129,0.14)' : 'rgba(16,185,129,0.08)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }
                : { backgroundColor: `${meta.color}12`, color: meta.color, border: `1px solid ${meta.color}20` }),
          }}>
            {isError ? (
              <><IconAlert size={11} color="#EF4444" /> ERROR</>
            ) : isComplete ? (
              <><IconCheck size={11} color="#10B981" /> COMPLETE</>
            ) : (
              <>
                <span style={{
                  width: '7px', height: '7px',
                  borderRadius: '50%',
                  backgroundColor: meta.color,
                  animation: 'docGenPulse 1.5s ease-in-out infinite',
                  display: 'inline-block',
                }} />
                GENERATING
              </>
            )}
          </div>
        </div>

        {/* ── Progress section ──────────────────────────────────────────────── */}
        {!isError && (
          <div style={{ marginBottom: '12px' }}>

            {/* Track */}
            <div style={{
              width: '100%', height: '6px',
              borderRadius: '3px',
              backgroundColor: trackCol,
              overflow: 'hidden', position: 'relative',
            }}>
              <div style={{
                height: '100%',
                borderRadius: '3px',
                background: isComplete ? `linear-gradient(90deg, ${meta.color}, #10B981)` : meta.gradient,
                width: `${progress}%`,
                transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {!isComplete && progress > 0 && (
                  <div style={{
                    position: 'absolute', top: 0, left: '-100%',
                    width: '100%', height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)',
                    animation: 'docGenShimmer 2s linear infinite',
                  }} />
                )}
              </div>
            </div>

            {/* Phase + time row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '8px',
            }}>
              <div style={{
                fontSize: '11.5px',
                color: isComplete ? '#10B981' : meta.color,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                maxWidth: '60%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {!isComplete && (
                  <span style={{
                    display: 'inline-block',
                    width: '11px', height: '11px',
                    border: `1.8px solid ${meta.color}`,
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'docGenSpin 0.8s linear infinite',
                    flexShrink: 0,
                  }} />
                )}
                {isComplete ? 'Generation complete' : meta.phases[currentPhase] || 'Processing'}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                color: mutedCol,
                fontFamily: "'DM Mono', monospace",
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <IconClock size={11} color={mutedCol} />
                  {formatTime(elapsedTime)}
                </span>
                <span style={{
                  fontWeight: 800,
                  fontSize: '12.5px',
                  color: isComplete ? '#10B981' : meta.color,
                }}>
                  {Math.round(progress)}%
                </span>
              </div>
            </div>

            {/* Phase step dots */}
            {!isComplete && (
              <div style={{ display: 'flex', gap: '3px', marginTop: '9px' }}>
                {meta.phases.map((_, idx) => (
                  <div key={idx} style={{
                    flex: 1, height: '2px', borderRadius: '2px',
                    backgroundColor: idx < currentPhase
                      ? meta.color
                      : idx === currentPhase
                        ? `${meta.color}70`
                        : trackCol,
                    transition: 'background-color 0.4s ease',
                  }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Error section ─────────────────────────────────────────────────── */}
        {isError && (
          <div style={{
            padding: '11px 13px',
            borderRadius: '9px',
            backgroundColor: isDark ? 'rgba(239,68,68,0.09)' : '#FEF2F2',
            border: '1px solid rgba(239,68,68,0.18)',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}>
            <IconAlert size={15} color={isDark ? '#FCA5A5' : '#DC2626'} />
            <span style={{ fontSize: '12.5px', color: isDark ? '#FCA5A5' : '#DC2626', lineHeight: 1.5 }}>
              {errorText || 'Generation failed — please try again.'}
            </span>
          </div>
        )}

        {/* ── Complete: file info + actions ─────────────────────────────────── */}
        {isComplete && outputData && (
          <div>
            {/* Metadata row */}
            <div style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              marginBottom: '12px',
              padding: '9px 12px',
              borderRadius: '9px',
              backgroundColor: metaBg,
              border: `1px solid ${metaBdr}`,
            }}>
              {outputData.filename && (
                <div style={{ fontSize: '11.5px', color: mutedCol }}>
                  <span style={{ fontWeight: 700, color: textColor }}>File </span>
                  {outputData.filename}
                </div>
              )}
              {formatSize() && (
                <div style={{ fontSize: '11.5px', color: mutedCol }}>
                  <span style={{ fontWeight: 700, color: textColor }}>Size </span>
                  {formatSize()}
                </div>
              )}
              {(outputData.slides || outputData.slide_count || outputData.pages || outputData.page_count) && (
                <div style={{ fontSize: '11.5px', color: mutedCol }}>
                  <span style={{ fontWeight: 700, color: textColor }}>
                    {outputData.slides || outputData.slide_count ? 'Slides ' : 'Pages '}
                  </span>
                  {outputData.slides || outputData.slide_count || outputData.pages || outputData.page_count}
                </div>
              )}
              {(outputData.sheets || outputData.sheet_count) && (
                <div style={{ fontSize: '11.5px', color: mutedCol }}>
                  <span style={{ fontWeight: 700, color: textColor }}>Sheets </span>
                  {outputData.sheets || outputData.sheet_count}
                </div>
              )}
              <div style={{ fontSize: '11.5px', color: mutedCol, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ fontWeight: 700, color: textColor }}>Time </span>
                {formatTime(elapsedTime)}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
              {(downloadUrl || fileId) && (
                <button
                  onClick={handleDownload}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '9px 18px',
                    borderRadius: '9px',
                    border: 'none',
                    background: meta.gradient,
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    fontFamily: "'Syne', sans-serif",
                    letterSpacing: '0.4px',
                    boxShadow: `0 3px 10px ${meta.color}28`,
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = `0 5px 14px ${meta.color}38`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 3px 10px ${meta.color}28`;
                  }}
                >
                  <IconDownload size={13} color="#fff" />
                  DOWNLOAD {fileType.toUpperCase()}
                </button>
              )}

              {(outputData?.code || outputData?.content || outputData?.text) && (
                <button
                  onClick={handleCopy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 14px',
                    borderRadius: '9px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                    background: 'transparent',
                    color: mutedCol,
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    fontFamily: "'Instrument Sans', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = meta.color;
                    e.currentTarget.style.color = meta.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
                    e.currentTarget.style.color = mutedCol;
                  }}
                >
                  {copied ? <><IconCheck size={12} color="#10B981" /> Copied</> : <><IconCopy size={12} /> Copy</>}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Safety timeout warning ──────────────────────────────────────────── */}
        {safetyTimeout && !isComplete && !isError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '9px',
            backgroundColor: isDark ? 'rgba(251,191,36,0.08)' : '#FFFBEB',
            border: '1px solid rgba(251,191,36,0.2)',
            marginBottom: '12px',
          }}>
            <IconAlert size={14} color="#F59E0B" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#F59E0B' }}>
                Taking longer than expected
              </div>
              <div style={{ fontSize: '10.5px', color: mutedCol, marginTop: '2px' }}>
                The backend may still be processing. You can wait or check manually.
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(251,191,36,0.3)',
                background: 'rgba(251,191,36,0.1)',
                color: '#F59E0B',
                fontSize: '10.5px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'DM Mono', monospace",
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}
            >
              Refresh
            </button>
          </div>
        )}

        {/* ── Inline live preview panel (JS library-based) ────────────────────── */}
        {isComplete && downloadUrl && previewOpen && (fileType === 'pptx' || fileType === 'docx' || fileType === 'xlsx' || fileType === 'pdf') && (
          <div style={{
            marginTop: '12px',
            borderRadius: '10px',
            overflow: 'hidden',
            border: `1px solid ${metaBdr}`,
          }}>
            {/* Preview header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              backgroundColor: metaBg,
              borderBottom: `1px solid ${metaBdr}`,
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: textColor,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <FileIcon size={13} color={meta.color} />
                Preview
              </span>
              <button
                onClick={() => setPreviewOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: mutedCol,
                  fontSize: '10px',
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = textColor; }}
                onMouseLeave={e => { e.currentTarget.style.color = mutedCol; }}
              >
                ▲ Hide Preview
              </button>
            </div>
            {/* Preview content */}
            <div style={{
              position: 'relative',
              width: '100%',
              maxHeight: '400px',
              overflow: 'auto',
              backgroundColor: isDark ? '#0D0D10' : '#FFFFFF',
            }}>
              {previewLoading ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  gap: '8px',
                  color: mutedCol,
                  fontSize: '12px',
                }}>
                  <span style={{
                    width: '14px', height: '14px',
                    border: `2px solid ${meta.color}`,
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'docGenSpin 0.8s linear infinite',
                    display: 'inline-block',
                  }} />
                  Loading preview…
                </div>
              ) : fileType === 'pptx' ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  gap: '8px',
                  color: mutedCol,
                  fontSize: '12px',
                }}>
                  <FileIcon size={32} color={meta.color} />
                  <span>PPTX preview is not available in-browser.</span>
                  <span style={{ fontSize: '11px', opacity: 0.7 }}>Use the download button to open the file.</span>
                </div>
              ) : parsedDoc ? (
                <div style={{ padding: '14px 16px' }}>
                  {parsedDoc.type === 'html' && (
                    <div
                      style={{
                        fontSize: '13px',
                        lineHeight: 1.7,
                        color: textColor,
                        fontFamily: "'Instrument Sans', sans-serif",
                      }}
                      dangerouslySetInnerHTML={{ __html: parsedDoc.content }}
                    />
                  )}
                  {parsedDoc.type === 'text' && (
                    <pre style={{
                      margin: 0,
                      fontSize: '12px',
                      lineHeight: 1.6,
                      color: textColor,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: "'DM Mono', monospace",
                    }}>
                      {parsedDoc.content}
                    </pre>
                  )}
                  {parsedDoc.type === 'table' && parsedDoc.tables && (
                    <div>
                      {parsedDoc.tables.map((table, tIdx) => (
                        <div key={tIdx} style={{ marginBottom: tIdx < parsedDoc.tables!.length - 1 ? '20px' : 0 }}>
                          {table.name && (
                            <div style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: meta.color,
                              marginBottom: '8px',
                              fontFamily: "'Syne', sans-serif",
                            }}>
                              {table.name}
                            </div>
                          )}
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{
                              width: '100%',
                              borderCollapse: 'collapse',
                              fontSize: '11.5px',
                              fontFamily: "'Instrument Sans', sans-serif",
                            }}>
                              <thead>
                                <tr>
                                  {table.headers.map((h, hIdx) => (
                                    <th key={hIdx} style={{
                                      padding: '6px 10px',
                                      textAlign: 'left',
                                      fontWeight: 700,
                                      fontSize: '10.5px',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                      color: mutedCol,
                                      borderBottom: `1px solid ${metaBdr}`,
                                      backgroundColor: metaBg,
                                      whiteSpace: 'nowrap',
                                    }}>
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {table.rows.slice(0, 100).map((row, rIdx) => (
                                  <tr key={rIdx} style={{
                                    backgroundColor: rIdx % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'),
                                  }}>
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx} style={{
                                        padding: '5px 10px',
                                        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                                        color: textColor,
                                        whiteSpace: 'nowrap',
                                        maxWidth: '200px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}>
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {table.rows.length > 100 && (
                            <div style={{
                              fontSize: '10.5px',
                              color: mutedCol,
                              marginTop: '6px',
                              fontStyle: 'italic',
                            }}>
                              Showing first 100 of {table.rows.length} rows
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {parsedDoc.type === 'unsupported' && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '150px',
                      gap: '6px',
                      color: mutedCol,
                      fontSize: '12px',
                    }}>
                      {parsedDoc.content}
                    </div>
                  )}
                  {parsedDoc.metadata && (
                    <div style={{
                      marginTop: '12px',
                      paddingTop: '8px',
                      borderTop: `1px solid ${metaBdr}`,
                      display: 'flex',
                      gap: '14px',
                      fontSize: '10.5px',
                      color: mutedCol,
                      fontFamily: "'DM Mono', monospace",
                    }}>
                      {parsedDoc.metadata.pages && <span>{parsedDoc.metadata.pages} pages</span>}
                      {parsedDoc.metadata.wordCount && <span>{parsedDoc.metadata.wordCount.toLocaleString()} words</span>}
                      {parsedDoc.metadata.lineCount && <span>{parsedDoc.metadata.lineCount} lines</span>}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '150px',
                  color: mutedCol,
                  fontSize: '12px',
                }}>
                  No preview available
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── AFL code preview ──────────────────────────────────────────────── */}
        {isComplete && fileType === 'afl' && outputData?.code && (
          <div style={{
            marginTop: '12px',
            borderRadius: '10px',
            overflow: 'hidden',
            border: `1px solid ${metaBdr}`,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              backgroundColor: metaBg,
              borderBottom: `1px solid ${metaBdr}`,
            }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: textColor, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileIcon size={13} color={meta.color} />
                AFL Code
              </span>
              <button
                onClick={() => setPreviewOpen(!previewOpen)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: mutedCol, fontSize: '10px',
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: '0.04em',
                }}
              >
                {previewOpen ? '▲ Hide' : '▼ Show'}
              </button>
            </div>
            {previewOpen && (
              <pre style={{
                margin: 0,
                padding: '14px 16px',
                fontSize: '12px',
                lineHeight: 1.6,
                color: textColor,
                backgroundColor: isDark ? '#0D0D10' : '#FAFAFA',
                overflow: 'auto',
                maxHeight: '300px',
                fontFamily: "'DM Mono', monospace",
              }}>
                {outputData.code}
              </pre>
            )}
          </div>
        )}

        {/* ── Collapsed preview toggle ──────────────────────────────────────── */}
        {isComplete && downloadUrl && !previewOpen && (fileType === 'pptx' || fileType === 'docx' || fileType === 'xlsx' || fileType === 'pdf') && (
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={() => setPreviewOpen(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: mutedCol, fontSize: '10.5px', fontWeight: 600,
                fontFamily: "'DM Mono', monospace",
                letterSpacing: '0.04em',
                display: 'flex', alignItems: 'center', gap: '4px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = meta.color; }}
              onMouseLeave={e => { e.currentTarget.style.color = mutedCol; }}
            >
              ▼ Show Preview
            </button>
          </div>
        )}

        {/* ── Open in new tab button (when preview is shown) ────────────────── */}
        {isComplete && downloadUrl && previewOpen && (fileType === 'pptx' || fileType === 'docx' || fileType === 'xlsx' || fileType === 'pdf') && (
          <div style={{ marginTop: '8px', display: 'flex', gap: '7px' }}>
            <button
              onClick={() => window.open(resolveUrl(downloadUrl), '_blank')}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '7px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                background: 'transparent', color: mutedCol,
                fontWeight: 600, fontSize: '11px', cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: "'Instrument Sans', sans-serif",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = meta.color; e.currentTarget.style.color = meta.color; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = mutedCol; }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Open in new tab
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(resolveUrl(downloadUrl));
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                toast.success('URL copied');
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '7px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                background: 'transparent', color: mutedCol,
                fontWeight: 600, fontSize: '11px', cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: "'Instrument Sans', sans-serif",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = meta.color; e.currentTarget.style.color = meta.color; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = mutedCol; }}
            >
              {copied ? <><IconCheck size={11} color="#10B981" /> Copied</> : <><IconCopy size={11} /> Copy URL</>}
            </button>
          </div>
        )}

        {/* ── Estimated time hint ───────────────────────────────────────────── */}
        {!isComplete && !isError && progress > 5 && (
          <div style={{
            fontSize: '10.5px',
            color: mutedCol,
            textAlign: 'center',
            marginTop: '6px',
            opacity: 0.65,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.04em',
          }}>
            {progress < 50 ? '30–60 seconds remaining' : progress < 80 ? 'Almost there' : 'Wrapping up'}
          </div>
        )}
      </div>

      <style>{`
        @keyframes docGenPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.82); }
        }
        @keyframes docGenSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes docGenShimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }
      `}</style>
    </div>
  );
};

export default DocumentGenerationCard;
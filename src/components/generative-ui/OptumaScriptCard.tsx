'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// ─── SVG Icon Components ──────────────────────────────────────────────────────

const IconOptuma = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
    <path d="M8 12h8M12 8v8" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.6"/>
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

const IconClock = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <polyline points="12 6 12 12 16 14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconCode = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <polyline points="16 18 22 12 16 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="8 6 2 12 8 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconChevron = ({ size = 14, color = 'currentColor', direction = 'down' }: { size?: number; color?: string; direction?: 'up' | 'down' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ transform: direction === 'up' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
  >
    <polyline points="6 9 12 15 18 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconWarning = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 9v4M12 17h.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── Constants ────────────────────────────────────────────────────────────────

const OPTUMA_META = {
  color: '#0EA5E9',
  colorDark: '#0284C7',
  gradient: 'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)',
  bgLight: 'rgba(14, 165, 233, 0.08)',
  bgDark: 'rgba(14, 165, 233, 0.15)',
  phases: [
    'Analysing script requirements',
    'Designing indicator logic',
    'Writing Optuma script',
    'Adding property parameters',
    'Validating syntax',
    'Finalising code',
  ],
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface OptumaScriptCardProps {
  toolCallId: string;
  toolName: string;
  input: any;
  output?: any;
  externalOutput?: any;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  errorText?: string;
  conversationId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractTitle(input: any): string {
  if (!input) return 'Generating Optuma script';
  return (
    input.script_name ||
    input.indicator_name ||
    input.scan_name ||
    input.title ||
    input.strategy ||
    input.description?.slice(0, 60) ||
    input.prompt?.slice(0, 60) ||
    input.message?.slice(0, 60) ||
    'Optuma Script'
  );
}

function extractScriptCode(output: any): string | null {
  if (!output) return null;
  if (typeof output === 'string') return output;
  if (output.script_code) return output.script_code;
  if (output.script) return output.script;
  if (output.code) return output.code;
  if (output.content) return output.content;
  if (output.text) return output.text;
  if (output.data?.script_code) return output.data.script_code;
  if (output.data?.script) return output.data.script;
  if (output.data?.code) return output.data.code;
  if (output.data?.content) return output.data.content;
  return null;
}

function extractDownloadInfo(output: any): { downloadUrl: string | null; fileId: string | null } {
  if (!output || typeof output !== 'object') return { downloadUrl: null, fileId: null };
  const data = output.data || {};
  return {
    downloadUrl:
      output.download_url || output.downloadUrl || output.file_url || output.url ||
      data.download_url || data.downloadUrl || data.file_url || data.url || null,
    fileId:
      output.file_id || output.fileId || output.script_id ||
      data.file_id || data.fileId || data.script_id || null,
  };
}

function extractFilename(output: any, input: any): string {
  if (output?.filename) return output.filename;
  if (output?.data?.filename) return output.data.filename;
  if (input?.filename) return input.filename;
  const name =
    output?.script_name || output?.indicator_name || output?.scan_name ||
    output?.data?.script_name ||
    input?.script_name || input?.indicator_name || input?.title || input?.strategy ||
    'Optuma_Script';
  return `${name.replace(/\s+/g, '_')}.opt`;
}

function extractScriptType(output: any, input: any): string | null {
  const raw =
    output?.script_type || output?.type || output?.data?.script_type ||
    input?.script_type || input?.type || null;
  if (!raw) return null;
  const map: Record<string, string> = {
    signal: 'Signal Script',
    boolean: 'Signal Script',
    indicator: 'Custom Indicator',
    show_plot: 'Show Plot',
    scan: 'Scan',
    watchlist: 'Watchlist Column',
    backtest: 'Back Test',
    alert: 'Alert',
  };
  return map[raw.toLowerCase()] || raw;
}

function extractMetadata(output: any): { scriptType?: string; indicators?: string[]; signals?: string[] } {
  const data = output?.data || output || {};
  return {
    scriptType: data.script_type || data.type,
    indicators: Array.isArray(data.indicators) ? data.indicators : undefined,
    signals: Array.isArray(data.signals) ? data.signals : undefined,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const OptumaScriptCard: React.FC<OptumaScriptCardProps> = ({
  toolCallId,
  toolName,
  input,
  output,
  externalOutput,
  state,
  errorText,
  conversationId,
}) => {
  const title = extractTitle(input);

  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isError, setIsError] = useState(false);
  const [outputData, setOutputData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [codePreviewOpen, setCodePreviewOpen] = useState(false);
  const [safetyTimeout, setSafetyTimeout] = useState(false);
  const [fetchedCode, setFetchedCode] = useState<string | null>(null);
  const [fetchingCode, setFetchingCode] = useState(false);
  const fetchedForRef = useRef<string | null>(null);

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
  const resolveUrl = (url: string) => url.startsWith('/') ? `${apiBase}${url}` : url;

  const startTimeRef = useRef<number>(Date.now());
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restoredFromStorage = useRef(false);

  const STORAGE_KEY = `optumagen_state_${toolCallId}`;

  // ── Restore state from output prop or localStorage on mount ───────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const effectiveOutput = output || externalOutput;
    if (state === 'output-available' && effectiveOutput) {
      restoredFromStorage.current = true;
      setIsComplete(true);
      setProgress(100);
      setCurrentPhase(OPTUMA_META.phases.length - 1);
      setOutputData(effectiveOutput);
      setSafetyTimeout(false);
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Date.now() - (saved.timestamp || 0) < 86400000) {
          if (saved.isComplete) {
            restoredFromStorage.current = true;
            setIsComplete(true);
            setProgress(100);
            setCurrentPhase(OPTUMA_META.phases.length - 1);
            if (saved.outputData) setOutputData(saved.outputData);
            if (saved.elapsedTime) setElapsedTime(saved.elapsedTime);
            setSafetyTimeout(false);
          } else if (saved.isError) {
            restoredFromStorage.current = true;
            setIsError(true);
            if (saved.elapsedTime) setElapsedTime(saved.elapsedTime);
          }
        }
      }
    } catch {
      // localStorage not available
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist state to localStorage ─────────────────────────────────────────
  const persistState = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        isComplete,
        isError,
        outputData,
        elapsedTime,
        timestamp: Date.now(),
      }));
    } catch {
      // localStorage not available
    }
  }, [STORAGE_KEY, isComplete, isError, outputData, elapsedTime]);

  useEffect(() => {
    if (isComplete || isError) persistState();
  }, [isComplete, isError, persistState]);

  // ── Progress animation ─────────────────────────────────────────────────────
  useEffect(() => {
    if (restoredFromStorage.current || isComplete || isError) return;
    if (state === 'input-streaming' || state === 'input-available') {
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 3, 92));
        setCurrentPhase(prev => {
          if (Math.random() < 0.15) return Math.min(prev + 1, OPTUMA_META.phases.length - 2);
          return prev;
        });
      }, 600);

      timerIntervalRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [state, isComplete, isError]);

  // ── Handle output when available ───────────────────────────────────────────
  useEffect(() => {
    if (restoredFromStorage.current) return;
    if (state === 'output-available') {
      const effectiveOutput = output || externalOutput;
      if (effectiveOutput) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setProgress(100);
        setCurrentPhase(OPTUMA_META.phases.length - 1);
        setOutputData(effectiveOutput);
        setIsComplete(true);
        setSafetyTimeout(false);
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }
  }, [state, output, externalOutput]);

  // ── Handle error state ─────────────────────────────────────────────────────
  useEffect(() => {
    if (state === 'output-error') {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setIsError(true);
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }
  }, [state]);

  // ── Safety timeout ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isComplete || isError) return;
    const timeout = setTimeout(() => {
      if (!isComplete && !isError) setSafetyTimeout(true);
    }, 180000);
    return () => clearTimeout(timeout);
  }, [isComplete, isError]);

  // ── Fetch script file from backend when output only contains a URL ────────
  useEffect(() => {
    if (!isComplete) return;
    const inlineCode = extractScriptCode(outputData);
    if (inlineCode) return;
    const { downloadUrl, fileId } = extractDownloadInfo(outputData);
    if (!downloadUrl && !fileId) return;
    const fetchKey = downloadUrl || fileId || '';
    if (fetchedForRef.current === fetchKey) return;
    fetchedForRef.current = fetchKey;

    const controller = new AbortController();
    (async () => {
      try {
        setFetchingCode(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const url = downloadUrl
          ? resolveUrl(downloadUrl)
          : `${apiBase}/files/${fileId}/download`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const text = await res.text();
        if (text && text.length > 0) setFetchedCode(text);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('[OptumaScriptCard] Failed to fetch script file:', err);
        }
      } finally {
        setFetchingCode(false);
      }
    })();

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, outputData]);

  const effectiveCode = extractScriptCode(outputData) || fetchedCode;

  // ── Copy to clipboard ──────────────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    if (effectiveCode) {
      navigator.clipboard.writeText(effectiveCode);
      setCopied(true);
      toast.success('Optuma script copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Script not ready yet');
    }
  }, [effectiveCode]);

  // ── Download script file ───────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    const filename = extractFilename(outputData, input);

    if (effectiveCode) {
      const blob = new Blob([effectiveCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${filename}`);
      return;
    }

    const { downloadUrl, fileId } = extractDownloadInfo(outputData);
    if (!downloadUrl && !fileId) {
      toast.error('No script available to download');
      return;
    }
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const url = downloadUrl
        ? resolveUrl(downloadUrl)
        : `${apiBase}/files/${fileId}/download`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      const blob = await res.blob();
      const text = await blob.text();
      if (text) setFetchedCode(text);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success(`Downloaded ${filename}`);
    } catch (err) {
      console.error('[OptumaScriptCard] Download failed:', err);
      toast.error('Download failed — please try again');
    }
  }, [outputData, input, effectiveCode, apiBase]);

  // ── Utilities ──────────────────────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const scriptCode = effectiveCode;
  const codeLines = scriptCode ? scriptCode.split('\n').length : 0;
  const filename = outputData ? extractFilename(outputData, input) : null;
  const codeSize = scriptCode ? `${(scriptCode.length / 1024).toFixed(1)} KB` : null;
  const metadata = extractMetadata(outputData);
  const scriptTypeLabel = extractScriptType(outputData, input);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      borderRadius: '16px',
      overflow: 'hidden',
      border: `1px solid ${isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(14, 165, 233, 0.3)'}`,
      maxWidth: '720px',
      marginTop: '8px',
      backgroundColor: '#0d0d0d',
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 20px',
        background: isError ? 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)' : OPTUMA_META.gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <IconOptuma size={22} color="#fff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontWeight: 600,
              fontSize: '14px',
              color: '#fff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {title}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Optuma Script
              {scriptTypeLabel && (
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(0,0,0,0.25)',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  {scriptTypeLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div style={{
          padding: '6px 12px',
          borderRadius: '20px',
          backgroundColor: isComplete
            ? 'rgba(34, 197, 94, 0.9)'
            : isError
              ? 'rgba(239, 68, 68, 0.9)'
              : 'rgba(0,0,0,0.3)',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexShrink: 0,
        }}>
          {isComplete ? (
            <><IconCheck size={12} color="#fff" /> COMPLETE</>
          ) : isError ? (
            'ERROR'
          ) : (
            <>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                animation: 'optumaPulse 1.5s infinite',
              }} />
              SCRIPTING
            </>
          )}
        </div>
      </div>

      {/* ── Progress Section (during generation) ───────────────────────────── */}
      {!isComplete && !isError && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{
            height: '6px',
            borderRadius: '3px',
            backgroundColor: 'rgba(14, 165, 233, 0.15)',
            overflow: 'hidden',
            marginBottom: '12px',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: OPTUMA_META.gradient,
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }} />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>
              {OPTUMA_META.phases[currentPhase]}...
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IconClock size={11} color="rgba(255,255,255,0.4)" />
              {formatTime(elapsedTime)}
            </span>
          </div>

          <div style={{
            marginTop: '14px',
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(14, 165, 233, 0.08)',
            border: '1px solid rgba(14, 165, 233, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <IconWarning size={16} color={OPTUMA_META.color} />
            <span style={{ fontSize: '12px', color: OPTUMA_META.color, lineHeight: 1.4 }}>
              Please do not navigate away or refresh while the script is generating. Your code may be lost.
            </span>
          </div>
        </div>
      )}

      {/* ── File Info (when complete) ──────────────────────────────────────── */}
      {isComplete && filename && (
        <div style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: OPTUMA_META.bgDark,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(14, 165, 233, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <IconOptuma size={18} color={OPTUMA_META.color} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: '#fff' }}>{filename}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'flex', gap: '12px', marginTop: '2px' }}>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(14, 165, 233, 0.2)',
                  color: OPTUMA_META.color,
                  fontSize: '10px',
                  fontWeight: 600,
                }}>OPT</span>
                {codeSize && <span>{codeSize}</span>}
                <span>{formatTime(elapsedTime)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownload}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: OPTUMA_META.gradient,
              color: '#fff',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <IconDownload size={14} color="#fff" />
            Download Script
          </button>
        </div>
      )}

      {/* ── Metadata (when complete) ───────────────────────────────────────── */}
      {isComplete && metadata && (metadata.indicators || metadata.signals) && (
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          fontSize: '12px',
        }}>
          {metadata.indicators && metadata.indicators.length > 0 && (
            <div>
              <span style={{ color: 'rgba(255,255,255,0.4)', marginRight: '8px' }}>Functions:</span>
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>{metadata.indicators.join(', ')}</span>
            </div>
          )}
          {metadata.signals && metadata.signals.length > 0 && (
            <div>
              <span style={{ color: 'rgba(255,255,255,0.4)', marginRight: '8px' }}>Signals:</span>
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>{metadata.signals.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Actions Row ────────────────────────────────────────────────────── */}
      {isComplete && (
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={handleDownload}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: OPTUMA_META.color,
              color: '#fff',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconDownload size={13} color="#fff" />
            DOWNLOAD SCRIPT
          </button>

          <button
            onClick={handleCopy}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.15)',
              backgroundColor: 'transparent',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 500,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {copied
              ? <><IconCheck size={13} color="#22c55e" /> Copied</>
              : <><IconCopy size={13} /> Copy</>}
          </button>
        </div>
      )}

      {/* ── Code Preview ──────────────────────────────────────────────────── */}
      {isComplete && scriptCode && (
        <div>
          <button
            onClick={() => setCodePreviewOpen(!codePreviewOpen)}
            style={{
              width: '100%',
              padding: '12px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: codePreviewOpen ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconCode size={14} color="rgba(255,255,255,0.5)" />
              Preview Script Before Downloading
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                ({codeLines} lines)
              </span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: OPTUMA_META.color }}>
              {codePreviewOpen ? 'Hide' : 'Show'} Code
              <IconChevron size={14} color={OPTUMA_META.color} direction={codePreviewOpen ? 'up' : 'down'} />
            </span>
          </button>

          {codePreviewOpen && (
            <div style={{ maxHeight: '400px', overflow: 'auto', backgroundColor: '#0a0a0a' }}>
              <pre style={{
                margin: 0,
                padding: '16px 20px',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                color: '#e6edf3',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.6,
              }}>
                {scriptCode}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ── Error State ────────────────────────────────────────────────────── */}
      {isError && (
        <div style={{
          padding: '20px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          fontSize: '13px',
        }}>
          <strong>Error:</strong> {errorText || 'Failed to generate Optuma script'}
        </div>
      )}

      {/* ── Safety Timeout Warning ─────────────────────────────────────────── */}
      {safetyTimeout && !isComplete && !isError && (
        <div style={{
          padding: '12px 20px',
          backgroundColor: 'rgba(14, 165, 233, 0.08)',
          borderTop: `1px solid rgba(14, 165, 233, 0.2)`,
          fontSize: '12px',
          color: OPTUMA_META.color,
        }}>
          This is taking longer than expected. The script is still being generated...
        </div>
      )}

      <style>{`
        @keyframes optumaPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default OptumaScriptCard;

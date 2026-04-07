'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// ─── SVG Icon Components ──────────────────────────────────────────────────────

const IconAFL = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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

const IconChevron = ({ size = 14, color = 'currentColor', direction = 'down' }) => (
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

const AFL_META = {
  color: '#FEC00F',
  gradient: 'linear-gradient(135deg, #FEC00F 0%, #F59E0B 100%)',
  bgLight: 'rgba(254, 192, 15, 0.08)',
  bgDark: 'rgba(254, 192, 15, 0.15)',
  phases: [
    'Analysing strategy requirements',
    'Designing signal logic',
    'Writing AFL code',
    'Adding risk management',
    'Validating syntax',
    'Finalising code',
  ],
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface AFLGenerationCardProps {
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

function extractTitle(input: any, toolName: string): string {
  if (!input) return 'Generating AFL code';
  return (
    input.strategy ||
    input.strategy_name ||
    input.title ||
    input.description?.slice(0, 60) ||
    input.prompt?.slice(0, 60) ||
    'AFL Strategy'
  );
}

function extractAFLCode(output: any): string | null {
  if (!output) return null;
  // Handle different output structures
  if (typeof output === 'string') return output;
  if (output.afl_code) return output.afl_code;
  if (output.code) return output.code;
  if (output.fixed_code) return output.fixed_code;
  if (output.data?.afl_code) return output.data.afl_code;
  if (output.data?.code) return output.data.code;
  return null;
}

function extractFilename(output: any, input: any): string {
  if (output?.filename) return output.filename;
  if (output?.data?.filename) return output.data.filename;
  if (input?.filename) return input.filename;
  // Generate from strategy name
  const strategy = output?.strategy || output?.data?.strategy || input?.strategy || 'Strategy';
  return `${strategy.replace(/\s+/g, '_')}.afl`;
}

function extractMetadata(output: any): { strategy?: string; type?: string; indicators?: string[]; signals?: string[] } {
  const data = output?.data || output || {};
  return {
    strategy: data.strategy || data.strategy_name,
    type: data.type || data.strategy_type,
    indicators: data.indicators,
    signals: data.signals,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const AFLGenerationCard: React.FC<AFLGenerationCardProps> = ({
  toolCallId,
  toolName,
  input,
  output,
  externalOutput,
  state,
  errorText,
  conversationId,
}) => {
  const title = extractTitle(input, toolName);
  
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isError, setIsError] = useState(false);
  const [outputData, setOutputData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [codePreviewOpen, setCodePreviewOpen] = useState(false);
  const [safetyTimeout, setSafetyTimeout] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restoredFromStorage = useRef(false);

  const STORAGE_KEY = `aflgen_state_${toolCallId}`;

  // ── Restore state from localStorage OR from output prop on mount ───────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const effectiveOutput = output || externalOutput;
    if (state === 'output-available' && effectiveOutput) {
      restoredFromStorage.current = true;
      setIsComplete(true);
      setProgress(100);
      setCurrentPhase(AFL_META.phases.length - 1);
      setOutputData(effectiveOutput);
      setSafetyTimeout(false);
      // Code preview starts closed - user can expand to preview before downloading
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
            setCurrentPhase(AFL_META.phases.length - 1);
            if (saved.outputData) setOutputData(saved.outputData);
            if (saved.elapsedTime) setElapsedTime(saved.elapsedTime);
            setSafetyTimeout(false);
            // Code preview starts closed - user can expand to preview before downloading
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

  // ── Persist state to localStorage ──────────────────────────────────────────
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
    if (isComplete || isError) {
      persistState();
    }
  }, [isComplete, isError, persistState]);

  // ── Progress animation ─────────────────────────────────────────────────────
  useEffect(() => {
    if (restoredFromStorage.current || isComplete || isError) return;
    if (state === 'input-streaming' || state === 'input-available') {
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          const next = prev + Math.random() * 3;
          return Math.min(next, 92);
        });
        setCurrentPhase(prev => {
          if (Math.random() < 0.15) {
            return Math.min(prev + 1, AFL_META.phases.length - 2);
          }
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
        setCurrentPhase(AFL_META.phases.length - 1);
        setOutputData(effectiveOutput);
        setIsComplete(true);
        setSafetyTimeout(false);
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        // Code preview starts closed - user can expand to preview before downloading
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
      if (!isComplete && !isError) {
        setSafetyTimeout(true);
      }
    }, 180000); // 3 minutes
    return () => clearTimeout(timeout);
  }, [isComplete, isError]);

  // ── Copy to clipboard ──────────────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    const code = extractAFLCode(outputData);
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('AFL code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [outputData]);

  // ── Download AFL file ──────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    const code = extractAFLCode(outputData);
    if (!code) return;
    
    const filename = extractFilename(outputData, input);
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  }, [outputData, input]);

  // ── Format time ────────────────────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  // ── Derive display values ──────────────────────────────────────────────────
  const aflCode = extractAFLCode(outputData);
  const filename = outputData ? extractFilename(outputData, input) : null;
  const metadata = outputData ? extractMetadata(outputData) : null;
  const codeLines = aflCode ? aflCode.split('\n').length : 0;
  const codeSize = aflCode ? `${(aflCode.length / 1024).toFixed(1)} KB` : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      borderRadius: '16px',
      overflow: 'hidden',
      border: `1px solid ${isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(254, 192, 15, 0.3)'}`,
      maxWidth: '720px',
      marginTop: '8px',
      backgroundColor: '#0d0d0d',
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 20px',
        background: AFL_META.gradient,
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
            <IconAFL size={22} color="#fff" />
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
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
              AFL Code
              {metadata?.type && (
                <span style={{
                  marginLeft: '8px',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                }}>
                  {metadata.type}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Status badge */}
        <div style={{
          padding: '6px 12px',
          borderRadius: '20px',
          backgroundColor: isComplete ? 'rgba(34, 197, 94, 0.9)' : isError ? 'rgba(239, 68, 68, 0.9)' : 'rgba(0,0,0,0.3)',
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
                animation: 'pulse 1.5s infinite',
              }} />
              GENERATING
            </>
          )}
        </div>
      </div>

      {/* ── Progress Section (during generation) ───────────────────────────── */}
      {!isComplete && !isError && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Progress bar */}
          <div style={{
            height: '6px',
            borderRadius: '3px',
            backgroundColor: 'rgba(254, 192, 15, 0.15)',
            overflow: 'hidden',
            marginBottom: '12px',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: AFL_META.gradient,
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }} />
          </div>
          
          {/* Phase indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>
              {AFL_META.phases[currentPhase]}...
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IconClock size={11} color="rgba(255,255,255,0.4)" />
              {formatTime(elapsedTime)}
            </span>
          </div>
          
          {/* Warning message */}
          <div style={{
            marginTop: '14px',
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <IconWarning size={16} color="#eab308" />
            <span style={{
              fontSize: '12px',
              color: '#eab308',
              lineHeight: 1.4,
            }}>
              Please do not navigate away from this page or refresh while generating. Your code may be lost.
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
          backgroundColor: AFL_META.bgDark,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(254, 192, 15, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <IconAFL size={18} color={AFL_META.color} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: '#fff' }}>{filename}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'flex', gap: '12px', marginTop: '2px' }}>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(254, 192, 15, 0.2)',
                  color: AFL_META.color,
                  fontSize: '10px',
                  fontWeight: 600,
                }}>AFL</span>
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
              background: AFL_META.gradient,
              color: '#000',
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
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(254, 192, 15, 0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <IconDownload size={14} color="#000" />
            Download AFL
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
              <span style={{ color: 'rgba(255,255,255,0.4)', marginRight: '8px' }}>Indicators:</span>
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
              backgroundColor: AFL_META.color,
              color: '#000',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconDownload size={13} color="#000" />
            DOWNLOAD AFL
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
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {copied ? <><IconCheck size={13} color="#22c55e" /> Copied</> : <><IconCopy size={13} /> Copy</>}
          </button>
        </div>
      )}

      {/* ── Code Preview Section ───────────────────────────────────────────── */}
      {isComplete && aflCode && (
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
              Preview Code Before Downloading
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                ({codeLines} lines)
              </span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: AFL_META.color }}>
              {codePreviewOpen ? 'Hide' : 'Show'} Code
              <IconChevron size={14} color={AFL_META.color} direction={codePreviewOpen ? 'up' : 'down'} />
            </span>
          </button>
          
          {codePreviewOpen && (
            <div style={{
              maxHeight: '400px',
              overflow: 'auto',
              backgroundColor: '#0a0a0a',
            }}>
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
                {aflCode}
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
          <strong>Error:</strong> {errorText || 'Failed to generate AFL code'}
        </div>
      )}

      {/* ── Safety Timeout Warning ─────────────────────────────────────────── */}
      {safetyTimeout && !isComplete && !isError && (
        <div style={{
          padding: '12px 20px',
          backgroundColor: 'rgba(234, 179, 8, 0.1)',
          borderTop: '1px solid rgba(234, 179, 8, 0.2)',
          fontSize: '12px',
          color: '#eab308',
        }}>
          This is taking longer than expected. The code is still being generated...
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default AFLGenerationCard;

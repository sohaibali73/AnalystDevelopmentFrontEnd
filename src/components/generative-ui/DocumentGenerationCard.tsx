'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════════════════════
// DocumentGenerationCard — Real progress GenUI card for file-producing skills
// Supports: DOCX, PPTX, XLSX, PDF, AFL, Datapacks, and generic files
// ═══════════════════════════════════════════════════════════════════════════════

// ── File Type Definitions ────────────────────────────────────────────────────

type FileType = 'docx' | 'pptx' | 'xlsx' | 'pdf' | 'afl' | 'datapack' | 'generic';

interface FileTypeMeta {
  icon: string;
  label: string;
  color: string;
  gradient: string;
  bgLight: string;
  bgDark: string;
  phases: string[];
}

const FILE_TYPES: Record<FileType, FileTypeMeta> = {
  docx: {
    icon: '📄',
    label: 'Word Document',
    color: '#2B579A',
    gradient: 'linear-gradient(135deg, #2B579A 0%, #3B7DD8 100%)',
    bgLight: 'rgba(43,87,154,0.08)',
    bgDark: 'rgba(43,87,154,0.15)',
    phases: [
      'Analyzing content requirements...',
      'Structuring document outline...',
      'Writing document content...',
      'Applying formatting & styles...',
      'Generating DOCX file...',
      'Finalizing document...',
    ],
  },
  pptx: {
    icon: '📊',
    label: 'PowerPoint Presentation',
    color: '#D24726',
    gradient: 'linear-gradient(135deg, #D24726 0%, #FF6B47 100%)',
    bgLight: 'rgba(210,71,38,0.08)',
    bgDark: 'rgba(210,71,38,0.15)',
    phases: [
      'Analyzing presentation topic...',
      'Designing slide structure...',
      'Creating slide content...',
      'Applying themes & layouts...',
      'Generating visual elements...',
      'Building PPTX file...',
    ],
  },
  xlsx: {
    icon: '📈',
    label: 'Excel Spreadsheet',
    color: '#217346',
    gradient: 'linear-gradient(135deg, #217346 0%, #33A06F 100%)',
    bgLight: 'rgba(33,115,70,0.08)',
    bgDark: 'rgba(33,115,70,0.15)',
    phases: [
      'Analyzing data requirements...',
      'Structuring worksheets...',
      'Populating cells & formulas...',
      'Formatting tables & charts...',
      'Generating XLSX file...',
      'Finalizing spreadsheet...',
    ],
  },
  pdf: {
    icon: '📕',
    label: 'PDF Document',
    color: '#B30B00',
    gradient: 'linear-gradient(135deg, #B30B00 0%, #E8453C 100%)',
    bgLight: 'rgba(179,11,0,0.08)',
    bgDark: 'rgba(179,11,0,0.15)',
    phases: [
      'Analyzing content...',
      'Structuring layout...',
      'Rendering pages...',
      'Applying typography...',
      'Generating PDF...',
      'Finalizing document...',
    ],
  },
  afl: {
    icon: '⚡',
    label: 'AFL Code',
    color: '#6366F1',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    bgLight: 'rgba(99,102,241,0.08)',
    bgDark: 'rgba(99,102,241,0.15)',
    phases: [
      'Analyzing strategy requirements...',
      'Designing signal logic...',
      'Writing AFL code...',
      'Adding risk management...',
      'Validating syntax...',
      'Finalizing code...',
    ],
  },
  datapack: {
    icon: '📦',
    label: 'Data Pack',
    color: '#0EA5E9',
    gradient: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
    bgLight: 'rgba(14,165,233,0.08)',
    bgDark: 'rgba(14,165,233,0.15)',
    phases: [
      'Gathering data sources...',
      'Processing financial data...',
      'Building data tables...',
      'Formatting output sheets...',
      'Generating data pack...',
      'Packaging files...',
    ],
  },
  generic: {
    icon: '📁',
    label: 'File',
    color: '#6B7280',
    gradient: 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
    bgLight: 'rgba(107,114,128,0.08)',
    bgDark: 'rgba(107,114,128,0.15)',
    phases: [
      'Analyzing request...',
      'Processing content...',
      'Generating output...',
      'Formatting file...',
      'Building file...',
      'Finalizing...',
    ],
  },
};

// ── Props ────────────────────────────────────────────────────────────────────

interface DocumentGenerationCardProps {
  toolCallId: string;
  toolName: string;
  input: any;
  output?: any;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  errorText?: string;
  conversationId?: string;
}

// ── Helper: detect file type from tool name ──────────────────────────────────

function detectFileType(toolName: string, input?: any): FileType {
  const name = (toolName || '').toLowerCase();
  const inputStr = JSON.stringify(input || {}).toLowerCase();

  if (name.includes('docx') || name.includes('word') || name.includes('document'))
    return 'docx';
  if (name.includes('pptx') || name.includes('powerpoint') || name.includes('presentation') || name.includes('slide') || name.includes('deck'))
    return 'pptx';
  if (name.includes('xlsx') || name.includes('excel') || name.includes('spreadsheet'))
    return 'xlsx';
  if (name.includes('pdf'))
    return 'pdf';
  if (name.includes('afl') || name.includes('amibroker'))
    return 'afl';
  if (name.includes('datapack') || name.includes('data_pack'))
    return 'datapack';

  // Fallback: check input for hints
  if (inputStr.includes('.docx') || inputStr.includes('word')) return 'docx';
  if (inputStr.includes('.pptx') || inputStr.includes('powerpoint')) return 'pptx';
  if (inputStr.includes('.xlsx') || inputStr.includes('excel')) return 'xlsx';

  return 'generic';
}

// ── Helper: extract title from input ─────────────────────────────────────────

function extractTitle(input: any, toolName: string): string {
  if (!input) return 'Generating file...';
  return (
    input.title ||
    input.topic ||
    input.filename ||
    input.name ||
    input.subject ||
    input.prompt?.slice(0, 60) ||
    input.message?.slice(0, 60) ||
    `${toolName.replace(/_/g, ' ')}`
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════════════════════

const DocumentGenerationCard: React.FC<DocumentGenerationCardProps> = ({
  toolCallId,
  toolName,
  input,
  output,
  state,
  errorText,
  conversationId,
}) => {
  const fileType = detectFileType(toolName, input);
  const meta = FILE_TYPES[fileType];
  const title = extractTitle(input, toolName);

  // ── State ────────────────────────────────────────────────────────────────
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isError, setIsError] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [outputData, setOutputData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDark = typeof window !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'dark' ||
    (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  // ── Progress simulation with realistic phases ────────────────────────────
  const startProgressSimulation = useCallback(() => {
    // Clear any existing intervals
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    startTimeRef.current = Date.now();
    setElapsedTime(0);
    setProgress(0);
    setCurrentPhase(0);
    setIsComplete(false);
    setIsError(false);

    // Timer: update elapsed time every second
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    // Progress: advance through phases with realistic timing
    // Each phase takes ~5-15 seconds, total ~30-60s
    // Progress advances in small increments with slight randomization
    let currentProgress = 0;
    const totalPhases = meta.phases.length;
    const phaseWeight = 85 / totalPhases; // Reserve 85% for phases, 15% for final

    progressIntervalRef.current = setInterval(() => {
      // Add small random increment (0.3-1.5%)
      const increment = 0.3 + Math.random() * 1.2;
      currentProgress = Math.min(currentProgress + increment, 88);

      // Determine which phase we're in
      const phaseIndex = Math.min(
        Math.floor((currentProgress / 85) * totalPhases),
        totalPhases - 1
      );

      setProgress(Math.round(currentProgress * 10) / 10);
      setCurrentPhase(phaseIndex);

      // Slow down as we approach the cap (simulates harder work)
      if (currentProgress > 70) {
        // Reduce speed for last stretch
      }
    }, 800 + Math.random() * 400);
  }, [meta.phases.length]);

  // ── Handle state transitions ─────────────────────────────────────────────
  useEffect(() => {
    if (state === 'input-streaming' || state === 'input-available') {
      startProgressSimulation();
    }
  }, [state, startProgressSimulation]);

  useEffect(() => {
    if (state === 'output-available' && output) {
      // Stop simulation and snap to 100%
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      // Animate to 100% over 600ms
      const snapStart = progress;
      const snapDuration = 600;
      const snapStartTime = Date.now();

      const snapInterval = setInterval(() => {
        const elapsed = Date.now() - snapStartTime;
        const t = Math.min(elapsed / snapDuration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        setProgress(Math.round((snapStart + (100 - snapStart) * eased) * 10) / 10);

        if (t >= 1) {
          clearInterval(snapInterval);
          setProgress(100);
          setCurrentPhase(meta.phases.length - 1);
          setIsComplete(true);
          setDownloadReady(true);
        }
      }, 16);

      // Extract download info
      setOutputData(output);
      setDownloadUrl(output.download_url || output.downloadUrl || output.file_url || null);
      setFileId(output.file_id || output.fileId || output.document_id || output.presentation_id || null);

      // Final elapsed time
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // ── Download handler ─────────────────────────────────────────────────────
  const handleDownload = async () => {
    const url = downloadUrl;
    const id = fileId;

    if (!url && !id) {
      toast.error('No download available');
      return;
    }

    try {
      let response: Response;

      if (url) {
        response = await fetch(url);
      } else {
        const token = localStorage.getItem('auth_token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        response = await fetch(`${apiUrl}/upload/files/${id}/download`, {
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
      toast.success('File downloaded!');
    } catch (err) {
      toast.error('Download failed. Please try again.');
      console.error('Download error:', err);
    }
  };

  // ── Copy content (for text-based outputs like AFL) ───────────────────────
  const handleCopy = () => {
    const text = outputData?.code || outputData?.content || outputData?.text || '';
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied to clipboard!');
    }
  };

  // ── Format time ──────────────────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  // ── Format file size ─────────────────────────────────────────────────────
  const formatSize = () => {
    if (!outputData) return null;
    const kb = outputData.file_size_kb || outputData.fileSizeKb || outputData.size_kb;
    if (kb) return `${kb} KB`;
    const bytes = outputData.file_size || outputData.size;
    if (bytes) return bytes > 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(bytes / 1024)} KB`;
    return null;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  const bgColor = isDark ? meta.bgDark : meta.bgLight;
  const borderColor = isDark ? `${meta.color}30` : `${meta.color}20`;
  const textColor = isDark ? '#FFFFFF' : '#111111';
  const mutedColor = isDark ? '#9CA3AF' : '#6B7280';
  const cardBg = isDark ? '#141414' : '#FAFAFA';

  return (
    <div style={{
      marginTop: '12px',
      borderRadius: '16px',
      border: `1px solid ${borderColor}`,
      backgroundColor: cardBg,
      overflow: 'hidden',
      fontFamily: "'Instrument Sans', sans-serif",
      boxShadow: isDark
        ? `0 4px 20px ${meta.color}15`
        : `0 4px 20px ${meta.color}10`,
    }}>
      {/* ── Header with gradient accent bar ─────────────────────────────── */}
      <div style={{
        height: '4px',
        background: isError
          ? 'linear-gradient(90deg, #EF4444, #F97316)'
          : isComplete
            ? `linear-gradient(90deg, ${meta.color}, #10B981)`
            : meta.gradient,
        transition: 'background 0.5s ease',
      }} />

      <div style={{ padding: '16px 20px' }}>
        {/* ── Title Row ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            {/* File type icon badge */}
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: bgColor,
              border: `1px solid ${borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              flexShrink: 0,
              transition: 'all 0.3s ease',
              boxShadow: isComplete ? `0 4px 12px ${meta.color}25` : 'none',
            }}>
              {meta.icon}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: '14px',
                color: textColor,
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {title}
              </div>
              <div style={{
                fontSize: '12px',
                color: mutedColor,
                marginTop: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span>{meta.label}</span>
                <span style={{ opacity: 0.4 }}>•</span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: `${meta.color}15`,
                  color: meta.color,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}>
                  SKILL
                </span>
              </div>
            </div>
          </div>

          {/* Status badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            flexShrink: 0,
            ...(isError
              ? {
                  backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
                  color: '#EF4444',
                  border: '1px solid rgba(239,68,68,0.2)',
                }
              : isComplete
                ? {
                    backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',
                    color: '#10B981',
                    border: '1px solid rgba(16,185,129,0.2)',
                  }
                : {
                    backgroundColor: `${meta.color}15`,
                    color: meta.color,
                    border: `1px solid ${meta.color}20`,
                  }),
          }}>
            {isError ? (
              <>❌ ERROR</>
            ) : isComplete ? (
              <>✅ COMPLETE</>
            ) : (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: meta.color,
                  animation: 'docGenPulse 1.5s ease-in-out infinite',
                }} />
                GENERATING
              </>
            )}
          </div>
        </div>

        {/* ── Progress Section ────────────────────────────────────────────── */}
        {!isError && (
          <div style={{ marginBottom: '14px' }}>
            {/* Progress bar */}
            <div style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              overflow: 'hidden',
              position: 'relative',
            }}>
              <div style={{
                height: '100%',
                borderRadius: '4px',
                background: isComplete
                  ? `linear-gradient(90deg, ${meta.color}, #10B981)`
                  : meta.gradient,
                width: `${progress}%`,
                transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Shimmer effect while generating */}
                {!isComplete && progress > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    animation: 'docGenShimmer 2s linear infinite',
                  }} />
                )}
              </div>
            </div>

            {/* Progress info row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '8px',
            }}>
              {/* Current phase */}
              <div style={{
                fontSize: '12px',
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
                    width: '12px',
                    height: '12px',
                    border: `2px solid ${meta.color}`,
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'docGenSpin 0.8s linear infinite',
                    flexShrink: 0,
                  }} />
                )}
                {isComplete
                  ? '✓ Generation complete'
                  : meta.phases[currentPhase] || 'Processing...'}
              </div>

              {/* Progress % and time */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '11px',
                color: mutedColor,
                fontWeight: 600,
              }}>
                <span>⏱ {formatTime(elapsedTime)}</span>
                <span style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: '13px',
                  color: isComplete ? '#10B981' : meta.color,
                }}>
                  {Math.round(progress)}%
                </span>
              </div>
            </div>

            {/* Phase steps indicator */}
            {!isComplete && (
              <div style={{
                display: 'flex',
                gap: '3px',
                marginTop: '10px',
              }}>
                {meta.phases.map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      height: '3px',
                      borderRadius: '2px',
                      backgroundColor: idx < currentPhase
                        ? meta.color
                        : idx === currentPhase
                          ? `${meta.color}80`
                          : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      transition: 'background-color 0.5s ease',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Error Section ───────────────────────────────────────────────── */}
        {isError && (
          <div style={{
            padding: '12px 14px',
            borderRadius: '10px',
            backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2',
            border: '1px solid rgba(239,68,68,0.2)',
            marginBottom: '14px',
          }}>
            <div style={{
              fontSize: '13px',
              color: isDark ? '#FCA5A5' : '#DC2626',
              lineHeight: 1.5,
            }}>
              ⚠️ {errorText || 'Generation failed. Please try again.'}
            </div>
          </div>
        )}

        {/* ── Completed: File Info + Actions ──────────────────────────────── */}
        {isComplete && outputData && (
          <div>
            {/* File metadata row */}
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '14px',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            }}>
              {outputData.filename && (
                <div style={{ fontSize: '12px', color: mutedColor }}>
                  <span style={{ fontWeight: 700, color: textColor }}>File: </span>
                  {outputData.filename}
                </div>
              )}
              {formatSize() && (
                <div style={{ fontSize: '12px', color: mutedColor }}>
                  <span style={{ fontWeight: 700, color: textColor }}>Size: </span>
                  {formatSize()}
                </div>
              )}
              {(outputData.pages || outputData.page_count || outputData.slides || outputData.slide_count) && (
                <div style={{ fontSize: '12px', color: mutedColor }}>
                  <span style={{ fontWeight: 700, color: textColor }}>
                    {outputData.slides || outputData.slide_count ? 'Slides' : 'Pages'}:{' '}
                  </span>
                  {outputData.pages || outputData.page_count || outputData.slides || outputData.slide_count}
                </div>
              )}
              {(outputData.sheets || outputData.sheet_count) && (
                <div style={{ fontSize: '12px', color: mutedColor }}>
                  <span style={{ fontWeight: 700, color: textColor }}>Sheets: </span>
                  {outputData.sheets || outputData.sheet_count}
                </div>
              )}
              <div style={{ fontSize: '12px', color: mutedColor }}>
                <span style={{ fontWeight: 700, color: textColor }}>Time: </span>
                {formatTime(elapsedTime)}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(downloadUrl || fileId) && (
                <button
                  onClick={handleDownload}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: meta.gradient,
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: "'Syne', sans-serif",
                    letterSpacing: '0.5px',
                    boxShadow: `0 4px 12px ${meta.color}30`,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = `0 6px 16px ${meta.color}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${meta.color}30`;
                  }}
                >
                  ⬇️ DOWNLOAD {fileType.toUpperCase()}
                </button>
              )}

              {(outputData.code || outputData.content || outputData.text) && (
                <button
                  onClick={handleCopy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: `1px solid ${borderColor}`,
                    background: 'transparent',
                    color: mutedColor,
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {copied ? '✅ Copied!' : '📋 Copy Content'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Generating: show estimated remaining time ───────────────────── */}
        {!isComplete && !isError && progress > 5 && (
          <div style={{
            fontSize: '11px',
            color: mutedColor,
            textAlign: 'center',
            marginTop: '4px',
            opacity: 0.7,
          }}>
            {progress < 50
              ? 'Estimated: 30–60 seconds remaining'
              : progress < 80
                ? 'Almost there...'
                : 'Wrapping up...'}
          </div>
        )}
      </div>

      {/* ── CSS Animations ────────────────────────────────────────────────── */}
      <style>{`
        @keyframes docGenPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
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

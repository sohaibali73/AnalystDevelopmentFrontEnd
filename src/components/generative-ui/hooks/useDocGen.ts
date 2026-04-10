'use client';

/**
 * useDocGen — Shared state machine hook for all document generation cards.
 *
 * Handles: progress simulation, state transitions, localStorage persistence,
 * externalOutput wiring, file download, and common utility formatters.
 *
 * Used by: PptxGenerationCard, DocxGenerationCard, XlsxGenerationCard,
 *          PptxRevisionCard, XlsxTransformCard, and any future doc-gen cards.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export type DocGenState =
  | 'input-streaming'
  | 'input-available'
  | 'output-available'
  | 'output-error';

export interface UseDocGenOptions {
  toolCallId: string;
  state: DocGenState;
  output?: any;
  externalOutput?: any;
  phases: string[];
  fileExtension: string;
}

export interface UseDocGenReturn {
  progress: number;
  currentPhase: number;
  elapsedTime: number;
  isComplete: boolean;
  isError: boolean;
  safetyTimeout: boolean;
  downloadUrl: string | null;
  fileId: string | null;
  outputData: any;
  copied: boolean;
  setCopied: (v: boolean) => void;
  handleDownload: () => Promise<void>;
  formatTime: (s: number) => string;
  formatSize: () => string | null;
  apiBase: string;
  resolveUrl: (url: string) => string;
  isDark: boolean;
}

export function useDocGen({
  toolCallId,
  state,
  output,
  externalOutput,
  phases,
  fileExtension,
}: UseDocGenOptions): UseDocGenReturn {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isError, setIsError] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [outputData, setOutputData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [safetyTimeout, setSafetyTimeout] = useState(false);

  const startTimeRef = useRef(Date.now());
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restored = useRef(false);

  const STORAGE_KEY = `docgen_${toolCallId}`;
  const apiBase = (
    process.env.NEXT_PUBLIC_API_URL || 'https://developer-potomaac.up.railway.app'
  ).replace(/\/+$/, '');

  const resolveUrl = useCallback(
    (url: string) => (url.startsWith('/') ? `${apiBase}${url}` : url),
    [apiBase],
  );

  const isDark =
    typeof window !== 'undefined' &&
    (document.documentElement.getAttribute('data-theme') === 'dark' ||
      window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  // ── helpers ─────────────────────────────────────────────────────────────────
  const extractUrls = useCallback((data: any) => ({
    url: data?.download_url || data?.downloadUrl || data?.file_url || null,
    id:
      data?.file_id ||
      data?.fileId ||
      data?.document_id ||
      data?.presentation_id ||
      null,
  }), []);

  const snapComplete = useCallback(
    (data?: any) => {
      if (progressRef.current) clearInterval(progressRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      setProgress(100);
      setCurrentPhase(phases.length - 1);
      setIsComplete(true);
      setSafetyTimeout(false);
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      if (data) {
        setOutputData(data);
        const { url, id } = extractUrls(data);
        setDownloadUrl(url);
        setFileId(id);
      }
    },
    [phases.length, extractUrls],
  );

  // ── Restore on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Authoritative: output prop + state=output-available
    const effective = output || externalOutput;
    if (state === 'output-available' && effective) {
      restored.current = true;
      snapComplete(effective);
      return;
    }

    // Fallback: localStorage
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Date.now() - (saved.timestamp ?? 0) < 86_400_000) {
          if (saved.isComplete) {
            restored.current = true;
            setIsComplete(true);
            setProgress(100);
            setCurrentPhase(phases.length - 1);
            if (saved.downloadUrl) setDownloadUrl(saved.downloadUrl);
            if (saved.fileId) setFileId(saved.fileId);
            if (saved.outputData) setOutputData(saved.outputData);
            if (saved.elapsedTime) setElapsedTime(saved.elapsedTime);
          } else if (saved.isError) {
            restored.current = true;
            setIsError(true);
            if (saved.elapsedTime) setElapsedTime(saved.elapsedTime);
          }
        }
      }
    } catch {
      /* storage unavailable */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist terminal states ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isComplete && !isError) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          isComplete,
          isError,
          downloadUrl,
          fileId,
          outputData,
          elapsedTime,
          timestamp: Date.now(),
        }),
      );
    } catch {
      /* quota exceeded */
    }
  }, [STORAGE_KEY, isComplete, isError, downloadUrl, fileId, outputData, elapsedTime]);

  // ── Progress simulation ───────────────────────────────────────────────────────
  const startProgress = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    startTimeRef.current = Date.now();
    setElapsedTime(0);
    setProgress(0);
    setCurrentPhase(0);
    setIsComplete(false);
    setIsError(false);

    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    let cur = 0;
    progressRef.current = setInterval(() => {
      const inc = 0.3 + Math.random() * 1.2;
      cur = Math.min(cur + inc, 88);
      const phase = Math.min(Math.floor((cur / 85) * phases.length), phases.length - 1);
      setProgress(Math.round(cur * 10) / 10);
      setCurrentPhase(phase);
    }, 800 + Math.random() * 400);
  }, [phases.length]);

  useEffect(() => {
    if (restored.current) return;
    if (state === 'input-streaming' || state === 'input-available') startProgress();
  }, [state, startProgress]);

  // ── Safety timeout (2 min) ────────────────────────────────────────────────────
  useEffect(() => {
    if (state !== 'input-streaming' && state !== 'input-available') return;
    const t = setTimeout(() => {
      if (!isComplete && !isError) setSafetyTimeout(true);
    }, 120_000);
    return () => clearTimeout(t);
  }, [state, isComplete, isError]);

  // ── Wire externalOutput (file_download events) ────────────────────────────────
  useEffect(() => {
    if (!externalOutput) return;
    setOutputData((p: any) => ({ ...p, ...externalOutput }));
    const { url, id } = extractUrls(externalOutput);
    setDownloadUrl((prev) => url ?? prev);
    setFileId((prev) => id ?? prev);
    if (!isComplete && !isError) snapComplete(externalOutput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalOutput]);

  // ── Snap to 100% when output-available ───────────────────────────────────────
  useEffect(() => {
    if (state !== 'output-available') return;
    if (progressRef.current) clearInterval(progressRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    const snapStart = progress;
    const t0 = Date.now();

    const si = setInterval(() => {
      const pct = Math.min((Date.now() - t0) / 600, 1);
      const eased = 1 - Math.pow(1 - pct, 3);
      setProgress(Math.round((snapStart + (100 - snapStart) * eased) * 10) / 10);
      if (pct >= 1) {
        clearInterval(si);
        snapComplete(output);
      }
    }, 16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // ── Handle error ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (state !== 'output-error') return;
    if (progressRef.current) clearInterval(progressRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setIsError(true);
    setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    // Wire output even in error state (might have partial data)
    if (output) {
      setOutputData(output);
      const { url, id } = extractUrls(output);
      if (url) setDownloadUrl(url);
      if (id) setFileId(id);
    }
  }, [state, output, extractUrls]);

  // ── Cleanup ───────────────────────────────────────────────────────────────────
  useEffect(
    () => () => {
      if (progressRef.current) clearInterval(progressRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  // ── Download handler ──────────────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    if (!downloadUrl && !fileId) {
      toast.error('No download available');
      return;
    }
    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const url = downloadUrl
        ? resolveUrl(downloadUrl)
        : `${apiBase}/files/${fileId}/download`;
      const resp = await fetch(url, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!resp.ok) throw new Error('Download failed');
      const blob = await resp.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = outputData?.filename ?? `generated.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Downloaded!');
    } catch {
      toast.error('Download failed — please try again');
    }
  }, [downloadUrl, fileId, apiBase, resolveUrl, outputData, fileExtension]);

  // ── Formatters ────────────────────────────────────────────────────────────────
  const formatTime = (s: number) =>
    s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

  const formatSize = useCallback(() => {
    if (!outputData) return null;
    const kb = outputData.file_size_kb ?? outputData.fileSizeKb ?? outputData.size_kb;
    if (kb) return `${kb} KB`;
    const bytes = outputData.file_size ?? outputData.size;
    if (bytes)
      return bytes > 1_048_576
        ? `${(bytes / 1_048_576).toFixed(1)} MB`
        : `${Math.round(bytes / 1024)} KB`;
    return null;
  }, [outputData]);

  return {
    progress,
    currentPhase,
    elapsedTime,
    isComplete,
    isError,
    safetyTimeout,
    downloadUrl,
    fileId,
    outputData,
    copied,
    setCopied,
    handleDownload,
    formatTime,
    formatSize,
    apiBase,
    resolveUrl,
    isDark,
  };
}

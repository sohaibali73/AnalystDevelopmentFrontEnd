'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import kbApi from '@/lib/kbApi';
import type { KBDocumentStatus } from '@/types/kb';

interface UseDocumentStatusOptions {
  enabled?: boolean;
  intervalMs?: number;
  onReady?: (status: KBDocumentStatus) => void;
  onError?: (status: KBDocumentStatus) => void;
}

interface UseDocumentStatusResult {
  status: KBDocumentStatus | null;
  isPolling: boolean;
  startPolling: () => void;
  stopPolling: () => void;
}

export function useDocumentStatus(documentId: string | null | undefined, opts: UseDocumentStatusOptions = {}): UseDocumentStatusResult {
  const { enabled = true, intervalMs = 2000, onReady, onError } = opts;
  const [status, setStatus] = useState<KBDocumentStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  const stopPolling = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    abortRef.current?.abort();
    abortRef.current = null;
    setIsPolling(false);
  }, []);
  const startPolling = useCallback(() => {
    if (!documentId) return;
    stopPolling();
    const ac = new AbortController();
    abortRef.current = ac;
    setIsPolling(true);
    const tick = async () => {
      if (ac.signal.aborted) return;
      try {
        const s = await kbApi.getStatus(documentId);
        if (ac.signal.aborted) return;
        setStatus(s);
        if (s.ready) { onReadyRef.current?.(s); setIsPolling(false); return; }
        if (s.status === 'error') { onErrorRef.current?.(s); setIsPolling(false); return; }
        timerRef.current = setTimeout(tick, intervalMs);
      } catch {
        if (!ac.signal.aborted) { timerRef.current = setTimeout(tick, intervalMs); }
      }
    };
    tick();
  }, [documentId, intervalMs, stopPolling]);
  useEffect(() => {
    if (enabled && documentId) { startPolling(); } else { stopPolling(); }
    return stopPolling;
  }, [enabled, documentId, startPolling, stopPolling]);
  return { status, isPolling, startPolling, stopPolling };
}
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type ConnectionStatus = 'connected' | 'checking' | 'disconnected' | 'unknown';

interface UseConnectionStatusOptions {
  /** Check interval in ms (default: 30000 = 30s) */
  interval?: number;
  /** Whether to auto-check on mount */
  autoCheck?: boolean;
}

export function useConnectionStatus(options: UseConnectionStatusOptions = {}) {
  const { interval = 30000, autoCheck = true } = options;
  const [status, setStatus] = useState<ConnectionStatus>('unknown');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    setStatus('checking');
    try {
      // Use Next.js proxy to avoid CORS preflight (OPTIONS 400) on direct backend calls.
      // /api/backend/health is rewritten to ${BACKEND_URL}/health by next.config.js
      const res = await fetch('/api/backend/health', { method: 'GET' });
      if (res.ok) {
        setStatus('connected');
        setError(null);
      } else {
        setStatus('disconnected');
        setError(`Health check returned ${res.status}`);
      }
    } catch (err) {
      setStatus('disconnected');
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
    setLastChecked(new Date());
  }, []);

  useEffect(() => {
    if (autoCheck) {
      check();
    }
    
    if (interval > 0) {
      intervalRef.current = setInterval(check, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [check, interval, autoCheck]);

  // Also listen for online/offline events
  useEffect(() => {
    const handleOnline = () => check();
    const handleOffline = () => {
      setStatus('disconnected');
      setError('Browser is offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [check]);

  return { status, lastChecked, error, check };
}

export default useConnectionStatus;

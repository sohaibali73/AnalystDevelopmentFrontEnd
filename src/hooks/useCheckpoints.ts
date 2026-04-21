/**
 * useCheckpoints — list / create / restore / delete checkpoints for a conversation.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  listCheckpoints,
  createCheckpoint,
  restoreCheckpoint,
  deleteCheckpoint,
} from '@/lib/yangApi';
import type { YangCheckpoint } from '@/types/yang';

export interface UseCheckpointsResult {
  checkpoints: YangCheckpoint[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (label?: string | null) => Promise<YangCheckpoint | null>;
  restore: (id: string) => Promise<{ messages_deleted: number; warning?: string } | null>;
  remove: (id: string) => Promise<boolean>;
}

export function useCheckpoints(conversationId: string | null): UseCheckpointsResult {
  const [checkpoints, setCheckpoints] = useState<YangCheckpoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error,   setError]   = useState<string | null>(null);
  const inflightRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!conversationId) {
      setCheckpoints([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await listCheckpoints(conversationId);
      setCheckpoints(res.checkpoints || []);
    } catch (e: any) {
      console.warn('[useCheckpoints] list failed:', e?.message || e);
      setError(e?.message || 'Failed to list checkpoints');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void refresh();
    return () => { inflightRef.current?.abort(); };
  }, [refresh]);

  const create = useCallback(
    async (label?: string | null) => {
      if (!conversationId) return null;
      try {
        const res = await createCheckpoint(conversationId, label ?? null);
        await refresh();
        return res.checkpoint;
      } catch (e: any) {
        setError(e?.message || 'Failed to create checkpoint');
        return null;
      }
    },
    [conversationId, refresh],
  );

  const restore = useCallback(
    async (id: string) => {
      try {
        const res = await restoreCheckpoint(id);
        await refresh();
        return {
          messages_deleted: res.messages_deleted ?? 0,
          warning: res.warning,
        };
      } catch (e: any) {
        setError(e?.message || 'Failed to restore checkpoint');
        return null;
      }
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteCheckpoint(id);
        setCheckpoints((prev) => prev.filter((c) => c.id !== id));
        return true;
      } catch (e: any) {
        setError(e?.message || 'Failed to delete checkpoint');
        return false;
      }
    },
    [],
  );

  return { checkpoints, loading, error, refresh, create, restore, remove };
}

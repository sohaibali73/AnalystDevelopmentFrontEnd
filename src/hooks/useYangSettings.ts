/**
 * useYangSettings — Load + patch per-user YANG feature flags.
 *
 * - Loads once on mount from GET /yang/settings
 * - updateSetting() performs optimistic UI update + debounced PATCH (500ms)
 * - Silent error recovery: logs warning, keeps optimistic state; manual retry via refresh()
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getYangSettings, patchYangSettings } from '@/lib/yangApi';
import { YANG_DEFAULTS, type YangConfig, type YangAdvanced, type YangOverrides } from '@/types/yang';

export interface UseYangSettingsResult {
  settings: YangConfig;
  advanced: YangAdvanced;
  loading: boolean;
  saving: boolean;
  error: string | null;
  updateSetting: <K extends keyof YangConfig>(key: K, value: YangConfig[K]) => void;
  updateAdvanced: (patch: Partial<YangAdvanced>) => void;
  refresh: () => Promise<void>;
  /** Current in-memory override object for passing as request body. */
  getOverrides: () => YangOverrides;
}

const DEBOUNCE_MS = 500;

export function useYangSettings(): UseYangSettingsResult {
  const [settings, setSettings]   = useState<YangConfig>(YANG_DEFAULTS);
  const [loading,  setLoading]    = useState<boolean>(true);
  const [saving,   setSaving]     = useState<boolean>(false);
  const [error,    setError]      = useState<string | null>(null);

  const pendingPatchRef = useRef<YangOverrides>({});
  const timerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsRef     = useRef<YangConfig>(settings);
  settingsRef.current   = settings;

  // Initial load
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getYangSettings();
      // Strip user_id and merge with defaults for any missing fields
      const { user_id: _uid, ...rest } = data;
      setSettings({
        ...YANG_DEFAULTS,
        ...rest,
        advanced: { ...YANG_DEFAULTS.advanced, ...(rest.advanced || {}) },
      });
    } catch (e: any) {
      console.warn('[useYangSettings] load failed, using defaults:', e?.message || e);
      setSettings(YANG_DEFAULTS);
      setError(e?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const flushPatch = useCallback(async () => {
    const patch = pendingPatchRef.current;
    pendingPatchRef.current = {};
    if (!patch || Object.keys(patch).length === 0) return;
    setSaving(true);
    try {
      await patchYangSettings(patch);
    } catch (e: any) {
      console.warn('[useYangSettings] save failed:', e?.message || e);
      setError(e?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, []);

  const scheduleFlush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void flushPatch();
    }, DEBOUNCE_MS);
  }, [flushPatch]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      // Fire-and-forget final flush if anything pending
      if (Object.keys(pendingPatchRef.current).length > 0) {
        void flushPatch();
      }
    };
  }, [flushPatch]);

  const updateSetting = useCallback<UseYangSettingsResult['updateSetting']>(
    (key, value) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      pendingPatchRef.current = { ...pendingPatchRef.current, [key]: value as any };
      scheduleFlush();
    },
    [scheduleFlush],
  );

  const updateAdvanced = useCallback(
    (patch: Partial<YangAdvanced>) => {
      setSettings((prev) => ({
        ...prev,
        advanced: { ...(prev.advanced || {}), ...patch },
      }));
      const mergedAdvanced = {
        ...(pendingPatchRef.current.advanced || settingsRef.current.advanced || {}),
        ...patch,
      };
      pendingPatchRef.current = {
        ...pendingPatchRef.current,
        advanced: mergedAdvanced,
      };
      scheduleFlush();
    },
    [scheduleFlush],
  );

  const getOverrides = useCallback<UseYangSettingsResult['getOverrides']>(() => {
    // Return only the boolean feature flags (omit advanced) for per-request overrides
    const s = settingsRef.current;
    return {
      subagents:       s.subagents,
      parallel_tools:  s.parallel_tools,
      plan_mode:       s.plan_mode,
      tool_search:     s.tool_search,
      auto_compact:    s.auto_compact,
      focus_chain:     s.focus_chain,
      background_edit: s.background_edit,
      checkpoints:     s.checkpoints,
      yolo_mode:       s.yolo_mode,
      double_check:    s.double_check,
    };
  }, []);

  return {
    settings,
    advanced: settings.advanced || {},
    loading,
    saving,
    error,
    updateSetting,
    updateAdvanced,
    refresh,
    getOverrides,
  };
}

import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
  getSettings,
  getStats,
  resetStats,
  setSettings,
} from '@/storage';
import type { Settings, Stats } from '@/storage';

export function useSettings() {
  const [settings, setLocalSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getSettings().then((s) => {
      if (cancelled) return;
      setLocalSettings(s);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(async (partial: Partial<Settings>) => {
    const next = await setSettings(partial);
    setLocalSettings(next);
  }, []);

  return { settings, update, loaded };
}

export function useStats(refreshKey: number) {
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);

  useEffect(() => {
    let cancelled = false;
    void getStats().then((s) => {
      if (!cancelled) setStats(s);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const reset = useCallback(async () => {
    await resetStats();
    setStats({ ...DEFAULT_STATS, resetAt: Date.now() });
  }, []);

  return { stats, reset };
}

import type { ThresholdConfig } from '@/detection';

export interface Settings {
  enabled: boolean;
  sensitivity: number;
  whitelist: string[];
  blacklist: string[];
  hideShortsCompletely: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  sensitivity: 50,
  whitelist: [],
  blacklist: [],
  hideShortsCompletely: false,
};

export interface Stats {
  totalHidden: number;
  totalGreyed: number;
  resetAt: number;
}

export const DEFAULT_STATS: Stats = {
  totalHidden: 0,
  totalGreyed: 0,
  resetAt: Date.now(),
};

const SETTINGS_KEY = 'sanitytv:settings';
const STATS_KEY = 'sanitytv:stats';

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.sync.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] as Partial<Settings> | undefined) };
}

export async function setSettings(partial: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const next: Settings = { ...current, ...partial };
  await chrome.storage.sync.set({ [SETTINGS_KEY]: next });
  return next;
}

export async function getStats(): Promise<Stats> {
  const result = await chrome.storage.local.get(STATS_KEY);
  return { ...DEFAULT_STATS, ...(result[STATS_KEY] as Partial<Stats> | undefined) };
}

export async function incrementStat(kind: 'hidden' | 'greyed', by = 1): Promise<void> {
  const current = await getStats();
  const next: Stats = {
    ...current,
    totalHidden: current.totalHidden + (kind === 'hidden' ? by : 0),
    totalGreyed: current.totalGreyed + (kind === 'greyed' ? by : 0),
  };
  await chrome.storage.local.set({ [STATS_KEY]: next });
}

export async function resetStats(): Promise<void> {
  await chrome.storage.local.set({ [STATS_KEY]: { ...DEFAULT_STATS, resetAt: Date.now() } });
}

/**
 * Maps a 0..100 sensitivity slider to detection thresholds.
 * 0 = very permissive (only blatant cases hidden), 100 = very aggressive.
 */
export function thresholdsFromSensitivity(sensitivity: number): ThresholdConfig {
  const s = Math.max(0, Math.min(100, sensitivity));
  return {
    greyAt: Math.round(Math.max(5, 60 - s * 0.6)),
    hideAt: Math.round(Math.max(20, 90 - s * 0.6)),
  };
}

export function isWhitelisted(settings: Settings, channelName: string): boolean {
  const lower = channelName.toLowerCase();
  return settings.whitelist.some((c) => c.toLowerCase() === lower);
}

export function isBlacklisted(settings: Settings, channelName: string): boolean {
  const lower = channelName.toLowerCase();
  return settings.blacklist.some((c) => c.toLowerCase() === lower);
}

export function onSettingsChange(callback: (settings: Settings) => void): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: chrome.storage.AreaName,
  ) => {
    if (areaName !== 'sync') return;
    const change = changes[SETTINGS_KEY];
    if (!change) return;
    const next = { ...DEFAULT_SETTINGS, ...(change.newValue as Partial<Settings> | undefined) };
    callback(next);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

import { actionForScore, allRules, scoreVideo } from '@/detection';
import {
  DEFAULT_SETTINGS,
  getSettings,
  incrementStat,
  isBlacklisted,
  isWhitelisted,
  onSettingsChange,
  thresholdsFromSensitivity,
} from '@/storage';
import type { Settings } from '@/storage';
import { applyAction, ensureStyles } from './injector';
import { observeVideos } from './observer';
import { extractMetadata } from './extractor';

let currentSettings: Settings = DEFAULT_SETTINGS;

async function bootstrap() {
  ensureStyles();
  currentSettings = await getSettings();

  onSettingsChange((next) => {
    currentSettings = next;
    // No re-evaluation of already-processed elements: a Single Page App
    // navigation will re-mount items, and toggling the extension off
    // doesn't unhide previously hidden videos until next visit. Acceptable
    // for V0; revisit if user feedback demands live re-evaluation.
  });

  observeVideos(async (el) => {
    if (!currentSettings.enabled) return;
    const metadata = extractMetadata(el);
    if (!metadata) return;

    if (isWhitelisted(currentSettings, metadata.channelName)) {
      applyAction(el, 'normal');
      return;
    }
    if (isBlacklisted(currentSettings, metadata.channelName)) {
      applyAction(el, 'hide');
      void incrementStat('hidden');
      return;
    }

    const scored = scoreVideo(metadata, allRules);
    const thresholds = thresholdsFromSensitivity(currentSettings.sensitivity);
    const action = actionForScore(scored.score, thresholds);

    applyAction(el, action, scored);
    if (action === 'hide') void incrementStat('hidden');
    else if (action === 'grey') void incrementStat('greyed');
  });
}

void bootstrap();

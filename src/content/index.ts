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

// Production logging is intentionally minimal. We deliberately do NOT:
//  - write to sessionStorage (shared with the YouTube origin → leaks
//    user filtering decisions to the page),
//  - log per-video decisions (reveals user's whitelist/blacklist and
//    every video's score in the user's own devtools, more noise than
//    signal).
// Only a single boot line and any genuine errors get through.
const warn = (...args: unknown[]) => {
  console.warn('[SanityTV]', ...args);
};

let currentSettings: Settings = DEFAULT_SETTINGS;

function applyShortsClass(s: Settings) {
  if (!document.body) return;
  document.body.classList.toggle('sanitytv-no-shorts', s.hideShortsCompletely);
}

async function bootstrap() {
  console.info('[SanityTV] booting on', location.href);
  try {
    ensureStyles();
    currentSettings = await getSettings();
    applyShortsClass(currentSettings);

    onSettingsChange((next) => {
      currentSettings = next;
      applyShortsClass(next);
    });

    observeVideos((el) => {
      try {
        if (!currentSettings.enabled) return;
        if (el.getAttribute('data-sanitytv-checked') === '1') return;

        const metadata = extractMetadata(el);
        if (!metadata) {
          // Shell rendered before its title hydrated — retry next tick.
          return;
        }
        el.setAttribute('data-sanitytv-checked', '1');

        if (isWhitelisted(currentSettings, metadata.channelName)) {
          applyAction(el, 'normal');
          return;
        }
        if (isBlacklisted(currentSettings, metadata.channelName)) {
          applyAction(el, 'hide');
          void incrementStat('hidden');
          return;
        }
        if (currentSettings.hideShortsCompletely && metadata.isShort) {
          applyAction(el, 'hide');
          void incrementStat('hidden');
          return;
        }

        const scored = scoreVideo(metadata, allRules);
        const thresholds = thresholdsFromSensitivity(currentSettings.sensitivity);
        let action = actionForScore(scored.score, thresholds);

        // 'Hide all flagged' setting (default on): collapse the grey
        // band into the hide band so users never see the warning badge,
        // they just see fewer videos. The grey band remains for users
        // who explicitly opt out.
        if (currentSettings.hideAllFlagged && action === 'grey') {
          action = 'hide';
        }

        applyAction(el, action, scored);

        if (action === 'hide') void incrementStat('hidden');
        else if (action === 'grey') void incrementStat('greyed');
      } catch (err) {
        warn('per-video error', String(err));
      }
    });
  } catch (err) {
    warn('bootstrap fatal', String(err));
  }
}

void bootstrap();

export function onExecute(): void {
  // intentionally empty
}

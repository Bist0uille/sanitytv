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

const log = (...args: unknown[]) => console.log('[SanityTV]', ...args);
const warn = (...args: unknown[]) => console.warn('[SanityTV]', ...args);

let currentSettings: Settings = DEFAULT_SETTINGS;
let processed = 0;
let masked = 0;

async function bootstrap() {
  log('content script booting on', location.href);
  try {
    ensureStyles();
    currentSettings = await getSettings();
    log('settings loaded', currentSettings);

    onSettingsChange((next) => {
      currentSettings = next;
      log('settings updated', next);
    });

    observeVideos((el) => {
      try {
        if (!currentSettings.enabled) return;
        const metadata = extractMetadata(el);
        processed += 1;
        if (!metadata) {
          if (processed <= 3) {
            warn('no metadata extracted from element', el.tagName, el);
          }
          return;
        }

        if (isWhitelisted(currentSettings, metadata.channelName)) {
          applyAction(el, 'normal');
          return;
        }
        if (isBlacklisted(currentSettings, metadata.channelName)) {
          applyAction(el, 'hide');
          masked += 1;
          void incrementStat('hidden');
          log('blacklisted →', metadata.channelName, '|', metadata.title);
          return;
        }

        const scored = scoreVideo(metadata, allRules);
        const thresholds = thresholdsFromSensitivity(currentSettings.sensitivity);
        const action = actionForScore(scored.score, thresholds);

        applyAction(el, action, scored);

        if (action !== 'normal') {
          masked += 1;
          if (action === 'hide') void incrementStat('hidden');
          else void incrementStat('greyed');
          log(
            `${action} (score=${scored.score})`,
            '|',
            metadata.title.slice(0, 80),
            '|',
            scored.signals.map((s) => `${s.kind}:${s.contribution}`).join(', '),
          );
        } else if (processed <= 5) {
          // Log a few "kept" examples for diagnostic visibility on first paint.
          log(`kept (score=${scored.score})`, '|', metadata.title.slice(0, 80));
        }
      } catch (err) {
        warn('per-video error', err);
      }
    });

    setTimeout(() => {
      log(`summary: processed=${processed} masked=${masked}`);
    }, 4000);
  } catch (err) {
    warn('bootstrap fatal', err);
  }
}

void bootstrap();

// CRXJS loader expects an onExecute export; making it a no-op satisfies the
// dynamic-import protocol and keeps the side-effect bootstrap above.
export function onExecute(): void {
  // intentionally empty — bootstrap already ran on module evaluation
}

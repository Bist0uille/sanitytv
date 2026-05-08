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

const DIAG_KEY = 'sanitytv:diag';

function diag(line: string) {
  try {
    const existing = sessionStorage.getItem(DIAG_KEY);
    const arr = existing ? (JSON.parse(existing) as string[]) : [];
    arr.push(`${new Date().toISOString().slice(11, 23)} ${line}`);
    if (arr.length > 200) arr.shift();
    sessionStorage.setItem(DIAG_KEY, JSON.stringify(arr));
  } catch {
    /* sessionStorage may be blocked on some pages */
  }
}

const log = (...args: unknown[]) => {
  const s = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  console.log('[SanityTV]', s);
  diag(`LOG ${s}`);
};
const warn = (...args: unknown[]) => {
  const s = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  console.warn('[SanityTV]', s);
  diag(`WARN ${s}`);
};

let currentSettings: Settings = DEFAULT_SETTINGS;
let processed = 0;
let masked = 0;
let observed = 0;

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
      observed += 1;
      try {
        if (!currentSettings.enabled) return;
        if (el.getAttribute('data-sanitytv-checked') === '1') return;

        const metadata = extractMetadata(el);
        if (!metadata) {
          if (observed <= 3) diag(`OBS no-metadata ${el.tagName}`);
          return;
        }
        el.setAttribute('data-sanitytv-checked', '1');
        processed += 1;

        if (isWhitelisted(currentSettings, metadata.channelName)) {
          applyAction(el, 'normal');
          return;
        }
        if (isBlacklisted(currentSettings, metadata.channelName)) {
          applyAction(el, 'hide');
          masked += 1;
          void incrementStat('hidden');
          log('blacklisted', metadata.channelName, '|', metadata.title);
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
            `${action} score=${scored.score}`,
            '|',
            metadata.title.slice(0, 60),
            '|',
            scored.signals.map((s) => `${s.kind}:${s.contribution}`).join(','),
          );
        } else if (processed <= 5) {
          log(`kept score=${scored.score}`, '|', metadata.title.slice(0, 60));
        }
      } catch (err) {
        warn('per-video error', String(err));
      }
    });

    setInterval(() => {
      diag(`STATS observed=${observed} processed=${processed} masked=${masked}`);
    }, 2000);
  } catch (err) {
    warn('bootstrap fatal', String(err));
  }
}

void bootstrap();

export function onExecute(): void {
  // intentionally empty
}

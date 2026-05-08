import { describe, it, expect } from 'vitest';
import { scoreVideo, allRules } from '../src/detection';

/**
 * Catastrophic-backtracking stress test for the detection regex.
 *
 * If a regex in any rule has nested quantifiers, alternation with
 * overlapping branches, or other ReDoS shapes, a hostile YouTube title
 * could freeze the content script. We pre-empt that by feeding 6
 * pathological titles up to 10 000 chars and asserting that scoring
 * stays well under 100 ms.
 */

const PATHO_TITLES: Array<[string, string]> = [
  ['10 000-char uppercase wall', 'A'.repeat(10000)],
  ['repeated clickbait stack', ('shocking ' + 'top 10 ').repeat(500)],
  ['5 000 fire emojis', '🔥'.repeat(5000)],
  ['vs/contre/versus repeated', 'iPhone vs Android contre Linux versus Windows '.repeat(200)],
  ['accented combat verbs', 'humilié écrasée détruit ridiculisée '.repeat(500)],
  [
    'kid character + disturbing soup',
    'elsa pregnant peppa murders cocomelon nightmare '.repeat(300),
  ],
];

describe('regex ReDoS resilience', () => {
  for (const [label, title] of PATHO_TITLES) {
    it(`scores '${label}' (length=${title.length}) under 100 ms`, () => {
      const meta = { videoId: 'r', title, channelName: 'C' };
      const start = performance.now();
      scoreVideo(meta, allRules);
      const dt = performance.now() - start;
      expect(dt, `scoring took ${dt.toFixed(2)} ms`).toBeLessThan(100);
    });
  }
});

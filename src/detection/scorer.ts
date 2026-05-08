import type { ScoredVideo, VideoMetadata } from '@/types';
import type { Rule } from './types';

export function scoreVideo(video: VideoMetadata, rules: ReadonlyArray<Rule>): ScoredVideo {
  const signals = rules
    .map((rule) => {
      const result = rule.evaluate({ video });
      return {
        kind: rule.kind,
        contribution: clamp(result.contribution * rule.weight, 0, 100),
        detail: result.detail,
      };
    })
    .filter((signal) => signal.contribution > 0);

  // Aggregate by SUM (capped at 100), not weighted mean. Weighted mean dilutes
  // a single screaming signal across rules that didn't fire and makes the
  // overall score too lenient. Each rule already self-caps to 100, so a
  // single very strong signal alone can still push the video past hideAt.
  const sum = signals.reduce((acc, s) => acc + s.contribution, 0);
  const score = clamp(Math.round(sum), 0, 100);

  return { ...video, score, signals };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export type DisplayAction = 'normal' | 'grey' | 'hide';

export interface ThresholdConfig {
  readonly greyAt: number;
  readonly hideAt: number;
}

export const DEFAULT_THRESHOLDS: ThresholdConfig = { greyAt: 30, hideAt: 60 };

export function actionForScore(score: number, thresholds: ThresholdConfig): DisplayAction {
  if (score >= thresholds.hideAt) return 'hide';
  if (score >= thresholds.greyAt) return 'grey';
  return 'normal';
}

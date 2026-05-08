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

  const totalWeight = rules.reduce((sum, rule) => sum + rule.weight, 0) || 1;
  const weightedSum = signals.reduce((sum, s) => sum + s.contribution, 0);
  const score = clamp(Math.round(weightedSum / totalWeight), 0, 100);

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

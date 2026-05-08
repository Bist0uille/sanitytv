import { brainrotRule } from './rules/brainrot';
import { clickbaitTitleRule } from './rules/clickbait_title';
import { rageBaitRule } from './rules/rage_bait';
import { sensationalismRule } from './rules/sensationalism';
import type { Rule } from './types';

export const allRules: ReadonlyArray<Rule> = [
  clickbaitTitleRule,
  rageBaitRule,
  brainrotRule,
  sensationalismRule,
];

export { scoreVideo, actionForScore, DEFAULT_THRESHOLDS } from './scorer';
export type { DisplayAction, ThresholdConfig } from './scorer';

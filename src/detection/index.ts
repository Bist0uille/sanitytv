import { clickbaitTitleRule } from './rules/clickbait_title';
import type { Rule } from './types';

export const allRules: ReadonlyArray<Rule> = [clickbaitTitleRule];

export { scoreVideo, actionForScore, DEFAULT_THRESHOLDS } from './scorer';
export type { DisplayAction, ThresholdConfig } from './scorer';

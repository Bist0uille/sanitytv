import type { DetectionSignal, VideoMetadata } from '@/types';

export interface RuleContext {
  readonly video: VideoMetadata;
}

export interface RuleResult {
  readonly contribution: number;
  readonly detail?: string;
}

export interface Rule {
  readonly kind: DetectionSignal;
  readonly weight: number;
  evaluate(ctx: RuleContext): RuleResult;
}

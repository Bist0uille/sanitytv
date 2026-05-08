import type { Rule, RuleContext, RuleResult } from '../types';

function countRepeatedEmojis(title: string): number {
  const emojis = title.match(/\p{Extended_Pictographic}/gu);
  if (!emojis) return 0;
  const counts = new Map<string, number>();
  for (const e of emojis) counts.set(e, (counts.get(e) ?? 0) + 1);
  let max = 0;
  for (const c of counts.values()) if (c > max) max = c;
  return max;
}

function evaluate(ctx: RuleContext): RuleResult {
  const { durationSeconds, title } = ctx.video;
  const hits: string[] = [];
  let raw = 0;

  if (durationSeconds !== undefined) {
    if (durationSeconds > 0 && durationSeconds < 30) {
      raw += 80;
      hits.push(`very short (${durationSeconds}s)`);
    } else if (durationSeconds > 0 && durationSeconds < 60) {
      raw += 55;
      hits.push(`short-form (${durationSeconds}s)`);
    }
  }

  if (title) {
    const repeated = countRepeatedEmojis(title);
    if (repeated >= 3) {
      raw += 30;
      hits.push(`emoji spam x${repeated}`);
    } else if (repeated === 2) {
      raw += 15;
      hits.push('emoji repeat');
    }
  }

  const contribution = Math.min(100, raw);
  return contribution > 0 ? { contribution, detail: hits.join('; ') } : { contribution: 0 };
}

export const brainrotRule: Rule = {
  kind: 'brainrot_structural',
  weight: 1,
  evaluate,
};

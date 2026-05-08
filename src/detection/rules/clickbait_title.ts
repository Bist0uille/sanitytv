import type { Rule, RuleContext, RuleResult } from '../types';

const CLICKBAIT_KEYWORDS_EN = [
  'shocking',
  'you won’t believe',
  "you won't believe",
  'gone wrong',
  'gone sexual',
  'must watch',
  'insane',
  'mind blown',
  'will blow your mind',
  'what happens next',
  'this is why',
];

const CLICKBAIT_KEYWORDS_FR = [
  'incroyable',
  'vous n’allez pas',
  'vous nallez pas',
  'vous ne croirez',
  'vous n’y croirez',
  'choc',
  'choquant',
  'ça tourne mal',
  'voici pourquoi',
  'la vérité sur',
  'enfin la vérité',
];

const CLICKBAIT_KEYWORDS = [...CLICKBAIT_KEYWORDS_EN, ...CLICKBAIT_KEYWORDS_FR];

const TOP_LIST_PATTERN = /\b(top|les)\s*\d+\b/i;
const EXCESSIVE_PUNCTUATION = /[!?]{2,}/;
const ATTENTION_EMOJIS =
  /[\u{1F525}\u{1F633}\u{1F92F}\u{1F92F}\u{1F4A5}\u{1F31F}\u{2757}\u{203C}\u{2B05}\u{27A1}\u{2B06}\u{2B07}]/u;

export function uppercaseRatio(title: string): number {
  const letters = title.match(/[A-ZÀ-ſ]/giu);
  if (!letters || letters.length === 0) return 0;
  const uppers = letters.filter((l) => l === l.toUpperCase()).length;
  return uppers / letters.length;
}

function keywordHits(title: string): readonly string[] {
  const haystack = title.toLowerCase();
  return CLICKBAIT_KEYWORDS.filter((kw) => haystack.includes(kw));
}

function evaluate(ctx: RuleContext): RuleResult {
  const title = ctx.video.title;
  if (!title) return { contribution: 0 };

  const hits: string[] = [];
  let raw = 0;

  const upper = uppercaseRatio(title);
  // Length gate avoids flagging short acronym-heavy titles like "CPU vs GPU".
  if (upper >= 0.6 && title.length >= 20) {
    raw += 35;
    hits.push(`uppercase ${(upper * 100).toFixed(0)}%`);
  } else if (upper >= 0.4 && title.length >= 20) {
    raw += 15;
    hits.push(`uppercase ${(upper * 100).toFixed(0)}%`);
  }

  if (EXCESSIVE_PUNCTUATION.test(title)) {
    raw += 20;
    hits.push('excessive punctuation');
  }

  if (ATTENTION_EMOJIS.test(title)) {
    raw += 25;
    hits.push('attention-grabbing emoji');
  }

  const kw = keywordHits(title);
  if (kw.length > 0) {
    raw += Math.min(50, kw.length * 25);
    hits.push(`keyword: ${kw.slice(0, 2).join(', ')}`);
  }

  if (TOP_LIST_PATTERN.test(title)) {
    raw += 15;
    hits.push('top-N list pattern');
  }

  const contribution = Math.min(100, raw);
  return contribution > 0 ? { contribution, detail: hits.join('; ') } : { contribution: 0 };
}

export const clickbaitTitleRule: Rule = {
  kind: 'clickbait_title',
  weight: 1,
  evaluate,
};

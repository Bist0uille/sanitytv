import type { Rule, RuleContext, RuleResult } from '../types';

const CLICKBAIT_KEYWORDS_EN = [
  'shocking',
  'you won’t believe',
  "you won't believe",
  'gone wrong',
  'gone sexual',
  'goes wrong',
  'must watch',
  'insane',
  'craziest',
  'mind blown',
  'will blow your mind',
  'what happens next',
  'this is why',
  'unbelievable',
  'epic fail',
  'epic win',
  // shock adjectives observed in real YouTube clickbait that the
  // baseline list missed
  'disturbing',
  'terrifying',
  'horrifying',
  'creepy',
  'freaky',
  'scariest',
  'deadliest',
  'chilling',
  'brutal',
  'savage',
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
  'absolument fou',
  'complètement dingue',
  'pète un câble',
  'pète les plombs',
  'choque tout le monde',
  'dérapage',
  'terrifiant',
  'terrifiante',
  'horrifiant',
  'horrifiante',
  'effrayant',
  'effrayante',
  'glaçant',
  'glaçante',
];

const CLICKBAIT_KEYWORDS = [...CLICKBAIT_KEYWORDS_EN, ...CLICKBAIT_KEYWORDS_FR];

// Listicle pattern: "Top N", "Les N", or "N [shocking-adjective]".
const TOP_LIST_PATTERN =
  /\b(top|les)\s*\d+\b|\b\d+\s+(?:most\s+)?(?:shocking|insane|crazy|amazing|incredible|brutal|deadliest|scariest|biggest|worst|best|epic|hidden|secret|disturbing|outrageous|astonishing)\b/i;
// Match runs of 2+ identical bangs/marks (!! or ??), or 3+ alternating
// marks (?!?, !?!, !?!?), but NOT a lone "?!" / "!?" — those are common
// in legit emphatic titles like "Wait, what?!".
const EXCESSIVE_PUNCTUATION = /!!+|\?\?+|[!?]{3,}/;
// All-caps "screaming" word of 6+ letters in an otherwise mixed-case title
// (the uppercase-ratio rule below misses these because the global ratio
// stays low). 6+ avoids 5-letter brand acronyms like INTEL.
const SCREAMING_WORD = /\b[A-Z]{6,}\b/g;
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
    // Tier by longest run length: !! or ?? = doubled (25), !!! or more = triple+ (35).
    const runs = title.match(/[!?]{2,}/g) ?? [];
    const longestRun = runs.reduce((m, r) => Math.max(m, r.length), 0);
    if (longestRun >= 3) {
      raw += 35;
      hits.push(`triple+ punctuation (${longestRun})`);
    } else {
      raw += 25;
      hits.push('doubled punctuation');
    }
  }

  // Tuned so that 2 caps words alone (CHALEUR HUMAINE on Le Monde
  // podcasts) stay just under the grey threshold, but combine cleanly
  // with rage_bait (DESTROYS+HEATED) or keywords (CHOQUANT).
  const screamingWords = title.match(SCREAMING_WORD)?.length ?? 0;
  if (screamingWords >= 2) {
    raw += 20;
    hits.push(`${screamingWords} screaming words`);
  } else if (screamingWords === 1) {
    raw += 12;
    hits.push('screaming word');
  }

  // Single attention emoji is common in legit titles (one 🔥 at the end).
  // Two or more is the spammy-clickbait pattern.
  const emojiMatches = title.match(new RegExp(ATTENTION_EMOJIS, 'gu')) ?? [];
  if (emojiMatches.length >= 2) {
    raw += 25;
    hits.push(`${emojiMatches.length} attention emojis`);
  } else if (emojiMatches.length === 1) {
    raw += 10;
    hits.push('attention emoji');
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

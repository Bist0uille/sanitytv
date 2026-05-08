import type { Rule, RuleContext, RuleResult } from '../types';

const MYSTERY_PATTERNS_EN =
  /\b(the (real )?truth about|what (they|nobody) (don'?t|doesn'?t) want you to know|hidden (truth|secret|reason)|the secret behind|exposed|revealed|nobody is talking about)\b/i;

const MYSTERY_PATTERNS_FR =
  /\b(la vérité (cachée|sur|dévoilée)|ce qu['’]on (vous|nous) cache|enfin (révélé|dévoilé)|le secret (de|derrière)|personne (ne )?(parle|n['’]ose dire))\b/i;

const CONSPIRACY_KEYWORDS =
  /\b(conspiracy|conspiration|illuminati|big pharma|deep state|n[wo]o|nouvel ordre mondial|psyop)\b/i;

const SUPERLATIVES =
  /\b(greatest|largest|biggest|most (insane|incredible|amazing|crazy)|plus (incroyable|fou|dingue|énorme))\s+\w+/i;

function evaluate(ctx: RuleContext): RuleResult {
  const title = ctx.video.title;
  if (!title) return { contribution: 0 };

  const hits: string[] = [];
  let raw = 0;

  if (MYSTERY_PATTERNS_EN.test(title) || MYSTERY_PATTERNS_FR.test(title)) {
    raw += 45;
    hits.push('mystery / hidden-truth pattern');
  }

  if (CONSPIRACY_KEYWORDS.test(title)) {
    raw += 50;
    hits.push('conspiracy keyword');
  }

  if (SUPERLATIVES.test(title)) {
    raw += 20;
    hits.push('superlative');
  }

  const contribution = Math.min(100, raw);
  return contribution > 0 ? { contribution, detail: hits.join('; ') } : { contribution: 0 };
}

export const sensationalismRule: Rule = {
  kind: 'sensationalism',
  weight: 1,
  evaluate,
};

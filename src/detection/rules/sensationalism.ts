import type { Rule, RuleContext, RuleResult } from '../types';

// EN: support both ASCII (') and curly (') apostrophes inside contractions.
const MYSTERY_PATTERNS_EN =
  /\b(the (real )?truth about|what (they|nobody) (don|doesn)['’]?t want you to know|hidden (truth|secret|reason)|the secret behind|exposed|revealed|nobody is talking about)\b/i;

// FR: many forms end in é/ée which break \b — use Unicode lookarounds.
const MYSTERY_PATTERNS_FR =
  /(?<![\p{L}])(?:la vérité (?:cachée|sur|dévoilée?s?)|ce qu['’]on (?:vous|nous) cache|enfin (?:révélé|révélée|dévoilé|dévoilée)|le secret (?:de|derrière)|personne (?:ne )?(?:parle|n['’]ose dire))(?![\p{L}])/iu;

const CONSPIRACY_KEYWORDS =
  /\b(conspiracy|conspiration|illuminati|big pharma|deep state|n[wo]o|nouvel ordre mondial|psyop)\b/i;

const SUPERLATIVES =
  /\b(greatest|largest|biggest|most (insane|incredible|amazing|crazy)|plus (incroyable|fou|dingue|énorme))\s+\w+/i;

// Morbid / gore / tragedy keywords often used to attract attention via
// shock or morbid curiosity. Bilingual EN+FR. Global flag so we can count
// occurrences and stack the score.
const GORE_TRAGEDY_EN =
  /\b(rape|raped|murder|murdered|murders|killed|killing|killings|corpse|bloodbath|massacre|massacred|attacked|stabbed|shot dead|abducted|kidnap(?:ped)?|suicide|predator|victim|tortured|brutally)\b/gi;

// FR: many forms end with é/ée which break \b — use Unicode lookarounds.
const GORE_TRAGEDY_FR =
  /(?<![\p{L}])(?:viol|viols|violée?s?|violés?|meurtre|meurtres|tué|tuée|tués|tuées|tuer|assassiné|assassinée|assassinés|assassinées|assassinat|cadavres?|sanglante?s?|agression|agressé|agressée|agressions|kidnapping|enlèvement|atroce|atrocité|sordide|drame|tragédie|suicide|massacre|massacré|massacrée|torturé|torturée|prédateur|pédophile|incest[eu]|pendu|mutilation|mutilé|mutilée)(?![\p{L}])/giu;

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

  // Stack morbid keywords: each occurrence adds, capped. A title with
  // multiple gore words ("massacre + assassinée + tués") needs to score
  // hide-tier on its own.
  const goreCount =
    (title.match(GORE_TRAGEDY_EN)?.length ?? 0) + (title.match(GORE_TRAGEDY_FR)?.length ?? 0);
  if (goreCount > 0) {
    raw += Math.min(85, 50 + (goreCount - 1) * 20);
    hits.push(goreCount === 1 ? 'morbid keyword' : `${goreCount} morbid keywords`);
  }

  const contribution = Math.min(100, raw);
  return contribution > 0 ? { contribution, detail: hits.join('; ') } : { contribution: 0 };
}

export const sensationalismRule: Rule = {
  kind: 'sensationalism',
  weight: 1,
  evaluate,
};

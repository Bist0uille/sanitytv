import type { Rule, RuleContext, RuleResult } from '../types';

const COMBAT_VERBS_EN =
  /\b(destroys?|destroyed|destroying|owns?|owned|owning|demolishes?|demolished|demolishing|annihilates?|annihilated|annihilating|humiliates?|humiliated|humiliating|crushes?|crushed|crushing|wrecks?|wrecked|wrecking|obliterates?|obliterated|obliterating|eviscerates?|eviscerated|eviscerating|roasts?|roasted|roasting|exposes?|exposed|exposing)\b/i;

// Unicode-aware boundaries: \b is not accent-aware in JS, so we use lookarounds.
const COMBAT_VERBS_FR =
  /(?<![\p{L}])(?:détruit|détruite|détruise|détruisent|écrase|écrasé|écrasée|écrasent|humilie|humilié|humiliée|humilient|démolit|démoli|démolie|démolissent|anéantit|anéanti|anéantissent|ratatine|ridiculise|ridiculisé|ridiculisée|ridiculisent)(?![\p{L}])/iu;

const OUTRAGE_NOUNS =
  /\b(scandal|scandale|outrage|polémique|controverse|drama|backlash|cancel(?:led|ling)?)\b/i;

// Word class that handles both ASCII and accented Latin letters.
const VS_PATTERN = /[A-Za-zÀ-ſ]{3,}\s+(?:vs\.?|contre|versus)\s+[A-Za-zÀ-ſ]{3,}/i;

const CULTURE_WAR =
  /\b(woke(?:ism|ness)?|cancel(?:lation|led)?|sjw|chad|alpha|beta|red[\s-]?pill)\b/i;

function evaluate(ctx: RuleContext): RuleResult {
  const title = ctx.video.title;
  if (!title) return { contribution: 0 };

  const hits: string[] = [];
  let raw = 0;

  if (COMBAT_VERBS_EN.test(title) || COMBAT_VERBS_FR.test(title)) {
    // Slightly above the grey threshold — combined with any other
    // signal (uppercase, screaming, listicle), reliably tips into hide.
    raw += 45;
    hits.push('combat verb');
  }

  if (OUTRAGE_NOUNS.test(title)) {
    raw += 25;
    hits.push('outrage noun');
  }

  if (VS_PATTERN.test(title)) {
    // Light weight: tech benchmarks (Linux vs Windows, AMD vs NVIDIA)
    // dominate the false-positive set when the weight is high.
    raw += 12;
    hits.push('confrontation pattern');
  }

  if (CULTURE_WAR.test(title)) {
    raw += 35;
    hits.push('culture-war keyword');
  }

  const contribution = Math.min(100, raw);
  return contribution > 0 ? { contribution, detail: hits.join('; ') } : { contribution: 0 };
}

export const rageBaitRule: Rule = {
  kind: 'rage_bait',
  weight: 1,
  evaluate,
};

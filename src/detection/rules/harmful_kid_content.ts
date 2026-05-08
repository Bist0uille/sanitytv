import type { Rule, RuleContext, RuleResult } from '../types';

/**
 * Heuristic detector for two patterns specifically harmful to children:
 *
 *  1. "Elsagate"-style: a well-known kid character co-occurring with a
 *     disturbing word (sex/violence/horror) in the title. Single-token
 *     match on either side is not enough — both must be present.
 *
 *  2. Named dangerous challenges that have caused real-world harm
 *     (Tide Pod, Blackout, Skull Breaker, …).
 *
 * NOTE: SanityTV is not a parental-control product. This rule covers a
 * known, finite set of patterns; a determined predator can defeat it
 * trivially. See ADR-0007. Treat this rule as a defence-in-depth layer,
 * never as a replacement for YouTube Kids or a real parental control.
 */

const KID_CHARACTERS =
  /\b(elsa|anna|olaf|peppa|cocomelon|mickey|minnie|donald duck|spider[- ]?man|spiderman|hulk|paw[- ]?patrol|bluey|frozen|my little pony|baby shark|lightning mcqueen|sonic|mario|luigi|pikachu|barbie|disney princess|ariel|moana|encanto|pokemon)\b/i;

const DISTURBING_WORDS_KID =
  /\b(pregnant|enceinte|kiss(?:es|ed|ing)?|baiser|naked|nu(?:e|es|s)?|sex|sexy|marry|marries|épouse|épousent|murder|murders|murdered|kill|kills|killed|killing|blood|horror|scary|creepy|cursed|nightmare|dead|dies|dying|hentai|porn|adult|inappropriate)\b/i;

const DANGEROUS_CHALLENGES =
  /\b(tide ?pod|blackout|skull[- ]?breaker|cinnamon|salt[ -]and[- ]ice|fire|hot[ -]water|knockout[- ]game|pass[- ]?out|choking|bird[- ]?box|momo|blue[- ]?whale|kiki|car[- ]?surfing|kylie[- ]jenner|nyquil)\s+challenge/i;

// Exceptions: these context cues indicate legitimate gameplay or
// canonical fiction (movies, episodes, comics) rather than Elsagate.
// If any is present alongside the kid-character + disturbing-word match,
// we suppress the rule.
const LEGIT_CONTEXT =
  /\b(gameplay|playthrough|speedrun|walkthrough|let'?s play|level|boss fight|world record|tutorial|guide|review|trailer|cinematic|movie|film|scene|episode|comic|marvel|dc|show|series|song|lyric|music video|official|soundtrack)\b/i;

function evaluate(ctx: RuleContext): RuleResult {
  const title = ctx.video.title;
  if (!title) return { contribution: 0 };

  const hits: string[] = [];
  let raw = 0;

  if (DANGEROUS_CHALLENGES.test(title)) {
    raw += 60;
    hits.push('dangerous challenge');
  }

  if (KID_CHARACTERS.test(title) && DISTURBING_WORDS_KID.test(title)) {
    if (LEGIT_CONTEXT.test(title)) {
      // Mario kills Bowser in a speedrun, Spider-Man kisses MJ in a film
      // scene: canonical fiction, not Elsagate.
      hits.push('kid+disturbing suppressed by legit context');
    } else {
      raw += 60;
      hits.push('kid character + disturbing word');
    }
  }

  const contribution = Math.min(100, raw);
  return contribution > 0 ? { contribution, detail: hits.join('; ') } : { contribution: 0 };
}

export const harmfulKidContentRule: Rule = {
  kind: 'harmful_kid_content',
  weight: 1,
  evaluate,
};

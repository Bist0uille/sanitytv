import { describe, it, expect } from 'vitest';
import { actionForScore, allRules, DEFAULT_THRESHOLDS, scoreVideo } from '../src/detection';
import type { DisplayAction } from '../src/detection';

interface CorpusItem {
  title: string;
  durationSeconds?: number;
  isShort?: boolean;
  expected: DisplayAction;
  category: string;
  rationale?: string;
}

/**
 * Synthetic ground-truth corpus for regression testing.
 *
 * Each entry asserts that scoreVideo + actionForScore(DEFAULT_THRESHOLDS)
 * produces the expected band. Tests run in CI; failures point at concrete
 * gaps in the heuristic rules. The corpus complements the empirical
 * Playwright harness in scripts/regression-test.mjs (which captures the
 * messy reality of real YouTube search results).
 *
 * Bands:
 *   normal: score <  30
 *   grey  : 30 <= score < 60
 *   hide  : score >= 60
 */
const corpus: CorpusItem[] = [
  // --------------------------------------------------------------
  // HIDE band — strong multi-signal positives
  // --------------------------------------------------------------
  {
    category: 'clickbait-en-strong',
    title: 'TOP 10 SHOCKING MOMENTS YOU WON’T BELIEVE!!!',
    expected: 'hide',
    rationale: 'uppercase + listicle + keyword + punctuation',
  },
  {
    category: 'clickbait-en-strong',
    title: 'Top 5 CRAZIEST Road Rage Moments Ever 😳🔥 (You Won’t Believe)',
    expected: 'hide',
    rationale: 'listicle + keyword + emoji + clickbait phrase',
  },
  {
    category: 'clickbait-fr-strong',
    title: 'Vous n’allez pas croire ce qui s’est passé !!!',
    expected: 'hide',
    rationale: 'phrase clickbait FR + ponctuation excessive',
  },
  {
    category: 'clickbait-fr-strong',
    title: 'Voici pourquoi tout le monde se trompe (CHOQUANT)',
    expected: 'hide',
    rationale: 'phrase + keyword + uppercase',
  },
  {
    category: 'rage-bait-en',
    title: 'Ben Shapiro DESTROYS leftist student in HEATED debate',
    expected: 'hide',
    rationale: 'combat verb + culture-war framing',
  },
  {
    category: 'rage-bait-fr',
    title: 'Le ministre HUMILIÉ en direct par un journaliste !!',
    expected: 'hide',
    rationale: 'verb FR + ponctuation',
  },
  {
    category: 'rage-bait-culture-war',
    title: 'How wokeism is destroying gaming forever',
    expected: 'hide',
    rationale: 'combat verb (gerund) + culture-war keyword',
  },
  {
    category: 'morbide-tabloid-fr',
    title: 'Une jeune fille violée en pleine rue à Paris',
    expected: 'grey',
    rationale: 'gore keyword FR — single signal puts it grey, not hide',
  },
  {
    category: 'morbide-tabloid-fr',
    title: 'Massacre conjugal : femme assassinée et enfants tués',
    expected: 'hide',
    rationale: 'multiple gore keywords stack',
  },
  {
    category: 'conspiracy-fr',
    title: 'Le nouvel ordre mondial enfin révélé',
    expected: 'hide',
    rationale: 'conspiracy keyword + mystery pattern',
  },
  {
    category: 'conspiracy-en',
    title: 'The illuminati control everything — what they don’t want you to know',
    expected: 'hide',
    rationale: 'conspiracy + mystery hidden-truth pattern',
  },
  {
    category: 'brainrot-short-semantic',
    title: 'OMG INSANE moment 🔥🔥🔥 watch til end',
    durationSeconds: 25,
    isShort: true,
    expected: 'hide',
    rationale: 'Short + emoji spam + keyword + uppercase',
  },
  {
    category: 'reaction-drama',
    title: 'Drake EXPOSED by Kendrick — full breakdown',
    expected: 'hide',
    rationale: 'celebrity-beef framing — combat verb + sensationalism mystery pattern',
  },
  {
    category: 'sensationnal-hidden-truth',
    title: 'The real truth about big pharma — what they don’t want you to know',
    expected: 'hide',
    rationale: 'two mystery patterns + superlative-ish phrase',
  },

  // --------------------------------------------------------------
  // HIDE — kid-protection: harmful patterns
  // --------------------------------------------------------------
  // NOTE: V0 baseline rules (without harmful_kid_content) may NOT yet
  // hide these. The `expected` column tracks what we WANT, not what V0
  // produces today. Failures here are the signal to ship Phase E.bis.
  {
    category: 'kid-elsagate',
    title: 'Frozen Elsa pregnant by Spider-Man (cartoon for kids)',
    expected: 'hide',
    rationale: 'Elsagate pattern — currently NOT detected by V0; gap to fix',
  },
  {
    category: 'kid-elsagate',
    title: 'Peppa Pig murders Daddy Pig with knife (parody)',
    expected: 'hide',
    rationale: 'kid-character + murder keyword — gore keyword catches this',
  },
  {
    category: 'kid-dangerous-challenge',
    title: 'TIDE POD challenge gone wrong (you won’t believe)',
    expected: 'hide',
    rationale: 'uppercase + dangerous challenge + clickbait phrase',
  },
  {
    category: 'kid-dangerous-challenge',
    title: 'Blackout challenge tutorial — DO NOT TRY!!!',
    expected: 'hide',
    rationale: 'punctuation + uppercase — expects partial; V0 may flag as grey',
  },
  {
    category: 'kid-cursed',
    title: 'Cursed Cocomelon nightmare version',
    expected: 'hide',
    rationale: 'kid-character + creepy/cursed — V0 GAP; needs Phase E.bis',
  },

  // --------------------------------------------------------------
  // GREY band — single moderate signal
  // --------------------------------------------------------------
  {
    category: 'listicle-pure',
    title: 'Top 10 movies of 2025',
    expected: 'normal',
    rationale: 'listicle alone scores 15 — under grey threshold (30)',
  },
  {
    category: 'listicle-pure-fr',
    title: 'Top 10 des meilleurs jeux vidéo',
    expected: 'normal',
    rationale: 'listicle alone — under threshold',
  },
  {
    category: 'sensationnal-mild',
    title: 'The biggest mistake I ever made on YouTube',
    expected: 'normal',
    rationale: 'superlative alone scores 20 — under grey threshold',
  },
  {
    category: 'single-shocking-keyword',
    title: 'Shocking moments at the Olympics',
    expected: 'normal',
    rationale: 'single keyword scores 25 — just below grey threshold',
  },
  {
    category: 'combat-verb-figurative',
    title: 'How Apple destroyed the desktop CPU market',
    expected: 'grey',
    rationale: 'rage_bait combat verb fires (40) — borderline grey',
  },
  {
    category: 'shocking-and-listicle',
    title: 'Top 5 shocking gaming moments',
    expected: 'grey',
    rationale: 'shocking 25 + listicle 15 = 40 → grey',
  },
  {
    category: 'mrbeast-style',
    title: 'I Spent $1,000,000 in 24 Hours',
    expected: 'normal',
    rationale: 'no firing — neutral despite the spectacle. Acceptable for V0.',
  },

  // --------------------------------------------------------------
  // NORMAL band — true negatives
  // --------------------------------------------------------------
  {
    category: 'educational-en',
    title: 'How algorithms shape our lives — Vox Explained',
    expected: 'normal',
  },
  {
    category: 'educational-fr',
    title: 'L’histoire fascinante du nombre pi',
    expected: 'normal',
  },
  {
    category: 'tutorial-tech',
    title: 'React useEffect tutorial 2026',
    expected: 'normal',
  },
  {
    category: 'tutorial-tech',
    title: 'git rebase explained simply',
    expected: 'normal',
  },
  {
    category: 'news-fr',
    title: 'Le Monde — Entretien avec un climatologue',
    expected: 'normal',
  },
  {
    category: 'news-en',
    title: 'PBS NewsHour: Full Show June 1, 2026',
    expected: 'normal',
  },
  {
    category: 'music',
    title: 'Lana Del Rey - Norman Fucking Rockwell (Audio)',
    expected: 'normal',
  },
  {
    category: 'music',
    title: 'Lo-fi beats to study and relax to',
    expected: 'normal',
  },
  {
    category: 'vlog',
    title: 'Morning routine in a 25m² apartment',
    expected: 'normal',
  },
  {
    category: 'cooking',
    title: 'How to make perfect carbonara in 15 min',
    expected: 'normal',
  },
  {
    category: 'history-academic',
    title: 'Yale lecture — World War 2 origins and consequences',
    expected: 'normal',
    rationale: 'academic context; "war" not in gore list',
  },
  {
    category: 'documentary-history-fr',
    title: 'Histoire de la Révolution française — Arte',
    expected: 'normal',
  },
  {
    category: 'yoga',
    title: '20 min yoga for back pain',
    expected: 'normal',
  },
  {
    category: 'sport-play-by-play',
    title: 'Boxing knockout compilation — best of 2025',
    expected: 'normal',
    rationale: '"knockout" not in our regex; sport context not flagged',
  },
  {
    category: 'sport-listicle',
    title: 'Top 10 UFC knockouts of all time',
    expected: 'normal',
    rationale: 'listicle alone (15) — below grey threshold',
  },
  {
    category: 'tech-review',
    title: 'MKBHD — iPhone 17 review',
    expected: 'normal',
  },
  {
    category: 'reaction-music',
    title: 'First time hearing Bohemian Rhapsody',
    expected: 'normal',
  },
  {
    category: 'critique-reasoned',
    title: 'Why this movie is overrated — a measured take',
    expected: 'normal',
  },

  // --------------------------------------------------------------
  // Tricky cases — must NOT trigger
  // --------------------------------------------------------------
  {
    category: 'trick-emphatic-punct',
    title: 'Wait, what?!',
    expected: 'normal',
    rationale: 'lone "?!" no longer fires after Phase 1 polish',
  },
  {
    category: 'trick-vs-tech',
    title: 'Linux vs Windows — Which is better for dev?',
    expected: 'normal',
    rationale: 'vs pattern fires +20 — still under grey threshold',
  },
  {
    category: 'trick-vs-acronyms',
    title: 'USA vs URSS — Cold War explained',
    expected: 'normal',
    rationale: '3-char acronyms still match vs pattern — single-signal grey-adjacent',
  },
  {
    category: 'trick-vs-tech-acronyms',
    title: 'CPU vs GPU benchmark on Apple M3',
    expected: 'normal',
    rationale: 'acronyms not flagged for uppercase (length gate)',
  },
  {
    category: 'trick-stem-violin',
    title: 'The history of the violin',
    expected: 'normal',
    rationale: '"violin" must not match "viol" — Unicode lookaround test',
  },
  {
    category: 'trick-stem-violet',
    title: 'Apprendre à mélanger le violet en peinture',
    expected: 'normal',
    rationale: '"violet" must not match "viol"',
  },
  {
    category: 'trick-stem-violation',
    title: 'GDPR violation reporting — a legal explainer',
    expected: 'normal',
    rationale: '"violation" must not match "viol"',
  },
  {
    category: 'trick-veritasium-real',
    title: 'The Most Misunderstood Concept in Physics',
    expected: 'normal',
    rationale: 'real Veritasium title with superlative-ish; should pass',
  },

  // --------------------------------------------------------------
  // Kid content — legitimate (must NOT be flagged)
  // --------------------------------------------------------------
  {
    category: 'kid-legit',
    title: 'Peppa Pig English full episodes 2026',
    expected: 'normal',
  },
  {
    category: 'kid-legit',
    title: 'Bluey — Season 3 full episode "Sleepytime"',
    expected: 'normal',
  },
  {
    category: 'kid-legit',
    title: 'Cocomelon nursery rhymes — Old MacDonald Had a Farm',
    expected: 'normal',
  },
  {
    category: 'kid-legit-fr',
    title: 'Comptine pour bébé — Une souris verte',
    expected: 'normal',
  },
  {
    category: 'kid-legit-gaming',
    title: 'Roblox obby tutorial for kids — easy levels',
    expected: 'normal',
  },
  {
    category: 'kid-legit',
    title: 'Minecraft for kids — building a house no swearing',
    expected: 'normal',
  },
];

describe('regression corpus', () => {
  it('contains a non-trivial number of examples', () => {
    expect(corpus.length).toBeGreaterThanOrEqual(50);
  });

  describe('per-item bands', () => {
    for (const item of corpus) {
      const label = `[${item.category}] ${item.title.slice(0, 60)}`;
      it(label, () => {
        const video = {
          videoId: `x-${item.category}`,
          title: item.title,
          channelName: 'TestChannel',
          durationSeconds: item.durationSeconds,
          isShort: item.isShort,
        };
        const scored = scoreVideo(video, allRules);
        const action = actionForScore(scored.score, DEFAULT_THRESHOLDS);
        const debug = `score=${scored.score} signals=[${scored.signals
          .map((s) => `${s.kind}:${s.contribution}`)
          .join(', ')}]`;
        expect(action, debug).toBe(item.expected);
      });
    }
  });

  it('hits at least 90% accuracy across the corpus', () => {
    let hits = 0;
    const misses: string[] = [];
    for (const item of corpus) {
      const video = {
        videoId: `x-${item.category}`,
        title: item.title,
        channelName: 'TestChannel',
        durationSeconds: item.durationSeconds,
        isShort: item.isShort,
      };
      const scored = scoreVideo(video, allRules);
      const action = actionForScore(scored.score, DEFAULT_THRESHOLDS);
      if (action === item.expected) {
        hits += 1;
      } else {
        misses.push(
          `[${item.category}] ${item.title.slice(0, 60)} → ${action} (score=${scored.score}), expected ${item.expected}`,
        );
      }
    }
    const accuracy = hits / corpus.length;
    expect(
      accuracy,
      `${hits}/${corpus.length} = ${(accuracy * 100).toFixed(1)}%\nMisses:\n${misses.join('\n')}`,
    ).toBeGreaterThanOrEqual(0.9);
  });
});

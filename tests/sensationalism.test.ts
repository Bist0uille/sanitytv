import { describe, it, expect } from 'vitest';
import { sensationalismRule } from '../src/detection/rules/sensationalism';

const ctx = (title: string) => ({
  video: { videoId: 'x', title, channelName: 'C' },
});

describe('sensationalismRule', () => {
  it('does not flag neutral titles', () => {
    expect(sensationalismRule.evaluate(ctx('Introduction to category theory')).contribution).toBe(
      0,
    );
    expect(
      sensationalismRule.evaluate(ctx('Histoire de la révolution française')).contribution,
    ).toBe(0);
  });

  it('flags hidden-truth patterns (EN)', () => {
    expect(
      sensationalismRule.evaluate(ctx('The real truth about big tech')).contribution,
    ).toBeGreaterThan(0);
    expect(
      sensationalismRule.evaluate(ctx("What they don't want you to know")).contribution,
    ).toBeGreaterThan(0);
  });

  it('flags hidden-truth patterns (FR)', () => {
    expect(
      sensationalismRule.evaluate(ctx('La vérité cachée derrière votre alimentation')).contribution,
    ).toBeGreaterThan(0);
    expect(
      sensationalismRule.evaluate(ctx('Ce qu’on vous cache vraiment')).contribution,
    ).toBeGreaterThan(0);
  });

  it('flags conspiracy keywords', () => {
    expect(
      sensationalismRule.evaluate(ctx('The illuminati and the financial system')).contribution,
    ).toBeGreaterThan(40);
    expect(
      sensationalismRule.evaluate(ctx('Le nouvel ordre mondial expliqué')).contribution,
    ).toBeGreaterThan(40);
  });

  it('flags hyperbolic superlatives', () => {
    expect(
      sensationalismRule.evaluate(ctx('The most insane heist of the century')).contribution,
    ).toBeGreaterThan(0);
  });

  it('flags morbid / gore keywords (EN)', () => {
    expect(
      sensationalismRule.evaluate(ctx('Mother MURDERED in front of her kids')).contribution,
    ).toBeGreaterThan(0);
    expect(
      sensationalismRule.evaluate(ctx('Brutally attacked by neighbour')).contribution,
    ).toBeGreaterThan(0);
    expect(
      sensationalismRule.evaluate(ctx('Sweet child kidnapped by predator')).contribution,
    ).toBeGreaterThan(0);
  });

  it('flags morbid / gore keywords (FR)', () => {
    expect(
      sensationalismRule.evaluate(ctx('Une jeune fille violée dans le métro')).contribution,
    ).toBeGreaterThan(0);
    expect(
      sensationalismRule.evaluate(ctx('Un homme assassiné devant chez lui')).contribution,
    ).toBeGreaterThan(0);
    expect(
      sensationalismRule.evaluate(ctx('Le drame qui a tué toute une famille')).contribution,
    ).toBeGreaterThan(0);
    expect(
      sensationalismRule.evaluate(ctx('Suicide en direct sur les réseaux sociaux')).contribution,
    ).toBeGreaterThan(0);
  });

  it('does not flag neutral words that contain morbid stems', () => {
    // "morte" (Spanish/Portuguese for death) – not in our list, shouldn't fire
    // "violet", "violon", "violation" (regulatory) — share a stem with "viol"
    expect(sensationalismRule.evaluate(ctx('The history of the violin')).contribution).toBe(0);
    expect(sensationalismRule.evaluate(ctx('Apprendre le violet en peinture')).contribution).toBe(
      0,
    );
  });
});

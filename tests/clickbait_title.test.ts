import { describe, it, expect } from 'vitest';
import { clickbaitTitleRule, uppercaseRatio } from '../src/detection/rules/clickbait_title';

const ctx = (title: string) => ({
  video: { videoId: 'x', title, channelName: 'C' },
});

describe('uppercaseRatio', () => {
  it('returns 0 for an empty string', () => {
    expect(uppercaseRatio('')).toBe(0);
  });

  it('counts only letters, ignoring spaces and punctuation', () => {
    expect(uppercaseRatio('hello world')).toBe(0);
    expect(uppercaseRatio('HELLO world')).toBeCloseTo(0.5, 2);
    expect(uppercaseRatio('HELLO WORLD!!!')).toBe(1);
  });
});

describe('clickbaitTitleRule', () => {
  it('does not flag a normal lowercase title', () => {
    expect(clickbaitTitleRule.evaluate(ctx('how to learn rust in 2025')).contribution).toBe(0);
  });

  it('does not flag short fully-uppercase titles (e.g. acronyms)', () => {
    expect(clickbaitTitleRule.evaluate(ctx('NASA')).contribution).toBe(0);
    expect(clickbaitTitleRule.evaluate(ctx('CPU vs GPU')).contribution).toBe(0);
  });

  it('flags titles that scream in uppercase', () => {
    const r = clickbaitTitleRule.evaluate(ctx('I CANNOT BELIEVE THIS HAPPENED'));
    expect(r.contribution).toBeGreaterThan(0);
  });

  it('flags excessive punctuation', () => {
    const r = clickbaitTitleRule.evaluate(ctx('A reasonable title!!!'));
    expect(r.contribution).toBeGreaterThan(0);
  });

  it('flags clickbait keywords (English)', () => {
    const r = clickbaitTitleRule.evaluate(ctx('You won’t believe what happens next'));
    expect(r.contribution).toBeGreaterThan(0);
  });

  it('flags clickbait keywords (French)', () => {
    const r = clickbaitTitleRule.evaluate(ctx('Voici pourquoi tout le monde se trompe'));
    expect(r.contribution).toBeGreaterThan(0);
  });

  it('flags top-N listicles', () => {
    const r = clickbaitTitleRule.evaluate(ctx('Top 10 hidden settings on your phone'));
    expect(r.contribution).toBeGreaterThan(0);
  });

  it('does not flag respected creators using moderate uppercase', () => {
    // Veritasium / Kurzgesagt-style titles
    const titles = [
      'The Most Misunderstood Concept in Physics',
      'How Algorithms Shape Our Lives',
      'The Real Reason Planes Don’t Fly Over the Pacific',
    ];
    for (const t of titles) {
      const r = clickbaitTitleRule.evaluate(ctx(t));
      expect(r.contribution, `should not flag: ${t}`).toBeLessThan(30);
    }
  });
});

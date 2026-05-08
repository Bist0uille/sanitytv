import { describe, it, expect } from 'vitest';
import { rageBaitRule } from '../src/detection/rules/rage_bait';

const ctx = (title: string) => ({
  video: { videoId: 'x', title, channelName: 'C' },
});

describe('rageBaitRule', () => {
  it('does not flag neutral titles', () => {
    expect(rageBaitRule.evaluate(ctx('A history of the printing press')).contribution).toBe(0);
    expect(rageBaitRule.evaluate(ctx('Comment apprendre le piano')).contribution).toBe(0);
  });

  it('flags combat verbs (EN)', () => {
    expect(
      rageBaitRule.evaluate(ctx('Ben Shapiro DESTROYS leftist student')).contribution,
    ).toBeGreaterThan(0);
    expect(rageBaitRule.evaluate(ctx('Lawyer humiliates judge')).contribution).toBeGreaterThan(0);
  });

  it('flags combat verbs (FR)', () => {
    expect(
      rageBaitRule.evaluate(ctx('Il détruit son adversaire en direct')).contribution,
    ).toBeGreaterThan(0);
    expect(
      rageBaitRule.evaluate(ctx('Le ministre humilié à la télé')).contribution,
    ).toBeGreaterThan(0);
  });

  it('flags vs/contre confrontation patterns', () => {
    expect(
      rageBaitRule.evaluate(ctx('iPhone vs Android: the ultimate battle')).contribution,
    ).toBeGreaterThan(0);
    expect(
      rageBaitRule.evaluate(ctx('Macron contre Mélenchon: le débat')).contribution,
    ).toBeGreaterThan(0);
  });

  it('flags culture-war terms', () => {
    expect(
      rageBaitRule.evaluate(ctx('How wokeism is destroying gaming')).contribution,
    ).toBeGreaterThan(40);
  });

  it('does not falsely flag word "service" containing "vs"', () => {
    expect(
      rageBaitRule.evaluate(ctx('Customer service tips for small businesses')).contribution,
    ).toBe(0);
  });
});

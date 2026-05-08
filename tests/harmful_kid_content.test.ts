import { describe, it, expect } from 'vitest';
import { harmfulKidContentRule } from '../src/detection/rules/harmful_kid_content';

const ctx = (title: string) => ({
  video: { videoId: 'x', title, channelName: 'C' },
});

describe('harmfulKidContentRule', () => {
  it('flags Elsagate-style kid character + disturbing word', () => {
    expect(
      harmfulKidContentRule.evaluate(ctx('Frozen Elsa pregnant by Spider-Man')).contribution,
    ).toBeGreaterThanOrEqual(60);
    expect(
      harmfulKidContentRule.evaluate(ctx('Peppa Pig murders Daddy Pig')).contribution,
    ).toBeGreaterThanOrEqual(60);
    expect(
      harmfulKidContentRule.evaluate(ctx('Cursed Cocomelon nightmare version')).contribution,
    ).toBeGreaterThanOrEqual(60);
  });

  it('flags named dangerous challenges', () => {
    expect(
      harmfulKidContentRule.evaluate(ctx('Tide pod challenge gone wrong')).contribution,
    ).toBeGreaterThanOrEqual(60);
    expect(
      harmfulKidContentRule.evaluate(ctx('Blackout challenge tutorial')).contribution,
    ).toBeGreaterThanOrEqual(60);
    expect(
      harmfulKidContentRule.evaluate(ctx('Skull breaker challenge compilation')).contribution,
    ).toBeGreaterThanOrEqual(60);
  });

  it('does not flag legitimate kid content', () => {
    expect(
      harmfulKidContentRule.evaluate(ctx('Peppa Pig English full episodes 2026')).contribution,
    ).toBe(0);
    expect(
      harmfulKidContentRule.evaluate(ctx('Bluey full episode "Sleepytime"')).contribution,
    ).toBe(0);
    expect(harmfulKidContentRule.evaluate(ctx('Cocomelon nursery rhymes')).contribution).toBe(0);
  });

  it('suppresses kid+disturbing match in gameplay/canonical contexts', () => {
    // Mario kills Bowser in a speedrun is not Elsagate.
    expect(
      harmfulKidContentRule.evaluate(ctx('Mario kills Bowser speedrun world record')).contribution,
    ).toBe(0);
    expect(
      harmfulKidContentRule.evaluate(ctx('Spider-Man kisses MJ — full movie scene')).contribution,
    ).toBe(0);
  });

  it('does not flag a kid character alone', () => {
    expect(harmfulKidContentRule.evaluate(ctx('Mickey Mouse club episode 1')).contribution).toBe(0);
  });

  it('does not flag a disturbing word alone', () => {
    expect(
      harmfulKidContentRule.evaluate(ctx('Murder mystery dinner — full game')).contribution,
    ).toBe(0);
  });
});

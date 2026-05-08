import { describe, it, expect } from 'vitest';
import { brainrotRule } from '../src/detection/rules/brainrot';

const ctx = (title: string, durationSeconds?: number) => ({
  video: { videoId: 'x', title, channelName: 'C', durationSeconds },
});

describe('brainrotRule', () => {
  it('does nothing without duration info', () => {
    expect(brainrotRule.evaluate(ctx('A normal video')).contribution).toBe(0);
  });

  it('does NOT trigger grey threshold for a 30-60s Short alone', () => {
    // A Short by itself is not brainrot — Veritasium et al. post legit Shorts.
    const c = brainrotRule.evaluate(ctx('something', 45)).contribution;
    expect(c).toBeLessThan(30);
  });

  it('contributes a non-zero signal for <30s ultra-short videos', () => {
    const c = brainrotRule.evaluate(ctx('something', 15)).contribution;
    expect(c).toBeGreaterThan(0);
    expect(c).toBeLessThan(50);
  });

  it('does not flag normal-length videos', () => {
    expect(brainrotRule.evaluate(ctx('A 10-min essay', 600)).contribution).toBe(0);
    expect(brainrotRule.evaluate(ctx('A 1-hour documentary', 3600)).contribution).toBe(0);
  });

  it('flags titles with emoji spam', () => {
    expect(brainrotRule.evaluate(ctx('crazy clip 🔥🔥🔥🔥🔥', 600)).contribution).toBeGreaterThan(
      0,
    );
  });

  it('does not flag titles with a single decorative emoji', () => {
    expect(brainrotRule.evaluate(ctx('My Q3 review 📊', 1200)).contribution).toBe(0);
  });
});

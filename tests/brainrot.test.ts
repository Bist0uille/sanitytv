import { describe, it, expect } from 'vitest';
import { brainrotRule } from '../src/detection/rules/brainrot';

const ctx = (title: string, durationSeconds?: number) => ({
  video: { videoId: 'x', title, channelName: 'C', durationSeconds },
});

describe('brainrotRule', () => {
  it('does nothing without duration info', () => {
    expect(brainrotRule.evaluate(ctx('A normal video')).contribution).toBe(0);
  });

  it('flags 30-60s short-form videos', () => {
    expect(brainrotRule.evaluate(ctx('something', 45)).contribution).toBeGreaterThanOrEqual(50);
  });

  it('strongly flags <30s ultra-short videos', () => {
    expect(brainrotRule.evaluate(ctx('something', 15)).contribution).toBeGreaterThanOrEqual(75);
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

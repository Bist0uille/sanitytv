import { describe, it, expect } from 'vitest';
import { scoreVideo, actionForScore, DEFAULT_THRESHOLDS } from '../src/detection';
import { clickbaitTitleRule } from '../src/detection/rules/clickbait_title';
import type { Rule } from '../src/detection/types';

const fakeVideo = (title: string) => ({
  videoId: 'abc123',
  title,
  channelName: 'TestChannel',
});

describe('scoreVideo', () => {
  const rules: Rule[] = [clickbaitTitleRule];

  it('returns 0 for an empty title', () => {
    const result = scoreVideo(fakeVideo(''), rules);
    expect(result.score).toBe(0);
    expect(result.signals).toHaveLength(0);
  });

  it('keeps clean titles below the grey threshold', () => {
    const cleanTitles = [
      'How do solar panels actually work?',
      "L'histoire fascinante de la mécanique quantique",
      'A short introduction to category theory',
      'Building a compiler from scratch — part 3',
    ];
    for (const title of cleanTitles) {
      const result = scoreVideo(fakeVideo(title), rules);
      expect(result.score, `should be normal: ${title}`).toBeLessThan(DEFAULT_THRESHOLDS.greyAt);
    }
  });

  it('flags obvious clickbait titles above the grey threshold', () => {
    const baitTitles = [
      'YOU WON’T BELIEVE WHAT HAPPENS NEXT!!!',
      'TOP 10 SHOCKING SECRETS 🔥🔥🔥',
      'INCROYABLE !! Voici pourquoi tout le monde se trompe',
    ];
    for (const title of baitTitles) {
      const result = scoreVideo(fakeVideo(title), rules);
      expect(result.score, `should be flagged: ${title}`).toBeGreaterThanOrEqual(
        DEFAULT_THRESHOLDS.greyAt,
      );
    }
  });
});

describe('actionForScore', () => {
  it('maps scores to the 3-level display strategy', () => {
    expect(actionForScore(0, DEFAULT_THRESHOLDS)).toBe('normal');
    expect(actionForScore(29, DEFAULT_THRESHOLDS)).toBe('normal');
    expect(actionForScore(30, DEFAULT_THRESHOLDS)).toBe('grey');
    expect(actionForScore(59, DEFAULT_THRESHOLDS)).toBe('grey');
    expect(actionForScore(60, DEFAULT_THRESHOLDS)).toBe('hide');
    expect(actionForScore(100, DEFAULT_THRESHOLDS)).toBe('hide');
  });
});

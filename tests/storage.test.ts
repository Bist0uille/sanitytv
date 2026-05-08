import { describe, it, expect } from 'vitest';
import {
  thresholdsFromSensitivity,
  isWhitelisted,
  isBlacklisted,
  DEFAULT_SETTINGS,
} from '../src/storage';

describe('thresholdsFromSensitivity', () => {
  it('returns default-like thresholds at sensitivity 50', () => {
    const t = thresholdsFromSensitivity(50);
    expect(t.greyAt).toBe(30);
    expect(t.hideAt).toBe(60);
  });

  it('returns permissive thresholds at sensitivity 0', () => {
    const t = thresholdsFromSensitivity(0);
    expect(t.greyAt).toBe(60);
    expect(t.hideAt).toBe(90);
  });

  it('returns aggressive thresholds at sensitivity 100', () => {
    const t = thresholdsFromSensitivity(100);
    expect(t.greyAt).toBeLessThanOrEqual(5);
    expect(t.hideAt).toBeLessThanOrEqual(30);
  });

  it('clamps out-of-range input', () => {
    expect(thresholdsFromSensitivity(-50).greyAt).toBe(60);
    expect(thresholdsFromSensitivity(200).greyAt).toBeLessThanOrEqual(5);
  });
});

describe('whitelist / blacklist matching', () => {
  it('whitelist is case-insensitive', () => {
    const settings = { ...DEFAULT_SETTINGS, whitelist: ['Veritasium'] };
    expect(isWhitelisted(settings, 'veritasium')).toBe(true);
    expect(isWhitelisted(settings, 'VERITASIUM')).toBe(true);
    expect(isWhitelisted(settings, 'Other')).toBe(false);
  });

  it('blacklist is case-insensitive', () => {
    const settings = { ...DEFAULT_SETTINGS, blacklist: ['Some Channel'] };
    expect(isBlacklisted(settings, 'some channel')).toBe(true);
    expect(isBlacklisted(settings, 'Different')).toBe(false);
  });

  it('returns false on empty lists', () => {
    expect(isWhitelisted(DEFAULT_SETTINGS, 'whatever')).toBe(false);
    expect(isBlacklisted(DEFAULT_SETTINGS, 'whatever')).toBe(false);
  });
});

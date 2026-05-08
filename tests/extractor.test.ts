import { describe, it, expect } from 'vitest';
import { parseDuration, extractVideoId, extractMetadata } from '../src/content/extractor';

describe('parseDuration', () => {
  it('parses m:ss', () => {
    expect(parseDuration('4:32')).toBe(272);
  });

  it('parses h:mm:ss', () => {
    expect(parseDuration('1:02:03')).toBe(3723);
  });

  it('parses single seconds value', () => {
    expect(parseDuration('45')).toBe(45);
  });

  it('returns 30s for SHORTS badge', () => {
    expect(parseDuration('SHORTS')).toBe(30);
  });

  it('returns undefined for empty/invalid input', () => {
    expect(parseDuration('')).toBeUndefined();
    expect(parseDuration('hello')).toBeUndefined();
  });
});

describe('extractVideoId', () => {
  it('parses ?v= URLs', () => {
    expect(extractVideoId('/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('https://www.youtube.com/watch?v=abc-_XYZ123')).toBe('abc-_XYZ123');
  });

  it('parses /shorts/ URLs', () => {
    expect(extractVideoId('/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns undefined for null/non-matching href', () => {
    expect(extractVideoId(null)).toBeUndefined();
    expect(extractVideoId('/feed/trending')).toBeUndefined();
  });
});

describe('extractMetadata', () => {
  it('returns null when no title is found', () => {
    const div = document.createElement('div');
    expect(extractMetadata(div)).toBeNull();
  });

  it('extracts title and channel from a YouTube-like element', () => {
    const html = `
      <ytd-rich-item-renderer>
        <a id="video-title-link" href="/watch?v=dQw4w9WgXcQ" title="Test Video Title"></a>
        <div id="video-title">Test Video Title</div>
        <ytd-channel-name>
          <a>Test Channel</a>
        </ytd-channel-name>
        <ytd-thumbnail-overlay-time-status-renderer>
          <span>10:25</span>
        </ytd-thumbnail-overlay-time-status-renderer>
      </ytd-rich-item-renderer>
    `;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html.trim();
    const el = wrapper.firstElementChild!;

    const meta = extractMetadata(el);
    expect(meta).not.toBeNull();
    expect(meta?.title).toBe('Test Video Title');
    expect(meta?.channelName).toBe('Test Channel');
    expect(meta?.durationSeconds).toBe(625);
    expect(meta?.videoId).toBe('dQw4w9WgXcQ');
  });
});

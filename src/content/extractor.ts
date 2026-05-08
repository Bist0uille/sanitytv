import type { VideoMetadata } from '@/types';

const TITLE_SELECTORS = ['#video-title', 'a#video-title-link', 'h3 a', 'a.yt-formatted-string'];
const CHANNEL_SELECTORS = [
  'ytd-channel-name a',
  '#channel-name a',
  '#text.ytd-channel-name a',
  '.ytd-video-meta-block #channel-name a',
];
const DURATION_SELECTORS = [
  'ytd-thumbnail-overlay-time-status-renderer span',
  '.badge-shape-wiz__text',
  'span.ytd-thumbnail-overlay-time-status-renderer',
];
const VIDEO_LINK_SELECTORS = ['a#video-title-link', 'a#thumbnail', 'a#video-title'];

const VIDEO_ID_RE = /[?&]v=([a-zA-Z0-9_-]{11})/;
const SHORTS_ID_RE = /\/shorts\/([a-zA-Z0-9_-]{11})/;

function querySelectorFirst(root: Element, selectors: readonly string[]): Element | null {
  for (const sel of selectors) {
    const el = root.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function extractText(el: Element | null): string {
  if (!el) return '';
  const fromAttr = (el as HTMLElement).getAttribute?.('title');
  if (fromAttr && fromAttr.trim()) return fromAttr.trim();
  return (el.textContent ?? '').trim();
}

export function parseDuration(text: string): number | undefined {
  if (!text) return undefined;
  const trimmed = text.trim();
  // YouTube short-form badges sometimes show "SHORTS"
  if (/SHORTS?/i.test(trimmed)) return 30;
  // Format hh:mm:ss or mm:ss or m:ss
  const parts = trimmed.split(':').map((p) => Number(p));
  if (parts.some((p) => Number.isNaN(p))) return undefined;
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return undefined;
}

export function extractVideoId(href: string | null): string | undefined {
  if (!href) return undefined;
  const v = href.match(VIDEO_ID_RE);
  if (v) return v[1];
  const s = href.match(SHORTS_ID_RE);
  if (s) return s[1];
  return undefined;
}

export function extractMetadata(element: Element): VideoMetadata | null {
  const titleEl = querySelectorFirst(element, TITLE_SELECTORS);
  const title = extractText(titleEl);
  if (!title) return null;

  const channelEl = querySelectorFirst(element, CHANNEL_SELECTORS);
  const channelName = extractText(channelEl) || 'unknown';

  const durationEl = querySelectorFirst(element, DURATION_SELECTORS);
  const durationSeconds = durationEl ? parseDuration(extractText(durationEl)) : undefined;

  const linkEl = querySelectorFirst(element, VIDEO_LINK_SELECTORS) as HTMLAnchorElement | null;
  const linkHref = linkEl?.getAttribute('href') ?? null;
  const videoId = extractVideoId(linkHref) ?? `nohref-${Date.now()}-${Math.random()}`;

  // Detect Shorts via either:
  // 1. The renderer tag is Shorts-specific (Shorts shelf / lockup), or
  // 2. The PRIMARY link of this card points to /shorts/.
  // We deliberately do NOT scan the entire subtree for /shorts/ links — search
  // result cards often embed unrelated Shorts links elsewhere in their markup.
  const tag = element.tagName.toLowerCase();
  const isShort =
    tag === 'ytm-shorts-lockup-view-model' ||
    tag === 'ytd-reel-item-renderer' ||
    (linkHref?.startsWith('/shorts/') ?? false);

  return {
    videoId,
    title,
    channelName,
    durationSeconds: isShort ? (durationSeconds ?? 30) : durationSeconds,
    isShort,
  };
}

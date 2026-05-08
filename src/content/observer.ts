const VIDEO_SELECTORS = [
  'ytd-rich-item-renderer',
  'ytd-video-renderer',
  'ytd-compact-video-renderer',
  'ytd-grid-video-renderer',
  'ytd-reel-item-renderer',
  'ytm-shorts-lockup-view-model',
];

const COMBINED_SELECTOR = VIDEO_SELECTORS.join(',');

export type VideoCallback = (element: Element) => void;

/**
 * Observes the page for video renderer elements and invokes `onVideo` for each
 * one as it appears. The callback is responsible for its own deduplication
 * (e.g. via a data attribute set after successful processing) — we deliberately
 * do not dedupe here, because YouTube renders the renderer shell *before* its
 * title is populated, and we need the chance to retry once the metadata lands.
 */
export function observeVideos(onVideo: VideoCallback): () => void {
  const visit = (root: ParentNode) => {
    const elements = root.querySelectorAll(COMBINED_SELECTOR);
    for (const el of Array.from(elements)) onVideo(el);
  };

  visit(document);

  let scheduled = false;
  const queue: Node[] = [];

  const flush = () => {
    scheduled = false;
    while (queue.length > 0) {
      const node = queue.shift()!;
      if (!(node instanceof Element)) continue;
      if (node.matches(COMBINED_SELECTOR)) onVideo(node);
      visit(node);
    }
  };

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((n) => queue.push(n));
    }
    if (queue.length > 0 && !scheduled) {
      scheduled = true;
      requestAnimationFrame(flush);
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  return () => observer.disconnect();
}

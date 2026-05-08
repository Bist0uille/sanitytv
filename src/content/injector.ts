import type { ScoredVideo } from '@/types';
import type { DisplayAction } from '@/detection';

const APPLIED_ATTR = 'data-sanitytv';
const REASON_ATTR = 'data-sanitytv-reason';
const STYLE_ID = 'sanitytv-styles';

export const STYLES = `
[${APPLIED_ATTR}="grey"] {
  opacity: 0.35;
  filter: grayscale(0.85);
  transition: opacity 0.2s ease, filter 0.2s ease;
  position: relative;
}
[${APPLIED_ATTR}="grey"]:hover {
  opacity: 0.85;
  filter: grayscale(0.2);
}
[${APPLIED_ATTR}="grey"]::before {
  content: "⚠ " attr(${REASON_ATTR});
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 5;
  background: rgba(0, 0, 0, 0.75);
  color: #ffd34d;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  pointer-events: none;
  max-width: 80%;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
[${APPLIED_ATTR}="hide"] {
  display: none !important;
}

/* When the Hide-all-Shorts toggle is on, also collapse YouTube's
   Shorts shelves themselves — otherwise an empty shelf with a
   "Show more" button stays on top of search results. */
body.sanitytv-no-shorts ytd-reel-shelf-renderer,
body.sanitytv-no-shorts ytd-rich-shelf-renderer[is-shorts],
body.sanitytv-no-shorts ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
body.sanitytv-no-shorts grid-shelf-view-model,
body.sanitytv-no-shorts ytd-shelf-renderer:has([is-shorts]),
body.sanitytv-no-shorts [is-shorts] {
  display: none !important;
}
`;

export function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLES;
  document.head.appendChild(style);
}

export function applyAction(element: Element, action: DisplayAction, scored?: ScoredVideo): void {
  const previous = element.getAttribute(APPLIED_ATTR);
  if (previous === action) return;

  if (action === 'normal') {
    element.removeAttribute(APPLIED_ATTR);
    element.removeAttribute(REASON_ATTR);
    return;
  }

  element.setAttribute(APPLIED_ATTR, action);
  if (scored) {
    const reason =
      scored.signals
        .map((s) => s.kind.replace(/_/g, ' '))
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .slice(0, 2)
        .join(' + ') || `score ${scored.score}`;
    element.setAttribute(REASON_ATTR, reason);
  }
}

export function isAlreadyProcessed(element: Element): boolean {
  return element.hasAttribute(APPLIED_ATTR) || element.hasAttribute('data-sanitytv-seen');
}

export function markSeen(element: Element): void {
  element.setAttribute('data-sanitytv-seen', '1');
}

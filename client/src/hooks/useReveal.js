/**
 * useReveal — fade + rise a section in once, when it first scrolls into view
 * OWNER: Slice C (Vidura)
 *
 * Usage:
 *   const ref = useReveal();
 *   <Box ref={ref} className="bb-observe">…</Box>
 *
 * IntersectionObserver, never a scroll listener: a scroll handler fires on
 * every frame and is the classic way to make a page feel heavy. This fires
 * once per element and then stops observing it.
 *
 * The animation itself lives in index.css (.bb-observe / .bb-in) so it is
 * covered by the global prefers-reduced-motion rule. This hook only
 * toggles a class.
 *
 * ── FAIL OPEN, ALWAYS ────────────────────────────────────────────────
 * `.bb-observe` starts at `opacity: 0`, so the content is hidden until
 * this hook says otherwise. That makes every way the observer can miss a
 * silent content-loss bug, not a missing animation — whole sections of
 * the home page simply never appeared.
 *
 * It can miss for several dull reasons: the element is still zero-height
 * when it is first observed, an ancestor has `overflow: hidden` and has
 * not been laid out yet, images above it shift the layout after the
 * single callback has already run, or — the one that bit us — a
 * threshold high enough that a short block inside a shrunken root never
 * reaches it.
 *
 * So there are three nets under this now, and the content shows if ANY
 * of them catches:
 *   1. threshold 0 — one pixel in view is enough;
 *   2. an immediate geometry check on mount, for anything already on
 *      screen before the observer's first callback;
 *   3. a timer that reveals unconditionally.
 *
 * Net 3 is the important one. An un-animated section is a cosmetic
 * disappointment; an invisible one is a bug the user reports as "the
 * page is broken".
 */
import { useEffect, useRef } from 'react';

/* Long enough that a normal reveal wins the race and animates properly,
   short enough that nobody sits looking at a blank band. */
const FAILSAFE_MS = 1200;

export default function useReveal({ threshold = 0, rootMargin = '0px 0px -40px 0px' } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const show = () => node.classList.add('bb-in');

    /* No observer (a very old browser, or jsdom in a test): show the
       content rather than leaving it invisible forever. */
    if (typeof IntersectionObserver === 'undefined') {
      show();
      return undefined;
    }

    /* Net 2: already on screen at mount. The observer would normally
       catch this on its first callback, but that callback is a frame
       away and the element may be re-laid-out before it arrives. */
    const box = node.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) show();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('bb-in');
            io.unobserve(e.target);   // once, never again
          }
        }
      },
      { threshold, rootMargin },
    );
    io.observe(node);

    /* Net 3: whatever happened above, this section becomes visible. */
    const failsafe = setTimeout(show, FAILSAFE_MS);

    return () => {
      clearTimeout(failsafe);
      io.disconnect();
    };
  }, [threshold, rootMargin]);

  return ref;
}

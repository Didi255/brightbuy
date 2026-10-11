/**
 * ScrollToTop — reset the scroll position on navigation.  OWNER: Slice B
 *
 * A browser keeps the scroll offset across a client-side route change,
 * so following a link from halfway down the home page lands you halfway
 * down the next one — which reads as "the products page opens at the
 * bottom". React Router does not do this for you.
 *
 * Keyed on pathname only, NOT on search: changing a filter rewrites the
 * query string, and yanking the grid back to the top every time someone
 * ticks a brand would be worse than the bug.
 */
import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    /* layout effect, not effect: this runs before paint, so the new page
       is never briefly visible at the old offset. */
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

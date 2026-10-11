/**
 * favourites — the products this browser has hearted
 * OWNER: Slice B
 *
 * localStorage, not the database. There is no `favourite` table in
 * SCHEMA.md and adding one silently would break the rule that five people
 * build against that file. So this is per-browser, never synced, and
 * invisible to the server.
 *
 * Consequence worth knowing: hearts do not follow a customer to another
 * device, and there is no favourites page to open. When a `favourite`
 * table exists, this module is the only thing that changes.
 *
 * Every access is wrapped: storage throws in private mode and with site
 * data blocked, and a thrown heart should never take the grid down.
 */
const KEY = 'bb_favourites';

export function readFavourites() {
  try {
    const raw = localStorage.getItem(KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

export function isFavourite(productId) {
  return readFavourites().includes(productId);
}

/** Flip one product. Returns the new list so callers can re-render. */
export function toggleFavourite(productId) {
  if (!productId) return readFavourites();
  try {
    const now = readFavourites();
    const next = now.includes(productId)
      ? now.filter((id) => id !== productId)
      : [productId, ...now];
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    /* storage unavailable — the heart simply will not stick */
    return readFavourites();
  }
}

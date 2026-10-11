/**
 * recentlyViewed — the last few products this browser opened
 * OWNER: Slice B
 *
 * localStorage, not the database. There is no `recently_viewed` table and
 * adding one for a presentation nicety would be the wrong trade in a
 * project marked on its schema. This is per-browser, never synced, and the
 * UI degrades to showing nothing if storage is unavailable (private mode,
 * blocked site data) — hence the try/catch on every access.
 */
const KEY = 'bb_recently_viewed';
const MAX = 12;

export function readRecent() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function pushRecent(product) {
  if (!product?.productId) return;
  try {
    const slim = {
      productId: product.productId,
      productName: product.productName,
      brand: product.brand,
      imageUrl: product.imageUrl,
      priceFrom: product.priceFrom ?? product.variants?.[0]?.price,
      categories: product.categories,
    };
    const next = [slim, ...readRecent().filter((p) => p.productId !== slim.productId)];
    localStorage.setItem(KEY, JSON.stringify(next.slice(0, MAX)));
  } catch {
    /* storage unavailable — the rail simply will not appear */
  }
}

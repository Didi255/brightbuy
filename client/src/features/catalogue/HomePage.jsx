/**
 * HomePage — BrightBuy landing page
 * OWNER: Slice B (Risandu) — built by Slice C as a starting point
 *
 * Six sections in an alternating rhythm: hero, ticker, left-rail categories,
 * full-bleed scroller, split spotlight, bordered grid, then the newsletter
 * slab above the footer. No two adjacent sections share a shape.
 *
 * Every number and image comes from the API. One fetch of /products and one
 * of /categories feeds the hero field, the category grid, the top-sellers
 * rail and the featured spotlight — the page makes no claim the database
 * cannot support.
 *
 * The page renders full-width (no Container wrapper) — AppShell handles
 * this via the `isFullWidth` layout check on the "/" route.
 */
import { useEffect, useState } from 'react';
import {
  HeroSection,
  CategoryShowcase,
  TopSellingShowcase,
  FeaturedProduct,
  DeliveryBand,
  WhyChooseUs,
  NewsletterCTA,
} from '../../components/ui/HomeUI';
import { api } from '../../api/client';

/** Flatten the category tree to its leaves — products live on the leaves. */
function leaves(nodes, out = []) {
  for (const n of nodes || []) {
    if (!n.children || n.children.length === 0) out.push(n);
    else leaves(n.children, out);
  }
  return out;
}

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState(null);
  /* The row count the API reports, which is not the same thing as how
     many rows this page fetched. The category header prints it, so it
     has to be the real figure. */
  const [totalProducts, setTotalProducts] = useState(null);
  /* The delivery band prints the city count. 21 is a row count,
     so it is read, never typed. */
  const [cities, setCities] = useState([]);

  useEffect(() => {
    let cancelled = false;

    /* allSettled, not all: a slow category tree should not blank the hero.
       Each section renders nothing rather than breaking when its data is
       missing. */
    Promise.allSettled([
      /* The whole catalogue is 44 rows, so one page of 100 costs nothing
         and lets the category tiles show real counts instead of guesses. */
      api.get('/products?pageSize=100'),
      api.get('/categories'),
      api.get('/cities'),
    ]).then(([prod, cats, cityRes]) => {
      if (cancelled) return;

      if (cityRes.status === 'fulfilled') {
        setCities(Array.isArray(cityRes.value) ? cityRes.value : (cityRes.value?.data || []));
      }

      const rows = prod.status === 'fulfilled' ? (prod.value.data || []) : [];
      setProducts(rows);
      if (prod.status === 'fulfilled' && typeof prod.value.total === 'number') {
        setTotalProducts(prod.value.total);
      }

      if (cats.status === 'fulfilled') {
        /* The categories endpoint returns no product count, so count the
           rows we have rather than inventing a figure. Exact, because we
           fetched the whole catalogue above. */
        const tally = new Map();
        for (const p of rows) {
          for (const c of p.categories || []) {
            tally.set(c.categoryName, (tally.get(c.categoryName) || 0) + 1);
          }
        }
        setCategories(
          leaves(cats.value).map((c) => ({ ...c, productCount: tally.get(c.categoryName) || 0 })),
        );
      }

      /* The spotlight is the dearest product we were given — a real choice
         from real data rather than a hardcoded id. */
      if (rows.length) {
        const dearest = [...rows].sort(
          (a, b) => Number(b.priceTo ?? b.priceFrom) - Number(a.priceTo ?? a.priceFrom))[0];
        api.get(`/products/${dearest.productId}`)
          .then((full) => { if (!cancelled) setFeatured(full); })
          .catch(() => {});
      }
    });

    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <HeroSection products={products} />
      <CategoryShowcase
        categories={categories}
        products={products}
        totalProducts={totalProducts ?? undefined}
      />
      {/* Eight, not ten: two clean pages of four at desktop, no stranded
          partial page. See the note in TopSellingShowcase about where
          this ordering actually comes from. */}
      <TopSellingShowcase items={products.slice(0, 8)} />
      <DeliveryBand cities={cities} />
      <FeaturedProduct product={featured} />
      <WhyChooseUs />
      <NewsletterCTA />
    </div>
  );
}

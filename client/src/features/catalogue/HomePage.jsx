/**
 * HomePage — BrightBuy landing page
 * OWNER: Slice B (Risandu) — built by Slice C as a starting point
 *
<<<<<<< HEAD
=======
<<<<<<< HEAD
 * Implements:
 *   - Task B.1: Category tree / showcase, prominent search bar
 *   - Real product showcase wired to GET /products
 *   - Real categories wired to GET /categories
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TextInput, Button, Group, Container, Box, Title, Text, SimpleGrid, Card, Image, Badge } from '@mantine/core';
import { IconSearch, IconDeviceLaptop, IconDeviceMobile, IconHeadphones, IconCpu } from '@tabler/icons-react';
import { api } from '../../api/client';
import { Money } from '../../components/ui';
=======
>>>>>>> dev
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
<<<<<<< HEAD
=======
>>>>>>> 862ef2fbc3e76f976f88869416fb3e599f4d8eb4
>>>>>>> dev
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
<<<<<<< HEAD
=======
<<<<<<< HEAD
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    // Load real categories
    api.get('/categories')
      .then((data) => {
        if (Array.isArray(data)) {
          // Flatten top categories for showcase
          const mapped = data.map((cat) => ({
            name: cat.categoryName,
            categoryId: cat.categoryId,
            icon: IconDeviceLaptop,
            count: cat.children?.length ? `${cat.children.length} sub-categories` : 'Explore',
          }));
          setCategories(mapped);
        }
      })
      .catch((err) => console.error('Error loading categories:', err));

    // Load top products for showcase
    api.get('/products?pageSize=6')
      .then((res) => {
        if (res?.data) {
          const items = res.data.map((p) => ({
            id: p.productId,
            name: p.productName,
            price: `$${p.priceFrom}`,
            image: p.imageUrl,
          }));
          setTopProducts(items);
        }
      })
      .catch((err) => console.error('Error loading top products:', err));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/products');
    }
  };

  return (
    <div>
      {/* ── Search Bar Banner ────────────────────────────────────── */}
      <Box p={16} style={{ backgroundColor: 'var(--mantine-color-gray-1)', borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Container size="md">
          <form onSubmit={handleSearch}>
            <Group justify="center" gap={12}>
              <TextInput
                placeholder="What are you looking for today? (e.g. Laptops, Apple, Audio)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftSection={<IconSearch size={18} />}
                style={{ flex: 1, maxWidth: 500 }}
                radius="md"
              />
              <Button type="submit" radius="md">
                Search Catalogue
              </Button>
            </Group>
          </form>
        </Container>
      </Box>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── Stats Counter Strip ───────────────────────────────────── */}
      <StatsBar />

      {/* ── Top Selling Items (Real Products from API) ─────────────── */}
      <TopSellingShowcase items={topProducts.length ? topProducts : undefined} />

      {/* ── Categories Showcase (Real Categories from API) ─────────── */}
      <CategoryShowcase categories={categories.length ? categories : undefined} />

      {/* ── Trust Badges ──────────────────────────────────────────── */}
      <FeatureStrip />

      {/* ── Why Choose Us ─────────────────────────────────────────── */}
      <WhyChooseUs />

      {/* ── Customer Reviews ──────────────────────────────────────── */}
      <CustomerReviewsShowcase />

      {/* ── Newsletter CTA ────────────────────────────────────────── */}
=======
>>>>>>> dev
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
<<<<<<< HEAD
=======
>>>>>>> 862ef2fbc3e76f976f88869416fb3e599f4d8eb4
>>>>>>> dev
      <NewsletterCTA />
    </div>
  );
}

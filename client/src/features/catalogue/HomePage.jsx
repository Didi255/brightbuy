/**
 * HomePage — BrightBuy landing page
 * OWNER: Slice B (Risandu)
 *
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
import {
  HeroSection,
  StatsBar,
  TopSellingShowcase,
  CategoryShowcase,
  FeatureStrip,
  WhyChooseUs,
  NewsletterCTA,
  CustomerReviewsShowcase,
} from '../../components/ui/HomeUI';

export default function HomePage() {
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
      <NewsletterCTA />
    </div>
  );
}

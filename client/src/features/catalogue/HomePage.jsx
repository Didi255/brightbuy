/**
 * HomePage — BrightBuy landing page
 * OWNER: Slice B (Risandu) — built by Slice C as a starting point
 *
 * Assembles shared UI components from components/ui/HomeUI.jsx into
 * a full scrollable landing page. Slice B can customise this freely:
 *   - Swap the static categories array with real data from GET /categories
 *   - Add featured products section once the catalogue API is ready
 *   - Modify text, ordering, or add new sections
 *
 * The page renders full-width (no Container wrapper) — AppShell handles
 * this via the `isFullWidth` layout check on the "/" route.
 */
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
  return (
    <div>
      {/* ── hero ──────────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── stats counter strip ───────────────────────────────────── */}
      <StatsBar />

      {/* ── top selling items ─────────────────────────────────────── */}
      <TopSellingShowcase />

      {/* ── categories ────────────────────────────────────────────── */}
      {/* Pass real categories from the API once Slice B is ready:
          <CategoryShowcase categories={categoriesFromAPI} />         */}
      <CategoryShowcase />

      {/* ── trust badges ──────────────────────────────────────────── */}
      <FeatureStrip />

      {/* ── why choose us ─────────────────────────────────────────── */}
      <WhyChooseUs />

      {/* ── customer reviews ──────────────────────────────────────── */}
      <CustomerReviewsShowcase />

      {/* ── newsletter CTA ────────────────────────────────────────── */}
      <NewsletterCTA />
    </div>
  );
}

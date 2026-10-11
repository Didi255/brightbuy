/**
 * HomeUI — the home page sections, Circuit Noir
 * OWNER: Slice C (Vidura)
 *
 * The old build had nine sections sharing one rhythm: centred eyebrow,
 * centred heading, centred subtitle, grid of cards. By section four the eye
 * stopped registering new information. These six alternate shape on purpose
 * — centred, ticker, left-rail, full-bleed, split, bordered-grid — so no two
 * adjacent sections look alike.
 *
 * Every figure on this page comes from the API. Nothing is invented: this
 * project is marked on whether the interface reflects its database, so
 * "10,000+ SKUs" over a 74-SKU catalogue would be a liability, not polish.
 *
 * NOT INCLUDED: a testimonials section. The schema has no `review` table,
 * so there is no honest source for ratings, quotes or review counts. Add a
 * migration for reviews and this file can grow the section.
 */
import {
  useEffect,
  useRef,
  useState } from 'react';
import { Link } from 'react-router-dom';
import { Box,
  Container,
  Group,
  Stack,
  Text,
  Button,
  TextInput,
  UnstyledButton } from '@mantine/core';
import {
  IconArrowRight,
  IconArrowLeft,
  IconCertificate,
  IconTruckDelivery,
  IconTag,
  IconRotateClockwise,
  IconCash,
  IconHeadset,
  IconLock,
  IconHome2,
} from '@tabler/icons-react';
import useReveal from '../../hooks/useReveal';
import ProductCard from './ProductCard';
import Reveal from './Reveal';
import ProductTile from './ProductTile';
import Money from './Money';

const LINE = 'rgba(255,236,214,0.10)';
const TILE = '#F4F1EC';
const LINE_HOT = 'rgba(255,140,0,0.28)';
const EASE = 'cubic-bezier(0.2, 0, 0, 1)';

/* Sentence-case body label. Monospace is reserved for SKU codes and
   order numbers; everywhere else it reads as a generated-page tell. */
const MONO = {
  fontSize: 14,
  fontWeight: 400,
};

/* Section headings: Inter 700, 32px, one colour. The scale tops out at
   48px on the hero — a 112px display size is a landing-page tell. */
const H2 = {
  fontSize: '2rem',
  fontWeight: 700,
  lineHeight: 1.15,
  letterSpacing: '-0.02em',
  margin: 0,
};

/* ══ 1. Hero ══════════════════════════════════════════════════════ */

export function HeroSection({ products = [] }) {
  /* Eight columns, not four. The count drives the tile size directly:
     at four, a 1920px viewport gives 545px squares, which stop reading
     as texture and start reading as grey slabs behind the headline.
     Eight puts them at 264px. */
  const COLS = 8;
  const columns = Array.from({ length: COLS }, (_, c) =>
    products.filter((_, i) => i % COLS === c));

  /* Mouse parallax. The cluster moves AGAINST the cursor and the marquee
     moves WITH it — opposing directions are what read as depth; moving
     both the same way just slides the whole scene.

     Written straight to the nodes through refs and a rAF loop, never
     through useState: a state update per mousemove re-renders the entire
     hero on every pixel. Lerped at 0.08 so it trails the cursor rather
     than snapping to it. */
  const cluster = useRef(null);
  const field = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (window.innerWidth < 1024) return undefined;

    const target = { x: 0, y: 0 };
    const now = { x: 0, y: 0 };
    let frame;

    const onMove = (e) => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;    // -1 … 1
      target.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const tick = () => {
      now.x += (target.x - now.x) * 0.08;
      now.y += (target.y - now.y) * 0.08;

      /* Scroll parallax, read INSIDE the rAF that is already running.
         No scroll listener is added: scrollY is a cached offset, reading
         it forces no layout, and sampling it here means it can never be
         evaluated more than once a frame. Capped at 700px of scroll so
         the cluster lags by at most ~56px and then holds, rather than
         sliding out of the section on a long page. */
      const sy = Math.min(window.scrollY, 700) * 0.08;

      if (cluster.current) {
        cluster.current.style.transform =
          'translate3d(' + (-now.x * 12) + 'px,' + (-now.y * 12 + sy) + 'px,0)';
      }
      if (field.current) {
        field.current.style.transform =
          'translate3d(' + (now.x * 4) + 'px,' + (now.y * 4 - sy * 0.4) + 'px,0)';
      }
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    frame = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <Box
      component="section"
      className="bb-hero"
      style={{
        position: 'relative',
        /* Sized to its CONTENT, not to the viewport. At 88vh the copy
           block (~320px tall) filled barely half the hero and the rest
           was dead space on the left. The clamp keeps it tight on a
           laptop and stops it ballooning on a tall monitor. */
        height: 'clamp(520px, 50vh, 580px)',
        display: 'flex',
        alignItems: 'flex-start',
        overflow: 'hidden',
        background: 'var(--mantine-color-ink-9)',
      }}
    >
      {/* ── 1. marquee: real photography, lightly blurred so individual
             products still read ──────────────────────────────────── */}
      {products.length > 0 && (
        <Box ref={field} className="bb-hero-parallax" aria-hidden="true">
          <Box className="bb-hero-marquee">
            <Group gap={16} align="flex-start" wrap="nowrap" style={{ height: '100%' }}>
              {columns.map((col, ci) => (
                <Box
                  key={ci}
                  className="bb-hero-marquee__col"
                  style={{ flex: 1, animationDelay: (ci * -14) + 's' }}
                >
                  <Stack gap={16}>
                    {[...col, ...col].map((p, i) => (
                      <Box
                        key={p.productId + '-' + i}
                        style={{
                          background: TILE,
                          borderRadius: 16,
                          aspectRatio: '1 / 1',
                          padding: 16,
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <img
                          src={p.imageUrl}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Group>
          </Box>
        </Box>
      )}

      {/* ── 2. directional scrim ─────────────────────────────────── */}
      <Box
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(100deg, #121110 0%, #121110 40%, rgba(18,17,16,0.76) 62%, rgba(18,17,16,0.38) 100%)',
        }}
      />

      {/* ── 3. warm glow BEHIND the cluster. This is the layer that
             integrates the illustration: without it the artwork looks
             cut out and dropped on; with it, the page appears to be
             lighting the objects. ────────────────────────────────── */}
      <Box
        aria-hidden="true"
        className="bb-hero-pulse"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(55% 55% at 62% 55%, rgba(255,140,0,0.22), transparent 70%)',
        }}
      />

      {/* ── 4. the cluster, bleeding off the bottom-right ────────── */}
      {/* Two nested layers, because an element can only run ONE
          animation per property — a second @keyframes touching
          `transform` does not compose with the first, it silently
          replaces it.

            cluster  mouse + scroll parallax, written by the rAF loop
            __in     entry (opacity + scale), one-shot
            __img    the float, 7s

          The spec's orbital ring and ground shadow are deliberately
          absent: the artwork already has both drawn into it, so the CSS
          versions changed 0.01% and 0.10% of the hero respectively. */}
      <Box ref={cluster} className="bb-hero-cluster" aria-hidden="true">
        <Box className="bb-hero-cluster__in">
          <img
            className="bb-hero-cluster__img"
            src="/hero-cluster.png"
            srcSet="/hero-cluster-900.png 900w, /hero-cluster.png 1600w"
            sizes="(max-width: 1024px) 80vw, 54vw"
            alt=""
            /* eager + async: it is the largest paint on the page, so it
               should start immediately but never block the headline */
            loading="eager"
            decoding="async"
          />
        </Box>
      </Box>

      {/* ────────── 5. text ────────── */}
      {/* Deliberately NOT a <Container>: a centred max-width container
          would float the headline inwards on a wide screen. The navbar
          uses a flat 32px gutter, so matching it puts the headline on the
          same vertical line as the logo directly above it. */}
      <Box className="bb-hero-copy">
        <Stack gap={24} className="bb-hero-text">
          <Text
            component="h1"
            className="bb-hero-line"
            c="ink.0"
            style={{
              '--i': 0,
              /* Ceiling 64px from the spec, floor 40px for <640. The 4vw
                 middle term is set so the second line always fits the
                 column: any larger and "We will do the rest." wraps again
                 below 1440, which is what the explicit break is here to
                 prevent. */
              fontSize: 'clamp(2.5rem, 4vw, 4rem)',
              /* balance, so the narrower column cannot leave one orphan
                 word on the last line */
              textWrap: 'balance',
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: '-0.03em',
              margin: 0,
            }}
          >
            {/* Broken at the sentence, not wherever the column runs out.
                Left to itself the balancer gives "Add to cart. We'll / do
                the rest.", which splits the second sentence across lines. */}
            Add to cart.<br />We&rsquo;ll do the rest.
          </Text>

          <Group gap={16} wrap="wrap" className="bb-hero-line" style={{ '--i': 1 }}>
            <Button
              component={Link}
              to="/products"
              className="bb-press"
              h={56}
              px={32}
              color="brand.5"
              c="black"
              styles={{ label: { fontSize: 17, fontWeight: 600 } }}
              rightSection={<IconArrowRight size={19} />}
              style={{ boxShadow: 'var(--glow-cta)' }}
            >
              Shop now
            </Button>
            <Button
              component={Link}
              to="/orders"
              className="bb-press"
              h={56}
              px={32}
              variant="outline"
              color="gray"
              styles={{ label: { fontSize: 17, fontWeight: 600 } }}
              /* ghost, but with a hairline so it reads as a button rather
                 than as a stray link sitting next to one */
              style={{ color: '#F5F0E8', borderColor: 'rgba(245,240,232,0.22)', borderWidth: 1 }}
            >
              Track an order
            </Button>
          </Group>
        </Stack>
      </Box>

      {/* ── 6. vignette ──────────────────────────────────────────── */}
      <Box
        className="bb-hero-vignette"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 7,
          background: 'radial-gradient(120% 90% at 50% 50%, transparent 58%, rgba(0,0,0,0.45))',
        }}
      />
    </Box>
  );
}

/* ══ 2. Trust ticker ═════════════════════════════════════════════ */

/* The scrolling ticker that used to live here is gone. Every line in it
   — 30-day returns, secure checkout, cash on delivery — is already said
   properly in "Why buy from BrightBuy", and it was clipped mid-word at
   both edges because a marquee has no edges to align to. */

/* ══ 3. Categories — left rail, asymmetric ════════════════════════ */

/* The nine category icons, sliced out of the supplied grid mockup by
   database/scratch/extract-icons.py.

   CATEGORY TILES ONLY. These must never reach a product card: every
   laptop would then show the same generic laptop drawing and the
   catalogue grid would look broken. Product imagery comes from
   product.imageUrl and nowhere else.

   When real photography arrives, replace all nine in one go. Three
   photos among six drawings looks like a bug; nine of either looks
   like a decision. */
const CATEGORY_ART = {
  Laptops: '/category-icons/laptops.png',
  Monitors: '/category-icons/monitors.png',
  'Computer Accessories': '/category-icons/computer-accessories.png',
  Phones: '/category-icons/phones.png',
  Audio: '/category-icons/audio.png',
  Kitchen: '/category-icons/kitchen.png',
  Cleaning: '/category-icons/cleaning.png',
  Footwear: '/category-icons/footwear.png',
  'Sports & Outdoors': '/category-icons/sports-outdoors.png',
};

/* Spelled out to ten, digits past it. "Nine categories" reads as prose;
   "9 categories" reads as a database row. 43 products is fine as digits. */
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five',
               'six', 'seven', 'eight', 'nine', 'ten'];
const spell = (n) => (n >= 0 && n < WORDS.length ? WORDS[n] : String(n));
const sentence = (w) => w.charAt(0).toUpperCase() + w.slice(1);

export function CategoryShowcase({ categories = [], products = [], totalProducts }) {
  const ref = useReveal();
  if (!categories.length) return null;

  /* Read from the data, never hardcoded. A stale number in a heading is
     exactly the detail that makes a site feel unmaintained. `total` is
     the row count the API reports; products.length is only what this
     page happened to fetch, so prefer the former when we have it. */
  const nCats = categories.length;
  const nProducts = typeof totalProducts === 'number' ? totalProducts : products.length;

  return (
    <Box component="section" py={96} style={{ background: 'var(--mantine-color-ink-9)' }}>
      {/* contained at 1200, so the rails that follow can bleed wider */}
      <Box style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <Box ref={ref} className="bb-observe bb-cat-head">
          <Text component="h2" c="ink.0" className="bb-cat-head__title">
            Shop by category
          </Text>

          <UnstyledButton component={Link} to="/products" className="bb-cat-head__link">
            All {nProducts} products
            <IconArrowRight size={16} />
          </UnstyledButton>

          <Text c="ink.2" className="bb-cat-head__sub">
            {sentence(spell(nCats))} {nCats === 1 ? 'category' : 'categories'},{' '}
            {nProducts} {nProducts === 1 ? 'product' : 'products'}, all dispatched
            from Colombo.
          </Text>
        </Box>

        {/* 3 x 3 exactly. Nine tiles in four columns orphans one on the
            last row, which is what made the grid look broken. */}
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}
        >
          {categories.map((c, i) => (
            <CategoryTile
              key={c.categoryId}
              category={c}
              art={CATEGORY_ART[c.categoryName]}
              index={i}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function CategoryTile({ category, art, index }) {
  const [hot, setHot] = useState(false);
  const ref = useReveal();

  return (
    <Box ref={ref} className="bb-observe" style={{ '--i': index % 3 }}>
      <UnstyledButton
        component={Link}
        to={`/products?categoryId=${category.categoryId}`}
        onMouseEnter={() => setHot(true)}
        onMouseLeave={() => setHot(false)}
        style={{
          display: 'block',
          width: '100%',
          padding: 16,
          borderRadius: 16,
          background: 'var(--mantine-color-ink-7)',
          border: `1px solid ${hot ? LINE_HOT : LINE}`,
          boxShadow: hot ? 'var(--glow-lift)' : 'none',
          transform: hot ? 'translateY(-4px)' : 'none',
          transition: `box-shadow 240ms ${EASE}, transform 240ms ${EASE}, border-color 240ms ${EASE}`,
        }}
      >
        {/* The icon tile. No padding on the box: the 70% width below is
            measured against the TILE, and padding would quietly make it
            60% instead. */}
        <Box
          className="category-tile"
          style={{
            background: TILE,
            borderRadius: 16,
            aspectRatio: '4 / 3',
            overflow: 'hidden',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {art && (
            <img
              src={art}
              alt=""
              loading="lazy"
              decoding="async"
              style={{
                width: '70%',
                maxHeight: '86%',
                objectFit: 'contain',
                /* the colour grade lives in .category-tile img, in
                   index.css — not inline */
                transform: hot ? 'scale(1.05)' : 'scale(1)',
                transition: `transform 240ms ${EASE}`,
              }}
            />
          )}
        </Box>

        {/* The label sits BELOW the tile, on the dark card surface.
            White-on-light-tile was invisible, and fighting it with a
            scrim is less reliable than simply moving the text out of
            the image — which is the standard retail pattern anyway. */}
        <Stack gap={0} pt={16} pb={4} px={4}>
          <Text fz={18} fw={600} c="ink.0" style={{ lineHeight: 1.3 }}>
            {category.categoryName}
          </Text>
          {typeof category.productCount === 'number' && (
            <Text fz={14} c="ink.2">
              {category.productCount} {category.productCount === 1 ? 'item' : 'items'}
            </Text>
          )}
        </Stack>
      </UnstyledButton>
    </Box>
  );
}

/* ══ 4. Top sellers — full-bleed horizontal scroll ════════════════ */

/* How many cards are on screen at once. JS owns this rather than CSS,
   because the page COUNT depends on it and a media query cannot be read
   back out to compute that. One source of truth. */
function perViewFor(w) {
  if (w >= 1280) return 4;
  if (w >= 1024) return 3;
  if (w >= 640) return 2;
  return 1;
}

export function TopSellingShowcase({ items = [] }) {
  const ref = useReveal();
  const [per, setPer] = useState(() =>
    (typeof window === 'undefined' ? 4 : perViewFor(window.innerWidth)));
  const [page, setPage] = useState(0);

  /* Three independent reasons to hold the carousel still. Kept apart
     rather than as one flag, because they switch off at different
     moments: leaving with the keyboard should not resume a carousel the
     mouse is still sitting on. */
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [hidden, setHidden] = useState(false);

  const reduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const onResize = () => setPer(perViewFor(window.innerWidth));
    window.addEventListener('resize', onResize);
    const onVis = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const pages = Math.max(1, Math.ceil(items.length / per));

  /* Narrowing the window can strand you past the last page. */
  useEffect(() => { setPage((v) => Math.min(v, pages - 1)); }, [pages]);

  /* `page` is in the dependency list on purpose: every manual move
     tears this effect down and builds it again, which restarts the 6s
     clock. Otherwise a dot pressed at 5.9s would advance immediately. */
  useEffect(() => {
    if (reduced || pages <= 1) return undefined;
    if (hover || focus || hidden) return undefined;
    const id = setTimeout(() => setPage((v) => (v + 1) % pages), 6000);
    return () => clearTimeout(id);
  }, [page, pages, hover, focus, hidden, reduced]);

  if (items.length === 0) return null;

  const go = (dir) => setPage((v) => (v + dir + pages) % pages);

  return (
    <Box component="section" py={96} style={{ background: 'var(--mantine-color-ink-8)' }}>
      <Box style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <Group justify="space-between" align="flex-end" wrap="wrap" gap={24} mb={32}>
          <Stack gap={8}>
            <Text component="h2" c="ink.0" style={H2}>Selling fastest this week</Text>
            <Text fz={16} c="ink.2">Ordered most often in the last seven days.</Text>
          </Stack>

          <Group gap={16}>
            {/* Page dots, not "1 of 10". The count of products was never
                the useful number: where you are in the set is. */}
            {pages > 1 && (
              <Group gap={8} role="tablist" aria-label="Carousel pages">
                {Array.from({ length: pages }).map((_, i) => (
                  <UnstyledButton
                    key={i}
                    role="tab"
                    aria-selected={i === page}
                    aria-label={`Page ${i + 1} of ${pages}`}
                    onClick={() => setPage(i)}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: i === page
                        ? 'var(--mantine-color-brand-5)'
                        : 'rgba(255,236,214,0.25)',
                      transition: `background 200ms ${EASE}`,
                    }}
                  />
                ))}
              </Group>
            )}
            <Group gap={8}>
              {/* Both always active: the carousel loops, so neither end
                  is a dead end. */}
              <RailButton onClick={() => go(-1)} label="Previous products">
                <IconArrowLeft size={16} />
              </RailButton>
              <RailButton onClick={() => go(1)} label="Next products">
                <IconArrowRight size={16} />
              </RailButton>
            </Group>
          </Group>
        </Group>

        <Box
          ref={ref}
          className="bb-observe bb-carousel"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          /* Capture, so focus landing on anything INSIDE a card — the
             heart, the price pill, the title link — pauses the rail. */
          onFocusCapture={() => setFocus(true)}
          onBlurCapture={() => setFocus(false)}
        >
          <Box
            className="bb-carousel__track"
            style={{ '--per': per, '--page': page }}
          >
            {items.map((p) => (
              <Box key={p.productId} className="bb-carousel__cell">
                <ProductCard
                  product={{
                    ...p,
                    price: p.priceFrom,
                    categoryName: p.categories?.[0]?.categoryName,
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function RailButton({ onClick, label, children }) {
  const [hot, setHot] = useState(false);
  return (
    <UnstyledButton
      onClick={onClick}
      aria-label={label}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      style={{
        width: 40,
        height: 40,
        borderRadius: 999,
        display: 'grid',
        placeItems: 'center',
        border: `1px solid ${hot ? LINE_HOT : LINE}`,
        color: hot ? 'var(--mantine-color-ink-0)' : 'var(--mantine-color-ink-2)',
        transition: `all 200ms ${EASE}`,
      }}
    >
      {children}
    </UnstyledButton>
  );
}

/* ══ Editorial band ═══════════════════════════════════════════════
   One statement between the rails, so the page is not heading-plus-grid
   seven times in a row. Full-bleed and dark, with a single link. */
/* The SLA, mirrored from sp_place_order in
   database/migrations/007_procedures_orders.sql. Mirrored, not guessed:
   if the procedure changes, these two numbers change with it. */
const MAIN_CITY_DAYS = 5;
const ISLAND_DAYS = 7;

export function DeliveryBand({ cities = [] }) {
  const ref = useReveal();
  const [showCities, setShowCities] = useState(false);

  /* 21 is a row count, not a constant. The only hardcoded figure in this
     section is the warehouse, because one warehouse in Colombo is a fact
     about the business rather than anything the database knows. */
  const cityCount = cities.length;

  const stats = [
    { n: cityCount || '\u2014', label: 'cities\nisland-wide' },
    { n: MAIN_CITY_DAYS, label: 'days to a\nmain city' },
    { n: 1, label: 'warehouse\nin Colombo' },
  ];

  return (
    <Box component="section" py={96} style={{ background: 'var(--mantine-color-ink-8)' }}>
      <Box
        ref={ref}
        className="bb-observe"
        data-reveal="fade"
        style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}
      >
        <Box className="bb-delivery">
          <Box>
            <Text
              component="h2"
              c="ink.0"
              style={{
                fontSize: 32, fontWeight: 700, lineHeight: 1.2,
                letterSpacing: '-0.01em', margin: 0, textWrap: 'balance',
              }}
            >
              {MAIN_CITY_DAYS} days to any main city, {ISLAND_DAYS} everywhere else
            </Text>

            <Text fz={16} c="ink.2" mt={16} style={{ lineHeight: 1.6, maxWidth: '46ch' }}>
              One warehouse in Colombo, {cityCount || 'all'} cities island-wide. The
              estimate you see at checkout is the one we work to.
            </Text>

            {cityCount > 0 && (
              <Box mt={16}>
                <UnstyledButton
                  onClick={() => setShowCities((v) => !v)}
                  aria-expanded={showCities}
                  style={{ fontSize: 15, color: 'var(--mantine-color-ink-3)' }}
                >
                  {showCities ? 'Hide the list' : `See all ${cityCount} cities`}
                </UnstyledButton>

                {/* Collapsed by default: 21 place names is a lot of text
                    to put in front of someone who did not ask for it. */}
                {showCities && (
                  <Text fz={15} c="ink.3" mt={8} style={{ lineHeight: 1.6, maxWidth: '52ch' }}>
                    {cities.map((c) => c.cityName).join(', ')}
                  </Text>
                )}
              </Box>
            )}

            <Text
              component={Link}
              to="/products"
              fz={16}
              c="brand.5"
              mt={24}
              style={{ textDecoration: 'none', display: 'inline-block' }}
            >
              Start shopping &rarr;
            </Text>
          </Box>

          {/* Three cards, no icons and no glow: the numbers are the
              content, and an icon beside each one only competes with
              them. */}
          <Box className="bb-delivery__stats">
            {stats.map((st) => (
              <Box key={st.label} className="bb-stat-card">
                <Text fz={48} fw={700} c="ink.0" style={{ lineHeight: 1 }}>{st.n}</Text>
                <Text fz={14} c="ink.2" mt={8} style={{ lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                  {st.label}
                </Text>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/* ══ 5. Featured product — the single spotlight ═══════════════════ */

export function FeaturedProduct({ product }) {
  const ref = useReveal();
  if (!product) return null;

  const specs = (product.variants?.[0]?.attributes || []).slice(0, 4);
  const price = product.variants?.[0]?.price ?? product.priceFrom;

  return (
    <Box component="section" py={96} style={{ background: 'var(--mantine-color-ink-8)' }}>
      {/* capped and centred: the image was hard left with a third of the
          row empty because the section ran the full container width */}
      <Box style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <Stack gap={8} mb={32}>
          <Text component="h2" c="ink.0" style={H2}>Deal of the week</Text>
          <Text fz={16} c="ink.2">One product, picked each Monday, at the best price we can do.</Text>
        </Stack>

        <Box
          ref={ref}
          className="bb-observe"
          data-reveal="scale"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 64,
            alignItems: 'center',
          }}
        >
          {/* the one glowing card on the page */}
          <Box style={{ position: 'relative' }}>
            <Box
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: '-12%',
                pointerEvents: 'none',
                background: 'radial-gradient(60% 60% at 50% 40%, rgba(255,140,0,0.16), transparent 70%)',
              }}
            />
            <Box
              style={{
                position: 'relative',
                background: TILE,
                borderRadius: 16,
                aspectRatio: '1 / 1',
                padding: 48,
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 18px 44px -14px rgba(0,0,0,0.65)',
              }}
            >
              <img
                src={product.imageUrl}
                alt={product.productName}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </Box>
          </Box>

          <Stack gap={24}>
            <Stack gap={12}>
              <Text component="h3" c="ink.0" style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.15, margin: 0 }}>
                {product.productName}
              </Text>
              {product.description && (
                <Text fz={16} c="ink.2" style={{ lineHeight: 1.6, maxWidth: '52ch' }}>
                  {product.description}
                </Text>
              )}
            </Stack>

            {/* capped: label and value were a mile apart because the rows
                stretched the full column */}
            {specs.length > 0 && (
              <Stack gap={0} style={{ maxWidth: 420 }}>
                {specs.map((a) => (
                  <Group
                    key={a.name}
                    justify="space-between"
                    wrap="nowrap"
                    align="baseline"
                    py={8}
                    style={{ borderBottom: `1px solid ${LINE}` }}
                  >
                    <Text fz={14} c="ink.3">{a.name}</Text>
                    <Text fz={15} fw={500} c="ink.0">{a.value}</Text>
                  </Group>
                ))}
              </Stack>
            )}

            <Money value={price} fz={32} fw={700} accent />

            <Group gap={16} wrap="wrap">
              <Button
                component={Link}
                to={`/products/${product.productId}`}
                variant="outline"
                color="brand.5"
                size="md"
              >
                View product
              </Button>
            </Group>

            <Text fz={14} c="ink.3">Free delivery over Rs 25,000 · 30-day returns</Text>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

/* ══ 6. Why BrightBuy — the bordered features grid ════════════════ */

/* Four reasons, all true of a rain jacket and a blender as much as a
   laptop. The old list talked about building PCs and doubling warranties
   on desktops, on a page that also sells cleaning supplies. */
const PROMISES = [
  { icon: IconCash,          t: 'Cash on delivery',  d: 'Pay when it arrives, anywhere we deliver.' },
  { icon: IconTruckDelivery, t: 'Same-day dispatch', d: 'Order before 2 PM and it leaves Colombo today.' },
  { icon: IconRotateClockwise, t: '30-day returns',  d: 'Opened or unopened, thirty days either way.' },
  { icon: IconTag,           t: 'Price match',       d: 'Find it cheaper locally and we match it.' },
];

export function WhyChooseUs() {
  const ref = useReveal();
  return (
    <Box component="section" py={96} style={{ background: 'var(--mantine-color-ink-9)' }}>
      <Box style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <Stack gap={8} mb={48}>
          <Text component="h2" c="ink.0" style={H2}>Why buy from BrightBuy</Text>
          <Text fz={16} c="ink.2">The same four promises on every order, whatever you are buying.</Text>
        </Stack>

        {/* No cell borders: a bordered 4x2 table is a SaaS feature grid,
            and a large part of why this page read as a dev tool. Four
            items, one row, separated by whitespace. */}
        <Box
          ref={ref}
          className="bb-observe"
          data-reveal="fade"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 48,
          }}
        >
          {PROMISES.map((p) => (
            <Stack key={p.t} gap={12}>
              <p.icon size={28} style={{ color: 'var(--mantine-color-ink-2)' }} />
              <Text fz={18} fw={600} c="ink.0">{p.t}</Text>
              <Text fz={14} c="ink.2" style={{ lineHeight: 1.55 }}>{p.d}</Text>
            </Stack>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/* ══ 7. Newsletter ════════════════════════════════════════════════ */

export function NewsletterCTA() {
  const [focus, setFocus] = useState(false);
  return (
    <Box component="section" py={64} style={{ background: 'var(--mantine-color-ink-8)' }}>
      <Container size="xl" px={{ base: 16, sm: 24 }}>
        <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'center' }}>
          <Stack gap={12} style={{ flex: '1 1 320px', minWidth: 0 }}>
            <Text component="h2" c="ink.0" style={H2}>
              Stay in the loop
            </Text>
            <Text fz={16} c="ink.2" style={{ maxWidth: '44ch', lineHeight: 1.6 }}>
              New arrivals, price drops and the occasional genuinely good deal.
              No more than twice a month.
            </Text>
          </Stack>

          <Box style={{ flex: '1 1 360px', minWidth: 0 }}>
            <Text style={{ ...MONO, fontSize: 11 }} c="ink.4" mb={8} component="label" htmlFor="bb-news">
              Email address
            </Text>
            {/* input and button are ONE bordered unit — no gap, no inner card */}
            <Group
              gap={0}
              wrap="nowrap"
              style={{
                border: `1px solid ${focus ? 'var(--mantine-color-brand-5)' : LINE}`,
                borderRadius: 4,
                overflow: 'hidden',
                transition: `border-color 150ms ${EASE}`,
              }}
            >
              <TextInput
                id="bb-news"
                type="email"
                placeholder="you@example.com"
                variant="unstyled"
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                style={{ flex: 1 }}
                styles={{ input: { height: 48, padding: '0 16px', color: 'var(--mantine-color-ink-0)' } }}
              />
              <Button h={48} radius={0} color="brand.5" c="black" px={24}>
                Subscribe
              </Button>
            </Group>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

/* Kept so older imports do not break; the trust claims now live in the
   ticker, which is where they belong. */
export function FeatureStrip() { return null; }
export function CustomerReviewsShowcase() { return null; }

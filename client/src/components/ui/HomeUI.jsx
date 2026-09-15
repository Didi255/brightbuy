/**
 * HomeUI — All home-page UI components in one file
 * OWNER: Slice C (Vidura)
 *
 * Contains:
 *   useScrollReveal  — Intersection Observer hook for scroll animations
 *   useCountUp       — Animated number counter hook
 *   HeroSection      — Full-width dark hero with CTAs
 *   StatsBar         — Animated statistics counter strip
 *   CategoryShowcase — Category card grid with scroll-reveal
 *   FeatureStrip     — Trust badges / value props (dark section)
 *   WhyChooseUs      — "Why BrightBuy?" value cards
 *   NewsletterCTA    — Email signup call-to-action
 *
 * All components use CSS classes from index.css (bb-* namespace).
 * Slice B can import these into features/catalogue/HomePage.jsx
 * and pass real data via props once the catalogue API is ready.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Carousel } from '@mantine/carousel';
import Autoplay from 'embla-carousel-autoplay';
import '@mantine/carousel/styles.css';
import {
  IconSparkles,
  IconArrowRight,
  IconCategory,
  IconDeviceLaptop,
  IconHeadphones,
  IconDeviceMobile,
  IconCamera,
  IconDeviceGamepad2,
  IconSmartHome,
  IconDeviceWatch,
  IconCpu,
  IconTruckDelivery,
  IconShieldCheck,
  IconRotateClockwise,
  IconHeadset,
  IconBolt,
  IconCertificate,
  IconStar,
  IconUsers,
  IconHeart,
  IconPhoto,
} from '@tabler/icons-react';

/* ═══════════════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════════════ */

/**
 * useScrollReveal — adds the `bb-scroll-reveal--visible` class when
 * the element enters the viewport. Attach the returned ref to any
 * element that has `className="bb-scroll-reveal"`.
 *
 * @param {{ threshold?: number, rootMargin?: string }} opts
 * @returns {{ ref: React.RefObject, isVisible: boolean }}
 */
export function useScrollReveal({ threshold = 0.15, rootMargin = '0px 0px -40px 0px' } = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el); // reveal only once
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, isVisible };
}

/**
 * useCountUp — animates a number from 0 to `end` over `duration` ms
 * once `start` flips to true.
 */
export function useCountUp(end, start, duration = 1800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    let raf;
    const t0 = performance.now();

    const tick = (now) => {
      const elapsed = now - t0;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * end));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, start, duration]);

  return value;
}

/* ═══════════════════════════════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════════════════════════════ */

/** Decorative category cards shown on the right side of the hero */
const heroVisualItems = [
  { icon: IconDeviceLaptop,   label: 'Laptops',      bg: 'rgba(0, 102, 255, 0.15)', color: '#66a3ff' },
  { icon: IconDeviceMobile,   label: 'Smartphones',  bg: 'rgba(255, 140, 0, 0.15)', color: '#ffa333' },
  { icon: IconHeadphones,     label: 'Audio',        bg: 'rgba(0, 200, 150, 0.15)', color: '#00c896' },
  { icon: IconDeviceGamepad2, label: 'Gaming',       bg: 'rgba(180, 80, 255, 0.15)', color: '#b450ff' },
];

export function HeroSection() {
  return (
    <section className="bb-hero" id="bb-hero">
      <div className="bb-hero__inner">
        {/* left — content */}
        <div className="bb-hero__content">
          <div className="bb-hero__badge">
            <IconSparkles size={15} />
            New Arrivals — 2026 Collection
          </div>

          <h1 className="bb-hero__title">
            Power Up Your<br /><span>Digital World</span>
          </h1>
          <p style={{
            fontFamily: '"Playfair Display", "Georgia", serif',
            fontStyle: 'italic',
            fontWeight: 'bold',
            fontSize: '1.4rem',
            color: 'var(--bb-text-base)',
            marginTop: '12px',
            marginBottom: '36px',
            letterSpacing: '0.5px'
          }}>
            with Bright<span style={{ color: '#ff8c00' }}>Buy</span>
          </p>


          <div className="bb-hero__actions">
            <Link to="/products" className="bb-hero__btn bb-hero__btn--primary">
              Shop Now <IconArrowRight size={18} />
            </Link>
            <Link to="/products" className="bb-hero__btn bb-hero__btn--outline">
              <IconCategory size={18} />
              Browse Categories
            </Link>
          </div>
        </div>

        {/* right — empty column to show the background image */}
        <div className="bb-hero__visual"></div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STATS BAR  (animated count-up)
   ═══════════════════════════════════════════════════════════════════ */

const statsData = [
  { value: 10000, suffix: '+',  label: 'Products Available' },
  { value: 4,     suffix: '.8★', label: 'Average Rating', decimal: true },
  { value: 500,   suffix: '+',  label: 'Brands We Carry' },
  { value: 25000, suffix: '+',  label: 'Happy Customers' },
];

function StatItem({ data, visible }) {
  const count = useCountUp(data.value, visible);
  const display = data.decimal
    ? `${count}`
    : count >= 1000
      ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}K`
      : `${count}`;

  return (
    <div className="bb-stats__item">
      <div className="bb-stats__number">
        {display}<span>{data.suffix}</span>
      </div>
      <div className="bb-stats__label">{data.label}</div>
    </div>
  );
}

export function StatsBar() {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 });

  return (
    <div className="bb-stats" ref={ref}>
      <div className="bb-stats__inner">
        {statsData.map((stat) => (
          <StatItem key={stat.label} data={stat} visible={isVisible} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TOP SELLING SHOWCASE
   ═══════════════════════════════════════════════════════════════════ */

const topSellingPlaceholder = [
  { id: 1, name: 'Top Seller 1', price: '$299.99' },
  { id: 2, name: 'Top Seller 2', price: '$149.50' },
  { id: 3, name: 'Top Seller 3', price: '$89.00' },
  { id: 4, name: 'Top Seller 4', price: '$499.00' },
  { id: 5, name: 'Top Seller 5', price: '$59.99' },
  { id: 6, name: 'Top Seller 6', price: '$1,299.00' },
];

export function TopSellingShowcase({ items = topSellingPlaceholder }) {
  const autoplay = useRef(Autoplay({ delay: 3500, stopOnInteraction: false }));
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  return (
    <section className="bb-section bb-section--alt">
      <div className="bb-section__inner" ref={ref}>
        <div className={`bb-section__header bb-scroll-reveal ${isVisible ? 'bb-scroll-reveal--visible' : ''}`}>
          <div className="bb-section__overline">
            <IconStar size={15} /> Trending Right Now
          </div>
          <h2 className="bb-section__title">Top Selling Items</h2>
          <p className="bb-section__desc">
            Discover the most popular tech our customers are buying right now.
          </p>
        </div>

        <div className={`bb-scroll-reveal bb-delay-2 ${isVisible ? 'bb-scroll-reveal--visible' : ''}`}>
          <Carousel
            withIndicators
            height={320}
            slideSize={{ base: '100%', sm: '50%', md: '33.333333%', lg: '25%' }}
            slideGap={{ base: 'md', sm: 'lg' }}
            loop
            align="start"
            plugins={[autoplay.current]}
            styles={{
              indicator: {
                width: 12,
                height: 4,
                transition: 'width 250ms ease',
                '&[data-active]': { width: 40, backgroundColor: '#0066ff' }
              }
            }}
          >
            {items.map((item) => (
              <Carousel.Slide key={item.id}>
                <div style={{ padding: '32px 20px', height: '100%' }}>
                  <div 
                    className="bb-category-card" 
                    style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 24, cursor: 'default' }}
                  >
                  <div style={{ flex: 1, background: 'var(--bb-bg-alt)', borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 140, boxShadow: 'inset 2px 2px 5px var(--bb-shadow-dark), inset -2px -2px 5px var(--bb-shadow-highlight)' }}>
                      <IconPhoto size={48} color="var(--bb-text-muted)" />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--bb-text-base)', marginBottom: 4 }}>{item.name}</div>
                    <div style={{ color: '#ff8c00', fontWeight: 800 }}>{item.price}</div>
                  </div>
                </div>
              </Carousel.Slide>
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CATEGORY SHOWCASE
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Default categories — Slice B can override by passing a `categories` prop.
 * Each item needs: { name, icon, count }
 */
const defaultCategories = [
  { name: 'Laptops & PCs',   icon: IconDeviceLaptop,   count: 48 },
  { name: 'Smartphones',     icon: IconDeviceMobile,   count: 35 },
  { name: 'Audio',           icon: IconHeadphones,      count: 27 },
  { name: 'Cameras',         icon: IconCamera,          count: 18 },
  { name: 'Gaming',          icon: IconDeviceGamepad2,  count: 32 },
  { name: 'Smart Home',      icon: IconSmartHome,       count: 22 },
  { name: 'Wearables',       icon: IconDeviceWatch,     count: 15 },
  { name: 'Components',      icon: IconCpu,             count: 40 },
];

export function CategoryShowcase({ categories = defaultCategories }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  return (
    <section className="bb-section bb-section--alt">
      <div className="bb-section__inner" ref={ref}>
        <div
          className={`bb-section__header bb-scroll-reveal ${isVisible ? 'bb-scroll-reveal--visible' : ''}`}
        >
          <div className="bb-section__overline">
            <IconCategory size={15} /> Shop by Category
          </div>
          <h2 className="bb-section__title">Find Exactly What You Need</h2>
          <p className="bb-section__desc">
            Browse our wide range of electronics categories, from everyday
            essentials to cutting-edge tech.
          </p>
        </div>

        <div className="bb-categories">
          {categories.map((cat, i) => {
            const Icon = cat.icon || IconCpu;
            const directionClass = i < 4 ? 'bb-slide-left' : 'bb-slide-right';
            const delayClass = `bb-delay-${(i % 4) + 1}`;
            return (
              <Link
                to="/products"
                key={cat.name}
                className={`bb-category-card ${directionClass} ${delayClass} ${isVisible ? 'bb-scroll-reveal--visible' : ''}`}
              >
                <div className="bb-category-card__icon">
                  <Icon size={32} stroke={1.6} />
                </div>
                <div className="bb-category-card__name">{cat.name}</div>
                <div className="bb-category-card__count">{cat.count} products</div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FEATURE STRIP  (trust badges — dark section)
   ═══════════════════════════════════════════════════════════════════ */

const featureData = [
  {
    icon: IconTruckDelivery,
    title: 'Free Shipping',
    desc: 'On orders over $100 across Texas',
    bg: 'rgba(0, 102, 255, 0.15)',
    color: '#66a3ff',
  },
  {
    icon: IconShieldCheck,
    title: 'Secure Checkout',
    desc: 'Your payment information is always safe',
    bg: 'rgba(0, 200, 150, 0.15)',
    color: '#00c896',
  },
  {
    icon: IconRotateClockwise,
    title: '30-Day Returns',
    desc: 'Easy returns & hassle-free refunds',
    bg: 'rgba(255, 140, 0, 0.15)',
    color: '#ffa333',
  },
  {
    icon: IconHeadset,
    title: '24/7 Support',
    desc: 'Expert help whenever you need it',
    bg: 'rgba(180, 80, 255, 0.15)',
    color: '#b450ff',
  },
];

export function FeatureStrip() {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.15 });

  return (
    <section className="bb-section bb-section--dark" ref={ref}>
      <div className="bb-section__inner">
        <div className="bb-features">
          {featureData.map((feat, i) => (
            <div
              key={feat.title}
              className={`bb-feature-card bb-scroll-reveal bb-delay-${i + 1} ${isVisible ? 'bb-scroll-reveal--visible' : ''}`}
            >
              <div className="bb-feature-card__icon" style={{ background: feat.bg }}>
                <feat.icon size={22} style={{ color: feat.color }} stroke={1.6} />
              </div>
              <div>
                <div className="bb-feature-card__title">{feat.title}</div>
                <div className="bb-feature-card__desc">{feat.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   WHY CHOOSE US
   ═══════════════════════════════════════════════════════════════════ */

const whyData = [
  {
    icon: IconCertificate,
    title: 'Authorized Dealer',
    desc: 'We are an authorized dealer of all major electronics brands. Every product comes with a genuine manufacturer warranty.',
    bg: 'linear-gradient(135deg, #e6f2ff, #cce0ff)',
    color: '#0066ff',
  },
  {
    icon: IconBolt,
    title: 'Fast Delivery',
    desc: 'Same-day processing on orders placed before 2 PM. Standard delivery within 3–5 business days, express options available.',
    bg: 'linear-gradient(135deg, #fff4e6, #ffe8cc)',
    color: '#ff8c00',
  },
  {
    icon: IconHeart,
    title: 'Customer First',
    desc: 'Over 25,000 customers trust BrightBuy. Our support team is here around the clock to help with any questions.',
    bg: 'linear-gradient(135deg, #e6fff5, #ccffe8)',
    color: '#00c896',
  },
];

export function WhyChooseUs() {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  return (
    <section className="bb-section bb-section--alt" ref={ref}>
      <div className="bb-section__inner">
        <div
          className={`bb-section__header bb-scroll-reveal ${isVisible ? 'bb-scroll-reveal--visible' : ''}`}
        >
          <div className="bb-section__overline">
            <IconStar size={15} /> Why BrightBuy
          </div>
          <h2 className="bb-section__title">Why Customers Choose Us</h2>
          <p className="bb-section__desc">
            We go beyond selling electronics — we provide an experience built on
            trust, speed, and genuine care.
          </p>
        </div>

        <div className="bb-why-grid">
          {whyData.map((item, i) => (
            <div
              key={item.title}
              className={`bb-why-card bb-scroll-reveal bb-delay-${i + 1} ${isVisible ? 'bb-scroll-reveal--visible' : ''}`}
            >
              <div
                className="bb-why-card__icon"
                style={{ background: item.bg }}
              >
                <item.icon size={30} style={{ color: item.color }} stroke={1.6} />
              </div>
              <div className="bb-why-card__title">{item.title}</div>
              <div className="bb-why-card__desc">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CUSTOMER REVIEWS SHOWCASE
   ═══════════════════════════════════════════════════════════════════ */

const customerReviewsData = [
  {
    id: 1,
    name: 'gayani abeykoon',
    time: '2 days ago',
    rating: 5,
    text: 'Purchased NZXT H3 Flow 2025 casing. They have really good customer service and answered to queries promptly. Purchased a motherboard and CPU. Received quickly and in good condition.',
    avatar: 'G',
    bgColor: '#0066ff'
  },
  {
    id: 2,
    name: 'Dewagamage Kithsara',
    time: '3 days ago',
    rating: 5,
    text: 'Excellent place to buy pc parts. Highly recommended for gamers and creators.',
    avatar: 'D',
    bgColor: '#00c896'
  },
  {
    id: 3,
    name: 'stand alone',
    time: '4 days ago',
    rating: 5,
    text: 'Fast delivery, High quality products. Everything arrived safely packaged.',
    avatar: 'S',
    bgColor: '#ff8c00'
  },
  {
    id: 4,
    name: 'Alex Johnson',
    time: '1 week ago',
    rating: 5,
    text: 'Great prices and amazing customer support. I highly recommend BrightBuy for any PC builds!',
    avatar: 'A',
    bgColor: '#b450ff'
  },
  {
    id: 5,
    name: 'Michael T.',
    time: '2 weeks ago',
    rating: 4,
    text: 'Good selection of laptops, delivery took one extra day but it was securely packaged.',
    avatar: 'M',
    bgColor: '#66a3ff'
  }
];

export function CustomerReviewsShowcase({ reviews = customerReviewsData }) {
  const autoplay = useRef(Autoplay({ delay: 4000, stopOnInteraction: false }));
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  return (
    <section className="bb-section bb-section--alt">
      <div className="bb-section__inner" ref={ref}>
        <div className={`bb-section__header bb-scroll-reveal ${isVisible ? 'bb-scroll-reveal--visible' : ''}`}>
          <div className="bb-section__overline">
            <IconStar size={15} /> Customer Feedback
          </div>
          <h2 className="bb-section__title">What Our Customers Say</h2>
          <p className="bb-section__desc">
            Don't just take our word for it. Here is what real customers have to say about their experience.
          </p>
        </div>

        <div className={`bb-scroll-reveal bb-delay-2 ${isVisible ? 'bb-scroll-reveal--visible' : ''}`}>
          <Carousel
            withIndicators
            height={280}
            slideSize={{ base: '100%', sm: '50%', md: '33.333333%' }}
            slideGap={{ base: 'md', sm: 'lg' }}
            loop
            align="start"
            plugins={[autoplay.current]}
            styles={{
              indicator: {
                width: 12,
                height: 4,
                transition: 'width 250ms ease',
                '&[data-active]': { width: 40, backgroundColor: '#0066ff' }
              }
            }}
          >
            {reviews.map((review) => (
              <Carousel.Slide key={review.id}>
                <div style={{ padding: '32px 20px', height: '100%' }}>
                  <div 
                    className="bb-category-card" 
                    style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 24, cursor: 'default', textAlign: 'left' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: review.bgColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, marginRight: 12 }}>
                        {review.avatar}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--bb-text-base)', lineHeight: 1.2 }}>{review.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--bb-text-muted)', marginTop: 2 }}>{review.time}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                      {[...Array(5)].map((_, i) => (
                        <IconStar key={i} size={16} fill={i < review.rating ? "#ff8c00" : "transparent"} color={i < review.rating ? "#ff8c00" : "var(--bb-border-subtle)"} />
                      ))}
                    </div>

                    <div style={{ fontSize: 14, color: 'var(--bb-text-base)', lineHeight: 1.6, flex: 1 }}>
                      {review.text}
                    </div>
                  </div>
                </div>
              </Carousel.Slide>
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   NEWSLETTER CTA
   ═══════════════════════════════════════════════════════════════════ */

export function NewsletterCTA() {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.2 });

  const handleSubmit = (e) => {
    e.preventDefault();
    // UI-only — no backend for newsletter
  };

  return (
    <section className="bb-section bb-section--alt" style={{ padding: '60px 24px' }}>
      <div
        className={`bb-newsletter bb-scroll-reveal ${isVisible ? 'bb-scroll-reveal--visible' : ''}`}
        ref={ref}
      >
      <div className="bb-newsletter__inner">
        <h2 className="bb-newsletter__title">Stay in the Loop</h2>
        <p className="bb-newsletter__desc">
          Get notified about new arrivals, exclusive deals, and tech tips
          delivered straight to your inbox.
        </p>
        <form className="bb-newsletter__form" onSubmit={handleSubmit}>
          <input
            type="email"
            className="bb-newsletter__input"
            placeholder="Enter your email address"
            aria-label="Email address"
          />
          <button type="submit" className="bb-newsletter__submit">
            Subscribe
          </button>
        </form>
      </div>
      </div>
    </section>
  );
}

/**
 * AppShell — main layout wrapper
 * OWNER: Slice C (Vidura)
 *
 * Wraps every page with:
 *  - Navbar (sticky)
 *  - Content area (centred, responsive padding)
 *  - Footer
 *
 * Circuit Noir: the page ground and its 64px grid come from index.css, so
 * this file sets no background of its own. The footer is one ink.8 slab
 * separated by a hairline — no cards, no shadows.
 */
import { useEffect, useState } from 'react';
import { Container, Box, Text, Group, Stack } from '@mantine/core';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { api } from '../../api/client';
import {
  IconBrandFacebook,
  IconBrandX,
  IconBrandInstagram,
  IconBrandYoutube,
  IconMail,
  IconPhone,
  IconMapPin,
} from '@tabler/icons-react';
import Navbar from './Navbar';
import { NewArrivalsPopup } from '../ui';

const LINE = 'rgba(255,236,214,0.10)';
const EASE = 'cubic-bezier(0.2, 0, 0, 1)';

/* Sentence-case body label. Monospace is reserved for SKU codes and
   order numbers; everywhere else it reads as a generated-page tell. */
const MONO = {
  fontSize: 14,
  fontWeight: 400,
};

/* ── footer pieces ────────────────────────────────────────────────── */

function ColumnHeading({ children }) {
  return (
    <Text component="h2" style={MONO} c="ink.4" mb={16}>
      {children}
    </Text>
  );
}

/** Links shift 4px right on hover — the only movement in the footer. */
function FooterLink({ to, children }) {
  return (
    <Text
      component={Link}
      to={to}
      fz={14}
      c="ink.2"
      style={{
        textDecoration: 'none',
        display: 'inline-block',
        transition: `transform 150ms ${EASE}, color 150ms ${EASE}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateX(4px)';
        e.currentTarget.style.color = 'var(--mantine-color-ink-0)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.color = 'var(--mantine-color-ink-2)';
      }}
    >
      {children}
    </Text>
  );
}

/** Square, not circle. Hairline border, amber on hover. */
function Social({ icon: Icon, label }) {
  return (
    <a
      href="#"
      aria-label={label}
      style={{
        width: 32,
        height: 32,
        display: 'grid',
        placeItems: 'center',
        border: `1px solid ${LINE}`,
        borderRadius: 4,
        color: 'var(--mantine-color-ink-2)',
        transition: `border-color 150ms ${EASE}, color 150ms ${EASE}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,140,0,0.35)';
        e.currentTarget.style.color = 'var(--mantine-color-brand-5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = LINE;
        e.currentTarget.style.color = 'var(--mantine-color-ink-2)';
      }}
    >
      <Icon size={15} />
    </a>
  );
}

function ContactRow({ icon: Icon, children }) {
  return (
    <Group gap={8} wrap="nowrap">
      <Icon size={15} style={{ color: 'var(--mantine-color-brand-5)', flexShrink: 0 }} />
      <Text fz={14} c="ink.2">{children}</Text>
    </Group>
  );
}

function Footer() {
  return (
    <Box
      component="footer"
      style={{
        background: 'var(--mantine-color-ink-8)',
        borderTop: `1px solid ${LINE}`,
      }}
    >
      <Container size="xl" px={{ base: 16, sm: 24 }} py={48}>
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 40,
          }}
        >
          {/* brand */}
          <Stack gap={16}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
              c="ink.0"
            >
              Bright<span style={{ color: 'var(--mantine-color-brand-5)' }}>Buy</span>
            </Text>
            <Text fz={14} c="ink.2" style={{ lineHeight: 1.65, maxWidth: '34ch' }}>
              Order online, pay by card or on delivery. Colombo warehouse,
              island-wide dispatch.
            </Text>
            <Group gap={8}>
              <Social icon={IconBrandX} label="BrightBuy on X" />
              <Social icon={IconBrandInstagram} label="BrightBuy on Instagram" />
              <Social icon={IconBrandFacebook} label="BrightBuy on Facebook" />
              <Social icon={IconBrandYoutube} label="BrightBuy on YouTube" />
            </Group>
          </Stack>

          {/* quick links */}
          <Box>
            <ColumnHeading>Quick links</ColumnHeading>
            <Stack gap={8} align="flex-start">
              <FooterLink to="/">Home</FooterLink>
              <FooterLink to="/products">Products</FooterLink>
              <FooterLink to="/cart">Cart</FooterLink>
              <FooterLink to="/orders">Orders</FooterLink>
            </Stack>
          </Box>

          {/* account */}
          <Box>
            <ColumnHeading>Account</ColumnHeading>
            <Stack gap={8} align="flex-start">
              <FooterLink to="/login">Sign in</FooterLink>
              <FooterLink to="/register">Register</FooterLink>
              <FooterLink to="/account">My profile</FooterLink>
              <FooterLink to="/account/addresses">Addresses</FooterLink>
            </Stack>
          </Box>

          {/* contact */}
          <Box>
            <ColumnHeading>Contact</ColumnHeading>
            <Stack gap={12}>
              <ContactRow icon={IconMapPin}>Colombo 03, Sri Lanka</ContactRow>
              <ContactRow icon={IconPhone}>+94 11 234 5678</ContactRow>
              <ContactRow icon={IconMail}>support@brightbuy.com</ContactRow>
            </Stack>
          </Box>
        </Box>
      </Container>

      {/* bottom bar */}
      <Box style={{ borderTop: `1px solid ${LINE}` }}>
        <Container size="xl" px={{ base: 16, sm: 24 }} py={16}>
          <Group justify="space-between" wrap="wrap" gap={16}>
            <Text style={MONO} c="ink.4">
              © {new Date().getFullYear()} BrightBuy · Colombo, Sri Lanka · Group 13, University of Moratuwa
            </Text>
            <Group gap={24}>
              {['Privacy', 'Terms', 'Shipping'].map((l) => (
                <Text
                  key={l}
                  component="a"
                  href="#"
                  style={{ ...MONO, textDecoration: 'none' }}
                  c="ink.4"
                >
                  {l}
                </Text>
              ))}
            </Group>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}

/* ── AppShell ─────────────────────────────────────────────────────── */
export default function AppShell({ cartItemCount = 0 }) {
  const location = useLocation();
  const [newArrivals, setNewArrivals] = useState([]);

  /* Three thumbnails for the popup. Fails silently: a marketing nudge
     must never be the reason a page errors. */
  useEffect(() => {
    api.get('/products?pageSize=3')
      .then((r) => setNewArrivals(r.data || []))
      .catch(() => {});
  }, []);
  /* The home page uses full-width sections (hero, ticker, slabs).
     Every other page gets the centred Container. */
  const isFullWidth = location.pathname === '/';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar cartItemCount={cartItemCount} />

      <main style={{ flex: 1 }}>
        {isFullWidth ? (
          <Outlet />
        ) : (
          <Container size="xl" py={32} px={{ base: 16, sm: 24 }}>
            <Outlet />
          </Container>
        )}
      </main>

      <Footer />
      <NewArrivalsPopup products={newArrivals} />
    </div>
  );
}

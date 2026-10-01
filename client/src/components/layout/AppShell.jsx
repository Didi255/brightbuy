/**
 * AppShell — main layout wrapper
 * OWNER: Slice C (Vidura)
 *
 * Wraps every page with:
 *  - Navbar (sticky, animated)
 *  - Content area (centred, responsive padding)
 *  - Footer
 */
import { Container, Box, Text, Group, Anchor, Divider, useMantineColorScheme } from '@mantine/core';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  IconBrandFacebook,
  IconBrandTwitter,
  IconBrandInstagram,
  IconMail,
  IconPhone,
  IconMapPin,
  IconBolt,
} from '@tabler/icons-react';
import Navbar from './Navbar';

/* ── Footer ───────────────────────────────────────────────────────── */
function Footer() {
  const { colorScheme } = useMantineColorScheme();

  return (
    <footer className="bb-footer" style={{ background: 'var(--bb-bg-base)', borderTop: '1px solid var(--bb-border-subtle)' }}>
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '48px 24px 24px',
        }}
      >
        {/* footer columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 32,
            marginBottom: 32,
          }}
        >
          {/* brand */}
          <div>
            <img
              src={colorScheme === 'dark' ? '/Logo.png' : '/lightmodelogo.png'}
              alt="BrightBuy — Electronics Store"
              style={{ height: 65, width: 'auto', objectFit: 'contain', marginBottom: 12 }}
            />
            <Text size="sm" style={{ color: 'var(--bb-text-muted)', lineHeight: 1.7 }}>
              Your trusted electronics retailer in Texas. Quality products,
              fast delivery, great prices.
            </Text>
          </div>

          {/* quick links */}
          <div>
            <Text fw={700} size="sm" mb={12} style={{ color: 'var(--bb-text-base)' }}>
              Quick Links
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/" className="bb-footer-link" style={{ fontSize: 14, color: 'var(--bb-text-muted)', textDecoration: 'none' }}>Home</Link>
              <Link to="/products" className="bb-footer-link" style={{ fontSize: 14, color: 'var(--bb-text-muted)', textDecoration: 'none' }}>Products</Link>
              <Link to="/cart" className="bb-footer-link" style={{ fontSize: 14, color: 'var(--bb-text-muted)', textDecoration: 'none' }}>Cart</Link>
              <Link to="/orders" className="bb-footer-link" style={{ fontSize: 14, color: 'var(--bb-text-muted)', textDecoration: 'none' }}>Orders</Link>
            </div>
          </div>

          {/* account */}
          <div>
            <Text fw={700} size="sm" mb={12} style={{ color: 'var(--bb-text-base)' }}>
              Account
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/login" style={{ fontSize: 14, color: 'var(--bb-text-muted)', textDecoration: 'none' }}>Sign In</Link>
              <Link to="/register" style={{ fontSize: 14, color: 'var(--bb-text-muted)', textDecoration: 'none' }}>Register</Link>
              <Link to="/account" style={{ fontSize: 14, color: 'var(--bb-text-muted)', textDecoration: 'none' }}>My Profile</Link>
              <Link to="/account/addresses" style={{ fontSize: 14, color: 'var(--bb-text-muted)', textDecoration: 'none' }}>Addresses</Link>
            </div>
          </div>

          {/* contact */}
          <div>
            <Text fw={700} size="sm" mb={12} style={{ color: 'var(--bb-text-base)' }}>
              Contact
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Group gap={8}>
                <IconMapPin size={16} style={{ color: '#ffa333', flexShrink: 0 }} />
                <Text size="sm" style={{ color: 'var(--bb-text-muted)' }}>Houston, Texas</Text>
              </Group>
              <Group gap={8}>
                <IconPhone size={16} style={{ color: '#ffa333', flexShrink: 0 }} />
                <Text size="sm" style={{ color: 'var(--bb-text-muted)' }}>(713) 555-0123</Text>
              </Group>
              <Group gap={8}>
                <IconMail size={16} style={{ color: '#ffa333', flexShrink: 0 }} />
                <Text size="sm" style={{ color: 'var(--bb-text-muted)' }}>support@brightbuy.com</Text>
              </Group>
            </div>
          </div>
        </div>

        {/* divider + bottom bar */}
        <Divider color="var(--bb-border-subtle)" />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            paddingTop: 20,
          }}
        >
          <Text size="xs" style={{ color: 'var(--bb-text-muted)' }}>
            © {new Date().getFullYear()} BrightBuy · Group 13 · University of Moratuwa
          </Text>
          <Group gap={12}>
            <ActionIconCircle icon={IconBrandFacebook} />
            <ActionIconCircle icon={IconBrandTwitter} />
            <ActionIconCircle icon={IconBrandInstagram} />
          </Group>
        </div>
      </div>
    </footer>
  );
}

function ActionIconCircle({ icon: Icon }) {
  return (
    <a
      href="#"
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'var(--bb-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,140,0,0.25)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bb-border-subtle)')}
    >
      <Icon size={16} style={{ color: 'var(--bb-text-base)' }} />
    </a>
  );
}

/* ── AppShell ─────────────────────────────────────────────────────── */
export default function AppShell({ cartItemCount = 0 }) {
  const location = useLocation();
  /* The home page uses full-width sections (hero, stats, CTA).
     Every other page gets the centred Container. */
  const isFullWidth = location.pathname === '/';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
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
    </div>
  );
}


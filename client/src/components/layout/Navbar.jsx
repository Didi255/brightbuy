/**
 * Navbar — BrightBuy main navigation
 * OWNER: Slice C (Vidura)
 *
 * Features:
 *  - Sticky header with scroll-aware shadow
 *  - Animated slide-down on mount
 *  - Active link highlight with orange underline
 *  - Cart badge with item count (pulse animation)
 *  - Auth-aware user menu
 *  - Mobile drawer with smooth transitions
 *  - Staff banner for admin users
 */
import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Group,
  Text,
  ActionIcon,
  Menu,
  Divider,
  Tooltip,
  Transition,
  Box,
  useMantineColorScheme,
} from '@mantine/core';
import {
  IconShoppingCart,
  IconUser,
  IconSearch,
  IconMenu2,
  IconX,
  IconLogout,
  IconPackage,
  IconMapPin,
  IconChevronDown,
  IconHome,
  IconCategory,
  IconShoppingBag,
  IconLogin,
  IconUserPlus,
  IconDashboard,
  IconBolt,
  IconSun,
  IconMoon,
} from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';

/* ─── customer navigation items ─────────────────────────────────── */
const customerLinks = [
  { to: '/', label: 'Home', icon: IconHome },
  { to: '/products', label: 'Products', icon: IconCategory },
  { to: '/orders', label: 'Orders', icon: IconPackage },
];

/* ─── component ──────────────────────────────────────────────────── */
export default function Navbar({ cartItemCount = 0 }) {
  const { user, logout, isStaff } = useAuth();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartBump, setCartBump] = useState(false);

  /* scroll listener for sticky shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* pulse the cart badge when count changes */
  useEffect(() => {
    if (cartItemCount > 0) {
      setCartBump(true);
      const t = setTimeout(() => setCartBump(false), 400);
      return () => clearTimeout(t);
    }
  }, [cartItemCount]);

  /* close mobile menu on route change */
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = useCallback(
    (path) => {
      if (path === '/') return location.pathname === '/';
      return location.pathname.startsWith(path);
    },
    [location.pathname],
  );

  return (
    <>
      {/* ── staff banner ─────────────────────────────────────────── */}
      {isStaff && (
        <Box
          style={{
            background: 'var(--mantine-color-brand-5)',
            textAlign: 'center',
            padding: '6px 0',
            fontSize: 13,
            fontWeight: 600,
            color: '#fff',
            letterSpacing: 0.3,
          }}
        >
          <IconBolt size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Staff Mode — <Link to="/staff" style={{ textDecoration: 'underline' }}>Go to Dashboard</Link>
        </Box>
      )}

      {/* ── main navbar ──────────────────────────────────────────── */}
      <nav
        className={`bb-navbar ${scrolled ? 'bb-navbar--scrolled' : ''}`}
        style={{
          background: scrolled
            ? 'var(--bb-bg-base)'
            : 'var(--bb-nav-glass)',
          transition: 'all 0.35s ease',
        }}
      >
        {/* top bar */}
        <div
          style={{
            maxWidth: '100%',
            margin: '0 auto',
            padding: '0 32px',
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* ── logo ─────────────────────────────────────────── */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            <img
              src={colorScheme === 'dark' ? '/Logo.png' : '/lightmodelogo.png'}
              alt="BrightBuy — Electronics Store"
              style={{
                height: 95,
                width: 'auto',
                objectFit: 'contain',
                borderRadius: 8,
              }}
            />
          </Link>

          {/* ── desktop nav links ────────────────────────────── */}
          <Group gap={4} visibleFrom="md">
            {customerLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`bb-nav-link ${isActive(link.to) ? 'bb-nav-link--active' : ''}`}
              >
                <link.icon size={22} stroke={1.8} />
                {link.label}
              </Link>
            ))}
          </Group>

          {/* ── right actions ────────────────────────────────── */}
          <Group gap={8}>
            {/* theme toggle */}
            <Tooltip label="Toggle theme" withArrow>
              <ActionIcon
                variant="subtle"
                radius="sm"
                size="lg"
                className="bb-action-icon"
                onClick={() => toggleColorScheme()}
                aria-label="Toggle colour scheme"
              >
                {colorScheme === 'dark' ? (
                  <IconSun size={24} stroke={1.8} />
                ) : (
                  <IconMoon size={24} stroke={1.8} />
                )}
              </ActionIcon>
            </Tooltip>

            {/* search shortcut */}
            <Tooltip label="Search products" withArrow>
              <ActionIcon
                variant="subtle"
                radius="sm"
                size="lg"
                className="bb-action-icon"
                onClick={() => navigate('/products')}
                aria-label="Search products"
              >
                <IconSearch size={24} stroke={1.8} />
              </ActionIcon>
            </Tooltip>

            {/* cart */}
            <Tooltip label="Shopping cart" withArrow>
              <ActionIcon
                variant="subtle"
                radius="sm"
                size="lg"
                className="bb-action-icon bb-cart-badge"
                onClick={() => navigate('/cart')}
                aria-label={`Cart with ${cartItemCount} items`}
              >
                <IconShoppingCart size={25} stroke={1.8} />
                {cartItemCount > 0 && (
                  <span
                    className={`bb-cart-badge__count ${cartBump ? 'bb-cart-badge__count--bump' : ''}`}
                  >
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </ActionIcon>
            </Tooltip>

            {/* user menu / login */}
            {user ? (
              <Menu shadow="none" width={220} position="bottom-end" withArrow arrowPosition="center">
                <Menu.Target>
                  <ActionIcon
                    variant="subtle"
                    radius="sm"
                    size="lg"
                    aria-label="Account menu"
                    className="bb-action-icon"
                  >
                    <IconUser size={24} stroke={1.8} />
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>
                    <Text size="sm" fw={600}>{user.firstName} {user.lastName || ''}</Text>
                    <Text size="xs" c="dimmed">{user.email}</Text>
                  </Menu.Label>
                  <Divider />
                  <Menu.Item
                    leftSection={<IconUser size={16} />}
                    onClick={() => navigate('/account')}
                  >
                    My Profile
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconPackage size={16} />}
                    onClick={() => navigate('/orders')}
                  >
                    My Orders
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconMapPin size={16} />}
                    onClick={() => navigate('/account/addresses')}
                  >
                    Addresses
                  </Menu.Item>
                  {isStaff && (
                    <>
                      <Divider label="Staff" labelPosition="center" />
                      <Menu.Item
                        leftSection={<IconDashboard size={16} />}
                        onClick={() => navigate('/staff')}
                      >
                        Staff Dashboard
                      </Menu.Item>
                    </>
                  )}
                  <Divider />
                  <Menu.Item
                    color="red"
                    leftSection={<IconLogout size={16} />}
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                  >
                    Sign Out
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Group gap={8} visibleFrom="md">
                <Link
                  to="/login"
                  className="bb-nav-link"
                  style={{ fontSize: 13, padding: '6px 12px' }}
                >
                  <IconLogin size={20} stroke={1.8} />
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bb-join-btn"
                >
                  <IconUserPlus size={20} stroke={1.8} />
                  Join Now
                </Link>
              </Group>
            )}

            {/* mobile hamburger */}
            <ActionIcon
              variant="subtle"
              radius="sm"
              size="lg"
              hiddenFrom="md"
              className="bb-action-icon"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <IconMenu2 size={26} stroke={1.8} />
            </ActionIcon>
          </Group>
        </div>
      </nav>

      {/* ── mobile drawer ──────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="bb-mobile-menu" onClick={() => setMobileOpen(false)}>
          <div
            className="bb-mobile-menu__panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 24,
              }}
            >
              <img
                src={colorScheme === 'dark' ? '/Logo.png' : '/lightmodelogo.png'}
                alt="BrightBuy"
                style={{ height: 36, width: 'auto', objectFit: 'contain' }}
              />
              <ActionIcon
                variant="subtle"
                radius="sm"
                style={{ color: 'rgba(255,255,255,0.8)' }}
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <IconX size={20} />
              </ActionIcon>
            </div>

            {/* mobile nav links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {customerLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`bb-mobile-link ${isActive(link.to) ? 'bb-mobile-link--active' : ''}`}
                >
                  <link.icon size={20} stroke={1.6} />
                  {link.label}
                </Link>
              ))}

              <Link to="/cart" className="bb-mobile-link">
                <IconShoppingCart size={20} stroke={1.6} />
                Cart
                {cartItemCount > 0 && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      background: 'var(--mantine-color-brand-5)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                      borderRadius: 10,
                      padding: '2px 8px',
                    }}
                  >
                    {cartItemCount}
                  </span>
                )}
              </Link>

              <Divider
                my="sm"
                style={{ borderColor: 'rgba(255,255,255,0.15)' }}
              />

              {user ? (
                <>
                  <Text
                    size="xs"
                    fw={600}
                    style={{ color: 'rgba(255,255,255,0.5)', padding: '0 16px', marginBottom: 4 }}
                  >
                    Account
                  </Text>
                  <Link to="/account" className="bb-mobile-link">
                    <IconUser size={20} stroke={1.6} />
                    My Profile
                  </Link>
                  <Link to="/account/addresses" className="bb-mobile-link">
                    <IconMapPin size={20} stroke={1.6} />
                    Addresses
                  </Link>
                  {isStaff && (
                    <Link to="/staff" className="bb-mobile-link">
                      <IconDashboard size={20} stroke={1.6} />
                      Staff Dashboard
                    </Link>
                  )}
                  <Divider
                    my="sm"
                    style={{ borderColor: 'rgba(255,255,255,0.15)' }}
                  />
                  <button
                    className="bb-mobile-link"
                    style={{
                      width: '100%',
                      background: 'rgba(255,80,80,0.15)',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--mantine-color-red-4)',
                    }}
                    onClick={() => {
                      logout();
                      navigate('/');
                      setMobileOpen(false);
                    }}
                  >
                    <IconLogout size={20} stroke={1.6} />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="bb-mobile-link">
                    <IconLogin size={20} stroke={1.6} />
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bb-mobile-link"
                    style={{ background: 'rgba(255,140,0,0.12)', color: 'var(--mantine-color-brand-5)' }}
                  >
                    <IconUserPlus size={20} stroke={1.6} />
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

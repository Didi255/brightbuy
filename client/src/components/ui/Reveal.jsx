/**
 * Reveal — one scroll reveal per section
 * OWNER: Slice C (Vidura)
 *
 * Usage:
 *   <Reveal>…</Reveal>                        fade + 24px rise
 *   <Reveal kind="scale">…</Reveal>           fade + 0.97 → 1
 *   <Reveal kind="right" i={2} stagger={40}>  slide in from the right
 *   <Reveal kind="fade">…</Reveal>            opacity only, no movement
 *
 * ONE reveal per section, never per element — a page where every heading,
 * paragraph and button arrives separately reads as a showreel, not a shop.
 * Use `i` only for genuine peers: tiles in a grid, cards in a rail.
 *
 * Hard limits, enforced by the CSS rather than by convention:
 *   - 420ms base, stagger capped so no section exceeds ~400ms in total
 *   - movement never exceeds 24px (40px for the horizontal rail variant,
 *     which travels sideways into an already-scrollable strip)
 *   - fires once, because the hook unobserves after first intersection
 *   - reduced motion degrades every variant to a plain opacity fade
 */
import useReveal from '../../hooks/useReveal';

export default function Reveal({
  kind = 'up',          // 'up' | 'scale' | 'right' | 'fade'
  i = 0,                // index among peers, for the stagger
  stagger,              // 40 | 80; omit for the 50ms default
  component: Tag = 'div',
  style,
  children,
  ...rest
}) {
  const ref = useReveal();

  return (
    <Tag
      ref={ref}
      className="bb-observe"
      data-reveal={kind === 'up' ? undefined : kind}
      data-stagger={stagger ? String(stagger) : undefined}
      style={{ '--i': i, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

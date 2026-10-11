/**
 * ProductTile — the light panel every product image sits in
 * OWNER: Slice C (Vidura)
 *
 * Usage:
 *   <ProductTile src={p.imageUrl} alt={p.productName} />
 *   <ProductTile src={...} alt={...} pad={32} zoom={2} pan />
 *   <ProductTile src={...} alt={...} size={72} />        // fixed square
 *
 * THE ONE RULE: product photography never sits directly on the dark page.
 * It sits in a #F2F3F5 tile. Product shots are almost all cut out on white,
 * so on a near-black ground they read as broken rectangles with ragged
 * edges. Put them in a deliberate light panel and the tile becomes the
 * design — the dark chrome frames it.
 *
 * Applies everywhere without exception: catalogue cards, the PDP gallery
 * and its thumbnails, cart rows, order lines, the hero marquee. Consistency
 * is what makes it read as intentional rather than accidental.
 *
 * Zoom: `zoom` scales the image on hover; `pan` additionally tracks the
 * cursor so the point under the pointer stays put while it magnifies.
 * The cursor position is written straight to the node through a ref —
 * never useState, which would re-render the whole card on every pixel and
 * collapse frame rates across a twelve-card grid. Only `transform` is
 * animated, so it stays on the compositor, and the global
 * prefers-reduced-motion rule freezes it.
 */
import { useCallback, useRef } from 'react';
import { Box } from '@mantine/core';

const TILE_BG = '#F4F1EC';   /* warm, to match the neutral ramp */
const EASE = 'cubic-bezier(0.2, 0, 0, 1)';

export default function ProductTile({
  src,
  alt = '',
  ratio = '1 / 1',
  pad = 28,
  zoom = 1.06,
  pan = false,
  size,            // fixed square, for cart and order rows
  radius = 16,
  ...rest
}) {
  const img = useRef(null);

  const onMove = useCallback((e) => {
    const node = img.current;
    if (!node || !pan) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    node.style.transformOrigin = `${x}% ${y}%`;
  }, [pan]);

  const onEnter = useCallback(() => {
    if (img.current && zoom !== 1) img.current.style.transform = `scale(${zoom})`;
  }, [zoom]);

  const onLeave = useCallback(() => {
    const node = img.current;
    if (!node) return;
    node.style.transform = 'scale(1)';
    node.style.transformOrigin = 'center';
  }, []);

  const box = size
    ? { width: size, height: size, flexShrink: 0 }
    : { aspectRatio: ratio, width: '100%' };

  return (
    <Box
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        ...box,
        background: TILE_BG,
        borderRadius: radius,
        overflow: 'hidden',
        padding: size ? Math.round(size * 0.12) : pad,
        display: 'grid',
        placeItems: 'center',
      }}
      {...rest}
    >
      {src && (
        <img
          ref={img}
          src={src}
          alt={alt}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            /* contain, never cover: a cropped product is a worse product
               photo, and these are shot to be seen whole. */
            objectFit: 'contain',
            display: 'block',
            transform: 'scale(1)',
            transformOrigin: 'center',
            transition: `transform 320ms ${EASE}`,
            willChange: 'transform',
          }}
        />
      )}
    </Box>
  );
}

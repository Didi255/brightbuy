/**
 * CategoryChips — the catalogue's category selector.   OWNER: Slice B
 *
 * A horizontal scrolling row of pills, which replaces the vertical list
 * that used to live in the filter rail. That swap is the point: it frees
 * the whole sidebar for real filters instead of spending it on navigation.
 *
 * Selection is read from and written to the URL, so a category view is
 * shareable and the back button behaves — same contract as every other
 * filter on this page.
 */
import { Box, UnstyledButton } from '@mantine/core';

export default function CategoryChips({ categories = [], active, onSelect }) {
  /* "All products" is a chip, not a separate control: clearing a filter
     should be in the same place as setting one. */
  const chips = [{ categoryId: null, categoryName: 'All products' }, ...categories];

  return (
    <Box className="bb-chips">
      <Box className="bb-chips__track" role="tablist" aria-label="Product categories">
        {chips.map((c) => {
          const on = String(active ?? '') === String(c.categoryId ?? '');
          return (
            <UnstyledButton
              key={c.categoryId ?? 'all'}
              role="tab"
              aria-selected={on}
              className={`bb-chip${on ? ' bb-chip--on' : ''}`}
              onClick={() => onSelect(c.categoryId)}
            >
              {c.categoryName}
            </UnstyledButton>
          );
        })}
      </Box>
    </Box>
  );
}

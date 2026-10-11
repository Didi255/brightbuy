/**
 * PageHeader — consistent page title + breadcrumb
 * OWNER: Slice C (Vidura)
 *
 * Every page wraps its top section in this. It gives the whole app
 * a uniform title placement and optional breadcrumbs.
 *
 * Circuit Noir: mono breadcrumbs in uppercase with › separators, the title
 * in Inter 700 at 32px, left-aligned, and a hairline rule beneath.
 * Titles are never centred — rule 4.
 */
import { Title, Text, Group, Box } from '@mantine/core';
import { Link } from 'react-router-dom';

/**
 * @param {string}   title       – page title (h1)
 * @param {string}   [subtitle]  – optional description
 * @param {Array}    [crumbs]    – [{ label, to? }]  (last item is current page)
 * @param {ReactNode} [right]    – optional right-side action(s)
 */
export default function PageHeader({ title, subtitle, crumbs, right }) {
  const crumb = {
    fontSize: 14,
    fontWeight: 400,
  };

  return (
    <Box mb={title ? 32 : 20} pb={title ? 24 : 0} style={{ borderBottom: title ? '1px solid rgba(255,236,214,0.10)' : 'none' }}>
      {crumbs && crumbs.length > 0 && (
        <Group gap={8} mb={12} wrap="wrap">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <Group gap={8} key={i} wrap="nowrap">
                {last || !c.to ? (
                  <Text component="span" style={crumb} c={last ? 'ink.2' : 'ink.3'}>
                    {c.label}
                  </Text>
                ) : (
                  <Text
                    component={Link}
                    to={c.to}
                    style={{ ...crumb, textDecoration: 'none' }}
                    c="ink.3"
                  >
                    {c.label}
                  </Text>
                )}
                {!last && (
                  <Text component="span" style={crumb} c="ink.4" aria-hidden="true">
                    ›
                  </Text>
                )}
              </Group>
            );
          })}
        </Group>
      )}

      {!title && !right ? null : (
      <Group justify="space-between" align="flex-end" wrap="wrap" gap={16}>
        <Box style={{ minWidth: 0 }}>
          {title && (
          <Title
            order={1}
            c="ink.0"
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
            }}
          >
            {title}
          </Title>
          )}
          {subtitle && (
            <Text size="md" c="ink.2" mt={8} style={{ maxWidth: '62ch', lineHeight: 1.5 }}>
              {subtitle}
            </Text>
          )}
        </Box>
        {right && <Box>{right}</Box>}
      </Group>
      )}
    </Box>
  );
}

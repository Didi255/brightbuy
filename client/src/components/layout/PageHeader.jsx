/**
 * PageHeader — consistent page title + breadcrumb
 * OWNER: Slice C (Vidura)
 *
 * Every page wraps its top section in this. It gives the whole app
 * a uniform title placement and optional breadcrumbs.
 */
import { Title, Text, Group, Breadcrumbs, Anchor, Box } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconChevronRight } from '@tabler/icons-react';

/**
 * @param {string}   title       – page title (h1)
 * @param {string}   [subtitle]  – optional description
 * @param {Array}    [crumbs]    – [{ label, to? }]  (last item is current page)
 * @param {ReactNode} [right]    – optional right-side action(s)
 */
export default function PageHeader({ title, subtitle, crumbs, right }) {
  return (
    <Box className="bb-page-enter" mb={24}>
      {crumbs && crumbs.length > 0 && (
        <Breadcrumbs
          separator={<IconChevronRight size={14} stroke={1.6} color="#adb5bd" />}
          mb={12}
          styles={{
            separator: { margin: '0 4px' },
          }}
        >
          {crumbs.map((c, i) =>
            i < crumbs.length - 1 ? (
              <Anchor
                key={i}
                component={Link}
                to={c.to || '/'}
                size="sm"
                c="dimmed"
                style={{ textDecoration: 'none' }}
              >
                {c.label}
              </Anchor>
            ) : (
              <Text key={i} size="sm" c="dimmed" fw={500}>
                {c.label}
              </Text>
            ),
          )}
        </Breadcrumbs>
      )}

      <Group justify="space-between" align="flex-end" wrap="nowrap">
        <div>
          <Title order={1} size="h2" fw={800} style={{ letterSpacing: -0.5 }}>
            {title}
          </Title>
          {subtitle && (
            <Text size="sm" c="dimmed" mt={4}>
              {subtitle}
            </Text>
          )}
        </div>
        {right && <div>{right}</div>}
      </Group>
    </Box>
  );
}


import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Container,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import {
  IconEye,
  IconRefresh,
  IconSearch,
} from '@tabler/icons-react';

import { api } from '../../api/client';
import {
  DataTable,
  ErrorAlert,
  LoadingSpinner,
} from '../../components/ui';
import PageHeader from '../../components/layout/PageHeader';

const actionOptions = [
  { value: 'all', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'status_change', label: 'Status Change' },
];

const entityOptions = [
  { value: 'all', label: 'All Entities' },
  { value: 'user', label: 'Users' },
  { value: 'city', label: 'Cities' },
];

function actionColor(action) {
  switch (action) {
    case 'create':
      return 'green';
    case 'update':
      return 'blue';
    case 'delete':
      return 'red';
    case 'status_change':
      return 'orange';
    default:
      return 'gray';
  }
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString();
}

function formatJson(value) {
  if (value === null || value === undefined) {
    return 'No data recorded';
  }

  try {
    const parsed =
      typeof value === 'string' ? JSON.parse(value) : value;

    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(value);
  }
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');

  const [selectedLog, setSelectedLog] = useState(null);

  async function loadLogs() {
    try {
      setLoading(true);
      setLoadError(null);

      const data = await api.get('/admin/audit-log');

      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      setLoadError(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return logs.filter((log) => {
      const searchableText = [
        log.auditId,
        log.actorUserId,
        log.actorName,
        log.actorEmail,
        log.action,
        log.entityType,
        log.entityId,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesAction =
        actionFilter === 'all' ||
        log.action === actionFilter;

      const matchesEntity =
        entityFilter === 'all' ||
        log.entityType === entityFilter;

      return matchesSearch && matchesAction && matchesEntity;
    });
  }, [logs, search, actionFilter, entityFilter]);

  const columns = [
    {
      key: 'auditId',
      label: 'Audit ID',
      sortable: true,
    },
    {
      key: 'actorName',
      label: 'Performed By',
      sortable: true,
      render: (log) => (
        <Stack gap={0}>
          <Text size="sm" fw={500}>
            {log.actorName || `User ${log.actorUserId}`}
          </Text>
          <Text size="xs" c="dimmed">
            {log.actorEmail || '—'}
          </Text>
        </Stack>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (log) => (
        <Badge
          color={actionColor(log.action)}
          variant="light"
        >
          {log.action?.replaceAll('_', ' ') || 'Unknown'}
        </Badge>
      ),
    },
    {
      key: 'entityType',
      label: 'Entity',
      sortable: true,
      render: (log) => (
        <Text size="sm">
          {log.entityType} #{log.entityId}
        </Text>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date & Time',
      sortable: true,
      render: (log) => (
        <Text size="sm">
          {formatDate(log.createdAt)}
        </Text>
      ),
    },
    {
      key: 'details',
      label: 'Details',
      render: (log) => (
        <Button
          variant="light"
          size="xs"
          leftSection={<IconEye size={14} />}
          onClick={() => setSelectedLog(log)}
        >
          View Details
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <LoadingSpinner
        fullPage
        label="Loading audit history..."
      />
    );
  }

  return (
    <Container size="xl" py="xl">
      <PageHeader
        title="Audit Log Viewer"
        subtitle="View administrative actions and changes recorded in the system."
        crumbs={[
          { label: 'Staff', to: '/staff' },
          { label: 'Audit Log' },
        ]}
        right={
          <Button
            variant="default"
            leftSection={<IconRefresh size={16} />}
            onClick={loadLogs}
          >
            Refresh
          </Button>
        }
      />

      {loadError ? (
        <ErrorAlert
          error={loadError}
          title="Could not load audit history"
          onRetry={loadLogs}
        />
      ) : (
        <Paper withBorder radius="md" p="md">
          <Stack gap="md">
            <Group grow align="flex-end">
              <TextInput
                label="Search audit logs"
                placeholder="Actor, email, action or ID"
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(event) =>
                  setSearch(event.currentTarget.value)
                }
              />

              <Select
                label="Action"
                data={actionOptions}
                value={actionFilter}
                onChange={(value) =>
                  setActionFilter(value || 'all')
                }
                allowDeselect={false}
              />

              <Select
                label="Entity Type"
                data={entityOptions}
                value={entityFilter}
                onChange={(value) =>
                  setEntityFilter(value || 'all')
                }
                allowDeselect={false}
              />
            </Group>

            <Group justify="space-between">
              <Text fw={600}>Audit History</Text>
              <Text size="sm" c="dimmed">
                {filteredLogs.length} of {logs.length} records
              </Text>
            </Group>

            <DataTable
              columns={columns}
              data={filteredLogs}
              emptyMessage="No audit records found"
            />
          </Stack>
        </Paper>
      )}

      <Modal
        opened={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        title="Audit Record Details"
        centered
        size="lg"
      >
        {selectedLog && (
          <Stack gap="md">
            <Text size="sm">
              <strong>Audit ID:</strong> {selectedLog.auditId}
            </Text>

            <Text size="sm">
              <strong>Performed By:</strong>{' '}
              {selectedLog.actorName || 'Unknown'}
            </Text>

            <Text size="sm">
              <strong>Action:</strong> {selectedLog.action}
            </Text>

            <Text size="sm">
              <strong>Entity:</strong>{' '}
              {selectedLog.entityType} #{selectedLog.entityId}
            </Text>

            <Text size="sm">
              <strong>Date:</strong>{' '}
              {formatDate(selectedLog.createdAt)}
            </Text>

            <Text fw={600}>Before Change</Text>
            <Paper withBorder p="sm" radius="sm">
              <Text
                component="pre"
                size="xs"
                style={{
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                }}
              >
                {formatJson(selectedLog.beforeValue)}
              </Text>
            </Paper>

            <Text fw={600}>After Change</Text>
            <Paper withBorder p="sm" radius="sm">
              <Text
                component="pre"
                size="xs"
                style={{
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                }}
              >
                {formatJson(selectedLog.afterValue)}
              </Text>
            </Paper>

            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={() => setSelectedLog(null)}
              >
                Close
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}

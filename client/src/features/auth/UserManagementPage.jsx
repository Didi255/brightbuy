
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
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import {
  IconEdit,
  IconRefresh,
  IconSearch,
} from '@tabler/icons-react';

import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  DataTable,
  ErrorAlert,
  LoadingSpinner,
} from '../../components/ui';
import PageHeader from '../../components/layout/PageHeader';

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'major_exec', label: 'Major Executive' },
  { value: 'minor_exec', label: 'Minor Executive' },
  { value: 'labour', label: 'Labour' },
];

const initialForm = {
  role: '',
  isActive: true,
};

function normalizeUser(user) {
  return {
    ...user,
    isActive: Boolean(user.isActive),
  };
}

function roleLabel(role) {
  return (
    roleOptions.find((option) => option.value === role)?.label ||
    role ||
    '—'
  );
}

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [modalOpened, setModalOpened] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [confirmOpened, setConfirmOpened] = useState(false);
  const [pendingChange, setPendingChange] = useState(null);

  async function loadUsers() {
    try {
      setLoading(true);
      setLoadError(null);

      const data = await api.get('/admin/users');

      setUsers(
        Array.isArray(data)
          ? data.map(normalizeUser)
          : []
      );
    } catch (error) {
      setLoadError(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        String(user.userId).includes(query) ||
        `${user.firstName || ''} ${user.lastName || ''}`
          .toLowerCase()
          .includes(query) ||
        (user.email || '').toLowerCase().includes(query);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'staff' && user.userType === 'staff') ||
        (filter === 'customer' && user.userType === 'customer') ||
        (filter === 'active' && user.isActive) ||
        (filter === 'inactive' && !user.isActive);

      return matchesSearch && matchesFilter;
    });
  }, [users, search, filter]);

  function openEditUser(user) {
    setEditingUser(user);
    setForm({
      role: user.role || '',
      isActive: user.isActive,
    });
    setFieldErrors({});
    setSubmitError(null);
    setModalOpened(true);
  }

  function closeModal() {
    if (submitting) return;

    setModalOpened(false);
    setEditingUser(null);
    setForm({ ...initialForm });
    setFieldErrors({});
    setSubmitError(null);
  }

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [name]: undefined,
    }));
  }

  function applyUpdatedUser(updatedUser) {
    setUsers((current) =>
      current.map((user) =>
        user.userId === updatedUser.userId
          ? { ...user, ...normalizeUser(updatedUser) }
          : user
      )
    );
  }

  async function saveUserChanges(payload) {
    const updatedUser = await api.patch(
      `/admin/users/${editingUser.userId}`,
      payload
    );

    applyUpdatedUser(updatedUser);

    setModalOpened(false);
    setEditingUser(null);
    setForm({ ...initialForm });
    setFieldErrors({});
    setSubmitError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!editingUser || submitting) return;

    setSubmitError(null);
    setFieldErrors({});

    const payload = {};

    if (
      editingUser.userType === 'staff' &&
      form.role !== editingUser.role
    ) {
      payload.role = form.role;
    }

    if (form.isActive !== editingUser.isActive) {
      payload.isActive = form.isActive;
    }

    if (Object.keys(payload).length === 0) {
      closeModal();
      return;
    }

    if (
      editingUser.userId === currentUser?.userId &&
      payload.isActive === false
    ) {
      setFieldErrors({
        isActive: 'You cannot deactivate your own account',
      });
      return;
    }

    if (payload.isActive === false) {
      setPendingChange({
        user: editingUser,
        payload,
      });
      setConfirmOpened(true);
      return;
    }

    try {
      setSubmitting(true);
      await saveUserChanges(payload);
    } catch (error) {
      setSubmitError(error);

      if (error.fields) {
        setFieldErrors(error.fields);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDeactivation() {
    if (!pendingChange || submitting) return;

    try {
      setSubmitting(true);
      setActionError(null);
      setSubmitError(null);

      const updatedUser = await api.patch(
        `/admin/users/${pendingChange.user.userId}`,
        pendingChange.payload
      );

      applyUpdatedUser(updatedUser);

      setConfirmOpened(false);
      setPendingChange(null);
      setModalOpened(false);
      setEditingUser(null);
      setForm({ ...initialForm });
      setFieldErrors({});
    } catch (error) {
      setActionError(error);
      setConfirmOpened(false);
      setPendingChange(null);
    } finally {
      setSubmitting(false);
    }
  }

  const columns = [
    {
      key: 'userId',
      label: 'ID',
      sortable: true,
    },
    {
      key: 'firstName',
      label: 'User',
      sortable: true,
      render: (user) => (
        <Stack gap={0}>
          <Text size="sm" fw={500}>
            {user.firstName} {user.lastName}
          </Text>
          <Text size="xs" c="dimmed">
            {user.email}
          </Text>
        </Stack>
      ),
    },
    {
      key: 'userType',
      label: 'Account Type',
      sortable: true,
      render: (user) => (
        <Badge
          color={user.userType === 'staff' ? 'gray' : 'blue'}
          variant="light"
        >
          {user.userType}
        </Badge>
      ),
    },
    {
      key: 'role',
      label: 'Staff Role',
      sortable: true,
      render: (user) => (
        <Text size="sm">
          {user.userType === 'staff'
            ? roleLabel(user.role)
            : '—'}
        </Text>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (user) => (
        <Badge
          color={user.isActive ? 'green' : 'red'}
          variant="light"
        >
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user) => (
        <Button
          variant="light"
          size="xs"
          leftSection={<IconEdit size={14} />}
          onClick={() => openEditUser(user)}
        >
          Manage
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <LoadingSpinner
        fullPage
        label="Loading users..."
      />
    );
  }

  return (
    <Container size="xl" py="xl">
      <PageHeader
        title="User Management"
        subtitle="Manage staff roles and account activation."
        crumbs={[
          { label: 'Staff', to: '/staff' },
          { label: 'User Management' },
        ]}
        right={
          <Button
            variant="default"
            leftSection={<IconRefresh size={16} />}
            onClick={loadUsers}
          >
            Refresh
          </Button>
        }
      />

      {loadError ? (
        <ErrorAlert
          error={loadError}
          title="Could not load users"
          onRetry={loadUsers}
        />
      ) : (
        <Stack gap="md">
          {actionError && (
            <ErrorAlert
              error={actionError}
              title="Could not update user"
            />
          )}

          <Paper withBorder radius="md" p="md">
            <Group mb="md" grow align="flex-end">
              <TextInput
                label="Search users"
                placeholder="Name, email or ID"
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(event) =>
                  setSearch(event.currentTarget.value)
                }
              />

              <Select
                label="Filter users"
                data={[
                  { value: 'all', label: 'All Users' },
                  { value: 'staff', label: 'Staff' },
                  { value: 'customer', label: 'Customers' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
                value={filter}
                onChange={(value) => setFilter(value || 'all')}
                allowDeselect={false}
              />
            </Group>

            <Group justify="space-between" mb="md">
              <Text fw={600}>Users</Text>
              <Text size="sm" c="dimmed">
                {filteredUsers.length} of {users.length} users
              </Text>
            </Group>

            <DataTable
              columns={columns}
              data={filteredUsers}
              emptyMessage="No users found"
            />
          </Paper>
        </Stack>
      )}

      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title="Manage User"
        centered
        closeOnClickOutside={!submitting && !confirmOpened}
        closeOnEscape={!submitting && !confirmOpened}
      >
        {editingUser && (
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              {submitError && (
                <ErrorAlert
                  error={submitError}
                  title="Could not update user"
                />
              )}

              <Stack gap={0}>
                <Text fw={600}>
                  {editingUser.firstName} {editingUser.lastName}
                </Text>
                <Text size="sm" c="dimmed">
                  {editingUser.email}
                </Text>
                <Text size="xs" c="dimmed">
                  User ID: {editingUser.userId}
                </Text>
              </Stack>

              {editingUser.userType === 'staff' && (
                <Select
                  label="Staff Role"
                  data={roleOptions}
                  value={form.role}
                  onChange={(value) =>
                    updateField('role', value || '')
                  }
                  error={fieldErrors.role}
                  allowDeselect={false}
                  required
                />
              )}

              <Switch
                label="Account Active"
                description={
                  editingUser.userId === currentUser?.userId
                    ? 'You cannot deactivate your own account.'
                    : 'Inactive users cannot log in or access protected APIs.'
                }
                checked={form.isActive}
                disabled={
                  editingUser.userId === currentUser?.userId
                }
                onChange={(event) =>
                  updateField(
                    'isActive',
                    event.currentTarget.checked
                  )
                }
                error={fieldErrors.isActive}
              />

              <Group justify="flex-end" mt="sm">
                <Button
                  variant="default"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </Button>

                <Button type="submit" loading={submitting}>
                  Save Changes
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Modal>

      <Modal
        opened={confirmOpened}
        onClose={() => {
          if (!submitting) {
            setConfirmOpened(false);
            setPendingChange(null);
          }
        }}
        title="Confirm Account Deactivation"
        centered
        closeOnClickOutside={!submitting}
        closeOnEscape={!submitting}
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to deactivate{' '}
            <Text span fw={600}>
              {pendingChange?.user.firstName}{' '}
              {pendingChange?.user.lastName}
            </Text>
            ?
          </Text>

          <Text size="sm" c="dimmed">
            This user will no longer be able to log in or
            access protected endpoints until reactivated.
          </Text>

          <Group justify="flex-end">
            <Button
              variant="default"
              disabled={submitting}
              onClick={() => {
                setConfirmOpened(false);
                setPendingChange(null);
              }}
            >
              Cancel
            </Button>

            <Button
              color="red"
              loading={submitting}
              onClick={confirmDeactivation}
            >
              Deactivate Account
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}


import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Container,
  Group,
  Modal,
  Paper,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import {
  IconEdit,
  IconPlus,
  IconRefresh,
} from '@tabler/icons-react';

import { api } from '../../api/client';
import {
  DataTable,
  ErrorAlert,
  LoadingSpinner,
} from '../../components/ui';
import PageHeader from '../../components/layout/PageHeader';

const initialForm = {
  cityName: '',
  isMainCity: false,
};

export default function CityManagementPage() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [modalOpened, setModalOpened] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [updatingCityId, setUpdatingCityId] = useState(null);
  const [actionError, setActionError] = useState(null);

  async function loadCities() {
    try {
      setLoading(true);
      setLoadError(null);

      const data = await api.get('/admin/cities');

      setCities(
        Array.isArray(data)
          ? data.map((city) => ({
              ...city,
              isMainCity: Boolean(city.isMainCity),
            }))
          : []
      );
    } catch (error) {
      setLoadError(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCities();
  }, []);

  function openAddCity() {
    setEditingCity(null);
    setForm({ ...initialForm });
    setFieldErrors({});
    setSubmitError(null);
    setModalOpened(true);
  }

  function openEditCity(city) {
    setEditingCity(city);
    setForm({
      cityName: city.cityName,
      isMainCity: Boolean(city.isMainCity),
    });
    setFieldErrors({});
    setSubmitError(null);
    setModalOpened(true);
  }

  function closeModal() {
    if (submitting) return;

    setModalOpened(false);
    setEditingCity(null);
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

  function validate() {
    const errors = {};

    if (!form.cityName.trim()) {
      errors.cityName = 'City name is required';
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitError(null);

    if (!validate()) return;

    const payload = {
      cityName: form.cityName.trim(),
      isMainCity: form.isMainCity,
    };

    try {
      setSubmitting(true);

      if (editingCity) {
        await api.patch(
          `/admin/cities/${editingCity.cityId}`,
          payload
        );
      } else {
        await api.post('/admin/cities', payload);
      }

      const updatedCities = await api.get('/admin/cities');

      setCities(
        Array.isArray(updatedCities)
          ? updatedCities.map((city) => ({
              ...city,
              isMainCity: Boolean(city.isMainCity),
            }))
          : []
      );

      setModalOpened(false);
      setEditingCity(null);
      setForm({ ...initialForm });
      setFieldErrors({});
    } catch (error) {
      setSubmitError(error);

      if (error.fields) {
        setFieldErrors((current) => ({
          ...current,
          ...error.fields,
        }));
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(city, checked) {
    setActionError(null);

    try {
      setUpdatingCityId(city.cityId);

      await api.patch(`/admin/cities/${city.cityId}`, {
        cityName: city.cityName,
        isMainCity: checked,
      });

      setCities((current) =>
        current.map((item) =>
          item.cityId === city.cityId
            ? { ...item, isMainCity: checked }
            : item
        )
      );
    } catch (error) {
      setActionError(error);
    } finally {
      setUpdatingCityId(null);
    }
  }

  const columns = [
    {
      key: 'cityId',
      label: 'City ID',
      sortable: true,
    },
    {
      key: 'cityName',
      label: 'City Name',
      sortable: true,
    },
    {
      key: 'isMainCity',
      label: 'Status',
      render: (city) => (
        <Badge
          color={city.isMainCity ? 'green' : 'gray'}
          variant="light"
        >
          {city.isMainCity ? 'Main City' : 'Other City'}
        </Badge>
      ),
    },
    {
      key: 'mainCityToggle',
      label: 'Main City',
      render: (city) => (
        <Switch
          checked={city.isMainCity}
          disabled={
            updatingCityId !== null || submitting
          }
          onChange={(event) =>
            handleToggle(
              city,
              event.currentTarget.checked
            )
          }
          aria-label={`Toggle main city status for ${city.cityName}`}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (city) => (
        <Button
          variant="light"
          size="xs"
          leftSection={<IconEdit size={14} />}
          onClick={() => openEditCity(city)}
          disabled={
            updatingCityId !== null || submitting
          }
        >
          Edit
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <LoadingSpinner
        fullPage
        label="Loading cities..."
      />
    );
  }

  return (
    <Container size="xl" py="xl">
      <PageHeader
        title="City Management"
        subtitle="Add cities and manage main-city availability."
        crumbs={[
          { label: 'Staff', to: '/staff' },
          { label: 'City Management' },
        ]}
        right={
          <Group gap="sm">
            <Button
              variant="default"
              leftSection={<IconRefresh size={16} />}
              onClick={loadCities}
            >
              Refresh
            </Button>

            <Button
              leftSection={<IconPlus size={16} />}
              onClick={openAddCity}
            >
              Add City
            </Button>
          </Group>
        }
      />

      {loadError ? (
        <ErrorAlert
          error={loadError}
          title="Could not load cities"
          onRetry={loadCities}
        />
      ) : (
        <Stack gap="md">
          {actionError && (
            <ErrorAlert
              error={actionError}
              title="Could not update city"
            />
          )}

          <Paper withBorder radius="md" p="md">
            <Group justify="space-between" mb="md">
              <Text fw={600}>Cities</Text>
              <Text size="sm" c="dimmed">
                {cities.length} total
              </Text>
            </Group>

            <DataTable
              columns={columns}
              data={cities}
              emptyMessage="No cities found"
            />
          </Paper>
        </Stack>
      )}

      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={editingCity ? 'Edit City' : 'Add City'}
        centered
        closeOnClickOutside={!submitting}
        closeOnEscape={!submitting}
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            {submitError && !submitError.fields && (
              <ErrorAlert
                error={submitError}
                title={
                  editingCity
                    ? 'Could not update city'
                    : 'Could not add city'
                }
              />
            )}

            <TextInput
              label="City name"
              placeholder="Enter city name"
              value={form.cityName}
              onChange={(event) =>
                updateField(
                  'cityName',
                  event.currentTarget.value
                )
              }
              error={fieldErrors.cityName}
              required
            />

            <Switch
              label="Main City"
              description="Enable if this city is a main delivery city."
              checked={form.isMainCity}
              onChange={(event) =>
                updateField(
                  'isMainCity',
                  event.currentTarget.checked
                )
              }
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
                {editingCity ? 'Save Changes' : 'Add City'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}

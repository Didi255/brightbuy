import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Container,
  Grid,
  Group,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconMapPin, IconPlus } from '@tabler/icons-react';

import { api } from '../../api/client';
import {
  EmptyState,
  ErrorAlert,
  LoadingSpinner,
} from '../../components/ui';
import PageHeader from '../../components/layout/PageHeader';

const initialForm = {
  houseNum: '',
  address1: '',
  address2: '',
  address3: '',
  cityId: '',
};

export default function AddressBookPage() {
  const [addresses, setAddresses] = useState([]);
  const [cities, setCities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [modalOpened, setModalOpened] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadPage() {
    try {
      setLoading(true);
      setLoadError(null);

      const [addressData, cityData] = await Promise.all([
        api.get('/me/addresses'),
        api.get('/cities'),
      ]);

      setAddresses(Array.isArray(addressData) ? addressData : []);
      setCities(Array.isArray(cityData) ? cityData : []);
    } catch (error) {
      setLoadError(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

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

    if (!form.houseNum.trim()) {
      errors.houseNum = 'House number is required';
    }

    if (!form.address1.trim()) {
      errors.address1 = 'Address line 1 is required';
    }

    if (!form.cityId) {
      errors.cityId = 'City is required';
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  function openAddAddress() {
    setForm(initialForm);
    setFieldErrors({});
    setSubmitError(null);
    setModalOpened(true);
  }

  function closeAddAddress() {
    if (submitting) return;

    setModalOpened(false);
    setForm(initialForm);
    setFieldErrors({});
    setSubmitError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitError(null);

    if (!validate()) return;

    try {
      setSubmitting(true);

      await api.post('/me/addresses', {
        cityId: Number(form.cityId),
        houseNum: form.houseNum.trim(),
        address1: form.address1.trim(),
        address2: form.address2.trim() || undefined,
        address3: form.address3.trim() || undefined,
      });

      const updatedAddresses = await api.get('/me/addresses');

      setAddresses(
        Array.isArray(updatedAddresses) ? updatedAddresses : []
      );

      setModalOpened(false);
      setForm(initialForm);
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

  if (loading) {
    return (
      <LoadingSpinner
        fullPage
        label="Loading your addresses..."
      />
    );
  }

  return (
    <Container size="lg" py="xl">
      <PageHeader
        title="My Addresses"
        subtitle="Manage your saved delivery addresses."
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Account', to: '/account' },
          { label: 'Addresses' },
        ]}
        right={
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={openAddAddress}
          >
            Add Address
          </Button>
        }
      />

      {loadError ? (
        <ErrorAlert
          error={loadError}
          title="Could not load addresses"
          onRetry={loadPage}
        />
      ) : addresses.length === 0 ? (
        <Paper withBorder radius="md">
          <EmptyState
            title="No saved addresses"
            description="Add a delivery address to use during checkout."
          />
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {addresses.map((address) => (
            <Card
              key={address.addressId}
              withBorder
              radius="md"
              padding="lg"
            >
              <Stack gap="xs">
                <Group gap="xs">
                  <IconMapPin size={20} />
                  <Title order={4}>
                    {address.cityName}
                  </Title>
                </Group>

                <Text size="sm">
                  {address.houseNum}
                </Text>

                <Text size="sm">
                  {address.address1}
                </Text>

                {address.address2 && (
                  <Text size="sm">
                    {address.address2}
                  </Text>
                )}

                {address.address3 && (
                  <Text size="sm">
                    {address.address3}
                  </Text>
                )}

                <Text size="sm" c="dimmed">
                  {address.cityName}
                </Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Modal
        opened={modalOpened}
        onClose={closeAddAddress}
        title="Add Delivery Address"
        centered
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            {submitError && !submitError.fields && (
              <ErrorAlert
                error={submitError}
                title="Could not add address"
              />
            )}

            <Grid>
              <Grid.Col span={{ base: 12, sm: 5 }}>
                <TextInput
                  label="House number"
                  placeholder="42"
                  value={form.houseNum}
                  onChange={(event) =>
                    updateField(
                      'houseNum',
                      event.currentTarget.value
                    )
                  }
                  error={fieldErrors.houseNum}
                  required
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 7 }}>
                <Select
                  label="City"
                  placeholder="Select city"
                  searchable
                  data={cities.map((city) => ({
                    value: String(city.cityId),
                    label: city.cityName,
                  }))}
                  value={form.cityId}
                  onChange={(value) =>
                    updateField('cityId', value || '')
                  }
                  error={fieldErrors.cityId}
                  required
                />
              </Grid.Col>
            </Grid>

            <TextInput
              label="Address line 1"
              placeholder="Oak Street"
              value={form.address1}
              onChange={(event) =>
                updateField(
                  'address1',
                  event.currentTarget.value
                )
              }
              error={fieldErrors.address1}
              required
            />

            <TextInput
              label="Address line 2"
              placeholder="Apartment, building, etc."
              value={form.address2}
              onChange={(event) =>
                updateField(
                  'address2',
                  event.currentTarget.value
                )
              }
              error={fieldErrors.address2}
            />

            <TextInput
              label="Address line 3"
              placeholder="Additional address information"
              value={form.address3}
              onChange={(event) =>
                updateField(
                  'address3',
                  event.currentTarget.value
                )
              }
              error={fieldErrors.address3}
            />

            <Group justify="flex-end" mt="sm">
              <Button
                variant="default"
                onClick={closeAddAddress}
                disabled={submitting}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                loading={submitting}
              >
                Add Address
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
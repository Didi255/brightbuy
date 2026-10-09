import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import {
  IconCheck,
  IconMapPin,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';

import { api } from '../../api/client';
import {
  ErrorAlert,
  LoadingSpinner,
} from '../../components/ui';
import PageHeader from '../../components/layout/PageHeader';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  async function loadProfile() {
    try {
      setLoading(true);
      setLoadError(null);

      const data = await api.get('/me');

      setProfile(data);

      setForm({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
      });
    } catch (error) {
      setLoadError(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
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

    setSaved(false);
  }

  function validate() {
    const errors = {};

    if (!form.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!form.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitError(null);
    setSaved(false);

    if (!validate()) return;

    try {
      setSubmitting(true);

      const updatedProfile = await api.put('/me', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || null,
      });

      setProfile(updatedProfile);

      setForm({
        firstName: updatedProfile.firstName || '',
        lastName: updatedProfile.lastName || '',
        phone: updatedProfile.phone || '',
      });

      setSaved(true);
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
        label="Loading your profile..."
      />
    );
  }

  if (loadError) {
    return (
      <Container size="md" py="xl">
        <PageHeader
          title="My Profile"
          crumbs={[
            { label: 'Home', to: '/' },
            { label: 'Account' },
          ]}
        />

        <ErrorAlert
          error={loadError}
          title="Could not load profile"
          onRetry={loadProfile}
        />
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <PageHeader
        title="My Profile"
        subtitle="View and update your account information."
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Account' },
        ]}
      />

      <Stack gap="lg">
        {saved && (
          <Alert
            icon={<IconCheck size={18} />}
            title="Profile updated"
            color="green"
          >
            Your account information has been saved.
          </Alert>
        )}

        <Paper
          withBorder
          radius="md"
          p="xl"
        >
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput
                  label="First name"
                  value={form.firstName}
                  onChange={(event) =>
                    updateField(
                      'firstName',
                      event.currentTarget.value
                    )
                  }
                  error={fieldErrors.firstName}
                  required
                />

                <TextInput
                  label="Last name"
                  value={form.lastName}
                  onChange={(event) =>
                    updateField(
                      'lastName',
                      event.currentTarget.value
                    )
                  }
                  error={fieldErrors.lastName}
                  required
                />
              </SimpleGrid>

              <TextInput
                label="Email"
                value={profile?.email || ''}
                disabled
                description="Your email address cannot be changed here."
              />

              <TextInput
                label="Phone number"
                placeholder="0771234567"
                value={form.phone}
                onChange={(event) =>
                  updateField(
                    'phone',
                    event.currentTarget.value
                  )
                }
                error={fieldErrors.phone}
              />

              {submitError && !submitError.fields && (
                <ErrorAlert
                  error={submitError}
                  title="Could not update profile"
                />
              )}

              <Group justify="flex-end" mt="sm">
                <Button
                  type="submit"
                  loading={submitting}
                >
                  Save Changes
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>

        <Paper
          withBorder
          radius="md"
          p="lg"
        >
          <Group justify="space-between">
            <div>
              <Text fw={600}>
                Delivery Addresses
              </Text>

              <Text size="sm" c="dimmed">
                View or add addresses for your orders.
              </Text>
            </div>

            <Button
              component={Link}
              to="/account/addresses"
              variant="light"
              leftSection={<IconMapPin size={16} />}
            >
              Manage Addresses
            </Button>
          </Group>
        </Paper>
      </Stack>
    </Container>
  );
}
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Anchor,
  Button,
  Container,
  Paper,
  PasswordInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';

import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { ErrorAlert, LoadingSpinner } from '../../components/ui';
import PageHeader from '../../components/layout/PageHeader';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  houseNum: '',
  address1: '',
  cityId: '',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citiesError, setCitiesError] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadCities() {
      try {
        setCitiesLoading(true);
        setCitiesError(null);

        const data = await api.get('/cities');

        setCities(Array.isArray(data) ? data : []);
      } catch (error) {
        setCitiesError(error);
      } finally {
        setCitiesLoading(false);
      }
    }

    loadCities();
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

    if (!form.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!form.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!form.email.trim()) {
      errors.email = 'Email is required';
    }

    if (!form.password) {
      errors.password = 'Password is required';
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

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitError(null);

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);

      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        address: {
          houseNum: form.houseNum.trim() || undefined,
          address1: form.address1.trim(),
          cityId: Number(form.cityId),
        },
      });

      navigate('/', { replace: true });
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

  if (citiesLoading) {
    return (
      <LoadingSpinner
        fullPage
        label="Loading registration form..."
      />
    );
  }

  return (
    <Container size="sm" py="xl">
      <PageHeader
        title="Create Account"
        subtitle="Create your BrightBuy customer account."
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Register' },
        ]}
      />

      <Paper withBorder radius="md" p="xl">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            {citiesError && (
              <ErrorAlert
                error={citiesError}
                title="Could not load cities"
              />
            )}

            {submitError && !submitError.fields && (
              <ErrorAlert
                error={submitError}
                title="Registration failed"
              />
            )}

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput
                label="First name"
                placeholder="Ann"
                value={form.firstName}
                onChange={(event) =>
                  updateField('firstName', event.currentTarget.value)
                }
                error={fieldErrors.firstName}
                required
              />

              <TextInput
                label="Last name"
                placeholder="Perera"
                value={form.lastName}
                onChange={(event) =>
                  updateField('lastName', event.currentTarget.value)
                }
                error={fieldErrors.lastName}
                required
              />
            </SimpleGrid>

            <TextInput
              label="Email"
              type="email"
              placeholder="ann@example.com"
              value={form.email}
              onChange={(event) =>
                updateField('email', event.currentTarget.value)
              }
              error={fieldErrors.email}
              required
            />

            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(event) =>
                updateField('password', event.currentTarget.value)
              }
              error={fieldErrors.password}
              required
            />

            <TextInput
              label="Phone"
              placeholder="0771234567"
              value={form.phone}
              onChange={(event) =>
                updateField('phone', event.currentTarget.value)
              }
              error={fieldErrors.phone}
            />

            <Text fw={600} mt="xs">
              Address
            </Text>

            <TextInput
              label="House number"
              placeholder="42"
              value={form.houseNum}
              onChange={(event) =>
                updateField('houseNum', event.currentTarget.value)
              }
              error={fieldErrors.houseNum}
            />

            <TextInput
              label="Address line 1"
              placeholder="Oak Street"
              value={form.address1}
              onChange={(event) =>
                updateField('address1', event.currentTarget.value)
              }
              error={fieldErrors.address1}
              required
            />

            <Select
              label="City"
              placeholder="Select your city"
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
              disabled={Boolean(citiesError)}
              required
            />

            <Button
              type="submit"
              loading={submitting}
              disabled={Boolean(citiesError)}
              fullWidth
              mt="sm"
            >
              Create Account
            </Button>

            <Text size="sm" ta="center" c="dimmed">
              Already have an account?{' '}
              <Anchor component={Link} to="/login">
                Sign in
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Anchor,
  Button,
  Container,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';

import { useAuth } from '../../context/AuthContext';
import { ErrorAlert } from '../../components/ui';
import PageHeader from '../../components/layout/PageHeader';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState({});
  const [loginError, setLoginError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const errors = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoginError(null);

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);

      const user = await login(email.trim(), password);

      // If ProtectedRoute sent the user here,
      // return them to the page they originally requested.
      const requestedPath = location.state?.from?.pathname;

      // Never send a normal customer into a staff route.
      if (
        requestedPath?.startsWith('/staff') &&
        user.userType !== 'staff'
      ) {
        navigate('/', { replace: true });
        return;
      }

      navigate(
        requestedPath || (user.userType === 'staff' ? '/staff' : '/'),
        { replace: true },
      );
    } catch {
      // Deliberately vague login failure.
      // Do not reveal whether the email or password was wrong.
      setLoginError(
        new Error('Invalid email or password'),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container size="xs" py="xl">
      <PageHeader
        title="Sign In"
        subtitle="Sign in to your BrightBuy account."
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Sign In' },
        ]}
      />

      <Paper withBorder shadow="sm" radius="md" p="xl">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            {loginError && (
              <ErrorAlert
                error={loginError}
                title="Sign in failed"
              />
            )}

            <TextInput
              label="Email"
              type="email"
              placeholder="ann@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.currentTarget.value);

                setFieldErrors((current) => ({
                  ...current,
                  email: undefined,
                }));

                setLoginError(null);
              }}
              error={fieldErrors.email}
              autoComplete="email"
              required
            />

            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => {
                setPassword(event.currentTarget.value);

                setFieldErrors((current) => ({
                  ...current,
                  password: undefined,
                }));

                setLoginError(null);
              }}
              error={fieldErrors.password}
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              loading={submitting}
              fullWidth
            >
              Sign In
            </Button>

            <Text size="sm" ta="center" c="dimmed">
              Don't have an account?{' '}
              <Anchor component={Link} to="/register">
                Create an account
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
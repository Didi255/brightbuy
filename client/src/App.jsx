import { useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { api } from './api/client';

/**
 * Walking skeleton. If the banner is green, the full path works:
 *   React -> Vite proxy -> Express -> mysql2 pool -> MySQL
 * Everything else in this project is a variation on that path.
 *
 * TODO: replace this with <AppRoutes /> once routing lands.
 */
function HealthBanner() {
  const [state, setState] = useState({ status: 'checking' });

  useEffect(() => {
    api.get('/health')
      .then((d) => setState({ status: 'ok', d }))
      .catch((e) => setState({ status: 'error', message: e.message }));
  }, []);

  const styles = {
    checking: { background: '#f1f5f9', color: '#334155' },
    ok:       { background: '#dcfce7', color: '#166534' },
    error:    { background: '#fee2e2', color: '#991b1b' },
  }[state.status];

  return (
    <div style={{ ...styles, padding: '1rem 1.25rem', borderRadius: 8, fontFamily: 'system-ui' }}>
      {state.status === 'checking' && 'Checking API...'}
      {state.status === 'ok' && `API + database reachable (api: ${state.d.api}, db: ${state.d.database})`}
      {state.status === 'error' && `Cannot reach API: ${state.message}`}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <main style={{ maxWidth: 880, margin: '3rem auto', padding: '0 1rem', fontFamily: 'system-ui' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>BrightBuy</h1>
        <p style={{ color: '#64748b', marginTop: 0 }}>Group 13 · University of Moratuwa</p>
        <HealthBanner />
      </main>
    </AuthProvider>
  );
}

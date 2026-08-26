/**
 * Shared API client — OWNER: M3.
 * Everyone calls the backend through this. It attaches the JWT and unwraps
 * the shared error envelope, so no feature has to re-implement either.
 */
const BASE = '/api';

let token = localStorage.getItem('bb_token') || null;
export function setToken(t) {
  token = t;
  if (t) localStorage.setItem('bb_token', t);
  else localStorage.removeItem('bb_token');
}

async function request(path, { method = 'GET', body, ...rest } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...rest,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const e = data?.error || {};
    const err = new Error(e.message || `Request failed (${res.status})`);
    err.code = e.code;
    err.fields = e.fields;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get:   (p)       => request(p),
  post:  (p, body) => request(p, { method: 'POST', body }),
  patch: (p, body) => request(p, { method: 'PATCH', body }),
  put:   (p, body) => request(p, { method: 'PUT', body }),
  del:   (p)       => request(p, { method: 'DELETE' }),
};

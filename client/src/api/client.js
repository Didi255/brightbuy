/**
 * Shared API client — OWNER: M3.
 * Everyone calls the backend through this. It attaches the JWT and unwraps
 * the shared error envelope, so no feature has to re-implement either.
 */
const BASE = '/api';

let token = localStorage.getItem('bb_token') || null; // Local storage survives page refreshes because of this token.
export function setToken(t) {
  token = t;
  if (t) localStorage.setItem('bb_token', t);
  else localStorage.removeItem('bb_token'); // remove the token when user logs out
}

export function getCartSession() {
  let s = localStorage.getItem('bb_cart_session');
  if (!s) {
    s = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID() // This becomes the guest's cart session identifier.
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('bb_cart_session', s);
  }
  return s;// If there is already created cart session id or a newly created cart session id it will be returned. 
}

export function clearCartSession() {
  localStorage.removeItem('bb_cart_session');//This can be useful after the guest cart has been dealt with during login/signup(merge logic).
}


//Evry HTTP request comes through this function
async function request(path, { method = 'GET', body, headers = {}, ...rest } = {}) {
  const sessionToken = localStorage.getItem('bb_cart_session') || (!token ? getCartSession() : null);

  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(sessionToken ? { 'X-Cart-Session': sessionToken } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...rest,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) { //This handles backend errors.
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
  get: (p, options) => request(p, { ...options, method: 'GET' }),
  post: (p, body, options) => request(p, { ...options, method: 'POST', body }),
  patch: (p, body, options) => request(p, { ...options, method: 'PATCH', body }),
  put: (p, body, options) => request(p, { ...options, method: 'PUT', body }),
  del: (p, options) => request(p, { ...options, method: 'DELETE' }),
};

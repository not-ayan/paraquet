const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Same wrapper as the main frontend's lib/api.js. Every call here needs a
 * token — there's no public admin endpoint — and the backend's requireAdmin
 * middleware is the real enforcement; a 403 here means "signed in but not
 * an admin," which the UI surfaces as a plain error rather than crashing.
 */
export async function apiFetch(path, { token, ...options } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  if (typeof window !== 'undefined' && window.Clerk?.user) {
    const cu = window.Clerk.user;
    const email = cu.primaryEmailAddress?.emailAddress;
    const name = cu.fullName || cu.firstName || cu.username;
    if (email) headers['x-user-email'] = encodeURIComponent(email);
    if (name) headers['x-user-name'] = encodeURIComponent(name);
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

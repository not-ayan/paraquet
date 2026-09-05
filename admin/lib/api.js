const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Same wrapper as the main frontend's lib/api.js. Every call here needs a
 * token — there's no public admin endpoint — and the backend's requireAdmin
 * middleware is the real enforcement; a 403 here means "signed in but not
 * an admin," which the UI surfaces as a plain error rather than crashing.
 */
function authHeaders(token, extra) {
  const headers = { ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;

  if (typeof window !== 'undefined' && window.Clerk?.user) {
    const cu = window.Clerk.user;
    const email = cu.primaryEmailAddress?.emailAddress;
    const name = cu.fullName || cu.firstName || cu.username;
    if (email) headers['x-user-email'] = encodeURIComponent(email);
    if (name) headers['x-user-name'] = encodeURIComponent(name);
  }
  return headers;
}

export async function apiFetch(path, { token, ...options } = {}) {
  const headers = authHeaders(token, { 'Content-Type': 'application/json', ...(options.headers || {}) });

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

/**
 * Fetches a file response (e.g. a CSV export) and saves it via the browser's
 * download flow, using the server's suggested filename from Content-Disposition
 * unless one is passed explicitly.
 */
export async function downloadFile(path, { token, filename } = {}) {
  const headers = authHeaders(token);

  const res = await fetch(`${API_URL}${path}`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const finalName = filename || match?.[1] || 'download';

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = finalName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

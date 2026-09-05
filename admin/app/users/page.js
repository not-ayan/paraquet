'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '../../lib/api';

export default function UsersPage() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const qs = q ? `?q=${encodeURIComponent(q)}` : '';
      const data = await apiFetch(`/api/admin/users${qs}`, { token });
      setUsers(data);
    } catch (err) {
      setError(err.message);
    }
  }, [getToken, q]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="container">
      <h1>Users</h1>
      <div className="filters">
        <input
          type="text"
          placeholder="Search name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {error && <p className="error">{error}</p>}
      {users.length === 0 && !error && <p className="empty">No users found.</p>}
      {users.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name || '—'}</td>
                <td>{u.email}</td>
                <td><span className="badge">{u.role}</span></td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ marginTop: 20, color: '#888', fontSize: '0.85rem' }}>
        To promote someone to admin, edit their <code>role</code> field directly in MongoDB Atlas — there&apos;s no self-service promotion endpoint by design.
      </p>
    </div>
  );
}

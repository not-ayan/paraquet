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
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge user">Verified Accounts: {users.length}</span>
        </div>
        <h1 className="page-title">User Directory</h1>
        <p className="page-desc">
          Search and view all students, faculty, and administrative staff members registered on the platform.
        </p>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search by name or campus email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ width: 320 }}
        />
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {users.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <div className="empty-title">No users found</div>
          <div className="empty-text">No accounts matched your search query "{q}".</div>
        </div>
      )}

      {users.length > 0 && (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Platform Role</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Identifier</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const initials = (u.name || u.email || 'U').slice(0, 2).toUpperCase();
                return (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.name || 'User'}
                            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: u.role === 'admin' ? '#ede9fe' : '#e2e8f0',
                            color: u.role === 'admin' ? '#6d28d9' : '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.78rem'
                          }}>
                            {initials}
                          </div>
                        )}
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {u.name || 'Anonymous User'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)' }}>{u.email}</span>
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'admin' : 'user'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <code>{u.clerkId ? u.clerkId.slice(0, 14) + '...' : '—'}</code>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{
        marginTop: 24,
        padding: '12px 18px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.84rem',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        <span>💡</span>
        <span>
          <strong>Admin Access Control:</strong> To promote or demote an account, update the <code>role</code> property in your database. Self-service role promotion is disabled by design.
        </span>
      </div>
    </div>
  );
}

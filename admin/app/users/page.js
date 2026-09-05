'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '../../lib/api';
import { IconAlertTriangle, IconUsers, IconInfo, IconRefresh } from '../icons';

export default function UsersPage() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const qs = q ? `?q=${encodeURIComponent(q)}` : '';
      const data = await apiFetch(`/api/admin/users${qs}`, { token });
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, q]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="container">
      <div className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="brand-tag">Tezpur University · User Directory</span>
            <span className="badge user">Verified Accounts: {users.length}</span>
          </div>
          <h1 className="page-title">User Directory</h1>
          <p className="page-desc">
            Search and view all students, faculty, and administrative staff members registered on the platform.
          </p>
        </div>

        <div className="dash-header-actions">
          <button type="button" className="btn secondary" onClick={load} disabled={loading}>
            <IconRefresh />
            {loading ? 'Refreshing…' : 'Refresh Users'}
          </button>
        </div>
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
          <IconAlertTriangle />
          <span>{error}</span>
        </div>
      )}

      {users.length === 0 && !error && !loading && (
        <div className="empty-state">
          <div className="empty-icon"><IconUsers /></div>
          <div className="empty-title">No users found</div>
          <div className="empty-text">No accounts matched your search query &ldquo;{q}&rdquo;.</div>
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
                            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                          />
                        ) : (
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: u.role === 'admin' ? 'var(--border-strong)' : 'var(--bg-surface-subtle)',
                            color: u.role === 'admin' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            border: '1px solid var(--border-subtle)'
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
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                        {new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <code>{u.clerkId ? u.clerkId.slice(0, 14) + '…' : '—'}</code>
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
        padding: '14px 18px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.84rem',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        <IconInfo />
        <span>
          <strong style={{ color: 'var(--text-primary)' }}>Admin Access Control:</strong> To promote or demote an account, update the <code>role</code> property in your database. Self-service role promotion is disabled by design.
        </span>
      </div>
    </div>
  );
}

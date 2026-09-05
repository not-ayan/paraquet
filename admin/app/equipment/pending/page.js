'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '../../../lib/api';

export default function PendingEquipmentPage() {
  const { getToken } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const data = await apiFetch('/api/admin/equipment/pending', { token });
      setItems(data);
    } catch (err) {
      setError(err.message);
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id, action) {
    setBusyId(id);
    try {
      const token = await getToken();
      await apiFetch(`/api/admin/equipment/${id}/${action}`, { method: 'PATCH', token });
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Permanently delete "${name}"? This action cannot be undone.`)) return;
    setBusyId(id);
    try {
      const token = await getToken();
      await apiFetch(`/api/admin/equipment/${id}`, { method: 'DELETE', token });
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge pending">Pending Moderation: {items.length}</span>
        </div>
        <h1 className="page-title">Pending Equipment Listings</h1>
        <p className="page-desc">
          Review community-submitted equipment, check specifications and photo guidelines, then approve to the active catalogue.
        </p>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {items.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <div className="empty-title">All listings moderated</div>
          <div className="empty-text">No equipment postings are waiting for approval right now.</div>
        </div>
      )}

      {items.length > 0 && (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Submitted</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                        />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                          📦
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.description ? item.description.slice(0, 50) + '...' : 'No description'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: '#f8fafc', color: 'var(--text-secondary)' }}>
                      {item.category || 'General'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{item.quantity}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        className="btn approve"
                        disabled={busyId === item._id}
                        onClick={() => act(item._id, 'approve')}
                      >
                        {busyId === item._id ? '...' : 'Approve'}
                      </button>
                      <button
                        className="btn reject"
                        disabled={busyId === item._id}
                        onClick={() => act(item._id, 'reject')}
                      >
                        {busyId === item._id ? '...' : 'Reject'}
                      </button>
                      <button
                        className="btn delete"
                        disabled={busyId === item._id}
                        onClick={() => handleDelete(item._id, item.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

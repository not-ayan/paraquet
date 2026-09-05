'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '../../../lib/api';
import { IconAlertTriangle, IconCheckCircle, IconPackage, IconRefresh } from '../../icons';

export default function PendingEquipmentPage() {
  const { getToken } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await apiFetch('/api/admin/equipment/pending', { token });
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      <div className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="brand-tag">Tezpur University · Inventory Moderation</span>
            <span className={`badge ${items.length > 0 ? 'pending' : 'approved'}`}>
              {items.length} {items.length === 1 ? 'Listing' : 'Listings'} Pending
            </span>
          </div>
          <h1 className="page-title">Pending Equipment Listings</h1>
          <p className="page-desc">
            Review community-submitted equipment, verify specifications and photo guidelines, then approve to the active campus catalogue.
          </p>
        </div>

        <div className="dash-header-actions">
          <button type="button" className="btn secondary" onClick={load} disabled={loading}>
            <IconRefresh />
            {loading ? 'Refreshing…' : 'Refresh Queue'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <IconAlertTriangle />
          <span>{error}</span>
        </div>
      )}

      {items.length === 0 && !error && !loading && (
        <div className="empty-state">
          <div className="empty-icon"><IconCheckCircle style={{ color: 'var(--color-success)' }} /></div>
          <div className="empty-title">All listings moderated</div>
          <div className="empty-text">No equipment postings are waiting for administrative review right now.</div>
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
                        <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: 'var(--text-muted)' }}>
                          <IconPackage />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.description ? item.description.slice(0, 60) + '…' : 'No description'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'var(--bg-surface-subtle)', color: 'var(--text-secondary)' }}>
                      {item.category || 'General'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{item.quantity}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
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
                        {busyId === item._id ? '…' : 'Approve'}
                      </button>
                      <button
                        className="btn reject"
                        disabled={busyId === item._id}
                        onClick={() => act(item._id, 'reject')}
                      >
                        {busyId === item._id ? '…' : 'Reject'}
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

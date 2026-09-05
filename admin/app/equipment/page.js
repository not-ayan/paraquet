'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '../../lib/api';

const AVAILABILITY_OPTIONS = ['available', 'booked', 'maintenance', 'retired'];

export default function AllEquipmentPage() {
  const { getToken } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [approvalFilter, setApprovalFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [maxDaysState, setMaxDaysState] = useState({});

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const qs = approvalFilter ? `?approvalStatus=${approvalFilter}` : '';
      const data = await apiFetch(`/api/admin/equipment${qs}`, { token });
      setItems(data);
    } catch (err) {
      setError(err.message);
    }
  }, [getToken, approvalFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateAvailability(id, availability) {
    setSavingId(id);
    try {
      const token = await getToken();
      const updated = await apiFetch(`/api/equipment/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ availability }),
      });
      setItems((prev) => prev.map((i) => (i._id === id ? updated : i)));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  async function updateMaxBorrowDays(id, daysVal) {
    const days = Math.max(1, Math.min(30, parseInt(daysVal, 10) || 3));
    setSavingId(id);
    setError(null);
    try {
      const token = await getToken();
      const updated = await apiFetch(`/api/equipment/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ maxBorrowDays: days }),
      });
      setItems((prev) => prev.map((i) => (i._id === id ? { ...i, maxBorrowDays: updated.maxBorrowDays || days } : i)));
      const itemName = items.find((x) => x._id === id)?.name || 'Equipment';
      setSuccessMsg(`Updated loan duration for "${itemName}" to ${days} days.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id, name) {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(id);
    setError(null);
    setSuccessMsg(null);
    try {
      const token = await getToken();
      await apiFetch(`/api/admin/equipment/${id}`, {
        method: 'DELETE',
        token,
      });
      setItems((prev) => prev.filter((i) => i._id !== id));
      setSuccessMsg(`"${name}" was permanently deleted.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.name?.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q);
  });

  return (
    <div className="container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge available">Total Catalogue: {items.length}</span>
        </div>
        <h1 className="page-title">Equipment Inventory</h1>
        <p className="page-desc">
          Manage campus items, set max allowable loan days (1–30 days), modify availability statuses, and manage catalogue health.
        </p>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Filter by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: 260 }}
        />
        <select value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value)}>
          <option value="">All Approval Statuses</option>
          <option value="pending">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="success-banner">
          <span>✓</span>
          <span>{successMsg}</span>
        </div>
      )}

      {filteredItems.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <div className="empty-title">No equipment found</div>
          <div className="empty-text">No equipment matches your current search or filter criteria.</div>
        </div>
      )}

      {filteredItems.length > 0 && (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Qty</th>
                <th>Max Loan Days</th>
                <th>Approval</th>
                <th>Availability</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
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
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.category || 'General'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{item.quantity}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        disabled={savingId === item._id || deletingId === item._id}
                        style={{ width: 60, textAlign: 'center', padding: '5px 6px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                        value={maxDaysState[item._id] ?? (item.maxBorrowDays || 3)}
                        onChange={(e) => setMaxDaysState((prev) => ({ ...prev, [item._id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateMaxBorrowDays(item._id, maxDaysState[item._id] ?? (item.maxBorrowDays || 3));
                          }
                        }}
                      />
                      <button
                        className="btn secondary"
                        style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                        disabled={savingId === item._id || deletingId === item._id}
                        onClick={() => updateMaxBorrowDays(item._id, maxDaysState[item._id] ?? (item.maxBorrowDays || 3))}
                        title="Save max allowable loan days"
                      >
                        {savingId === item._id ? '...' : 'Save'}
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${item.approvalStatus}`}>{item.approvalStatus}</span>
                  </td>
                  <td>
                    <select
                      value={item.availability}
                      disabled={savingId === item._id || deletingId === item._id}
                      onChange={(e) => updateAvailability(item._id, e.target.value)}
                      style={{ padding: '5px 10px', fontSize: '0.82rem' }}
                    >
                      {AVAILABILITY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn delete"
                      disabled={deletingId === item._id || savingId === item._id}
                      onClick={() => handleDelete(item._id, item.name)}
                      title={`Permanently delete ${item.name}`}
                    >
                      {deletingId === item._id ? 'Deleting...' : 'Delete'}
                    </button>
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

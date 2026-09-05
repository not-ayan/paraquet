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
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

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

  // Availability is a regular equipment field, not admin-only, so this goes
  // through PATCH /api/equipment/:id — the owner-or-admin check there lets
  // an admin edit any item.
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

  return (
    <div className="container">
      <h1>All Equipment</h1>
      <div className="filters">
        <select value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value)}>
          <option value="">All approval statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      {error && <p className="error">{error}</p>}
      {successMsg && <p style={{ color: '#0a7a2f', marginTop: 12, fontWeight: 500 }}>{successMsg}</p>}
      {items.length === 0 && !error && <p className="empty">No equipment matches this filter.</p>}
      {items.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Approval</th>
              <th>Availability</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>{item.quantity}</td>
                <td><span className={`badge ${item.approvalStatus}`}>{item.approvalStatus}</span></td>
                <td>
                  <select
                    value={item.availability}
                    disabled={savingId === item._id || deletingId === item._id}
                    onChange={(e) => updateAvailability(item._id, e.target.value)}
                  >
                    {AVAILABILITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    className="btn delete"
                    disabled={deletingId === item._id || savingId === item._id}
                    onClick={() => handleDelete(item._id, item.name)}
                    title={`Delete ${item.name}`}
                  >
                    {deletingId === item._id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

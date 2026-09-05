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
      <h1>Pending Equipment</h1>
      {error && <p className="error">{error}</p>}
      {items.length === 0 && !error && <p className="empty">Nothing waiting on approval.</p>}
      {items.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>{item.quantity}</td>
                <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn approve"
                    disabled={busyId === item._id}
                    onClick={() => act(item._id, 'approve')}
                  >
                    Approve
                  </button>
                  <button
                    className="btn reject"
                    disabled={busyId === item._id}
                    onClick={() => act(item._id, 'reject')}
                  >
                    Reject
                  </button>
                  <button
                    className="btn delete"
                    disabled={busyId === item._id}
                    onClick={() => handleDelete(item._id, item.name)}
                  >
                    Delete
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

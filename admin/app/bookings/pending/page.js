'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '../../../lib/api';

export default function PendingBookingsPage() {
  const { getToken } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const data = await apiFetch('/api/admin/bookings/pending', { token });
      setBookings(data);
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
      await apiFetch(`/api/admin/bookings/${id}/${action}`, { method: 'PATCH', token });
      setBookings((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="container">
      <h1>Pending Bookings</h1>
      {error && <p className="error">{error}</p>}
      {bookings.length === 0 && !error && <p className="empty">No booking requests waiting.</p>}
      {bookings.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Equipment</th>
              <th>Requested by</th>
              <th>Dates</th>
              <th>Location</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b._id}>
                <td>{b.equipment?.name}</td>
                <td>{b.user?.name || b.user?.email}</td>
                <td>{new Date(b.startDate).toLocaleDateString()} – {new Date(b.endDate).toLocaleDateString()}</td>
                <td>{b.location || '—'}</td>
                <td>
                  <button className="btn approve" disabled={busyId === b._id} onClick={() => act(b._id, 'approve')}>
                    Approve
                  </button>
                  <button className="btn reject" disabled={busyId === b._id} onClick={() => act(b._id, 'reject')}>
                    Reject
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

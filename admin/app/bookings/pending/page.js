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
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge pending">Queue: {bookings.length}</span>
        </div>
        <h1 className="page-title">Pending Booking Requests</h1>
        <p className="page-desc">
          Review reservations waiting for approval before equipment can be picked up.
        </p>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {bookings.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <div className="empty-title">All caught up!</div>
          <div className="empty-text">There are no pending booking requests waiting for approval.</div>
        </div>
      )}

      {bookings.length > 0 && (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Requested by</th>
                <th>Loan Schedule</th>
                <th>Pickup Location</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {b.equipment?.images?.[0] ? (
                        <img
                          src={b.equipment.images[0]}
                          alt={b.equipment.name}
                          style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid #e2e8f0' }}
                        />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                          📦
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{b.equipment?.name || 'Equipment'}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{b.equipment?.category || 'General'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600 }}>{b.user?.name || 'Borrower'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{b.user?.email}</div>
                      {b.purpose && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 2 }}>
                          &ldquo;{b.purpose}&rdquo;
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {new Date(b.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {new Date(b.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Requested {new Date(b.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                      📍 {b.location || b.equipment?.location || 'Tezpur University, Assam'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 8 }}>
                      <button
                        className="btn approve"
                        disabled={busyId === b._id}
                        onClick={() => act(b._id, 'approve')}
                      >
                        {busyId === b._id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        className="btn reject"
                        disabled={busyId === b._id}
                        onClick={() => act(b._id, 'reject')}
                      >
                        {busyId === b._id ? '...' : 'Reject'}
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

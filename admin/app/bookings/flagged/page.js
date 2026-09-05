'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '../../../lib/api';

export default function FlaggedBookingsPage() {
  const { getToken } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [feeInputs, setFeeInputs] = useState({});

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const data = await apiFetch('/api/admin/bookings/flagged', { token });
      setBookings(data);
    } catch (err) {
      setError(err.message);
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function resolve(id, { withFee }) {
    setBusyId(id);
    try {
      const token = await getToken();
      const body = withFee && feeInputs[id] ? { damageFee: Number(feeInputs[id]) } : {};
      await apiFetch(`/api/admin/bookings/${id}/resolve-condition`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(body),
      });
      setBookings((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="container">
      <h1>Flagged Bookings</h1>
      <p>Returns the AI similarity check flagged as looking different from pickup — this is the review queue, not an automatic verdict.</p>
      {error && <p className="error">{error}</p>}
      {bookings.length === 0 && !error && <p className="empty">Nothing flagged right now.</p>}

      {bookings.map((b) => (
        <div key={b._id} style={{ borderTop: '1px solid #e5e5e5', padding: '20px 0' }}>
          <p>
            <strong>{b.equipment?.name}</strong> — {b.user?.name || b.user?.email}
            {typeof b.returnCondition?.aiSimilarityScore === 'number' && (
              <span> · similarity score: {b.returnCondition.aiSimilarityScore.toFixed(2)}</span>
            )}
          </p>

          <div style={{ display: 'flex', gap: 40, marginTop: 8 }}>
            <div>
              <div>Pickup photos</div>
              <div className="photos">
                {(b.pickupCondition?.photos || []).map((url) => (
                  <img key={url} src={url} alt="pickup" />
                ))}
              </div>
              {b.pickupCondition?.notes && <p>{b.pickupCondition.notes}</p>}
            </div>
            <div>
              <div>Return photos</div>
              <div className="photos">
                {(b.returnCondition?.photos || []).map((url) => (
                  <img key={url} src={url} alt="return" />
                ))}
              </div>
              {b.returnCondition?.notes && <p>{b.returnCondition.notes}</p>}
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn approve" disabled={busyId === b._id} onClick={() => resolve(b._id, { withFee: false })}>
              Clear — no issue
            </button>
            <input
              type="number"
              placeholder="Damage fee"
              value={feeInputs[b._id] || ''}
              onChange={(e) => setFeeInputs((prev) => ({ ...prev, [b._id]: e.target.value }))}
              style={{ width: 100, padding: 6 }}
            />
            <button className="btn reject" disabled={busyId === b._id} onClick={() => resolve(b._id, { withFee: true })}>
              Apply fee &amp; clear
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

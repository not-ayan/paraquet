'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '../../../lib/api';
import { IconAlertTriangle, IconShieldCheck, IconUpload, IconDownload, IconCpu, IconRefresh } from '../../icons';

export default function FlaggedBookingsPage() {
  const { getToken } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [feeInputs, setFeeInputs] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await apiFetch('/api/admin/bookings/flagged', { token });
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      <div className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="brand-tag">Tezpur University · AI Condition Audits</span>
            <span className={`badge ${bookings.length > 0 ? 'flagged' : 'approved'}`}>
              {bookings.length} {bookings.length === 1 ? 'Incident' : 'Incidents'} Flagged
            </span>
          </div>
          <h1 className="page-title">Flagged Condition Audits</h1>
          <p className="page-desc">
            Equipment returns where Gemini Vision AI detected physical discrepancies or damage compared to baseline pickup evidence.
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

      {bookings.length === 0 && !error && !loading && (
        <div className="empty-state">
          <div className="empty-icon"><IconShieldCheck style={{ color: 'var(--color-success)' }} /></div>
          <div className="empty-title">All equipment clear!</div>
          <div className="empty-text">No active campus returns flagged with damage or condition discrepancies.</div>
        </div>
      )}

      {bookings.map((b) => {
        const retAi = b.returnCondition?.aiAnalysis;
        const picAi = b.pickupCondition?.aiAnalysis;
        const similarityPct = typeof b.returnCondition?.aiSimilarityScore === 'number'
          ? Math.round(b.returnCondition.aiSimilarityScore * 100)
          : null;

        const isStructural = retAi?.damageType === 'structural' || retAi?.damageType === 'both';
        const isCosmetic = retAi?.damageType === 'cosmetic';

        return (
          <div key={b._id} className="incident-card">
            <div className="incident-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 className="incident-title">
                    {b.equipment?.name || 'Equipment'}
                  </h3>
                  <span className="brand-tag" style={{ fontSize: '0.68rem' }}>
                    {b.equipment?.category || 'General'}
                  </span>
                </div>
                <p className="incident-meta">
                  Borrower: <strong style={{ color: 'var(--text-primary)' }}>{b.user?.name || b.user?.email}</strong> ({b.user?.email}) &bull; Loan: {new Date(b.startDate).toLocaleDateString()} – {new Date(b.endDate).toLocaleDateString()}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {similarityPct !== null && (
                  <span className={`badge ${similarityPct >= 80 ? 'approved' : 'rejected'}`}>
                    {similarityPct}% Visual Match
                  </span>
                )}
                {retAi?.damageType && (
                  <span className={`badge ${isStructural ? 'flagged' : isCosmetic ? 'pending' : 'approved'}`}>
                    {retAi.damageType === 'none' && 'No Damage'}
                    {retAi.damageType === 'cosmetic' && 'Cosmetic Wear'}
                    {retAi.damageType === 'structural' && 'Structural Damage'}
                    {retAi.damageType === 'both' && 'Structural & Cosmetic Damage'}
                  </span>
                )}
              </div>
            </div>

            {/* Side-by-side Photos */}
            <div className="inspection-grid">
              {/* Pickup Inspection Column */}
              <div className="inspection-col">
                <div className="inspection-heading">
                  <IconUpload />
                  <span>Pickup Baseline Evidence</span>
                </div>
                <div className="photos">
                  {(b.pickupCondition?.photos || []).map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" title="Click to view full photo">
                      <img src={url} alt="pickup evidence" />
                    </a>
                  ))}
                  {(!b.pickupCondition?.photos || b.pickupCondition.photos.length === 0) && (
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No pickup photo recorded</span>
                  )}
                </div>
                {b.pickupCondition?.notes && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: '10px 0 0 0' }}>
                    &ldquo;{b.pickupCondition.notes}&rdquo;
                  </p>
                )}
                {picAi?.detailedSummary && (
                  <div style={{ marginTop: 10, padding: 10, background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>AI Baseline Note:</strong> {picAi.detailedSummary}
                  </div>
                )}
              </div>

              {/* Return Inspection Column */}
              <div className="inspection-col">
                <div className="inspection-heading">
                  <IconDownload />
                  <span>Return Inspection Photo</span>
                </div>
                <div className="photos">
                  {(b.returnCondition?.photos || []).map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" title="Click to view full photo">
                      <img src={url} alt="return evidence" />
                    </a>
                  ))}
                  {(!b.returnCondition?.photos || b.returnCondition.photos.length === 0) && (
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No return photo recorded</span>
                  )}
                </div>
                {b.returnCondition?.notes && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: '10px 0 0 0' }}>
                    &ldquo;{b.returnCondition.notes}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {/* Gemini AI Discrepancy & Damage Report Box */}
            {retAi && (
              <div className={`ai-audit-card ${isStructural ? 'structural' : isCosmetic ? 'cosmetic' : 'intact'}`}>
                <div className="ai-audit-header">
                  <IconCpu />
                  <span>Gemini Vision AI Discrepancy & Damage Analysis</span>
                </div>

                <p style={{ margin: '0 0 12px 0', fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                  {retAi.detailedDiscrepancyReport || retAi.detailedSummary}
                </p>

                {/* Cosmetic vs Actual Damage Breakdown */}
                <div className="damage-breakdown-grid">
                  {/* Cosmetic Flaws */}
                  <div className="damage-pill-box">
                    <div className="damage-pill-label" style={{ color: 'var(--color-warning-text)' }}>
                      Cosmetic Flaws (Surface Marks / Scuffs)
                    </div>
                    {retAi.cosmeticFlaws && retAi.cosmeticFlaws.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.82rem', color: 'var(--color-warning-text)' }}>
                        {retAi.cosmeticFlaws.map((flaw, idx) => (
                          <li key={idx} style={{ marginBottom: 2 }}>{flaw}</li>
                        ))}
                      </ul>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-success-text)', fontWeight: 600 }}>None detected</span>
                    )}
                  </div>

                  {/* Actual Damage */}
                  <div className="damage-pill-box">
                    <div className="damage-pill-label" style={{ color: 'var(--color-danger-text)' }}>
                      Actual / Structural Damage (Functional Impact)
                    </div>
                    {retAi.actualDamage && retAi.actualDamage.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.82rem', color: 'var(--color-danger-text)', fontWeight: 600 }}>
                        {retAi.actualDamage.map((dmg, idx) => (
                          <li key={idx} style={{ marginBottom: 2 }}>{dmg}</li>
                        ))}
                      </ul>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-success-text)', fontWeight: 600 }}>None detected (intact)</span>
                    )}
                  </div>
                </div>

                {retAi.recommendedAction && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Recommended Action:</strong> {retAi.recommendedAction}
                  </div>
                )}
              </div>
            )}

            {/* Resolution Actions */}
            <div className="incident-actions">
              <button
                className="btn approve"
                disabled={busyId === b._id}
                onClick={() => resolve(b._id, { withFee: false })}
              >
                {busyId === b._id ? 'Resolving…' : 'Clear Incident — No Damage Fee'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.88rem' }}>₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Damage fee"
                    value={feeInputs[b._id] || ''}
                    onChange={(e) => setFeeInputs((prev) => ({ ...prev, [b._id]: e.target.value }))}
                    style={{ width: 140, paddingLeft: 24 }}
                  />
                </div>
                <button
                  className="btn reject"
                  disabled={busyId === b._id || !feeInputs[b._id]}
                  onClick={() => resolve(b._id, { withFee: true })}
                >
                  {busyId === b._id ? 'Applying…' : 'Apply Fee & Resolve'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

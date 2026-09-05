'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '../../lib/api';

const EVENT_TYPE_ICONS = {
  booking_requested: '📅',
  booking_approved: '✅',
  booking_rejected: '❌',
  pickup_recorded: '📤',
  return_recorded: '📥',
  condition_flagged: '⚠️',
  equipment_submitted: '📦',
  equipment_approved: '🎉',
  equipment_rejected: '🚫',
  equipment_status_changed: '🔄',
};

const FILTER_TYPES = [
  { value: '', label: 'All Event Types' },
  { value: 'return_recorded', label: 'Return Inspections' },
  { value: 'pickup_recorded', label: 'Pickup Baseline Checks' },
  { value: 'condition_flagged', label: 'Condition Flags (AI)' },
  { value: 'booking_requested', label: 'Booking Requests' },
  { value: 'booking_approved', label: 'Booking Approvals' },
  { value: 'booking_rejected', label: 'Booking Rejections' },
  { value: 'equipment_approved', label: 'Equipment Approvals' },
  { value: 'equipment_submitted', label: 'Equipment Submissions' },
];

export default function ActivityLogPage() {
  const { getToken } = useAuth();
  const [logs, setLogs] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const qs = typeFilter ? `?type=${typeFilter}` : '';
      const data = await apiFetch(`/api/admin/activity${qs}`, { token });
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}>
            System Audit Trail
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {logs.length} logged events
          </span>
        </div>
        <h1 className="page-title">Activity &amp; Inspection Audit Logs</h1>
        <p className="page-desc">
          Live campus audit trail capturing booking requests, loan approvals, condition evidence photos, and Gemini Vision AI inspection reports.
        </p>
      </div>

      <div className="filters">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          {FILTER_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <button className="btn secondary" onClick={load} disabled={loading} style={{ marginLeft: 'auto' }}>
          {loading ? 'Refreshing...' : '↻ Refresh Log'}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {logs.length === 0 && !error && !loading && (
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <div className="empty-title">No activity events recorded</div>
          <div className="empty-text">No system events matched the selected filter criteria.</div>
        </div>
      )}

      <div className="audit-list">
        {logs.map((log) => {
          const icon = EVENT_TYPE_ICONS[log.type] || '📌';
          
          // Resolve inspection photos
          const photos = log.conditionReport?.photos?.length
            ? log.conditionReport.photos
            : (log.booking?.returnCondition?.photos?.length
              ? log.booking.returnCondition.photos
              : (log.booking?.pickupCondition?.photos || []));

          // Resolve condition rating
          const condition = log.conditionReport?.condition ||
            log.booking?.returnCondition?.condition ||
            log.booking?.pickupCondition?.condition;

          // Resolve AI analysis review
          const aiAnalysis = log.conditionReport?.aiAnalysis ||
            log.booking?.returnCondition?.aiAnalysis ||
            log.booking?.pickupCondition?.aiAnalysis;

          // Resolve similarity score and flagged status
          const similarityScore = typeof log.conditionReport?.aiSimilarityScore === 'number'
            ? log.conditionReport.aiSimilarityScore
            : (typeof log.booking?.returnCondition?.aiSimilarityScore === 'number'
              ? log.booking.returnCondition.aiSimilarityScore
              : null);

          const isFlagged = Boolean(
            log.conditionReport?.aiFlagged ||
            log.booking?.returnCondition?.aiFlagged ||
            log.type === 'condition_flagged'
          );

          const aiReviewText = aiAnalysis?.detailedDiscrepancyReport ||
            aiAnalysis?.detailedSummary ||
            (log.conditionReport?.notes && log.conditionReport.notes.includes('AI:')
              ? log.conditionReport.notes.split('AI:')[1].trim()
              : null);

          return (
            <div key={log._id} className="audit-item">
              <div className="audit-header">
                <div className="audit-left">
                  <div className="audit-icon">{icon}</div>
                  <div className="audit-content">
                    <div className="audit-msg">
                      {log.message || log.type.replace(/_/g, ' ')}
                    </div>
                    <div className="audit-meta">
                      {log.user && (
                        <span>
                          👤 <strong>{log.user.name || log.user.email}</strong>
                        </span>
                      )}
                      {log.equipment && (
                        <span>
                          &bull; 📦 {log.equipment.name}
                        </span>
                      )}
                      <span className="brand-tag" style={{ fontSize: '0.62rem' }}>
                        {log.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="audit-right">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {condition && (
                      <span className={`badge ${
                        condition === 'damaged' || condition === 'poor' ? 'flagged' :
                        condition === 'fair' ? 'pending' : 'approved'
                      }`}>
                        {condition}
                      </span>
                    )}
                    {similarityScore !== null && (
                      <span className={`badge ${similarityScore >= 0.8 ? 'approved' : 'flagged'}`}>
                        {Math.round(similarityScore * 100)}% Match
                      </span>
                    )}
                  </div>
                  <div className="audit-time">
                    {new Date(log.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>

              {/* Inspection Photos Gallery */}
              {photos && photos.length > 0 && (
                <div className="audit-media-section">
                  <div className="audit-media-label">
                    <span>📷</span>
                    <span>Handover Evidence Photos ({photos.length})</span>
                  </div>
                  <div className="photos">
                    {photos.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        title="Click to open full resolution photo in new tab"
                      >
                        <img src={url} alt={`evidence-${idx}`} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Gemini Vision AI Review Box */}
              {(aiAnalysis || aiReviewText) && (
                <div className={`audit-ai-banner ${isFlagged ? 'flagged' : 'verified'}`}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🤖</span>
                      <span>Gemini Vision AI Audit Review</span>
                    </div>
                    {aiAnalysis?.damageType && aiAnalysis.damageType !== 'none' && (
                      <span className="badge flagged" style={{ textTransform: 'uppercase', fontSize: '0.68rem' }}>
                        {aiAnalysis.damageType} damage
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '0 0 10px 0', fontSize: '0.86rem', lineHeight: 1.5 }}>
                    {aiReviewText || 'Visual condition verified by Gemini Vision.'}
                  </p>

                  {/* Damage breakdown if present */}
                  {((aiAnalysis?.cosmeticFlaws && aiAnalysis.cosmeticFlaws.length > 0) || (aiAnalysis?.actualDamage && aiAnalysis.actualDamage.length > 0)) && (
                    <div className="damage-breakdown-grid" style={{ marginTop: 8 }}>
                      {aiAnalysis.cosmeticFlaws && aiAnalysis.cosmeticFlaws.length > 0 && (
                        <div className="damage-pill-box">
                          <div className="damage-pill-label" style={{ color: '#b45309' }}>
                            Cosmetic Flaws
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.78rem', color: '#92400e' }}>
                            {aiAnalysis.cosmeticFlaws.map((flaw, i) => (
                              <li key={i}>{flaw}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiAnalysis.actualDamage && aiAnalysis.actualDamage.length > 0 && (
                        <div className="damage-pill-box">
                          <div className="damage-pill-label" style={{ color: '#be123c' }}>
                            Actual / Structural Damage
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.78rem', color: '#9f1239', fontWeight: 600 }}>
                            {aiAnalysis.actualDamage.map((dmg, i) => (
                              <li key={i}>{dmg}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {aiAnalysis?.recommendedAction && (
                    <div style={{ marginTop: 8, fontSize: '0.8rem', opacity: 0.85 }}>
                      <strong>Action:</strong> {aiAnalysis.recommendedAction}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

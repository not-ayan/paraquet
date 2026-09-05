'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { apiFetch, downloadFile } from '../lib/api';
import {
  IconPackage,
  IconCalendar,
  IconAlertTriangle,
  IconFolder,
  IconUsers,
  IconFileText,
  IconChevronRight,
  IconInbox,
  IconCheckCircle,
  IconXCircle,
  IconUpload,
  IconDownload,
  IconRefresh,
  IconInfo,
} from './icons';

const EVENT_TYPE_ICONS = {
  booking_requested: IconCalendar,
  booking_approved: IconCheckCircle,
  booking_rejected: IconXCircle,
  pickup_recorded: IconUpload,
  return_recorded: IconDownload,
  condition_flagged: IconAlertTriangle,
  equipment_submitted: IconPackage,
  equipment_approved: IconCheckCircle,
  equipment_rejected: IconXCircle,
  equipment_status_changed: IconRefresh,
};

export default function AdminHome() {
  const { getToken } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [pendingEquipment, setPendingEquipment] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const results = await Promise.allSettled([
        apiFetch('/api/admin/equipment', { token }),
        apiFetch('/api/admin/equipment/pending', { token }),
        apiFetch('/api/admin/bookings/pending', { token }),
        apiFetch('/api/admin/bookings/flagged', { token }),
        apiFetch('/api/admin/users', { token }),
        apiFetch('/api/admin/activity?limit=7', { token }),
      ]);
      const [eq, pendEq, pendBk, flag, usr, act] = results;
      setEquipment(eq.status === 'fulfilled' ? eq.value : []);
      setPendingEquipment(pendEq.status === 'fulfilled' ? pendEq.value : []);
      setPendingBookings(pendBk.status === 'fulfilled' ? pendBk.value : []);
      setFlagged(flag.status === 'fulfilled' ? flag.value : []);
      setUsers(usr.status === 'fulfilled' ? usr.value : []);
      setActivity(act.status === 'fulfilled' ? act.value : []);
      if (results.every((r) => r.status === 'rejected')) {
        setError(results[0].reason?.message || 'Unable to load dashboard data.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const token = await getToken();
      await downloadFile('/api/admin/export/csv', { token });
    } catch (err) {
      setExportError(err.message);
    } finally {
      setExporting(false);
    }
  }

  const sections = [
    {
      href: '/equipment/pending',
      Icon: IconPackage,
      label: 'Pending Equipment',
      count: pendingEquipment.length,
      unit: 'items',
      badge: pendingEquipment.length > 0 ? `${pendingEquipment.length} pending` : null,
      badgeType: 'pending',
    },
    {
      href: '/bookings/pending',
      Icon: IconCalendar,
      label: 'Pending Bookings',
      count: pendingBookings.length,
      unit: 'requests',
      badge: pendingBookings.length > 0 ? `${pendingBookings.length} pending` : null,
      badgeType: 'pending',
    },
    {
      href: '/bookings/flagged',
      Icon: IconAlertTriangle,
      label: 'Flagged Returns',
      count: flagged.length,
      unit: 'flagged',
      badge: flagged.length > 0 ? `${flagged.length} flagged` : null,
      badgeType: 'flagged',
    },
    {
      href: '/equipment',
      Icon: IconFolder,
      label: 'All Equipment',
      count: equipment.length,
      unit: 'total items',
      badge: null,
    },
    {
      href: '/users',
      Icon: IconUsers,
      label: 'User Directory',
      count: users.length,
      unit: 'registered users',
      badge: null,
    },
    {
      href: '/logs',
      Icon: IconFileText,
      label: 'Activity Log',
      count: activity.length,
      unit: 'recent events',
      badge: null,
    },
  ];

  const queues = [
    { href: '/equipment/pending', label: 'pending equipment listings', count: pendingEquipment.length },
    { href: '/bookings/pending', label: 'pending booking requests', count: pendingBookings.length },
    { href: '/bookings/flagged', label: 'flagged returns requiring review', count: flagged.length },
  ];
  const topQueue = queues.filter((q) => q.count > 0).sort((a, b) => b.count - a.count)[0];

  const availableCount = equipment.filter((e) => e.availability === 'available').length;
  const bookedCount = equipment.filter((e) => e.availability === 'booked').length;
  const maintenanceCount = equipment.filter((e) => e.availability === 'maintenance' || e.availability === 'retired').length;
  const availabilityPct = equipment.length ? Math.round((availableCount / equipment.length) * 100) : 0;

  return (
    <div className="container">
      <div className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="brand-tag">Tezpur University Command Center</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Operations Overview</span>
          </div>
          <h1 className="page-title">Admin Operations Console</h1>
          <p className="page-desc">
            Manage Tezpur University campus inventory, approve equipment loans, resolve Gemini Vision AI condition audits, and monitor platform health.
          </p>
        </div>

        <div className="dash-header-actions">
          <button type="button" className="btn secondary" onClick={load} disabled={loading}>
            <IconRefresh />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button type="button" className="btn primary" onClick={handleExport} disabled={exporting}>
            <IconDownload />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <IconAlertTriangle />
          <span>{error}</span>
        </div>
      )}

      {exportError && (
        <div className="error-banner">
          <IconAlertTriangle />
          <span>Export failed: {exportError}</span>
        </div>
      )}

      {/* KPI Section Cards */}
      <div className="dash-grid">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="dash-card">
            <div className="dash-card-top">
              <div className="dash-icon-sq">
                <s.Icon />
              </div>
              {s.badge && (
                <span className={`badge ${s.badgeType}`}>{s.badge}</span>
              )}
            </div>

            <div className="dash-card-body">
              <div className="dash-card-val">
                {loading ? '…' : s.count}
                <span className="dash-card-unit">{s.unit}</span>
              </div>
              <div className="dash-card-label">{s.label}</div>
            </div>

            <div className="dash-card-footer">
              <span>View details</span>
              <span>→</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Two-Column Details Area */}
      <div className="dash-layout">
        {/* Left Column: Recent Activity Feed */}
        <div>
          <div className="dash-section-header">
            <h2 className="dash-section-title">
              <IconFileText style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }} />
              <span>Recent Activity Stream</span>
            </h2>
            <Link href="/logs" className="btn secondary" style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
              View All Logs →
            </Link>
          </div>

          <div className="dash-activity-card">
            {activity.length === 0 && !loading ? (
              <div className="empty-state" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
                <div className="empty-icon"><IconFileText /></div>
                <div className="empty-title">No activity events recorded yet</div>
                <div className="empty-text">Recent operations and audit trail events will appear here.</div>
              </div>
            ) : (
              <div className="dash-recent-list">
                {activity.slice(0, 7).map((log) => {
                  const EventIcon = EVENT_TYPE_ICONS[log.type] || IconInfo;
                  return (
                    <Link key={log._id} href="/logs" className="dash-recent-row">
                      <div className="dash-recent-icon">
                        <EventIcon />
                      </div>
                      <div className="dash-recent-main">
                        <div className="dash-recent-msg">{log.message || log.type.replace(/_/g, ' ')}</div>
                        <div className="dash-recent-meta">
                          <span>{log.user?.name || log.user?.email || 'System'}</span>
                          <span>•</span>
                          <span style={{ textTransform: 'capitalize' }}>{log.type.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                      <div className="dash-recent-time">
                        {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                      <IconChevronRight className="dash-recent-chevron" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Status Panels */}
        <div>
          {/* Quick Action Priority Box */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <span className="dash-panel-title">Queue Priority</span>
              {topQueue && <span className="badge pending">Action Needed</span>}
            </div>

            {topQueue ? (
              <Link href={topQueue.href} className="dash-action-box has-action">
                <div className="dash-action-icon">
                  <IconInbox />
                </div>
                <div className="dash-action-text">{topQueue.count} {topQueue.label}</div>
                <div className="dash-action-sub">Click to review and take action →</div>
              </Link>
            ) : (
              <div className="dash-action-box" style={{ cursor: 'default' }}>
                <div className="dash-action-icon" style={{ color: 'var(--color-success)' }}>
                  <IconCheckCircle />
                </div>
                <div className="dash-action-text">All Queues Cleared</div>
                <div className="dash-action-sub">No items waiting on admin review right now</div>
              </div>
            )}
          </div>

          {/* Equipment Availability Gauge */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <span className="dash-panel-title">Campus Equipment Health</span>
              <Link href="/equipment" style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Catalog →
              </Link>
            </div>

            <div className="dash-meter-card">
              <div className="dash-meter-stats">
                <span className="dash-meter-pct">{availabilityPct}%</span>
                <span className="dash-meter-fraction">{availableCount} of {equipment.length} Available</span>
              </div>

              <div className="dash-meter-track">
                <div className="dash-meter-fill" style={{ width: `${availabilityPct}%` }} />
              </div>

              <div className="dash-breakdown-row">
                <span>{availableCount} available</span>
                <span>{bookedCount} on loan</span>
                {maintenanceCount > 0 && <span>{maintenanceCount} maintenance</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

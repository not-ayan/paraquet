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

const CATEGORY_PALETTE = ['#7c6cf0', '#14b8a6', '#f43f5e', '#3b82f6', '#f59e0b', '#6366f1'];

function colorFor(seed, index) {
  if (typeof index === 'number') return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
  const hash = [...String(seed || '')].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
}

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
        apiFetch('/api/admin/activity?limit=6', { token }),
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
    { href: '/equipment/pending', Icon: IconPackage, label: 'Pending Equipment', count: pendingEquipment.length, unit: 'pending' },
    { href: '/bookings/pending', Icon: IconCalendar, label: 'Pending Bookings', count: pendingBookings.length, unit: 'pending' },
    { href: '/bookings/flagged', Icon: IconAlertTriangle, label: 'Flagged Returns', count: flagged.length, unit: 'flagged' },
    { href: '/equipment', Icon: IconFolder, label: 'All Equipment', count: equipment.length, unit: 'items' },
    { href: '/users', Icon: IconUsers, label: 'User Directory', count: users.length, unit: 'users' },
    { href: '/logs', Icon: IconFileText, label: 'Activity Log', count: activity.length, unit: 'recent' },
  ];

  const queues = [
    { href: '/equipment/pending', label: 'pending equipment listings', count: pendingEquipment.length },
    { href: '/bookings/pending', label: 'pending booking requests', count: pendingBookings.length },
    { href: '/bookings/flagged', label: 'flagged returns', count: flagged.length },
  ];
  const topQueue = queues.filter((q) => q.count > 0).sort((a, b) => b.count - a.count)[0];

  const availableCount = equipment.filter((e) => e.availability === 'available').length;
  const availabilityPct = equipment.length ? Math.round((availableCount / equipment.length) * 100) : 0;

  return (
    <div className="dl-wrap">
      <div className="dl-surface">
        <div className="dl-header-row">
          <div>
            <span className="dl-tag">Tezpur University Command Center</span>
            <h1 className="dl-title">Admin Operations Console</h1>
            <p className="dl-sub">
              Manage Tezpur University campus inventory, approve equipment loans, resolve Gemini Vision AI condition audits, and monitor platform health.
            </p>
          </div>
          <button type="button" className="dl-export-btn" onClick={handleExport} disabled={exporting}>
            <IconDownload />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>

        {error && (
          <div className="dl-error">
            <IconAlertTriangle />
            <span>{error}</span>
          </div>
        )}

        {exportError && (
          <div className="dl-error">
            <IconAlertTriangle />
            <span>Export failed: {exportError}</span>
          </div>
        )}

        <div className="dl-section-label">Sections</div>
        <div className="dl-grid">
          {sections.map((s, i) => (
            <Link key={s.href} href={s.href} className="dl-card">
              <div className="dl-icon-sq" style={{ background: colorFor(s.label, i) }}>
                <s.Icon />
              </div>
              <div>
                <div className="dl-card-label">{s.label}</div>
                <div className="dl-card-count">{loading ? '…' : `${s.count} ${s.unit}`}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="dl-layout">
          <div>
            <div className="dl-section-label">Recent Activity</div>
            {activity.length === 0 && !loading ? (
              <div className="dl-empty">No activity events recorded yet.</div>
            ) : (
              <div className="dl-recent-list">
                {activity.slice(0, 6).map((log) => {
                  const EventIcon = EVENT_TYPE_ICONS[log.type] || IconInfo;
                  return (
                    <Link key={log._id} href="/logs" className="dl-recent-row">
                      <div className="dl-recent-icon" style={{ background: colorFor(log.type) }}>
                        <EventIcon />
                      </div>
                      <div className="dl-recent-main">
                        <div className="dl-recent-msg">{log.message || log.type.replace(/_/g, ' ')}</div>
                        <div className="dl-recent-meta">{log.user?.name || log.user?.email || 'System'}</div>
                      </div>
                      <div className="dl-recent-time">
                        {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                      <IconChevronRight className="dl-recent-chevron" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="dl-panel">
              <div className="dl-panel-title">Quick Action</div>
              {topQueue ? (
                <Link href={topQueue.href} className="dl-action-box">
                  <div className="dl-action-icon">
                    <IconInbox />
                  </div>
                  <div className="dl-action-text">{topQueue.count} {topQueue.label}</div>
                  <div className="dl-action-sub">Needs your review</div>
                </Link>
              ) : (
                <div className="dl-action-box" style={{ cursor: 'default' }}>
                  <div className="dl-action-icon">
                    <IconCheckCircle />
                  </div>
                  <div className="dl-action-text">All caught up</div>
                  <div className="dl-action-sub">Nothing waiting on review right now</div>
                </div>
              )}
            </div>

            <div className="dl-panel">
              <div className="dl-panel-title">Equipment Availability</div>
              <div className="dl-meter-track">
                <div className="dl-meter-fill" style={{ width: `${availabilityPct}%` }} />
              </div>
              <div className="dl-meter-label">
                <span>{availableCount} of {equipment.length} available</span>
                <span>{availabilityPct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

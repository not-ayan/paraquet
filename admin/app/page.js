import Link from 'next/link';

const SECTIONS = [
  {
    href: '/equipment/pending',
    icon: '📦',
    label: 'Pending Equipment',
    desc: 'Verify photos, specs, and approve student listings before they appear in the public catalogue.',
    tag: 'Moderation',
    bgBadge: '#fef3c7',
    actionText: 'Review listings',
  },
  {
    href: '/bookings/pending',
    icon: '📅',
    label: 'Pending Bookings',
    desc: 'Review and approve or reject reservation requests submitted by students and faculty.',
    tag: 'Loan Desk',
    bgBadge: '#dcfce7',
    actionText: 'Manage requests',
  },
  {
    href: '/bookings/flagged',
    icon: '⚠️',
    label: 'Flagged Returns (AI)',
    desc: 'Gemini Vision condition mismatch reports. Compare pickup vs return photos and resolve damage fees.',
    tag: 'AI Vision Audit',
    bgBadge: '#fee2e2',
    actionText: 'Inspect incidents',
  },
  {
    href: '/equipment',
    icon: '🗂️',
    label: 'All Equipment Catalogue',
    desc: 'View, edit loan duration limits (max days), update maintenance states, or retire equipment.',
    tag: 'Inventory',
    bgBadge: '#dbeafe',
    actionText: 'Browse inventory',
  },
  {
    href: '/users',
    icon: '👥',
    label: 'User Directory',
    desc: 'Search all verified campus users, review lending roles, and monitor participation.',
    tag: 'Accounts',
    bgBadge: '#ede9fe',
    actionText: 'View directory',
  },
  {
    href: '/logs',
    icon: '📜',
    label: 'Audit & Activity Log',
    desc: 'Chronological timeline of all system events, status transitions, approvals, and AI inspection logs.',
    tag: 'Audit Trail',
    bgBadge: '#e0f2fe',
    actionText: 'Inspect logs',
  },
];

export default function AdminHome() {
  return (
    <div className="container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span className="brand-tag" style={{ background: '#eef2ff', borderColor: '#c7d2fe', color: '#4338ca' }}>
            Tezpur University Command Center
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tezpur University, Assam</span>
        </div>
        <h1 className="page-title">Admin Operations Console</h1>
        <p className="page-desc">
          Manage Tezpur University campus inventory, approve equipment loans, resolve Gemini Vision AI condition audits, and monitor platform health.
        </p>
      </div>

      <div className="tile-grid">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="tile">
            <div>
              <div className="tile-top">
                <div className="tile-icon-badge" style={{ background: s.bgBadge }}>
                  <span className="tile-icon">{s.icon}</span>
                </div>
                <span className="brand-tag" style={{ fontSize: '0.68rem' }}>{s.tag}</span>
              </div>
              <div className="tile-label">{s.label}</div>
              <div className="tile-desc">{s.desc}</div>
            </div>
            <div className="tile-bottom">
              <span>{s.actionText}</span>
              <span className="tile-arrow">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
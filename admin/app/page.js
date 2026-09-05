import Link from 'next/link';
 
const SECTIONS = [
  { href: '/equipment/pending', icon: '📦', label: 'Pending Equipment', desc: 'Approve or reject new postings', color: '#fef3c7', accent: '#b45309', glow: '#f59e0b' },
  { href: '/equipment', icon: '🗂️', label: 'All Equipment', desc: 'Manage the full catalogue', color: '#dbeafe', accent: '#1d4ed8', glow: '#3b82f6' },
  { href: '/bookings/pending', icon: '📅', label: 'Pending Bookings', desc: 'Approve or reject requests', color: '#dcfce7', accent: '#15803d', glow: '#22c55e' },
  { href: '/bookings/flagged', icon: '⚠️', label: 'Flagged Bookings', desc: 'Review damaged returns', color: '#fee2e2', accent: '#b91c1c', glow: '#ef4444' },
  { href: '/users', icon: '👥', label: 'Users', desc: 'View everyone on the platform', color: '#ede9fe', accent: '#6d28d9', glow: '#8b5cf6' },
  { href: '/logs', icon: '📜', label: 'Activity Log', desc: 'Full system event history', color: '#e0f2fe', accent: '#0369a1', glow: '#0ea5e9' },
];

export default function AdminHome() {
  return (
    <div className="container">
      <h1>Admin Dashboard</h1>
      <div className="tile-grid">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="tile"
            style={{
              background: `linear-gradient(160deg, ${s.color} 0%, #ffffff 65%)`,
              '--tile-glow': s.glow,
            }}
          >
            <span className="tile-icon-badge" style={{ background: s.color, color: s.accent }}>
              <span className="tile-icon">{s.icon}</span>
            </span>
            <span className="tile-label" style={{ color: s.accent }}>{s.label}</span>
            <span className="tile-desc">{s.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', exact: true },
  { href: '/equipment/pending', label: 'Pending Equipment' },
  { href: '/equipment', label: 'All Equipment', exact: true },
  { href: '/bookings/pending', label: 'Pending Bookings' },
  { href: '/bookings/flagged', label: 'Flagged Bookings' },
  { href: '/users', label: 'Users' },
  { href: '/logs', label: 'Activity Log' },
];

export default function AdminNav() {
  const pathname = usePathname();

  const isActive = (item) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="brand-wrapper">
          <div className="brand-logo">TU</div>
          <div className="brand-text">
            <span>Tezpur University</span>
            <span className="brand-tag">Equipment Admin</span>
          </div>
        </Link>

        <nav>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${active ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="header-actions">
          <div className="live-indicator" title="Admin backend connected">
            <span className="live-dot" />
            <span>Live</span>
          </div>
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="portal-link"
            title="Open Campus User Portal in new tab"
          >
            <span>User Portal</span>
            <span>↗</span>
          </a>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn primary" style={{ padding: '4px 12px', fontSize: '0.78rem' }}>
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}

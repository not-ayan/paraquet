import { ClerkProvider, UserButton } from '@clerk/nextjs';
import './globals.css';

export const metadata = {
  title: 'Admin — Equipment Lending Portal',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <header className="header">
            <span className="brand">Admin</span>
            <nav>
              <a href="/equipment/pending">Pending Equipment</a>
              <a href="/equipment">All Equipment</a>
              <a href="/bookings/pending">Pending Bookings</a>
              <a href="/bookings/flagged">Flagged Bookings</a>
              <a href="/users">Users</a>
              <a href="/logs">Activity Log</a>
            </nav>
            <UserButton afterSignOutUrl="/" />
          </header>
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}

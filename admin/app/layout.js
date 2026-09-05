import { ClerkProvider } from '@clerk/nextjs';
import AdminNav from './AdminNav';
import './globals.css';

export const metadata = {
  title: 'Admin Console — Tezpur University, Assam',
  description: 'Manage Tezpur University campus equipment listings, loan approvals, condition audits, and user access.',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <AdminNav />
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}

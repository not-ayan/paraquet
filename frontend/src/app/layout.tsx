import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Paraquet — Campus Equipment Sharing & Lending Platform',
  description: 'A contemporary community equipment lending and booking platform. Borrow and share cameras, maker tools, sound gear, and research hardware.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-[#F5F5F3] text-[#111110] antialiased selection:bg-[#111110] selection:text-white">
        <ClerkProvider>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </ClerkProvider>
      </body>
    </html>
  );
}

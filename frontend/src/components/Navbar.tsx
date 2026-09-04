'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  SignInButton, 
  SignUpButton, 
  Show, 
  UserButton 
} from '@clerk/nextjs';
import { 
  Menu, 
  X, 
  RotateCcw,
  ArrowUpRight
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { CommuneStore } from '@/lib/store';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [equipmentCount, setEquipmentCount] = useState<number>(6);

  React.useEffect(() => {
    apiClient.getEquipment()
      .then(items => {
        const available = items.filter(e => e.availabilityStatus === 'AVAILABLE').length;
        setEquipmentCount(available || items.length);
      })
      .catch(() => {
        setEquipmentCount(CommuneStore.getAllEquipment().filter(e => e.availabilityStatus === 'AVAILABLE').length);
      });
  }, [pathname]);

  const navLinks = [
    { href: '/', label: 'Overview' },
    { href: '/equipment', label: 'Catalog' },
    { href: '/equipment/new', label: 'List Equipment' },
    { href: '/dashboard', label: 'Dashboard' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#F5F5F3]/90 backdrop-blur-md border-b border-[#E2E2DE]">
      <div className="container-custom flex items-center justify-between h-16 sm:h-20">
        
        {/* Brand Monogram & Live Indicator */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-[#111110] text-white flex items-center justify-center font-bold text-base transition-transform group-hover:scale-105">
              P
            </div>
            <span className="font-bold text-lg sm:text-xl tracking-tight text-[#111110]">
              paraquet
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-[#E2E2DE] text-fluid-micro text-[#70706B]">
            <span className="w-2 h-2 rounded-full bg-[#1B7A42] animate-pulse" />
            <span><strong>{equipmentCount}</strong> items ready for loan</span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#EBEBE8] p-1 rounded-full border border-[#E2E2DE]">
          {navLinks.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-1.5 rounded-full text-fluid-body transition-all ${
                  isActive
                    ? 'bg-[#FFFFFF] text-[#111110] shadow-sm font-semibold'
                    : 'text-[#70706B] hover:text-[#111110] hover:bg-white/50 font-medium'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Clerk Auth Controls */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => CommuneStore.resetDefaults()}
            title="Reset Mock Data"
            className="p-2 rounded-full text-[#70706B] hover:text-[#111110] hover:bg-[#EBEBE8] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Signed Out state: Sign In & Sign Up buttons */}
          <Show when="signed-out">
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <button className="btn-secondary text-fluid-micro py-1.5 px-3.5">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn-primary text-fluid-micro py-1.5 px-3.5">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </Show>

          {/* Signed In state: User Button & Profile */}
          <Show when="signed-in">
            <div className="flex items-center gap-2.5 pl-2 pr-2.5 py-1 bg-white border border-[#E2E2DE] rounded-full shadow-sm">
              <UserButton 
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'w-6 h-6',
                  }
                }}
              />
              <Link href="/dashboard" className="text-fluid-micro font-semibold text-[#111110] hover:underline">
                My Account
              </Link>
            </div>
          </Show>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-xl bg-white border border-[#E2E2DE] text-[#111110]"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-b border-[#E2E2DE] bg-[#F5F5F3] px-5 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-fluid-body font-medium transition-colors ${
                  isActive ? 'bg-[#111110] text-white font-semibold' : 'text-[#111110] hover:bg-[#EBEBE8]'
                }`}
              >
                <span>{item.label}</span>
                <ArrowUpRight className="w-4 h-4 opacity-50" />
              </Link>
            );
          })}

          <div className="pt-3 border-t border-[#E2E2DE] flex items-center justify-between">
            <Show when="signed-out">
              <div className="flex items-center gap-2 w-full">
                <SignInButton mode="modal">
                  <button className="btn-secondary text-xs flex-1 py-2">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="btn-primary text-xs flex-1 py-2">
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            </Show>

            <Show when="signed-in">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <UserButton />
                  <span className="text-fluid-micro text-[#70706B]">Signed in</span>
                </div>
                <button onClick={() => CommuneStore.resetDefaults()} className="text-fluid-micro text-[#111110] font-semibold underline">
                  Reset Data
                </button>
              </div>
            </Show>
          </div>
        </div>
      )}
    </header>
  );
}

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
  ArrowUpRight,
  User as UserIcon,
  Plus
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/equipment', label: 'Catalog' },
    { href: '/equipment/new', label: 'List Gear' },
    { href: '/dashboard', label: 'Dashboard' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#F5F5F3]/90 backdrop-blur-md border-b border-[#E5E5E0]/60 transition-colors">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
        
        {/* Brand Monogram */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-[#111110]">
            paraquet
          </span>
          <span className="hidden sm:inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBEBE8] text-[#70706B] border border-[#E0E0DB]">
            Tezpur Univ
          </span>
        </Link>

        {/* Desktop Center Pill Navigation */}
        <nav className="hidden md:flex items-center bg-[#111110] text-white p-1 rounded-full shadow-sm border border-[#262624]">
          {navLinks.map((item) => {
            const isActive = 
              item.href === '/' 
                ? pathname === '/' 
                : pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && (item.href !== '/equipment' || pathname !== '/equipment/new'));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-[#2A2A26] text-white shadow-xs font-semibold'
                    : 'text-[#A1A19A] hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action & Clerk Auth Controls */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/equipment/new"
            className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#E5E5E0] hover:border-[#111110] text-[#111110] transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#70706B]" />
            <span>Post Gear</span>
          </Link>

          <Show when="signed-in">
            <div className="flex items-center gap-2 p-0.5 bg-white border border-[#E5E5E0] rounded-full shadow-xs hover:border-[#111110] transition-colors">
              <UserButton 
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'w-8 h-8 rounded-full',
                  }
                }}
              />
            </div>
          </Show>

          <Show when="signed-out">
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <button 
                  className="px-4 py-1.5 rounded-full bg-white border border-[#DCDCD6] hover:border-[#111110] text-[#111110] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#70706B]" />
                  <span>Sign In</span>
                </button>
              </SignInButton>
            </div>
          </Show>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-full bg-white border border-[#E5E5E0] text-[#111110] transition-transform active:scale-95 shadow-2xs"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-b border-[#E5E5E0] bg-[#F5F5F3] px-5 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 shadow-sm">
          <div className="bg-[#111110] p-1.5 rounded-2xl space-y-1">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? 'bg-[#2A2A26] text-white font-semibold' : 'text-[#A1A19A] hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="w-4 h-4 opacity-50" />
                </Link>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Show when="signed-out">
              <div className="flex items-center gap-2 w-full">
                <SignInButton mode="modal">
                  <button className="btn-secondary text-xs flex-1 py-2.5 rounded-full font-semibold">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="btn-primary text-xs flex-1 py-2.5 rounded-full font-semibold text-white">
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            </Show>

            <Show when="signed-in">
              <div className="flex items-center justify-between w-full px-1">
                <div className="flex items-center gap-2">
                  <UserButton />
                  <span className="text-xs text-[#70706B] font-medium">Logged in</span>
                </div>
                <Link href="/dashboard" className="text-xs font-semibold text-[#111110] underline">
                  My Dashboard
                </Link>
              </div>
            </Show>
          </div>
        </div>
      )}
    </header>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="w-full pb-10 pt-4">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[32px] border border-[#E5E5E0] bg-white p-8 sm:p-12 lg:p-14 overflow-hidden shadow-xs">
          
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-[#E5E5E0]">
            
            {/* 1. Brand & Tagline */}
            <div className="lg:col-span-4 space-y-4">
              <Link href="/" className="inline-block">
                <span className="font-extrabold text-2xl tracking-tight text-[#111110]">
                  paraquet
                </span>
              </Link>
              <p className="text-sm text-[#70706B] leading-relaxed max-w-sm">
                Borrow. Share. Build together. A community equipment lending and hardware sharing platform for Tezpur University, Assam.
              </p>
              
              {/* Social Icons */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://github.com/not-ayan/paraquet"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full border border-[#E5E5E0] hover:border-[#111110] flex items-center justify-center text-[#70706B] hover:text-[#111110] transition-colors"
                  aria-label="GitHub Repository"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full border border-[#E5E5E0] hover:border-[#111110] flex items-center justify-center text-[#70706B] hover:text-[#111110] transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.39 9.74v-8.37H5.07v8.37h2.78z"/>
                  </svg>
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full border border-[#E5E5E0] hover:border-[#111110] flex items-center justify-center text-[#70706B] hover:text-[#111110] transition-colors"
                  aria-label="Twitter / X"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* 2. Explore Links */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#111110]">
                Explore
              </h4>
              <ul className="space-y-2 text-sm text-[#70706B]">
                <li><Link href="/" className="hover:text-[#111110] transition-colors">Home</Link></li>
                <li><Link href="/equipment" className="hover:text-[#111110] transition-colors">Equipment Catalog</Link></li>
                <li><Link href="/equipment/new" className="hover:text-[#111110] transition-colors">Post Equipment</Link></li>
                <li><Link href="#how-it-works" className="hover:text-[#111110] transition-colors">How it works</Link></li>
                <li><Link href="#guidelines" className="hover:text-[#111110] transition-colors">Guidelines</Link></li>
                <li><Link href="#faq" className="hover:text-[#111110] transition-colors">Help Center</Link></li>
              </ul>
            </div>

            {/* 3. Community Links */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#111110]">
                Community
              </h4>
              <ul className="space-y-2 text-sm text-[#70706B]">
                <li><Link href="#about" className="hover:text-[#111110] transition-colors">Our Mission</Link></li>
                <li><Link href="#guidelines" className="hover:text-[#111110] transition-colors">Guidelines</Link></li>
                <li><Link href="#trust" className="hover:text-[#111110] transition-colors">Safety &amp; Trust</Link></li>
                <li><Link href="#sustainability" className="hover:text-[#111110] transition-colors">Sustainability</Link></li>
                <li><Link href="mailto:support@tezu.ac.in" className="hover:text-[#111110] transition-colors">Contact Us (Tezpur University)</Link></li>
              </ul>
            </div>

            {/* 4. Support Links */}
            <div className="lg:col-span-1 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#111110]">
                Support
              </h4>
              <ul className="space-y-2 text-sm text-[#70706B]">
                <li><Link href="#faq" className="hover:text-[#111110] transition-colors">FAQ</Link></li>
                <li><Link href="#report" className="hover:text-[#111110] transition-colors">Report an issue</Link></li>
                <li><Link href="#feedback" className="hover:text-[#111110] transition-colors">Give feedback</Link></li>
              </ul>
            </div>

            {/* 5. Stay in the loop (Newsletter) */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#111110]">
                Stay in the loop
              </h4>
              <p className="text-xs text-[#70706B] leading-relaxed">
                Get updates about new equipment, features, and campus events.
              </p>

              {subscribed ? (
                <div className="p-3 bg-[#E8F5EB] border border-[#A7F3D0] rounded-xl text-xs font-semibold text-[#1B7A42]">
                  ✓ Thanks! You are on the Tezpur University equipment loop.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 min-w-0 px-3.5 py-2 text-xs rounded-xl border border-[#E5E5E0] focus:border-[#111110] focus:outline-none bg-white text-[#111110]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#2D4A3E] hover:bg-[#1E332B] text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0"
                    >
                      Subscribe
                    </button>
                  </div>
                </form>
              )}

              <div className="pt-2 flex items-center gap-1.5 text-[11px] text-[#70706B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D4A3E]" />
                <span>Tezpur University, Napaam, Tezpur, Assam 784028</span>
              </div>
            </div>

          </div>

          {/* Bottom Legal & Copyright Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8E8E88]">
            <p>© {new Date().getFullYear()} Paraquet. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="#privacy" className="hover:text-[#111110] transition-colors">Privacy Policy</Link>
              <Link href="#terms" className="hover:text-[#111110] transition-colors">Terms of Service</Link>
              <Link href="#community" className="hover:text-[#111110] transition-colors">Community Guidelines</Link>
            </div>
          </div>

          {/* Decorative Corner Leaf Illustration SVG (Reference Detail) */}
          <div className="absolute -bottom-6 -left-6 pointer-events-none opacity-20">
            <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 90C30 80 50 50 55 20C55 20 70 45 90 50C70 65 50 85 10 90Z" fill="#2D4A3E"/>
              <path d="M25 85C40 70 50 45 55 20" stroke="#1E332B" strokeWidth="2" strokeLinecap="round"/>
              <path d="M40 65C50 60 65 55 75 52" stroke="#1E332B" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M30 75C45 75 60 70 68 65" stroke="#1E332B" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

        </div>
      </div>
    </footer>
  );
}

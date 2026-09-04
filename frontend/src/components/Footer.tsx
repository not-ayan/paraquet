import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#111110] text-[#FFFFFF] pt-14 pb-10 border-t border-[#262624]">
      <div className="container-custom space-y-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-[#262624]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-white">paraquet</span>
              <span className="text-fluid-micro text-[#9C9C96]">/ campus equipment library</span>
            </div>
            <p className="text-fluid-body text-[#9C9C96] max-w-md">
              A shared community library for high-end creative, engineering, and laboratory equipment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-fluid-body font-medium text-[#EBEBE8]">
            <Link href="/equipment" className="hover:text-white transition-colors flex items-center gap-1">
              Catalog <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
            </Link>
            <Link href="/equipment/new" className="hover:text-white transition-colors flex items-center gap-1">
              List Equipment <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
            </Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-fluid-micro text-[#9C9C96] gap-3">
          <p>© {new Date().getFullYear()} Paraquet Platform. Built for campus hackathon.</p>
          <p>Verified Student &amp; Department Custody Protocols</p>
        </div>

      </div>
    </footer>
  );
}

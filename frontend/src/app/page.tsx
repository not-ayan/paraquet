'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowUpRight, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Camera, 
  Mic2, 
  Wrench, 
  MonitorPlay, 
  Compass,
  ArrowRight
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Equipment } from '@/lib/types';
import EquipmentCard from '@/components/EquipmentCard';

export default function HomePage() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    apiClient.getEquipment()
      .then((data) => {
        if (isMounted) {
          setEquipmentList(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch home equipment:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = [
    { label: 'All', icon: Layers },
    { label: 'Cameras & Video', icon: Camera },
    { label: 'Audio & Sound', icon: Mic2 },
    { label: 'Workshop & Tools', icon: Wrench },
    { label: 'Projectors & Displays', icon: MonitorPlay },
    { label: 'Outdoors & Sports', icon: Compass },
  ];

  const filteredEquipment = selectedCategory === 'All' 
    ? equipmentList.slice(0, 6)
    : equipmentList.filter(e => {
        const cat = (e.category || '').toLowerCase();
        const sel = selectedCategory.toLowerCase();
        return cat.includes(sel) || sel.includes(cat);
      }).slice(0, 6);

  return (
    <div className="flex flex-col">
      
      {/* 1. HERO SECTION (Minimalist Curation Hero) */}
      <section className="pt-8 sm:pt-14 pb-12 sm:pb-16">
        <div className="container-custom">
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-10 border-b border-[#E2E2DE]">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBEBE8] text-fluid-micro font-medium text-[#70706B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#111110]" />
                <span>Campus Circular Sharing Platform</span>
              </div>
              
              <h1 className="text-fluid-display font-bold text-[#111110]">
                Borrow. Share. <br />
                Build Together.
              </h1>

              <p className="text-fluid-body-lg text-[#70706B] max-w-xl">
                High-end cameras, maker tools, audio gear, and research hardware shared across campus departments.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/equipment" className="btn-primary">
                Browse Full Catalog <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/equipment/new" className="btn-secondary">
                List Equipment
              </Link>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 text-fluid-body">
            <div>
              <span className="text-fluid-h2 font-bold text-[#111110] block">
                {equipmentList.length}+
              </span>
              <span className="text-fluid-micro text-[#70706B]">Active Campus Items</span>
            </div>
            <div>
              <span className="text-fluid-h2 font-bold text-[#111110] block">
                98.8%
              </span>
              <span className="text-fluid-micro text-[#70706B]">Verified Return Score</span>
            </div>
            <div>
              <span className="text-fluid-h2 font-bold text-[#111110] block">
                450+
              </span>
              <span className="text-fluid-micro text-[#70706B]">Shared Project Hours</span>
            </div>
            <div>
              <span className="text-fluid-h2 font-bold text-[#111110] block">
                $18.4k
              </span>
              <span className="text-fluid-micro text-[#70706B]">Student Savings</span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. CURATED CATALOG GRID */}
      <section className="py-12 sm:py-16">
        <div className="container-custom space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-fluid-h1 font-bold text-[#111110]">
                Featured Equipment
              </h2>
              <p className="text-fluid-body text-[#70706B]">
                Available for pickup at campus design labs and workshops.
              </p>
            </div>

            <Link href="/equipment" className="text-fluid-body font-semibold text-[#111110] hover:underline flex items-center gap-1">
              View All Inventory ({equipmentList.length}) <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Minimal Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.label;
              return (
                <button
                  key={cat.label}
                  onClick={() => setSelectedCategory(cat.label)}
                  className={`px-3.5 py-1.5 rounded-full text-fluid-body font-medium transition-all whitespace-nowrap border ${
                    isSelected
                      ? 'bg-[#111110] text-white border-[#111110] shadow-sm font-semibold'
                      : 'bg-white text-[#70706B] border-[#E2E2DE] hover:text-[#111110] hover:border-[#111110]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredEquipment.map((item) => (
              <EquipmentCard key={item.id} equipment={item} />
            ))}
          </div>

        </div>
      </section>

      {/* 3. HOW IT WORKS / STEWARDSHIP ARCHITECTURE */}
      <section className="bg-[#EDEDEA]/70 py-16 sm:py-20 border-y border-[#E2E2DE]">
        <div className="container-custom space-y-12">
          
          <div className="max-w-2xl space-y-2">
            <span className="text-fluid-micro font-semibold uppercase tracking-wider text-[#70706B]">
              Stewardship Flow
            </span>
            <h2 className="text-fluid-h1 font-bold text-[#111110]">
              How Paraquet Operates
            </h2>
            <p className="text-fluid-body text-[#70706B]">
              A documented circular lending system designed for student creators and research labs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="card-paraquet p-6 sm:p-8 space-y-4">
              <span className="text-fluid-micro font-bold uppercase tracking-wider text-[#70706B]">01 / Reserve</span>
              <h3 className="text-fluid-h2 font-bold text-[#111110]">
                Browse & Request
              </h3>
              <p className="text-fluid-body text-[#70706B]">
                Filter verified gear by category or campus lab. Select your schedule with instant conflict detection.
              </p>
            </div>

            <div className="card-paraquet p-6 sm:p-8 space-y-4">
              <span className="text-fluid-micro font-bold uppercase tracking-wider text-[#70706B]">02 / Inspect</span>
              <h3 className="text-fluid-h2 font-bold text-[#111110]">
                Handover & Report
              </h3>
              <p className="text-fluid-body text-[#70706B]">
                Meet the steward at the lab. Snap a quick pickup condition photo to log initial status and activate your loan.
              </p>
            </div>

            <div className="card-paraquet p-6 sm:p-8 space-y-4">
              <span className="text-fluid-micro font-bold uppercase tracking-wider text-[#70706B]">03 / Return</span>
              <h3 className="text-fluid-h2 font-bold text-[#111110]">
                Verification & Trust
              </h3>
              <p className="text-fluid-body text-[#70706B]">
                Return equipment on schedule, submit return verification photo, and build your borrower rating for premium gear.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 4. LISTING CALL TO ACTION BANNER */}
      <section className="container-custom py-16 sm:py-20">
        <div className="card-paraquet bg-[#111110] text-white p-8 sm:p-14 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="text-fluid-micro uppercase tracking-wider text-[#9C9C96] font-semibold">
              Share Campus Gear
            </span>
            <h2 className="text-fluid-h1 font-bold leading-tight">
              Have unused creative gear or lab tools?
            </h2>
            <p className="text-fluid-body text-[#EBEBE8]/80">
              List your equipment on Paraquet. Keep ownership while putting idle resources to work for fellow student projects.
            </p>
          </div>

          <Link href="/equipment/new" className="btn-secondary bg-white text-[#111110] hover:bg-[#FAF9F5] border-transparent self-start md:self-center font-bold px-7 py-3.5">
            List Equipment Today <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}

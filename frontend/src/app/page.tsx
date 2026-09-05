'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowUpRight, 
  ShieldCheck, 
  RotateCcw, 
  Clock, 
  ChevronRight, 
  Plus, 
  Minus,
  Sparkles,
  CheckCircle2,
  Users,
  Leaf,
  ChevronLeft,
  ArrowRight
} from 'lucide-react';
import { apiClient, getFallbackImage } from '@/lib/api';
import { Equipment } from '@/lib/types';
import { CommuneStore } from '@/lib/store';

export default function HomePage() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState<boolean>(true);
  const [equipmentCount, setEquipmentCount] = useState<number>(6);
  const [openServiceIdx, setOpenServiceIdx] = useState<number | null>(0);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  useEffect(() => {
    apiClient.getEquipment()
      .then((items) => {
        if (items && items.length > 0) {
          setEquipmentList(items);
          setEquipmentCount(items.length);
        } else {
          const fallback = CommuneStore.getAllEquipment();
          setEquipmentList(fallback);
          setEquipmentCount(fallback.length);
        }
        setLoadingEquipment(false);
      })
      .catch((err) => {
        console.warn('Failed to fetch equipment metrics:', err);
        const fallback = CommuneStore.getAllEquipment();
        setEquipmentList(fallback);
        setEquipmentCount(fallback.length);
        setLoadingEquipment(false);
      });
  }, []);

  const services = [
    {
      title: 'Equipment sharing',
      description: 'Find, reserve, and borrow high-demand hardware from fellow students and campus departments with verified custody logs.',
    },
    {
      title: 'Pickup and exchange',
      description: 'Convenient peer-to-peer exchange hubs located at central campus libraries, maker spaces, and department labs.',
    },
    {
      title: 'Protection & insurance',
      description: 'Every checkout is backed by student ID verification, initial condition photo proofs, and department safety guarantees.',
    },
    {
      title: 'Maintenance & care',
      description: 'Routine inspections, optical cleaning, and maintenance logging maintain all hardware in production-ready condition.',
    },
  ];

  const faqs = [
    {
      question: 'How do I borrow equipment?',
      answer: 'Simply browse the catalogue, choose your desired dates with our real-time availability calendar, and submit a reservation request. Once approved by the owner or steward, meet at the campus hub for pickup.',
    },
    {
      question: 'How does custody verification work?',
      answer: 'At pickup and return, both parties inspect the item and capture a quick condition photo in the app. This creates an unalterable timestamped condition record.',
    },
    {
      question: 'What happens if equipment is damaged?',
      answer: 'Before and after condition logs clearly distinguish existing wear from new damage. Our community trust framework and departmental support ensure fair, transparent resolution.',
    },
    {
      question: 'How long can I borrow an item for?',
      answer: 'Most gear can be borrowed for 1 to 7 days. If you need an extension for an ongoing project, you can request it through your dashboard before the return deadline.',
    },
    {
      question: 'Who can use Paraquet on campus?',
      answer: 'All enrolled students, researchers, lab technicians, and faculty members with a valid university email are eligible to join, borrow, and list equipment.',
    },
  ];

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12 sm:space-y-16">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION CONTAINER
      ───────────────────────────────────────────────────────────── */}
      <section className="relative rounded-[32px] border border-[#E5E5E0] bg-white p-6 sm:p-10 lg:p-12 shadow-xs overflow-hidden">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Hero Column: Typography & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8E8E88] block">
              Share &bull; Borrow &bull; Build Together
            </span>

            <h1 className="text-3xl sm:text-5xl lg:text-[56px] font-extrabold text-[#111110] leading-[1.06] tracking-tight">
              Borrowing Stuff from <br className="hidden sm:inline" />
              your community <br className="hidden sm:inline" />
              made easier
            </h1>

            <p className="text-[#70706B] text-sm sm:text-base leading-relaxed max-w-lg">
              High-end cameras, maker tools, audio gear, and research hardware shared across campus departments.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link 
                href="/equipment" 
                className="btn-primary !text-white px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-xs transition-transform active:scale-[0.98]"
              >
                <span className="!text-white">Browse Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5 !text-white" />
              </Link>
              <Link 
                href="/equipment/new" 
                className="btn-secondary px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-[0.98]"
              >
                List Equipment
              </Link>
            </div>

            {/* Trust Micro-badges */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4 text-xs text-[#70706B] font-medium border-t border-[#F0F0EC]">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#111110]" />
                <span>Verified community</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-[#111110]" />
                <span>Zero deposit loans</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#111110]" />
                <span>Safety guarantee</span>
              </div>
            </div>
          </div>

          {/* Right Hero Column: Equipment Collage with Handwritten Scribbles */}
          <div className="lg:col-span-5 relative flex justify-center py-4 sm:py-6">
            <div className="relative w-full max-w-[420px] h-[340px] sm:h-[380px]">
              
              {/* Card 1 (Top Left): Camera */}
              <div className="absolute top-2 left-2 sm:left-4 z-20 w-[190px] sm:w-[220px] bg-white rounded-2xl p-3 border border-[#E5E5E0] shadow-md transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="relative w-full h-[100px] sm:h-[120px] rounded-xl overflow-hidden bg-[#F5F5F3]">
                  <Image
                    src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80"
                    alt="Camera"
                    fill
                    className="object-cover"
                    sizes="220px"
                  />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-sm text-white text-[9px] font-bold">
                    &bull; Available
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-bold text-xs text-[#111110]">Sony Alpha A7</span>
                  <span className="font-handwriting text-xs text-[#1B7A42] font-bold">
                    Better than buying &rarr;
                  </span>
                </div>
              </div>

              {/* Card 2 (Top Right): Laptop */}
              <div className="absolute top-8 right-2 sm:right-0 z-10 w-[170px] sm:w-[190px] bg-white rounded-2xl p-2.5 border border-[#E5E5E0] shadow-sm transform rotate-6 hover:rotate-0 transition-transform duration-300">
                <div className="relative w-full h-[85px] sm:h-[100px] rounded-xl overflow-hidden bg-[#F5F5F3]">
                  <Image
                    src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80"
                    alt="Laptop"
                    fill
                    className="object-cover"
                    sizes="190px"
                  />
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[#111110] text-[9px] font-bold">
                    Computers
                  </span>
                </div>
                <div className="mt-1.5 text-right">
                  <span className="font-handwriting text-xs text-[#70706B] block">
                    Idea, Work, Together
                  </span>
                </div>
              </div>

              {/* Card 3 (Bottom Left): Projector */}
              <div className="absolute bottom-3 left-4 sm:left-8 z-20 w-[180px] sm:w-[200px] bg-white rounded-2xl p-2.5 border border-[#E5E5E0] shadow-md transform -rotate-4 hover:rotate-0 transition-transform duration-300">
                <div className="relative w-full h-[85px] sm:h-[95px] rounded-xl overflow-hidden bg-[#F5F5F3]">
                  <Image
                    src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=400&q=80"
                    alt="Projector"
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-[#111110] text-white text-[9px] font-bold">
                    Projectors
                  </span>
                </div>
                <div className="mt-1.5">
                  <span className="font-handwriting text-xs text-[#70706B]">
                    Shared tools balance
                  </span>
                </div>
              </div>

              {/* Card 4 (Bottom Right): Headphones */}
              <div className="absolute bottom-1 right-3 sm:right-6 z-30 w-[170px] sm:w-[190px] bg-white rounded-2xl p-2.5 border border-[#E5E5E0] shadow-lg transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="relative w-full h-[90px] sm:h-[105px] rounded-xl overflow-hidden bg-[#F5F5F3]">
                  <Image
                    src="https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=400&q=80"
                    alt="Headphones"
                    fill
                    className="object-cover"
                    sizes="190px"
                  />
                  <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-full bg-white/95 text-[#111110] text-[9px] font-bold border border-[#E5E5E0]">
                    Audio
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#111110]">Studio Over-Ear</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Hero Bottom Stats Strip */}
        <div className="mt-10 pt-8 border-t border-[#EAEAE5] grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#111110] block">
              {equipmentCount}+
            </span>
            <span className="text-xs text-[#70706B] font-medium">Active Campus Items</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#111110] block">
              98.8%
            </span>
            <span className="text-xs text-[#70706B] font-medium">Verified Return Score</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#111110] block">
              450+
            </span>
            <span className="text-xs text-[#70706B] font-medium">Shared Project Hours</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#111110] block">
              $18.4k
            </span>
            <span className="text-xs text-[#70706B] font-medium">Student Savings</span>
          </div>
        </div>

      </section>


      {/* ─────────────────────────────────────────────────────────────
          2. "WHY DO WE EXIST?" (3-COLUMN BENTO SECTION)
      ───────────────────────────────────────────────────────────── */}
      <section id="about" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Column 1: Mission Narrative & Bullet Points */}
          <div className="lg:col-span-4 rounded-[32px] border border-[#E5E5E0] bg-white p-8 sm:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8E8E88] block">
                About Us
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#111110] tracking-tight">
                Why do <br />
                we exist?
              </h2>
              <p className="text-xs sm:text-sm text-[#70706B] leading-relaxed pt-1">
                At our core, we exist to unlock value from unused campus gear and build sustainable student collaboration. Our mission is to democratize equipment access across engineering, arts, and science departments.
              </p>
            </div>

            {/* 3 Circular Value Props */}
            <div className="space-y-4 pt-2 border-t border-[#F0F0EC]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F5F5F3] border border-[#E5E5E0] flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-4 h-4 text-[#111110]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#111110]">Zero peer stress</h4>
                  <p className="text-[11px] text-[#70706B]">Clean reservations without awkward bargaining</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F5F5F3] border border-[#E5E5E0] flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-[#111110]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#111110]">Student verified</h4>
                  <p className="text-[11px] text-[#70706B]">University email &amp; ID check for peace of mind</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F5F5F3] border border-[#E5E5E0] flex items-center justify-center shrink-0 mt-0.5">
                  <Leaf className="w-4 h-4 text-[#111110]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#111110]">Sustainable circular hub</h4>
                  <p className="text-[11px] text-[#70706B]">Maximizing utilization of existing hardware</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Creative Studio Desk Photo with Slide Controls */}
          <div className="lg:col-span-4 relative rounded-[32px] overflow-hidden border border-[#E5E5E0] min-h-[360px] lg:min-h-full group">
            <Image
              src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80"
              alt="Student creative desk with camera and tech hardware"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 33vw"
            />
            {/* Top Pill Badge */}
            <div className="absolute top-4 left-4 z-10">
              <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#111110] text-xs font-bold shadow-xs border border-white/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1B7A42]" />
                <span>Verified gear</span>
              </span>
            </div>

            {/* Bottom Right Carousel Controls */}
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
              <button 
                type="button" 
                aria-label="Previous photo"
                className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-white/60 hover:bg-white text-[#111110] flex items-center justify-center shadow-xs transition-transform active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                type="button" 
                aria-label="Next photo"
                className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-white/60 hover:bg-white text-[#111110] flex items-center justify-center shadow-xs transition-transform active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Column 3: Our Service Accordion */}
          <div className="lg:col-span-4 rounded-[32px] border border-[#E5E5E0] bg-white p-8 sm:p-10 flex flex-col justify-start space-y-6">
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8E8E88] block">
                Our Service
              </span>
              <p className="text-xs text-[#70706B] leading-relaxed">
                Our campus equipment platform makes borrowing gear painless, informal, and peer-to-peer while maintaining complete safety and accountability.
              </p>

              {/* Service Accordion */}
              <div className="divide-y divide-[#F0F0EC] pt-2">
                {services.map((item, idx) => {
                  const isOpen = openServiceIdx === idx;
                  return (
                    <div key={item.title} className="py-2.5">
                      <button
                        type="button"
                        onClick={() => setOpenServiceIdx(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between text-left text-xs font-bold text-[#111110] hover:text-[#70706B] transition-colors"
                      >
                        <span>{item.title}</span>
                        {isOpen ? (
                          <Minus className="w-3.5 h-3.5 text-[#111110] shrink-0" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-[#8E8E88] shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <p className="text-[11px] text-[#70706B] pt-1.5 leading-relaxed animate-in fade-in duration-200">
                          {item.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────
          3. "EXPLORE WHAT'S AVAILABLE" (LIVE DATABASE EQUIPMENT)
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8E8E88] block">
              Catalogue
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111110] tracking-tight">
              Explore what&apos;s available
            </h2>
            <p className="text-xs sm:text-sm text-[#70706B]">
              Real-time verified equipment from campus departments and student labs ready for reservation.
            </p>
          </div>

          <Link
            href="/equipment"
            className="bg-white hover:bg-[#F9F9F8] text-[#111110] border border-[#DCDCD6] hover:border-[#111110] px-5 py-2 rounded-full text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-auto transition-all shadow-2xs shrink-0"
          >
            <span>View all inventory ({equipmentList.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Live Equipment Grid from Database (up to 8 items) */}
        {loadingEquipment ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="rounded-[24px] border border-[#E5E5E0] bg-[#F8F8F6] p-4 sm:p-5 flex flex-col justify-between h-[230px] sm:h-[250px] animate-pulse"
              >
                <div className="flex justify-between">
                  <div className="w-16 h-4 bg-[#EAEAE5] rounded-full" />
                  <div className="w-2 h-2 rounded-full bg-[#EAEAE5]" />
                </div>
                <div className="w-24 h-24 bg-[#EAEAE5] rounded-2xl mx-auto my-auto" />
                <div className="pt-2 border-t border-[#EAEAE5] space-y-1.5">
                  <div className="w-3/4 h-3 bg-[#EAEAE5] rounded" />
                  <div className="w-1/2 h-2.5 bg-[#EAEAE5] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : equipmentList.length === 0 ? (
          <div className="rounded-[28px] border border-[#E5E5E0] bg-white p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-[#111110]">No equipment items found in database.</p>
            <Link href="/equipment/new" className="btn-primary text-xs py-2 px-4 inline-flex">
              Be the first to list equipment &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
            {equipmentList.slice(0, 8).map((item) => {
              const displayImage =
                item.images && item.images.length > 0 && item.images[0]
                  ? item.images[0]
                  : getFallbackImage(item.name, item.category);

              return (
                <Link
                  key={item.id}
                  href={`/equipment/${item.id}`}
                  className="group relative rounded-[24px] border border-[#E5E5E0] bg-[#F8F8F6] hover:bg-[#F2F2EE] hover:border-[#D0D0C8] p-4 sm:p-5 flex flex-col justify-between h-[230px] sm:h-[250px] transition-all duration-200 shadow-2xs hover:shadow-xs"
                >
                  {/* Floating Category Pill & Status Dot */}
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/90 border border-[#E5E5E0] text-[#70706B] truncate max-w-[120px] sm:max-w-[140px]">
                      {item.category}
                    </span>
                    {item.availabilityStatus === 'AVAILABLE' ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#1B7A42]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1B7A42]" />
                        <span className="hidden sm:inline">Free</span>
                      </span>
                    ) : item.availabilityStatus === 'MAINTENANCE' ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#DC2626]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                        <span className="hidden sm:inline">Maint.</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#1D4ED8]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" />
                        <span className="hidden sm:inline">Booked</span>
                      </span>
                    )}
                  </div>

                  {/* Center Hardware Image with Subtle Float Effect */}
                  <div className="relative w-full h-[110px] sm:h-[125px] flex items-center justify-center my-auto">
                    <div className="relative w-full h-full transform group-hover:scale-105 transition-transform duration-300">
                      <Image
                        src={displayImage}
                        alt={item.name}
                        fill
                        className="object-contain drop-shadow-sm"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>
                  </div>

                  {/* Bottom Card Meta: Title, Location, and Arrow Icon Button */}
                  <div className="flex items-end justify-between pt-2 border-t border-[#EAEAE5]">
                    <div className="min-w-0 pr-2">
                      <h3 className="text-xs sm:text-sm font-bold text-[#111110] group-hover:text-black truncate">
                        {item.name}
                      </h3>
                      <span className="text-[10px] sm:text-[11px] text-[#70706B] truncate block">
                        {item.location || 'Central Campus Lab'}
                      </span>
                    </div>

                    <div className="w-6 h-6 rounded-full bg-white border border-[#E0E0DA] group-hover:border-[#111110] group-hover:bg-[#111110] group-hover:text-white flex items-center justify-center text-[#70706B] transition-all shadow-2xs shrink-0">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Bottom Link */}
        <div className="pt-2">
          <Link
            href="/equipment"
            className="text-xs font-bold text-[#111110] hover:underline inline-flex items-center gap-1"
          >
            <span>Browse Full Catalogue</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

      </section>


      {/* ─────────────────────────────────────────────────────────────
          4. "HOW TO POST YOURS" (3-STEP STEPPER PROCESS)
      ───────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="space-y-6">
        
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8E8E88] block">
            Get Started
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111110] tracking-tight">
            How to post yours
          </h2>
          <p className="text-xs sm:text-sm text-[#70706B]">
            Share your unused equipment with the community in just a few steps.
          </p>
        </div>

        {/* 3 Stepped Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Step 1: Click a photo */}
          <div className="rounded-[28px] border border-[#E5E5E0] bg-white p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="space-y-4">
              <span className="w-7 h-7 rounded-full bg-[#111110] text-white text-xs font-bold flex items-center justify-center">
                01
              </span>

              {/* Illustrated Preview: Camera with Tag */}
              <div className="relative w-full h-[150px] rounded-2xl bg-[#F6F6F3] border border-[#ECECE8] flex items-center justify-center overflow-hidden p-3">
                <div className="relative w-32 h-24 transform -rotate-6">
                  <Image
                    src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=300&q=80"
                    alt="Camera capture"
                    fill
                    className="object-contain"
                    sizes="140px"
                  />
                </div>
                <div className="absolute top-3 right-3 bg-white px-2 py-0.5 rounded-full border border-[#E2E2DE] text-[9px] font-bold text-[#111110] shadow-xs">
                  1 Photo / Angle
                </div>
                <Sparkles className="absolute bottom-3 left-3 w-4 h-4 text-[#A1A19A]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#111110]">
                Click a photo
              </h3>
              <p className="text-xs text-[#70706B] leading-relaxed">
                Add clear photos of your equipment and state all custody and condition details.
              </p>
            </div>
          </div>

          {/* Step 2: Create a request (Form UI Mockup) */}
          <div className="rounded-[28px] border border-[#E5E5E0] bg-white p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="space-y-4">
              <span className="w-7 h-7 rounded-full bg-[#111110] text-white text-xs font-bold flex items-center justify-center">
                02
              </span>

              {/* Illustrated Preview: Mini Listing Form */}
              <div className="relative w-full h-[150px] rounded-2xl bg-[#F6F6F3] border border-[#ECECE8] flex flex-col justify-center px-4 py-3 space-y-2 overflow-hidden">
                <div className="bg-white rounded-xl p-2 border border-[#E2E2DE] shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] text-[#70706B]">
                    <span>Item Title</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#111110]" />
                  </div>
                  <div className="h-4 bg-[#F2F2EE] rounded-md w-3/4" />
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="px-1.5 py-0.5 bg-[#EAEAE5] rounded text-[8px] text-[#70706B]">Category</span>
                    <span className="px-1.5 py-0.5 bg-[#EAEAE5] rounded text-[8px] text-[#70706B]">Campus Lab</span>
                  </div>
                </div>
                <Sparkles className="absolute top-2 right-3 w-4 h-4 text-[#A1A19A]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#111110]">
                Create a request
              </h3>
              <p className="text-xs text-[#70706B] leading-relaxed">
                Fill in the details and submit your equipment for listing in seconds.
              </p>
            </div>
          </div>

          {/* Step 3: Admin will verify it */}
          <div className="rounded-[28px] border border-[#E5E5E0] bg-white p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="space-y-4">
              <span className="w-7 h-7 rounded-full bg-[#111110] text-white text-xs font-bold flex items-center justify-center">
                03
              </span>

              {/* Illustrated Preview: Verification Seal Card */}
              <div className="relative w-full h-[150px] rounded-2xl bg-[#F6F6F3] border border-[#ECECE8] flex items-center justify-center overflow-hidden p-4">
                <div className="bg-white rounded-2xl p-4 border border-[#E2E2DE] shadow-sm flex flex-col items-center text-center space-y-1.5">
                  <div className="w-8 h-8 rounded-full bg-[#E8F5EB] border border-[#A7F3D0] flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-[#1B7A42]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#111110]">Approved!</span>
                  <span className="text-[9px] text-[#70706B]">Now live in catalogue</span>
                </div>
                <Sparkles className="absolute top-3 right-4 w-4 h-4 text-[#A1A19A]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#111110]">
                Our admin will verify it
              </h3>
              <p className="text-xs text-[#70706B] leading-relaxed">
                We review your post to keep the community safe and reliable. Once approved, it goes live in the catalogue.
              </p>
            </div>
          </div>

        </div>

      </section>


      {/* ─────────────────────────────────────────────────────────────
          5. FREQUENTLY ASKED QUESTIONS (FAQ SECTION)
      ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="space-y-6 pt-4">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: FAQ Heading & CTA */}
          <div className="lg:col-span-4 space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8E8E88] block">
              FAQ
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111110] tracking-tight">
              Frequently asked <br className="hidden sm:inline" />
              questions
            </h2>
            <p className="text-xs sm:text-sm text-[#70706B] leading-relaxed">
              Everything you need to know about borrowing, posting, and managing equipment on Paraquet.
            </p>

            <div className="pt-2">
              <Link
                href="mailto:support@paraquet.campus.edu"
                className="bg-white hover:bg-[#F9F9F8] text-[#111110] border border-[#DCDCD6] hover:border-[#111110] px-5 py-2.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-2xs"
              >
                <span>View Help Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Accordion Items */}
          <div className="lg:col-span-8 divide-y divide-[#EAEAE5] border-y border-[#EAEAE5]">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={faq.question} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left group"
                  >
                    <span className="text-xs sm:text-sm font-bold text-[#111110] group-hover:text-black">
                      {faq.question}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-[#F5F5F3] group-hover:bg-[#EAEAE5] flex items-center justify-center shrink-0 transition-colors ml-4">
                      {isOpen ? (
                        <Minus className="w-3.5 h-3.5 text-[#111110]" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-[#70706B]" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <p className="text-xs sm:text-[13px] text-[#70706B] pt-2.5 pr-8 leading-relaxed animate-in fade-in duration-200">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </section>

    </div>
  );
}

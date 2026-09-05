'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  SlidersHorizontal, 
  Layers, 
  Camera, 
  Mic2, 
  Wrench, 
  MonitorPlay, 
  Compass, 
  PlusCircle, 
  RotateCcw,
  Calendar,
  CalendarRange,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Equipment } from '@/lib/types';
import EquipmentCard from '@/components/EquipmentCard';

export default function EquipmentCatalogPage() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'name'>('newest');
  const [loading, setLoading] = useState<boolean>(true);

  // Date-Wise Availability State
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [onlyFreeForDates, setOnlyFreeForDates] = useState<boolean>(false);

  const todayStr = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  // Fetch equipment with date range parameters
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    apiClient.getEquipment({
      category: selectedCategory !== 'All' ? selectedCategory : undefined,
      search: search.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      availableOnly: onlyFreeForDates,
    })
      .then((data) => {
        if (isMounted) {
          setEquipmentList(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to load equipment catalog:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, startDate, endDate, onlyFreeForDates]);

  const categories = [
    { label: 'All', icon: Layers },
    { label: 'Cameras & Video', icon: Camera },
    { label: 'Audio & Sound', icon: Mic2 },
    { label: 'Workshop & Tools', icon: Wrench },
    { label: 'Projectors & Displays', icon: MonitorPlay },
    { label: 'Outdoors & Sports', icon: Compass },
  ];

  // Quick Date Range Presets
  const applyDatePreset = (preset: 'tomorrow' | 'weekend' | '3days' | 'nextWeek') => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (preset === 'tomorrow') {
      start.setDate(today.getDate() + 1);
      end.setDate(today.getDate() + 2);
    } else if (preset === '3days') {
      start.setDate(today.getDate() + 1);
      end.setDate(today.getDate() + 4);
    } else if (preset === 'weekend') {
      const day = today.getDay();
      const daysUntilFri = (5 - day + 7) % 7 || 7;
      start.setDate(today.getDate() + daysUntilFri);
      end.setDate(today.getDate() + daysUntilFri + 2);
    } else if (preset === 'nextWeek') {
      const day = today.getDay();
      const daysUntilMon = (8 - day) % 7 || 7;
      start.setDate(today.getDate() + daysUntilMon);
      end.setDate(today.getDate() + daysUntilMon + 5);
    }

    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    setStartDate(fmt(start));
    setEndDate(fmt(end));
    setOnlyFreeForDates(true);
  };

  const clearDates = () => {
    setStartDate('');
    setEndDate('');
    setOnlyFreeForDates(false);
  };

  // Client-side filtering
  const filtered = equipmentList.filter((item) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchLoc = item.location?.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchLoc && !matchCat) return false;
    }

    if (selectedCategory !== 'All' && item.category !== selectedCategory) {
      return false;
    }

    if (onlyAvailable && item.availabilityStatus !== 'AVAILABLE') {
      return false;
    }

    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (startDate && endDate) {
      const aFree = a.dateAvailability?.isAvailable ? 1 : 0;
      const bFree = b.dateAvailability?.isAvailable ? 1 : 0;
      if (aFree !== bFree) return bFree - aFree;
    }
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return a.name.localeCompare(b.name);
  });

  const availableCount = filtered.filter(i => i.dateAvailability?.isAvailable).length;
  const conflictingCount = filtered.filter(i => i.dateAvailability && !i.dateAvailability.isAvailable).length;

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-[#E5E5E0]">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F5F3] border border-[#E5E5E0] text-[11px] font-semibold text-[#70706B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1B7A42]" />
            <span>Equipment Catalog</span>
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#111110] tracking-tight">
            Tezpur University Equipment Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#70706B] max-w-xl">
            Search, filter, and inspect real-time date availability for verified hardware shared across Tezpur University departments in Assam.
          </p>
        </div>

        <Link 
          href="/equipment/new" 
          className="btn-primary self-start sm:self-auto text-xs px-5 py-2.5 inline-flex items-center gap-2 shadow-2xs"
        >
          <PlusCircle className="w-4 h-4" /> 
          <span>List Equipment</span>
        </Link>
      </div>

      {/* Date-Wise Availability Bento Box */}
      <div className="rounded-[28px] border border-[#E5E5E0] bg-white p-5 sm:p-7 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0F0EE] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F5F5F3] border border-[#E5E5E0] flex items-center justify-center text-[#111110]">
              <CalendarRange className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-[#111110]">
                Date-Wise Availability Search
              </h2>
              <span className="text-[11px] text-[#70706B] hidden sm:block">
                Select your loan window to verify real-time calendar reservations
              </span>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1 sm:pt-0">
            <span className="text-[11px] text-[#70706B] font-semibold mr-1 hidden lg:inline">Quick Presets:</span>
            <button
              type="button"
              onClick={() => applyDatePreset('tomorrow')}
              className="px-3 py-1 rounded-full text-[11px] font-semibold border border-[#E5E5E0] hover:border-[#111110] bg-[#F8F8F6] hover:bg-white text-[#111110] transition-all whitespace-nowrap active:scale-95"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('3days')}
              className="px-3 py-1 rounded-full text-[11px] font-semibold border border-[#E5E5E0] hover:border-[#111110] bg-[#F8F8F6] hover:bg-white text-[#111110] transition-all whitespace-nowrap active:scale-95"
            >
              Next 3 Days
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('weekend')}
              className="px-3 py-1 rounded-full text-[11px] font-semibold border border-[#E5E5E0] hover:border-[#111110] bg-[#F8F8F6] hover:bg-white text-[#111110] transition-all whitespace-nowrap active:scale-95"
            >
              This Weekend
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('nextWeek')}
              className="px-3 py-1 rounded-full text-[11px] font-semibold border border-[#E5E5E0] hover:border-[#111110] bg-[#F8F8F6] hover:bg-white text-[#111110] transition-all whitespace-nowrap active:scale-95"
            >
              Next Week
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-end">
          <div className="sm:col-span-4 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#70706B] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#111110]" />
              <span>Borrow From (Pickup)</span>
            </label>
            <input
              type="date"
              min={todayStr}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate && e.target.value > endDate) {
                  setEndDate(e.target.value);
                }
              }}
              className="input-paraquet h-[44px] text-xs font-semibold rounded-2xl"
            />
          </div>

          <div className="sm:col-span-4 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#70706B] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#111110]" />
              <span>Return By (Drop-off)</span>
            </label>
            <input
              type="date"
              min={startDate || todayStr}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-paraquet h-[44px] text-xs font-semibold rounded-2xl"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyFreeForDates(!onlyFreeForDates)}
              disabled={!startDate || !endDate}
              className={`flex-1 h-[44px] px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 active:scale-95 ${
                !startDate || !endDate
                  ? 'opacity-50 cursor-not-allowed bg-[#F9F9F8] text-[#70706B] border-[#E5E5E0]'
                  : onlyFreeForDates
                  ? 'bg-[#111110] text-white border-[#111110] shadow-xs'
                  : 'bg-white text-[#111110] border-[#E5E5E0] hover:border-[#111110]'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${onlyFreeForDates ? 'text-[#4ADE80]' : 'text-[#70706B]'}`} />
              <span>{onlyFreeForDates ? 'Only Free Items' : 'Hide Booked Gear'}</span>
            </button>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={clearDates}
                className="h-[44px] px-3.5 rounded-2xl border border-[#E5E5E0] hover:border-[#111110] bg-white text-xs text-[#70706B] hover:text-[#111110] font-semibold transition-all active:scale-95"
                title="Clear dates"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Active Date Query Summary */}
        {startDate && endDate && (
          <div className="pt-2 border-t border-[#F0F0EE] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#111110]">
              <span className="w-2 h-2 rounded-full bg-[#1B7A42] animate-pulse" />
              <span>
                Availability window: <strong>{new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong> to <strong>{new Date(endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
              </span>
            </div>
            <span className="text-[#70706B] font-medium">
              <strong className="text-[#1B7A42]">{availableCount}</strong> free • <strong className="text-[#DC2626]">{conflictingCount}</strong> reserved during this window
            </span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-[#70706B] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search equipment by name, keywords, or Tezpur University lab..."
              className="input-paraquet input-icon-left !pl-11 pr-4 h-[46px] rounded-2xl text-xs sm:text-sm font-medium"
            />
          </div>

          {/* Quick Availability Toggle */}
          <div className="md:col-span-3 flex items-center">
            <button
              onClick={() => setOnlyAvailable(!onlyAvailable)}
              className={`w-full h-[46px] px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all border flex items-center justify-center gap-2 active:scale-95 ${
                onlyAvailable
                  ? 'bg-[#111110] text-white border-[#111110] shadow-xs'
                  : 'bg-white text-[#111110] border-[#E5E5E0] hover:border-[#111110]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${onlyAvailable ? 'bg-[#4ADE80]' : 'bg-[#1B7A42]'}`} />
              <span>{onlyAvailable ? 'Showing: Available Only' : 'Filter: Ready to Borrow'}</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'name')}
              className="input-paraquet h-[46px] rounded-2xl text-xs sm:text-sm font-semibold cursor-pointer"
            >
              <option value="newest">Sort: Recently Added</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>
          </div>

        </div>

        {/* Category Pills Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-0.5">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.label;
            const Icon = cat.icon;
            return (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.label)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap border flex items-center gap-1.5 active:scale-95 ${
                  isSelected
                    ? 'bg-[#111110] text-white border-[#111110] shadow-2xs font-bold'
                    : 'bg-white text-[#70706B] border-[#E5E5E0] hover:text-[#111110] hover:border-[#111110]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Results Count & Clear Action */}
        <div className="flex items-center justify-between text-xs text-[#70706B] pt-1">
          <span>
            Showing <strong>{filtered.length}</strong> items
            {selectedCategory !== 'All' && ` in "${selectedCategory}"`}
            {onlyAvailable && ' (Available Only)'}
            {startDate && endDate && onlyFreeForDates && ' (Free for Dates)'}
          </span>

          {(search || selectedCategory !== 'All' || onlyAvailable || startDate || endDate) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
                setOnlyAvailable(false);
                clearDates();
              }}
              className="flex items-center gap-1.5 text-[#111110] hover:underline font-bold text-xs"
            >
              <RotateCcw className="w-3 h-3" /> 
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Equipment Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="rounded-[28px] border border-[#E5E5E0] bg-white p-4 flex flex-col justify-between h-[280px] animate-pulse"
            >
              <div className="w-full aspect-[4/3] bg-[#EDEDEA] rounded-[20px]" />
              <div className="pt-3 space-y-2">
                <div className="w-3/4 h-4 bg-[#EDEDEA] rounded" />
                <div className="w-1/2 h-3 bg-[#EDEDEA] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {filtered.map((item) => (
            <EquipmentCard 
              key={item.id} 
              equipment={item} 
              selectedDates={startDate && endDate ? { startDate, endDate } : undefined} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-[28px] border border-[#E5E5E0] bg-white p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#F5F5F3] border border-[#E5E5E0] flex items-center justify-center text-[#70706B] mx-auto">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[#111110]">
            No matching equipment found
          </h3>
          <p className="text-xs sm:text-sm text-[#70706B] max-w-sm mx-auto">
            {startDate && endDate && onlyFreeForDates
              ? 'All equipment in this category has existing reservations during your selected dates. Try expanding your dates or clearing filters.'
              : 'Try adjusting your search keywords or switching category filters.'}
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('All');
              setOnlyAvailable(false);
              clearDates();
            }}
            className="btn-secondary text-xs px-5 py-2.5 rounded-full"
          >
            Reset Filters
          </button>
        </div>
      )}

    </div>
  );
}

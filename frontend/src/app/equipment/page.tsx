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
  Clock,
  Sparkles
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Equipment } from '@/lib/types';
import EquipmentCard from '@/components/EquipmentCard';

export default function EquipmentCataloguePage() {
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
      end.setDate(start.getDate() + 2);
    } else if (preset === 'nextWeek') {
      start.setDate(today.getDate() + 7);
      end.setDate(today.getDate() + 10);
    }

    const formatYMD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dayStr}`;
    };

    setStartDate(formatYMD(start));
    setEndDate(formatYMD(end));
  };

  const clearDates = () => {
    setStartDate('');
    setEndDate('');
    setOnlyFreeForDates(false);
  };

  // Local Client Filtering
  const filtered = equipmentList.filter((item) => {
    if (item.approvalStatus !== 'APPROVED') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (item.name || '').toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      const matchLoc = (item.location || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchLoc) return false;
    }

    if (selectedCategory !== 'All') {
      const cat = (item.category || '').toLowerCase();
      const sel = selectedCategory.toLowerCase();
      if (!cat.includes(sel) && !sel.includes(cat)) return false;
    }

    if (onlyAvailable && item.availabilityStatus !== 'AVAILABLE') {
      return false;
    }

    if (onlyFreeForDates && item.dateAvailability && !item.dateAvailability.isAvailable) {
      return false;
    }

    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    // When dates are active, prioritize items free on those dates
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
    <div className="container-custom py-8 sm:py-12 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E2E2DE]">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBEBE8] text-fluid-micro font-medium text-[#70706B]">
            <span>Campus Repository</span>
          </div>
          <h1 className="text-fluid-h1 font-bold text-[#111110]">
            Equipment Catalog
          </h1>
          <p className="text-fluid-body text-[#70706B] max-w-xl">
            Explore verified cameras, sensors, audio arrays, and fabrication tools available across campus labs.
          </p>
        </div>

        <Link href="/equipment/new" className="btn-primary self-start md:self-auto">
          <PlusCircle className="w-4 h-4" /> List Equipment
        </Link>
      </div>

      {/* Date-Wise Availability Bar */}
      <div className="card-paraquet p-4 sm:p-6 space-y-4 bg-white border border-[#E2E2DE] rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0F0EE] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#F4F4F2] rounded-lg text-[#111110]">
              <CalendarRange className="w-4 h-4" />
            </div>
            <h2 className="text-fluid-body font-bold text-[#111110]">
              Date-Wise Availability Search
            </h2>
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1 sm:pt-0">
            <span className="text-[11px] text-[#70706B] font-medium mr-1 hidden lg:inline">Quick Dates:</span>
            <button
              type="button"
              onClick={() => applyDatePreset('tomorrow')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-[#E2E2DE] hover:border-[#111110] hover:bg-[#F9F9F8] transition-all whitespace-nowrap"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('3days')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-[#E2E2DE] hover:border-[#111110] hover:bg-[#F9F9F8] transition-all whitespace-nowrap"
            >
              Next 3 Days
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('weekend')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-[#E2E2DE] hover:border-[#111110] hover:bg-[#F9F9F8] transition-all whitespace-nowrap"
            >
              This Weekend
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('nextWeek')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-[#E2E2DE] hover:border-[#111110] hover:bg-[#F9F9F8] transition-all whitespace-nowrap"
            >
              Next Week
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-4 space-y-1">
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
              className="input-paraquet h-[42px] text-fluid-body"
            />
          </div>

          <div className="sm:col-span-4 space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#70706B] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#111110]" />
              <span>Return By (Drop-off)</span>
            </label>
            <input
              type="date"
              min={startDate || todayStr}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-paraquet h-[42px] text-fluid-body"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyFreeForDates(!onlyFreeForDates)}
              disabled={!startDate || !endDate}
              className={`flex-1 h-[42px] px-3 rounded-xl text-fluid-micro font-bold border transition-all flex items-center justify-center gap-1.5 ${
                !startDate || !endDate
                  ? 'opacity-50 cursor-not-allowed bg-[#F9F9F8] text-[#70706B] border-[#E2E2DE]'
                  : onlyFreeForDates
                  ? 'bg-[#111110] text-white border-[#111110] shadow-xs'
                  : 'bg-white text-[#111110] border-[#E2E2DE] hover:border-[#111110]'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${onlyFreeForDates ? 'text-[#4ADE80]' : 'text-[#70706B]'}`} />
              <span>{onlyFreeForDates ? 'Only Free Items' : 'Hide Booked Gear'}</span>
            </button>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={clearDates}
                className="h-[42px] px-3 rounded-xl border border-[#E2E2DE] hover:border-[#111110] text-fluid-micro text-[#70706B] hover:text-[#111110] font-medium transition-all"
                title="Clear dates"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Active Date Query Summary */}
        {startDate && endDate && (
          <div className="pt-2 border-t border-[#F0F0EE] flex flex-wrap items-center justify-between gap-2 text-[11px] animate-fade-in">
            <div className="flex items-center gap-2 text-[#111110]">
              <span className="w-2 h-2 rounded-full bg-[#1B7A42] animate-pulse" />
              <span>
                Checking availability window: <strong>{new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong> to <strong>{new Date(endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
              </span>
            </div>
            <span className="text-[#70706B]">
              <strong>{availableCount}</strong> free • <strong>{conflictingCount}</strong> reserved during this window
            </span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-[#70706B] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search equipment by name, keywords, or campus room..."
              className="input-paraquet pl-10 pr-4 h-[46px]"
            />
          </div>

          {/* Quick Availability Toggle (General catalog status) */}
          <div className="md:col-span-3 flex items-center">
            <button
              onClick={() => setOnlyAvailable(!onlyAvailable)}
              className={`w-full h-[46px] px-4 rounded-xl text-fluid-body font-semibold transition-all border flex items-center justify-center gap-2 ${
                onlyAvailable
                  ? 'bg-[#111110] text-white border-[#111110] shadow-sm'
                  : 'bg-white text-[#111110] border-[#E2E2DE] hover:border-[#111110]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${onlyAvailable ? 'bg-[#4ADE80]' : 'bg-[#1B7A42]'}`} />
              {onlyAvailable ? 'Catalog: Available Only' : 'Filter: Available Now'}
            </button>
          </div>

          {/* Sort Selector */}
          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'name')}
              className="input-paraquet h-[46px] text-fluid-body font-medium cursor-pointer"
            >
              <option value="newest">Sort: Recently Added</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>
          </div>

        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-0.5">
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

        {/* Results Count & Clear */}
        <div className="flex items-center justify-between text-fluid-micro text-[#70706B] pt-1">
          <span>
            Showing <strong>{filtered.length}</strong> items
            {selectedCategory !== 'All' && ` in "${selectedCategory}"`}
            {onlyAvailable && ' (Catalog Available)'}
            {startDate && endDate && onlyFreeForDates && ' (Free for Dates Only)'}
          </span>

          {(search || selectedCategory !== 'All' || onlyAvailable || startDate || endDate) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
                setOnlyAvailable(false);
                clearDates();
              }}
              className="flex items-center gap-1 text-[#111110] hover:underline font-semibold"
            >
              <RotateCcw className="w-3 h-3" /> Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Equipment Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-[#111110] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-fluid-micro text-[#70706B]">Evaluating catalog & date schedules...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filtered.map((item) => (
            <EquipmentCard 
              key={item.id} 
              equipment={item} 
              selectedDates={startDate && endDate ? { startDate, endDate } : undefined} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 card-paraquet space-y-3">
          <SlidersHorizontal className="w-8 h-8 text-[#70706B] mx-auto opacity-40" />
          <h3 className="text-fluid-h2 font-bold text-[#111110]">
            No matching equipment found
          </h3>
          <p className="text-fluid-body text-[#70706B] max-w-sm mx-auto">
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
            className="btn-secondary text-xs"
          >
            Reset Filters
          </button>
        </div>
      )}

    </div>
  );
}

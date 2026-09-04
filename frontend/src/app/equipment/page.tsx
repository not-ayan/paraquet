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
  RotateCcw
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
        console.warn('Failed to load equipment catalog:', err);
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

  // Filtering
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

    return true;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return a.name.localeCompare(b.name);
  });

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

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-[#70706B] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search equipment by name, keywords, or campus room..."
              className="input-paraquet pl-10 pr-4"
            />
          </div>

          {/* Quick Availability Toggle */}
          <div className="md:col-span-3 flex items-center">
            <button
              onClick={() => setOnlyAvailable(!onlyAvailable)}
              className={`w-full py-2.5 px-4 rounded-xl text-fluid-body font-semibold transition-all border flex items-center justify-center gap-2 ${
                onlyAvailable
                  ? 'bg-[#111110] text-white border-[#111110] shadow-sm'
                  : 'bg-white text-[#111110] border-[#E2E2DE] hover:border-[#111110]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${onlyAvailable ? 'bg-[#4ADE80]' : 'bg-[#1B7A42]'}`} />
              {onlyAvailable ? 'Available Only' : 'Filter: Available Now'}
            </button>
          </div>

          {/* Sort Selector */}
          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'name')}
              className="input-paraquet text-fluid-body font-medium cursor-pointer"
            >
              <option value="newest">Sort: Recently Added</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>
          </div>

        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
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
      </div>

      {/* Results Count & Clear */}
      <div className="flex items-center justify-between text-fluid-micro text-[#70706B]">
        <span>
          Showing <strong>{filtered.length}</strong> items
          {selectedCategory !== 'All' && ` in "${selectedCategory}"`}
          {onlyAvailable && ' (Available Only)'}
        </span>

        {(search || selectedCategory !== 'All' || onlyAvailable) && (
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('All');
              setOnlyAvailable(false);
            }}
            className="flex items-center gap-1 text-[#111110] hover:underline font-semibold"
          >
            <RotateCcw className="w-3 h-3" /> Reset Filters
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filtered.map((item) => (
            <EquipmentCard key={item.id} equipment={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 card-paraquet space-y-3">
          <SlidersHorizontal className="w-8 h-8 text-[#70706B] mx-auto opacity-40" />
          <h3 className="text-fluid-h2 font-bold text-[#111110]">
            No matching equipment found
          </h3>
          <p className="text-fluid-body text-[#70706B] max-w-sm mx-auto">
            Try adjusting your search keywords or switching category filters.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('All');
              setOnlyAvailable(false);
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

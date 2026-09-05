'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, MapPin, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Equipment } from '@/lib/types';

interface EquipmentCardProps {
  equipment: Equipment;
  selectedDates?: {
    startDate?: string;
    endDate?: string;
  };
}

export default function EquipmentCard({ equipment, selectedDates }: EquipmentCardProps) {
  const isAvailable = equipment.availabilityStatus === 'AVAILABLE' && equipment.approvalStatus === 'APPROVED';

  const hrefWithDates = selectedDates?.startDate && selectedDates?.endDate
    ? `/equipment/${equipment.id}?startDate=${selectedDates.startDate}&endDate=${selectedDates.endDate}`
    : `/equipment/${equipment.id}`;

  const getStatusPill = () => {
    // If date availability has been evaluated for this item
    if (equipment.dateAvailability) {
      if (equipment.dateAvailability.isAvailable) {
        return (
          <span className="badge-pill bg-[#E8F5EB] text-[#1B7A42] border border-[#A7F3D0] shadow-xs">
            ✓ Free on Dates
          </span>
        );
      }
      return (
        <span 
          className="badge-pill bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047] shadow-xs truncate max-w-[140px]"
          title={equipment.dateAvailability.conflictReason || 'Reserved for selected dates'}
        >
          ⏳ {equipment.dateAvailability.conflictReason || 'Booked on Dates'}
        </span>
      );
    }

    if (equipment.approvalStatus === 'PENDING') {
      return <span className="badge-pill badge-pending">Pending Review</span>;
    }
    if (equipment.availabilityStatus === 'AVAILABLE') {
      return <span className="badge-pill badge-available">● Available</span>;
    }
    if (equipment.availabilityStatus === 'BOOKED') {
      return <span className="badge-pill badge-booked">In Use</span>;
    }
    return <span className="badge-pill badge-unavailable">Maintenance</span>;
  };

  return (
    <div className="card-paraquet p-3 sm:p-4 flex flex-col group h-full">
      
      {/* Media Inset Frame */}
      <Link href={hrefWithDates} className="block relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#EDEDEA] cursor-pointer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={equipment.images[0] || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80'}
          alt={equipment.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Floating Top Bar: Category Pill & Arrow Button */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <span className="px-2.5 py-1 rounded-full text-fluid-micro font-medium bg-white/90 text-[#111110] backdrop-blur-md shadow-sm truncate max-w-[calc(100%-36px)] pointer-events-auto">
            {equipment.category}
          </span>

          <div className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#111110] shadow-sm transition-transform group-hover:scale-110 flex-shrink-0 pointer-events-auto">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Floating Bottom Bar: Owner Pill & Status Pill */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <span className="px-2.5 py-1 rounded-full text-fluid-micro font-medium bg-[#111110]/80 text-white backdrop-blur-md flex items-center gap-1.5 min-w-0 max-w-[55%] pointer-events-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={equipment.ownerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&q=80'}
              alt=""
              className="w-3.5 h-3.5 rounded-full object-cover flex-shrink-0"
            />
            <span className="truncate">{equipment.ownerName?.split(' ')[0] || 'Steward'}</span>
          </span>

          <div className="flex-shrink-0 pointer-events-auto">
            {getStatusPill()}
          </div>
        </div>
      </Link>

      {/* Content Baseline */}
      <div className="pt-3.5 pb-0.5 px-1 flex flex-col justify-between flex-grow">
        <div className="flex items-start justify-between gap-2">
          <Link href={hrefWithDates} className="block min-w-0 flex-1">
            <h3 className="text-fluid-h3 font-bold text-[#111110] group-hover:underline truncate">
              {equipment.name}
            </h3>
          </Link>
          <span className="text-fluid-micro text-[#70706B] whitespace-nowrap font-medium pt-0.5 flex-shrink-0">
            {equipment.maxBorrowDays || 3}d max
          </span>
        </div>

        {/* Date-Specific Availability Callout */}
        {equipment.dateAvailability && (
          <div className={`mt-2 py-1 px-2.5 rounded-xl text-[11px] font-semibold flex items-center justify-between gap-1.5 ${
            equipment.dateAvailability.isAvailable
              ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]'
              : 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]'
          }`}>
            <span className="flex items-center gap-1.5 min-w-0 truncate">
              {equipment.dateAvailability.isAvailable ? (
                <CheckCircle2 className="w-3 h-3 text-[#166534] flex-shrink-0" />
              ) : (
                <AlertCircle className="w-3 h-3 text-[#B45309] flex-shrink-0" />
              )}
              <span className="truncate">
                {equipment.dateAvailability.isAvailable
                  ? 'Free for requested dates'
                  : equipment.dateAvailability.conflictReason}
              </span>
            </span>
            <span className="text-[10px] uppercase font-bold opacity-80 flex-shrink-0">
              {equipment.dateAvailability.isAvailable ? 'Ready' : 'Booked'}
            </span>
          </div>
        )}

        <div className="mt-2.5 pt-2 border-t border-[#E2E2DE]/60 flex items-center justify-between text-fluid-micro text-[#70706B] gap-2">
          <span className="flex items-center gap-1 min-w-0 flex-1 truncate">
            <MapPin className="w-3 h-3 text-[#111110] flex-shrink-0" />
            <span className="truncate">{equipment.location}</span>
          </span>
          <span className="font-semibold text-[#111110] flex-shrink-0">
            {equipment.currentCondition}
          </span>
        </div>
      </div>

    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Equipment } from '@/lib/types';
import { getFallbackImage } from '@/lib/api';

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

  const displayImage =
    equipment.images && equipment.images.length > 0 && equipment.images[0]
      ? equipment.images[0]
      : getFallbackImage(equipment.name, equipment.category);

  const getStatusBadge = () => {
    // If date availability has been evaluated for this item
    if (equipment.dateAvailability) {
      if (equipment.dateAvailability.isAvailable) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F5EB]/95 backdrop-blur-xs text-[#1B7A42] border border-[#A7F3D0] text-[10px] font-bold shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1B7A42]" />
            <span>Free on Dates</span>
          </span>
        );
      }
      return (
        <span 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEF9C3]/95 backdrop-blur-xs text-[#854D0E] border border-[#FDE047] text-[10px] font-bold shadow-2xs truncate max-w-[150px]"
          title={equipment.dateAvailability.conflictReason || 'Reserved for selected dates'}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#854D0E]" />
          <span className="truncate">{equipment.dateAvailability.conflictReason || 'Booked on Dates'}</span>
        </span>
      );
    }

    if (equipment.approvalStatus === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEF3C7]/95 backdrop-blur-xs text-[#B25E09] border border-[#FDE68A] text-[10px] font-bold shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B25E09]" />
          <span>Pending Review</span>
        </span>
      );
    }
    if (equipment.availabilityStatus === 'MAINTENANCE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEE2E2]/95 backdrop-blur-xs text-[#DC2626] border border-[#FECACA] text-[10px] font-bold shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
          <span>Maintenance</span>
        </span>
      );
    }
    if (equipment.availabilityStatus === 'RETIRED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F3F4F6]/95 backdrop-blur-xs text-[#6B7280] border border-[#E5E7EB] text-[10px] font-bold shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280]" />
          <span>Retired</span>
        </span>
      );
    }

    // Available now with upcoming future reservation
    if (equipment.upcomingReservation) {
      return (
        <span 
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#E8F5EB]/95 backdrop-blur-xs text-[#1B7A42] border border-[#A7F3D0] text-[10px] font-bold shadow-2xs max-w-[190px]"
          title={`Available now. ${equipment.upcomingReservation.formatted}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#1B7A42] flex-shrink-0" />
          <span className="flex-shrink-0">Available</span>
          <span className="text-[9px] font-semibold text-[#854D0E] bg-[#FEF9C3] px-1.5 py-0.5 rounded-full border border-[#FDE047] truncate">
            {equipment.upcomingReservation.formatted}
          </span>
        </span>
      );
    }

    if (equipment.availabilityStatus === 'AVAILABLE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F5EB]/95 backdrop-blur-xs text-[#1B7A42] border border-[#A7F3D0] text-[10px] font-bold shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1B7A42]" />
          <span>Available</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFF6FF]/95 backdrop-blur-xs text-[#1D4ED8] border border-[#BFDBFE] text-[10px] font-bold shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" />
        <span>In Use</span>
      </span>
    );
  };

  return (
    <div className="rounded-[28px] border border-[#E5E5E0] bg-white hover:border-[#D0D0C8] p-3.5 sm:p-4 flex flex-col justify-between group transition-all duration-200 shadow-2xs hover:shadow-xs h-full">
      
      {/* Media Inset Frame with Subtle Lift */}
      <Link href={hrefWithDates} className="block relative aspect-[4/3] w-full overflow-hidden rounded-[20px] bg-[#F8F8F6] border border-[#EDEDEA] cursor-pointer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayImage}
          alt={equipment.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Floating Top Bar: Category Pill & Status Pill */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none z-10">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 text-[#70706B] border border-[#E5E5E0] backdrop-blur-xs shadow-2xs truncate max-w-[55%] pointer-events-auto">
            {equipment.category}
          </span>

          <div className="flex-shrink-0 pointer-events-auto">
            {getStatusBadge()}
          </div>
        </div>

        {/* Floating Bottom Bar: Steward Pill */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none z-10">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#111110]/80 text-white backdrop-blur-xs flex items-center gap-1.5 max-w-[160px] pointer-events-auto">
            {equipment.ownerAvatar && !equipment.ownerAvatar.includes('photo-1534528741775-53994a69daeb') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={equipment.ownerAvatar}
                alt=""
                className="w-3.5 h-3.5 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <span className="w-3.5 h-3.5 rounded-full bg-white/30 text-[8px] flex items-center justify-center font-bold">
                {(equipment.ownerName || 'S')[0].toUpperCase()}
              </span>
            )}
            <span className="truncate">{equipment.ownerName?.split(' ')[0] || 'Steward'}</span>
          </span>
        </div>
      </Link>

      {/* Content Baseline */}
      <div className="pt-3.5 pb-0.5 px-1 flex flex-col justify-between flex-grow">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link href={hrefWithDates} className="block min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold text-[#111110] group-hover:text-black group-hover:underline truncate">
                {equipment.name}
              </h3>
            </Link>
            <span className="text-[11px] text-[#70706B] whitespace-nowrap font-semibold pt-0.5 flex-shrink-0">
              {equipment.maxBorrowDays || 3}d loan
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
              <span className="text-[9px] uppercase font-bold opacity-80 flex-shrink-0">
                {equipment.dateAvailability.isAvailable ? 'Ready' : 'Booked'}
              </span>
            </div>
          )}
        </div>

        {/* Footer Meta: Location, Condition, Arrow Button */}
        <div className="mt-3 pt-2.5 border-t border-[#EAEAE5] flex items-center justify-between text-xs text-[#70706B] gap-2">
          <span className="flex items-center gap-1 min-w-0 flex-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#111110] flex-shrink-0" />
            <span className="truncate text-[11px]">{equipment.location || 'Central Campus Lab'}</span>
          </span>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F5F5F3] text-[#70706B] border border-[#E5E5E0]">
              {equipment.currentCondition}
            </span>

            <Link
              href={hrefWithDates}
              className="w-7 h-7 rounded-full bg-white border border-[#E5E5E0] group-hover:bg-[#111110] group-hover:border-[#111110] group-hover:text-white flex items-center justify-center text-[#70706B] transition-all shadow-2xs"
              title={`View ${equipment.name}`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}

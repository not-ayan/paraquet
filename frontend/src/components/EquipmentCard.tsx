'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { Equipment } from '@/lib/types';

interface EquipmentCardProps {
  equipment: Equipment;
}

export default function EquipmentCard({ equipment }: EquipmentCardProps) {
  const isAvailable = equipment.availabilityStatus === 'AVAILABLE' && equipment.approvalStatus === 'APPROVED';

  const getStatusPill = () => {
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
      <Link href={`/equipment/${equipment.id}`} className="block relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#EDEDEA] cursor-pointer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={equipment.images[0] || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80'}
          alt={equipment.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Floating Category Pill */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-fluid-micro font-medium bg-white/90 text-[#111110] backdrop-blur-md shadow-sm">
            {equipment.category}
          </span>
        </div>

        {/* Floating Top Right Arrow / Status */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#111110] shadow-sm transition-transform group-hover:scale-110">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Floating Bottom Left Owner pill */}
        <div className="absolute bottom-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-fluid-micro font-medium bg-[#111110]/80 text-white backdrop-blur-md flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={equipment.ownerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&q=80'}
              alt=""
              className="w-3.5 h-3.5 rounded-full object-cover"
            />
            <span>{equipment.ownerName.split(' ')[0]}</span>
          </span>
        </div>

        {/* Floating Bottom Right Status Pill */}
        <div className="absolute bottom-3 right-3">
          {getStatusPill()}
        </div>
      </Link>

      {/* Content Baseline */}
      <div className="pt-3.5 px-1 flex flex-col justify-between flex-grow">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/equipment/${equipment.id}`} className="block">
            <h3 className="text-fluid-h3 font-bold text-[#111110] group-hover:underline line-clamp-1">
              {equipment.name}
            </h3>
          </Link>
          <span className="text-fluid-micro text-[#70706B] whitespace-nowrap font-medium pt-0.5">
            {equipment.maxBorrowDays || 3}d max
          </span>
        </div>

        <div className="mt-2 pt-2 border-t border-[#E2E2DE]/60 flex items-center justify-between text-fluid-micro text-[#70706B]">
          <span className="flex items-center gap-1 truncate max-w-[190px]">
            <MapPin className="w-3 h-3 text-[#111110] flex-shrink-0" />
            <span className="truncate">{equipment.location}</span>
          </span>
          <span className="font-semibold text-[#111110]">
            {equipment.currentCondition}
          </span>
        </div>
      </div>

    </div>
  );
}

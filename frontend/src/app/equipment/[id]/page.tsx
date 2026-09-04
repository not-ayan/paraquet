'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Equipment } from '@/lib/types';

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Booking Form State
  const [startDate, setStartDate] = useState('2026-09-10');
  const [startTime, setStartTime] = useState('10:00');
  const [endDate, setEndDate] = useState('2026-09-12');
  const [endTime, setEndTime] = useState('18:00');
  const [purpose, setPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      let isMounted = true;
      apiClient.getEquipmentById(id)
        .then((found) => {
          if (isMounted) {
            if (found) setEquipment(found);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.warn('Error loading equipment:', err);
          if (isMounted) setLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [id]);

  if (!equipment) {
    return (
      <div className="container-custom py-20 text-center space-y-4">
        <h2 className="text-fluid-h1 font-bold text-[#111110]">
          {loading ? 'Loading Equipment Details...' : 'Equipment Not Found'}
        </h2>
        <p className="text-fluid-body text-[#70706B]">
          {loading ? 'Fetching specs from the catalog...' : 'The item you are looking for may have been archived or removed.'}
        </p>
        {!loading && (
          <Link href="/equipment" className="btn-primary inline-flex">
            <ArrowLeft className="w-4 h-4" /> Return to Catalog
          </Link>
        )}
      </div>
    );
  }

  const isAvailable = equipment.availabilityStatus === 'AVAILABLE' && equipment.approvalStatus === 'APPROVED';

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      setBookingError('Please provide a brief statement of purpose.');
      return;
    }

    setIsSubmitting(true);
    setBookingError(null);

    const startDateTime = new Date(`${startDate}T${startTime}:00Z`).toISOString();
    const endDateTime = new Date(`${endDate}T${endTime}:00Z`).toISOString();

    const res = await apiClient.createBooking({
      equipmentId: equipment.id,
      startDateTime,
      endDateTime,
      purpose,
    });

    setIsSubmitting(false);

    if (res.success) {
      setBookingSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } else {
      setBookingError(res.error || 'Failed to submit booking request.');
    }
  };

  return (
    <div className="container-custom py-8 sm:py-12 space-y-6">
      
      {/* Back Link */}
      <Link
        href="/equipment"
        className="inline-flex items-center gap-1.5 text-fluid-body font-semibold text-[#70706B] hover:text-[#111110] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </Link>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Gallery & Details */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Photo Card */}
          <div className="card-paraquet p-3 sm:p-4 space-y-3">
            <div className="aspect-[16/10] relative rounded-2xl overflow-hidden bg-[#EDEDEA]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={equipment.images[activeImageIndex] || equipment.images[0]}
                alt={equipment.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <span className="px-3 py-1 rounded-full text-fluid-micro font-semibold bg-white/90 text-[#111110] backdrop-blur-md shadow-sm">
                  {equipment.category}
                </span>
              </div>
            </div>

            {/* Thumbnails */}
            {equipment.images.length > 1 && (
              <div className="flex gap-2.5 pt-1">
                {equipment.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImageIndex === idx ? 'border-[#111110] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description Card */}
          <div className="card-paraquet p-6 sm:p-8 space-y-5">
            <h2 className="text-fluid-h2 font-bold text-[#111110]">
              Equipment Overview
            </h2>
            <p className="text-fluid-body text-[#111110]/90 leading-relaxed whitespace-pre-line">
              {equipment.description}
            </p>

            {/* Technical Specifications */}
            {equipment.specs && Object.keys(equipment.specs).length > 0 && (
              <div className="pt-4 border-t border-[#E2E2DE] space-y-3">
                <h4 className="text-fluid-micro uppercase font-bold tracking-wider text-[#70706B]">
                  Technical Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(equipment.specs).map(([k, v]) => (
                    <div key={k} className="p-3 bg-[#EDEDEA] rounded-xl text-fluid-body">
                      <span className="text-fluid-micro text-[#70706B] block">{k}</span>
                      <span className="font-semibold text-[#111110] mt-0.5 block">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="p-4 bg-[#EDEDEA] rounded-2xl flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#111110] flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-fluid-micro uppercase font-bold text-[#70706B] block">
                  Campus Handover Point
                </span>
                <span className="text-fluid-body font-semibold text-[#111110] block mt-0.5">
                  {equipment.location}
                </span>
                <span className="text-fluid-micro text-[#70706B] block mt-1">
                  Access during campus building hours with verified student ID.
                </span>
              </div>
            </div>

          </div>

          {/* Steward Card */}
          <div className="card-paraquet p-5 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={equipment.ownerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={equipment.ownerName}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <span className="text-fluid-micro text-[#70706B] block">Equipment Steward</span>
                <h4 className="text-fluid-body font-bold text-[#111110]">
                  {equipment.ownerName}
                </h4>
                <span className="text-fluid-micro text-[#1B7A42] font-semibold flex items-center gap-1 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5" /> Verified Community Lender
                </span>
              </div>
            </div>

            <div className="text-right text-fluid-micro text-[#70706B]">
              <span className="block font-medium">Condition</span>
              <span className="badge-pill badge-available mt-1">
                {equipment.currentCondition}
              </span>
            </div>
          </div>

        </div>

        {/* Right Column: Reservation Request Card */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="card-paraquet p-6 sm:p-8 sticky top-24 space-y-6">
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-fluid-micro uppercase font-bold tracking-wider text-[#70706B]">
                  Loan Request
                </span>
                {equipment.approvalStatus === 'APPROVED' && equipment.availabilityStatus === 'AVAILABLE' ? (
                  <span className="badge-pill badge-available">Available to Borrow</span>
                ) : (
                  <span className="badge-pill badge-booked">Currently In Use</span>
                )}
              </div>

              <h1 className="text-fluid-h2 font-bold text-[#111110] leading-tight">
                {equipment.name}
              </h1>
              <p className="text-fluid-micro text-[#70706B] mt-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#111110]" />
                Max recommended loan: {equipment.maxBorrowDays || 3} days
              </p>
            </div>

            {bookingSuccess ? (
              <div className="p-6 bg-[#E8F5EB] rounded-2xl text-center space-y-2.5 animate-in zoom-in-95">
                <CheckCircle2 className="w-10 h-10 text-[#1B7A42] mx-auto" />
                <h3 className="text-fluid-h3 font-bold text-[#1B7A42]">
                  Booking Request Submitted!
                </h3>
                <p className="text-fluid-micro text-[#1B7A42]/90">
                  Status is now <strong>PENDING</strong> administrator sign-off. Redirecting to your dashboard...
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4 pt-1">
                
                {/* Dates */}
                <div className="space-y-1">
                  <label className="block text-fluid-micro uppercase font-bold tracking-wider text-[#70706B]">
                    Pickup Date & Time
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="input-paraquet text-fluid-body"
                      required
                    />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="input-paraquet text-fluid-body"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-fluid-micro uppercase font-bold tracking-wider text-[#70706B]">
                    Return Date & Time
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="input-paraquet text-fluid-body"
                      required
                    />
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="input-paraquet text-fluid-body"
                      required
                    />
                  </div>
                </div>

                {/* Purpose */}
                <div className="space-y-1">
                  <label className="block text-fluid-micro uppercase font-bold tracking-wider text-[#70706B]">
                    Academic / Project Purpose
                  </label>
                  <textarea
                    rows={3}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Briefly describe what you're building or filming..."
                    className="input-paraquet text-fluid-body resize-none"
                    required
                  />
                </div>

                {bookingError && (
                  <div className="p-3 bg-[#FEE2E2] rounded-xl text-fluid-micro text-[#DC2626] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !isAvailable}
                  className={`w-full py-3 ${
                    isAvailable ? 'btn-primary' : 'bg-[#E2E2DE] text-[#9C9C96] cursor-not-allowed rounded-full font-semibold text-fluid-body'
                  }`}
                >
                  {isSubmitting ? 'Submitting Request...' : isAvailable ? 'Submit Reservation Request →' : 'Unavailable for Booking'}
                </button>

                <p className="text-center text-fluid-micro text-[#70706B] pt-1">
                  Pickup photo condition report required upon handover.
                </p>

              </form>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

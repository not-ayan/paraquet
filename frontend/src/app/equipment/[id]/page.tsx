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
  AlertTriangle,
  UserCheck,
  Camera,
  ZoomIn,
  X
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { apiClient } from '@/lib/api';
import { Equipment, Booking, ActivityLog } from '@/lib/types';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user: clerkUser } = useUser();

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [equipmentBookings, setEquipmentBookings] = useState<Booking[]>([]);
  const [equipmentActivity, setEquipmentActivity] = useState<ActivityLog[]>([]);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<{ url: string; title: string } | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Booking Form State
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [startTime, setStartTime] = useState('10:00');
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
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

      // Fetch all requests and schedules for this equipment
      apiClient.getEquipmentBookings(id)
        .then((bks) => {
          if (isMounted) setEquipmentBookings(bks);
        })
        .catch((err) => {
          console.warn('Error loading equipment bookings:', err);
        });

      // Fetch condition history & activity for this equipment
      apiClient.getEquipmentActivity(id)
        .then((acts) => {
          if (isMounted) setEquipmentActivity(acts);
        })
        .catch((err) => {
          console.warn('Error loading equipment activity:', err);
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

  const now = new Date();

  // Active, approved, or overdue bookings
  const activeOrApprovedBooking = equipmentBookings.find(b => 
    b.status === 'ACTIVE' || b.status === 'APPROVED' || b.status === 'OVERDUE'
  );

  const isOverdue = Boolean(
    activeOrApprovedBooking && (
      activeOrApprovedBooking.status === 'OVERDUE' ||
      (activeOrApprovedBooking.status === 'ACTIVE' && new Date(activeOrApprovedBooking.endDateTime) < now)
    )
  );

  const isCurrentlyWithUser = Boolean(activeOrApprovedBooking);

  // Check collision with user selected dates
  const selectedStart = new Date(`${startDate}T${startTime}:00Z`);
  const selectedEnd = new Date(`${endDate}T${endTime}:00Z`);
  const hasValidDateRange = !isNaN(selectedStart.getTime()) && !isNaN(selectedEnd.getTime()) && selectedStart < selectedEnd;

  // Pending request collision (write nothing on main card, but show warning when picking same dates)
  const pendingCollision = hasValidDateRange ? equipmentBookings.find(b => 
    b.status === 'PENDING' &&
    new Date(b.startDateTime) < selectedEnd &&
    new Date(b.endDateTime) > selectedStart
  ) : null;

  // Approved or Active booking collision (blocks booking)
  const approvedCollision = hasValidDateRange ? equipmentBookings.find(b => 
    (b.status === 'ACTIVE' || b.status === 'APPROVED' || b.status === 'OVERDUE') &&
    new Date(b.startDateTime) < selectedEnd &&
    new Date(b.endDateTime) > selectedStart
  ) : null;

  const isAvailable = equipment.availabilityStatus === 'AVAILABLE' && 
                      equipment.approvalStatus === 'APPROVED' && 
                      !isOverdue && 
                      !approvedCollision;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      setBookingError('Please provide a brief statement of purpose.');
      return;
    }

    if (approvedCollision) {
      setBookingError(`This equipment is already reserved by ${approvedCollision.borrowerName} for these dates.`);
      return;
    }

    setIsSubmitting(true);
    setBookingError(null);

    const startDateTime = selectedStart.toISOString();
    const endDateTime = selectedEnd.toISOString();

    const borrowerName = clerkUser?.fullName || clerkUser?.firstName || clerkUser?.username || 'Verified Student';
    const borrowerEmail = clerkUser?.primaryEmailAddress?.emailAddress || '';

    const res = await apiClient.createBooking({
      equipmentId: equipment.id,
      startDateTime,
      endDateTime,
      purpose,
      equipmentName: equipment.name,
      equipmentImage: equipment.images?.[0],
      borrowerName,
      borrowerEmail,
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

          {/* Availability Calendar & Schedule */}
          <AvailabilityCalendar
            bookings={equipmentBookings}
            selectedStartDate={startDate}
            selectedEndDate={endDate}
            onSelectDateRange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
            maxBorrowDays={equipment.maxBorrowDays || 3}
          />

          {/* Condition History & Handover Evidence */}
          {equipmentActivity.filter(a => Boolean(a.conditionReport)).length > 0 && (
            <div className="card-paraquet p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Camera className="w-5 h-5 text-[#111110]" />
                    <h3 className="text-fluid-h3 font-bold text-[#111110]">
                      Condition History & Inspection Evidence
                    </h3>
                  </div>
                  <p className="text-fluid-micro text-[#70706B]">
                    Visual condition records uploaded during student pickups and returns.
                  </p>
                </div>
                <span className="badge-pill badge-available">
                  {equipmentActivity.filter(a => Boolean(a.conditionReport)).length} Reports
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {equipmentActivity
                  .filter(a => Boolean(a.conditionReport))
                  .map((act) => {
                    const cr = act.conditionReport!;
                    const dateFormatted = new Date(act.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <div key={act.id} className="p-4 bg-[#F9F9F8] border border-[#EDEDEA] rounded-2xl space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2 text-fluid-micro">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#111110]">
                              {cr.type === 'PICKUP' ? '📸 Pickup Check' : '🔄 Return Check'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cr.condition === 'EXCELLENT' ? 'bg-[#E8F5EB] text-[#1B7A42]' :
                              cr.condition === 'GOOD' ? 'bg-[#EFF6FF] text-[#1E40AF]' :
                              cr.condition === 'FAIR' ? 'bg-[#FEF9C3] text-[#854D0E]' :
                              'bg-[#FEE2E2] text-[#991B1B]'
                            }`}>
                              {cr.condition}
                            </span>
                          </div>
                          <span className="text-[#70706B]">{dateFormatted}</span>
                        </div>

                        {cr.notes && (
                          <p className="text-fluid-micro text-[#70706B] italic">
                            "{cr.notes}"
                          </p>
                        )}

                        {cr.photos && cr.photos.length > 0 && (
                          <div className="flex items-center gap-2 pt-1">
                            {cr.photos.map((photo, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedPhotoPreview({ url: photo, title: `${equipment.name} (${cr.type})` })}
                                className="relative group w-14 h-14 rounded-xl overflow-hidden border border-[#E2E2DE] hover:border-[#111110] transition-all flex-shrink-0"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={photo} alt="condition" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                  <ZoomIn className="w-4 h-4" />
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Steward Card */}
          <div className="card-paraquet p-5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={equipment.ownerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={equipment.ownerName}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <span className="text-fluid-micro text-[#70706B] block">Equipment Steward</span>
                <h4 className="text-fluid-body font-bold text-[#111110] truncate">
                  {equipment.ownerName}
                </h4>
                <span className="text-fluid-micro text-[#1B7A42] font-semibold flex items-center gap-1 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5 flex-shrink-0" /> Verified Community Lender
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right text-fluid-micro text-[#70706B] flex-shrink-0">
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
                {isOverdue ? (
                  <span className="badge-pill badge-rejected font-bold">● Overdue Loan</span>
                ) : isCurrentlyWithUser ? (
                  <span className="badge-pill badge-booked font-semibold">● In Use (with {activeOrApprovedBooking?.borrowerName})</span>
                ) : equipment.approvalStatus === 'APPROVED' && equipment.availabilityStatus === 'AVAILABLE' ? (
                  <span className="badge-pill badge-available">Available to Borrow</span>
                ) : (
                  <span className="badge-pill badge-unavailable">Currently In Use</span>
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

            {/* Active / Approved / Overdue Custody Details */}
            {isOverdue && activeOrApprovedBooking ? (
              <div className="p-3.5 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl text-fluid-micro text-[#991B1B] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-sm text-[#DC2626]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>OVERDUE LOAN</span>
                </div>
                <p className="leading-relaxed">
                  Currently in possession of <strong>{activeOrApprovedBooking.borrowerName}</strong>. This equipment was scheduled for return on {new Date(activeOrApprovedBooking.endDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(activeOrApprovedBooking.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                </p>
              </div>
            ) : isCurrentlyWithUser && activeOrApprovedBooking ? (
              <div className="p-3.5 bg-[#EBF5FF] border border-[#BFDBFE] rounded-xl text-fluid-micro text-[#1E40AF] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-sm text-[#2563EB]">
                  <UserCheck className="w-4 h-4 flex-shrink-0" />
                  <span>{activeOrApprovedBooking.status === 'ACTIVE' ? 'Currently Checked Out' : 'Approved Reservation'}</span>
                </div>
                <p className="leading-relaxed">
                  Currently with <strong>{activeOrApprovedBooking.borrowerName}</strong> until {new Date(activeOrApprovedBooking.endDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ({new Date(activeOrApprovedBooking.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).
                </p>
              </div>
            ) : null}

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
                <div className="space-y-1.5">
                  <label className="block text-fluid-micro uppercase font-bold tracking-wider text-[#70706B]">
                    Pickup Date & Time
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="input-paraquet input-date-time text-xs sm:text-sm"
                      required
                    />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="input-paraquet input-date-time text-xs sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-fluid-micro uppercase font-bold tracking-wider text-[#70706B]">
                    Return Date & Time
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="input-paraquet input-date-time text-xs sm:text-sm"
                      required
                    />
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="input-paraquet input-date-time text-xs sm:text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Pending Request Date Collision Warning */}
                {pendingCollision && !approvedCollision && (
                  <div className="p-3 bg-[#FEF9C3] border border-[#FDE047] rounded-xl text-fluid-micro text-[#854D0E] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#CA8A04]" />
                    <div className="space-y-0.5">
                      <span className="font-bold block">Pending Request Conflict Warning</span>
                      <p className="leading-relaxed">
                        Another student has submitted a pending reservation for overlapping dates ({new Date(pendingCollision.startDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(pendingCollision.endDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}). If approved, your request may collide.
                      </p>
                    </div>
                  </div>
                )}

                {/* Approved / Active Booking Collision Alert */}
                {approvedCollision && (
                  <div className="p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl text-fluid-micro text-[#991B1B] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#DC2626]" />
                    <div className="space-y-0.5">
                      <span className="font-bold block">Date Range Unavailable</span>
                      <p className="leading-relaxed">
                        This gear is already {approvedCollision.status === 'ACTIVE' ? 'checked out by' : 'approved for'} <strong>{approvedCollision.borrowerName}</strong> from {new Date(approvedCollision.startDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to {new Date(approvedCollision.endDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Please select different dates.
                      </p>
                    </div>
                  </div>
                )}

                {/* Purpose */}
                <div className="space-y-1.5">
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
                    isAvailable
                      ? 'btn-primary'
                      : 'inline-flex items-center justify-center bg-[#E2E2DE] text-[#9C9C96] cursor-not-allowed rounded-full font-semibold text-fluid-body'
                  }`}
                >
                  {isSubmitting 
                    ? 'Submitting Request...' 
                    : isOverdue 
                      ? 'Currently Overdue' 
                      : approvedCollision 
                        ? 'Selected Dates Unavailable' 
                        : isAvailable 
                          ? 'Submit Reservation Request →' 
                          : 'Unavailable for Booking'}
                </button>

                <p className="text-center text-fluid-micro text-[#70706B] pt-1">
                  Pickup photo condition report required upon handover.
                </p>

              </form>
            )}

          </div>

        </div>

      </div>

      {/* Condition Photo Lightbox Modal */}
      {selectedPhotoPreview && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setSelectedPhotoPreview(null)}
        >
          <div 
            className="relative max-w-2xl w-full bg-[#111110] rounded-3xl overflow-hidden border border-white/20 shadow-2xl p-4 sm:p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-white px-1">
              <div className="flex items-center gap-2 min-w-0">
                <Camera className="w-4 h-4 text-white/80 flex-shrink-0" />
                <span className="font-bold text-fluid-body truncate">{selectedPhotoPreview.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhotoPreview(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={selectedPhotoPreview.url} 
                alt={selectedPhotoPreview.title}
                className="w-full h-full object-contain"
              />
            </div>

            <p className="text-center text-fluid-micro text-white/70">
              Verified condition handover proof • Click background or close button to exit
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

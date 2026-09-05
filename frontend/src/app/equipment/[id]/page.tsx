'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  X,
  History,
  ArrowRight,
  Wrench,
  Calendar,
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

  // Status Change State (WEB-C08: Change History)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatusSelection, setNewStatusSelection] = useState<'available' | 'maintenance' | 'retired'>('maintenance');
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [statusModalError, setStatusModalError] = useState<string | null>(null);

  const handleStatusChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusChangeReason.trim()) {
      setStatusModalError('Please provide a justification reason for this status change.');
      return;
    }

    setIsSubmittingStatus(true);
    setStatusModalError(null);

    try {
      const updated = await apiClient.updateEquipmentStatus(
        equipment!.id,
        newStatusSelection,
        statusChangeReason.trim()
      );
      setEquipment(updated);
      setIsStatusModalOpen(false);
      setStatusChangeReason('');
    } catch (err: any) {
      setStatusModalError(err.message || 'Failed to update equipment status');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

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
    d.setDate(d.getDate() + 2);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [endTime, setEndTime] = useState('18:00');
  const [purpose, setPurpose] = useState('');
  const [guestName, setGuestName] = useState('Student Borrower');
  const [guestEmail, setGuestEmail] = useState('student@tezu.ac.in');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to add days to YYYY-MM-DD string
  const addDaysToDateStr = (baseStr: string, days: number): string => {
    const [y, m, d] = baseStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    const endY = dt.getFullYear();
    const endM = String(dt.getMonth() + 1).padStart(2, '0');
    const endD = String(dt.getDate()).padStart(2, '0');
    return `${endY}-${endM}-${endD}`;
  };

  const maxBorrowDays = equipment?.maxBorrowDays || 3;

  const currentDurationDays = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const [y1, m1, d1] = startDate.split('-').map(Number);
    const [y2, m2, d2] = endDate.split('-').map(Number);
    const diff = Math.round((new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 0;
    return diff + 1;
  }, [startDate, endDate]);

  const isDurationExceeded = currentDurationDays > maxBorrowDays;

  const handleSelectDuration = (days: number) => {
    setEndDate(addDaysToDateStr(startDate, Math.max(0, days - 1)));
  };

  const conditionReports = useMemo(() => {
    const valid = equipmentActivity.filter(a => Boolean(a.conditionReport) && a.type !== 'condition_flagged');
    const seen = new Set<string>();
    const deduped: typeof valid = [];
    for (const act of valid) {
      const bId = act.bookingId || (act as any).booking?._id || (act as any).booking || act.id;
      const key = `${bId}-${act.conditionReport?.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(act);
      }
    }
    return deduped;
  }, [equipmentActivity]);

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

      // Pre-fill booking dates if passed from catalogue search (?startDate=...&endDate=...)
      if (typeof window !== 'undefined') {
        const sp = new URLSearchParams(window.location.search);
        const qStart = sp.get('startDate');
        const qEnd = sp.get('endDate');
        if (qStart) setStartDate(qStart);
        if (qEnd) setEndDate(qEnd);
      }

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

  // Booking physically in custody today (checked out or approved for today)
  const currentlyInCustodyBooking = equipmentBookings.find(b => {
    if (b.status === 'OVERDUE') return true;
    if (b.status === 'ACTIVE') return true;
    if (b.status === 'APPROVED') {
      const s = new Date(b.startDateTime);
      const e = new Date(b.endDateTime);
      return s <= now && e >= now;
    }
    return false;
  });

  // Future scheduled bookings (e.g. booked for Sep 12 when today is Sep 5)
  const upcomingBookings = equipmentBookings
    .filter(b => (b.status === 'APPROVED' || b.status === 'PENDING') && new Date(b.startDateTime) > now)
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  const nextUpcomingBooking = upcomingBookings[0] || null;

  const isOverdue = Boolean(
    currentlyInCustodyBooking && (
      currentlyInCustodyBooking.status === 'OVERDUE' ||
      (currentlyInCustodyBooking.status === 'ACTIVE' && new Date(currentlyInCustodyBooking.endDateTime) < now)
    )
  );

  const isCurrentlyWithUser = Boolean(currentlyInCustodyBooking);

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

  const isAvailable = equipment.approvalStatus === 'APPROVED' && 
                      equipment.availabilityStatus !== 'MAINTENANCE' && 
                      equipment.availabilityStatus !== 'RETIRED' && 
                      !isOverdue && 
                      !approvedCollision;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      setBookingError('Please provide a brief statement of purpose.');
      return;
    }

    if (isDurationExceeded) {
      setBookingError(`Selected loan duration (${currentDurationDays} days) exceeds maximum of ${maxBorrowDays} days.`);
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

    const borrowerName = clerkUser?.fullName || clerkUser?.firstName || clerkUser?.username || guestName || 'Verified Student';
    const borrowerEmail = clerkUser?.primaryEmailAddress?.emailAddress || guestEmail || 'student@tezu.ac.in';

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
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      
      {/* Back Link */}
      <Link
        href="/equipment"
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#70706B] hover:text-[#111110] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Equipment Catalog
      </Link>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Gallery & Details */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Photo Card */}
          <div className="rounded-[28px] border border-[#E5E5E0] bg-white p-4 sm:p-5 space-y-3 shadow-2xs">
            <div className="aspect-[16/10] relative rounded-[20px] overflow-hidden bg-[#F8F8F6] border border-[#EDEDEA]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={equipment.images[activeImageIndex] || equipment.images[0]}
                alt={equipment.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/95 text-[#70706B] border border-[#E5E5E0] backdrop-blur-xs shadow-2xs">
                  {equipment.category}
                </span>
              </div>
            </div>

            {/* Thumbnails */}
            {equipment.images.length > 1 && (
              <div className="flex gap-2.5 pt-1 overflow-x-auto scrollbar-none">
                {equipment.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      activeImageIndex === idx ? 'border-[#111110] scale-105 shadow-xs' : 'border-transparent opacity-60 hover:opacity-100'
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
          <div className="rounded-[28px] border border-[#E5E5E0] bg-white p-6 sm:p-8 space-y-5 shadow-2xs">
            <h2 className="text-lg sm:text-xl font-bold text-[#111110]">
              Equipment Overview
            </h2>
            <p className="text-xs sm:text-sm text-[#70706B] leading-relaxed whitespace-pre-line">
              {equipment.description}
            </p>

            {/* Technical Specifications */}
            {equipment.specs && Object.keys(equipment.specs).length > 0 && (
              <div className="pt-4 border-t border-[#E5E5E0] space-y-3">
                <h4 className="text-[11px] uppercase font-bold tracking-wider text-[#70706B]">
                  Technical Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(equipment.specs).map(([k, v]) => (
                    <div key={k} className="p-3 bg-[#F8F8F6] border border-[#E5E5E0] rounded-2xl text-xs">
                      <span className="text-[10px] text-[#70706B] uppercase font-bold tracking-wider block">{k}</span>
                      <span className="font-semibold text-[#111110] mt-0.5 block">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="p-4 bg-[#F8F8F6] border border-[#E5E5E0] rounded-2xl flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#111110] flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#70706B] block">
                  Tezpur University Handover Point
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#111110] block mt-0.5">
                  {equipment.location || 'Tezpur University, Assam'}
                </span>
                <span className="text-xs text-[#70706B] block mt-1">
                  Access during Tezpur University department hours with verified student credentials.
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
          {conditionReports.length > 0 && (
            <div className="rounded-[28px] border border-[#E5E5E0] bg-white p-6 sm:p-8 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Camera className="w-5 h-5 text-[#111110]" />
                    <h3 className="text-base font-bold text-[#111110]">
                      Condition History & Inspection Evidence
                    </h3>
                  </div>
                  <p className="text-xs text-[#70706B]">
                    Visual condition records uploaded during student pickups and returns.
                  </p>
                </div>
                <span className="badge-pill badge-available">
                  {conditionReports.length} {conditionReports.length === 1 ? 'Report' : 'Reports'}
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {conditionReports.map((act) => {
                    const cr = act.conditionReport!;
                    const dateFormatted = new Date(act.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <div key={act.id} className="p-4 bg-[#F8F8F6] border border-[#E5E5E0] rounded-2xl space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
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
                          <p className="text-xs text-[#70706B] italic">
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
                                className="relative group w-14 h-14 rounded-xl overflow-hidden border border-[#E5E5E0] hover:border-[#111110] transition-all flex-shrink-0"
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

          {/* WEB-C08: Status Change History Card */}
          <div className="rounded-[28px] border border-[#E5E5E0] bg-white p-6 sm:p-8 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#111110]" />
                <h3 className="text-base font-bold text-[#111110]">
                  Status Change History
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#F5F5F3] text-[#70706B] rounded-full border border-[#E5E5E0]">
                  WEB-C08
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStatusModalError(null);
                  setIsStatusModalOpen(true);
                }}
                className="btn-secondary text-xs py-1.5 px-3 rounded-full"
              >
                + Update Status
              </button>
            </div>

            {equipment.statusHistory && equipment.statusHistory.length > 0 ? (
              <div className="space-y-3 pt-1">
                {equipment.statusHistory.map((rec, idx) => {
                  const dateObj = new Date(rec.changedAt);
                  const formattedDate = !isNaN(dateObj.getTime())
                    ? dateObj.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : rec.changedAt;

                  const getStatusBadge = (val: string) => {
                    const v = (val || '').toLowerCase();
                    if (v === 'available') {
                      return <span className="badge-pill badge-available uppercase text-[10px]">{val}</span>;
                    }
                    if (v === 'maintenance') {
                      return <span className="badge-pill bg-[#FEF9C3] text-[#854D0E] uppercase text-[10px] border border-[#FDE047]">{val}</span>;
                    }
                    if (v === 'retired') {
                      return <span className="badge-pill bg-[#FEE2E2] text-[#991B1B] uppercase text-[10px] border border-[#FCA5A5]">{val}</span>;
                    }
                    return <span className="badge-pill badge-neutral uppercase text-[10px]">{val}</span>;
                  };

                  return (
                    <div
                      key={idx}
                      className="p-4 bg-[#F8F8F6] border border-[#E5E5E0] rounded-2xl space-y-2.5 transition-all hover:border-[#D0D0CC]"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#70706B] font-medium">Transition:</span>
                          {getStatusBadge(rec.previousValue)}
                          <ArrowRight className="w-3.5 h-3.5 text-[#70706B]" />
                          {getStatusBadge(rec.newValue)}
                        </div>

                        <div className="flex items-center gap-1.5 text-[#70706B] text-[11px]">
                          <Clock className="w-3 h-3" />
                          <span>{formattedDate}</span>
                        </div>
                      </div>

                      <div className="bg-white border border-[#E5E5E0] p-3 rounded-xl shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#70706B] block mb-1">
                          Justification Reason
                        </span>
                        <p className="text-xs text-[#111110] italic">
                          "{rec.reason}"
                        </p>
                      </div>

                      <div className="text-[10px] text-[#70706B] flex items-center justify-between pt-0.5">
                        <span>Logged by: <strong className="text-[#111110] font-semibold">{rec.changedByName || 'Community Steward'}</strong></span>
                        <span className="text-[9px] text-[#9E9E9A] font-mono">Record #{equipment.statusHistory!.length - idx}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-[#F8F8F6] border border-[#E5E5E0] rounded-2xl text-center space-y-1">
                <p className="text-xs text-[#70706B]">
                  No previous status transitions recorded for this equipment.
                </p>
                <span className="text-[11px] font-bold text-[#1B7A42]">
                  Current Status: {(equipment.availabilityStatus || 'AVAILABLE').toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Steward Card */}
          <div className="rounded-[28px] border border-[#E5E5E0] bg-white p-5 sm:p-6 shadow-2xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={equipment.ownerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={equipment.ownerName}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <span className="text-xs text-[#70706B] block">Equipment Steward</span>
                <h4 className="text-sm font-bold text-[#111110] truncate">
                  {equipment.ownerName}
                </h4>
                <span className="text-xs text-[#1B7A42] font-semibold flex items-center gap-1 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5 flex-shrink-0" /> Verified Community Lender
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-[#70706B] flex-shrink-0">
              <span className="block font-medium">Condition</span>
              <span className="badge-pill badge-available mt-1">
                {equipment.currentCondition}
              </span>
            </div>
          </div>

        </div>

        {/* Right Column: Reservation Request Card */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="rounded-[28px] border border-[#E5E5E0] bg-white p-6 sm:p-8 sticky top-24 space-y-6 shadow-xs">
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#70706B]">
                  Tezpur University Loan Request
                </span>
                {isOverdue ? (
                  <span className="badge-pill badge-rejected font-bold">● Overdue Loan</span>
                ) : isCurrentlyWithUser ? (
                  <span className="badge-pill badge-booked font-semibold">● In Use (with {currentlyInCustodyBooking?.borrowerName})</span>
                ) : nextUpcomingBooking ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="badge-pill badge-available font-semibold">Available Now</span>
                    <span className="badge-pill bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047] text-[10px]">
                      Booked {new Date(nextUpcomingBooking.startDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ) : equipment.approvalStatus === 'APPROVED' && equipment.availabilityStatus === 'AVAILABLE' ? (
                  <span className="badge-pill badge-available">Available to Borrow</span>
                ) : (
                  <span className="badge-pill badge-unavailable">Maintenance</span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-[#111110] tracking-tight">
                {equipment.name}
              </h1>
              <div className="flex items-center justify-between text-xs text-[#70706B] mt-2 pt-2 border-t border-[#F0F0EE]">
                <span className="font-semibold text-[#111110]">₹0 Free Student Loan</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#111110]" />
                  Max: {equipment.maxBorrowDays || 3} days
                </span>
              </div>
            </div>

            {/* Active / Approved / Overdue Custody Details */}
            {isOverdue && currentlyInCustodyBooking ? (
              <div className="p-3.5 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl text-fluid-micro text-[#991B1B] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-sm text-[#DC2626]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>OVERDUE LOAN</span>
                </div>
                <p className="leading-relaxed">
                  Currently in possession of <strong>{currentlyInCustodyBooking.borrowerName}</strong>. This equipment was scheduled for return on {new Date(currentlyInCustodyBooking.endDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(currentlyInCustodyBooking.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                </p>
              </div>
            ) : isCurrentlyWithUser && currentlyInCustodyBooking ? (
              <div className="p-3.5 bg-[#EBF5FF] border border-[#BFDBFE] rounded-xl text-fluid-micro text-[#1E40AF] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-sm text-[#2563EB]">
                  <UserCheck className="w-4 h-4 flex-shrink-0" />
                  <span>{currentlyInCustodyBooking.status === 'ACTIVE' ? 'Currently Checked Out' : 'Active Reservation'}</span>
                </div>
                <p className="leading-relaxed">
                  Currently with <strong>{currentlyInCustodyBooking.borrowerName}</strong> until {new Date(currentlyInCustodyBooking.endDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ({new Date(currentlyInCustodyBooking.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).
                </p>
              </div>
            ) : nextUpcomingBooking ? (
              <div className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl text-fluid-micro text-[#1E40AF] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#2563EB]">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Upcoming Reservation Scheduled</span>
                </div>
                <p className="leading-relaxed text-[11px] text-[#1E40AF]/90">
                  Reserved by <strong>{nextUpcomingBooking.borrowerName}</strong> for{' '}
                  <strong>{new Date(nextUpcomingBooking.startDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(nextUpcomingBooking.endDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong>.
                  Equipment is available now for dates before {new Date(nextUpcomingBooking.startDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}!
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
                
                {/* Number of Days Picker */}
                <div className="space-y-2 p-3.5 bg-[#F8F8F6] border border-[#E5E5E0] rounded-2xl shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#70706B] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#111110]" />
                      Loan Duration
                    </label>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      isDurationExceeded 
                        ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]'
                        : 'bg-[#EDEDEA] text-[#111110] border-[#E5E5E0]'
                    }`}>
                      {currentDurationDays} {currentDurationDays === 1 ? 'day' : 'days'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {Array.from({ length: Math.min(8, maxBorrowDays) }, (_, i) => i + 1).map((days) => {
                      const isSelected = currentDurationDays === days;
                      return (
                        <button
                          key={days}
                          type="button"
                          onClick={() => handleSelectDuration(days)}
                          className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center active:scale-95 border ${
                            isSelected
                              ? 'bg-[#111110] text-white border-[#111110] shadow-xs'
                              : 'bg-white text-[#40403C] hover:bg-[#EDEDEA] border-[#E5E5E0]'
                          }`}
                        >
                          {days} {days === 1 ? 'Day' : 'Days'}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#70706B] pt-0.5">
                    <span>Quick presets automatically adjust return date</span>
                    <span className="font-semibold text-[#111110]">Max: {maxBorrowDays} {maxBorrowDays === 1 ? 'day' : 'days'}</span>
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#70706B]">
                    Pickup Date & Time
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="input-paraquet input-date-time text-xs sm:text-sm rounded-2xl h-[44px] font-semibold"
                      required
                    />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="input-paraquet input-date-time text-xs sm:text-sm rounded-2xl h-[44px] font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#70706B]">
                    Return Date & Time
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="input-paraquet input-date-time text-xs sm:text-sm rounded-2xl h-[44px] font-semibold"
                      required
                    />
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="input-paraquet input-date-time text-xs sm:text-sm rounded-2xl h-[44px] font-semibold"
                      required
                    />
                  </div>
                </div>

                {/* Pending Request Date Collision Warning */}
                {pendingCollision && !approvedCollision && (
                  <div className="p-3.5 bg-[#FEF9C3] border border-[#FDE047] rounded-2xl text-xs text-[#854D0E] flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#CA8A04]" />
                    <div className="space-y-0.5">
                      <span className="font-bold block">Pending Request Conflict Warning</span>
                      <p className="leading-relaxed text-[11px]">
                        Another student has submitted a pending reservation for overlapping dates ({new Date(pendingCollision.startDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(pendingCollision.endDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}). If approved, your request may collide.
                      </p>
                    </div>
                  </div>
                )}

                {/* Approved / Active Booking Collision Alert */}
                {approvedCollision && (
                  <div className="p-3.5 bg-[#FEE2E2] border border-[#FCA5A5] rounded-2xl text-xs text-[#991B1B] flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#DC2626]" />
                    <div className="space-y-0.5">
                      <span className="font-bold block">Date Range Unavailable</span>
                      <p className="leading-relaxed text-[11px]">
                        This gear is already {approvedCollision.status === 'ACTIVE' ? 'checked out by' : 'approved for'} <strong>{approvedCollision.borrowerName}</strong> from {new Date(approvedCollision.startDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to {new Date(approvedCollision.endDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Please select different dates.
                      </p>
                    </div>
                  </div>
                )}

                {/* Guest Student Info (when not signed in with Clerk) */}
                {!clerkUser && (
                  <div className="space-y-2 p-3.5 bg-[#F8F8F6] border border-[#E5E5E0] rounded-2xl shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#70706B] flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-[#111110]" />
                        Borrower Identity (Tezpur Univ)
                      </label>
                      <span className="text-[10px] text-[#1B7A42] font-semibold bg-[#E8F5EB] px-2 py-0.5 rounded-full">
                        Student Account
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-[#70706B] font-medium block mb-1">Full Name</label>
                        <input
                          type="text"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="input-paraquet text-xs h-[38px] rounded-xl font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#70706B] font-medium block mb-1">Tezpur Univ Email</label>
                        <input
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="e.g. student@tezu.ac.in"
                          className="input-paraquet text-xs h-[38px] rounded-xl font-medium"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Purpose */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#70706B]">
                    Academic / Project Purpose
                  </label>
                  <textarea
                    rows={3}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Briefly describe your student project, film shoot, or lab experiment..."
                    className="input-paraquet rounded-2xl text-xs sm:text-sm resize-none"
                    required
                  />
                </div>

                {bookingError && (
                  <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-2xl text-xs text-[#DC2626] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {isDurationExceeded && (
                  <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-2xl text-xs text-[#DC2626] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Selected loan duration ({currentDurationDays} days) exceeds maximum of {maxBorrowDays} days.</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !isAvailable || isDurationExceeded}
                  className={`w-full py-3.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-98 ${
                    isAvailable && !isDurationExceeded
                      ? 'btn-primary'
                      : 'inline-flex items-center justify-center bg-[#EDEDEA] text-[#9C9C96] border border-[#E5E5E0] cursor-not-allowed'
                  }`}
                >
                  {isSubmitting 
                    ? 'Submitting Request...' 
                    : isDurationExceeded
                      ? `Exceeds Max ${maxBorrowDays} Days`
                      : isOverdue 
                        ? 'Currently Overdue' 
                        : approvedCollision 
                          ? 'Selected Dates Unavailable' 
                          : isAvailable 
                            ? 'Submit Reservation Request ↗' 
                            : 'Unavailable for Booking'}
                </button>

                <p className="text-center text-[11px] text-[#70706B] pt-1">
                  Verified university credentials required upon equipment handover.
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

      {/* WEB-C08: Status Change Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-[#E5E5E0] rounded-[32px] p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#F5F5F3] border border-[#E5E5E0] flex items-center justify-center text-[#111110]">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#111110]">
                    Update Equipment Status
                  </h3>
                  <p className="text-xs text-[#70706B]">
                    Record status transition & audit justification (WEB-C08)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="text-[#70706B] hover:text-[#111110] p-1.5 rounded-full hover:bg-[#F5F5F3] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {statusModalError && (
              <div className="p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-2xl text-xs text-[#991B1B] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{statusModalError}</span>
              </div>
            )}

            <form onSubmit={handleStatusChangeSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#111110] block">
                  New Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['available', 'maintenance', 'retired'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatusSelection(st)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all active:scale-95 ${
                        newStatusSelection === st
                          ? 'border-[#111110] bg-[#111110] text-white shadow-xs'
                          : 'border-[#E5E5E0] bg-[#F8F8F6] text-[#70706B] hover:border-[#111110] hover:text-[#111110]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#111110] block">
                  Justification / Reason <span className="text-[#DC2626]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={statusChangeReason}
                  onChange={(e) => setStatusChangeReason(e.target.value)}
                  placeholder="e.g., Scheduled bi-weekly sensor dust cleaning and optical calibration..."
                  className="input-paraquet rounded-2xl text-xs sm:text-sm resize-none"
                  required
                />
                <span className="text-[10px] text-[#70706B] block">
                  A clear reason must be provided to maintain compliance with challenge card WEB-C08.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-4 rounded-full"
                  disabled={isSubmittingStatus}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-2 px-5 rounded-full"
                  disabled={isSubmittingStatus}
                >
                  {isSubmittingStatus ? 'Saving Transition...' : 'Log & Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

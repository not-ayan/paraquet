'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Camera, 
  PlusCircle, 
  Activity, 
  Package, 
  XCircle,
  CheckCircle2,
  ArrowUpRight,
  Clock,
  User as UserIcon,
  FileText,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  ZoomIn,
  X
} from 'lucide-react';
import { useAuth, useUser } from '@clerk/nextjs';
import { apiClient } from '@/lib/api';
import { Booking, Equipment, ActivityLog, UserProfile } from '@/lib/types';
import ConditionReportModal from '@/components/ConditionReportModal';

export default function DashboardPage() {
  const { isLoaded: isAuthLoaded, isSignedIn, userId } = useAuth();
  const { user: clerkUser } = useUser();

  const [user, setUser] = useState<UserProfile>({
    clerkId: 'user_student',
    name: 'Student Borrower',
    email: 'student@campus.edu',
    department: 'Creative Media & Arts',
    studentId: '2026-STU-8821',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    borrowingCount: 0,
    lendingCount: 0,
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [myEquipment, setMyEquipment] = useState<Equipment[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<'bookings' | 'equipment' | 'activity'>('bookings');
  const [activityFilter, setActivityFilter] = useState<'ALL' | 'CONDITION' | 'BOOKINGS'>('ALL');
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<{ url: string; title: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeBookingForReport, setActiveBookingForReport] = useState<{
    id: string;
    name: string;
    type: 'PICKUP' | 'RETURN';
  } | null>(null);

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [usr, bks, allEq, act] = await Promise.all([
        apiClient.getProfile(),
        apiClient.getMyBookings(),
        apiClient.getEquipment(),
        apiClient.getMyActivity(),
      ]);

      const currentClerkId = clerkUser?.id || userId || usr.clerkId;
      const currentName = clerkUser?.fullName || clerkUser?.firstName || usr.name;
      const currentEmail = clerkUser?.primaryEmailAddress?.emailAddress || usr.email;
      const currentAvatar = clerkUser?.imageUrl || usr.avatarUrl;

      setUser({
        ...usr,
        clerkId: currentClerkId,
        name: currentName,
        email: currentEmail,
        avatarUrl: currentAvatar,
      });

      setBookings(bks);
      setMyEquipment(allEq.filter(e => e.ownerId === currentClerkId || e.ownerName === currentName));
      setActivity(act);
    } catch (err) {
      console.warn('Failed to refresh dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [clerkUser, userId]);

  useEffect(() => {
    // When Clerk completes loading, fetch latest real-time user data
    if (isAuthLoaded) {
      refreshData();
    }
  }, [isAuthLoaded, isSignedIn, refreshData]);

  const handleOpenConditionModal = (booking: Booking, type: 'PICKUP' | 'RETURN') => {
    setActiveBookingForReport({
      id: booking.id,
      name: booking.equipmentName,
      type,
    });
    setModalOpen(true);
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (confirm('Cancel this booking request?')) {
      await apiClient.cancelBooking(bookingId);
      await refreshData();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="badge-pill badge-booked">● Active Loan</span>;
      case 'APPROVED':
        return <span className="badge-pill badge-available">Approved (Ready for Pickup)</span>;
      case 'PENDING':
        return <span className="badge-pill badge-pending">Pending Review</span>;
      case 'RETURNED':
        return <span className="badge-pill badge-available">Returned</span>;
      case 'CANCELLED':
      case 'REJECTED':
        return <span className="badge-pill badge-rejected">{status}</span>;
      default:
        return <span className="badge-pill">{status}</span>;
    }
  };

  const getConditionGradeBadge = (grade?: string) => {
    switch (grade) {
      case 'EXCELLENT':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F5EB] text-[#1B7A42] border border-[#C3E6CD]">EXCELLENT</span>;
      case 'GOOD':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]">GOOD</span>;
      case 'FAIR':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047]">FAIR</span>;
      case 'DAMAGED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]">DAMAGED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EDEDEA] text-[#40403C]">{grade || 'GOOD'}</span>;
    }
  };

  const filteredActivity = activity.filter((act) => {
    if (activityFilter === 'CONDITION') {
      return Boolean(act.conditionReport) || act.action.includes('CONDITION') || act.action.includes('PICKUP') || act.action.includes('RETURN');
    }
    if (activityFilter === 'BOOKINGS') {
      return act.entityType === 'BOOKING' || act.action.includes('BOOKING');
    }
    return true;
  });

  return (
    <div className="container-custom py-8 sm:py-12 space-y-8">
      
      {/* Profile Header */}
      <div className="card-paraquet p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
            alt={user.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover flex-shrink-0 border border-[#E2E2DE]"
          />
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-fluid-h2 font-bold text-[#111110]">
                {user.name}
              </h1>
              <span className="badge-pill badge-available text-fluid-micro">
                {isSignedIn ? 'Verified Campus Identity' : 'Guest Member'}
              </span>
            </div>
            <p className="text-fluid-micro text-[#70706B] truncate">
              {user.email} {user.department ? `• ${user.department}` : ''} • ID: {user.studentId}
            </p>
            <p className="text-fluid-micro text-[#111110] font-medium flex items-center gap-1.5">
              <span>Account Ref:</span>
              <code className="bg-[#EDEDEA] px-1.5 py-0.5 rounded font-mono text-[11px] truncate max-w-[240px]">
                {user.clerkId}
              </code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 border-t md:border-t-0 md:border-l border-[#E2E2DE] pt-4 md:pt-0 pl-0 md:pl-8 flex-shrink-0">
          <div>
            <span className="text-fluid-h2 font-bold text-[#111110] block">
              {bookings.filter(b => b.status === 'ACTIVE').length}
            </span>
            <span className="text-fluid-micro text-[#70706B]">Active Loans</span>
          </div>
          <div className="w-px h-8 bg-[#E2E2DE]" />
          <div>
            <span className="text-fluid-h2 font-bold text-[#111110] block">
              {myEquipment.length}
            </span>
            <span className="text-fluid-micro text-[#70706B]">Listed Gear</span>
          </div>
        </div>
      </div>

      {/* Tab Pills */}
      <div className="flex items-center gap-2 border-b border-[#E2E2DE] pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 rounded-full text-fluid-body font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'bookings'
              ? 'bg-[#111110] text-white shadow-sm'
              : 'bg-white text-[#70706B] hover:text-[#111110] border border-[#E2E2DE]'
          }`}
        >
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>My Borrowing Requests ({bookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('equipment')}
          className={`px-4 py-2 rounded-full text-fluid-body font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'equipment'
              ? 'bg-[#111110] text-white shadow-sm'
              : 'bg-white text-[#70706B] hover:text-[#111110] border border-[#E2E2DE]'
          }`}
        >
          <Package className="w-4 h-4 flex-shrink-0" />
          <span>My Listed Gear ({myEquipment.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 rounded-full text-fluid-body font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'activity'
              ? 'bg-[#111110] text-white shadow-sm'
              : 'bg-white text-[#70706B] hover:text-[#111110] border border-[#E2E2DE]'
          }`}
        >
          <Activity className="w-4 h-4 flex-shrink-0" />
          <span>Audit Stream ({activity.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {bookings.length > 0 ? (
            bookings.map((b) => {
              const startDateObj = new Date(b.startDateTime);
              const endDateObj = new Date(b.endDateTime);
              
              const dateRange = `${startDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
              const timeRange = `${startDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${endDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
              
              const requestedDate = b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }) : null;

              return (
                <div key={b.id} className="card-paraquet p-5 sm:p-6 space-y-4 hover:border-[#111110]/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.equipmentImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80'}
                        alt={b.equipmentName}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-[#EDEDEA] flex-shrink-0 border border-[#E2E2DE]"
                      />
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(b.status)}
                          <span className="text-fluid-micro text-[#70706B] font-mono">Ref: {b.id.slice(-8)}</span>
                        </div>
                        
                        <h3 className="text-fluid-h3 font-bold text-[#111110]">
                          <Link 
                            href={`/equipment/${b.equipmentId}`} 
                            className="hover:underline hover:text-[#111110]"
                          >
                            {b.equipmentName}
                          </Link>
                        </h3>

                        <div className="flex items-center gap-x-4 gap-y-1 text-fluid-micro text-[#70706B] flex-wrap">
                          <span className="flex items-center gap-1 font-medium text-[#40403C]">
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-[#70706B]" />
                            <span>{dateRange} ({timeRange})</span>
                          </span>
                          {requestedDate && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 flex-shrink-0 text-[#70706B]" />
                              <span>Requested {requestedDate}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3.5 h-3.5 flex-shrink-0 text-[#70706B]" />
                            <span>Borrower: {(!b.borrowerName || b.borrowerName === 'Student Borrower' || b.borrowerName === 'Campus Borrower') ? user.name : b.borrowerName}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 sm:self-start self-start flex-shrink-0">
                      {b.status === 'APPROVED' && (
                        <button
                          onClick={() => handleOpenConditionModal(b, 'PICKUP')}
                          className="btn-primary text-fluid-micro py-2 px-3.5"
                        >
                          <Camera className="w-3.5 h-3.5" /> Submit Pickup Report
                        </button>
                      )}

                      {b.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleOpenConditionModal(b, 'RETURN')}
                          className="btn-primary text-fluid-micro py-2 px-3.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Submit Return Condition
                        </button>
                      )}

                      {b.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          className="btn-secondary text-fluid-micro text-[#DC2626] hover:bg-[#FEE2E2] border-[#FEE2E2] py-2 px-3"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel Request
                        </button>
                      )}

                      <Link
                        href={`/equipment/${b.equipmentId}`}
                        className="btn-secondary text-fluid-micro py-2 px-3"
                      >
                        Equipment Details <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                  </div>

                  {/* Purpose / Project Statement Display */}
                  {b.purpose && (
                    <div className="p-3.5 bg-[#F5F5F3] rounded-xl text-fluid-micro text-[#111110] border border-[#E2E2DE]/70 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-[#111110]">
                        <FileText className="w-3.5 h-3.5 text-[#70706B]" />
                        <span>Project Purpose & Usage Notes:</span>
                      </div>
                      <p className="text-[#40403C] pl-5 leading-relaxed whitespace-pre-wrap">
                        {b.purpose}
                      </p>
                    </div>
                  )}

                  {/* Condition Reports */}
                  {(b.pickupReport || b.returnReport) && (
                    <div className="pt-3 border-t border-[#E2E2DE] grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#EDEDEA] p-3.5 rounded-xl text-fluid-micro">
                      {b.pickupReport && (
                        <div>
                          <span className="font-bold text-[#1B7A42] block">✓ Pickup Handover: {b.pickupReport.condition}</span>
                          <span className="text-[#70706B] truncate block">{b.pickupReport.notes || 'Handover condition verified'}</span>
                        </div>
                      )}
                      {b.returnReport && (
                        <div>
                          <span className="font-bold text-[#1B7A42] block">✓ Return Inspection: {b.returnReport.condition}</span>
                          <span className="text-[#70706B] truncate block">{b.returnReport.notes || 'Return inspection recorded'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {b.rejectionReason && (
                    <div className="p-3 bg-[#FEE2E2] rounded-xl text-fluid-micro text-[#DC2626]">
                      <strong>Rejection Reason:</strong> {b.rejectionReason}
                    </div>
                  )}

                </div>
              );
            })
          ) : (
            <div className="card-paraquet p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#EDEDEA] flex items-center justify-center mx-auto text-[#70706B]">
                <Calendar className="w-6 h-6 opacity-60" />
              </div>
              <div className="space-y-1">
                <h3 className="text-fluid-h3 font-bold text-[#111110]">No Borrowing Requests Found</h3>
                <p className="text-fluid-micro text-[#70706B] max-w-sm mx-auto">
                  {isLoading ? 'Loading your reservation activity...' : "You haven't reserved or requested any equipment yet."}
                </p>
              </div>
              {!isLoading && (
                <Link href="/equipment" className="btn-primary inline-flex text-fluid-micro py-2 px-4">
                  Browse Equipment Catalog
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'equipment' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-fluid-h2 font-bold text-[#111110]">My Listed Gear</h2>
            <Link href="/equipment/new" className="btn-primary text-xs">
              <PlusCircle className="w-3.5 h-3.5" /> List Another Item
            </Link>
          </div>

          {myEquipment.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {myEquipment.map((eq) => (
                <div key={eq.id} className="card-paraquet p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="aspect-video relative rounded-xl overflow-hidden bg-[#EDEDEA] mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={eq.images[0]} alt={eq.name} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2">
                        {eq.approvalStatus === 'PENDING' ? (
                          <span className="badge-pill badge-pending text-fluid-micro">Pending Approval</span>
                        ) : (
                          <span className="badge-pill badge-available text-fluid-micro">Approved</span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-fluid-body font-bold text-[#111110] line-clamp-1">{eq.name}</h3>
                    <p className="text-fluid-micro text-[#70706B] line-clamp-2 mt-1">{eq.description}</p>
                  </div>
                  <div className="pt-2 border-t border-[#E2E2DE] flex items-center justify-between text-fluid-micro">
                    <span className="text-[#70706B]">Condition: <strong>{eq.currentCondition}</strong></span>
                    <Link href={`/equipment/${eq.id}`} className="font-bold text-[#111110] hover:underline">View →</Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-paraquet p-12 text-center space-y-3">
              <Package className="w-8 h-8 text-[#70706B] mx-auto opacity-40" />
              <h3 className="text-fluid-h3 font-bold text-[#111110]">No gear listed yet</h3>
              <p className="text-fluid-micro text-[#70706B]">Have unused studio tools? Share them with fellow campus makers.</p>
              <Link href="/equipment/new" className="btn-primary inline-flex">List Equipment</Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="card-paraquet p-6 sm:p-8 space-y-6">
          
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-5 h-5 text-[#111110]" />
                <h2 className="text-fluid-h2 font-bold text-[#111110]">
                  Custody & Condition Audit Stream
                </h2>
              </div>
              <p className="text-fluid-micro text-[#70706B]">
                Immutable system audit stream. Review equipment handovers, condition ratings, inspection photos, and AI damage scans.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-[#EDEDEA] p-1 rounded-full text-fluid-micro self-start sm:self-auto flex-wrap">
              <button
                onClick={() => setActivityFilter('ALL')}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
                  activityFilter === 'ALL'
                    ? 'bg-white text-[#111110] shadow-xs'
                    : 'text-[#70706B] hover:text-[#111110]'
                }`}
              >
                All Events ({activity.length})
              </button>
              <button
                onClick={() => setActivityFilter('CONDITION')}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                  activityFilter === 'CONDITION'
                    ? 'bg-[#111110] text-white shadow-xs'
                    : 'text-[#70706B] hover:text-[#111110]'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Condition Reports ({activity.filter(a => Boolean(a.conditionReport)).length})
              </button>
              <button
                onClick={() => setActivityFilter('BOOKINGS')}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
                  activityFilter === 'BOOKINGS'
                    ? 'bg-white text-[#111110] shadow-xs'
                    : 'text-[#70706B] hover:text-[#111110]'
                }`}
              >
                Bookings
              </button>
            </div>
          </div>

          {filteredActivity.length > 0 ? (
            <div className="space-y-4">
              {filteredActivity.map((act) => {
                const dateObj = new Date(act.createdAt);
                const dateFormatted = !isNaN(dateObj.getTime())
                  ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Recent';
                const timeFormatted = !isNaN(dateObj.getTime())
                  ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '';

                const cr = act.conditionReport;
                const isCondition = Boolean(cr);

                return (
                  <div
                    key={act.id}
                    className={`rounded-2xl border transition-all ${
                      isCondition
                        ? 'bg-white border-[#E2E2DE] p-5 shadow-xs hover:border-[#C8C8C4] space-y-4'
                        : 'bg-[#F9F9F8] border-[#EDEDEA] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3'
                    }`}
                  >
                    {isCondition && cr ? (
                      <>
                        {/* Condition Header Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0F0EE] pb-3">
                          <div className="flex items-center gap-2">
                            {cr.type === 'PICKUP' ? (
                              <span className="px-3 py-1 rounded-full text-fluid-micro font-bold bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] flex items-center gap-1.5">
                                <Camera className="w-3.5 h-3.5" /> Pickup Condition Report
                              </span>
                            ) : cr.aiFlagged ? (
                              <span className="px-3 py-1 rounded-full text-fluid-micro font-bold bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5] flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" /> Condition Discrepancy Flagged
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-fluid-micro font-bold bg-[#FAF5FF] text-[#6B21A8] border border-[#E9D5FF] flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Return Verification Report
                              </span>
                            )}

                            {getConditionGradeBadge(cr.condition)}
                          </div>

                          <span className="text-fluid-micro text-[#70706B] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {dateFormatted} at {timeFormatted}
                          </span>
                        </div>

                        {/* Equipment Info & Notes */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                          {/* Left: Gear thumbnail & name */}
                          <div className="md:col-span-4 flex items-center gap-3">
                            {act.equipmentImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={act.equipmentImage}
                                alt={act.entityName}
                                className="w-14 h-14 rounded-xl object-cover bg-[#EDEDEA] flex-shrink-0 border border-[#E2E2DE]"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-[#EDEDEA] flex items-center justify-center flex-shrink-0 text-[#70706B]">
                                <Package className="w-6 h-6 opacity-40" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-[#70706B] block truncate">
                                {act.equipmentCategory || 'Campus Equipment'}
                              </span>
                              <Link
                                href={`/equipment/${act.entityId}`}
                                className="font-bold text-fluid-body text-[#111110] hover:underline truncate block"
                              >
                                {act.entityName}
                              </Link>
                              <span className="text-fluid-micro text-[#70706B] block">
                                Handover inspection
                              </span>
                            </div>
                          </div>

                          {/* Center: Inspector Notes */}
                          <div className="md:col-span-5 bg-[#F9F9F8] border border-[#EDEDEA] p-3 rounded-xl">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[#70706B] block mb-1 flex items-center gap-1">
                              <FileText className="w-3 h-3" /> Inspection Observations & Notes
                            </span>
                            <p className="text-fluid-micro text-[#111110]/90 leading-relaxed italic">
                              "{cr.notes || 'No specific flaws or physical damage noted during handover inspection.'}"
                            </p>
                          </div>

                          {/* Right: Inspection Photos */}
                          <div className="md:col-span-3">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[#70706B] block mb-1.5 flex items-center gap-1">
                              <Camera className="w-3 h-3" /> Inspection Evidence ({cr.photos?.length || 0})
                            </span>
                            {cr.photos && cr.photos.length > 0 ? (
                              <div className="flex items-center gap-2">
                                {cr.photos.map((photo, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => setSelectedPhotoPreview({ url: photo, title: `${act.entityName} (${cr.type} Report)` })}
                                    className="relative group w-14 h-14 rounded-xl overflow-hidden border border-[#E2E2DE] hover:border-[#111110] transition-all flex-shrink-0"
                                    title="Click to zoom inspection photo"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={photo} alt="condition evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                      <ZoomIn className="w-4 h-4" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span className="text-fluid-micro text-[#70706B]">No photos attached</span>
                            )}
                          </div>
                        </div>

                        {/* AI Condition Check Badge / Alert */}
                        {cr.aiFlagged ? (
                          <div className="p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl flex items-start gap-2 text-fluid-micro text-[#991B1B]">
                            <AlertTriangle className="w-4 h-4 text-[#DC2626] flex-shrink-0 mt-0.5" />
                            <div>
                              <strong className="block">AI Visual Anomaly Detected ({Math.round((cr.aiSimilarityScore ?? 0.6) * 100)}% Match)</strong>
                              <p className="opacity-90 leading-tight mt-0.5">
                                Machine vision inspection flagged noticeable surface or cosmetic alterations compared to pickup baseline. Administrator sign-off required.
                              </p>
                            </div>
                          </div>
                        ) : typeof cr.aiSimilarityScore === 'number' ? (
                          <div className="p-2.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex items-center gap-2 text-fluid-micro text-[#166534]">
                            <ShieldCheck className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                            <span>
                              <strong>AI Visual Verification Passed:</strong> {Math.round(cr.aiSimilarityScore * 100)}% structural consistency verified against baseline handover photos.
                            </span>
                          </div>
                        ) : null}

                        {/* Attribution footer */}
                        <div className="pt-2 border-t border-[#F5F5F3] flex items-center justify-between text-[11px] text-[#70706B]">
                          <span>
                            Logged by <strong>{cr.recordedBy || act.userName}</strong>
                          </span>
                          <span className="font-mono">Log #{act.id.slice(-8)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          {act.equipmentImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={act.equipmentImage}
                              alt={act.entityName}
                              className="w-10 h-10 rounded-xl object-cover bg-[#EDEDEA] flex-shrink-0 border border-[#E2E2DE]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-[#EDEDEA] flex items-center justify-center flex-shrink-0 text-[#70706B]">
                              <Activity className="w-4 h-4 opacity-50" />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-[#111110] block text-sm">
                              {act.action.replace(/_/g, ' ')}
                            </span>
                            <span className="text-fluid-micro text-[#70706B]">
                              {act.message || `Target: ${act.entityName} • By ${act.userName}`}
                            </span>
                          </div>
                        </div>

                        <span className="text-fluid-micro text-[#70706B] whitespace-nowrap self-start sm:self-center">
                          {dateFormatted} at {timeFormatted}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card-paraquet p-12 text-center space-y-3">
              <Camera className="w-8 h-8 text-[#70706B] mx-auto opacity-40" />
              <h3 className="text-fluid-h3 font-bold text-[#111110]">
                {activityFilter === 'CONDITION' ? 'No condition reports found' : 'No activity logged yet'}
              </h3>
              <p className="text-fluid-micro text-[#70706B]">
                {activityFilter === 'CONDITION'
                  ? 'Pickup and return condition photo inspections will appear here automatically.'
                  : 'System lifecycle events and equipment reservations will populate this audit log.'}
              </p>
            </div>
          )}
        </div>
      )}

      {activeBookingForReport && (
        <ConditionReportModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setActiveBookingForReport(null);
          }}
          bookingId={activeBookingForReport.id}
          equipmentName={activeBookingForReport.name}
          type={activeBookingForReport.type}
          onSuccess={() => {
            refreshData();
          }}
        />
      )}

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

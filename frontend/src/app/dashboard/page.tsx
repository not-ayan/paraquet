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
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ZoomIn,
  Bot,
  MapPin,
  X
} from 'lucide-react';
import { useAuth, useUser } from '@clerk/nextjs';
import { apiClient, getFallbackImage } from '@/lib/api';
import { Booking, Equipment, ActivityLog, UserProfile } from '@/lib/types';
import ConditionReportModal from '@/components/ConditionReportModal';

export default function DashboardPage() {
  const { isLoaded: isAuthLoaded, isSignedIn, userId } = useAuth();
  const { user: clerkUser } = useUser();

  const [user, setUser] = useState<UserProfile>({
    clerkId: 'user_student',
    name: 'Student Borrower',
    email: 'student@tezu.ac.in',
    department: 'Tezpur University, Assam',
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
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8] animate-pulse" />
            Active Loan
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8F5EB] text-[#1B7A42] border border-[#A7F3D0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1B7A42]" />
            Approved • Ready for Pickup
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EAB308]" />
            Pending Review
          </span>
        );
      case 'RETURNED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F5F5F3] text-[#40403C] border border-[#E5E5E0]">
            <CheckCircle2 className="w-3 h-3 text-[#1B7A42]" />
            Returned
          </span>
        );
      case 'CANCELLED':
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]">
            <XCircle className="w-3 h-3 text-[#DC2626]" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#EDEDEA] text-[#40403C] border border-[#E5E5E0]">
            {status}
          </span>
        );
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
      <div className="rounded-[28px] border border-[#E5E5E0] bg-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
            alt={user.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-[22px] object-cover flex-shrink-0 border border-[#E5E5E0] shadow-2xs"
          />
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-fluid-h2 font-bold text-[#111110] tracking-tight">
                {user.name}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F5EB] text-[#1B7A42] border border-[#A7F3D0]">
                <ShieldCheck className="w-3 h-3 text-[#1B7A42]" />
                {isSignedIn ? 'Verified Member' : 'Guest Member'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#70706B] truncate">
              {user.email} {user.department ? `• ${user.department}` : ''} • ID: {user.studentId}
            </p>
            <p className="text-xs text-[#111110] font-medium flex items-center gap-1.5">
              <span className="text-[#70706B]">Account Ref:</span>
              <code className="bg-[#F5F5F3] text-[#111110] border border-[#E5E5E0] px-2 py-0.5 rounded-lg font-mono text-[11px] truncate max-w-[240px]">
                {user.clerkId}
              </code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-[#E5E5E0] pt-4 md:pt-0 pl-0 md:pl-8 flex-shrink-0">
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-[#111110] font-mono block">
              {bookings.filter(b => b.status === 'ACTIVE').length}
            </span>
            <span className="text-xs text-[#70706B] font-medium">Active Loans</span>
          </div>
          <div className="w-px h-10 bg-[#E5E5E0]" />
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-[#111110] font-mono block">
              {myEquipment.length}
            </span>
            <span className="text-xs text-[#70706B] font-medium">Listed Gear</span>
          </div>
        </div>
      </div>

      {/* Tab Pills */}
      <div className="flex items-center gap-2 border-b border-[#E5E5E0] pb-3.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-[0.98] flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'bookings'
              ? 'bg-[#111110] text-white shadow-xs'
              : 'bg-white text-[#70706B] hover:text-[#111110] border border-[#E5E5E0] hover:border-[#111110]/30'
          }`}
        >
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>My Borrowing Requests ({bookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('equipment')}
          className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-[0.98] flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'equipment'
              ? 'bg-[#111110] text-white shadow-xs'
              : 'bg-white text-[#70706B] hover:text-[#111110] border border-[#E5E5E0] hover:border-[#111110]/30'
          }`}
        >
          <Package className="w-4 h-4 flex-shrink-0" />
          <span>My Listed Gear ({myEquipment.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-[0.98] flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'activity'
              ? 'bg-[#111110] text-white shadow-xs'
              : 'bg-white text-[#70706B] hover:text-[#111110] border border-[#E5E5E0] hover:border-[#111110]/30'
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

              const equipmentImage = b.equipmentImage || getFallbackImage(b.equipmentName);

              return (
                <div 
                  key={b.id} 
                  className="rounded-[28px] border border-[#E5E5E0] bg-white p-5 sm:p-7 space-y-4 hover:border-[#111110]/30 transition-all duration-150 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                    
                    <div className="flex items-start gap-4 sm:gap-5 min-w-0 flex-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={equipmentImage}
                        alt={b.equipmentName}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-[20px] object-cover bg-[#EDEDEA] flex-shrink-0 border border-[#E5E5E0]"
                      />
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(b.status)}
                          {b.charges && ((b.charges.overdueFee || 0) > 0 || (b.charges.damageFee || 0) > 0) && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]">
                              Fee: ₹{((b.charges.overdueFee || 0) + (b.charges.damageFee || 0)).toLocaleString('en-IN')}
                            </span>
                          )}
                          <span className="text-[11px] text-[#70706B] font-mono">Ref: {b.id.slice(-8)}</span>
                        </div>
                        
                        <h3 className="text-fluid-h3 font-bold text-[#111110]">
                          <Link 
                            href={`/equipment/${b.equipmentId}`} 
                            className="hover:underline hover:text-[#111110]"
                          >
                            {b.equipmentName}
                          </Link>
                        </h3>

                        <div className="flex items-center gap-x-4 gap-y-1.5 text-xs text-[#70706B] flex-wrap pt-0.5">
                          <span className="flex items-center gap-1.5 font-medium text-[#40403C]">
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-[#70706B]" />
                            <span>{dateRange} ({timeRange})</span>
                          </span>
                          {b.location && (
                            <span className="flex items-center gap-1.5 text-[#111110] font-medium bg-[#F8F8F6] px-2 py-0.5 rounded-md border border-[#E5E5E0]">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#E11D48]" />
                              <span>{b.location}</span>
                            </span>
                          )}
                          {requestedDate && (
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 flex-shrink-0 text-[#70706B]" />
                              <span>Requested {requestedDate}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <UserIcon className="w-3.5 h-3.5 flex-shrink-0 text-[#70706B]" />
                            <span>Borrower: {(!b.borrowerName || b.borrowerName === 'Student Borrower' || b.borrowerName === 'Campus Borrower') ? user.name : b.borrowerName}</span>
                          </span>
                        </div>
                        {b.purpose && b.purpose !== 'Academic / Project Work' && b.purpose !== 'Tezpur University, Assam' && (
                          <div className="text-[11px] text-[#70706B] italic pt-1">
                            Purpose: &ldquo;{b.purpose}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 sm:self-start self-start flex-shrink-0 pt-2 sm:pt-0">
                      {b.status === 'APPROVED' && (
                        <button
                          onClick={() => handleOpenConditionModal(b, 'PICKUP')}
                          className="btn-primary text-xs py-2.5 px-4"
                        >
                          <Camera className="w-3.5 h-3.5" /> Submit Pickup Report
                        </button>
                      )}

                      {b.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleOpenConditionModal(b, 'RETURN')}
                          className="btn-primary text-xs py-2.5 px-4"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Submit Return Condition
                        </button>
                      )}

                      {b.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          className="btn-secondary text-xs text-[#DC2626] hover:bg-[#FEE2E2] border-[#FCA5A5] py-2.5 px-3.5"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel Request
                        </button>
                      )}

                      <Link
                        href={`/equipment/${b.equipmentId}`}
                        className="btn-secondary text-xs py-2.5 px-3.5"
                      >
                        Details <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                  </div>

                  {/* Purpose / Project Statement Display */}
                  {b.purpose && (
                    <div className="p-4 bg-[#F5F5F3] rounded-2xl text-xs text-[#111110] border border-[#E5E5E0] space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-[#111110]">
                        <FileText className="w-3.5 h-3.5 text-[#70706B]" />
                        <span>Project Purpose & Usage Notes:</span>
                      </div>
                      <p className="text-[#40403C] pl-5 leading-relaxed whitespace-pre-wrap">
                        {b.purpose}
                      </p>
                    </div>
                  )}

                  {/* Condition Reports with Gemini AI Analysis */}
                  {(b.pickupReport || b.returnReport) && (
                    <div className="pt-3 border-t border-[#E5E5E0] space-y-3 bg-[#F9F9F8] p-4 rounded-2xl text-xs border border-[#E5E5E0]">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Pickup Report Card */}
                        {b.pickupReport && (
                          <div className="bg-white p-3.5 rounded-xl border border-[#E5E5E0] space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-[#1B7A42] flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Pickup Baseline Handover
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                                {b.pickupReport.condition}
                              </span>
                            </div>

                            {/* Photos & Notes */}
                            <div className="flex items-start gap-2.5">
                              {b.pickupReport.photos && b.pickupReport.photos.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPhotoPreview({
                                    url: b.pickupReport!.photos![0],
                                    title: `${b.equipmentName} - Pickup Baseline Photo`
                                  })}
                                  className="w-12 h-12 rounded-lg overflow-hidden border border-[#E5E5E0] flex-shrink-0 group relative"
                                  title="View pickup inspection photo"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={b.pickupReport.photos[0]}
                                    alt="pickup baseline"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                                    <ZoomIn className="w-3 h-3" />
                                  </div>
                                </button>
                              )}
                              <div className="min-w-0 text-[11px] text-[#70706B] space-y-0.5">
                                <p className="italic text-[#111110]/80">
                                  "{b.pickupReport.notes || 'Baseline checkout inspection verified.'}"
                                </p>
                              </div>
                            </div>

                            {/* Gemini AI Baseline Assessment */}
                            {b.pickupReport.aiAnalysis && (
                              <div className="p-2.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg text-[11px] space-y-1">
                                <div className="flex items-center gap-1.5 font-bold text-[#15803D]">
                                  <Bot className="w-3 h-3 text-[#16A34A]" />
                                  <span>Gemini AI Baseline Inspection:</span>
                                </div>
                                <p className="text-[#166534] leading-relaxed">
                                  {b.pickupReport.aiAnalysis.detailedSummary}
                                </p>
                                {b.pickupReport.aiAnalysis.cosmeticFlaws && b.pickupReport.aiAnalysis.cosmeticFlaws.length > 0 && (
                                  <div className="pt-1 flex flex-wrap gap-1 items-center">
                                    <span className="text-[10px] text-[#70706B] font-medium">Pre-existing wear:</span>
                                    {b.pickupReport.aiAnalysis.cosmeticFlaws.map((flaw, idx) => (
                                      <span key={idx} className="px-1.5 py-0.5 rounded bg-white text-[#92400E] border border-[#FDE68A] text-[10px]">
                                        {flaw}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Return Report Card */}
                        {b.returnReport && (
                          <div className="bg-white p-3.5 rounded-xl border border-[#E5E5E0] space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-[#7E22CE] flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Return Verification Report
                              </span>
                              <div className="flex items-center gap-1">
                                {typeof b.returnReport.aiSimilarityScore === 'number' && (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    b.returnReport.aiSimilarityScore >= 0.85
                                      ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
                                      : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                                  }`}>
                                    {Math.round(b.returnReport.aiSimilarityScore * 100)}% Match
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF5FF] text-[#6B21A8] border border-[#E9D5FF]">
                                  {b.returnReport.condition}
                                </span>
                              </div>
                            </div>

                            {/* Photos & Notes */}
                            <div className="flex items-start gap-2.5">
                              {b.returnReport.photos && b.returnReport.photos.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPhotoPreview({
                                    url: b.returnReport!.photos![0],
                                    title: `${b.equipmentName} - Return Verification Photo`
                                  })}
                                  className="w-12 h-12 rounded-lg overflow-hidden border border-[#E5E5E0] flex-shrink-0 group relative"
                                  title="View return inspection photo"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={b.returnReport.photos[0]}
                                    alt="return inspection"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                                    <ZoomIn className="w-3 h-3" />
                                  </div>
                                </button>
                              )}
                              <div className="min-w-0 text-[11px] text-[#70706B] space-y-0.5">
                                <p className="italic text-[#111110]/80">
                                  "{b.returnReport.notes || 'Return inspection recorded.'}"
                                </p>
                              </div>
                            </div>

                            {/* Gemini AI Damage Assessment */}
                            {b.returnReport.aiAnalysis && (
                              <div className={`p-2.5 rounded-lg text-[11px] space-y-1.5 border ${
                                b.returnReport.aiAnalysis.damageType === 'structural' || b.returnReport.aiAnalysis.damageType === 'both'
                                  ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                                  : b.returnReport.aiAnalysis.damageType === 'cosmetic'
                                  ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                                  : 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 font-bold">
                                    <Bot className="w-3 h-3" />
                                    <span>Gemini Damage Comparison:</span>
                                  </div>
                                  <span className="font-extrabold uppercase text-[9px] px-1.5 py-0.5 rounded bg-white shadow-2xs">
                                    {b.returnReport.aiAnalysis.damageType === 'none' && 'No Damage'}
                                    {b.returnReport.aiAnalysis.damageType === 'cosmetic' && 'Cosmetic Wear'}
                                    {b.returnReport.aiAnalysis.damageType === 'structural' && 'Structural Damage'}
                                    {b.returnReport.aiAnalysis.damageType === 'both' && 'Cosmetic & Structural Damage'}
                                  </span>
                                </div>

                                <p className="leading-relaxed">
                                  {b.returnReport.aiAnalysis.detailedDiscrepancyReport || b.returnReport.aiAnalysis.detailedSummary}
                                </p>

                                {/* Separate Cosmetic vs Actual Damage Pills */}
                                <div className="space-y-1 pt-1 border-t border-black/5">
                                  {b.returnReport.aiAnalysis.cosmeticFlaws && b.returnReport.aiAnalysis.cosmeticFlaws.length > 0 && (
                                    <div className="flex flex-wrap gap-1 items-center">
                                      <span className="text-[10px] font-semibold opacity-80">Cosmetic:</span>
                                      {b.returnReport.aiAnalysis.cosmeticFlaws.map((flaw, idx) => (
                                        <span key={idx} className="px-1.5 py-0.5 rounded bg-white text-[#92400E] border border-[#FDE68A] text-[9px] font-medium">
                                          {flaw}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {b.returnReport.aiAnalysis.actualDamage && b.returnReport.aiAnalysis.actualDamage.length > 0 && (
                                    <div className="flex flex-wrap gap-1 items-center">
                                      <span className="text-[10px] font-semibold opacity-80">Actual Damage:</span>
                                      {b.returnReport.aiAnalysis.actualDamage.map((dmg, idx) => (
                                        <span key={idx} className="px-1.5 py-0.5 rounded bg-[#DC2626] text-white text-[9px] font-bold">
                                          {dmg}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {b.rejectionReason && (
                    <div className="p-3.5 bg-[#FEE2E2]/80 border border-[#FCA5A5] rounded-2xl text-xs text-[#991B1B]">
                      <strong className="block mb-0.5">Rejection Reason:</strong> {b.rejectionReason}
                    </div>
                  )}

                  {/* Charges / Late & Damage Fees Assessed */}
                  {b.charges && ((b.charges.overdueFee || 0) > 0 || (b.charges.damageFee || 0) > 0) && (
                    <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-xs text-[#991B1B] flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-[#DC2626]">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>Penalty / Charges Assessed (INR)</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[#7F1D1D] pl-5.5 flex-wrap">
                          {(b.charges.overdueFee || 0) > 0 && (
                            <span>Overdue Late Fee: <strong>₹{b.charges.overdueFee}</strong></span>
                          )}
                          {(b.charges.damageFee || 0) > 0 && (
                            <span>Damage Fee: <strong>₹{b.charges.damageFee}</strong></span>
                          )}
                          <span>Payment Status: <strong className="capitalize">{b.charges.status || 'pending'}</strong></span>
                        </div>
                      </div>
                      <div className="text-right font-extrabold text-sm text-[#DC2626]">
                        Total: ₹{((b.charges.overdueFee || 0) + (b.charges.damageFee || 0)).toLocaleString('en-IN')}
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          ) : (
            <div className="rounded-[28px] border border-[#E5E5E0] bg-white p-12 text-center space-y-4 shadow-2xs">
              <div className="w-14 h-14 rounded-full bg-[#F5F5F3] border border-[#E5E5E0] flex items-center justify-center mx-auto text-[#70706B]">
                <Calendar className="w-6 h-6 opacity-60" />
              </div>
              <div className="space-y-1">
                <h3 className="text-fluid-h3 font-bold text-[#111110]">No Borrowing Requests Found</h3>
                <p className="text-xs sm:text-sm text-[#70706B] max-w-sm mx-auto">
                  {isLoading ? 'Loading your reservation activity...' : "You haven't reserved or requested any equipment yet."}
                </p>
              </div>
              {!isLoading && (
                <Link href="/equipment" className="btn-primary inline-flex text-xs py-2.5 px-5">
                  Browse Equipment Catalog
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'equipment' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-fluid-h2 font-bold text-[#111110] tracking-tight">My Listed Gear</h2>
            <Link href="/equipment/new" className="btn-primary text-xs py-2.5 px-4">
              <PlusCircle className="w-4 h-4" /> List Another Item
            </Link>
          </div>

          {myEquipment.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myEquipment.map((eq) => {
                const itemImg = eq.images?.[0] || getFallbackImage(eq.name, eq.category);
                return (
                  <div 
                    key={eq.id} 
                    className="rounded-[28px] border border-[#E5E5E0] bg-white p-4 sm:p-5 space-y-3 flex flex-col justify-between shadow-2xs hover:border-[#111110]/30 transition-all duration-150 group"
                  >
                    <div>
                      <div className="aspect-[16/10] relative rounded-[20px] overflow-hidden bg-[#EDEDEA] mb-3.5 border border-[#E5E5E0]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={itemImg} 
                          alt={eq.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="absolute top-2.5 left-2.5">
                          {eq.approvalStatus === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FEF9C3]/95 backdrop-blur-xs text-[#854D0E] border border-[#FDE047] shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#EAB308]" />
                              Pending Approval
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E8F5EB]/95 backdrop-blur-xs text-[#1B7A42] border border-[#A7F3D0] shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1B7A42]" />
                              Approved
                            </span>
                          )}
                        </div>
                      </div>
                      <h3 className="text-fluid-body font-bold text-[#111110] line-clamp-1 group-hover:text-[#40403C] transition-colors">
                        {eq.name}
                      </h3>
                      <p className="text-xs text-[#70706B] line-clamp-2 mt-1 leading-relaxed">
                        {eq.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#E5E5E0] flex items-center justify-between text-xs">
                      <span className="text-[#70706B]">
                        Condition: <strong className="text-[#111110]">{eq.currentCondition}</strong>
                      </span>
                      <Link 
                        href={`/equipment/${eq.id}`} 
                        className="font-bold text-[#111110] hover:underline flex items-center gap-0.5"
                      >
                        View <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[28px] border border-[#E5E5E0] bg-white p-12 text-center space-y-3 shadow-2xs">
              <div className="w-14 h-14 rounded-full bg-[#F5F5F3] border border-[#E5E5E0] flex items-center justify-center mx-auto text-[#70706B]">
                <Package className="w-6 h-6 opacity-50" />
              </div>
              <h3 className="text-fluid-h3 font-bold text-[#111110]">No gear listed yet</h3>
              <p className="text-xs sm:text-sm text-[#70706B] max-w-sm mx-auto">
                Have studio equipment, lab gear, or sensors to share? List them for Tezpur University peer makers in Assam.
              </p>
              <Link href="/equipment/new" className="btn-primary inline-flex text-xs py-2.5 px-5">
                List Equipment
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="rounded-[28px] border border-[#E5E5E0] bg-white p-6 sm:p-8 space-y-6 shadow-2xs">
          
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <Activity className="w-5 h-5 text-[#111110]" />
                <h2 className="text-fluid-h2 font-bold text-[#111110] tracking-tight">
                  Custody & Condition Audit Stream
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#70706B]">
                Immutable system audit stream. Review equipment handovers, condition ratings, inspection photos, and AI damage scans.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-[#F5F5F3] border border-[#E5E5E0] p-1.5 rounded-full text-xs self-start sm:self-auto flex-wrap">
              <button
                onClick={() => setActivityFilter('ALL')}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all duration-150 active:scale-[0.98] ${
                  activityFilter === 'ALL'
                    ? 'bg-white text-[#111110] shadow-xs'
                    : 'text-[#70706B] hover:text-[#111110]'
                }`}
              >
                All Events ({activity.length})
              </button>
              <button
                onClick={() => setActivityFilter('CONDITION')}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all duration-150 active:scale-[0.98] flex items-center gap-1.5 ${
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
                className={`px-3 py-1.5 rounded-full font-semibold transition-all duration-150 active:scale-[0.98] ${
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
                    className={`rounded-[22px] border transition-all ${
                      isCondition
                        ? 'bg-[#FCFCFA] border-[#E5E5E0] p-5 sm:p-6 shadow-2xs hover:border-[#111110]/30 space-y-4'
                        : 'bg-[#F9F9F8] border-[#E5E5E0] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3'
                    }`}
                  >
                    {isCondition && cr ? (
                      <>
                        {/* Condition Header Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E5E0] pb-3">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            {cr.type === 'PICKUP' ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] flex items-center gap-1.5">
                                <Camera className="w-3.5 h-3.5" /> Pickup Condition Report
                              </span>
                            ) : cr.aiFlagged ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5] flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" /> Condition Discrepancy Flagged
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FAF5FF] text-[#6B21A8] border border-[#E9D5FF] flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Return Verification Report
                              </span>
                            )}

                            {getConditionGradeBadge(cr.condition)}
                          </div>

                          <span className="text-xs text-[#70706B] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> {dateFormatted} at {timeFormatted}
                          </span>
                        </div>

                        {/* Equipment Info & Notes */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                          {/* Left: Gear thumbnail & name */}
                          <div className="md:col-span-4 flex items-center gap-3.5">
                            {act.equipmentImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={act.equipmentImage}
                                alt={act.entityName}
                                className="w-14 h-14 rounded-2xl object-cover bg-[#EDEDEA] flex-shrink-0 border border-[#E5E5E0]"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-2xl bg-[#EDEDEA] flex items-center justify-center flex-shrink-0 text-[#70706B] border border-[#E5E5E0]">
                                <Package className="w-6 h-6 opacity-40" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-[#70706B] block truncate">
                                {act.equipmentCategory || 'Campus Equipment'}
                              </span>
                              <Link
                                href={`/equipment/${act.entityId}`}
                                className="font-bold text-xs sm:text-sm text-[#111110] hover:underline truncate block"
                              >
                                {act.entityName}
                              </Link>
                              <span className="text-xs text-[#70706B] block">
                                Handover inspection
                              </span>
                            </div>
                          </div>

                          {/* Center: Inspector Notes */}
                          <div className="md:col-span-5 bg-white border border-[#E5E5E0] p-3.5 rounded-2xl">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[#70706B] block mb-1 flex items-center gap-1">
                              <FileText className="w-3 h-3" /> Inspection Observations & Notes
                            </span>
                            <p className="text-xs text-[#111110]/90 leading-relaxed italic">
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
                                    className="relative group w-14 h-14 rounded-2xl overflow-hidden border border-[#E5E5E0] hover:border-[#111110] transition-all flex-shrink-0 active:scale-95"
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
                              <span className="text-xs text-[#70706B]">No photos attached</span>
                            )}
                          </div>
                        </div>

                        {/* Gemini AI Condition Inspection & Damage Breakdown */}
                        {cr.aiAnalysis ? (
                          <div className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
                            cr.type === 'PICKUP'
                              ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                              : cr.aiAnalysis.damageType === 'structural' || cr.aiAnalysis.damageType === 'both' || cr.aiFlagged
                              ? 'bg-[#FEF2F2] border-[#FECACA]'
                              : cr.aiAnalysis.damageType === 'cosmetic'
                              ? 'bg-[#FFFBEB] border-[#FDE68A]'
                              : 'bg-[#F0FDF4] border-[#BBF7D0]'
                          }`}>
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-2">
                              <div className="flex items-center gap-2">
                                <Bot className="w-4 h-4 text-[#111110]" />
                                <span className="font-bold text-[#111110]">
                                  {cr.type === 'PICKUP'
                                    ? 'Gemini AI Baseline Inspection Report'
                                    : 'Gemini AI Return Damage Audit'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap">
                                {typeof cr.aiSimilarityScore === 'number' && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#111110] border border-[#E5E5E0] shadow-2xs">
                                    Similarity: {Math.round(cr.aiSimilarityScore * 100)}%
                                  </span>
                                )}

                                {cr.type === 'RETURN' && (
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                    cr.aiAnalysis.damageType === 'none'
                                      ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]'
                                      : cr.aiAnalysis.damageType === 'cosmetic'
                                      ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                                      : 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]'
                                  }`}>
                                    {cr.aiAnalysis.damageType === 'none' && 'No Damage'}
                                    {cr.aiAnalysis.damageType === 'cosmetic' && 'Cosmetic Wear'}
                                    {cr.aiAnalysis.damageType === 'structural' && 'Structural Damage'}
                                    {cr.aiAnalysis.damageType === 'both' && 'Cosmetic & Structural Damage'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Detailed Condition Statement */}
                            <p className="text-[#111110]/90 leading-relaxed">
                              {cr.type === 'RETURN' && cr.aiAnalysis.detailedDiscrepancyReport
                                ? cr.aiAnalysis.detailedDiscrepancyReport
                                : cr.aiAnalysis.detailedSummary}
                            </p>

                            {/* Cosmetic vs Actual Damage Breakdown */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {/* Cosmetic Flaws */}
                              <div className="p-2.5 bg-white/80 rounded-xl border border-black/5 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-[#70706B] block">
                                  {cr.type === 'PICKUP' ? 'Pre-Existing Flaws' : 'Cosmetic Flaws (Scuffs / Wear)'}
                                </span>
                                {cr.aiAnalysis.cosmeticFlaws && cr.aiAnalysis.cosmeticFlaws.length > 0 ? (
                                  <ul className="space-y-0.5">
                                    {cr.aiAnalysis.cosmeticFlaws.map((flaw, idx) => (
                                      <li key={idx} className="text-[11px] text-[#92400E] flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] flex-shrink-0" />
                                        <span>{flaw}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-[11px] text-[#16A34A] flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> No cosmetic blemishes observed
                                  </span>
                                )}
                              </div>

                              {/* Actual Damage */}
                              <div className="p-2.5 bg-white/80 rounded-xl border border-black/5 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-[#70706B] block">
                                  Actual / Structural Damage
                                </span>
                                {cr.aiAnalysis.actualDamage && cr.aiAnalysis.actualDamage.length > 0 ? (
                                  <ul className="space-y-0.5">
                                    {cr.aiAnalysis.actualDamage.map((dmg, idx) => (
                                      <li key={idx} className="text-[11px] text-[#DC2626] font-semibold flex items-center gap-1.5">
                                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                        <span>{dmg}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-[11px] text-[#16A34A] flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> Intact • No structural damage
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Recommended Action / Flag Notice */}
                            {cr.aiAnalysis.recommendedAction && (
                              <div className="text-[11px] font-semibold text-[#70706B] pt-0.5">
                                💡 Recommended Action: <span className="text-[#111110]">{cr.aiAnalysis.recommendedAction}</span>
                              </div>
                            )}
                          </div>
                        ) : cr.aiFlagged ? (
                          <div className="p-3.5 bg-[#FEE2E2]/80 border border-[#FCA5A5] rounded-2xl flex items-start gap-2.5 text-xs text-[#991B1B]">
                            <AlertTriangle className="w-4 h-4 text-[#DC2626] flex-shrink-0 mt-0.5" />
                            <div>
                              <strong className="block">AI Visual Anomaly Detected ({Math.round((cr.aiSimilarityScore ?? 0.6) * 100)}% Match)</strong>
                              <p className="opacity-90 leading-tight mt-0.5">
                                Machine vision inspection flagged noticeable surface or cosmetic alterations compared to pickup baseline. Administrator sign-off required.
                              </p>
                            </div>
                          </div>
                        ) : typeof cr.aiSimilarityScore === 'number' ? (
                          <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl flex items-center gap-2.5 text-xs text-[#166534]">
                            <ShieldCheck className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                            <span>
                              <strong>AI Visual Verification Passed:</strong> {Math.round(cr.aiSimilarityScore * 100)}% structural consistency verified against baseline handover photos.
                            </span>
                          </div>
                        ) : null}

                        {/* Attribution footer */}
                        <div className="pt-2 border-t border-[#E5E5E0] flex items-center justify-between text-[11px] text-[#70706B]">
                          <span>
                            Logged by <strong className="text-[#111110]">{cr.recordedBy || act.userName}</strong>
                          </span>
                          <span className="font-mono">Log #{act.id.slice(-8)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3.5">
                          {act.equipmentImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={act.equipmentImage}
                              alt={act.entityName}
                              className="w-10 h-10 rounded-2xl object-cover bg-[#EDEDEA] flex-shrink-0 border border-[#E5E5E0]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-2xl bg-[#EDEDEA] flex items-center justify-center flex-shrink-0 text-[#70706B] border border-[#E5E5E0]">
                              <Activity className="w-4 h-4 opacity-50" />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-[#111110] block text-xs sm:text-sm">
                              {act.action.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs text-[#70706B]">
                              {act.message || `Target: ${act.entityName} • By ${act.userName}`}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs text-[#70706B] whitespace-nowrap self-start sm:self-center">
                          {dateFormatted} at {timeFormatted}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[28px] border border-[#E5E5E0] bg-white p-12 text-center space-y-3 shadow-2xs">
              <div className="w-14 h-14 rounded-full bg-[#F5F5F3] border border-[#E5E5E0] flex items-center justify-center mx-auto text-[#70706B]">
                <Camera className="w-6 h-6 opacity-40" />
              </div>
              <h3 className="text-fluid-h3 font-bold text-[#111110]">
                {activityFilter === 'CONDITION' ? 'No condition reports found' : 'No activity logged yet'}
              </h3>
              <p className="text-xs sm:text-sm text-[#70706B] max-w-sm mx-auto">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setSelectedPhotoPreview(null)}
        >
          <div 
            className="relative max-w-2xl w-full bg-[#111110] rounded-[28px] overflow-hidden border border-white/20 shadow-2xl p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-white px-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <Camera className="w-4 h-4 text-white/80 flex-shrink-0" />
                <span className="font-bold text-sm sm:text-base truncate">{selectedPhotoPreview.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhotoPreview(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors flex-shrink-0"
                aria-label="Close photo preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={selectedPhotoPreview.url} 
                alt={selectedPhotoPreview.title}
                className="w-full h-full object-contain"
              />
            </div>

            <p className="text-center text-xs text-white/70">
              Verified condition handover proof • Click background or close button to exit
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

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
  FileText
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
                          {b.borrowerName && (
                            <span className="flex items-center gap-1">
                              <UserIcon className="w-3.5 h-3.5 flex-shrink-0 text-[#70706B]" />
                              <span>Borrower: {b.borrowerName}</span>
                            </span>
                          )}
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
        <div className="card-paraquet p-6 sm:p-8 space-y-4">
          <div>
            <h2 className="text-fluid-h2 font-bold text-[#111110]">Recent Custody Events</h2>
            <p className="text-fluid-micro text-[#70706B]">Immutable system audit stream for loan lifecycle transitions.</p>
          </div>

          <div className="space-y-3">
            {activity.map((act) => {
              const time = new Date(act.createdAt).toLocaleString();
              return (
                <div key={act.id} className="p-3 bg-[#EDEDEA] rounded-xl flex items-center justify-between gap-4 text-fluid-body">
                  <div>
                    <span className="font-bold text-[#111110] block text-sm">
                      {act.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-fluid-micro text-[#70706B]">
                      Target: <strong>{act.entityName}</strong> • Triggered by {act.userName}
                    </span>
                  </div>
                  <span className="text-fluid-micro text-[#9C9C96] whitespace-nowrap">{time}</span>
                </div>
              );
            })}
          </div>
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

    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Info,
  Clock,
  UserCheck,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Booking } from '@/lib/types';

interface AvailabilityCalendarProps {
  bookings: Booking[];
  selectedStartDate?: string; // YYYY-MM-DD
  selectedEndDate?: string;   // YYYY-MM-DD
  onSelectDateRange?: (start: string, end: string) => void;
  maxBorrowDays?: number;
}

type DayStatus = 'AVAILABLE' | 'PENDING' | 'BOOKED' | 'OVERDUE' | 'PAST';

interface DayInfo {
  dateStr: string; // YYYY-MM-DD
  dayNum: number;
  isCurrentMonth: boolean;
  status: DayStatus;
  matchingBooking?: Booking;
  isToday: boolean;
  isSelected: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
}

export default function AvailabilityCalendar({
  bookings,
  selectedStartDate,
  selectedEndDate,
  onSelectDateRange,
  maxBorrowDays = 3,
}: AvailabilityCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  // Initial display month: based on selectedStartDate or today
  const [viewDate, setViewDate] = useState(() => {
    if (selectedStartDate) {
      const parts = selectedStartDate.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return new Date(parts[0], parts[1] - 1, 1);
      }
    }
    return new Date();
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  // Calendar Day Generation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: DayInfo[] = [];

    // Helper: evaluate day status
    const evaluateStatus = (dateStr: string): { status: DayStatus; booking?: Booking } => {
      if (dateStr < todayStr) {
        return { status: 'PAST' };
      }

      // Check matching bookings
      for (const b of bookings) {
        const bStart = b.startDateTime.slice(0, 10);
        const bEnd = b.endDateTime.slice(0, 10);

        if (dateStr >= bStart && dateStr <= bEnd) {
          const isOverdue = b.status === 'OVERDUE' || (b.status === 'ACTIVE' && new Date(b.endDateTime) < today);
          if (isOverdue) return { status: 'OVERDUE', booking: b };
          if (b.status === 'ACTIVE' || b.status === 'APPROVED') return { status: 'BOOKED', booking: b };
          if (b.status === 'PENDING') return { status: 'PENDING', booking: b };
        }
      }

      return { status: 'AVAILABLE' };
    };

    // 1. Previous Month Padding Days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const prevD = new Date(year, month - 1, dNum);
      const prevY = prevD.getFullYear();
      const prevM = String(prevD.getMonth() + 1).padStart(2, '0');
      const prevDayPadded = String(dNum).padStart(2, '0');
      const dateStr = `${prevY}-${prevM}-${prevDayPadded}`;
      const { status, booking } = evaluateStatus(dateStr);

      days.push({
        dateStr,
        dayNum: dNum,
        isCurrentMonth: false,
        status,
        matchingBooking: booking,
        isToday: dateStr === todayStr,
        isSelected: Boolean(selectedStartDate && selectedEndDate && dateStr >= selectedStartDate && dateStr <= selectedEndDate),
        isRangeStart: dateStr === selectedStartDate,
        isRangeEnd: dateStr === selectedEndDate,
      });
    }

    // 2. Current Month Days
    for (let day = 1; day <= daysInMonth; day++) {
      const monthPadded = String(month + 1).padStart(2, '0');
      const dayPadded = String(day).padStart(2, '0');
      const dateStr = `${year}-${monthPadded}-${dayPadded}`;
      const { status, booking } = evaluateStatus(dateStr);

      days.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: true,
        status,
        matchingBooking: booking,
        isToday: dateStr === todayStr,
        isSelected: Boolean(selectedStartDate && selectedEndDate && dateStr >= selectedStartDate && dateStr <= selectedEndDate),
        isRangeStart: dateStr === selectedStartDate,
        isRangeEnd: dateStr === selectedEndDate,
      });
    }

    // 3. Next Month Padding Days to fill grid
    const totalSlots = Math.ceil(days.length / 7) * 7;
    const remaining = totalSlots - days.length;
    for (let day = 1; day <= remaining; day++) {
      const nextD = new Date(year, month + 1, day);
      const nextY = nextD.getFullYear();
      const nextMonthPadded = String(nextD.getMonth() + 1).padStart(2, '0');
      const dayPadded = String(day).padStart(2, '0');
      const dateStr = `${nextY}-${nextMonthPadded}-${dayPadded}`;
      const { status, booking } = evaluateStatus(dateStr);

      days.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: false,
        status,
        matchingBooking: booking,
        isToday: dateStr === todayStr,
        isSelected: Boolean(selectedStartDate && selectedEndDate && dateStr >= selectedStartDate && dateStr <= selectedEndDate),
        isRangeStart: dateStr === selectedStartDate,
        isRangeEnd: dateStr === selectedEndDate,
      });
    }

    return days;
  }, [year, month, todayStr, bookings, selectedStartDate, selectedEndDate, today]);

  // Click Handler for Days
  const handleDayClick = (day: DayInfo) => {
    if (!onSelectDateRange) return;
    if (day.status === 'PAST') return;

    if (day.status === 'BOOKED' || day.status === 'OVERDUE') {
      alert(`This date is unavailable. Currently reserved by ${day.matchingBooking?.borrowerName || 'another student'}.`);
      return;
    }

    const [y, m, d] = day.dateStr.split('-').map(Number);

    // If starting fresh or clicking before current start date or range already set
    if (!selectedStartDate || (selectedStartDate && selectedEndDate && selectedStartDate !== selectedEndDate)) {
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() + Math.min(2, maxBorrowDays));
      const endY = dt.getFullYear();
      const endM = String(dt.getMonth() + 1).padStart(2, '0');
      const endD = String(dt.getDate()).padStart(2, '0');
      const endStr = `${endY}-${endM}-${endD}`;
      onSelectDateRange(day.dateStr, endStr);
    } else if (selectedStartDate && !selectedEndDate) {
      if (day.dateStr < selectedStartDate) {
        onSelectDateRange(day.dateStr, selectedStartDate);
      } else {
        onSelectDateRange(selectedStartDate, day.dateStr);
      }
    } else {
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() + Math.min(2, maxBorrowDays));
      const endY = dt.getFullYear();
      const endM = String(dt.getMonth() + 1).padStart(2, '0');
      const endD = String(dt.getDate()).padStart(2, '0');
      const endStr = `${endY}-${endM}-${endD}`;
      onSelectDateRange(day.dateStr, endStr);
    }
  };

  // Active or upcoming bookings list for quick reference
  const relevantBookings = useMemo(() => {
    return bookings
      .filter(b => b.status !== 'CANCELLED' && b.status !== 'REJECTED')
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  }, [bookings]);

  return (
    <div className="card-paraquet p-6 sm:p-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="w-5 h-5 text-[#111110]" />
            <h3 className="text-fluid-h3 font-bold text-[#111110]">
              Equipment Availability & Schedule
            </h3>
          </div>
          <p className="text-fluid-micro text-[#70706B]">
            Interactive loan calendar. Click any available day to pick your booking window.
          </p>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-[#EDEDEA] p-1 rounded-full">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white transition-all text-[#111110]"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-fluid-micro font-bold text-[#111110] px-3 min-w-[130px] text-center">
            {monthName}
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white transition-all text-[#111110]"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-[#E2E2DE] rounded-2xl overflow-hidden bg-white">
        
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 bg-[#F5F5F3] border-b border-[#E2E2DE] text-center text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#70706B] py-2.5">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const isClickable = day.status !== 'PAST';

            // Styling based on status & selection
            let bgClass = 'bg-white hover:bg-[#F5F5F3] text-[#111110]';
            let dotColor = '';

            if (day.status === 'PAST') {
              bgClass = 'bg-[#F9F9F8] text-[#B0B0A8] cursor-not-allowed';
            } else if (day.status === 'OVERDUE') {
              bgClass = 'bg-[#FEE2E2] text-[#991B1B] font-bold';
              dotColor = 'bg-[#DC2626]';
            } else if (day.status === 'BOOKED') {
              bgClass = 'bg-[#EFF6FF] text-[#1E40AF] font-semibold';
              dotColor = 'bg-[#2563EB]';
            } else if (day.status === 'PENDING') {
              bgClass = 'bg-[#FEF9C3] text-[#854D0E] font-medium';
              dotColor = 'bg-[#CA8A04]';
            }

            if (day.isSelected) {
              bgClass = 'bg-[#111110] text-white font-bold hover:bg-[#2A2A28] shadow-sm';
              dotColor = 'bg-white';
            }

            return (
              <button
                key={`${day.dateStr}-${idx}`}
                type="button"
                onClick={() => isClickable && handleDayClick(day)}
                disabled={!isClickable}
                className={`min-h-[52px] sm:min-h-[64px] p-2 border-r border-b border-[#E2E2DE] flex flex-col justify-between items-start transition-all relative group text-left ${bgClass} ${
                  !day.isCurrentMonth && day.status !== 'PAST' ? 'opacity-50' : ''
                }`}
                title={
                  day.status === 'OVERDUE'
                    ? `Overdue Loan (with ${day.matchingBooking?.borrowerName || 'Borrower'})`
                    : day.status === 'BOOKED'
                    ? `Reserved by ${day.matchingBooking?.borrowerName || 'Borrower'}`
                    : day.status === 'PENDING'
                    ? 'Pending loan request under steward review'
                    : day.status === 'PAST'
                    ? 'Past date'
                    : 'Available for reservation'
                }
              >
                <div className="w-full flex items-center justify-between">
                  <span className={`text-xs sm:text-sm ${day.isToday ? 'w-6 h-6 rounded-full bg-[#1B7A42] text-white flex items-center justify-center font-bold' : ''}`}>
                    {day.dayNum}
                  </span>
                  
                  {dotColor && (
                    <span className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0`} />
                  )}
                </div>

                <div className="w-full mt-1">
                  {day.status === 'OVERDUE' && (
                    <span className="text-[10px] sm:text-[11px] block truncate font-bold text-[#DC2626]">
                      Overdue
                    </span>
                  )}
                  {day.status === 'BOOKED' && !day.isSelected && (
                    <span className="text-[10px] sm:text-[11px] block truncate text-[#2563EB]">
                      Booked
                    </span>
                  )}
                  {day.status === 'PENDING' && !day.isSelected && (
                    <span className="text-[10px] sm:text-[11px] block truncate text-[#A16207]">
                      Pending
                    </span>
                  )}
                  {day.isSelected && (
                    <span className="text-[10px] sm:text-[11px] block truncate text-white/90">
                      {day.isRangeStart ? 'Pickup' : day.isRangeEnd ? 'Return' : 'Loan'}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#E2E2DE] text-fluid-micro">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-[#40403C]">
            <span className="w-3 h-3 rounded-full bg-white border border-[#C8C8C4]" />
            <span>Available</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#854D0E]">
            <span className="w-3 h-3 rounded-full bg-[#CA8A04]" />
            <span>Pending Review</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#1E40AF]">
            <span className="w-3 h-3 rounded-full bg-[#2563EB]" />
            <span>Reserved / In Use</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#991B1B]">
            <span className="w-3 h-3 rounded-full bg-[#DC2626]" />
            <span>Overdue</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#111110] font-semibold">
            <span className="w-3 h-3 rounded-full bg-[#111110]" />
            <span>Your Selected Range</span>
          </div>
        </div>

        <span className="text-[#70706B] text-[11px]">
          Maximum loan duration: {maxBorrowDays} days
        </span>
      </div>

      {/* Booking Timeline / Schedule Details */}
      {relevantBookings.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-fluid-micro uppercase font-bold tracking-wider text-[#70706B] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Upcoming Custody Schedule ({relevantBookings.length})</span>
          </h4>

          <div className="space-y-2">
            {relevantBookings.map((b) => {
              const startObj = new Date(b.startDateTime);
              const endObj = new Date(b.endDateTime);
              const dateText = `${startObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
              const isDue = b.status === 'OVERDUE' || (b.status === 'ACTIVE' && endObj < today);

              return (
                <div 
                  key={b.id}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-fluid-micro ${
                    isDue 
                      ? 'bg-[#FEE2E2]/60 border-[#FCA5A5] text-[#991B1B]'
                      : b.status === 'ACTIVE' || b.status === 'APPROVED'
                      ? 'bg-[#EBF5FF]/60 border-[#BFDBFE] text-[#1E40AF]'
                      : 'bg-[#FEF9C3]/60 border-[#FDE047] text-[#854D0E]'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">
                        {isDue ? '⚠️ Overdue' : b.status === 'ACTIVE' ? '● On Loan' : b.status === 'APPROVED' ? '✓ Approved' : '⏳ Pending Review'}
                      </span>
                      <span>•</span>
                      <span className="font-medium text-[#111110]">{dateText}</span>
                    </div>
                    <p className="truncate text-[11px] opacity-80">
                      {b.status === 'PENDING' ? 'Requested by a campus student' : `Borrower: ${b.borrowerName}`}
                      {b.purpose ? ` — "${b.purpose}"` : ''}
                    </p>
                  </div>

                  <span className="text-[11px] font-mono text-[#70706B] flex-shrink-0">
                    Ref: {b.id.slice(-8)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

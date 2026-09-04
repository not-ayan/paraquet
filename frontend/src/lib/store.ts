'use client';

import { Equipment, Booking, ActivityLog, UserProfile, ConditionReport, EquipmentCategory, AvailabilityStatus } from './types';
import { INITIAL_EQUIPMENT, INITIAL_BOOKINGS, INITIAL_ACTIVITY, INITIAL_USER } from './mockData';

const STORAGE_KEYS = {
  EQUIPMENT: 'commune_equipment_v1',
  BOOKINGS: 'commune_bookings_v1',
  ACTIVITY: 'commune_activity_v1',
  USER: 'commune_user_v1',
  ADMIN_SECRET: 'commune_admin_secret',
};

// Safe LocalStorage helpers
function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('LocalStorage save failed:', e);
  }
}

export const CommuneStore = {
  // --- USERS ---
  getUser(): UserProfile {
    return load(STORAGE_KEYS.USER, INITIAL_USER);
  },

  updateUser(updates: Partial<UserProfile>): UserProfile {
    const current = this.getUser();
    const updated = { ...current, ...updates };
    save(STORAGE_KEYS.USER, updated);
    return updated;
  },

  // --- EQUIPMENT ---
  getAllEquipment(filters?: { category?: string; location?: string; status?: string; search?: string }): Equipment[] {
    let list = load<Equipment[]>(STORAGE_KEYS.EQUIPMENT, INITIAL_EQUIPMENT);

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(e => 
        e.name.toLowerCase().includes(q) || 
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q)
      );
    }
    if (filters?.category && filters.category !== 'All') {
      list = list.filter(e => e.category === filters.category);
    }
    if (filters?.status) {
      list = list.filter(e => e.availabilityStatus === filters.status);
    }
    if (filters?.location) {
      list = list.filter(e => e.location.toLowerCase().includes(filters.location!.toLowerCase()));
    }
    return list;
  },

  getEquipmentById(id: string): Equipment | undefined {
    const list = load<Equipment[]>(STORAGE_KEYS.EQUIPMENT, INITIAL_EQUIPMENT);
    return list.find(e => e.id === id);
  },

  createEquipment(data: {
    name: string;
    description: string;
    category: EquipmentCategory;
    location: string;
    images: string[];
    currentCondition: 'EXCELLENT' | 'GOOD' | 'FAIR';
    specs?: Record<string, string>;
    maxBorrowDays?: number;
  }): Equipment {
    const user = this.getUser();
    const list = load<Equipment[]>(STORAGE_KEYS.EQUIPMENT, INITIAL_EQUIPMENT);

    const newEquipment: Equipment = {
      id: `eq-${Date.now().toString(36)}`,
      name: data.name,
      description: data.description,
      category: data.category,
      location: data.location,
      images: data.images.length > 0 ? data.images : ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80'],
      currentCondition: data.currentCondition,
      ownerId: user.clerkId,
      ownerName: user.name,
      ownerAvatar: user.avatarUrl,
      approvalStatus: 'PENDING', // Automatic rule from project context
      availabilityStatus: 'UNAVAILABLE', // Automatic rule
      specs: data.specs,
      maxBorrowDays: data.maxBorrowDays || 3,
      createdAt: new Date().toISOString(),
    };

    const updated = [newEquipment, ...list];
    save(STORAGE_KEYS.EQUIPMENT, updated);

    this.addActivity({
      userId: user.clerkId,
      userName: user.name,
      action: 'EQUIPMENT_CREATED',
      entityType: 'EQUIPMENT',
      entityId: newEquipment.id,
      entityName: newEquipment.name,
    });

    return newEquipment;
  },

  // --- BOOKINGS ---
  getAllBookings(): Booking[] {
    return load<Booking[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
  },

  getUserBookings(): Booking[] {
    const user = this.getUser();
    const list = this.getAllBookings();
    return list.filter(b => b.borrowerId === user.clerkId);
  },

  getBookingById(id: string): Booking | undefined {
    const list = this.getAllBookings();
    return list.find(b => b.id === id);
  },

  createBooking(data: {
    equipmentId: string;
    startDateTime: string;
    endDateTime: string;
    purpose: string;
    equipmentName?: string;
    equipmentImage?: string;
  }): { success: boolean; booking?: Booking; error?: string } {
    const equipment = this.getEquipmentById(data.equipmentId);
    if (equipment && equipment.approvalStatus !== 'APPROVED') return { success: false, error: 'Equipment is not approved for borrowing.' };
    if (equipment && equipment.availabilityStatus !== 'AVAILABLE') return { success: false, error: 'Equipment is currently unavailable.' };

    const user = this.getUser();
    const list = this.getAllBookings();

    const newBooking: Booking = {
      id: `bk-${Date.now().toString(36)}`,
      equipmentId: data.equipmentId,
      equipmentName: equipment?.name || data.equipmentName || 'Campus Equipment',
      equipmentImage: equipment?.images[0] || data.equipmentImage || '',
      borrowerId: user.clerkId,
      borrowerName: user.name,
      borrowerEmail: user.email,
      startDateTime: data.startDateTime,
      endDateTime: data.endDateTime,
      purpose: data.purpose,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    save(STORAGE_KEYS.BOOKINGS, [newBooking, ...list]);

    this.addActivity({
      userId: user.clerkId,
      userName: user.name,
      action: 'BOOKING_CREATED',
      entityType: 'BOOKING',
      entityId: newBooking.id,
      entityName: newBooking.equipmentName,
    });

    return { success: true, booking: newBooking };
  },

  cancelBooking(bookingId: string): boolean {
    const user = this.getUser();
    const list = this.getAllBookings();
    const idx = list.findIndex(b => b.id === bookingId);
    if (idx === -1) return false;

    list[idx].status = 'CANCELLED';
    save(STORAGE_KEYS.BOOKINGS, list);

    this.addActivity({
      userId: user.clerkId,
      userName: user.name,
      action: 'BOOKING_CANCELLED',
      entityType: 'BOOKING',
      entityId: bookingId,
      entityName: list[idx].equipmentName,
    });

    return true;
  },

  submitConditionReport(data: {
    bookingId: string;
    type: 'PICKUP' | 'RETURN';
    condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED';
    photoUrl: string;
    notes?: string;
  }): ConditionReport | null {
    const user = this.getUser();
    const list = this.getAllBookings();
    const idx = list.findIndex(b => b.id === data.bookingId);
    if (idx === -1) return null;

    const report: ConditionReport = {
      id: `cr-${Date.now().toString(36)}`,
      bookingId: data.bookingId,
      type: data.type,
      condition: data.condition,
      photoUrl: data.photoUrl,
      notes: data.notes,
      reportedAt: new Date().toISOString(),
      reportedBy: user.clerkId,
      aiDamageDetected: data.condition === 'DAMAGED',
      aiConfidence: 0.94,
    };

    if (data.type === 'PICKUP') {
      list[idx].pickupReport = report;
      list[idx].status = 'ACTIVE';
    } else {
      list[idx].returnReport = report;
      list[idx].status = 'RETURNED';

      // Update equipment availability back to AVAILABLE
      const eqList = load<Equipment[]>(STORAGE_KEYS.EQUIPMENT, INITIAL_EQUIPMENT);
      const eqIdx = eqList.findIndex(e => e.id === list[idx].equipmentId);
      if (eqIdx !== -1) {
        eqList[eqIdx].availabilityStatus = 'AVAILABLE';
        eqList[eqIdx].currentCondition = data.condition;
        save(STORAGE_KEYS.EQUIPMENT, eqList);
      }
    }

    save(STORAGE_KEYS.BOOKINGS, list);

    this.addActivity({
      userId: user.clerkId,
      userName: user.name,
      action: data.type === 'PICKUP' ? 'PICKUP_REPORTED' : 'RETURN_REPORTED',
      entityType: 'CONDITION_REPORT',
      entityId: report.id,
      entityName: `${list[idx].equipmentName} (${data.type})`,
    });

    return report;
  },

  // --- ADMIN ACTIONS ---
  getPendingEquipment(): Equipment[] {
    const list = load<Equipment[]>(STORAGE_KEYS.EQUIPMENT, INITIAL_EQUIPMENT);
    return list.filter(e => e.approvalStatus === 'PENDING');
  },

  approveEquipment(equipmentId: string): boolean {
    const list = load<Equipment[]>(STORAGE_KEYS.EQUIPMENT, INITIAL_EQUIPMENT);
    const idx = list.findIndex(e => e.id === equipmentId);
    if (idx === -1) return false;

    list[idx].approvalStatus = 'APPROVED';
    list[idx].availabilityStatus = 'AVAILABLE';
    save(STORAGE_KEYS.EQUIPMENT, list);

    this.addActivity({
      userId: 'admin_sys',
      userName: 'Administrator',
      action: 'EQUIPMENT_APPROVED',
      entityType: 'EQUIPMENT',
      entityId: equipmentId,
      entityName: list[idx].name,
    });
    return true;
  },

  rejectEquipment(equipmentId: string, reason?: string): boolean {
    const list = load<Equipment[]>(STORAGE_KEYS.EQUIPMENT, INITIAL_EQUIPMENT);
    const idx = list.findIndex(e => e.id === equipmentId);
    if (idx === -1) return false;

    list[idx].approvalStatus = 'REJECTED';
    list[idx].availabilityStatus = 'UNAVAILABLE';
    save(STORAGE_KEYS.EQUIPMENT, list);

    this.addActivity({
      userId: 'admin_sys',
      userName: 'Administrator',
      action: 'EQUIPMENT_REJECTED',
      entityType: 'EQUIPMENT',
      entityId: equipmentId,
      entityName: `${list[idx].name} (Reason: ${reason || 'Not specified'})`,
    });
    return true;
  },

  getPendingBookings(): Booking[] {
    const list = this.getAllBookings();
    return list.filter(b => b.status === 'PENDING');
  },

  approveBooking(bookingId: string): boolean {
    const list = this.getAllBookings();
    const idx = list.findIndex(b => b.id === bookingId);
    if (idx === -1) return false;

    list[idx].status = 'APPROVED';
    save(STORAGE_KEYS.BOOKINGS, list);

    // Update equipment status to booked
    const eqList = load<Equipment[]>(STORAGE_KEYS.EQUIPMENT, INITIAL_EQUIPMENT);
    const eqIdx = eqList.findIndex(e => e.id === list[idx].equipmentId);
    if (eqIdx !== -1) {
      eqList[eqIdx].availabilityStatus = 'BOOKED';
      save(STORAGE_KEYS.EQUIPMENT, eqList);
    }

    this.addActivity({
      userId: 'admin_sys',
      userName: 'Administrator',
      action: 'BOOKING_APPROVED',
      entityType: 'BOOKING',
      entityId: bookingId,
      entityName: list[idx].equipmentName,
    });
    return true;
  },

  rejectBooking(bookingId: string, reason?: string): boolean {
    const list = this.getAllBookings();
    const idx = list.findIndex(b => b.id === bookingId);
    if (idx === -1) return false;

    list[idx].status = 'REJECTED';
    list[idx].rejectionReason = reason;
    save(STORAGE_KEYS.BOOKINGS, list);

    this.addActivity({
      userId: 'admin_sys',
      userName: 'Administrator',
      action: 'BOOKING_REJECTED',
      entityType: 'BOOKING',
      entityId: bookingId,
      entityName: `${list[idx].equipmentName} (Reason: ${reason || 'Unavailable'})`,
    });
    return true;
  },

  // --- ACTIVITY LOGS ---
  getActivity(): ActivityLog[] {
    return load<ActivityLog[]>(STORAGE_KEYS.ACTIVITY, INITIAL_ACTIVITY);
  },

  getUserActivity(): ActivityLog[] {
    const user = this.getUser();
    const list = this.getActivity();
    return list.filter(a => a.userId === user.clerkId || a.userId === 'admin_sys');
  },

  addActivity(entry: Omit<ActivityLog, 'id' | 'createdAt'>): void {
    const list = this.getActivity();
    const newEntry: ActivityLog = {
      ...entry,
      id: `act-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    save(STORAGE_KEYS.ACTIVITY, [newEntry, ...list]);
  },

  // Admin secret helper
  getAdminSecret(): string {
    return load<string>(STORAGE_KEYS.ADMIN_SECRET, 'commune_hackathon_admin_secret');
  },

  setAdminSecret(secret: string): void {
    save(STORAGE_KEYS.ADMIN_SECRET, secret);
  },

  resetDefaults(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.EQUIPMENT);
    localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_SECRET);
    window.location.reload();
  },
};

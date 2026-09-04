import { CommuneStore } from './store';
import { Equipment, Booking, ConditionReport, ActivityLog, UserProfile, EquipmentCategory } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// Forward token or fall back to client store for rich hackathon experience
export const apiClient = {
  async getProfile(): Promise<UserProfile> {
    if (!API_BASE) return CommuneStore.getUser();
    const res = await fetch(`${API_BASE}/users/me`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    if (!API_BASE) return CommuneStore.updateUser(updates);
    const res = await fetch(`${API_BASE}/users/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  async getEquipment(filters?: { category?: string; location?: string; status?: string; search?: string }): Promise<Equipment[]> {
    if (!API_BASE) return CommuneStore.getAllEquipment(filters);
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.location) params.set('location', filters.location);
    if (filters?.status) params.set('status', filters.status);
    const res = await fetch(`${API_BASE}/equipment?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch equipment');
    return res.json();
  },

  async getEquipmentById(id: string): Promise<Equipment | undefined> {
    if (!API_BASE) return CommuneStore.getEquipmentById(id);
    const res = await fetch(`${API_BASE}/equipment/${id}`);
    if (!res.ok) throw new Error('Equipment not found');
    return res.json();
  },

  async createEquipment(data: {
    name: string;
    description: string;
    category: EquipmentCategory;
    location: string;
    images: string[];
    currentCondition: 'EXCELLENT' | 'GOOD' | 'FAIR';
    specs?: Record<string, string>;
  }): Promise<Equipment> {
    if (!API_BASE) return CommuneStore.createEquipment(data);
    const res = await fetch(`${API_BASE}/equipment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create equipment');
    return res.json();
  },

  async getMyBookings(): Promise<Booking[]> {
    if (!API_BASE) return CommuneStore.getUserBookings();
    const res = await fetch(`${API_BASE}/bookings/me`);
    if (!res.ok) throw new Error('Failed to fetch user bookings');
    return res.json();
  },

  async createBooking(data: {
    equipmentId: string;
    startDateTime: string;
    endDateTime: string;
    purpose: string;
  }): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    if (!API_BASE) return CommuneStore.createBooking(data);
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return res.ok ? { success: true, booking: json } : { success: false, error: json.error || 'Failed' };
  },

  async cancelBooking(bookingId: string): Promise<boolean> {
    if (!API_BASE) return CommuneStore.cancelBooking(bookingId);
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, { method: 'PATCH' });
    return res.ok;
  },

  async submitPickupCondition(bookingId: string, data: { condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED'; photoUrl: string; notes?: string }): Promise<ConditionReport | null> {
    if (!API_BASE) return CommuneStore.submitConditionReport({ bookingId, type: 'PICKUP', ...data });
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/pickup-condition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return res.json();
  },

  async submitReturnCondition(bookingId: string, data: { condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED'; photoUrl: string; notes?: string }): Promise<ConditionReport | null> {
    if (!API_BASE) return CommuneStore.submitConditionReport({ bookingId, type: 'RETURN', ...data });
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/return-condition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return res.json();
  },

  async getMyActivity(): Promise<ActivityLog[]> {
    if (!API_BASE) return CommuneStore.getUserActivity();
    const res = await fetch(`${API_BASE}/activity/me`);
    if (!res.ok) return [];
    return res.json();
  },

  // Admin APIs
  async getAdminPendingEquipment(adminSecret?: string): Promise<Equipment[]> {
    if (!API_BASE) return CommuneStore.getPendingEquipment();
    const res = await fetch(`${API_BASE}/admin/equipment/pending`, {
      headers: { 'x-admin-secret': adminSecret || '' },
    });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  },

  async approveEquipment(equipmentId: string, adminSecret?: string): Promise<boolean> {
    if (!API_BASE) return CommuneStore.approveEquipment(equipmentId);
    const res = await fetch(`${API_BASE}/admin/equipment/${equipmentId}/approve`, {
      method: 'PATCH',
      headers: { 'x-admin-secret': adminSecret || '' },
    });
    return res.ok;
  },

  async rejectEquipment(equipmentId: string, reason?: string, adminSecret?: string): Promise<boolean> {
    if (!API_BASE) return CommuneStore.rejectEquipment(equipmentId, reason);
    const res = await fetch(`${API_BASE}/admin/equipment/${equipmentId}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret || '' },
      body: JSON.stringify({ reason }),
    });
    return res.ok;
  },

  async getAdminPendingBookings(adminSecret?: string): Promise<Booking[]> {
    if (!API_BASE) return CommuneStore.getPendingBookings();
    const res = await fetch(`${API_BASE}/admin/bookings/pending`, {
      headers: { 'x-admin-secret': adminSecret || '' },
    });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  },

  async approveBooking(bookingId: string, adminSecret?: string): Promise<boolean> {
    if (!API_BASE) return CommuneStore.approveBooking(bookingId);
    const res = await fetch(`${API_BASE}/admin/bookings/${bookingId}/approve`, {
      method: 'PATCH',
      headers: { 'x-admin-secret': adminSecret || '' },
    });
    return res.ok;
  },

  async rejectBooking(bookingId: string, reason?: string, adminSecret?: string): Promise<boolean> {
    if (!API_BASE) return CommuneStore.rejectBooking(bookingId, reason);
    const res = await fetch(`${API_BASE}/admin/bookings/${bookingId}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret || '' },
      body: JSON.stringify({ reason }),
    });
    return res.ok;
  },
};

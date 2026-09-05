import { CommuneStore } from './store';
import { Equipment, Booking, ConditionReport, ActivityLog, UserProfile, EquipmentCategory } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/**
 * Aesthetic fallback images for seeded/uploaded items that lack photos
 */
export function getFallbackImage(name?: string, category?: string): string {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();

  if (n.includes('camera') || n.includes('dslr') || c.includes('camera') || c.includes('photo')) {
    return 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80';
  }
  if (n.includes('projector') || c.includes('display') || c.includes('projector')) {
    return 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80';
  }
  if (n.includes('tent') || n.includes('outdoor') || c.includes('outdoor')) {
    return 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80';
  }
  if (n.includes('speaker') || n.includes('audio') || n.includes('mic') || c.includes('audio')) {
    return 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=80';
  }
  if (n.includes('drill') || n.includes('tool') || c.includes('tool') || c.includes('workshop')) {
    return 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80';
  }
  if (n.includes('racket') || n.includes('badminton') || n.includes('sport') || c.includes('sport')) {
    return 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80';
  }
  if (n.includes('laptop') || c.includes('computing')) {
    return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80';
  }
  return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80';
}

/**
 * Clerk Token Helper for authenticated requests to Express backend
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    if (typeof window !== 'undefined') {
      // If Clerk is still initializing on full reload, wait up to 1.5s
      let attempts = 0;
      while (!(window as any).Clerk?.loaded && attempts < 15) {
        await new Promise((r) => setTimeout(r, 100));
        attempts++;
      }

      if ((window as any).Clerk?.session) {
        const token = await (window as any).Clerk.session.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const clerkUser = (window as any).Clerk?.user;
      if (clerkUser) {
        const name = clerkUser.fullName || clerkUser.firstName || clerkUser.username || '';
        const email = clerkUser.primaryEmailAddress?.emailAddress || '';
        if (name) headers['x-user-name'] = encodeURIComponent(name);
        if (email) headers['x-user-email'] = encodeURIComponent(email);
      }
    }
  } catch (err) {
    console.warn('Could not fetch Clerk session token', err);
  }

  return headers;
}

/**
 * Adapter: Backend Equipment document -> Frontend Equipment
 */
function adaptEquipment(raw: any): Equipment {
  const id = raw._id || raw.id;
  const images = (raw.images && raw.images.length > 0 && raw.images[0]) 
    ? raw.images 
    : [getFallbackImage(raw.name, raw.category)];

  const conditionMap: Record<string, 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED'> = {
    new: 'EXCELLENT',
    good: 'GOOD',
    fair: 'FAIR',
    maintenance: 'DAMAGED',
  };

  const conditionStatus = conditionMap[raw.condition] || 'GOOD';
  const approvalStatus = (raw.approvalStatus || 'approved').toUpperCase();
  const rawAvail = raw.effectiveAvailability || raw.availability || raw.availabilityStatus || 'available';
  const availabilityStatus = rawAvail.toUpperCase();

  return {
    id,
    name: raw.name || 'Tezpur University Equipment',
    description: raw.description || 'Quality equipment available for verified borrowing at Tezpur University, Assam.',
    category: raw.category || 'General',
    location: raw.location || 'Tezpur University, Assam',
    ownerId: raw.addedBy?._id || raw.addedBy || 'steward',
    ownerName: raw.addedBy?.name || 'Campus Steward',
    ownerAvatar: raw.addedBy?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    images,
    currentCondition: conditionStatus as any,
    approvalStatus: approvalStatus as any,
    availabilityStatus: availabilityStatus as any,
    specs: raw.specs || (raw.tags ? { Tags: raw.tags.join(', ') } : undefined),
    createdAt: raw.createdAt || new Date().toISOString(),
    depositAmount: raw.depositAmount || 0,
    maxBorrowDays: raw.maxBorrowDays || 3,
    statusHistory: raw.statusHistory || [],
    dateAvailability: raw.dateAvailability || undefined,
    upcomingReservation: raw.upcomingReservation || undefined,
  };
}

/**
 * Adapter: Backend Booking document -> Frontend Booking
 */
function adaptBooking(raw: any): Booking {
  const id = raw._id || raw.id;
  const eq = raw.equipment;
  const usr = raw.user;

  const equipmentName = (typeof eq === 'object' && eq?.name) 
    ? eq.name 
    : (raw.equipmentName || 'Equipment');
  const equipmentCategory = typeof eq === 'object' ? eq?.category : undefined;
  const equipmentImage = (typeof eq === 'object' && eq?.images?.[0]) 
    ? eq.images[0] 
    : (raw.equipmentImage || getFallbackImage(equipmentName, equipmentCategory));

  const pickupReport: ConditionReport | undefined = raw.pickupCondition?.photos?.length ? {
    id: `pc-${id}`,
    bookingId: id,
    type: 'PICKUP',
    condition: (raw.pickupCondition.condition || 'GOOD').toUpperCase() as any,
    photoUrl: raw.pickupCondition.photos[0],
    photos: raw.pickupCondition.photos,
    notes: raw.pickupCondition.notes,
    reportedAt: raw.pickupCondition.recordedAt || new Date().toISOString(),
    reportedBy: raw.pickupCondition.recordedBy || 'borrower',
    aiFlagged: raw.pickupCondition.aiFlagged,
    aiSimilarityScore: raw.pickupCondition.aiSimilarityScore,
    aiAnalysis: raw.pickupCondition.aiAnalysis,
  } : undefined;

  const returnReport: ConditionReport | undefined = raw.returnCondition?.photos?.length ? {
    id: `rc-${id}`,
    bookingId: id,
    type: 'RETURN',
    condition: (raw.returnCondition.condition || 'GOOD').toUpperCase() as any,
    photoUrl: raw.returnCondition.photos[0],
    photos: raw.returnCondition.photos,
    notes: raw.returnCondition.notes,
    reportedAt: raw.returnCondition.recordedAt || new Date().toISOString(),
    reportedBy: raw.returnCondition.recordedBy || 'borrower',
    aiDamageDetected: raw.returnCondition.aiFlagged,
    aiFlagged: raw.returnCondition.aiFlagged,
    aiConfidence: raw.returnCondition.aiSimilarityScore,
    aiSimilarityScore: raw.returnCondition.aiSimilarityScore,
    aiAnalysis: raw.returnCondition.aiAnalysis,
  } : undefined;

  const clientName = typeof window !== 'undefined' ? ((window as any).Clerk?.user?.fullName || (window as any).Clerk?.user?.firstName) : null;
  const borrowerId = typeof usr === 'object' ? usr?._id || usr?.id || usr?.clerkId : usr || 'me';
  const borrowerName = (typeof usr === 'object' && usr?.name && usr.name !== 'Student Borrower' && usr.name !== 'Campus Borrower') 
    ? usr.name 
    : (raw.borrowerName || clientName || 'Campus Borrower');
  const borrowerEmail = (typeof usr === 'object' && usr?.email) ? usr.email : (raw.borrowerEmail || '');

  return {
    id,
    equipmentId: typeof eq === 'object' ? eq?._id || eq?.id : eq,
    equipmentName,
    equipmentImage,
    borrowerId,
    borrowerName,
    borrowerEmail,
    startDateTime: raw.startDate || raw.startDateTime || new Date().toISOString(),
    endDateTime: raw.endDate || raw.endDateTime || new Date().toISOString(),
    location: raw.location || (typeof eq === 'object' ? eq?.location : undefined) || 'Tezpur University, Assam',
    purpose: raw.purpose || (raw.location && raw.location !== 'Tezpur University, Assam' ? raw.location : '') || 'Academic / Project Work',
    status: (raw.status || 'PENDING').toUpperCase() as any,
    pickupReport,
    returnReport,
    charges: raw.charges ? {
      overdueFee: raw.charges.overdueFee || 0,
      damageFee: raw.charges.damageFee || 0,
      status: raw.charges.status || 'none',
    } : undefined,
    rejectionReason: raw.rejectionReason || raw.cancelReason,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

function adaptActivityLog(a: any): ActivityLog {
  const eq = typeof a.equipment === 'object' && a.equipment ? a.equipment : null;
  const bk = typeof a.booking === 'object' && a.booking ? a.booking : null;
  const usr = typeof a.user === 'object' && a.user ? a.user : null;

  const entityName = eq?.name || bk?.equipment?.name || a.message || 'Equipment Item';
  const equipmentImage = eq?.images?.[0] || bk?.equipment?.images?.[0] || undefined;
  const equipmentCategory = eq?.category || bk?.equipment?.category || undefined;
  const userName = usr?.name && usr.name !== 'Student Borrower' ? usr.name : (bk?.borrowerName || 'Campus Borrower');

  let conditionReport: ActivityLog['conditionReport'] = undefined;

  if (a.conditionReport && a.type !== 'condition_flagged' && (a.conditionReport.photos?.length > 0 || a.conditionReport.condition || a.conditionReport.notes)) {
    const rawCond = a.conditionReport;
    const gradeUpper = (rawCond.condition || 'GOOD').toUpperCase() as any;
    const typeUpper = (rawCond.type || (a.type?.includes('pickup') ? 'PICKUP' : 'RETURN')).toUpperCase() as any;

    conditionReport = {
      type: typeUpper,
      condition: ['EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED'].includes(gradeUpper) ? gradeUpper : 'GOOD',
      photos: Array.isArray(rawCond.photos) ? rawCond.photos : [],
      notes: rawCond.notes || undefined,
      aiFlagged: Boolean(rawCond.aiFlagged),
      aiSimilarityScore: typeof rawCond.aiSimilarityScore === 'number' ? rawCond.aiSimilarityScore : undefined,
      recordedAt: rawCond.recordedAt || a.createdAt,
      recordedBy: userName,
    };
  } else if (bk) {
    if (a.type === 'pickup_recorded' && bk.pickupCondition) {
      const pc = bk.pickupCondition;
      const grade = (pc.condition || 'GOOD').toUpperCase() as any;
      conditionReport = {
        type: 'PICKUP',
        condition: ['EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED'].includes(grade) ? grade : 'GOOD',
        photos: Array.isArray(pc.photos) ? pc.photos : [],
        notes: pc.notes || undefined,
        aiFlagged: Boolean(pc.aiFlagged),
        aiSimilarityScore: typeof pc.aiSimilarityScore === 'number' ? pc.aiSimilarityScore : undefined,
        aiAnalysis: pc.aiAnalysis || undefined,
        recordedAt: pc.recordedAt || a.createdAt,
        recordedBy: userName,
      };
    } else if (a.type === 'return_recorded' && bk.returnCondition) {
      const rc = bk.returnCondition;
      const grade = (rc.condition || (rc.aiFlagged ? 'DAMAGED' : 'GOOD')).toUpperCase() as any;
      conditionReport = {
        type: 'RETURN',
        condition: ['EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED'].includes(grade) ? grade : 'GOOD',
        photos: Array.isArray(rc.photos) ? rc.photos : [],
        notes: rc.notes || undefined,
        aiFlagged: Boolean(rc.aiFlagged),
        aiSimilarityScore: typeof rc.aiSimilarityScore === 'number' ? rc.aiSimilarityScore : undefined,
        aiAnalysis: rc.aiAnalysis || undefined,
        recordedAt: rc.recordedAt || a.createdAt,
        recordedBy: userName,
      };
    }
  }

  return {
    id: a._id || a.id,
    userId: usr?._id || usr?.clerkId || (typeof a.user === 'string' ? a.user : 'user'),
    userName,
    userAvatar: usr?.avatarUrl || undefined,
    action: (a.type || 'BOOKING_CREATED').toUpperCase(),
    entityType: a.type?.includes('condition') || conditionReport ? 'CONDITION_REPORT' : eq ? 'EQUIPMENT' : 'BOOKING',
    entityId: eq?._id || bk?._id || (typeof a.equipment === 'string' ? a.equipment : typeof a.booking === 'string' ? a.booking : a._id),
    entityName,
    equipmentImage,
    equipmentCategory,
    type: a.type,
    bookingId: bk?._id || (typeof a.booking === 'string' ? a.booking : undefined),
    message: a.message || undefined,
    createdAt: a.createdAt || new Date().toISOString(),
    conditionReport,
  };
}

export const apiClient = {
  // 1. User Profile
  async getProfile(): Promise<UserProfile> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/users/me`, { headers });
      if (res.ok) {
        const data = await res.json();
        return {
          clerkId: data.clerkId || 'user',
          name: data.name || 'Verified Student',
          email: data.email || 'student@tezu.ac.in',
          phone: data.phone,
          department: data.department || 'Tezpur University, Assam',
          studentId: data.studentId || '2026-STU-8821',
          avatarUrl: data.avatarUrl,
          borrowingCount: 0,
          lendingCount: 0,
        };
      }
    } catch (err) {
      console.warn('API getProfile fallback to local store:', err);
    }
    return CommuneStore.getUser();
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/users/me`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        return this.getProfile();
      }
    } catch (err) {
      console.warn('API updateProfile fallback:', err);
    }
    return CommuneStore.updateUser(updates);
  },

  // 2. Equipment Catalog + Date Availability Checking
  async getEquipment(filters?: { 
    category?: string; 
    location?: string; 
    status?: string; 
    search?: string;
    startDate?: string;
    endDate?: string;
    availableOnly?: boolean;
  }): Promise<Equipment[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.category && filters.category !== 'All') params.set('category', filters.category);
      if (filters?.search) params.set('q', filters.search);
      if (filters?.startDate) params.set('startDate', filters.startDate);
      if (filters?.endDate) params.set('endDate', filters.endDate);
      if (filters?.availableOnly) params.set('availableOnly', 'true');
      params.set('limit', '50');

      const res = await fetch(`${API_BASE}/equipment?${params.toString()}`);
      if (res.ok) {
        const rawItems = await res.json();
        if (Array.isArray(rawItems) && rawItems.length > 0) {
          return rawItems.map(adaptEquipment);
        }
      }
    } catch (err) {
      console.warn('API getEquipment fallback to local store:', err);
    }
    return CommuneStore.getAllEquipment(filters);
  },

  async getEquipmentById(id: string): Promise<Equipment | undefined> {
    try {
      const res = await fetch(`${API_BASE}/equipment/${id}`);
      if (res.ok) {
        const rawItem = await res.json();
        if (rawItem) return adaptEquipment(rawItem);
      }
    } catch (err) {
      console.warn(`API getEquipmentById(${id}) fallback:`, err);
    }
    return CommuneStore.getEquipmentById(id);
  },

  async createEquipment(data: {
    name: string;
    description: string;
    category: string;
    location: string;
    images: string[];
    currentCondition: 'EXCELLENT' | 'GOOD' | 'FAIR';
    specs?: Record<string, string>;
    maxBorrowDays?: number;
  }): Promise<Equipment> {
    try {
      const headers = await getAuthHeaders();
      const payload = {
        name: data.name,
        description: data.description,
        category: data.category,
        location: data.location,
        images: data.images,
        quantity: 1,
        condition: {
          status: data.currentCondition.toLowerCase(),
        },
      };

      const res = await fetch(`${API_BASE}/equipment`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const raw = await res.json();
        return adaptEquipment(raw);
      }
    } catch (err) {
      console.warn('API createEquipment fallback:', err);
    }
    return CommuneStore.createEquipment(data as any);
  },

  // 3. Bookings
  async getMyBookings(): Promise<Booking[]> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/bookings/me`, { headers });
      if (res.ok) {
        const rawBookings = await res.json();
        if (Array.isArray(rawBookings)) {
          return rawBookings.map(adaptBooking);
        }
      } else if (res.status === 401) {
        // If user is signed into Clerk on frontend, don't fall back to stranger's mock bookings
        if (typeof window !== 'undefined' && (window as any).Clerk?.user) {
          return [];
        }
      }
    } catch (err) {
      console.warn('API getMyBookings fallback:', err);
    }
    // Never show mock bookings if user is signed into Clerk
    if (typeof window !== 'undefined' && (window as any).Clerk?.user) {
      return [];
    }
    return CommuneStore.getUserBookings();
  },

  // Check all requests and schedules for a specific equipment
  async getEquipmentBookings(equipmentId: string): Promise<Booking[]> {
    try {
      const res = await fetch(`${API_BASE}/bookings/equipment/${equipmentId}`);
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          return raw.map(adaptBooking);
        }
      }
    } catch (err) {
      console.warn('API getEquipmentBookings fallback:', err);
    }
    return CommuneStore.getAllBookings().filter(b => b.equipmentId === equipmentId);
  },

  async createBooking(data: {
    equipmentId: string;
    startDateTime: string;
    endDateTime: string;
    location?: string;
    purpose: string;
    equipmentName?: string;
    equipmentImage?: string;
    borrowerName?: string;
    borrowerEmail?: string;
  }): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      if (data.borrowerName && !headers['x-user-name']) {
        headers['x-user-name'] = encodeURIComponent(data.borrowerName);
      }
      if (data.borrowerEmail && !headers['x-user-email']) {
        headers['x-user-email'] = encodeURIComponent(data.borrowerEmail);
      }
      const payload = {
        equipmentId: data.equipmentId,
        startDate: data.startDateTime,
        endDate: data.endDateTime,
        location: data.location || undefined,
        purpose: data.purpose,
        borrowerName: data.borrowerName,
        borrowerEmail: data.borrowerEmail,
      };

      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok) {
        const adapted = adaptBooking(json);
        if (adapted.equipmentName === 'Equipment' && data.equipmentName) {
          adapted.equipmentName = data.equipmentName;
        }
        if (data.borrowerName && (!adapted.borrowerName || adapted.borrowerName === 'Student Borrower' || adapted.borrowerName === 'Campus Borrower')) {
          adapted.borrowerName = data.borrowerName;
        }
        if (data.equipmentImage && (!adapted.equipmentImage || adapted.equipmentImage.includes('unsplash.com/photo-1581092160607'))) {
          adapted.equipmentImage = data.equipmentImage;
        }
        return { success: true, booking: adapted };
      } else {
        return { success: false, error: json.error || 'Failed to submit booking request.' };
      }
    } catch (err: any) {
      console.warn('API createBooking fallback:', err);
      return CommuneStore.createBooking(data);
    }
  },

  async cancelBooking(bookingId: string): Promise<boolean> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers,
      });
      if (res.ok) return true;
    } catch (err) {
      console.warn('API cancelBooking fallback:', err);
    }
    return CommuneStore.cancelBooking(bookingId);
  },

  // 4. Condition Reports
  async submitPickupCondition(
    bookingId: string,
    data: { condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED'; photoUrl: string; notes?: string }
  ): Promise<ConditionReport | null> {
    try {
      const headers = await getAuthHeaders();
      const payload = {
        photos: [data.photoUrl],
        notes: data.notes || '',
        condition: data.condition,
      };

      const res = await fetch(`${API_BASE}/bookings/${bookingId}/pickup-condition`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const raw = await res.json();
        const b = adaptBooking(raw);
        return b.pickupReport || null;
      }
    } catch (err) {
      console.warn('API submitPickupCondition fallback:', err);
    }
    return CommuneStore.submitConditionReport({ bookingId, type: 'PICKUP', ...data });
  },

  async submitReturnCondition(
    bookingId: string,
    data: { condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED'; photoUrl: string; notes?: string }
  ): Promise<ConditionReport | null> {
    try {
      const headers = await getAuthHeaders();
      const payload = {
        photos: [data.photoUrl],
        notes: data.notes || '',
        condition: data.condition,
      };

      const res = await fetch(`${API_BASE}/bookings/${bookingId}/return-condition`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const raw = await res.json();
        const b = adaptBooking(raw);
        return b.returnReport || null;
      }
    } catch (err) {
      console.warn('API submitReturnCondition fallback:', err);
    }
    return CommuneStore.submitConditionReport({ bookingId, type: 'RETURN', ...data });
  },

  // 5. Activity Stream & Condition History
  async getMyActivity(): Promise<ActivityLog[]> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/activity/me`, { headers });
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          return raw.map((a: any) => adaptActivityLog(a));
        }
      }
    } catch (err) {
      console.warn('API getMyActivity fallback:', err);
    }
    return CommuneStore.getUserActivity();
  },

  async getEquipmentActivity(equipmentId: string): Promise<ActivityLog[]> {
    try {
      const res = await fetch(`${API_BASE}/activity/equipment/${equipmentId}`);
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          return raw.map((a: any) => adaptActivityLog(a));
        }
      }
    } catch (err) {
      console.warn('API getEquipmentActivity fallback:', err);
    }
    return CommuneStore.getActivity().filter(a => a.entityId === equipmentId);
  },

  // 6. Cloudinary Upload & Optimization
  async uploadImage(
    fileOrUrl: File | string, 
    folder: 'submitted' | 'approved' | 'condition_reports' = 'submitted'
  ): Promise<string> {
    let res: Response;
    if (typeof fileOrUrl === 'string') {
      res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: fileOrUrl, folder }),
      });
    } else {
      const formData = new FormData();
      formData.append('image', fileOrUrl);
      formData.append('folder', folder);

      res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Failed to upload image to Cloudinary');
    }

    const data = await res.json();
    return data.url;
  },

  // Cloudinary dynamic CDN transformation helper (auto-format WebP/AVIF, auto-quality, responsive scaling)
  getOptimizedImageUrl(
    url: string, 
    options: { width?: number; height?: number; crop?: 'fill' | 'fit' | 'thumb' | 'scale'; quality?: number } = {}
  ): string {
    if (!url || !url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) {
      return url;
    }
    const transforms: string[] = ['f_auto', 'q_auto'];
    if (options.width) transforms.push(`w_${options.width}`);
    if (options.height) transforms.push(`h_${options.height}`);
    if (options.crop) transforms.push(`c_${options.crop}`);
    if (options.quality) transforms.push(`q_${options.quality}`);

    const transformStr = transforms.join(',');
    return url.replace('/image/upload/', `/image/upload/${transformStr}/`);
  },

  // 7. WEB-C08: Equipment Status Change with History Tracking
  async updateEquipmentStatus(id: string, status: string, reason: string): Promise<Equipment> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/equipment/${id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status, reason }),
      });

      if (res.ok) {
        const raw = await res.json();
        return adaptEquipment(raw);
      }
    } catch (err) {
      console.warn('API updateEquipmentStatus fallback to store:', err);
    }

    // Fallback to local store
    const local = CommuneStore.updateEquipmentStatus(id, status, reason);
    if (local) return local;
    throw new Error('Failed to update equipment status');
  },
};

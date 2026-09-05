export type EquipmentCategory = 
  | 'Cameras & Video'
  | 'Audio & Sound'
  | 'Workshop & Tools'
  | 'Projectors & Displays'
  | 'Laptops & Computing'
  | 'Outdoors & Sports'
  | 'Music & Instruments';

export type AvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'BOOKED' | 'MAINTENANCE' | 'RETIRED';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type BookingStatus = 'PENDING' | 'APPROVED' | 'ACTIVE' | 'RETURNED' | 'CANCELLED' | 'REJECTED' | 'OVERDUE';

export type ConditionGrade = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED';

export interface ConditionReport {
  id: string;
  bookingId: string;
  type: 'PICKUP' | 'RETURN';
  condition: ConditionGrade;
  photoUrl: string;
  notes?: string;
  reportedAt: string;
  reportedBy: string;
  aiDamageDetected?: boolean;
  aiConfidence?: number;
}

export interface StatusChangeRecord {
  previousValue: string;
  newValue: string;
  reason: string;
  changedAt: string;
  changedBy?: string;
  changedByName?: string;
}

export interface DateAvailability {
  isAvailable: boolean;
  conflictReason?: string;
  conflictCount?: number;
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  category: EquipmentCategory;
  location: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  images: string[];
  currentCondition: ConditionGrade;
  approvalStatus: ApprovalStatus;
  availabilityStatus: AvailabilityStatus;
  specs?: Record<string, string>;
  createdAt: string;
  depositAmount?: number;
  maxBorrowDays?: number;
  statusHistory?: StatusChangeRecord[];
  dateAvailability?: DateAvailability;
}

export interface Booking {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentImage: string;
  borrowerId: string;
  borrowerName: string;
  borrowerEmail: string;
  startDateTime: string;
  endDateTime: string;
  purpose: string;
  status: BookingStatus;
  pickupReport?: ConditionReport;
  returnReport?: ConditionReport;
  rejectionReason?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: 
    | 'EQUIPMENT_CREATED'
    | 'EQUIPMENT_APPROVED'
    | 'EQUIPMENT_REJECTED'
    | 'BOOKING_CREATED'
    | 'BOOKING_APPROVED'
    | 'BOOKING_REJECTED'
    | 'BOOKING_CANCELLED'
    | 'PICKUP_REPORTED'
    | 'RETURN_REPORTED'
    | 'CONDITION_FLAGGED'
    | string;
  entityType: 'EQUIPMENT' | 'BOOKING' | 'CONDITION_REPORT';
  entityId: string;
  entityName: string;
  equipmentImage?: string;
  equipmentCategory?: string;
  message?: string;
  createdAt: string;
  conditionReport?: {
    type: 'PICKUP' | 'RETURN' | 'INSPECTION';
    condition: ConditionGrade;
    photos: string[];
    notes?: string;
    aiFlagged?: boolean;
    aiSimilarityScore?: number;
    recordedAt?: string;
    recordedBy?: string;
  };
}

export interface UserProfile {
  clerkId: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  studentId?: string;
  avatarUrl?: string;
  borrowingCount: number;
  lendingCount: number;
}

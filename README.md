# Paraquet — Campus Equipment Lending & Governance Platform

[![GitHub repository](https://img.shields.io/badge/GitHub-not--ayan%2Fparaquet-181717?logo=github)](https://github.com/not-ayan/paraquet)

**Repository**: [https://github.com/not-ayan/paraquet](https://github.com/not-ayan/paraquet)

A full-stack, enterprise-grade equipment sharing, reservation, and asset custody management system built for the **Tezpur University** student and academic community in Assam. The platform eliminates equipment hoarding, automates reservation workflows, enforces loan durations, and maintains ironclad accountability through multi-point condition reporting, **Gemini 1.5 Flash AI multimodal vision inspection**, and real-time administrative custody tracking.

---

## System Overview & Multi-App Architecture

The platform is designed as a decoupled, micro-service architecture consisting of three core application tiers:

```
┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
│  Student / Borrower Portal (:3000)   │       │     Admin Command Center (:3001)     │
│   Next.js 14 App Router, TypeScript  │       │   Next.js 14, Dark Frosted Glass UI  │
│   Browse, Reserve, Return, Calendar  │       │ Moderation, AI Arbitration, Logs, Users│
└──────────────────┬───────────────────┘       └──────────────────┬───────────────────┘
                   │                                              │
                   │ Bearer Token / x-clerk-auth-token            │ Bearer Token (Role: Admin)
                   ▼                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                       Express REST API Backend Service (:4000)                      │
│      Node.js, Express, Clerk Middleware, Compression, In-Memory Cache Engine        │
└──────────────┬──────────────────┬──────────────────┬───────────────────┬────────────┘
               │                  │                  │                   │
               ▼                  ▼                  ▼                   ▼
      ┌─────────────────┐ ┌───────────────┐ ┌─────────────────┐ ┌─────────────────────┐
      │  MongoDB Atlas  │ │ Cloudinary CDN│ │ Google Gemini AI│ │     Resend API      │
      │ Mongoose Models │ │ Image Uploads │ │ 1.5 Flash Vision│ │Transactional Emails │
      └─────────────────┘ └───────────────┘ └─────────────────┘ └─────────────────────┘
```

- **Student / Borrower Frontend (`frontend/` on `http://localhost:3000`)**: Next.js 14 client application with rich tactile styling, real-time availability calendar, date-range reservation builder, handover condition checklists, and user profile dashboard.
- **Admin Command Center (`admin/` on `http://localhost:3001`)**: Dedicated administrative operations dashboard with dark frosted-glass aesthetics, Bento metrics, pending reservation moderation, equipment lifecycle control, Gemini AI visual damage arbitration, student accounts directory, and live visual audit trail.
- **Backend REST API (`backend/` on `http://localhost:4000/api`)**: Node.js & Express REST API with MongoDB Atlas persistence, Clerk authentication sync, in-memory query caching, background overdue loan daemon, and automated Resend transactional email dispatcher.
- **Cloud Infrastructure**: MongoDB Atlas for persistent storage, Cloudinary for high-res equipment and condition photos, Google Gemini 1.5 Flash for multimodal visual inspection, and Resend for transactional email delivery.

---

## Expected 48-Hour MVP Scope

All 9 core requirements from the hackathon 48-Hour MVP specification plus Challenge Card **WEB-C08** were 100% delivered and verified.

| # | Core Requirement | Status | Implementation Details & Current State |
|:---:|---|:---:|---|
| 1 | **User accounts** | `Completed` | Clerk token-based authentication, student profile synchronization, student email attribution, and role-based permissions (`admin` / `user`). |
| 2 | **Equipment catalogue** | `Completed` | MongoDB-backed REST API, category filtering (Cameras, Tools, Audio, Outdoor, Lab), full-text search, rich equipment specs, and real-time inventory counts. |
| 3 | **Availability search** | `Completed` | Date-range selector bar with quick presets (Tomorrow, 3 Days, Weekend, Week), live booking collision checks, and "Hide Booked Gear" toggle. |
| 4 | **Booking request** | `Completed` | End-to-end reservation submission flow with date/time pickers, purpose statements, duration presets, and borrower attribution. |
| 5 | **Conflict detection** | `Completed` | Strict time-overlap validation (`startDate < existingEnd && endDate > existingStart`) evaluated across all active and pending bookings. |
| 6 | **Approval or rejection** | `Completed` | Administrative moderation workflow with instant status transitions, cancellation reason notes, and inventory count updates. |
| 7 | **Issue and return record** | `Completed` | Handover custody tracking with baseline pickup check-in, return check-in, and timestamped audit logs. |
| 8 | **Condition history** | `Completed` | Embedded condition reports with multi-photo evidence capture, condition grading (`Excellent`, `Good`, `Fair`, `Damaged`), and historical timeline. |
| 9 | **Overdue and maintenance status** | `Completed` | Real-time overdue state tracking, maximum borrow duration enforcement, and interactive maintenance toggling with reason logging. |

---

## Challenge Card: WEB-C08

### WEB-C08: Change History
- **Objective**: For one important status, store and display its previous value, new value, time, and reason.
- **Status**: `Completed`
- **Target Field**: Equipment Availability & Maintenance Status (`available` ↔ `maintenance` ↔ `retired`).
- **Implementation Details**:
  - **Database Persistence**: `Equipment.statusHistory` stores an embedded array of `{ previousValue, newValue, changedAt, reason, changedBy, changedByName }` records. Updates are exposed via `PATCH /api/equipment/:id/status`.
  - **Validation**: Enforces non-empty justification reasons on all status transitions.
  - **Activity Logging**: Emits an `equipment_status_changed` event into the live campus audit stream.
  - **Display Component**: Rendered as a dedicated "Status Change History" card on the Equipment Detail page with previous-to-new transition badges, timestamp, reason blockquote, and author attribution.
  - **Interactive Controls**: Includes an "Update Status" modal allowing stewards and evaluators to live-test status transitions on the fly.

---

## Above & Beyond the 48-Hour MVP (Extra Additions)

Everything listed below was engineered **above and beyond** the required 48-hour MVP scope to elevate Paraquet into a production-grade campus platform:

| Extra Module | Category | What Was Added |
|---|---|---|
| **Resend Transactional Email Engine** | Notifications | Branded HTML notification delivery for reservation requests, approvals, rejections, pickup receipts, return summaries, and overdue warnings. |
| **Gemini 1.5 Flash AI Multimodal Vision** | AI Inspection | Automatic visual inspection comparing baseline pickup photos against return photos, classifying cosmetic flaws vs actual structural damage with similarity scoring. |
| **Dedicated Admin Command Center** | Administration | Standalone Next.js application (`/admin` on port 3001) with dark frosted-glass UI, Bento analytics, live moderation queues, and incident arbitration. |
| **Automated Overdue Loan Daemon** | Background Service | Scheduled cron service continuously tracking active loans against due dates, calculating automated overdue fees (₹50/day), and alerting borrowers. |
| **Cloudinary Media Pipeline** | Cloud Storage & CDN | Direct and multi-image uploads with automatic format/quality optimization and automated lifecycle promotion (`submitted/` → `approved/`). |
| **Live Campus Custody Audit Stream** | Audit Trail & Compliance | Unified activity feed logging every equipment addition, booking transition, handover verification, and administrative override. |
| **In-Memory Caching & Query Optimization** | Performance & Scalability | In-memory cache layer with prefix invalidation, MongoDB connection pooling, and lean query projection for sub-50ms API responses. |
| **Local Currency Localization** | Localization | Full localization into Indian Rupees (`₹`) across loan penalties, damage assessments, and student receipts. |

---

## Admin Command Center (`http://localhost:3001`)

The Admin Command Center is a standalone Next.js 14 portal purpose-built for lab managers, department stewards, and university equipment administrators.

### Core Modules & Capabilities:

1. **Header & Navigation (`AdminNav.js`)**:
   - Frosted dark glass bar (`rgba(15, 23, 42, 0.94)`) with backdrop blur.
   - Live system pulse dot indicator and quick-jump button to the Student Portal (`http://localhost:3000`).
   - Active route detection and Clerk profile controls.

2. **Dashboard Command Center (`app/page.js`)**:
   - Real-time Bento layout displaying 4 mission-critical KPI metrics:
     - **Pending Bookings Queue Count**
     - **Flagged AI Condition Discrepancies**
     - **Active Borrowing Cycles**
     - **Equipment Awaiting Moderation**
   - Quick action shortcuts into each operational desk.

3. **Pending Reservations Desk (`app/bookings/pending/page.js`)**:
   - Tabular view of all incoming reservation requests with equipment thumbnails, borrower name/email, requested dates, and loan duration badges.
   - Instant one-click **"Approve"** (transitions booking to `approved` and sends confirmation email) or **"Reject"** (prompts for rejection reason and notifies the student).

4. **AI Discrepancy & Flagged Damage Arbitration Desk (`app/bookings/flagged/page.js`)**:
   - Renders incident cards for equipment returned with visual discrepancies detected by Gemini 1.5 Flash.
   - **Similarity Score Metric**: Displays match percentage (e.g. `78% Visual Match`).
   - **Side-by-Side Evidence Inspection**: Directly compares baseline **Pickup Photo** against **Return Check-in Photo**.
   - **AI Analysis Breakdown**: Structured display separating **Cosmetic Flaws** (scuffs, light scratches) from **Actual / Structural Damage** (dents, cracks, missing components).
   - **Arbitration Action Bar**:
     - *Clear Incident (No Fee)*: Resolves incident with 0 charges.
     - *Apply Damage Fee (₹) & Resolve*: Applies assessed repair charge, logs incident resolution, and emails receipt to borrower.

5. **Equipment Inventory & Loan Controls (`app/equipment/page.js`)**:
   - Search bar and category filtering.
   - **Inline Editable Max Borrow Duration**: Allows administrators to adjust loan duration limits (1 to 30 days) per equipment item with dedicated save actions.
   - **Availability Status Toggle**: Quick dropdown to transition gear between `Available`, `Maintenance`, and `Retired`.
   - **Deletion Flow**: Permanent deletion action with confirmation dialog.

6. **Equipment Submission Moderation (`app/equipment/pending/page.js`)**:
   - Review queue for faculty and student-submitted equipment listings.
   - Approving an item promotes its images in Cloudinary from `submitted/` to `approved/` and publishes it to the public catalogue.

7. **User Directory & Permission Management (`app/users/page.js`)**:
   - Searchable directory of all registered campus users by name or email.
   - Role management with instant role promotion/demotion (`admin` ↔ `user`).

8. **Visual Activity & Custody Audit Logs (`app/logs/page.js`)**:
   - Chronological audit stream recording every action in the university ecosystem.
   - Displays event badges, author attribution, formatted timestamps, and embedded handover photos.

---

## Database Schema Documentation (Mongoose Models)

### 1. User Collection (`backend/models/User.js`)
Stores synchronized user profiles authenticated via Clerk.

```javascript
{
  clerkId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true },
  name: { type: String },
  avatarUrl: { type: String },
  phone: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
  createdAt: { type: Date },
  updatedAt: { type: Date }
}
```

### 2. Equipment Collection (`backend/models/Equipment.js`)
Stores equipment items, specifications, ownership, and maintenance audit records.

```javascript
{
  name: { type: String, required: true, trim: true },
  description: { type: String },
  category: { type: String, index: true },
  tags: [{ type: String, index: true }],
  images: [{ type: String }],
  quantity: { type: Number, default: 1, min: 0 },
  location: { type: String },
  condition: {
    status: { type: String, enum: ['good', 'fair', 'poor', 'under_repair'], default: 'good' },
    notes: { type: String }
  },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  rejectionReason: { type: String },
  availability: { type: String, enum: ['available', 'booked', 'maintenance', 'retired'], default: 'available', index: true },
  addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  maxBorrowDays: { type: Number, default: 3, min: 1, max: 30 },
  
  // WEB-C08: Change History Array
  statusHistory: [
    {
      previousValue: { type: String, required: true },
      newValue: { type: String, required: true },
      reason: { type: String, required: true },
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      changedByName: { type: String, default: 'Community Steward' }
    }
  ],
  createdAt: { type: Date },
  updatedAt: { type: Date }
}
```
*Index*: Compound index on `{ approvalStatus: 1, availability: 1, category: 1 }`.

### 3. Booking Collection (`backend/models/Booking.js`)
Tracks the end-to-end reservation lifecycle, custody handovers, condition inspections, and penalty fees.

```javascript
{
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  equipment: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true, index: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  location: { type: String },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'returned', 'overdue', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Embedded Handover Inspection Schemas (1:1 with Booking)
  pickupCondition: {
    photos: [{ type: String }],
    notes: { type: String },
    condition: { type: String, enum: ['excellent', 'good', 'fair', 'poor', 'damaged', 'under_repair'] },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    recordedAt: { type: Date, default: Date.now }
  },
  returnCondition: {
    photos: [{ type: String }],
    notes: { type: String },
    condition: { type: String, enum: ['excellent', 'good', 'fair', 'poor', 'damaged', 'under_repair'] },
    aiSimilarityScore: { type: Number, min: 0, max: 1 },
    aiFlagged: { type: Boolean, default: false },
    aiAnalysis: {
      detailedSummary: { type: String },
      conditionRating: { type: String },
      cosmeticFlaws: [{ type: String }],
      actualDamage: [{ type: String }],
      damageType: { type: String, enum: ['none', 'cosmetic', 'structural', 'both'], default: 'none' },
      damageDetected: { type: Boolean, default: false },
      detailedDiscrepancyReport: { type: String },
      recommendedAction: { type: String }
    },
    adminReviewed: { type: Boolean, default: false },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    recordedAt: { type: Date, default: Date.now }
  },
  
  charges: {
    overdueFee: { type: Number, default: 0 },
    damageFee: { type: Number, default: 0 },
    status: { type: String, enum: ['none', 'pending', 'paid', 'waived'], default: 'none' }
  },
  createdAt: { type: Date },
  updatedAt: { type: Date }
}
```
*Index*: Compound index on `{ equipment: 1, status: 1, startDate: 1, endDate: 1 }` for sub-millisecond conflict validation.

### 4. ActivityLog Collection (`backend/models/ActivityLog.js`)
Immutable campus audit log backing activity streams and administrative compliance.

```javascript
{
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: [
      'booking_created', 'booking_approved', 'booking_rejected', 'booking_cancelled', 'booking_overdue',
      'pickup_recorded', 'return_recorded', 'condition_flagged',
      'equipment_added', 'equipment_approved', 'equipment_rejected', 'equipment_status_changed'
    ],
    required: true
  },
  booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
  equipment: { type: Schema.Types.ObjectId, ref: 'Equipment', index: true },
  message: { type: String },
  conditionReport: {
    type: { type: String, enum: ['pickup', 'return', 'inspection'] },
    condition: { type: String },
    photos: [{ type: String }],
    notes: { type: String },
    aiSimilarityScore: { type: Number },
    aiFlagged: { type: Boolean, default: false },
    aiAnalysis: { /* Mirror of Booking.returnCondition.aiAnalysis */ },
    recordedAt: { type: Date, default: Date.now }
  },
  createdAt: { type: Date },
  updatedAt: { type: Date }
}
```

---

## API Architecture & Endpoint Schema

All endpoints are hosted on `http://localhost:4000/api` with full CORS origin reflection and credential support.

### 1. Equipment Endpoints (`/api/equipment`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/equipment` | Public | Browse catalogue with filters (`category`, `search`, `status`, `startDate`, `endDate`, `hideBooked`). Returns overlapping conflict annotations. |
| `GET` | `/api/equipment/:id` | Public | Get specific equipment details with populated steward and status change history. |
| `POST` | `/api/equipment` | User | Submit new equipment listing for administrative review. |
| `PATCH` | `/api/equipment/:id` | User | Update owned equipment metadata. |
| `PATCH` | `/api/equipment/:id/status` | User | **WEB-C08**: Transition availability status (`available` ↔ `maintenance` ↔ `retired`). Requires `{ status, reason }`. |
| `DELETE` | `/api/equipment/:id` | User / Admin | Delete owned equipment. |

### 2. Booking Endpoints (`/api/bookings`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/bookings/me` | User | Get current user's bookings with populated equipment and custody details. |
| `GET` | `/api/bookings/equipment/:id` | Public | Get all active and pending bookings for a piece of gear. |
| `GET` | `/api/bookings/:id` | User | Get single booking details (restricted to borrower or admin). |
| `POST` | `/api/bookings` | User | Create a new reservation request with conflict validation, duration check, and confirmation email. |
| `PATCH` | `/api/bookings/:id/cancel` | User | Cancel a pending or approved reservation. |
| `POST` | `/api/bookings/:id/pickup-condition` | User | Record pickup baseline photos and notes; transitions booking to `active`. |
| `POST` | `/api/bookings/:id/return-condition` | User | Record return photos; triggers **Gemini 1.5 Flash** vision inspection; transitions booking to `returned`. |

### 3. Admin Endpoints (`/api/admin`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/equipment/pending` | Admin | Review pending equipment submissions queue. |
| `PATCH` | `/api/admin/equipment/:id/approve` | Admin | Approve equipment listing (promotes Cloudinary photos to `approved/`). |
| `PATCH` | `/api/admin/equipment/:id/reject` | Admin | Reject equipment listing with justification reason. |
| `PATCH` | `/api/admin/equipment/:id/max-borrow-days` | Admin | Update maximum loan duration limit (1–30 days). |
| `PATCH` | `/api/admin/equipment/:id/availability` | Admin | Update equipment availability status. |
| `DELETE` | `/api/admin/equipment/:id` | Admin | Force delete equipment listing. |
| `GET` | `/api/admin/bookings/pending` | Admin | Review pending reservation requests queue. |
| `PATCH` | `/api/admin/bookings/:id/approve` | Admin | Approve reservation request and dispatch confirmation email. |
| `PATCH` | `/api/admin/bookings/:id/reject` | Admin | Reject reservation request with justification reason and dispatch email. |
| `GET` | `/api/admin/bookings/flagged` | Admin | View AI-flagged return condition discrepancies. |
| `PATCH` | `/api/admin/bookings/:id/resolve-condition` | Admin | Resolve flagged incident with assessed damage fee or zero-fee waiver. |
| `GET` | `/api/admin/users` | Admin | Search and inspect registered campus users. |
| `PATCH` | `/api/admin/users/:id/role` | Admin | Promote or demote user account role (`admin` ↔ `user`). |
| `GET` | `/api/admin/activity` | Admin | Retrieve comprehensive activity and condition audit log stream. |

### 4. User, Activity & Upload Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | User | Fetch authenticated user profile and borrowing statistics. |
| `PATCH` | `/api/users/me` | User | Update name, avatarUrl, or phone number. |
| `GET` | `/api/activity/me` | User | Retrieve personal activity history feed. |
| `GET` | `/api/activity/equipment/:id` | Public | Retrieve gear condition timeline and custody audit trail. |
| `GET` | `/api/upload/ping` | Public | Check Cloudinary API connectivity and quota health. |
| `POST` | `/api/upload` | User | Upload single photo (binary form-data or URL) to Cloudinary. |
| `POST` | `/api/upload/multiple` | User | Batch upload up to 5 photos to Cloudinary. |

---

## Gemini 1.5 Flash AI Multimodal Vision Pipeline

When equipment is returned, `backend/services/aiCondition.js` executes an automated multimodal comparison between the baseline pickup photos and return check-in photos using Google's **Gemini 1.5 Flash** model.

```
[Pickup Baseline Photo]  ──┐
                           ├─► [Gemini 1.5 Flash Vision Model] ──► Structured JSON Discrepancy Report
[Return Check-in Photo]  ──┘
```

### Key Capabilities:
1. **Cosmetic Flaws vs Structural Damage Classification**:
   Distinguishes normal wear-and-tear (surface dust, minor smudges, superficial micro-scratches) from actual damage (deep cracks, dented chassis, shattered lenses, missing knobs).
2. **Visual Similarity Match Scoring**:
   Calculates a normalized similarity score (`0.00` to `1.00`). If similarity drops below `0.85` or structural damage is detected, `aiFlagged` is set to `true`.
3. **Structured JSON Output Schema**:
   Returns parsed JSON containing `damageDetected`, `damageType`, `cosmeticFlaws`, `actualDamage`, `similarityScore`, `detailedDiscrepancyReport`, and `recommendedAction`.
4. **Resilient Vision Fallback**:
   If Gemini API rate limits or network issues occur, an automated visual analysis fallback inspects image metadata and self-heals, preventing unhandled check-in rejections.

---

## Resend Transactional Email Delivery System

Transactional emails are rendered via a responsive, branded HTML layout engine ([`backend/services/email.js`](file:///d:/hackathon/backend/services/email.js)) and delivered via the Resend API:

- **Booking Requested**: Sent to borrower confirming request receipt and pending status.
- **Booking Approved**: Informs student that reservation is approved with pickup date, time, and campus location.
- **Booking Rejected**: Transparently notifies student with the administrator's rejection reason and suggestions.
- **Pickup Handover Receipt**: Confirms baseline custody transfer and reiterates return deadline.
- **Return Inspection Summary**: Sends final return confirmation with Gemini AI similarity score and inspection summary.
- **Overdue Loan Warning**: Automated alert sent when a loan passes its return deadline, detailing daily penalty fees (₹50/day).
- **Incident Resolution**: Formal notification sent when an administrator resolves a flagged damage incident.

---

## Automated Overdue Loan Daemon

The backend features an automated background worker ([`backend/services/overdue.js`](file:///d:/hackathon/backend/services/overdue.js)) that tracks loan deadlines:
- **Recurring Execution**: Evaluates active bookings hourly.
- **Late Fee Calculation**: Automatically transitions status from `active` → `overdue` when `Date.now() > endDate` and calculates late penalties at **₹50 per day**.
- **Proactive Notification**: Emits an `booking_overdue` audit log and dispatches the urgent overdue warning email to the student borrower.

---

## Cloudinary CDN & Asset Promotion Lifecycle

Image uploads follow a two-tier folder lifecycle in Cloudinary:
1. **Initial Submission**: New equipment photos are uploaded into the `equipment/submitted/` sandbox folder.
2. **Administrative Approval**: Upon approval via `/api/admin/equipment/:id/approve`, assets are promoted to `equipment/approved/`.
3. **Responsive Delivery**: Served over Cloudinary's global CDN with automatic WebP/AVIF formatting and quality optimizations (`f_auto,q_auto`).

---

## Getting Started & Local Development

### Prerequisites
- Node.js (v18 or higher)
- npm / pnpm / yarn
- MongoDB Atlas cluster or local MongoDB instance
- Clerk account ([https://clerk.com](https://clerk.com))
- Cloudinary account ([https://cloudinary.com](https://cloudinary.com))
- Google AI Studio API Key ([https://aistudio.google.com](https://aistudio.google.com))
- Resend API Key ([https://resend.com](https://resend.com))

### Environment Configuration

#### 1. Backend Service (`backend/.env`):
```env
PORT=4000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/equipment-lending?retryWrites=true&w=majority
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=Tezpur University Equipment Desk <onboarding@resend.dev>
PORTAL_URL=http://localhost:3000
```

#### 2. Student Portal Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

#### 3. Admin Command Center (`admin/.env.local`):
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

### Installation & Launching Servers

Run each of the three applications in separate terminal windows:

#### 1. Start Backend API Service (Port 4000)
```powershell
cd backend
npm install
npm run dev
```

#### 2. Start Student / Borrower Portal (Port 3000)
```powershell
cd frontend
npm install
npm run dev
```

#### 3. Start Admin Command Center (Port 3001)
```powershell
cd admin
npm install
npm run dev
```

---

### Access URLs

| Application | URL | Target Audience |
|---|---|---|
| **Student / Borrower Portal** | [http://localhost:3000](http://localhost:3000) | Students, Faculty, General Borrowers |
| **Admin Command Center** | [http://localhost:3001](http://localhost:3001) | Lab Managers, Administrators, Stewards |
| **Backend REST API** | [http://localhost:4000/api](http://localhost:4000/api) | API Clients & Integrations |
| **Backend Health Check** | [http://localhost:4000/health](http://localhost:4000/health) | System Monitoring |
| **Cloudinary Asset Ping** | [http://localhost:4000/api/upload/ping](http://localhost:4000/api/upload/ping) | Media CDN Health Check |

---

## License

This project is licensed under the MIT License.

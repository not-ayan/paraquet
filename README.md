# Paraquet — Equipment Sharing Platform

[![GitHub repository](https://img.shields.io/badge/GitHub-not--ayan%2Fparaquet-181717?logo=github)](https://github.com/not-ayan/paraquet)

**Repository**: [https://github.com/not-ayan/paraquet](https://github.com/not-ayan/paraquet)

A centralized equipment sharing and booking management platform designed for student and campus communities. The system enables users to browse, list, and reserve equipment while maintaining accountability through condition tracking, custody audit logging, and administrative review.

---

## System Overview

The platform is architected as a decoupled web application:

- **Frontend**: Next.js / React client application (TypeScript, Tailwind CSS, Lucide icons)
- **Backend API**: Node.js & Express REST API (`http://localhost:4000/api`)
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: Clerk JWT-based authentication & profile sync
- **Storage & CDN**: Cloudinary with automatic image optimization and folder lifecycles (`submitted/` → `approved/`)

---

## 48-Hour MVP Status

| Module / Feature | Status | Implementation Details & Current State |
|---|---|---|
| **User Accounts** | `Completed` | Clerk authentication and user profile synchronization |
| **Equipment Catalogue** | `Completed` | Backend REST API with MongoDB data persistence and category filtering |
| **Availability Search** | `Completed` | Date-range selector bar with quick presets, live overlapping booking conflict evaluation, and "hide booked gear" toggle |
| **Booking Request** | `Completed` | End-to-end reservation request submission flow with borrower attribution |
| **Conflict Detection** | `Completed` | Verified using admin and user portal |
| **Approval / Rejection** | `Completed` | Backend endpoints ready and verified |
| **Issue & Return Records** | `Completed` | Custody transitions and activity audit logging active |
| **Condition History** | `In Validation` | Embedded condition reports with photo galleries and AI similarity flags |
| **Overdue Tracking** | `In Validation` | Implementation completed; pending test verification |
| **Maintenance Status** | `Completed` | Interactive maintenance toggling, reason tracking, and catalog status badges |
| **Cloudinary Media Pipeline** | `Completed` | Direct & URL uploads, CDN image optimization, and folder promotion |
| **Change History (WEB-C08)** | `Completed` | Full history tracking with previous value, new value, time, and required reason |

---

## Challenge Cards

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

## Key Features

### 1. User Authentication & Profiles
- Secure token-based authentication via Clerk.
- Synchronized profile management and real borrower names on reservations.

### 2. Equipment Catalogue & Date-Wise Availability Search
- Filter equipment by category, location, and real-time availability status.
- **Date-Wise Availability Filter**: Users can select borrow and return dates (with presets: Tomorrow, Next 3 Days, Weekend, Next Week) to discover gear free for specific timeframes.
- **Overlapping Conflict Cross-referencing**: Evaluates pending, approved, and active bookings against requested date ranges to annotate items (`✓ Free on Dates` vs `⏳ Booked on Dates`).
- **Hide Booked Gear Mode**: Instant one-click toggle to filter catalog results to exclusively show available equipment for selected dates.
- User-submitted equipment listings with automated owner association and admin moderation workflows.
- High-resolution Cloudinary photo uploads with responsive CDN delivery.

### 3. Booking Management & Interactive Calendar
- Visual availability calendar indicating available, pending, booked, and overdue slots.
- Seamless date passing from catalogue search to equipment booking request forms.
- Automated conflict checking for equipment reservations.
- End-to-end booking lifecycle: Request (Pending), Admin Approval, Active, and Completion/Cancellation.

### 4. Condition Reports & AI Verification
- Mandatory condition reporting at equipment pickup and return with photo attachments.
- Rich condition grades (`excellent`, `good`, `fair`, `poor`, `damaged`).
- Photo gallery lightbox for visual inspection history.
- AI visual similarity comparison flags.

### 5. Custody Audit Logging
- Real-time activity audit stream logging booking creations, custody handoffs, condition inspections, and administrative decisions.

### 6. Administration Dashboard
- Streamlined approval queue for pending equipment listings and booking reservations.
- Secured via authenticated administrative headers.

---

## Architecture Diagram

```
Frontend (React / Next.js on :3000)
        │
        │ Bearer <Clerk_Session_Token>
        ▼
Express REST API (Node.js on :4000)
        ├── User Routes           --> Clerk Authentication
        ├── Equipment Routes      --> Public Browse & Authenticated Submissions
        ├── Booking Routes        --> Reservation Requests & Conflict Checks
        ├── Activity Routes       --> Custody & Condition Audit Trail
        ├── Upload Routes         --> Cloudinary Asset Management
        └── Admin Routes          --> Clerk Authentication + Admin Key
        │
        ▼
   MongoDB Atlas
(Users, Equipment, Bookings, Condition Reports, Activity Logs)
```

---

## API Route Structure

| Resource | Method | Endpoint | Description |
|---|---|---|---|
| **Users** | `GET` | `/api/users/me` | Fetch authenticated user profile |
| | `PATCH` | `/api/users/me` | Update profile information |
| **Equipment** | `GET` | `/api/equipment` | Browse catalog (filter by category, location, status) |
| | `GET` | `/api/equipment/:id` | Get details for specific equipment |
| | `POST` | `/api/equipment` | Submit new equipment listing for review |
| | `PATCH` | `/api/equipment/:id` | Update owned equipment |
| | `DELETE` | `/api/equipment/:id` | Remove owned equipment |
| **Bookings** | `GET` | `/api/bookings/me` | View user bookings |
| | `GET` | `/api/bookings/:id` | Get specific booking details |
| | `GET` | `/api/bookings/equipment/:id` | Get all active and pending bookings for a piece of gear |
| | `POST` | `/api/bookings` | Create new reservation request |
| | `PATCH` | `/api/bookings/:id/cancel` | Cancel booking |
| **Condition** | `POST` | `/api/bookings/:id/pickup-condition` | Submit pickup condition inspection |
| | `POST` | `/api/bookings/:id/return-condition` | Submit return condition inspection |
| **Activity** | `GET` | `/api/activity/me` | Retrieve user activity history |
| | `GET` | `/api/activity/equipment/:id` | Retrieve gear condition history & custody audit trail |
| **Uploads** | `GET` | `/api/upload/ping` | Verify Cloudinary connectivity & API quota |
| | `POST` | `/api/upload` | Upload single image (binary or URL) to Cloudinary |
| | `POST` | `/api/upload/multiple` | Upload up to 5 images to Cloudinary |
| **Admin** | `GET` | `/api/admin/equipment/pending` | Review pending equipment submissions |
| | `PATCH` | `/api/admin/equipment/:id/approve` | Approve equipment listing (promotes images to `approved/`) |
| | `PATCH` | `/api/admin/equipment/:id/reject` | Reject equipment listing with reason |
| | `GET` | `/api/admin/bookings/pending` | Review pending booking requests |
| | `PATCH` | `/api/admin/bookings/:id/approve` | Approve booking |
| | `PATCH` | `/api/admin/bookings/:id/reject` | Reject booking |

---

## Project Structure

```
.
├── backend/        # Node.js & Express REST API (Runs on port 4000)
│   ├── lib/        # Database & helper utilities
│   ├── middleware/ # Clerk authentication middleware
│   ├── models/     # Mongoose database models (User, Equipment, Booking, ActivityLog)
│   ├── routes/     # Express route controllers
│   └── services/   # Cloudinary & AI logic services
├── frontend/       # Next.js 14 client application (Runs on port 3000)
│   └── src/
│       ├── app/    # Next.js App Router pages (browse, equipment, dashboard)
│       ├── components/ # Modular UI components (Calendar, Modals, Cards)
│       └── lib/    # Client API adapter, types, and mock stores
└── README.md       # Project documentation
```

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm / pnpm / yarn
- MongoDB Atlas cluster or local instance
- Clerk account and API keys
- Cloudinary account for media assets

### Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/not-ayan/paraquet.git
   cd paraquet
   ```

2. **Configure environment variables**:
   - For backend (`backend/.env`):
     ```env
     PORT=4000
     MONGODB_URI=your_mongodb_connection_string
     CLERK_SECRET_KEY=your_clerk_secret_key
     CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
     CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
     CLOUDINARY_API_KEY=your_cloudinary_api_key
     CLOUDINARY_API_SECRET=your_cloudinary_api_secret
     ```
   - For frontend (`frontend/.env.local`):
     ```env
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
     CLERK_SECRET_KEY=your_clerk_secret_key
     NEXT_PUBLIC_API_URL=http://localhost:4000/api
     ```

3. **Install dependencies and start development servers**:
   - **Backend**:
     ```bash
     cd backend
     npm install
     npm run dev
     ```
   - **Frontend**:
     ```bash
     cd frontend
     npm install
     npm run dev
     ```

4. **Access the application**:
   - Web application: `http://localhost:3000`
   - Backend API: `http://localhost:4000/api`
   - API health check: `http://localhost:4000/health`
   - Cloudinary upload ping: `http://localhost:4000/api/upload/ping`

---

## License

This project is licensed under the MIT License.

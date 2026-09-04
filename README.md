# Equipment Sharing Platform

A centralized equipment sharing and booking management platform designed for student and campus communities. The system enables users to browse, list, and reserve equipment while maintaining accountability through condition tracking and administrative review.

---

## System Overview

The platform is architected as a decoupled web application:

- **Frontend**: Next.js / React client application
- **Backend API**: Node.js & Express REST API
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Clerk JWT-based authentication
- **Storage**: Cloudinary (or compatible image storage for equipment and condition photos)

---

## Key Features

### 1. User Authentication & Profiles
- Secure token-based authentication via Clerk.
- Synchronized profile management and personal borrowing histories.

### 2. Equipment Catalogue
- Filter equipment by category, location, and availability status.
- User-submitted equipment listings with automated owner association and admin moderation workflows.

### 3. Booking Management
- Automated conflict checking for equipment reservations.
- End-to-end booking lifecycle: Request (Pending), Admin Approval, Active, and Completion/Cancellation.

### 4. Condition Reports
- Mandatory condition reporting at equipment pickup and return with photo attachments.
- Baseline infrastructure ready for automated damage detection.

### 5. Activity Logging & Auditing
- Automated system event logging for booking creations, status transitions, and administrative actions.

### 6. Administration Dashboard
- Streamlined approval queue for pending equipment listings and booking reservations.
- Secured via authenticated administrative headers.

---

## Architecture Diagram

```
Frontend (React / Next.js)
        │
        │ Bearer <Clerk_Session_Token>
        ▼
Express REST API (/api)
        ├── User Routes       --> Clerk Authentication
        └── Admin Routes      --> Clerk Authentication + Admin Key
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
| | `POST` | `/api/bookings` | Create new reservation request |
| | `PATCH` | `/api/bookings/:id/cancel` | Cancel booking |
| **Condition** | `POST` | `/api/bookings/:id/pickup-condition` | Submit pickup condition inspection |
| | `POST` | `/api/bookings/:id/return-condition` | Submit return condition inspection |
| **Activity** | `GET` | `/api/activity/me` | Retrieve user activity history |
| **Admin** | `GET` | `/api/admin/equipment/pending` | Review pending equipment submissions |
| | `PATCH` | `/api/admin/equipment/:id/approve` | Approve equipment listing |
| | `PATCH` | `/api/admin/equipment/:id/reject` | Reject equipment listing |
| | `GET` | `/api/admin/bookings/pending` | Review pending booking requests |
| | `PATCH` | `/api/admin/bookings/:id/approve` | Approve booking |
| | `PATCH` | `/api/admin/bookings/:id/reject` | Reject booking |

---

## Project Structure

```
.
├── admin/          # Admin portal interface
├── backend_api/    # Node.js / Express REST API
├── frontend/       # User-facing client application (Current active focus)
└── README.md       # Project documentation
```

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm / pnpm / yarn
- MongoDB Atlas cluster or local instance
- Clerk account and API keys

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Configure environment variables for the components:
   - For backend (`backend_api/.env`):
     ```env
     PORT=5000
     MONGODB_URI=your_mongodb_connection_string
     CLERK_SECRET_KEY=your_clerk_secret_key
     ADMIN_SECRET=your_admin_secret_key
     ```
   - For frontend (`frontend/.env.local`):
     ```env
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
     CLERK_SECRET_KEY=your_clerk_secret_key
     NEXT_PUBLIC_API_URL=http://localhost:5000/api
     ```

3. Install dependencies and start development servers:
   - **Frontend**:
     ```bash
     cd frontend
     npm install
     npm run dev
     ```
   - **Backend**:
     ```bash
     cd backend_api
     npm install
     npm run dev
     ```

---

## License

This project is licensed under the MIT License.

# Leave Management System (LMS) v2.4.0

A comprehensive, enterprise-grade Leave Management System built with modern technologies for efficient leave tracking, approval workflows, employee management, and holiday calendar management.

## 🌟 Overview

LMS v2 is a full-stack web application that automates and streamlines the complete leave management process for organizations. It provides role-based access control, multi-level approval workflows, holiday-aware leave calculations, and comprehensive employee management capabilities.

**Current Version:** 2.4.0 (November 6, 2025)

## 🚀 Key Features

### 🎯 Core Leave Management
- **Leave Request System**
  - Create, edit, and cancel leave requests
  - Half-day leave support (first-half/second-half)
  - Draft functionality for incomplete requests
  - Real-time leave balance display
  - Holiday-aware working day calculations
  - Attachment support for leave documentation

- **Multiple Leave Types**
  - Casual Leave (CL)
  - Sick Leave (SL)
  - Privilege Leave (PL)
  - Maternity Leave (ML) - Female employees only
  - Paternity Leave (PTL) - Male employees only
  - Leave Without Pay (LWP)
  - Compensatory Off (COMP)
  - Paid Time Off (PTO)

- **Leave Balance Tracking**
  - Real-time balance calculations
  - Year-wise balance management
  - Automatic allocation system
  - Carry forward support
  - Leave encashment tracking
  - Accrual tracking (monthly/yearly)

### 📅 Holiday Calendar Management (NEW in v2.4.0)
- **Regional Holiday Support**
  - Separate holidays for India (IND) and United States (US)
  - Region-based automatic holiday exclusion from leave calculations
  - Year-wise holiday organization (current -1 to +1)

- **Admin Holiday Management**
  - Create, edit, and delete holidays
  - ToggleButton filters for Year and Location
  - Inline editing with white background fields
  - Custom color scheme matching existing UI

- **Holiday-Aware Calculations**
  - Automatic exclusion of weekends (Saturday & Sunday)
  - Automatic exclusion of regional holidays
  - Real-time working day calculation API
  - Integration with half-day leave calculations

### 🔐 Authentication & Security (Enhanced in v2.4.0)
- **JWT-Based Authentication**
  - Secure token-based authentication
  - Role-based access control (RBAC)
  - Session management with token expiration

- **First-Time Password Reset** (NEW in v2.4.0)
  - Mandatory password change for new users
  - Default password: `Password-123`
  - Dedicated change password page
  - No password complexity restrictions (business requirement)
  - Admin password reset triggers mandatory reset on next login

- **Security Features**
  - Password hashing with bcrypt (12 rounds)
  - Current password verification before change
  - Route protection with automatic redirection
  - Input sanitization (XSS prevention)
  - Rate limiting (DDoS protection)
  - Helmet security headers
  - CORS configuration

### 👥 Employee Management
- **Employee Master Data**
  - Import employees via Excel upload
  - Date of Joining and Exit Date tracking
  - Gender-based leave type filtering
  - Department and designation management
  - Employment type classification (FTE/FTDC/CONSULTANT)
  - Reporting manager hierarchy
  - Region assignment (IND/US)

- **LMS User Management**
  - Create LMS users from employee records
  - Bulk user creation with automatic leave balance initialization
  - Role assignment (ADMIN/HR/MANAGER/EMPLOYEE)
  - User activation/deactivation
  - Password reset by admin

### ✅ Approval System
- **Unified Approval Interface**
  - Same powerful interface for both Admin and Manager roles
  - Bulk approve/reject functionality
  - Advanced filtering (Region, Status, Search with debouncing)
  - Cancel approved leaves (before start date)
  - Custom color scheme (Teal for Approve, Pink for Reject)

- **Manager-Based Hierarchy**
  - Manager approval based on reporting structure
  - View team leave requests
  - Team leave calendar
  - Approval history tracking

### 📊 Dashboard & Analytics
- **Employee Dashboard**
  - Current year leave balance cards
  - Gender-based leave type filtering
  - Recent leave requests with quick actions
  - Quick apply leaves functionality
  - Leave balance display on type selection

- **Manager Dashboard**
  - Pending team approvals
  - Team leave statistics
  - Quick approve/reject actions
  - Team calendar view

- **Admin Dashboard**
  - Organization-wide leave statistics
  - Employee leave balances overview
  - All leave requests with advanced filters
  - Employee leave history viewer
  - Leave processing history

### 🎨 UI/UX Features
- **Modern Material Design**
  - Clean, professional interface with Material-UI
  - Consistent color scheme across all pages
  - ToggleButton filters for quick navigation
  - Center-aligned data columns for better readability
  - Reduced button heights for compact appearance

- **Responsive Layout**
  - Works on desktop, tablet, and mobile
  - Sidebar navigation with role-based menu items
  - Real-time notifications with React Hot Toast
  - Loading states and skeleton screens

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  React 18 + TypeScript + MUI + React Query + Vite          │
│                    (Port 5174)                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API (Axios)
                       │ JWT Authentication
┌──────────────────────┴──────────────────────────────────────┐
│                         Backend                             │
│     Express.js + TypeScript + Prisma ORM + JWT             │
│                    (Port 3001)                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ Prisma Client
                       │ SQL Queries
┌──────────────────────┴──────────────────────────────────────┐
│                      Database                               │
│              MySQL 8.0 (glf_lms_dev)                        │
│                   (Port 3306)                               │
└─────────────────────────────────────────────────────────────┘
```

### Application Layers

**1. Presentation Layer (Frontend)**
- React components with TypeScript
- Material-UI for consistent design
- React Query for data fetching and caching
- Context API for global state (Authentication)

**2. API Layer (Backend Routes)**
- RESTful API endpoints
- Express middleware for validation
- JWT authentication middleware
- Role-based authorization middleware

**3. Business Logic Layer (Services)**
- AuthService - Authentication and user management
- EmployeeService - Employee master data management
- LeaveService - Leave request and calculation logic
- HolidayService - Holiday management (NEW)
- ApprovalService - Approval workflow logic
- LeaveBalanceService - Balance calculations and tracking
- UserManagementService - LMS user CRUD operations

**4. Data Access Layer (Prisma ORM)**
- Type-safe database queries
- Automatic migration management
- Relationship handling
- Transaction support

**5. Database Layer (MySQL)**
- Relational database with 15+ tables
- Indexes for optimal query performance
- Unique constraints for data integrity
- Foreign keys for referential integrity

## 🛠️ Technology Stack

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | JavaScript runtime |
| Express.js | 4.x | Web framework |
| TypeScript | 5.x | Type-safe development |
| Prisma ORM | 5.x | Database ORM |
| MySQL | 8.0+ | Relational database |
| JWT | jsonwebtoken | Authentication |
| Bcrypt | bcryptjs | Password hashing |
| Express Validator | - | Input validation |
| Helmet | - | Security headers |
| CORS | - | Cross-origin requests |
| Nodemailer | - | Email service |
| Winston | - | Logging |

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI library |
| TypeScript | 5.x | Type-safe development |
| Vite | 5.x | Build tool & dev server |
| Material-UI | 5.x | Component library |
| React Router | 6.x | Client-side routing |
| TanStack Query | 5.x | Data fetching & caching |
| Axios | 1.x | HTTP client |
| Day.js | 1.x | Date manipulation |
| React Hot Toast | - | Notifications |

## 📋 Prerequisites

- **Node.js** 18 or higher (with npm)
- **MySQL** 8.0 or higher running at `127.0.0.1:3306`
- **Git** (optional, for version control)

## 🚀 Installation & Setup

### 1. Clone or Navigate to Project

```bash
cd C:\Users\jatink\My_AI_Projects\LMS_v2
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
# Edit .env file with your database credentials

# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Seed database with initial data
npx tsx src/scripts/seed.ts

# Start development server
npm run dev
```

Backend runs on: **http://localhost:3001**

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Configure environment variables
# Verify VITE_API_URL in .env points to backend

# Start development server
npm run dev
```

Frontend runs on: **http://localhost:5174**

### 4. Verify Installation

1. Open browser and navigate to `http://localhost:5174`
2. Login with default admin credentials:
   - **Email:** admin@golivefaster.com
   - **Password:** Admin@123
3. If first-time login, you'll be prompted to change password

## 📁 Project Structure

```
LMS_v2/
├── backend/                          # Backend API
│   ├── src/
│   │   ├── config/                  # Configuration files
│   │   │   └── database.ts          # Prisma client setup
│   │   ├── middleware/              # Express middleware
│   │   │   ├── auth.ts             # JWT authentication & authorization
│   │   │   ├── errorHandler.ts     # Error handling
│   │   │   ├── validation.ts       # Input validation
│   │   │   └── inputSanitization.ts
│   │   ├── routes/                  # API routes
│   │   │   ├── auth.ts             # Authentication endpoints
│   │   │   ├── leaves.ts           # Leave management endpoints
│   │   │   ├── holidays.ts         # Holiday management (NEW)
│   │   │   ├── employees.ts        # Employee management
│   │   │   ├── users.ts            # User management
│   │   │   ├── leaveBalances.ts    # Leave balance endpoints
│   │   │   └── admin.ts            # Admin-only endpoints
│   │   ├── services/                # Business logic
│   │   │   ├── authService.ts      # Authentication logic
│   │   │   ├── leaveService.ts     # Leave management logic
│   │   │   ├── holidayService.ts   # Holiday management (NEW)
│   │   │   ├── approvalService.ts  # Approval workflow
│   │   │   ├── employeeService.ts  # Employee management
│   │   │   ├── userManagementService.ts
│   │   │   ├── leaveBalanceService.ts
│   │   │   └── emailService.ts
│   │   ├── scripts/                 # Database scripts
│   │   │   ├── seed.ts             # Seed initial data
│   │   │   ├── setupAdmin.js       # Create admin user
│   │   │   └── createLeaveBalances.js
│   │   ├── types/                   # TypeScript types
│   │   └── index.ts                 # Application entry point
│   ├── prisma/
│   │   └── schema.prisma            # Database schema
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                          # Environment variables
│
├── frontend/                         # Frontend React App
│   ├── src/
│   │   ├── components/              # Reusable components
│   │   │   └── Layout.tsx          # Main layout with sidebar
│   │   ├── pages/                   # Page components
│   │   │   ├── LoginPage.tsx       # Login page
│   │   │   ├── ChangePasswordPage.tsx  # Password change (NEW)
│   │   │   ├── DashboardPage.tsx   # Dashboard
│   │   │   ├── LeavesPage.tsx      # My Leaves
│   │   │   ├── ApprovalsPage.tsx   # Approvals (Manager/Admin)
│   │   │   ├── ProfilePage.tsx     # User profile
│   │   │   ├── EmployeeDetailsPage.tsx  # Employee management
│   │   │   ├── HolidayCalendarPage.tsx  # Holiday calendar (NEW)
│   │   │   └── LeavePolicyPage.tsx # Leave policy
│   │   ├── contexts/                # React contexts
│   │   │   └── AuthContext.tsx     # Authentication context
│   │   ├── config/                  # Configuration
│   │   │   └── api.ts              # Axios configuration
│   │   ├── theme/                   # MUI theme
│   │   │   └── theme.ts
│   │   ├── App.tsx                  # Main app component
│   │   └── main.tsx                 # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── .env                          # Environment variables
│
├── Feature Development/              # Development notes
│   └── LastSession.txt
├── CLAUDE.md                         # Comprehensive documentation
└── README.md                         # This file
```

## 🌐 API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/login` | User login | No | - |
| POST | `/register` | Register new user | No | - |
| GET | `/me` | Get current user profile | Yes | All |
| PUT | `/change-password` | Change password | Yes | All |
| POST | `/forgot-password` | Request password reset | No | - |
| POST | `/reset-password` | Reset password with token | No | - |
| POST | `/verify-email` | Verify email address | Yes | All |

### Employees (`/api/v1/employees`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get all employees | Yes | ADMIN |
| GET | `/:id` | Get employee by ID | Yes | ADMIN |
| POST | `/` | Create employee | Yes | ADMIN |
| PUT | `/:id` | Update employee | Yes | ADMIN |
| DELETE | `/:id` | Delete employee | Yes | ADMIN |
| POST | `/import/excel` | Import from Excel | Yes | ADMIN |
| POST | `/create-lms-users` | Create LMS users | Yes | ADMIN |

### Users (`/api/v1/users`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/by-employee/:id` | Get user by employee ID | Yes | ADMIN |
| POST | `/:employeeId` | Create LMS user | Yes | ADMIN |
| PUT | `/:employeeId/role` | Update user role | Yes | ADMIN |
| PUT | `/:employeeId/status` | Toggle active status | Yes | ADMIN |
| POST | `/:employeeId/reset-password` | Reset password | Yes | ADMIN |
| DELETE | `/:employeeId` | Delete LMS user | Yes | ADMIN |

### Leaves (`/api/v1/leaves`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get user's leave requests | Yes | All |
| POST | `/` | Create leave request | Yes | All |
| GET | `/:id` | Get leave request details | Yes | All |
| PUT | `/:id` | Update leave request | Yes | All |
| POST | `/:id/cancel` | Cancel leave request | Yes | All |
| DELETE | `/:id` | Delete leave request | Yes | All |
| POST | `/:id/submit` | Submit draft | Yes | All |
| POST | `/calculate-days` | Calculate working days | Yes | All |
| GET | `/approvals/pending` | Get pending approvals | Yes | MGR+ |
| GET | `/approvals/history` | Get approval history | Yes | MGR+ |
| GET | `/team/all` | Get team requests | Yes | MGR+ |
| POST | `/:id/approve` | Approve request | Yes | MGR+ |
| POST | `/:id/reject` | Reject request | Yes | MGR+ |

### Holidays (`/api/v1/holidays`) - NEW

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get holidays (filtered) | Yes | All |
| POST | `/` | Create holiday | Yes | ADMIN |
| PUT | `/:id` | Update holiday | Yes | ADMIN |
| DELETE | `/:id` | Delete holiday | Yes | ADMIN |

### Leave Balances (`/api/v1/leave-balances`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get user's balances | Yes | All |
| GET | `/leave-types` | Get all leave types | Yes | All |
| POST | `/allocate` | Allocate balance | Yes | ADMIN |

### Admin (`/api/v1/admin`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/employees-with-balances` | Get employees with balances | Yes | ADMIN |
| GET | `/employee-leaves/:id` | Get employee history | Yes | ADMIN |
| GET | `/all-leaves` | Get all requests (filtered) | Yes | ADMIN |
| POST | `/process-leaves` | Bulk process allocations | Yes | ADMIN |
| GET | `/processing-history` | Get processing history | Yes | ADMIN |

**Note:** MGR+ means MANAGER, HR, or ADMIN roles

## 🗄️ Database Schema

### Core Models

#### User
Primary user model for LMS authentication and profile.

**Key Fields:**
- `employeeId` (PK) - Unique employee identifier
- `email` (unique) - User email address
- `password` - Hashed password (bcrypt)
- `role` - ADMIN | MANAGER | HR | EMPLOYEE
- `firstName`, `lastName` - User name
- `gender` - M | F (for leave type filtering)
- `region` - IND | US (for holiday filtering)
- `mustChangePassword` - Password reset flag (NEW)
- `designation`, `employmentType` - Employment details
- `isActive` - Account status
- `emailVerified` - Email verification status

**Relations:**
- `manager` - Self-referential (reporting structure)
- `leaveBalances` - One-to-many with LeaveBalance
- `leaveRequests` - One-to-many with LeaveRequest
- `approvals` - One-to-many with Approval (as approver)

#### Employee
Employee master data (separate from User for HR management).

**Key Fields:**
- `employeeId` (PK) - Employee ID
- `email` (unique) - Employee email
- `firstName`, `lastName` - Name
- `gender` - M | F
- `phoneNumber` - Contact number
- `dateOfJoining` - Date joined (required)
- `exitDate` - Date left (optional)
- `location`, `designation`, `department` - Job details
- `employmentType` - FTE | FTDC | CONSULTANT
- `region` - IND | US
- `lmsAccess` - EMP | MGR
- `lmsUserCreated` - Flag for LMS user existence
- `isActive` - Active status

#### Holiday (NEW in v2.4.0)
Organization-wide holiday calendar with regional support.

**Key Fields:**
- `id` (PK) - UUID
- `date` - Holiday date
- `name` - Holiday name
- `location` - IND | US
- `year` - Calendar year

**Unique Constraint:** `[date, location]`
**Index:** `[year, location]`

#### LeaveType
Defines types of leaves available.

**Key Fields:**
- `id` (PK) - UUID
- `leaveTypeCode` (unique) - Code (CL, SL, PL, ML, PTL, etc.)
- `name` - Display name
- `category` - CASUAL | SICK | PRIVILEGE | MATERNITY | PATERNITY | LWP | COMP_OFF | PTO
- `isPaid` - Paid leave flag
- `requiresApproval` - Approval required
- `allowHalfDay` - Half-day support
- `carryForwardAllowed` - Carry forward flag
- `accrualFrequency` - MONTHLY | YEARLY | NONE
- `annualAllocation` - Default annual days

#### LeaveBalance
Tracks leave balances per user, type, and year.

**Key Fields:**
- `id` (PK) - UUID
- `employeeId` - Reference to User
- `leaveTypeCode` - Reference to LeaveType
- `year` - Calendar year
- `allocated` - Total allocated days
- `used` - Days used
- `pending` - Days pending approval
- `available` - Days available (calculated)
- `carriedForward` - Days from previous year
- `expired` - Expired days
- `encashed` - Encashed days

**Unique Constraint:** `[employeeId, leaveTypeCode, year]`

#### LeaveRequest
Individual leave request records.

**Key Fields:**
- `id` (PK) - UUID
- `employeeId` - Requester
- `leaveTypeId` - Type of leave
- `startDate`, `endDate` - Leave dates
- `totalDays` - Calculated duration
- `reason` - Leave reason
- `status` - PENDING | APPROVED | REJECTED | CANCELLED
- `isHalfDay` - Half-day flag
- `startDayType`, `endDayType` - full | first-half | second-half
- `attachment` - Optional document URL

**Relations:**
- `approvals` - One-to-many with Approval
- `leaveType` - Many-to-one with LeaveType
- `user` - Many-to-one with User

#### Approval
Approval chain records for leave requests.

**Key Fields:**
- `id` (PK) - UUID
- `leaveRequestId` - Reference to LeaveRequest
- `approverEmployeeId` - Approver user ID
- `level` - Approval level (1, 2, 3...)
- `status` - PENDING | APPROVED | REJECTED
- `comments` - Approval/rejection comments
- `actionDate` - Date of action

### Entity Relationship Diagram

```
User (employeeId, email, password, role, region, mustChangePassword, ...)
  │
  ├─── 1:N ──> LeaveBalance (employeeId, leaveTypeCode, year, allocated, used, ...)
  │                 └─── N:1 ──> LeaveType (leaveTypeCode, name, category, ...)
  │
  ├─── 1:N ──> LeaveRequest (id, employeeId, leaveTypeId, startDate, endDate, ...)
  │                 ├─── N:1 ──> LeaveType
  │                 └─── 1:N ──> Approval (leaveRequestId, approverEmployeeId, status, ...)
  │
  └─── Self-referential (managerId) for reporting hierarchy

Employee (employeeId, email, firstName, lastName, region, dateOfJoining, exitDate, ...)

Holiday (id, date, name, location, year, ...)
  └─── Unique: [date, location]
  └─── Index: [year, location]

Department (id, name, code, ...)
```

## ⚙️ Configuration

### Backend Environment Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5174

# Database Configuration
DATABASE_URL="mysql://lms_admin:Password-1234@127.0.0.1:3306/glf_lms_dev"

# JWT Configuration
JWT_SECRET=lms-secret-key-2024-change-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5174

# Email Configuration (Optional)
EMAIL_PROVIDER=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@lms.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=info
```

### Frontend Environment Variables

```env
VITE_API_URL=http://localhost:3001/api/v1
```

## 👥 User Roles & Permissions

### ADMIN
- **Full System Access**
- Employee management (create, edit, delete, import)
- LMS user management
- Leave balance allocation
- Holiday calendar management
- View/approve/reject/cancel ANY leave request
- Bulk approve/reject with advanced filters
- Access to all reports and analytics
- System configuration

### MANAGER
- **Team Management**
- View team leave requests (direct reports only)
- Approve/reject team leave requests
- Bulk approve/reject team requests
- Cancel approved team leaves (before start date)
- View team leave balances
- Submit own leave requests
- View team calendar

### HR
- **HR Operations**
- View all leave requests
- Generate reports
- View employee balances
- Submit own leave requests

### EMPLOYEE
- **Self-Service**
- Submit leave requests
- View own leave balance
- View leave history
- Cancel own leave requests (PENDING/APPROVED, before start date)
- Update profile information

## 🔐 Default Credentials

After seeding the database, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@golivefaster.com | Admin@123 |

**Note:** On first login with default password (`Password-123`), users will be redirected to change password page.

## 💻 Development Commands

### Backend Commands

```bash
cd backend

# Development
npm run dev                    # Start dev server with hot reload
npm run build                  # Build for production
npm start                      # Start production server

# Database
npx prisma generate            # Generate Prisma client
npx prisma db push             # Push schema to database
npx prisma migrate dev         # Create migration
npx prisma studio              # Open Prisma Studio GUI

# Scripts
npx tsx src/scripts/seed.ts    # Seed database
npx tsx src/scripts/setupAdmin.js  # Create admin user
```

### Frontend Commands

```bash
cd frontend

# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run preview                # Preview production build

# Linting
npm run lint                   # Run ESLint
```

## 🧪 Testing

### Manual Testing Checklist

**Authentication:**
- ✅ User login with email and password
- ✅ First-time login password reset flow
- ✅ Password change functionality
- ✅ Admin password reset triggers mandatory reset
- ✅ User logout

**Employee Management:**
- ✅ Import employees via Excel
- ✅ Create individual employee
- ✅ Edit employee details (including dates)
- ✅ Delete employee
- ✅ View employee in modal
- ✅ Create LMS users from employees

**Holiday Management:**
- ✅ Create holiday for IND region
- ✅ Create holiday for US region
- ✅ Edit existing holiday
- ✅ Delete holiday
- ✅ Filter by year (Previous/Current/Next)
- ✅ Filter by location (All/IND/US)

**Leave Requests:**
- ✅ Submit full-day leave request
- ✅ Submit half-day leave request (first-half/second-half)
- ✅ View leave balance immediately on type selection
- ✅ Verify holiday exclusion in day calculation
- ✅ Cancel leave request (Employee)
- ✅ Approve leave request (Manager)
- ✅ Reject leave request (Manager)
- ✅ Bulk approve multiple requests (Admin)
- ✅ Cancel approved leave (Admin/Manager, before start date)

**Leave Balances:**
- ✅ View leave balances on dashboard
- ✅ Allocate leave balance (Admin)
- ✅ Verify balance updates after approval/rejection
- ✅ Verify balance restoration after cancellation

## 🐛 Troubleshooting

### Common Issues

#### Backend Won't Start
**Symptoms:** Server crashes or won't start
**Solutions:**
1. Verify MySQL is running
2. Check database credentials in `.env`
3. Run `npm install` in backend folder
4. Run `npx prisma generate`
5. Check if port 3001 is already in use

#### Frontend Won't Start
**Symptoms:** Vite server won't start or shows errors
**Solutions:**
1. Run `npm install` in frontend folder
2. Verify backend is running on port 3001
3. Check `VITE_API_URL` in frontend `.env`
4. Clear Vite cache: `rm -rf .vite node_modules/.vite`

#### Database Connection Failed
**Symptoms:** "Can't connect to MySQL server" error
**Solutions:**
1. Verify MySQL service is running
2. Check database name exists: `glf_lms_dev`
3. Verify credentials: `lms_admin` / `Password-1234`
4. Check firewall settings
5. Test connection with MySQL Workbench

#### Authentication Issues
**Symptoms:** Login fails or redirects to login repeatedly
**Solutions:**
1. Clear browser localStorage
2. Check JWT_SECRET in backend `.env`
3. Verify token isn't expired
4. Check CORS settings
5. Logout and login again

#### Holiday Exclusion Not Working
**Symptoms:** Leave days not excluding holidays
**Solutions:**
1. Verify user has `region` field populated (IND or US)
2. Check holiday exists for the region and date
3. Verify holiday year matches leave request year
4. Logout and login to refresh user data

#### Password Reset Not Triggered
**Symptoms:** Admin reset password but user not prompted
**Solutions:**
1. Verify `mustChangePassword` flag is set to true
2. User must logout completely
3. On next login, redirect should happen automatically

### Debug Mode

Enable debug logging in backend:

```env
# Add to backend/.env
DEBUG=prisma:*
LOG_LEVEL=debug
```

### Database Reset

If database gets corrupted:

```bash
cd backend
npx prisma migrate reset
npx tsx src/scripts/seed.ts
```

## 📚 Additional Resources

### Documentation Files
- **CLAUDE.md** - Comprehensive technical documentation with all implementation details
- **README.md** - This file (getting started guide)
- **prisma/schema.prisma** - Database schema documentation

### External Resources
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Material-UI Components](https://mui.com/material-ui/)
- [TanStack Query](https://tanstack.com/query/latest)

## 🚧 Known Limitations

1. **Email Service:** Nodemailer configuration needs Gmail app password setup
2. **Holiday Overlap:** System prevents duplicate holidays via unique constraint
3. **Partial Holiday Support:** No support for half-day holidays
4. **Historical Data:** Changing holidays doesn't affect approved leave requests
5. **File Upload:** Attachment upload configured but limited to 5MB
6. **Notifications:** Real-time notifications not implemented (uses toast only)

## 🎯 Future Enhancements

### Planned Features
- Real-time notifications with WebSocket
- Advanced reporting and analytics
- Calendar integration (Google/Outlook)
- Mobile app (React Native)
- Leave forecasting and analytics
- Delegation management during absence
- Half-day holiday support
- Multi-currency leave encashment
- Integration with HR systems
- Advanced audit logging
- Automated leave accruals
- Leave carry-forward automation

### Technical Improvements
- Unit tests (Jest) and E2E tests (Playwright)
- API documentation (Swagger/OpenAPI)
- Docker containerization
- CI/CD pipeline
- Redis caching for performance
- S3/cloud storage for attachments
- Enhanced logging and monitoring
- Database backups automation

## 🎉 Getting Started Checklist

- [x] Backend setup complete
- [x] Database schema created
- [x] Database seeded with sample data
- [x] Frontend setup complete
- [x] Authentication working
- [x] Leave management functional
- [x] Approval workflow working
- [x] Employee management working
- [x] Holiday calendar functional
- [x] Password reset implemented
- [ ] Email configuration (optional)
- [ ] Production deployment (future)

## 📄 License

This project is proprietary and confidential. All rights reserved.

## 👤 Support & Contact

For questions, issues, or support:
- **System Administrator:** admin@golivefaster.com
- **Technical Documentation:** See CLAUDE.md
- **Issue Tracking:** Check project documentation

## 📝 Changelog

### v2.4.0 (November 6, 2025) - LATEST
- NEW: Holiday Calendar management with regional support (IND/US)
- NEW: Holiday-aware leave calculations
- NEW: First-time password reset requirement
- NEW: Leave balance display in Apply Leaves dialog
- ENHANCEMENT: Half-day calculations with holiday integration
- FIX: Multiple bug fixes including authorization, region field, calculations

### v2.3.0 (November 5, 2025)
- NEW: Date of Joining and Exit Date fields
- NEW: Gender-based leave filtering (ML/PTL)
- ENHANCEMENT: Excel import with date fields

### v2.2.0 (November 4, 2025)
- NEW: Employee self-service leave cancellation
- ENHANCEMENT: UI improvements across all data grids

### v2.1.0 (November 3, 2025)
- NEW: Unified approval grid for Admin and Manager
- NEW: Bulk approve/reject functionality
- ENHANCEMENT: Advanced filtering with debounced search

---

**Version:** 2.4.0
**Last Updated:** November 6, 2025
**Status:** Production Ready

**Happy Leave Managing! 🎊**

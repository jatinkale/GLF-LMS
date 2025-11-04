# Leave Management System (LMS) v2.0

A comprehensive, full-stack Leave Management System built with modern technologies for efficient leave tracking, approval workflows, and employee management.

## 🚀 Features

### Core Features
- **User Authentication** - Secure JWT-based authentication with role-based access control
- **Leave Request Management** - Create, edit, and cancel leave requests with draft functionality
- **Multi-level Approval Workflow** - Hierarchical approval system for managers and HR
- **Leave Balance Tracking** - Real-time leave balance calculation and tracking
- **Leave Types** - Support for multiple leave types (CL, SL, PL, Maternity, Paternity, LWP, Comp Off)
- **Region-specific Policies** - Separate leave policies for India and USA
- **Email Notifications** - Automated email notifications for all leave actions
- **Leave Accrual** - Automatic monthly leave accrual with pro-rata calculations
- **Comp Off Management** - Request and track compensatory off days
- **Dashboard Analytics** - Overview of leave statistics and pending approvals
- **User Profile Management** - View and manage personal information
- **Audit Logging** - Complete activity tracking for compliance

### User Roles
- **Admin** - Full system access and configuration
- **HR** - Manage employees, policies, and view all leave requests
- **Manager** - Approve/reject team leave requests and view team calendars
- **Employee** - Apply for leaves, view balance, and track leave history

## 🛠️ Technology Stack

### Backend
- **Node.js** + **Express.js** - REST API server
- **TypeScript** - Type-safe development
- **Prisma ORM** - Database abstraction and migrations
- **MySQL 8.0** - Primary database
- **JWT** - Authentication and authorization
- **Nodemailer** - Email service
- **Winston** - Logging
- **Express Validator** - Request validation
- **Helmet** - Security headers
- **Rate Limiting** - DDoS protection

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **Material-UI (MUI)** - Component library
- **React Router** - Client-side routing
- **React Query (TanStack Query)** - Data fetching and caching
- **React Hook Form** - Form management
- **Axios** - HTTP client
- **Day.js** - Date manipulation
- **React Hot Toast** - Notifications

### Database Schema
- 20+ Prisma models including User, LeaveRequest, LeaveBalance, Approval, Department, LeavePolicy, etc.
- Comprehensive relationships and indexes for optimal performance
- Support for audit logs and notification tracking

## 📋 Prerequisites

- **Node.js** 18+ (with npm)
- **MySQL 8.0+** running locally at `127.0.0.1:3306`
- **Git** (optional)

## 🚀 Quick Start

### 1. Clone or Navigate to Project
```bash
cd C:\Users\jatink\My_AI_Projects\LMS_v2
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies (already done)
npm install

# Generate Prisma client (already done)
npx prisma generate

# Push schema to database (already done)
npx prisma db push

# Seed database with initial data (already done)
npm run db:seed

# Start development server
npm run dev
```

Backend will run on **http://localhost:3001**

### 3. Frontend Setup

```bash
# Navigate to frontend (from project root)
cd frontend

# Install dependencies (already done)
npm install

# Start development server
npm run dev
```

Frontend will run on **http://localhost:5174**

## 🔐 Login Credentials

Use these credentials to test the application:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@golivefaster.com | Admin@123 |

## 📁 Project Structure

```
LMS_v2/
├── backend/                    # Backend API (Express + Prisma)
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   │   └── database.ts    # Prisma client setup
│   │   ├── middleware/        # Express middleware
│   │   │   ├── auth.ts       # JWT authentication
│   │   │   ├── errorHandler.ts
│   │   │   ├── validation.ts
│   │   │   └── inputSanitization.ts
│   │   ├── routes/           # API routes
│   │   │   ├── auth.ts      # Authentication endpoints
│   │   │   └── leaves.ts    # Leave management endpoints
│   │   ├── services/         # Business logic
│   │   │   ├── authService.ts
│   │   │   ├── leaveService.ts
│   │   │   ├── approvalService.ts
│   │   │   └── emailService.ts
│   │   ├── utils/            # Utility functions
│   │   │   ├── logger.ts
│   │   │   └── dateHelper.ts
│   │   ├── scripts/          # Database scripts
│   │   │   └── seed.ts      # Seed initial data
│   │   ├── types/            # TypeScript types
│   │   └── index.ts          # Application entry point
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                   # Environment variables
│
├── frontend/                  # Frontend React App (Vite + MUI)
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   └── Layout.tsx   # Main layout with sidebar
│   │   ├── pages/            # Page components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── LeavesPage.tsx
│   │   │   ├── ApprovalsPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   ├── contexts/         # React contexts
│   │   │   └── AuthContext.tsx
│   │   ├── config/           # Configuration
│   │   │   └── api.ts       # Axios configuration
│   │   ├── theme/            # MUI theme
│   │   │   └── theme.ts
│   │   ├── App.tsx           # Main app component
│   │   └── main.tsx          # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── .env                   # Environment variables
│
└── README.md                  # This file
```

## 🌐 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user
- `PUT /api/v1/auth/change-password` - Change password
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token

### Leave Management
- `POST /api/v1/leaves` - Create leave request
- `GET /api/v1/leaves` - Get leave requests (filtered)
- `GET /api/v1/leaves/:id` - Get leave request by ID
- `PUT /api/v1/leaves/:id` - Update leave request (drafts only)
- `POST /api/v1/leaves/:id/submit` - Submit draft leave request
- `POST /api/v1/leaves/:id/cancel` - Cancel leave request
- `DELETE /api/v1/leaves/:id` - Delete leave request (drafts only)

### Approvals (Manager/HR/Admin only)
- `GET /api/v1/leaves/approvals/pending` - Get pending approvals
- `GET /api/v1/leaves/approvals/history` - Get approval history
- `POST /api/v1/leaves/:id/approve` - Approve leave request
- `POST /api/v1/leaves/:id/reject` - Reject leave request
- `GET /api/v1/leaves/team/all` - Get team leave requests

## 🗄️ Database Configuration

### MySQL Connection
- **Host**: 127.0.0.1:3306
- **Database**: glf_lms_dev
- **User**: lms_admin
- **Password**: Password-1234

### Database Schema Highlights
- **Users** with roles and departmental hierarchy
- **Leave Policies** for different regions (India/USA)
- **Leave Types** with accrual rules and constraints
- **Leave Balances** with automatic calculations
- **Leave Requests** with multi-level approval workflow
- **Approvals** with hierarchical levels
- **Comp Off** management
- **Notifications** and **Audit Logs**

## ⚙️ Configuration

### Backend Environment Variables (.env)
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5174
DATABASE_URL="mysql://lms_admin:Password-1234@127.0.0.1:3306/glf_lms_dev"
JWT_SECRET=lms-secret-key-2024-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5174

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@lms.com
```

### Frontend Environment Variables (.env)
```env
VITE_API_URL=http://localhost:3001/api/v1
```

## 🎨 UI Features

- **Modern Material Design** - Clean, professional UI with Material-UI
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **Sidebar Navigation** - Easy navigation with role-based menu items
- **Dashboard** - Overview of leave statistics and quick actions
- **Leave Application Form** - Intuitive form with date pickers
- **Approval Workflow** - Easy-to-use approval/rejection interface
- **Real-time Notifications** - Toast notifications for all actions
- **Loading States** - Smooth loading indicators for better UX

## 🔒 Security Features

- JWT token-based authentication
- Role-based access control (RBAC)
- Password hashing with bcryptjs
- Input sanitization to prevent XSS attacks
- Rate limiting to prevent DDoS
- Helmet security headers
- CORS configuration
- SQL injection prevention via Prisma

## 📝 Leave Types Configured

### India Leave Policy
- **Casual Leave (CL)** - 9 days/year, monthly accrual
- **Sick Leave (SL)** - 6 days/year, monthly accrual
- **Privilege Leave (PL)** - 15 days/year, monthly accrual, carry forward allowed
- **Maternity Leave (ML)** - 180 days
- **Paternity Leave (PAT)** - 15 days
- **Leave Without Pay (LWP)** - Unpaid leave
- **Comp Off** - Compensatory off (3-month expiry)

### USA Leave Policy
- **PTO (Paid Time Off)** - 15 days/year, yearly allocation

## 🚧 Future Enhancements (Not Implemented Yet)

- Holiday Calendars
- Advanced Reporting & Analytics
- Calendar Integration (Google/Outlook)
- Real-time Notifications (Socket.io)
- Comp Off advanced features
- Leave forecasting
- Mobile app
- Delegation management
- Leave encashment

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev        # Start development server
npm run build      # Build for production
npm run db:seed    # Seed database
npx prisma studio  # Open Prisma Studio (database GUI)
```

### Frontend Development
```bash
cd frontend
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

## 📖 Additional Commands

### Database Management
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push

# Create migration
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset
```

## 🐛 Troubleshooting

### Backend won't start
- Check if MySQL is running
- Verify database credentials in `.env`
- Run `npm install` in backend folder
- Run `npx prisma generate`

### Frontend won't start
- Run `npm install` in frontend folder
- Check if backend is running on port 3001
- Verify `VITE_API_URL` in frontend `.env`

### Database connection issues
- Verify MySQL server is running
- Check database name, username, and password
- Ensure `glf_lms_dev` database exists
- Check firewall settings

### Authentication issues
- Clear browser localStorage
- Check JWT_SECRET in backend `.env`
- Verify token expiration settings

## 📧 Email Configuration (Optional)

To enable email notifications, configure the email settings in backend `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=noreply@lms.com
```

**Note**: For Gmail, you need to create an App Password:
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password
4. Use that password in EMAIL_PASSWORD

## 📄 License

This project is for educational and demonstration purposes.

## 👤 Admin Contact

- **Name**: System Administrator
- **Email**: admin@golivefaster.com

## 🎉 Getting Started Checklist

- [x] Backend setup complete
- [x] Database schema created
- [x] Database seeded with sample data
- [x] Frontend setup complete
- [x] Authentication working
- [x] Leave management functional
- [x] Approval workflow working
- [ ] Email configuration (optional)
- [ ] Production deployment (future)

---

**Happy Leave Managing! 🎊**

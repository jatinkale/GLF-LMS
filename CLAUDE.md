# LMS v2 - Leave Management System

## Project Overview

LMS v2 is a comprehensive Leave Management System built with modern web technologies. The system manages employee leave requests, approvals, balances, and administrative functions for organizations.

### Tech Stack

**Backend:**
- Node.js with TypeScript
- Express.js for REST API
- Prisma ORM for database management
- MySQL database
- JWT for authentication
- bcrypt for password hashing

**Frontend:**
- React with TypeScript
- Material-UI (MUI) for UI components
- React Query (TanStack Query) for data fetching
- React Router for navigation
- Axios for API calls
- Vite for build tooling

---

## Recent Major Changes

### Approval System Enhancements (Latest Update)

**Date:** November 3, 2025

#### Summary
Major enhancements to the approval system for both Admins and Managers, including unified UI, bulk actions, custom color scheme, and improved permissions.

**Key Changes:**

1. **Admin Approval Enhancements:**
   - Admins can now cancel approved leaves (where start date hasn't elapsed)
   - Fixed critical bug in balance restoration when cancelling leaves
   - Bulk approve/reject functionality with always-visible action buttons
   - Enhanced filters: Region, Status, and Search (with debouncing)
   - Custom color scheme matching status indicators

2. **Manager Approval Grid:**
   - Managers now have the same powerful approval interface as Admins
   - Filters: Status (All/Pending/Approved) and Search
   - Bulk approve/reject actions
   - Employee ID and Status columns added
   - Cancel functionality for approved leaves
   - Client-side search with debouncing
   - Shows only team members' leaves (where manager is reporting manager)

3. **UI/UX Improvements:**
   - Unified approval grid for both Admin and Manager roles
   - Debounced search to prevent page refreshes
   - Consistent color scheme across all approval actions
   - Bulk action buttons always visible (disabled when no rows selected)
   - Status chips with custom colors

4. **Color Scheme:**
   - **Approve buttons**: Teal (#11998e) - matches "Approved" status
   - **Reject buttons**: Pink (#f857a6) - matches "Rejected" status
   - **Pending status**: Orange (#ed6c02)
   - **Cancel button**: Dark orange (#d84315)
   - All buttons use solid colors (no gradients)

#### Backend Changes

**Updated Services:**
- `leaveService.ts`:
  - Added Admin role check for leave cancellation
  - **Critical Fix**: Balance restoration now uses `leaveRequest.employeeId` (the leave owner) instead of the canceller's employeeId
  - Proper balance updates for both PENDING and APPROVED status cancellations

**Verified Services:**
- `approvalService.ts`: Rejection balance restoration already correctly implemented

#### Frontend Changes

**Updated Pages:**
- `ApprovalsPage.tsx`:
  - Complete redesign for unified Admin/Manager experience
  - Added debounced search (500ms delay)
  - Separated `searchInput` (immediate) from `debouncedSearch` (API call trigger)
  - Client-side filtering for managers with debouncing
  - Server-side filtering for admins with debouncing
  - Bulk selection with checkbox column
  - Always-visible bulk action buttons
  - Cancel functionality for approved leaves
  - Custom status chip colors
  - Fixed all button colors to match status indicators

**Theme Updates:**
- Custom color palette for approval actions
- No gradient backgrounds on any buttons
- Consistent color mapping between status and actions

#### Bug Fixes Applied

1. **Balance Restoration Bug (CRITICAL):**
   - **Issue**: When Admin cancelled a leave, the system used Admin's employeeId for balance restoration
   - **Fix**: Now correctly uses `leaveRequest.employeeId` for all balance operations
   - **Impact**: Prevents incorrect balance updates and data corruption

2. **Search Box Issues:**
   - **Admin Issue**: Page refreshing on every keystroke
   - **Manager Issue**: Could only type one letter
   - **Fix**: Implemented debounced search with 500ms delay
   - **Impact**: Smooth typing experience without unnecessary API calls

3. **UI Consistency:**
   - Removed all gradient backgrounds from buttons
   - Applied consistent color scheme across all approval actions
   - Fixed button state colors (normal, hover, disabled)

#### API Endpoints Updated

**Admin Endpoints:**
- `GET /api/v1/admin/all-leaves` - Now supports region, status, and search filters

**Manager Endpoints:**
- `GET /api/v1/leaves/team/all` - Returns all team leave requests with status filter
- Uses existing approval endpoints for approve/reject/cancel actions

---

### Leave Policy Removal

**Date:** October 31, 2025

#### Summary
Removed the entire leave policy system from the application. Previously, users were assigned leave types based on their region-specific leave policies. Now, the system follows a simplified approach:

**New Logic:**
- When creating an LMS user, all active leave types are automatically added to the user
- All leave balances are initialized to 0
- Leave allocations must be managed manually by administrators

#### Database Schema Changes

**Removed:**
- `LeavePolicy` table (completely removed)
- `leavePolicyId` field from `User` model
- `leavePolicyId` field from `LeaveType` model
- Related indices and foreign keys

**Modified:**
- `LeaveType` model: Changed unique constraint from `[leavePolicyId, code]` to `[code]`
- Leave types are now global across the organization

#### Backend Changes

**Deleted Files:**
- `backend/src/services/leavePolicyService.ts`
- `backend/src/routes/leavePolicy.ts`

**Updated Services:**
- `userManagementService.ts`: Removed leave policy lookup, creates all leave types with 0 balance
- `employeeService.ts`: Updated `createLMSUsers` to fetch all active leave types and set balances to 0
- `leaveBalanceService.ts`: Updated `getLeaveTypesForUser` to return all active leave types
- `authService.ts`: Removed leave policy from user profile response

**Updated Scripts:**
- `seed.ts`: Removed leave policy creation, updated to create leave types without policy reference
- `setupAdmin.js`: Creates admin with all leave types at 0 balance
- `createAdminUser.js`: Updated to work without leave policy
- `createLeaveBalances.js`: Creates all leave types with 0 balance for existing users
- `add-leave-balance.ts`: Removed leave policy references

#### Frontend Changes

**Deleted:**
- `frontend/src/pages/LeavePolicyPage.tsx`

**Updated:**
- `App.tsx`: Removed leave policy route
- `Layout.tsx`: Removed "Leave Policy" navigation menu item

#### Bug Fixes Applied
1. **CORS Issue:** Updated `.env` to use correct frontend port (5175)
2. **Department Field Error:** Removed `department` field from user creation (schema expects `departmentId`)
3. **MUI Tooltip Warning:** Wrapped disabled IconButton with `<span>` element

---

## Project Structure

```
LMS_v2/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and configuration
│   │   ├── middleware/      # Auth, error handling, validation
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic
│   │   ├── scripts/         # Database seed scripts
│   │   └── index.ts         # Server entry point
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── .env                 # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── config/          # API configuration
│   │   ├── contexts/        # React contexts (Auth)
│   │   ├── pages/           # Page components
│   │   ├── theme/           # MUI theme customization
│   │   └── App.tsx          # Main app component
│   └── package.json
│
└── Feature Development/
    └── LastSession.txt      # Session tracking
```

---

## Database Schema

### Core Models

#### User
Primary user model for LMS authentication and profile.

**Key Fields:**
- `employeeId` (unique): Employee identifier
- `email` (unique): User email
- `password`: Hashed password
- `role`: ADMIN | MANAGER | HR | EMPLOYEE
- `firstName`, `lastName`: User name
- `designation`, `employmentType`, `region`: Employment details
- `isActive`: Account status
- `emailVerified`: Email verification status

**Relations:**
- `department`: Optional link to Department
- `manager`: Self-referential relation for reporting structure
- `leaveBalances`: User's leave balances
- `leaveRequests`: Leave requests submitted
- `approvals`: Leave approvals (as approver)

#### Employee
Employee master data (separate from User for HR management).

**Key Fields:**
- `employeeId` (unique): Employee ID
- `email` (unique): Employee email
- `firstName`, `lastName`: Name
- `location`, `designation`, `department`: Job details
- `employmentType`: FTE | FTDC | CONSULTANT
- `lmsAccess`: EMP | MGR (determines if they can access LMS)
- `lmsUserCreated`: Flag indicating if LMS user account exists
- `isActive`: Active status

#### LeaveType
Defines types of leaves available in the system.

**Key Fields:**
- `code` (unique): Leave type code (e.g., CL, SL, PL)
- `name`: Display name
- `category`: CASUAL | SICK | PRIVILEGE | MATERNITY | PATERNITY | LWP | COMP_OFF | PTO
- `isPaid`: Whether leave is paid
- `requiresApproval`: Approval requirement
- `allowHalfDay`: Half-day leave allowed
- `carryForwardAllowed`: Can carry forward to next year
- `accrualFrequency`: MONTHLY | YEARLY | NONE
- `annualAllocation`: Default annual days

**Current Leave Types:**
- **CL** - Casual Leave
- **SL** - Sick Leave
- **PL** - Privilege Leave
- **ML** - Maternity Leave
- **PAT** - Paternity Leave
- **LWP** - Leave Without Pay
- **COMPOFF** - Compensatory Off
- **PTO** - Paid Time Off

#### LeaveBalance
Tracks leave balances for each user and leave type per year.

**Key Fields:**
- `employeeId`: Reference to user
- `leaveTypeId`: Reference to leave type
- `year`: Calendar year
- `allocated`: Total allocated days
- `used`: Days used
- `pending`: Days pending approval
- `available`: Days available (calculated)
- `carriedForward`: Days carried from previous year
- `expired`: Days expired
- `encashed`: Days encashed

**Unique Constraint:** `[employeeId, leaveTypeId, year]`

#### LeaveRequest
Individual leave request records.

**Key Fields:**
- `employeeId`: Requester
- `leaveTypeId`: Type of leave
- `startDate`, `endDate`: Leave dates
- `totalDays`: Calculated duration
- `reason`: Leave reason
- `status`: PENDING | APPROVED | REJECTED | CANCELLED
- `isHalfDay`: Half-day flag
- `attachment`: Optional document

**Relations:**
- `approvals`: Approval chain records
- `leaveType`: Leave type details
- `user`: Requester details

#### Department
Organizational departments.

**Key Fields:**
- `name`: Department name
- `code` (unique): Department code
- `description`: Optional description

---

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/login` | User login | No |
| POST | `/register` | Register new user | No |
| GET | `/me` | Get current user profile | Yes |
| POST | `/change-password` | Change password | Yes |
| POST | `/request-reset` | Request password reset | No |
| POST | `/reset-password` | Reset password with token | No |

### Employees (`/api/v1/employees`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/` | Get all employees | Yes | ADMIN |
| GET | `/:id` | Get employee by ID | Yes | ADMIN |
| POST | `/` | Create employee | Yes | ADMIN |
| PUT | `/:id` | Update employee | Yes | ADMIN |
| DELETE | `/:id` | Delete employee | Yes | ADMIN |
| POST | `/import/excel` | Import employees from Excel | Yes | ADMIN |
| POST | `/create-lms-users` | Create LMS users for employees | Yes | ADMIN |

### Users (`/api/v1/users`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/by-employee/:employeeId` | Get LMS user by employee ID | Yes | ADMIN |
| POST | `/:employeeId` | Create LMS user | Yes | ADMIN |
| PUT | `/:employeeId/role` | Update user role | Yes | ADMIN |
| PUT | `/:employeeId/status` | Toggle user active status | Yes | ADMIN |
| POST | `/:employeeId/reset-password` | Reset user password | Yes | ADMIN |
| DELETE | `/:employeeId` | Delete LMS user | Yes | ADMIN |

### Leaves (`/api/v1/leaves`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user's leave requests | Yes |
| POST | `/` | Create leave request | Yes |
| GET | `/:id` | Get leave request details | Yes |
| PUT | `/:id` | Update leave request | Yes |
| POST | `/:id/cancel` | Cancel leave request | Yes |
| DELETE | `/:id` | Delete leave request (drafts only) | Yes |
| POST | `/:id/submit` | Submit draft leave request | Yes |
| GET | `/approvals/pending` | Get pending approvals | Yes (Manager/HR/Admin) |
| GET | `/approvals/history` | Get approval history | Yes (Manager/HR/Admin) |
| GET | `/team/all` | Get team leave requests (with filters) | Yes (Manager/HR/Admin) |
| POST | `/:id/approve` | Approve leave request | Yes (Manager/HR/Admin) |
| POST | `/:id/reject` | Reject leave request | Yes (Manager/HR/Admin) |

### Leave Balances (`/api/v1/leave-balances`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user's leave balances | Yes |
| GET | `/leave-types` | Get all active leave types | Yes |
| POST | `/allocate` | Allocate leave balance | Yes (ADMIN) |

### Admin (`/api/v1/admin`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/employees-with-balances` | Get all employees with leave balances | Yes | ADMIN |
| GET | `/employee-leaves/:employeeId` | Get employee leave history | Yes | ADMIN |
| GET | `/all-leaves` | Get all leave requests (with filters: region, status, search) | Yes | ADMIN |
| POST | `/process-leaves` | Bulk process leave allocations | Yes | ADMIN |
| GET | `/processing-history` | Get leave processing history | Yes | ADMIN |
| POST | `/leave-policy/check-exists` | Check if leave processing exists for criteria | Yes | ADMIN |

---

## Environment Variables

### Backend (.env)

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5175

# Database Configuration
DATABASE_URL="mysql://username:password@host:port/database"

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5175

# Email Configuration
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

---

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MySQL (v8 or higher)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Update database credentials
   - Update JWT secret

4. **Setup database:**
   ```bash
   # Push schema to database
   npx prisma db push

   # Generate Prisma client
   npx prisma generate
   ```

5. **Seed database (optional):**
   ```bash
   npx tsx src/scripts/seed.ts
   ```

6. **Start development server:**
   ```bash
   npm run dev
   ```

   Server runs on: `http://localhost:3001`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API endpoint:**
   - Check `src/config/api.ts`
   - Ensure backend URL is correct

4. **Start development server:**
   ```bash
   npm run dev
   ```

   Frontend runs on: `http://localhost:5175`

### Default Admin Credentials

After seeding the database:
- **Email:** admin@golivefaster.com
- **Password:** Admin@123

---

## Key Features

### 1. Employee Management
- Import employees via Excel file
- Bulk create LMS user accounts
- Manage employee details (designation, department, employment type)
- Track LMS access permissions (EMP/MGR)
- Employee activation/deactivation

### 2. User Management
- Create LMS users from employee records
- Automatic leave balance initialization (all types set to 0)
- Role-based access control (ADMIN, MANAGER, HR, EMPLOYEE)
- Password reset functionality
- User status management

### 3. Leave Management
- Multiple leave types support
- Leave request submission with attachments
- Half-day leave support
- Leave approval workflow
- Leave cancellation
- Leave balance tracking per year

### 4. Leave Balance Management
- Automatic initialization with 0 balance for new users
- Manual leave allocation by admins
- Accrual tracking (monthly/yearly)
- Carry forward management
- Leave encashment tracking
- Balance history per year

### 5. Approval System
- **Unified Approval Grid** for both Admin and Manager roles
- **Bulk Actions**: Approve/reject multiple requests simultaneously
- **Advanced Filters**: Region (Admin only), Status, and Search with debouncing
- **Manager-based approval hierarchy**
- **Cancel Approved Leaves**: Admins and Managers can cancel approved leaves (before start date)
- **Status Tracking**: Color-coded status chips (Approved, Rejected, Pending, Cancelled)
- **Approval/rejection with comments**
- **Automatic balance restoration** on rejection or cancellation
- Email notifications (configurable)
- **Real-time search** with 500ms debounce for smooth experience

### 6. Admin Dashboard
- Overview of all employees and leave balances
- Employee leave history viewer
- Bulk leave processing
- Processing history tracking
- Real-time statistics

### 7. Reporting
- Leave usage reports
- Balance summaries
- Approval statistics
- Team leave calendars (for managers)

---

## User Roles & Permissions

### ADMIN
- Full system access
- Employee management
- User account management
- Leave balance allocation
- System configuration
- View all reports
- **Approve/reject/cancel ANY leave request**
- **Bulk approve/reject** with filters (Region, Status, Search)
- **Cancel approved leaves** (before start date)
- Access to unified approval grid with advanced filters

### MANAGER
- View team leave requests (only their direct reports)
- **Bulk approve/reject team leave requests**
- **Cancel approved team leaves** (before start date)
- View team leave balances
- Submit own leave requests
- View team calendar
- **Access to unified approval grid** with Status and Search filters
- **Same powerful UI as Admin** (limited to team members only)

### HR
- View all leave requests
- Generate reports
- View employee balances
- Submit own leave requests

### EMPLOYEE
- Submit leave requests
- View own leave balance
- View leave history
- Cancel pending requests

---

## UI/UX Design Guidelines

### Color Scheme for Approval Actions

The approval system uses a consistent, custom color scheme that maps action buttons to their corresponding status indicators:

**Status Colors:**
- **Approved**: Teal (#11998e)
  - Main: `#11998e`
  - Hover: `#00695c`
  - Light: `#38ef7d`

- **Rejected**: Pink (#f857a6)
  - Main: `#f857a6`
  - Hover: `#c62828`
  - Light: `#ff5858`

- **Pending**: Orange (#ed6c02)
  - Main: `#ed6c02`
  - Used for status chips only

- **Cancelled**: Dark Orange (#d84315)
  - Main: `#d84315`
  - Hover: `#bf360c`
  - Used for cancel button

**Button Styling Rules:**
1. All buttons use solid colors (no gradients)
2. `backgroundImage: 'none !important'` must be applied
3. Disabled state uses gray with reduced opacity
4. All color properties use `!important` to override MUI theme
5. Hover states should be darker shades of the main color

**Implementation Example:**
```typescript
sx={{
  color: '#fff !important',
  backgroundColor: '#11998e !important',
  backgroundImage: 'none !important',
  '&:hover': {
    backgroundColor: '#00695c !important',
    backgroundImage: 'none !important',
  },
  '&:disabled': {
    backgroundColor: 'rgba(0, 0, 0, 0.12) !important',
    color: 'rgba(0, 0, 0, 0.26) !important',
    backgroundImage: 'none !important',
  },
}}
```

### Search Implementation

**Debouncing:**
- All search inputs use 500ms debounce delay
- Prevents unnecessary API calls and page refreshes
- Improves user experience for typing

**Implementation:**
```typescript
const [searchInput, setSearchInput] = useState<string>('');
const [debouncedSearch, setDebouncedSearch] = useState<string>('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchInput);
  }, 500);
  return () => clearTimeout(timer);
}, [searchInput]);
```

---

## Development Workflow

### Running Servers

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Database Operations

**Create migration:**
```bash
npx prisma migrate dev --name migration_name
```

**Push schema changes (dev):**
```bash
npx prisma db push
```

**Generate Prisma client:**
```bash
npx prisma generate
```

**View database in Prisma Studio:**
```bash
npx prisma studio
```

### Building for Production

**Backend:**
```bash
npm run build
npm start
```

**Frontend:**
```bash
npm run build
# Serve the dist folder using a static server
```

---

## Common Issues & Solutions

### 1. CORS Error
**Issue:** Frontend cannot connect to backend due to CORS policy.

**Solution:**
- Check `CORS_ORIGIN` in backend `.env` file
- Ensure it matches the frontend URL (including port)
- Restart backend server after changing `.env`

### 2. Prisma Client Errors
**Issue:** `PrismaClientValidationError` or module not found errors.

**Solution:**
```bash
cd backend
npx prisma generate
```

### 3. Port Already in Use
**Issue:** Backend/Frontend port is already in use.

**Solution Windows:**
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill process (replace PID)
taskkill /F /PID <PID>
```

**Solution Linux/Mac:**
```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9
```

### 4. Database Connection Failed
**Issue:** Cannot connect to MySQL database.

**Solution:**
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database exists
- Check firewall settings

### 5. Department Field Error
**Issue:** Error when creating LMS users: "Expected DepartmentCreateNestedOneWithoutUsersInput, provided String"

**Solution:** Already fixed - removed `department` field from user creation. Use `departmentId` if needed.

### 6. Frontend Cache Issues
**Issue:** Old page/component still showing after deletion.

**Solution:**
```bash
cd frontend
rm -rf .vite node_modules/.vite
npm run dev
```

---

## Testing

### Manual Testing Checklist

**Authentication:**
- [ ] User login
- [ ] User logout
- [ ] Password change
- [ ] Password reset

**Employee Management:**
- [ ] Import employees via Excel
- [ ] Create individual employee
- [ ] Update employee details
- [ ] Delete employee

**User Management:**
- [ ] Create LMS user from employee
- [ ] Verify leave balances initialized to 0
- [ ] Update user role
- [ ] Activate/deactivate user
- [ ] Delete LMS user

**Leave Requests:**
- [ ] Submit leave request
- [ ] Cancel leave request (employee)
- [ ] Approve leave request (as manager)
- [ ] Reject leave request (as manager)
- [ ] Bulk approve multiple leave requests
- [ ] Bulk reject multiple leave requests
- [ ] Cancel approved leave (as manager/admin, before start date)
- [ ] Filter leaves by status (All/Pending/Approved)
- [ ] Filter leaves by region (admin only)
- [ ] Search leaves by employee ID or name
- [ ] Verify debounced search (no page refresh on typing)

**Leave Balances:**
- [ ] View leave balances
- [ ] Allocate leave balance (as admin)
- [ ] Verify balance updates after approval

---

## Known Limitations

1. **Email Service:** Email transporter initialization error (nodemailer configuration issue) - emails are not currently sent
2. **Department Mapping:** Employee department (string) is not mapped to Department table (UUID)
3. **Manager Hierarchy:** Manager relationships are tracked by employeeId but not enforced in approval flow
4. **File Uploads:** Attachment upload is configured but not fully implemented
5. **Notifications:** Notification system exists in schema but is not actively used

---

## Future Enhancements

### Planned Features
1. **Leave Calendar:** Visual calendar view of team leaves
2. **Email Notifications:** Fix nodemailer setup for approval emails
3. **Department Management:** UI for managing departments
4. **Leave Policies:** Reintroduce leave policies as templates (optional)
5. **Reporting Module:** Advanced reports and analytics
6. **Mobile App:** React Native mobile application
7. **Integration:** API integration with HR systems
8. **Accrual Automation:** Automatic monthly/yearly leave accruals
9. **Holiday Management:** Public holiday configuration
10. **Delegation:** Manager delegation during absence

### Technical Improvements
1. **Testing:** Unit tests and integration tests
2. **Documentation:** API documentation (Swagger/OpenAPI)
3. **Logging:** Enhanced logging and monitoring
4. **Caching:** Redis caching for performance
5. **File Storage:** S3/cloud storage for attachments
6. **Real-time Updates:** WebSocket for live notifications
7. **Audit Trail:** Comprehensive audit logging
8. **Backup:** Automated database backups

---

## Support & Troubleshooting

### Logs

**Backend logs:** Check console output in terminal running backend server

**Frontend logs:** Check browser console (F12 → Console tab)

**Database logs:**
```bash
# View Prisma query logs
# Add to .env:
DEBUG=prisma:*
```

### Clearing Data

**Reset database:**
```bash
cd backend
npx prisma migrate reset
npx tsx src/scripts/seed.ts
```

**Clear specific table:**
```sql
-- Connect to MySQL
DELETE FROM leave_balances;
DELETE FROM users;
-- etc.
```

---

## Contributing

### Code Style
- Use TypeScript for type safety
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful commit messages

### Git Workflow
1. Create feature branch from main
2. Make changes and commit
3. Push to remote
4. Create pull request
5. Code review
6. Merge after approval

---

## License

Proprietary - All rights reserved

---

## Contact

For questions or support, contact the development team.

---

## Changelog

### v2.1.0 (November 3, 2025)
- **NEW:** Unified approval grid for Admin and Manager roles
- **NEW:** Bulk approve/reject functionality with always-visible buttons
- **NEW:** Advanced filtering: Region (Admin), Status, and debounced Search
- **NEW:** Cancel approved leaves (Admins and Managers, before start date)
- **NEW:** Custom color scheme for approval actions (Teal, Pink, Orange)
- **ENHANCEMENT:** Manager approval page now matches Admin's powerful interface
- **ENHANCEMENT:** Debounced search (500ms) for smooth typing experience
- **FIX:** Critical balance restoration bug when Admin cancels leaves
- **FIX:** Search box issues (page refresh for Admin, single letter for Manager)
- **FIX:** Removed all gradient backgrounds from buttons
- **FIX:** Consistent color mapping between status chips and action buttons
- Updated documentation with approval system enhancements

### v2.0.0 (October 31, 2025)
- **BREAKING:** Removed leave policy system
- Changed leave balance initialization to 0 for all types
- Fixed department field issue in user creation
- Fixed MUI Tooltip warning for disabled buttons
- Updated CORS configuration
- Improved admin dashboard display
- Updated documentation

### v1.0.0 (Initial Release)
- Core leave management functionality
- Employee and user management
- Approval workflow
- Admin dashboard
- Leave balance tracking

---

**Last Updated:** November 3, 2025
**Version:** 2.1.0

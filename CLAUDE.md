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

### Employee Date Fields & Gender-Based Leave Filtering (Latest Update)

**Date:** November 5, 2025

#### Summary
Added Date of Joining and Exit Date fields to Employee Management, and implemented gender-based filtering for Maternity Leave (ML) and Paternity Leave (PTL).

**Key Changes:**

1. **Date Fields in Employee Management:**
   - Added `dateOfJoining` (mandatory) and `exitDate` (optional) fields to Employee model
   - Fields positioned between "Phone Number" and "Location" in Excel uploads
   - Date of Joining is required when adding/editing employees
   - Exit Date is optional and can be left blank
   - Dates are displayed in View Employee modal but NOT in the data grid
   - Proper date parsing for Excel serial numbers and date strings

2. **Gender-Based Leave Filtering:**
   - Maternity Leave (ML) is only visible to Female employees (Gender = 'F')
   - Paternity Leave (PTL) is only visible to Male employees (Gender = 'M')
   - Filtering applied in:
     - Dashboard leave balance cards
     - Apply Leaves dialog leave type dropdown
     - Leave Type filter dropdown
   - Fixed leave type code from "PAT" to "PTL" (actual database value)

#### Database Schema Changes

**Employee Model** (`backend/prisma/schema.prisma`):
```prisma
model Employee {
  employeeId         String        @id
  firstName          String
  lastName           String
  gender             String?
  email              String        @unique
  phoneNumber        String?
  dateOfJoining      DateTime      @default(now())  // ADDED
  exitDate           DateTime?                      // ADDED
  location           String?
  // ... rest of fields
}
```

#### Backend Changes

**Files Modified:**

1. **`backend/src/services/employeeService.ts`**:
   - Updated `EmployeeData` interface to include `dateOfJoining: Date` and `exitDate?: Date`
   - Updated Excel validation headers to include "Date of Joining" (mandatory) and "Exit Date" (optional)
   - Added date validation in `validateExcelFile()` method
   - Implemented date parsing for both Excel serial numbers and string dates:
     ```typescript
     // Parse Date of Joining (mandatory)
     let dateOfJoining: Date;
     if (typeof row['Date of Joining'] === 'number') {
       dateOfJoining = xlsx.SSF.parse_date_code(row['Date of Joining']);
       dateOfJoining = new Date(dateOfJoining.y, dateOfJoining.m - 1, dateOfJoining.d);
     } else {
       dateOfJoining = new Date(row['Date of Joining']);
     }
     ```
   - Updated `createEmployee()`, `updateEmployee()`, and `importEmployees()` methods to handle dates

2. **Excel Upload Format**:
   - New column order: `Employee ID, First Name, Last Name, Gender, Email ID, Phone Number, **Date of Joining, Exit Date**, Location, Designation, Department, Employment Type, Reporting Manager, Reporting Manager ID, LMS Access, Active`
   - Date of Joining validation added (mandatory field)

#### Frontend Changes

**Files Modified:**

1. **`frontend/src/pages/EmployeeDetailsPage.tsx`**:
   - Updated `Employee` interface:
     ```typescript
     interface Employee {
       employeeId: string;
       firstName: string;
       lastName: string;
       gender?: string;
       email: string;
       phoneNumber?: string;
       dateOfJoining: string;  // ADDED
       exitDate?: string;      // ADDED
       location?: string;
       // ... rest of fields
     }
     ```
   - Updated `EmployeeFormData` interface with date fields
   - Added date fields to Add Employee form (lines ~805, ~815)
   - Added date fields to Edit Employee form (lines ~993, ~1003)
   - Added date display to View Employee modal (lines ~1190, ~1198)
   - Updated `handleEditEmployee()` to format dates for date inputs:
     ```typescript
     dateOfJoining: employee.dateOfJoining ? new Date(employee.dateOfJoining).toISOString().split('T')[0] : '',
     exitDate: employee.exitDate ? new Date(employee.exitDate).toISOString().split('T')[0] : '',
     ```
   - Updated Excel import instruction message

2. **`frontend/src/pages/DashboardPage.tsx`** (Lines 268-284):
   - Implemented gender-based filtering for leave balance cards:
     ```typescript
     const allBalances = Array.isArray(balancesData) ? balancesData : [];
     const balances = allBalances.filter((balance: any) => {
       const leaveCode = balance.leaveType?.leaveTypeCode;

       // Hide Maternity Leave (ML) for non-female employees
       if (leaveCode === 'ML' && user?.gender !== 'F') {
         return false;
       }

       // Hide Paternity Leave (PTL) for non-male employees
       if (leaveCode === 'PTL' && user?.gender !== 'M') {
         return false;
       }

       return true;
     });
     ```

3. **`frontend/src/pages/LeavesPage.tsx`** (Lines 128-143):
   - Imported `useAuth` hook to access user gender
   - Implemented gender-based filtering for leave types in Apply Leaves dialog:
     ```typescript
     const { user } = useAuth();

     const leaveTypes = (leaveTypesData || []).filter((type: any) => {
       const leaveCode = type.leaveTypeCode;

       // Hide Maternity Leave (ML) for non-female employees
       if (leaveCode === 'ML' && user?.gender !== 'F') {
         return false;
       }

       // Hide Paternity Leave (PTL) for non-male employees
       if (leaveCode === 'PTL' && user?.gender !== 'M') {
         return false;
       }

       return true;
     });
     ```
   - Filtered array is used in both Leave Type filter dropdown and Apply Leaves dialog

4. **`frontend/src/contexts/AuthContext.tsx`** (Line 11):
   - Added `gender?: string` field to User interface

5. **`backend/src/services/authService.ts`** (Line 114):
   - Added `gender: true` to login select statement to include gender in login response

6. **`backend/src/services/userManagementService.ts`** (Line 44):
   - Added `gender: employee.gender` to user creation from employee record

#### Bug Fixes

1. **Paternity Leave Code Fix:**
   - Fixed leave type code from "PAT" to "PTL" (actual database value)
   - Database has: `PTL - Paternity Leave` (category: PATERNITY)
   - Updated filtering logic in both DashboardPage and LeavesPage

2. **Gender Field in User Object:**
   - Ensured gender is returned in login response
   - Added to User interface in AuthContext
   - Gender is now properly synced from Employee to User during LMS user creation

#### Important Notes

- **Date of Joining** is a mandatory field when creating or importing employees
- **Exit Date** is optional and can be left blank
- Dates are **NOT shown** in the Employee Management data grid (as per requirement)
- Dates are shown in the View Employee modal with formatted display
- Gender-based filtering requires users to log out and log back in after gender field was added to existing users
- Leave type filtering is client-side and happens in real-time
- Excel date parsing handles both serial numbers (Excel native) and date strings

#### Database Leave Type Codes

Current leave types in the database:
- **BL** - Bereavement Leave (SPECIAL)
- **CL** - Casual Leave (CASUAL)
- **COMP** - Compensatory Off (COMP_OFF)
- **LWP** - Leave Without Pay (LWP)
- **ML** - Maternity Leave (MATERNITY) → Female only
- **PL** - Privilege Leave (PRIVILEGE)
- **PTL** - Paternity Leave (PATERNITY) → Male only
- **PTO** - Paid Time Off (PTO)

---

### UI/UX Improvements to Data Grids

**Date:** November 4, 2025

#### Summary
Comprehensive UI improvements across all leave data grids to enhance readability, consistency, and user experience. Added missing Actions column to Employee My Leaves page with full cancel functionality.

**Key Changes:**

1. **Data Grid Layout Improvements:**
   - Center-aligned columns: Start Date, End Date, Days, Applied On, Status, and Actions
   - Reduced button heights for Cancel, Approve, and Reject buttons (using `py: 0.5`, `minHeight: 'auto'`)
   - Consistent row spacing across all tables
   - Improved visual hierarchy and readability

2. **Employee My Leaves Page Enhancements:**
   - Added missing Actions column to leave requests table
   - Implemented full cancel leave functionality
   - Added cancel dialog with reason input
   - Business logic: Can only cancel PENDING/APPROVED leaves with start date >= today
   - Cancel mutation with proper error handling and toast notifications
   - Query invalidation for real-time updates

3. **Affected Pages:**
   - **LeavesPage.tsx** (Employee My Leaves):
     - Added Actions column with Cancel button
     - Implemented `canCancelLeave()` function
     - Added `cancelMutation` for API integration
     - Added Cancel Leave Dialog with reason TextField
     - Center alignment for date, numeric, and status columns
     - Updated table colSpan from 8 to 9

   - **DashboardPage.tsx** (Employee Recent Leaves & Manager Pending Team Leaves):
     - Center-aligned date, numeric, and action columns in both sections
     - Reduced Cancel button height in Employee section
     - Reduced Approve/Reject button heights in Manager section
     - Consistent button styling with custom colors

   - **ApprovalsPage.tsx** (Admin Approvals):
     - Center-aligned date, numeric, and action columns
     - Reduced all action button heights (Approve, Reject, Cancel)
     - Maintained existing bulk action functionality

#### Frontend Changes

**Updated Components:**

1. **`frontend/src/pages/LeavesPage.tsx`** (Lines 30, 50-52, 136-152, 154-175, 269-280, 282-356, 466-493):
   ```typescript
   // Added imports
   import { Add, Cancel } from '@mui/icons-material';

   // Added state management
   const [cancelDialog, setCancelDialog] = useState(false);
   const [cancelReason, setCancelReason] = useState('');
   const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);

   // Cancel mutation
   const cancelMutation = useMutation({
     mutationFn: async ({ leaveId, reason }: { leaveId: string; reason: string }) => {
       const response = await api.post(`/leaves/${leaveId}/cancel`, { reason });
       return response.data;
     },
     onSuccess: () => {
       toast.success('Leave request cancelled successfully');
       queryClient.invalidateQueries({ queryKey: ['leaves'] });
       setCancelDialog(false);
       setCancelReason('');
       setSelectedLeaveId(null);
     },
     onError: (error: any) => {
       toast.error(error.response?.data?.message || 'Failed to cancel leave');
     },
   });

   // Business logic for cancellation
   const canCancelLeave = (leave: any) => {
     if (!['PENDING', 'APPROVED'].includes(leave.status)) return false;
     const startDate = new Date(leave.startDate);
     const today = new Date();
     today.setHours(0, 0, 0, 0);
     return startDate >= today;
   };

   // Table structure with Actions column
   <TableCell align="center">Actions</TableCell>

   // Actions cell implementation
   <TableCell align="center">
     {canCancelLeave(leave) ? (
       <Button
         size="small"
         startIcon={<Cancel />}
         onClick={() => handleCancelClick(leave.id)}
         disabled={cancelMutation.isPending}
         sx={{
           color: '#fff !important',
           backgroundColor: '#d84315 !important',
           backgroundImage: 'none !important',
           py: 0.5,
           minHeight: 'auto',
           '&:hover': {
             backgroundColor: '#bf360c !important',
             backgroundImage: 'none !important',
           },
           '&:disabled': {
             backgroundColor: 'rgba(0, 0, 0, 0.12) !important',
             color: 'rgba(0, 0, 0, 0.26) !important',
             backgroundImage: 'none !important',
           },
         }}
       >
         Cancel
       </Button>
     ) : (
       <Typography variant="caption" sx={{ color: 'text.secondary' }}>
         -
       </Typography>
     )}
   </TableCell>

   // Cancel Leave Dialog
   <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)} maxWidth="sm" fullWidth>
     <DialogTitle>Cancel Leave Request</DialogTitle>
     <DialogContent>
       <TextField
         label="Cancellation Reason"
         value={cancelReason}
         onChange={(e) => setCancelReason(e.target.value)}
         multiline
         rows={4}
         fullWidth
         required
         sx={{ mt: 2 }}
         placeholder="Please provide a reason for cancelling this leave request"
       />
     </DialogContent>
     <DialogActions>
       <Button onClick={() => setCancelDialog(false)}>Close</Button>
       <Button
         onClick={handleCancelSubmit}
         variant="contained"
         color="warning"
         disabled={cancelMutation.isPending}
       >
         {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Leave'}
       </Button>
     </DialogActions>
   </Dialog>
   ```

2. **`frontend/src/pages/DashboardPage.tsx`** (Lines 744-826, 943-1040):
   - Employee Recent Leaves section: Center alignment for date/numeric columns, reduced Cancel button height
   - Manager Pending Team Leaves section: Center alignment and reduced Approve/Reject button heights

3. **`frontend/src/pages/ApprovalsPage.tsx`**:
   - Center alignment for date, numeric, and action columns
   - Reduced button heights for all action buttons

#### Button Styling Pattern

All action buttons now follow this consistent pattern for reduced height:
```typescript
sx={{
  color: '#fff !important',
  backgroundColor: '#d84315 !important', // Color varies by action
  backgroundImage: 'none !important',
  py: 0.5,              // Reduced padding-y
  minHeight: 'auto',    // Allows button to shrink
  '&:hover': {
    backgroundColor: '#bf360c !important', // Darker shade
    backgroundImage: 'none !important',
  },
  '&:disabled': {
    backgroundColor: 'rgba(0, 0, 0, 0.12) !important',
    color: 'rgba(0, 0, 0, 0.26) !important',
    backgroundImage: 'none !important',
  },
}}
```

#### Bug Fixes Applied

1. **Syntax Error in LeavesPage.tsx:**
   - **Issue**: Extra closing brace after `toLocaleDateString()` on line 302
   - **Error**: `Unexpected token, expected ":" (302:76)`
   - **Fix**: Removed extra `}` character
   - **Before**: `? new Date(leave.appliedDate).toLocaleDateString()}`
   - **After**: `? new Date(leave.appliedDate).toLocaleDateString()`

#### User Experience Improvements

1. **Better Readability:**
   - Center-aligned date and numeric columns improve visual scanning
   - Consistent alignment across all data grids

2. **Cleaner Interface:**
   - Reduced button heights create more compact, professional appearance
   - Less vertical space wasted on action buttons

3. **Employee Empowerment:**
   - Employees can now cancel their own leave requests directly from My Leaves page
   - Clear visual feedback on which leaves can be cancelled
   - Required cancellation reason for audit trail

4. **Consistent User Experience:**
   - All data grids now have uniform styling and behavior
   - Same column alignment rules across Employee, Manager, and Admin views

---

### Approval System Enhancements

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
- `gender`: M | F (used for leave type filtering)
- `phoneNumber`: Contact number
- `dateOfJoining` (required): Date employee joined the organization
- `exitDate` (optional): Date employee left the organization
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
- **BL** - Bereavement Leave
- **CL** - Casual Leave
- **COMP** - Compensatory Off
- **LWP** - Leave Without Pay
- **ML** - Maternity Leave (visible only to Female employees)
- **PL** - Privilege Leave
- **PTL** - Paternity Leave (visible only to Male employees)
- **PTO** - Paid Time Off

**Note:** Maternity Leave (ML) and Paternity Leave (PTL) are filtered based on employee gender. ML is only visible to employees with Gender = 'F', and PTL is only visible to employees with Gender = 'M'.

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
- **Leave cancellation by employees** (PENDING/APPROVED leaves with start date >= today)
- **Cancel dialog with required reason** for audit trail
- Leave balance tracking per year
- **Actions column** on all leave data grids for quick access to cancel/approve/reject

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
- **Cancel own leave requests** (PENDING/APPROVED status, before start date)
- **Cancel dialog with required reason** for accountability
- Access to My Leaves page with Actions column

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

### Data Grid Layout Guidelines

**Column Alignment:**
All leave data grids follow consistent alignment rules for improved readability:

**Center-Aligned Columns:**
- Date columns: Start Date, End Date, Applied On
- Numeric columns: Days, Total Days
- Status column: Status chips
- Action column: Action buttons

**Left-Aligned Columns:**
- Text columns: Leave Type, Approver, Reason, Employee Name, Employee ID
- Description fields: Any long-form text content

**Implementation:**
```typescript
// Header cells
<TableCell align="center">Start Date</TableCell>
<TableCell align="center">Days</TableCell>
<TableCell>Leave Type</TableCell>  // Left-aligned by default

// Data cells
<TableCell align="center">
  {new Date(leave.startDate).toLocaleDateString()}
</TableCell>
<TableCell align="center">{leave.totalDays}</TableCell>
<TableCell>{leave.leaveType?.name}</TableCell>
```

**Button Height Reduction:**
All action buttons use reduced height for compact, professional appearance:
```typescript
sx={{
  py: 0.5,              // Reduced vertical padding
  minHeight: 'auto',    // Allows button to shrink below default minimum
}}
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
- [ ] Cancel leave request from Employee My Leaves page (PENDING/APPROVED, before start date)
- [ ] Verify cancel dialog requires reason
- [ ] Verify cancel button only shows for cancellable leaves
- [ ] Verify balance restoration after employee cancellation
- [ ] Approve leave request (as manager)
- [ ] Reject leave request (as manager)
- [ ] Bulk approve multiple leave requests
- [ ] Bulk reject multiple leave requests
- [ ] Cancel approved leave (as manager/admin, before start date)
- [ ] Filter leaves by status (All/Pending/Approved)
- [ ] Filter leaves by region (admin only)
- [ ] Search leaves by employee ID or name
- [ ] Verify debounced search (no page refresh on typing)
- [ ] Verify center alignment of date, numeric, and action columns
- [ ] Verify reduced button heights across all data grids

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

## Recent Major Changes (Continued)

### Holiday Calendar Management & First-Time Password Reset

**Date:** November 6, 2025

#### Summary
Implemented comprehensive Holiday Calendar management system with regional support (IND/US) and holiday-aware leave calculations. Added first-time password reset functionality requiring users to change default passwords on initial login.

**Key Changes:**

1. **Holiday Calendar Management:**
   - Admin interface to manage organization-wide holidays
   - Regional support: India (IND) and United States (US)
   - Year-based organization (current year -1 to +1)
   - ToggleButton filters for quick navigation
   - Add, edit, and delete holidays
   - Custom color scheme matching existing UI patterns

2. **Holiday-Aware Leave Calculations:**
   - Backend API calculates working days excluding weekends AND regional holidays
   - Region field added to user profile
   - Leave requests automatically exclude applicable regional holidays
   - Half-day calculations properly adjusted
   - Real-time leave balance display in Apply Leaves dialog

3. **First-Time Password Reset:**
   - New users created with default password must change it on first login
   - `mustChangePassword` flag added to User model
   - Dedicated password change page with validation
   - Route protection redirects to password change when required
   - Admin password reset triggers mandatory password change on next login
   - No password complexity restrictions (per business requirement)

4. **UI/UX Improvements:**
   - Leave balance shown immediately when leave type selected
   - Updated messaging: "Weekends (Saturday & Sunday) and Regional Holidays (IND/US) are excluded"
   - Consistent button colors across all admin interfaces
   - White backgrounds on editable fields for better UX

#### Database Schema Changes

**User Model** (`backend/prisma/schema.prisma`):
```prisma
model User {
  // ... existing fields ...
  mustChangePassword   Boolean      @default(true)  // ADDED
  region               String?                      // Now included in login
  // ... rest of fields ...
}
```

**Holiday Model** (NEW):
```prisma
model Holiday {
  id          String   @id @default(uuid())
  date        DateTime
  name        String
  location    String   // IND or US
  year        Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([date, location])
  @@index([year, location])
}
```

#### Backend Changes

**New Files:**

1. **`backend/src/services/holidayService.ts`**:
   - `getAllHolidays(filters)`: Get holidays with year/location filters
   - `createHoliday(data)`: Create new holiday
   - `updateHoliday(id, data)`: Update existing holiday
   - `deleteHoliday(id)`: Delete holiday
   - `getHolidaysForDateRange(startDate, endDate, location)`: Get holidays in range

2. **`backend/src/routes/holidays.ts`**:
   - `GET /api/v1/holidays`: List holidays with filters
   - `POST /api/v1/holidays`: Create holiday (Admin only)
   - `PUT /api/v1/holidays/:id`: Update holiday (Admin only)
   - `DELETE /api/v1/holidays/:id`: Delete holiday (Admin only)

**Updated Services:**

1. **`backend/src/services/authService.ts`**:
   - Added `region: true` to login select statement (line 116)
   - Added `mustChangePassword: true` to login select
   - Updated `changePassword()` to set `mustChangePassword: false` (line 257)

2. **`backend/src/services/leaveService.ts`**:
   - Updated `calculateWorkingDays()` to call `holidayService.getHolidaysForDateRange()`
   - Excludes regional holidays based on user's region
   - Handles partial holidays (half-day leaves on holiday dates)

3. **`backend/src/services/userManagementService.ts`**:
   - Updated `resetPassword()` to set `mustChangePassword: true` (line 159)
   - Ensures admin password reset triggers password change requirement

**Updated Routes:**

1. **`backend/src/routes/auth.ts`**:
   - Changed password change route from POST to PUT (line 84)
   - Removed password strength validation (lines 87-90)
   - Route: `PUT /api/v1/auth/change-password`

2. **`backend/src/index.ts`**:
   - Added holiday routes: `app.use('/api/v1/holidays', holidayRoutes);`

#### Frontend Changes

**New Files:**

1. **`frontend/src/pages/HolidayCalendarPage.tsx`** (Complete implementation):
   - ToggleButton filters for Year (Previous/Current/Next) and Location (All/IND/US)
   - Add Holiday functionality with white background editable fields
   - Inline editing for existing holidays
   - Save/Cancel buttons with custom colors (#11998e for Save, #f857a6 for Cancel)
   - Add Holiday button with blue color (#2196f3) matching Employee Management
   - Plain text location display (no colored chips)
   - Data grid with center-aligned date column
   - Year selection limited to current and next year when adding

**Updated Files:**

1. **`frontend/src/contexts/AuthContext.tsx`**:
   - Added `region?: string` to User interface (line 12)
   - Added `mustChangePassword?: boolean` to User interface (line 13)

2. **`frontend/src/pages/LeavesPage.tsx`**:
   - Added leave balance query and display (lines 161-168, 592-603)
   - Fixed half-day calculation logic (lines 116-133)
   - Updated to call `/leaves/calculate-days` API with region parameter
   - Updated exclusion message text (line 634)
   - Added query invalidation for leave-balances after create/cancel (lines 204, 221)

3. **`frontend/src/pages/DashboardPage.tsx`**:
   - Updated to call holiday API instead of local calculation (lines 237-288)
   - Fixed half-day calculation with proper value checks (lines 255-256)
   - Added leave balance display in Apply Leaves dialog
   - Updated exclusion message text

4. **`frontend/src/pages/ChangePasswordPage.tsx`** (NEW - Complete implementation):
   - Dedicated password change page for first-time login
   - Three fields: Current Password, New Password, Confirm New Password
   - Toggle password visibility for all fields
   - Form validation (matching passwords, different from current)
   - Cancel button logs out and returns to login
   - Submit button calls API and logs out on success
   - Warning alert explaining password change requirement

5. **`frontend/src/App.tsx`**:
   - Imported `ChangePasswordPage` component (line 11)
   - Added `/change-password` route (lines 84-91)
   - Updated `ProtectedRoute` to redirect if `mustChangePassword` is true (lines 44-47)
   - Added to admin routes navigation

6. **`frontend/src/components/Layout.tsx`**:
   - Added "Holiday Calendar" menu item for Admin role
   - Icon: CalendarMonth
   - Route: `/holiday-calendar`

#### Bug Fixes Applied

1. **Authorization Middleware Bug:**
   - **Issue**: Admin couldn't create holidays - "You do not have permission" error
   - **Root Cause**: `authorize(['ADMIN'])` passing array instead of rest parameters
   - **Fix**: Changed to `authorize('ADMIN')` in `backend/src/routes/holidays.ts` (lines 48, 74)

2. **Region Field Missing:**
   - **Issue**: Holiday exclusion not working - API not being called
   - **Root Cause**: `region` field not included in login response
   - **Fix**: Added `region: true` to login select in authService.ts (line 116)
   - **Impact**: User object now has region, enabling holiday-aware calculations

3. **Half-Day Calculation Bug:**
   - **Issue**: Half-day selections not calculating as 0.5 days
   - **Root Cause**: Code checked for `'half'` but radio buttons sent `'first-half'` or `'second-half'`
   - **Fix**: Updated both LeavesPage and DashboardPage to check for non-'full' values

4. **Password Change Route Error:**
   - **Issue**: "Route /api/v1/auth/change-password not found"
   - **Root Cause**: Backend route was PUT, frontend called POST
   - **Fix**: Changed frontend to use `api.put()` (ChangePasswordPage.tsx line 41)

5. **Password Validation Removed:**
   - **Issue**: Password strength validation preventing simple passwords
   - **Business Requirement**: No password restrictions
   - **Fix**: Removed custom validation from auth route (line 89)

#### API Endpoints Added

**Holiday Management:**

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/v1/holidays` | Get holidays with filters (year, location) | Yes | All |
| POST | `/api/v1/holidays` | Create new holiday | Yes | ADMIN |
| PUT | `/api/v1/holidays/:id` | Update holiday | Yes | ADMIN |
| DELETE | `/api/v1/holidays/:id` | Delete holiday | Yes | ADMIN |

**Leave Calculation:**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/leaves/calculate-days` | Calculate working days excluding weekends and regional holidays | Yes |

**Password Management:**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| PUT | `/api/v1/auth/change-password` | Change password (sets mustChangePassword to false) | Yes |

#### User Flow Changes

**First-Time Login Flow:**
1. User logs in with default password (`Password-123`)
2. Backend returns user object with `mustChangePassword: true`
3. Frontend redirects to `/change-password` (route protection)
4. User must enter current password, new password, and confirm
5. On submit, password is updated and `mustChangePassword` set to false
6. User is logged out and redirected to login page
7. User logs in with new password and accesses application

**Admin Password Reset Flow:**
1. Admin clicks "Reset Password" on employee in Employee Management
2. Backend sets password to `Password-123` and `mustChangePassword: true`
3. Employee's next login triggers first-time login flow
4. Employee must change password before accessing application

**Leave Request with Holidays Flow:**
1. User opens Apply Leaves dialog
2. Selects leave type - current balance shown immediately in green Alert
3. Selects start date and end date
4. Frontend calls `/leaves/calculate-days` API with user's region
5. Backend fetches holidays for date range and region
6. Calculates working days excluding weekends AND regional holidays
7. Adjusts for half-day selections if applicable
8. Returns calculated days to frontend
9. User sees: "You are applying for X days" with updated message
10. Message states: "Weekends and Regional Holidays are excluded"

#### Testing Performed

**Holiday Calendar:**
- ✅ Create holiday for IND region (Nov 20, 2025 - Delayed Diwali)
- ✅ Create holiday for US region
- ✅ Edit existing holiday
- ✅ Delete holiday
- ✅ Filter by year (Previous/Current/Next)
- ✅ Filter by location (All/IND/US)
- ✅ Verify year dropdown shows only current and next year when adding

**Holiday-Aware Leave Calculation:**
- ✅ Leave request spanning weekend (correctly excluded)
- ✅ Leave request spanning regional holiday (correctly excluded)
- ✅ Leave request: Nov 18-21 with Nov 20 IND holiday → Shows 3 days
- ✅ Half-day on start date reduces by 0.5
- ✅ Half-day on end date reduces by 0.5
- ✅ Half-day on single-day leave shows 0.5 days
- ✅ Leave balance displayed immediately on leave type selection

**Password Reset:**
- ✅ New user login with default password redirects to change password
- ✅ Change password with matching new passwords succeeds
- ✅ Change password with mismatched passwords shows error
- ✅ Change password with same as current shows error
- ✅ Cancel button logs out and returns to login
- ✅ Admin reset password triggers password change on next login
- ✅ User can set simple password (no restrictions)
- ✅ After password change, mustChangePassword is false

#### Important Notes

1. **Region Field Requirement:**
   - Users must have `region` field populated (IND or US)
   - Region is synced from Employee to User during LMS user creation
   - Existing users may need region field populated manually

2. **Holiday Date Format:**
   - Holidays stored as DateTime in database
   - Frontend displays as localized date string
   - API accepts ISO 8601 date format

3. **Password Change Enforcement:**
   - Users can click "Cancel" to logout (doesn't force password change)
   - This is by design - Cancel simply logs out user
   - User must change password to access any protected routes

4. **Leave Balance Display:**
   - Only shows when leave type is selected
   - Displays in green Alert above date pickers
   - Shows available days for selected leave type
   - Updates in real-time after leave creation/cancellation

5. **Half-Day Calculation Priority:**
   - Half-day reductions applied AFTER holiday exclusions
   - If holiday falls on half-day selection, no conflict (holiday already excluded)
   - Single-day half-day leave always shows 0.5 days

#### Known Limitations

1. **Holiday Overlap:** System allows creating duplicate holidays for same date/location (unique constraint prevents duplicates)
2. **Partial Holiday Support:** Current implementation excludes full holidays only; no support for half-day holidays
3. **Historical Data:** Changing holidays doesn't retroactively affect approved leave requests
4. **Region Migration:** Existing users without region field won't get holiday exclusions until region is populated

#### Technical Implementation Details

**Holiday Service Architecture:**
```typescript
// Holiday calculation integrated into leave service
export class LeaveService {
  async calculateWorkingDays(startDate, endDate, location) {
    // 1. Get all dates in range
    // 2. Exclude weekends (Saturday, Sunday)
    // 3. Fetch holidays from database for location and date range
    // 4. Exclude holiday dates
    // 5. Return count of remaining working days
  }
}
```

**Password Change Security:**
- Current password must be verified before change
- New password cannot match current password
- Passwords hashed with bcrypt (12 rounds)
- No password strength requirements (business decision)
- User logged out after change (forces re-login with new password)

**UI Color Scheme Consistency:**
- Add Holiday button: `#2196f3` (matches Add Employee)
- Save button: `#11998e` (matches Approve)
- Cancel button: `#f857a6` (matches Reject)
- All buttons use solid colors (no gradients)
- ToggleButton active state: `#677eea` (purple gradient color)

---

## Changelog

### v2.4.0 (November 6, 2025)
- **NEW:** Holiday Calendar management system with regional support (IND/US)
- **NEW:** Admin interface to create, edit, and delete holidays
- **NEW:** ToggleButton filters for Year and Location in Holiday Calendar
- **NEW:** Holiday-aware leave calculations excluding regional holidays
- **NEW:** First-time password reset requirement for new users
- **NEW:** Dedicated Change Password page with validation
- **NEW:** `mustChangePassword` flag added to User model
- **NEW:** Region field included in user login response
- **NEW:** Leave balance display in Apply Leaves dialog
- **NEW:** `/leaves/calculate-days` API endpoint with holiday exclusion
- **NEW:** `/holidays` API endpoints for CRUD operations
- **ENHANCEMENT:** Admin password reset triggers mandatory password change on next login
- **ENHANCEMENT:** Half-day calculations properly integrated with holiday exclusions
- **ENHANCEMENT:** Updated messaging: "Weekends and Regional Holidays are excluded"
- **ENHANCEMENT:** Query invalidation for leave-balances after mutations
- **ENHANCEMENT:** Holiday Calendar UI with white backgrounds on editable fields
- **ENHANCEMENT:** Custom color scheme matching existing approval buttons
- **FIX:** Authorization middleware bug - changed from array to rest parameters
- **FIX:** Region field missing from login response
- **FIX:** Half-day calculation checking wrong values ('half' vs 'first-half'/'second-half')
- **FIX:** Password change route error (POST vs PUT method mismatch)
- **FIX:** Removed password strength validation per business requirement
- **SECURITY:** Password change enforced via route protection
- **SECURITY:** Current password verification required before change

### v2.3.0 (November 5, 2025)
- **NEW:** Date of Joining field added to Employee Management (mandatory)
- **NEW:** Exit Date field added to Employee Management (optional)
- **NEW:** Gender-based leave filtering for Maternity Leave (ML) and Paternity Leave (PTL)
- **NEW:** ML only visible to Female employees (Gender = 'F')
- **NEW:** PTL only visible to Male employees (Gender = 'M')
- **ENHANCEMENT:** Excel import now supports Date of Joining and Exit Date columns
- **ENHANCEMENT:** Date fields displayed in View Employee modal
- **ENHANCEMENT:** Date parsing handles both Excel serial numbers and date strings
- **ENHANCEMENT:** Gender field now included in login response and synced from Employee to User
- **FIX:** Paternity Leave code corrected from "PAT" to "PTL" (actual database value)
- **FIX:** Gender field properly synced when creating LMS users from employee records
- **DOCUMENTATION:** Updated Employee schema with date fields
- **DOCUMENTATION:** Added database leave type codes reference
- Date fields positioned between Phone Number and Location in Excel uploads

### v2.2.0 (November 4, 2025)
- **NEW:** Actions column added to Employee My Leaves page with cancel functionality
- **NEW:** Employee self-service leave cancellation (PENDING/APPROVED, before start date)
- **NEW:** Cancel dialog with required reason for audit trail
- **ENHANCEMENT:** Center alignment for date, numeric, status, and action columns across all data grids
- **ENHANCEMENT:** Reduced button heights (py: 0.5, minHeight: auto) for cleaner UI
- **ENHANCEMENT:** Consistent row spacing and improved readability across all tables
- **FIX:** Syntax error in LeavesPage.tsx (extra closing brace after toLocaleDateString())
- **DOCUMENTATION:** Added Data Grid Layout Guidelines section
- **DOCUMENTATION:** Updated Employee role permissions
- **DOCUMENTATION:** Updated testing checklist with new features
- Improved user experience with uniform styling across Employee, Manager, and Admin views

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

**Last Updated:** November 6, 2025
**Version:** 2.4.0

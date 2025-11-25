import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  alpha,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ButtonGroup,
  Card,
  CardContent,
  MenuItem,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import {
  EventNote,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  WavingHand,
  CalendarToday,
  Refresh,
  Search,
  Visibility,
  Close,
  Add,
  People,
  Download,
  Info,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import EnhancedStatCard from '../components/EnhancedStatCard';
import EnhancedLeaveBalance from '../components/EnhancedLeaveBalance';
import GradientButton from '../components/GradientButton';
import GlassCard from '../components/GlassCard';
import { gradients } from '../theme/theme';

interface EmployeeWithBalances {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  location?: string;
  employmentType?: string;
  isActive: boolean;
  leaveBalances: Array<{
    leaveType: {
      name: string;
      leaveTypeCode: string;
    };
    allocated: number;
    used: number;
    pending: number;
    available: number;
  }>;
}

interface EmployeeLeaveDetails {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  leaves: Array<{
    id: string;
    leaveType: {
      name: string;
    };
    startDate: string;
    endDate: string;
    totalDays: number;
    status: string;
    reason: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const { user, isManager } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';
  const [searchText, setSearchText] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [rejectionDialog, setRejectionDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rejectionInfoDialog, setRejectionInfoDialog] = useState(false);
  const [selectedRejection, setSelectedRejection] = useState<any>(null);

  // Apply Leave Dialog States
  const [openApplyDialog, setOpenApplyDialog] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: dayjs(),
    endDate: dayjs(),
    reason: '',
    startDayType: 'full' as 'full' | 'first-half' | 'second-half',
    endDayType: 'full' as 'full' | 'first-half' | 'second-half',
  });
  const [calculatedDays, setCalculatedDays] = useState<number>(0);

  const queryClient = useQueryClient();

  // Fetch real leave balances (not for admin)
  const { data: balancesData, isLoading: balancesLoading, error: balancesError, refetch: refetchBalances } = useQuery({
    queryKey: ['leave-balances'],
    queryFn: async () => {
      const response = await api.get('/leave-balances');
      return response.data.data;
    },
    enabled: !isAdmin,
    retry: 2,
  });

  // Fetch recent leaves for employees/managers, or all leaves for admin stats
  const { data: leaves, isLoading: leavesLoading, error: leavesError } = useQuery({
    queryKey: ['recent-leaves'],
    queryFn: async () => {
      // For admin, fetch all leaves to calculate accurate stats
      if (isAdmin) {
        const response = await api.get('/admin/all-leaves');
        return response.data;
      }
      // For employees/managers, fetch only recent 10
      const response = await api.get('/leaves?limit=10');
      return response.data;
    },
    retry: 2,
  });

  // Fetch team members count for managers
  const { data: teamMembersCount } = useQuery({
    queryKey: ['team-members-count'],
    queryFn: async () => {
      if (!isManager || isAdmin) return 0;
      const response = await api.get('/leaves/team/members-count');
      return response.data.data.count;
    },
    enabled: isManager && !isAdmin,
    retry: 2,
  });

  // Fetch pending team leaves for managers (limit 10)
  const { data: pendingTeamLeaves, isLoading: teamLoading, refetch: refetchTeamLeaves } = useQuery({
    queryKey: ['pending-team-leaves'],
    queryFn: async () => {
      if (!isManager || isAdmin) return [];
      const response = await api.get('/leaves/team/all?status=PENDING');
      return response.data.data.slice(0, 10); // Only get latest 10 pending
    },
    enabled: isManager && !isAdmin,
    retry: 2,
  });

  // Fetch leave types for apply leave dialog
  const { data: leaveTypesData } = useQuery({
    queryKey: ['leave-types'],
    queryFn: async () => {
      const response = await api.get('/leave-balances/leave-types');
      return response.data.data;
    },
    enabled: !isAdmin,
  });

  // Filter leave types based on gender for ML/PTL leaves
  const leaveTypes = (leaveTypesData || []).filter((type: any) => {
    const leaveCode = type.leaveTypeCode;
    if (leaveCode === 'ML' && user?.gender !== 'F') return false;
    if (leaveCode === 'PTL' && user?.gender !== 'M') return false;
    return true;
  });

  // Calculate team stats for managers
  const teamStats = {
    totalMembers: teamMembersCount || 0,
    pendingApprovals: isManager && !isAdmin && pendingTeamLeaves
      ? pendingTeamLeaves.length
      : 0,
  };

  // Calculate working days excluding weekends
  const calculateWorkingDays = (
    start: Dayjs,
    end: Dayjs,
    startType: string,
    endType: string
  ): number => {
    let workingDays = 0;
    let currentDate = start.clone();

    while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
      const dayOfWeek = currentDate.day();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        if (currentDate.isSame(start, 'day')) {
          workingDays += startType === 'full' ? 1 : 0.5;
        } else if (currentDate.isSame(end, 'day') && !currentDate.isSame(start, 'day')) {
          workingDays += endType === 'full' ? 1 : 0.5;
        } else {
          workingDays += 1;
        }
      }
      currentDate = currentDate.add(1, 'day');
    }
    return workingDays;
  };

  // Recalculate days whenever dates or day types change (using API to exclude holidays)
  useEffect(() => {
    const calculateDaysWithHolidays = async () => {
      if (!formData.startDate || !formData.endDate || !user?.region) {
        return;
      }

      try {
        // Call API to calculate days excluding weekends and holidays
        const response = await api.post('/leaves/calculate-days', {
          startDate: formData.startDate.format('YYYY-MM-DD'),
          endDate: formData.endDate.format('YYYY-MM-DD'),
          location: user.region,
        });

        let days = response.data.data.totalDays;

        // Adjust for half days
        const isStartHalf = formData.startDayType !== 'full';
        const isEndHalf = formData.endDayType !== 'full';

        if (formData.startDate.isSame(formData.endDate, 'day')) {
          // Single day leave
          if (isStartHalf || isEndHalf) {
            days = 0.5;
          }
        } else {
          // Multi-day leave with half days
          if (isStartHalf) {
            days -= 0.5;
          }
          if (isEndHalf) {
            days -= 0.5;
          }
        }

        setCalculatedDays(days);
      } catch (error) {
        console.error('Error calculating days:', error);
        // Fallback to local calculation if API fails
        const days = calculateWorkingDays(
          formData.startDate,
          formData.endDate,
          formData.startDayType,
          formData.endDayType
        );
        setCalculatedDays(days);
      }
    };

    calculateDaysWithHolidays();
  }, [formData.startDate, formData.endDate, formData.startDayType, formData.endDayType, user?.region]);

  // Create leave mutation
  const createLeaveMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/leaves', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Leave request submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['recent-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      handleCloseApplyDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit leave request');
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (leaveId: string) => {
      const response = await api.post(`/leaves/${leaveId}/approve`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Leave request approved successfully!');
      refetchTeamLeaves();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve leave');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ leaveId, reason }: { leaveId: string; reason: string }) => {
      const response = await api.post(`/leaves/${leaveId}/reject`, {
        rejectionReason: reason,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Leave request rejected');
      refetchTeamLeaves();
      setRejectionDialog(false);
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject leave');
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async ({ leaveId, reason }: { leaveId: string; reason: string }) => {
      const response = await api.post(`/leaves/${leaveId}/cancel`, {
        reason,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Leave request cancelled successfully');
      // Refetch appropriate data based on user role
      if (isManager && !isAdmin) {
        refetchTeamLeaves();
      }
      // Refetch employee's own leaves (works for both employees and managers)
      queryClient.invalidateQueries({ queryKey: ['recent-leaves'] });
      setCancelDialog(false);
      setCancelReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel leave');
    },
  });

  // Fetch employees with leave balances (admin only)
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees-with-balances'],
    queryFn: async () => {
      const response = await api.get('/admin/employees-with-balances');
      return response.data.data;
    },
    enabled: isAdmin,
    retry: 2,
  });

  // Fetch employee leave details
  const { data: employeeDetailsData, isLoading: detailsLoading } = useQuery({
    queryKey: ['employee-leave-details', selectedEmployee],
    queryFn: async () => {
      if (!selectedEmployee) return null;
      const response = await api.get(`/admin/employee-leaves/${selectedEmployee}`);
      return response.data.data;
    },
    enabled: !!selectedEmployee && detailsModalOpen,
    retry: 2,
  });

  if (leavesLoading || (!isAdmin && balancesLoading) || (isAdmin && employeesLoading)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (leavesError || (!isAdmin && balancesError)) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load dashboard data. Please try refreshing the page.
        </Alert>
      </Box>
    );
  }

  // Calculate stats - for admin, show accurate YTD counts
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1); // January 1st of current year

  const allLeaves = leaves?.data || [];

  // Total pending requests (current status)
  const pendingCount = allLeaves.filter((l: any) => l.status === 'PENDING').length || 0;

  // Total approved requests from January 1st till date
  const approvedCount = allLeaves.filter((l: any) => {
    if (l.status !== 'APPROVED') return false;
    // Check if created this year
    const createdDate = new Date(l.createdAt);
    return createdDate >= yearStart;
  }).length || 0;

  // Total rejected requests from January 1st till date
  const rejectedCount = allLeaves.filter((l: any) => {
    if (l.status !== 'REJECTED') return false;
    // Check if created this year
    const createdDate = new Date(l.createdAt);
    return createdDate >= yearStart;
  }).length || 0;

  const totalRequests = allLeaves.length || 0;

  // Filter balances based on gender for ML/PTL leaves and hide LWP
  const allBalances = Array.isArray(balancesData) ? balancesData : [];
  const balances = allBalances.filter((balance: any) => {
    const leaveCode = balance.leaveType?.leaveTypeCode;

    // Hide Leave Without Pay (LWP)
    if (leaveCode === 'LWP') {
      return false;
    }

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

  const totalAllocated = balances.reduce((sum: number, b: any) => sum + b.allocated, 0);
  const totalUsed = balances.reduce((sum: number, b: any) => sum + b.used, 0);
  const totalAvailable = balances.reduce((sum: number, b: any) => sum + b.available, 0);

  const handleViewEmployee = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    setDetailsModalOpen(true);
  };

  const handleCloseModal = () => {
    setDetailsModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleApprove = (leaveId: string) => {
    approveMutation.mutate(leaveId);
  };

  const handleRejectClick = (leaveId: string) => {
    setSelectedLeave({ id: leaveId });
    setRejectionDialog(true);
  };

  const handleRejectSubmit = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    rejectMutation.mutate({
      leaveId: selectedLeave.id,
      reason: rejectionReason,
    });
  };

  const handleCancelClick = (leaveId: string) => {
    setSelectedLeave({ id: leaveId });
    setCancelDialog(true);
  };

  const handleCancelSubmit = () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    cancelMutation.mutate({
      leaveId: selectedLeave.id,
      reason: cancelReason,
    });
  };

  const canCancelLeave = (leave: any) => {
    // Allow cancellation for PENDING and APPROVED leaves only
    if (!['PENDING', 'APPROVED'].includes(leave.status)) return false;
    // Check if start date has not elapsed
    const startDate = new Date(leave.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return startDate >= today;
  };

  // Apply Leave Dialog Handlers
  const resetApplyForm = () => {
    setFormData({
      leaveTypeId: '',
      startDate: dayjs(),
      endDate: dayjs(),
      reason: '',
      startDayType: 'full',
      endDayType: 'full',
    });
    setCalculatedDays(0);
  };

  const handleOpenApplyDialog = () => {
    resetApplyForm();
    setDialogKey(prev => prev + 1);
    setOpenApplyDialog(true);
  };

  const handleCloseApplyDialog = () => {
    resetApplyForm();
    setOpenApplyDialog(false);
  };

  const handleSubmitApplyLeave = () => {
    if (!formData.leaveTypeId || !formData.reason.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    if (calculatedDays <= 0) {
      toast.error('Invalid date selection. Please check your dates.');
      return;
    }

    const isSameDay = formData.startDate.isSame(formData.endDate, 'day');
    const isHalfDay = isSameDay && (formData.startDayType !== 'full' || formData.endDayType !== 'full');
    const halfDayType = isHalfDay ? (formData.startDayType !== 'full' ? formData.startDayType : formData.endDayType) : null;

    createLeaveMutation.mutate({
      leaveTypeCode: formData.leaveTypeId,
      startDate: formData.startDate.toISOString(),
      endDate: formData.endDate.toISOString(),
      reason: formData.reason,
      isHalfDay: isHalfDay,
      halfDayType: halfDayType,
      totalDays: calculatedDays,
      startDayType: formData.startDayType,
      endDayType: formData.endDayType,
    });
  };

  // Handle refresh all data
  const handleRefreshAll = () => {
    refetchBalances();
    queryClient.invalidateQueries({ queryKey: ['recent-leaves'] });
    if (isManager && !isAdmin) {
      refetchTeamLeaves();
    }
    toast.success('Data refreshed successfully!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return { color: 'success' as const };
      case 'REJECTED':
        return { color: 'error' as const };
      case 'PENDING':
        return {
          sx: {
            backgroundColor: '#ed6c02 !important',
            color: '#fff !important',
          }
        };
      case 'CANCELLED':
        return { color: 'default' as const };
      default:
        return { color: 'default' as const };
    }
  };

  // Filter employees by search text
  const filteredEmployees = (employeesData || []).filter((emp: EmployeeWithBalances) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const search = searchText.toLowerCase();
    return fullName.includes(search) || emp.employeeId.toLowerCase().includes(search);
  });

  // Export to Excel function
  const handleExportToExcel = () => {
    try {
      // Get all unique leave type codes from the data
      const leaveTypeCodes = Array.from(new Set(
        (employeesData || []).flatMap((emp: EmployeeWithBalances) =>
          (emp.leaveBalances || []).map(lb => lb.leaveType.leaveTypeCode)
        )
      )).sort();

      // Prepare data for export
      const exportData = filteredEmployees.map((emp: EmployeeWithBalances) => {
        const row: any = {
          'Employee ID': emp.employeeId,
          'Employee Name': `${emp.firstName} ${emp.lastName}`,
          'Location': emp.location || '-',
          'Employment Type': emp.employmentType || '-',
        };

        // Add leave balances as columns
        leaveTypeCodes.forEach((leaveCode: any) => {
          const balance = emp.leaveBalances.find(lb => lb.leaveType.leaveTypeCode === leaveCode);
          const columnName = leaveCode === 'COMP' ? 'COMP OFF' : leaveCode;
          row[columnName] = balance?.available || 0;
        });

        return row;
      });

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 15 }, // Employee ID
        { wch: 25 }, // Employee Name
        { wch: 15 }, // Location
        { wch: 18 }, // Employment Type
        ...leaveTypeCodes.map(() => ({ wch: 12 })), // Leave balance columns
      ];
      worksheet['!cols'] = columnWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Leave Balances');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Employee_Leave_Balances_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      toast.success(`Exported ${filteredEmployees.length} employee records to Excel`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data to Excel');
    }
  };

  // Admin Dashboard
  if (isAdmin) {
    // Define columns for employee grid
    const columns: GridColDef[] = [
      {
        field: 'employeeId',
        headerName: 'Employee ID',
        width: 120,
        headerClassName: 'datagrid-header',
      },
      {
        field: 'fullName',
        headerName: 'Employee Name',
        width: 200,
        headerClassName: 'datagrid-header',
        valueGetter: (value: any, row: any) => `${row.firstName} ${row.lastName}`,
      },
      {
        field: 'location',
        headerName: 'Location',
        width: 130,
        headerClassName: 'datagrid-header',
      },
      {
        field: 'employmentType',
        headerName: 'Employment Type',
        width: 140,
        headerClassName: 'datagrid-header',
      },
      ...Array.from(new Set(
        (employeesData || []).flatMap((emp: EmployeeWithBalances) =>
          (emp.leaveBalances || []).map(lb => lb.leaveType.leaveTypeCode)
        )
      )).map((leaveCode: any) => ({
        field: `balance_${leaveCode}`,
        headerName: leaveCode === 'COMP' ? 'COMP OFF' : leaveCode,
        width: 100,
        headerClassName: 'datagrid-header',
        renderCell: (params: GridRenderCellParams) => {
          const balance = (params.row.leaveBalances || []).find((lb: any) => lb.leaveType.leaveTypeCode === leaveCode);
          return (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {balance?.available || 0}
              </Typography>
            </Box>
          );
        },
      })),
      {
        field: 'actions',
        headerName: 'Actions',
        width: 100,
        headerClassName: 'datagrid-header',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => (
          <Tooltip title="View Details">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleViewEmployee(params.row.employeeId)}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ];

    return (
      <Box>
        {/* Welcome Header */}
        <Box
          sx={{
            background: gradients.primary,
            borderRadius: 3,
            p: 3,
            mb: 4,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(103, 126, 234, 0.3)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <WavingHand sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                Welcome back, {user?.firstName} {user?.lastName}!
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Admin Dashboard - Manage and monitor all leave requests
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Admin Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <EnhancedStatCard
              title="Total Pending Requests"
              value={pendingCount}
              subtitle="Current pending count"
              icon={<HourglassEmpty />}
              gradientType="orange"
              delay={0}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <EnhancedStatCard
              title="Total Approved Requests YTD"
              value={approvedCount}
              subtitle={`From Jan ${currentYear} till date`}
              icon={<CheckCircle />}
              gradientType="success"
              delay={0.1}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <EnhancedStatCard
              title="Total Rejected Requests YTD"
              value={rejectedCount}
              subtitle={`From Jan ${currentYear} till date`}
              icon={<Cancel />}
              gradientType="red"
              delay={0.2}
            />
          </Grid>
        </Grid>

        {/* Employee Leave Balances Grid */}
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Active Employees & Leave Balances
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleExportToExcel}
                disabled={filteredEmployees.length === 0}
                sx={{
                  bgcolor: '#388e3c !important',
                  background: '#388e3c !important',
                  backgroundImage: 'none !important',
                  color: '#ffffff !important',
                  fontWeight: 700,
                  textTransform: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  border: '2px solid #388e3c',
                  px: 3,
                  py: 1,
                  '&:hover': {
                    bgcolor: '#2e7d32 !important',
                    background: '#2e7d32 !important',
                    backgroundImage: 'none !important',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  },
                  '&:disabled': {
                    bgcolor: 'rgba(0, 0, 0, 0.12) !important',
                    background: 'rgba(0, 0, 0, 0.12) !important',
                    backgroundImage: 'none !important',
                    color: 'rgba(0, 0, 0, 0.26) !important',
                    border: '2px solid rgba(0, 0, 0, 0.12)',
                  },
                }}
              >
                Export Excel
              </Button>
              <TextField
                placeholder="Search by employee name or ID..."
                size="small"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                sx={{ width: 300 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>

          <DataGrid
            rows={filteredEmployees}
            columns={columns}
            getRowId={(row) => row.employeeId}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight
            sx={{
              '& .datagrid-header': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                fontWeight: 600,
              },
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
              },
            }}
          />
        </Paper>

        {/* Employee Details Modal */}
        <Dialog
          open={detailsModalOpen}
          onClose={handleCloseModal}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1, fontSize: '1.5rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>Employee Leave Details</Box>
            <IconButton onClick={handleCloseModal} size="small">
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {detailsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : employeeDetailsData ? (
              <Box>
                <Box sx={{ mb: 3, p: 2, background: alpha('#667eea', 0.05), borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {employeeDetailsData.firstName} {employeeDetailsData.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {employeeDetailsData.employeeId} • {employeeDetailsData.email}
                  </Typography>
                </Box>

                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Leave History
                </Typography>

                {employeeDetailsData.leaves.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No leave records found
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {employeeDetailsData.leaves.map((leave: any) => (
                      <Paper
                        key={leave.id}
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: alpha('#667eea', 0.1),
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {leave.leaveType.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}
                            </Typography>
                          </Box>
                          <Chip
                            label={leave.status}
                            size="small"
                            sx={{
                              background:
                                leave.status === 'APPROVED'
                                  ? gradients.green
                                  : leave.status === 'PENDING'
                                  ? gradients.orange
                                  : leave.status === 'REJECTED'
                                  ? gradients.red
                                  : gradients.blue,
                              color: '#fff',
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                        {leave.reason && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            Reason: {leave.reason}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          Applied on: {new Date(leave.createdAt).toLocaleDateString()}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            ) : (
              <Alert severity="error">Failed to load employee details</Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseModal}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Employee/Manager Dashboard
  return (
    <Box>
      {/* Welcome Header */}
      <Box
        sx={{
          background: gradients.primary,
          borderRadius: 3,
          p: 3,
          mb: 4,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 8px 32px rgba(103, 126, 234, 0.3)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <WavingHand sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              Welcome back, {user?.firstName} {user?.lastName}!
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Have a great day! Your leave management overview for today.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <GradientButton gradientType="success" startIcon={<Add />} onClick={handleOpenApplyDialog}>
            Apply Leaves
          </GradientButton>
          <GradientButton gradientType="secondary" startIcon={<Refresh />} onClick={handleRefreshAll}>
            Refresh
          </GradientButton>
        </Box>
      </Box>

      {/* Your Leave Balances */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CalendarToday fontSize="small" />
        Your Leave Balances
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Leave Balance Card */}
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <EnhancedStatCard
            title="Total Balance"
            value={totalAvailable}
            subtitle="Days"
            icon={<CalendarToday />}
            gradientType="purple"
            delay={0}
            compact
          />
        </Grid>

        {/* Individual Leave Type Cards - Show all (up to 6) */}
        {balances.slice(0, 6).map((balance: any, index: number) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={balance.leaveType.leaveTypeCode}>
            <EnhancedStatCard
              title={balance.leaveType.name}
              value={balance.available || 0}
              subtitle="Days"
              icon={<EventNote />}
              gradientType={
                index === 0 ? 'blue' :
                index === 1 ? 'green' :
                index === 2 ? 'pink' :
                index === 3 ? 'orange' :
                index === 4 ? 'teal' :
                'purple'
              }
              delay={0.05 * (index + 1)}
              compact
            />
          </Grid>
        ))}
      </Grid>

      {/* My Leave Requests Grid */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            My Leave Requests
          </Typography>

          {leavesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : leaves?.data && leaves.data.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Leave Type</TableCell>
                    <TableCell align="center">Start Date</TableCell>
                    <TableCell align="center">End Date</TableCell>
                    <TableCell align="center">Days</TableCell>
                    <TableCell align="center">Applied On</TableCell>
                    <TableCell>Approver</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaves.data.map((leave: any) => {
                    const canCancel = canCancelLeave(leave);
                    return (
                      <TableRow key={leave.id}>
                        <TableCell>{leave.leaveType?.name}</TableCell>
                        <TableCell align="center">
                          {new Date(leave.startDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="center">
                          {new Date(leave.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="center">{leave.totalDays}</TableCell>
                        <TableCell align="center">
                          {leave.appliedDate
                            ? new Date(leave.appliedDate).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            // Check if there's an approval record with an approver
                            if (leave.approvals && leave.approvals.length > 0) {
                              const latestApproval = leave.approvals[0];
                              if (latestApproval.approver) {
                                return `${latestApproval.approver.firstName} ${latestApproval.approver.lastName}`;
                              }
                            }
                            // Fall back to reporting manager
                            if (leave.user?.manager) {
                              return `${leave.user.manager.firstName} ${leave.user.manager.lastName}`;
                            }
                            return 'N/A';
                          })()}
                        </TableCell>
                        <TableCell>
                          {leave.reason.substring(0, 30)}
                          {leave.reason.length > 30 && '...'}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={leave.status}
                            size="small"
                            {...getStatusColor(leave.status)}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {canCancel ? (
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
                          ) : leave.status === 'REJECTED' ? (
                            <Info
                              sx={{
                                fontSize: 20,
                                color: '#f857a6',
                                cursor: 'pointer',
                                '&:hover': {
                                  color: '#c62828',
                                },
                              }}
                              onClick={() => {
                                setSelectedRejection(leave);
                                setRejectionInfoDialog(true);
                              }}
                            />
                          ) : (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              -
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <EventNote sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.3 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No leave requests found
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Team Management Section - Only for Managers */}
      {isManager && (
        <Box sx={{ mt: 4 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <People fontSize="small" />
            Team Management
          </Typography>

          {/* Team Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <GlassCard
                sx={{
                  p: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: gradients.orange,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: `0 4px 12px ${alpha('#000', 0.15)}`,
                  }}
                >
                  <People />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {teamStats.totalMembers}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Total Team Members
                  </Typography>
                </Box>
              </GlassCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <GlassCard
                sx={{
                  p: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: gradients.pink,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: `0 4px 12px ${alpha('#000', 0.15)}`,
                  }}
                >
                  <HourglassEmpty />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {teamStats.pendingApprovals}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Pending Approvals
                  </Typography>
                </Box>
              </GlassCard>
            </Grid>
          </Grid>

          {/* Pending Leave Requests Grid */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                Pending Leave Requests
              </Typography>

              {teamLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : pendingTeamLeaves && pendingTeamLeaves.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee ID</TableCell>
                        <TableCell>Employee</TableCell>
                        <TableCell>Leave Type</TableCell>
                        <TableCell align="center">Start Date</TableCell>
                        <TableCell align="center">End Date</TableCell>
                        <TableCell align="center">Days</TableCell>
                        <TableCell align="center">Applied On</TableCell>
                        <TableCell>Approver</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingTeamLeaves.map((leave: any) => (
                        <TableRow key={leave.id}>
                          <TableCell>{leave.user.employeeId}</TableCell>
                          <TableCell>
                            {leave.user.firstName} {leave.user.lastName}
                          </TableCell>
                          <TableCell>{leave.leaveType.name}</TableCell>
                          <TableCell align="center">
                            {new Date(leave.startDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="center">
                            {new Date(leave.endDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="center">{leave.totalDays}</TableCell>
                          <TableCell align="center">
                            {leave.appliedDate
                              ? new Date(leave.appliedDate).toLocaleDateString()
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              // Check if there's an approval record with an approver
                              if (leave.approvals && leave.approvals.length > 0) {
                                const latestApproval = leave.approvals[0];
                                if (latestApproval.approver) {
                                  return `${latestApproval.approver.firstName} ${latestApproval.approver.lastName}`;
                                }
                              }
                              // Fall back to reporting manager
                              if (leave.user?.manager) {
                                return `${leave.user.manager.firstName} ${leave.user.manager.lastName}`;
                              }
                              return 'N/A';
                            })()}
                          </TableCell>
                          <TableCell>
                            {leave.reason.substring(0, 30)}
                            {leave.reason.length > 30 && '...'}
                          </TableCell>
                          <TableCell align="center">
                            <ButtonGroup size="small">
                              <Button
                                startIcon={<CheckCircle />}
                                onClick={() => handleApprove(leave.id)}
                                disabled={approveMutation.isPending}
                                sx={{
                                  color: '#fff !important',
                                  backgroundColor: '#11998e !important',
                                  backgroundImage: 'none !important',
                                  py: 0.5,
                                  minHeight: 'auto',
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
                              >
                                Approve
                              </Button>
                              <Button
                                startIcon={<Cancel />}
                                onClick={() => handleRejectClick(leave.id)}
                                disabled={rejectMutation.isPending}
                                sx={{
                                  color: '#fff !important',
                                  backgroundColor: '#f857a6 !important',
                                  backgroundImage: 'none !important',
                                  py: 0.5,
                                  minHeight: 'auto',
                                  '&:hover': {
                                    backgroundColor: '#c62828 !important',
                                    backgroundImage: 'none !important',
                                  },
                                  '&:disabled': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.12) !important',
                                    color: 'rgba(0, 0, 0, 0.26) !important',
                                    backgroundImage: 'none !important',
                                  },
                                }}
                              >
                                Reject
                              </Button>
                            </ButtonGroup>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <HourglassEmpty sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.3 }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No pending leave requests
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialog} onClose={() => setRejectionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Leave Request</DialogTitle>
        <DialogContent>
          <TextField
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            multiline
            rows={4}
            fullWidth
            required
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionDialog(false)}>Cancel</Button>
          <Button
            onClick={handleRejectSubmit}
            variant="contained"
            color="error"
            disabled={rejectMutation.isPending}
          >
            {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Info Dialog */}
      <Dialog open={rejectionInfoDialog} onClose={() => setRejectionInfoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rejection Details</DialogTitle>
        <DialogContent>
          {selectedRejection && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Leave Type
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedRejection.leaveType?.name}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Leave Period
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {new Date(selectedRejection.startDate).toLocaleDateString()} - {new Date(selectedRejection.endDate).toLocaleDateString()} ({selectedRejection.totalDays} {selectedRejection.totalDays === 1 ? 'day' : 'days'})
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Rejected By
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedRejection.approvals && selectedRejection.approvals.length > 0 && selectedRejection.approvals.find((a: any) => a.status === 'REJECTED')
                  ? `${selectedRejection.approvals.find((a: any) => a.status === 'REJECTED').approver?.firstName} ${selectedRejection.approvals.find((a: any) => a.status === 'REJECTED').approver?.lastName}`
                  : 'N/A'}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Rejection Date
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedRejection.rejectedDate
                  ? new Date(selectedRejection.rejectedDate).toLocaleString()
                  : selectedRejection.approvals && selectedRejection.approvals.length > 0 && selectedRejection.approvals.find((a: any) => a.status === 'REJECTED')?.rejectedDate
                  ? new Date(selectedRejection.approvals.find((a: any) => a.status === 'REJECTED').rejectedDate).toLocaleString()
                  : 'N/A'}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Rejection Reason
              </Typography>
              <Paper sx={{ p: 2, bgcolor: '#fef0f0', border: '1px solid #f857a6' }}>
                <Typography variant="body1">
                  {selectedRejection.rejectionReason ||
                    (selectedRejection.approvals && selectedRejection.approvals.length > 0 && selectedRejection.approvals.find((a: any) => a.status === 'REJECTED')?.comments) ||
                    'No reason provided'}
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionInfoDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Approved Leave</DialogTitle>
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

      {/* Apply Leave Dialog */}
      <Dialog open={openApplyDialog} onClose={handleCloseApplyDialog} maxWidth="md" fullWidth>
        <DialogTitle>Apply Leaves</DialogTitle>
        <DialogContent key={dialogKey}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
              <TextField
                select
                label="Leave Type"
                value={formData.leaveTypeId}
                onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                fullWidth
                required
              >
                {leaveTypes?.map((type: any) => (
                  <MenuItem key={type.leaveTypeCode} value={type.leaveTypeCode}>
                    {type.name}
                  </MenuItem>
                ))}
              </TextField>

              {/* Show current balance when leave type is selected */}
              {formData.leaveTypeId && balancesData && (
                <Alert severity="success" sx={{ py: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Current Balance: {' '}
                    {(() => {
                      const balance = balancesData.find((b: any) => b.leaveType?.leaveTypeCode === formData.leaveTypeId);
                      return balance ? `${balance.available} ${balance.available === 1 ? 'day' : 'days'}` : 'N/A';
                    })()}
                  </Typography>
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <DatePicker
                  label="Start Date"
                  value={formData.startDate}
                  onChange={(date) => setFormData({ ...formData, startDate: date || dayjs() })}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />

                <DatePicker
                  label="End Date"
                  value={formData.endDate}
                  onChange={(date) => setFormData({ ...formData, endDate: date || dayjs() })}
                  minDate={formData.startDate}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 3 }}>
                <FormControl component="fieldset" sx={{ flex: 1 }}>
                  <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.9rem' }}>
                    Start Date Type
                  </FormLabel>
                  <RadioGroup
                    row
                    value={formData.startDayType}
                    onChange={(e) => setFormData({ ...formData, startDayType: e.target.value as any })}
                  >
                    <FormControlLabel value="full" control={<Radio size="small" />} label="Full Day" />
                    <FormControlLabel value="first-half" control={<Radio size="small" />} label="First Half" />
                    <FormControlLabel value="second-half" control={<Radio size="small" />} label="Second Half" />
                  </RadioGroup>
                </FormControl>

                <FormControl component="fieldset" sx={{ flex: 1 }}>
                  <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.9rem' }}>
                    End Date Type
                  </FormLabel>
                  <RadioGroup
                    row
                    value={formData.endDayType}
                    onChange={(e) => setFormData({ ...formData, endDayType: e.target.value as any })}
                  >
                    <FormControlLabel value="full" control={<Radio size="small" />} label="Full Day" />
                    <FormControlLabel value="first-half" control={<Radio size="small" />} label="First Half" />
                    <FormControlLabel value="second-half" control={<Radio size="small" />} label="Second Half" />
                  </RadioGroup>
                </FormControl>
              </Box>

              <Alert severity="info" sx={{ py: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Total Working Days: {calculatedDays} {calculatedDays === 1 ? 'day' : 'days'}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                  Weekends (Saturday & Sunday) and Regional Holidays (IND/US) are excluded from the calculation
                </Typography>
              </Alert>

              <TextField
                label="Reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                multiline
                rows={4}
                fullWidth
                required
                placeholder="Please provide a reason for your leave request"
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseApplyDialog}>Cancel</Button>
          <Button
            onClick={handleSubmitApplyLeave}
            variant="contained"
            disabled={createLeaveMutation.isPending}
          >
            {createLeaveMutation.isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

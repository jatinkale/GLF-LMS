import { useState } from 'react';
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
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
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

  // Fetch recent leaves
  const { data: leaves, isLoading: leavesLoading, error: leavesError } = useQuery({
    queryKey: ['recent-leaves'],
    queryFn: async () => {
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

  // Calculate team stats for managers
  const teamStats = {
    totalMembers: teamMembersCount || 0,
    pendingApprovals: isManager && !isAdmin && pendingTeamLeaves
      ? pendingTeamLeaves.length
      : 0,
  };

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
      refetchTeamLeaves();
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

  const totalRequests = leaves?.data?.length || 0;
  const approvedCount = leaves?.data?.filter((l: any) => l.status === 'APPROVED').length || 0;
  const pendingCount = leaves?.data?.filter((l: any) => l.status === 'PENDING').length || 0;
  const rejectedCount = leaves?.data?.filter((l: any) => l.status === 'REJECTED').length || 0;

  const balances = Array.isArray(balancesData) ? balancesData : [];
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
    if (leave.status !== 'APPROVED') return false;
    const startDate = new Date(leave.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return startDate >= today;
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
              subtitle="Awaiting approval"
              icon={<HourglassEmpty />}
              gradientType="pink"
              delay={0}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <EnhancedStatCard
              title="Total Approved Requests YTD"
              value={approvedCount}
              subtitle="Year to date"
              icon={<CheckCircle />}
              gradientType="green"
              delay={0.1}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <EnhancedStatCard
              title="Total Rejected Requests YTD"
              value={rejectedCount}
              subtitle="Year to date"
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
          <GradientButton gradientType="green" startIcon={<Add />} onClick={() => navigate('/leaves')}>
            Apply Leaves
          </GradientButton>
          <GradientButton gradientType="secondary" startIcon={<Refresh />} onClick={() => refetchBalances()}>
            Refresh
          </GradientButton>
        </Box>
      </Box>

      {/* Your Leave Balances */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CalendarToday fontSize="small" />
        Your Leave Balances
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {/* Total Leave Balance Card */}
        <Grid item xs={12} sm={6} md={4} lg={1.71}>
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
          <Grid item xs={12} sm={6} md={4} lg={1.71} key={balance.leaveType.leaveTypeCode}>
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

      <Grid container spacing={3}>
        {/* Enhanced Leave Balance */}
        <Grid item xs={12} md={6}>
          <EnhancedLeaveBalance balances={balances} onRefresh={refetchBalances} />
        </Grid>

        {/* Recent Leave Activity */}
        <Grid item xs={12} md={6}>
          <GlassCard sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Recent Leave Activity
              </Typography>
            </Box>

            {leaves?.data?.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <CalendarToday sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.3 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No recent activity
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                  Your leave history will appear here
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {leaves?.data?.slice(0, 5).map((leave: any, index: number) => (
                  <Box
                    key={leave.id}
                    sx={{
                      p: 2,
                      background: alpha('#f5f7fa', 0.5),
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: alpha('#667eea', 0.1),
                      transition: 'all 0.3s',
                      animation: `slideIn 0.4s ease-out ${index * 0.05}s both`,
                      '@keyframes slideIn': {
                        '0%': { opacity: 0, transform: 'translateX(20px)' },
                        '100%': { opacity: 1, transform: 'translateX(0)' },
                      },
                      '&:hover': {
                        borderColor: alpha('#667eea', 0.3),
                        transform: 'translateX(-4px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {leave.leaveType?.name || 'Unknown Type'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
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
                              : gradients.red,
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </GlassCard>
        </Grid>
      </Grid>

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
                        <TableCell>Start Date</TableCell>
                        <TableCell>End Date</TableCell>
                        <TableCell>Days</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Actions</TableCell>
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
                          <TableCell>
                            {new Date(leave.startDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(leave.endDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{leave.totalDays}</TableCell>
                          <TableCell>
                            {leave.reason.substring(0, 30)}
                            {leave.reason.length > 30 && '...'}
                          </TableCell>
                          <TableCell>
                            <ButtonGroup size="small">
                              <Button
                                startIcon={<CheckCircle />}
                                onClick={() => handleApprove(leave.id)}
                                disabled={approveMutation.isPending}
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
    </Box>
  );
}

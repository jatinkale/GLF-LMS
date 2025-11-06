import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
} from '@mui/material';
import { Add, Cancel, FilterList } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';
import api from '../config/api';
import { useAuth } from '../contexts/AuthContext';

export default function LeavesPage() {
  const { user } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
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
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);

  // Filter states
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);

  const queryClient = useQueryClient();

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
      const dayOfWeek = currentDate.day(); // 0 = Sunday, 6 = Saturday

      // Skip weekends (Saturday = 6, Sunday = 0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // First day
        if (currentDate.isSame(start, 'day')) {
          workingDays += startType === 'full' ? 1 : 0.5;
        }
        // Last day (if different from first day)
        else if (currentDate.isSame(end, 'day') && !currentDate.isSame(start, 'day')) {
          workingDays += endType === 'full' ? 1 : 0.5;
        }
        // Days in between
        else {
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
        const isStartHalf = formData.startDayType === 'first-half' || formData.startDayType === 'second-half';
        const isEndHalf = formData.endDayType === 'first-half' || formData.endDayType === 'second-half';

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

  // Fetch leaves
  const { data: leaves, isLoading } = useQuery({
    queryKey: ['leaves'],
    queryFn: async () => {
      const response = await api.get('/leaves');
      return response.data.data;
    },
  });

  // Fetch leave balances
  const { data: balancesData } = useQuery({
    queryKey: ['leave-balances'],
    queryFn: async () => {
      const response = await api.get('/leave-balances');
      return response.data.data;
    },
  });

  // Fetch leave types
  const { data: leaveTypesData } = useQuery({
    queryKey: ['leave-types'],
    queryFn: async () => {
      const response = await api.get('/leave-balances/leave-types');
      return response.data.data;
    },
  });

  // Filter leave types based on gender for ML/PTL leaves
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

  // Create leave mutation
  const createLeaveMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/leaves', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Leave request submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit leave request');
    },
  });

  // Cancel leave mutation
  const cancelMutation = useMutation({
    mutationFn: async ({ leaveId, reason }: { leaveId: string; reason: string }) => {
      const response = await api.post(`/leaves/${leaveId}/cancel`, { reason });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Leave request cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      setCancelDialog(false);
      setCancelReason('');
      setSelectedLeaveId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel leave');
    },
  });

  const canCancelLeave = (leave: any) => {
    if (!['PENDING', 'APPROVED'].includes(leave.status)) return false;
    const startDate = new Date(leave.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return startDate >= today;
  };

  const handleCancelClick = (leaveId: string) => {
    setSelectedLeaveId(leaveId);
    setCancelDialog(true);
  };

  const handleCancelSubmit = () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }
    if (selectedLeaveId) {
      cancelMutation.mutate({ leaveId: selectedLeaveId, reason: cancelReason });
    }
  };

  const resetForm = () => {
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

  const handleOpenDialog = () => {
    resetForm();
    setDialogKey(prev => prev + 1); // Force dialog content to remount
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    resetForm();
    setOpenDialog(false);
  };

  const handleSubmit = () => {
    if (!formData.leaveTypeId || !formData.reason.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    if (calculatedDays <= 0) {
      toast.error('Invalid date selection. Please check your dates.');
      return;
    }

    // Determine if it's a half day leave (either start or end is half day and they're the same day)
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

  // Filter leaves based on all filter criteria
  const filteredLeaves = leaves?.filter((leave: any) => {
    // Leave Type filter
    if (leaveTypeFilter !== 'all' && leave.leaveType?.leaveTypeCode !== leaveTypeFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && leave.status !== statusFilter) {
      return false;
    }

    // Date range filter - check if leave start/end date falls within the filter range
    const leaveStartDate = dayjs(leave.startDate);
    const leaveEndDate = dayjs(leave.endDate);

    if (fromDate) {
      // Leave must end on or after the fromDate
      if (leaveEndDate.isBefore(fromDate, 'day')) {
        return false;
      }
    }

    if (toDate) {
      // Leave must start on or before the toDate
      if (leaveStartDate.isAfter(toDate, 'day')) {
        return false;
      }
    }

    return true;
  }) || [];

  // Clear all filters
  const handleClearFilters = () => {
    setLeaveTypeFilter('all');
    setStatusFilter('all');
    setFromDate(null);
    setToDate(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
        return 'default';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">My Leaves</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenDialog}
        >
          Apply Leaves
        </Button>
      </Box>

      {/* Filters Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterList sx={{ color: 'text.secondary' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Filters
            </Typography>
          </Box>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Leave Type Filter */}
              <TextField
                select
                label="Leave Type"
                value={leaveTypeFilter}
                onChange={(e) => setLeaveTypeFilter(e.target.value)}
                sx={{ minWidth: 200 }}
                size="small"
              >
                <MenuItem value="all">All Leave Types</MenuItem>
                {leaveTypes?.map((type: any) => (
                  <MenuItem key={type.leaveTypeCode} value={type.leaveTypeCode}>
                    {type.name}
                  </MenuItem>
                ))}
              </TextField>

              {/* Status Filter */}
              <TextField
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ minWidth: 180 }}
                size="small"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </TextField>

              {/* From Date Filter */}
              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={(date) => setFromDate(date)}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: { minWidth: 180 },
                  },
                }}
              />

              {/* To Date Filter */}
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={(date) => setToDate(date)}
                minDate={fromDate || undefined}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: { minWidth: 180 },
                  },
                }}
              />

              {/* Clear Filters Button */}
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                sx={{ height: 40 }}
              >
                Clear Filters
              </Button>

              {/* Results Count */}
              <Typography variant="body2" sx={{ color: 'text.secondary', ml: 'auto' }}>
                Showing {filteredLeaves.length} of {leaves?.length || 0} leave{leaves?.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </LocalizationProvider>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
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
                {filteredLeaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      {leaves?.length === 0
                        ? 'No leave requests found'
                        : 'No leaves match the selected filters'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeaves.map((leave: any) => (
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
                        {leave.user?.manager
                          ? `${leave.user.manager.firstName} ${leave.user.manager.lastName}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {leave.reason.substring(0, 50)}
                        {leave.reason.length > 50 && '...'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={leave.status}
                          color={getStatusColor(leave.status)}
                          size="small"
                        />
                      </TableCell>
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Apply Leave Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
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
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createLeaveMutation.isPending}
          >
            {createLeaveMutation.isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Leave Dialog */}
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
    </Box>
  );
}

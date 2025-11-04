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
import { Add } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';
import api from '../config/api';

export default function LeavesPage() {
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

  // Recalculate days whenever dates or day types change
  useEffect(() => {
    const days = calculateWorkingDays(
      formData.startDate,
      formData.endDate,
      formData.startDayType,
      formData.endDayType
    );
    setCalculatedDays(days);
  }, [formData.startDate, formData.endDate, formData.startDayType, formData.endDayType]);

  // Fetch leaves
  const { data: leaves, isLoading } = useQuery({
    queryKey: ['leaves'],
    queryFn: async () => {
      const response = await api.get('/leaves');
      return response.data.data;
    },
  });

  // Fetch leave types
  const { data: leaveTypes } = useQuery({
    queryKey: ['leave-types'],
    queryFn: async () => {
      const response = await api.get('/leave-balances/leave-types');
      return response.data.data;
    },
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
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit leave request');
    },
  });

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

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Leave Type</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Days</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaves?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No leave requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  leaves?.map((leave: any) => (
                    <TableRow key={leave.id}>
                      <TableCell>{leave.leaveType?.name}</TableCell>
                      <TableCell>
                        {new Date(leave.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(leave.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{leave.totalDays}</TableCell>
                      <TableCell>
                        {leave.reason.substring(0, 50)}
                        {leave.reason.length > 50 && '...'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={leave.status}
                          color={getStatusColor(leave.status)}
                          size="small"
                        />
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
                  Weekends (Saturday & Sunday) are excluded from the calculation
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
    </Box>
  );
}

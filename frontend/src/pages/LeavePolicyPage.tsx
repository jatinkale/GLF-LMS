import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Chip,
  Autocomplete,
} from '@mui/material';
import { History as HistoryIcon, PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../config/api';
import { gradients } from '../theme/theme';

interface EmploymentTypeData {
  employmentType: 'FTE' | 'FTDC' | 'CONSULTANT';
  casualLeave: string;
  privilegeLeave: string;
  month: number;
  year: number;
}

interface USEmploymentTypeData {
  employmentType: 'FTE' | 'FTDC' | 'CONSULTANT';
  plannedTimeOff: string;
  bereavementLeave: string;
  month: number;
  year: number;
}

interface EmployeeSearchResult {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  gender?: string;
  region?: string;
  manager?: {
    employeeId: string;
    firstName: string;
    lastName: string;
  };
}

interface SpecialLeaveFormData {
  leaveType: string;
  numberOfLeaves: string;
  comments: string;
}

const EMPLOYMENT_TYPES = [
  { value: 'FTE', label: 'Full Time Employee' },
  { value: 'FTDC', label: 'Full Time Direct Consultant' },
  { value: 'CONSULTANT', label: 'Consultant' },
];

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const currentDate = new Date();
const YEARS = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

export default function LeavePolicyPage() {
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    region: 'IND' | 'US';
    data: EmploymentTypeData | USEmploymentTypeData | null;
  }>({ open: false, region: 'IND', data: null });

  // State for India region data
  const [indiaData, setIndiaData] = useState<EmploymentTypeData[]>([
    {
      employmentType: 'FTE',
      casualLeave: '0',
      privilegeLeave: '0',
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
    },
    {
      employmentType: 'FTDC',
      casualLeave: '0',
      privilegeLeave: '0',
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
    },
    {
      employmentType: 'CONSULTANT',
      casualLeave: '0',
      privilegeLeave: '0',
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
    },
  ]);

  // State for US region data
  const [usData, setUsData] = useState<USEmploymentTypeData[]>([
    {
      employmentType: 'FTE',
      plannedTimeOff: '0',
      bereavementLeave: '0',
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
    },
    {
      employmentType: 'FTDC',
      plannedTimeOff: '0',
      bereavementLeave: '0',
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
    },
    {
      employmentType: 'CONSULTANT',
      plannedTimeOff: '0',
      bereavementLeave: '0',
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
    },
  ]);

  // State for Special Leaves section
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSearchResult | null>(null);
  const [specialLeaveForm, setSpecialLeaveForm] = useState<SpecialLeaveFormData>({
    leaveType: '',
    numberOfLeaves: '',
    comments: '',
  });
  const [specialConfirmDialog, setSpecialConfirmDialog] = useState<{
    open: boolean;
    data: any;
  }>({ open: false, data: null });

  // Fetch process history
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['leave-policy-history'],
    queryFn: async () => {
      const response = await api.get('/admin/leave-policy/history');
      return response.data.data;
    },
  });

  // Process leaves mutation
  const processLeavesMutation = useMutation({
    mutationFn: async (data: EmploymentTypeData) => {
      const response = await api.post('/admin/leave-policy/process', {
        region: 'IND',
        employmentType: data.employmentType,
        month: data.month,
        year: data.year,
        casualLeave: parseFloat(data.casualLeave) || 0,
        privilegeLeave: parseFloat(data.privilegeLeave) || 0,
      });
      return response.data;
    },
    onSuccess: (response, variables) => {
      if (response.data.alreadyProcessed) {
        toast.success(`Leaves processed successfully for ${variables.employmentType}! (Note: This was already processed before)`, {
          duration: 5000,
        });
      } else {
        toast.success(`Leaves processed successfully for ${variables.employmentType}!`);
      }
      queryClient.invalidateQueries({ queryKey: ['leave-policy-history'] });
      setConfirmDialog({ open: false, region: 'IND', data: null });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process leaves');
      setConfirmDialog({ open: false, region: 'IND', data: null });
    },
  });

  // Process US leaves mutation
  const processUSLeavesMutation = useMutation({
    mutationFn: async (data: USEmploymentTypeData) => {
      const response = await api.post('/admin/leave-policy/process', {
        region: 'US',
        employmentType: data.employmentType,
        month: data.month,
        year: data.year,
        plannedTimeOff: parseFloat(data.plannedTimeOff) || 0,
        bereavementLeave: parseFloat(data.bereavementLeave) || 0,
      });
      return response.data;
    },
    onSuccess: (response, variables) => {
      if (response.data.alreadyProcessed) {
        toast.success(`Leaves processed successfully for ${variables.employmentType}! (Note: This was already processed before)`, {
          duration: 5000,
        });
      } else {
        toast.success(`Leaves processed successfully for ${variables.employmentType}!`);
      }
      queryClient.invalidateQueries({ queryKey: ['leave-policy-history'] });
      setConfirmDialog({ open: false, region: 'US', data: null });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process leaves');
      setConfirmDialog({ open: false, region: 'US', data: null });
    },
  });

  // Search employees query
  const { data: employeeSearchResults } = useQuery({
    queryKey: ['employee-search', employeeSearch],
    queryFn: async () => {
      if (!employeeSearch || employeeSearch.length < 2) return [];
      const response = await api.get('/admin/search-employees', {
        params: { query: employeeSearch },
      });
      return response.data.data;
    },
    enabled: employeeSearch.length >= 2,
  });

  // Process special leave mutation
  const processSpecialLeaveMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/admin/leave-policy/process-special', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Special leave processed successfully!');
      queryClient.invalidateQueries({ queryKey: ['leave-policy-history'] });
      // Clear form but keep employee selected
      setSpecialLeaveForm({
        leaveType: '',
        numberOfLeaves: '',
        comments: '',
      });
      setSpecialConfirmDialog({ open: false, data: null });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process special leave');
      setSpecialConfirmDialog({ open: false, data: null });
    },
  });

  const handleUpdateData = (index: number, field: keyof EmploymentTypeData, value: any) => {
    const newData = [...indiaData];
    newData[index] = { ...newData[index], [field]: value };
    setIndiaData(newData);
  };

  const handleProcessLeaves = async (data: EmploymentTypeData) => {
    // Validation
    const cl = parseFloat(data.casualLeave) || 0;
    const pl = parseFloat(data.privilegeLeave) || 0;

    if (cl === 0 && pl === 0) {
      toast.error('Please enter at least one leave value greater than 0');
      return;
    }

    if (cl < 0 || pl < 0) {
      toast.error('Leave values cannot be negative');
      return;
    }

    // Check if already processed
    try {
      const response = await api.post('/admin/leave-policy/check-exists', {
        region: 'IND',
        employmentType: data.employmentType,
        month: data.month,
        year: data.year,
      });

      if (response.data.data.exists) {
        // Show confirmation dialog
        setConfirmDialog({ open: true, region: 'IND', data });
      } else {
        // Process directly
        setConfirmDialog({ open: true, region: 'IND', data });
      }
    } catch (error) {
      toast.error('Error checking processing history');
    }
  };

  const handleUpdateUSData = (index: number, field: keyof USEmploymentTypeData, value: any) => {
    const newData = [...usData];
    newData[index] = { ...newData[index], [field]: value };
    setUsData(newData);
  };

  const handleProcessUSLeaves = async (data: USEmploymentTypeData) => {
    // Validation
    const pto = parseFloat(data.plannedTimeOff) || 0;
    const bl = parseFloat(data.bereavementLeave) || 0;

    if (pto === 0 && bl === 0) {
      toast.error('Please enter at least one leave value greater than 0');
      return;
    }

    if (pto < 0 || bl < 0) {
      toast.error('Leave values cannot be negative');
      return;
    }

    // Check if already processed
    try {
      const response = await api.post('/admin/leave-policy/check-exists', {
        region: 'US',
        employmentType: data.employmentType,
        month: data.month,
        year: data.year,
      });

      if (response.data.data.exists) {
        // Show confirmation dialog
        setConfirmDialog({ open: true, region: 'US', data });
      } else {
        // Process directly
        setConfirmDialog({ open: true, region: 'US', data });
      }
    } catch (error) {
      toast.error('Error checking processing history');
    }
  };

  const handleConfirmProcess = () => {
    if (confirmDialog.data && confirmDialog.region === 'IND') {
      processLeavesMutation.mutate(confirmDialog.data as EmploymentTypeData);
    } else if (confirmDialog.data && confirmDialog.region === 'US') {
      processUSLeavesMutation.mutate(confirmDialog.data as USEmploymentTypeData);
    }
  };

  const getMonthYearLabel = (month: number, year: number) => {
    const monthLabel = MONTHS.find((m) => m.value === month)?.label || '';
    return `${monthLabel} ${year}`;
  };

  // Handler for special leave processing
  const handleProcessSpecialLeave = () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    if (!specialLeaveForm.leaveType) {
      toast.error('Please select a leave type');
      return;
    }

    const numberOfLeaves = parseFloat(specialLeaveForm.numberOfLeaves);
    if (!numberOfLeaves || numberOfLeaves <= 0) {
      toast.error('Please enter a valid number of leaves greater than 0');
      return;
    }

    if (!specialLeaveForm.comments || !specialLeaveForm.comments.trim()) {
      toast.error('Please enter comments');
      return;
    }

    // Show confirmation dialog
    setSpecialConfirmDialog({
      open: true,
      data: {
        employeeId: selectedEmployee.employeeId,
        employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
        leaveType: specialLeaveForm.leaveType,
        numberOfLeaves,
        comments: specialLeaveForm.comments.trim(),
      },
    });
  };

  const handleConfirmSpecialLeave = () => {
    if (!specialConfirmDialog.data) return;

    processSpecialLeaveMutation.mutate({
      employeeId: specialConfirmDialog.data.employeeId,
      leaveTypeCode: specialConfirmDialog.data.leaveType,
      numberOfLeaves: specialConfirmDialog.data.numberOfLeaves,
      comments: specialConfirmDialog.data.comments,
    });
  };

  // Get filtered leave types based on gender
  const getFilteredLeaveTypes = () => {
    const baseTypes = [{ code: 'COMP', name: 'Compensatory Off' }];

    if (selectedEmployee?.gender === 'F') {
      baseTypes.push({ code: 'ML', name: 'Maternity Leave' });
    }

    if (selectedEmployee?.gender === 'M') {
      baseTypes.push({ code: 'PTL', name: 'Paternity Leave' });
    }

    return baseTypes;
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          background: gradients.primary,
          borderRadius: 3,
          p: 3,
          mb: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
              Leave Policy
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              Manage leave allocations by region and employment type
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<HistoryIcon />}
            onClick={() => setShowHistory(true)}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2) !important',
              color: '#ffffff !important',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3) !important',
              },
            }}
          >
            Process History
          </Button>
        </Box>
      </Box>

      {/* India Section */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#1976d2' }}>
          India
        </Typography>

        <Grid container spacing={3}>
          {indiaData.map((empType, index) => (
            <Grid item xs={12} key={empType.employmentType}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 2,
                  borderColor: 'rgba(25, 118, 210, 0.2)',
                  '&:hover': {
                    borderColor: 'rgba(25, 118, 210, 0.4)',
                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.1)',
                  },
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  {EMPLOYMENT_TYPES.find((et) => et.value === empType.employmentType)?.label}
                </Typography>

                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      label="Casual Leave"
                      type="number"
                      inputProps={{ step: 0.5, min: 0 }}
                      value={empType.casualLeave}
                      onChange={(e) => handleUpdateData(index, 'casualLeave', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      label="Privilege Leave"
                      type="number"
                      inputProps={{ step: 0.5, min: 0 }}
                      value={empType.privilegeLeave}
                      onChange={(e) => handleUpdateData(index, 'privilegeLeave', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      select
                      label="Month"
                      value={empType.month}
                      onChange={(e) => handleUpdateData(index, 'month', parseInt(e.target.value))}
                    >
                      {MONTHS.map((month) => (
                        <MenuItem key={month.value} value={month.value}>
                          {month.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      select
                      label="Year"
                      value={empType.year}
                      onChange={(e) => handleUpdateData(index, 'year', parseInt(e.target.value))}
                    >
                      {YEARS.map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => handleProcessLeaves(empType)}
                      disabled={processLeavesMutation.isPending}
                      sx={{
                        height: 56,
                        bgcolor: '#2e7d32 !important',
                        '&:hover': {
                          bgcolor: '#1b5e20 !important',
                        },
                      }}
                    >
                      Process Leaves
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* US Section */}
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#1976d2' }}>
          US
        </Typography>

        <Grid container spacing={3}>
          {usData.map((empType, index) => (
            <Grid item xs={12} key={empType.employmentType}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 2,
                  borderColor: 'rgba(25, 118, 210, 0.2)',
                  '&:hover': {
                    borderColor: 'rgba(25, 118, 210, 0.4)',
                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.1)',
                  },
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  {EMPLOYMENT_TYPES.find((et) => et.value === empType.employmentType)?.label}
                </Typography>

                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      label="Planned Time Off"
                      type="number"
                      inputProps={{ step: 0.5, min: 0 }}
                      value={empType.plannedTimeOff}
                      onChange={(e) => handleUpdateUSData(index, 'plannedTimeOff', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      label="Bereavement Leave"
                      type="number"
                      inputProps={{ step: 0.5, min: 0 }}
                      value={empType.bereavementLeave}
                      onChange={(e) => handleUpdateUSData(index, 'bereavementLeave', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      select
                      label="Month"
                      value={empType.month}
                      onChange={(e) => handleUpdateUSData(index, 'month', parseInt(e.target.value))}
                    >
                      {MONTHS.map((month) => (
                        <MenuItem key={month.value} value={month.value}>
                          {month.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      select
                      label="Year"
                      value={empType.year}
                      onChange={(e) => handleUpdateUSData(index, 'year', parseInt(e.target.value))}
                    >
                      {YEARS.map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => handleProcessUSLeaves(empType)}
                      disabled={processUSLeavesMutation.isPending}
                      sx={{
                        height: 56,
                        bgcolor: '#2e7d32 !important',
                        '&:hover': {
                          bgcolor: '#1b5e20 !important',
                        },
                      }}
                    >
                      Process Leaves
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Special Leaves Section */}
      <Paper sx={{ p: 3, mt: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#1976d2' }}>
          Special Leaves
        </Typography>

        {/* Employee Search */}
        <Box sx={{ mb: 3 }}>
          <Autocomplete
            options={employeeSearchResults || []}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.employeeId})`}
            inputValue={employeeSearch}
            onInputChange={(event, newValue) => setEmployeeSearch(newValue)}
            onChange={(event, newValue) => {
              setSelectedEmployee(newValue);
              setSpecialLeaveForm({ leaveType: '', numberOfLeaves: '', comments: '' });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Employee by Name or ID"
                placeholder="Type at least 2 characters..."
                fullWidth
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={option.employeeId}>
                <Box>
                  <Typography variant="body1">
                    {option.firstName} {option.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.employeeId} • {option.email}
                  </Typography>
                </Box>
              </li>
            )}
            noOptionsText={employeeSearch.length < 2 ? 'Type at least 2 characters' : 'No employees found'}
          />
        </Box>

        {/* Selected Employee Details */}
        {selectedEmployee && (
          <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: '#f5f5f5' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Selected Employee Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">Employee ID</Typography>
                <Typography variant="body1" fontWeight={600}>{selectedEmployee.employeeId}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">Employee Name</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">Gender</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedEmployee.gender === 'M' ? 'Male' : selectedEmployee.gender === 'F' ? 'Female' : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">Location</Typography>
                <Typography variant="body1" fontWeight={600}>{selectedEmployee.region || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">Reporting Manager Name</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedEmployee.manager
                    ? `${selectedEmployee.manager.firstName} ${selectedEmployee.manager.lastName}`
                    : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">Reporting Manager ID</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedEmployee.manager?.employeeId || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Leave Processing Form */}
        {selectedEmployee && (
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                select
                label="Leave Type"
                value={specialLeaveForm.leaveType}
                onChange={(e) => setSpecialLeaveForm({ ...specialLeaveForm, leaveType: e.target.value })}
                required
              >
                {getFilteredLeaveTypes().map((type) => (
                  <MenuItem key={type.code} value={type.code}>
                    {type.name} ({type.code})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="Number of Leaves"
                type="number"
                inputProps={{ step: 0.5, min: 0 }}
                value={specialLeaveForm.numberOfLeaves}
                onChange={(e) => setSpecialLeaveForm({ ...specialLeaveForm, numberOfLeaves: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Comments"
                value={specialLeaveForm.comments}
                onChange={(e) => setSpecialLeaveForm({ ...specialLeaveForm, comments: e.target.value })}
                required
                placeholder="Enter reason for special leave allocation"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleProcessSpecialLeave}
                disabled={processSpecialLeaveMutation.isPending}
                sx={{
                  height: 56,
                  bgcolor: '#2e7d32 !important',
                  '&:hover': {
                    bgcolor: '#1b5e20 !important',
                  },
                }}
              >
                Process Leaves
              </Button>
            </Grid>
          </Grid>
        )}

        {!selectedEmployee && (
          <Alert severity="info">
            Please search and select an employee to process special leaves
          </Alert>
        )}
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, data: null })}>
        <DialogTitle>Confirm Leave Processing</DialogTitle>
        <DialogContent>
          {confirmDialog.data && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to process leaves with the following details?
              </Typography>
              <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Region:</strong> {confirmDialog.region === 'IND' ? 'India' : 'US'}
                </Typography>
                <Typography variant="body2">
                  <strong>Employment Type:</strong>{' '}
                  {EMPLOYMENT_TYPES.find((et) => et.value === confirmDialog.data!.employmentType)?.label}
                </Typography>
                <Typography variant="body2">
                  <strong>Period:</strong> {getMonthYearLabel(confirmDialog.data.month, confirmDialog.data.year)}
                </Typography>
                {confirmDialog.region === 'IND' ? (
                  <>
                    <Typography variant="body2">
                      <strong>Casual Leave:</strong> {(confirmDialog.data as EmploymentTypeData).casualLeave} days
                    </Typography>
                    <Typography variant="body2">
                      <strong>Privilege Leave:</strong> {(confirmDialog.data as EmploymentTypeData).privilegeLeave} days
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="body2">
                      <strong>Planned Time Off:</strong> {(confirmDialog.data as USEmploymentTypeData).plannedTimeOff} days
                    </Typography>
                    <Typography variant="body2">
                      <strong>Bereavement Leave:</strong> {(confirmDialog.data as USEmploymentTypeData).bereavementLeave} days
                    </Typography>
                  </>
                )}
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }}>
                This will update leave balances for all active employees matching the criteria.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, data: null })}>Cancel</Button>
          <Button
            onClick={handleConfirmProcess}
            variant="contained"
            disabled={processLeavesMutation.isPending}
          >
            {processLeavesMutation.isPending ? 'Processing...' : 'Confirm & Process'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog
        open={showHistory}
        onClose={() => setShowHistory(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Leave Processing History</DialogTitle>
        <DialogContent>
          {isLoadingHistory ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Region</strong></TableCell>
                    <TableCell><strong>Employment Type</strong></TableCell>
                    <TableCell><strong>Period</strong></TableCell>
                    <TableCell><strong>Leave Types</strong></TableCell>
                    <TableCell><strong>Employees</strong></TableCell>
                    <TableCell><strong>Processed By</strong></TableCell>
                    <TableCell><strong>Processed At</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyData && historyData.length > 0 ? (
                    historyData.map((record: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{record.region}</TableCell>
                        <TableCell>
                          {EMPLOYMENT_TYPES.find((et) => et.value === record.employmentType)?.label || record.employmentType}
                        </TableCell>
                        <TableCell>{getMonthYearLabel(record.processMonth, record.processYear)}</TableCell>
                        <TableCell>
                          {record.leaveTypes.map((lt: any, idx: number) => (
                            <Chip
                              key={idx}
                              label={`${lt.leaveTypeCode}: ${lt.daysProcessed} days`}
                              size="small"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </TableCell>
                        <TableCell>{record.employeesCount}</TableCell>
                        <TableCell>{record.processedBy}</TableCell>
                        <TableCell>{new Date(record.processedAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No processing history found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Special Leave Confirmation Dialog */}
      <Dialog
        open={specialConfirmDialog.open}
        onClose={() => setSpecialConfirmDialog({ open: false, data: null })}
      >
        <DialogTitle>Confirm Special Leave Processing</DialogTitle>
        <DialogContent>
          {specialConfirmDialog.data && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to process special leave with the following details?
              </Typography>
              <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Employee:</strong> {specialConfirmDialog.data.employeeName} ({specialConfirmDialog.data.employeeId})
                </Typography>
                <Typography variant="body2">
                  <strong>Leave Type:</strong> {specialConfirmDialog.data.leaveType}
                </Typography>
                <Typography variant="body2">
                  <strong>Number of Leaves:</strong> {specialConfirmDialog.data.numberOfLeaves} days
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Comments:</strong> {specialConfirmDialog.data.comments}
                </Typography>
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                This will add {specialConfirmDialog.data.numberOfLeaves} days to the employee's leave balance.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSpecialConfirmDialog({ open: false, data: null })}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSpecialLeave}
            variant="contained"
            disabled={processSpecialLeaveMutation.isPending}
          >
            {processSpecialLeaveMutation.isPending ? 'Processing...' : 'Confirm & Process'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

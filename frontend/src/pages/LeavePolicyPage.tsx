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
  Tabs,
  Tab,
  Checkbox,
} from '@mui/material';
import { History as HistoryIcon, PlayArrow as PlayArrowIcon, Search as SearchIcon } from '@mui/icons-material';
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
  employmentType?: string;
  designation?: string;
  dateOfJoining?: string;
  manager?: {
    employeeId: string;
    firstName: string;
    lastName: string;
  };
}

interface SpecialLeaveFormData {
  leaveType: string;
  action: string;
  numberOfLeaves: string;
  comments: string;
}

interface BulkFilters {
  employeeIds: string;
  location: string;
  employmentType: string;
  gender: string;
  dateOfJoiningFrom: string;
  dateOfJoiningTo: string;
}

interface LeaveType {
  leaveTypeCode: string;
  name: string;
  category: string;
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

  // Special Actions tab state
  const [specialActionsTab, setSpecialActionsTab] = useState(0); // 0 = Single User, 1 = Bulk

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

  // State for Single User Update
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSearchResult | null>(null);
  const [specialLeaveForm, setSpecialLeaveForm] = useState<SpecialLeaveFormData>({
    leaveType: '',
    action: 'ADD',
    numberOfLeaves: '',
    comments: '',
  });
  const [specialConfirmDialog, setSpecialConfirmDialog] = useState<{
    open: boolean;
    data: any;
  }>({ open: false, data: null });

  // State for Bulk Update
  const [bulkFilters, setBulkFilters] = useState<BulkFilters>({
    employeeIds: '',
    location: 'All',
    employmentType: 'All',
    gender: 'All',
    dateOfJoiningFrom: '',
    dateOfJoiningTo: '',
  });
  const [bulkEmployees, setBulkEmployees] = useState<EmployeeSearchResult[]>([]);
  const [selectedBulkEmployees, setSelectedBulkEmployees] = useState<string[]>([]);
  const [bulkLeaveForm, setBulkLeaveForm] = useState<SpecialLeaveFormData>({
    leaveType: '',
    action: 'ADD',
    numberOfLeaves: '',
    comments: '',
  });
  const [bulkConfirmDialog, setBulkConfirmDialog] = useState<{
    open: boolean;
    data: any;
  }>({ open: false, data: null });
  const [bulkResultDialog, setBulkResultDialog] = useState<{
    open: boolean;
    data: any;
  }>({ open: false, data: null });

  // Fetch all leave types
  const { data: leaveTypesData } = useQuery({
    queryKey: ['admin-leave-types-all'],
    queryFn: async () => {
      const response = await api.get('/admin/leave-types-all');
      return response.data.data;
    },
  });

  const leaveTypes: LeaveType[] = leaveTypesData || [];

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

  // Process special leave mutation (single user)
  const processSpecialLeaveMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/admin/leave-policy/process-special', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Special leave processed successfully!');
      queryClient.invalidateQueries({ queryKey: ['leave-policy-history'] });
      setSpecialLeaveForm({
        leaveType: '',
        action: 'ADD',
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

  // Bulk search mutation
  const bulkSearchMutation = useMutation({
    mutationFn: async (filters: BulkFilters) => {
      const response = await api.post('/admin/search-employees-bulk', {
        employeeIds: filters.employeeIds ? filters.employeeIds.split(',').map(id => id.trim()).filter(id => id) : [],
        location: filters.location !== 'All' ? filters.location : undefined,
        employmentType: filters.employmentType !== 'All' ? filters.employmentType : undefined,
        gender: filters.gender !== 'All' ? filters.gender : undefined,
        dateOfJoiningFrom: filters.dateOfJoiningFrom || undefined,
        dateOfJoiningTo: filters.dateOfJoiningTo || undefined,
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      setBulkEmployees(data);
      setSelectedBulkEmployees([]);
      if (data.length === 0) {
        toast.info('No employees found matching the filters');
      } else {
        toast.success(`Found ${data.length} employee(s)`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to search employees');
    },
  });

  // Bulk process mutation
  const bulkProcessMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/admin/leave-policy/process-special-bulk', data);
      return response.data;
    },
    onSuccess: (data) => {
      setBulkConfirmDialog({ open: false, data: null });
      setBulkResultDialog({ open: true, data });
      queryClient.invalidateQueries({ queryKey: ['leave-policy-history'] });
      // Clear selections
      setSelectedBulkEmployees([]);
      setBulkLeaveForm({
        leaveType: '',
        action: 'ADD',
        numberOfLeaves: '',
        comments: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process bulk leave');
      setBulkConfirmDialog({ open: false, data: null });
    },
  });

  const handleUpdateData = (index: number, field: keyof EmploymentTypeData, value: any) => {
    const newData = [...indiaData];
    newData[index] = { ...newData[index], [field]: value };
    setIndiaData(newData);
  };

  const handleProcessLeaves = async (data: EmploymentTypeData) => {
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

    try {
      const response = await api.post('/admin/leave-policy/check-exists', {
        region: 'IND',
        employmentType: data.employmentType,
        month: data.month,
        year: data.year,
      });

      setConfirmDialog({ open: true, region: 'IND', data });
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

    try {
      const response = await api.post('/admin/leave-policy/check-exists', {
        region: 'US',
        employmentType: data.employmentType,
        month: data.month,
        year: data.year,
      });

      setConfirmDialog({ open: true, region: 'US', data });
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

  // Single User Update handlers
  const handleProcessSpecialLeave = () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    if (!specialLeaveForm.leaveType) {
      toast.error('Please select a leave type');
      return;
    }

    if (!specialLeaveForm.action) {
      toast.error('Please select an action (Add/Remove)');
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

    // Check for gender/location mismatch
    const selectedLeaveType = leaveTypes.find(lt => lt.leaveTypeCode === specialLeaveForm.leaveType);
    const warnings: string[] = [];

    if (selectedLeaveType) {
      if (selectedLeaveType.leaveTypeCode === 'ML' && selectedEmployee.gender !== 'F') {
        warnings.push('Maternity Leave (ML) is typically for Female employees only.');
      }
      if (selectedLeaveType.leaveTypeCode === 'PTL' && selectedEmployee.gender !== 'M') {
        warnings.push('Paternity Leave (PTL) is typically for Male employees only.');
      }
    }

    setSpecialConfirmDialog({
      open: true,
      data: {
        employeeId: selectedEmployee.employeeId,
        employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
        leaveType: specialLeaveForm.leaveType,
        leaveTypeName: selectedLeaveType?.name || specialLeaveForm.leaveType,
        action: specialLeaveForm.action,
        numberOfLeaves,
        comments: specialLeaveForm.comments.trim(),
        warnings,
      },
    });
  };

  const handleConfirmSpecialLeave = () => {
    if (!specialConfirmDialog.data) return;

    processSpecialLeaveMutation.mutate({
      employeeId: specialConfirmDialog.data.employeeId,
      leaveTypeCode: specialConfirmDialog.data.leaveType,
      action: specialConfirmDialog.data.action,
      numberOfLeaves: specialConfirmDialog.data.numberOfLeaves,
      comments: specialConfirmDialog.data.comments,
    });
  };

  // Bulk Update handlers
  const handleBulkSearch = () => {
    bulkSearchMutation.mutate(bulkFilters);
  };

  const handleSelectAllBulk = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedBulkEmployees(bulkEmployees.map(emp => emp.employeeId));
    } else {
      setSelectedBulkEmployees([]);
    }
  };

  const handleSelectBulkEmployee = (employeeId: string) => {
    setSelectedBulkEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleProcessBulkLeave = () => {
    if (selectedBulkEmployees.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }

    if (!bulkLeaveForm.leaveType) {
      toast.error('Please select a leave type');
      return;
    }

    if (!bulkLeaveForm.action) {
      toast.error('Please select an action (Add/Remove)');
      return;
    }

    const numberOfLeaves = parseFloat(bulkLeaveForm.numberOfLeaves);
    if (!numberOfLeaves || numberOfLeaves <= 0) {
      toast.error('Please enter a valid number of leaves greater than 0');
      return;
    }

    if (!bulkLeaveForm.comments || !bulkLeaveForm.comments.trim()) {
      toast.error('Please enter comments');
      return;
    }

    // Check for gender/location mismatches
    const selectedLeaveType = leaveTypes.find(lt => lt.leaveTypeCode === bulkLeaveForm.leaveType);
    const selectedEmployeesData = bulkEmployees.filter(emp => selectedBulkEmployees.includes(emp.employeeId));
    const warnings: string[] = [];

    if (selectedLeaveType) {
      if (selectedLeaveType.leaveTypeCode === 'ML') {
        const maleEmployees = selectedEmployeesData.filter(emp => emp.gender !== 'F');
        if (maleEmployees.length > 0) {
          warnings.push(`Maternity Leave (ML) selected for ${maleEmployees.length} non-female employee(s): ${maleEmployees.map(e => `${e.firstName} ${e.lastName}`).join(', ')}`);
        }
      }
      if (selectedLeaveType.leaveTypeCode === 'PTL') {
        const femaleEmployees = selectedEmployeesData.filter(emp => emp.gender !== 'M');
        if (femaleEmployees.length > 0) {
          warnings.push(`Paternity Leave (PTL) selected for ${femaleEmployees.length} non-male employee(s): ${femaleEmployees.map(e => `${e.firstName} ${e.lastName}`).join(', ')}`);
        }
      }
    }

    setBulkConfirmDialog({
      open: true,
      data: {
        employeeIds: selectedBulkEmployees,
        employeeCount: selectedBulkEmployees.length,
        leaveType: bulkLeaveForm.leaveType,
        leaveTypeName: selectedLeaveType?.name || bulkLeaveForm.leaveType,
        action: bulkLeaveForm.action,
        numberOfLeaves,
        comments: bulkLeaveForm.comments.trim(),
        warnings,
      },
    });
  };

  const handleConfirmBulkLeave = () => {
    if (!bulkConfirmDialog.data) return;

    bulkProcessMutation.mutate({
      employeeIds: bulkConfirmDialog.data.employeeIds,
      leaveTypeCode: bulkConfirmDialog.data.leaveType,
      action: bulkConfirmDialog.data.action,
      numberOfLeaves: bulkConfirmDialog.data.numberOfLeaves,
      comments: bulkConfirmDialog.data.comments,
    });
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
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
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

      {/* Special Actions Section */}
      <Paper sx={{ p: 3, mt: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#1976d2' }}>
          Special Actions
        </Typography>

        {/* Tabs for Single User vs Bulk */}
        <Tabs
          value={specialActionsTab}
          onChange={(e, newValue) => setSpecialActionsTab(newValue)}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Single User Update" />
          <Tab label="Bulk Update" />
        </Tabs>

        {/* Single User Update Tab */}
        {specialActionsTab === 0 && (
          <Box>
            {/* Employee Search */}
            <Box sx={{ mb: 3 }}>
              <Autocomplete
                options={employeeSearchResults || []}
                getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.employeeId})`}
                inputValue={employeeSearch}
                onInputChange={(event, newValue) => setEmployeeSearch(newValue)}
                onChange={(event, newValue) => {
                  setSelectedEmployee(newValue);
                  setSpecialLeaveForm({ leaveType: '', action: 'ADD', numberOfLeaves: '', comments: '' });
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
                <Grid item xs={12} sm={2.4}>
                  <TextField
                    fullWidth
                    select
                    label="Leave Type"
                    value={specialLeaveForm.leaveType}
                    onChange={(e) => setSpecialLeaveForm({ ...specialLeaveForm, leaveType: e.target.value })}
                    required
                  >
                    {leaveTypes.map((type) => (
                      <MenuItem key={type.leaveTypeCode} value={type.leaveTypeCode}>
                        {type.name} ({type.leaveTypeCode})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={2.4}>
                  <TextField
                    fullWidth
                    select
                    label="Action"
                    value={specialLeaveForm.action}
                    onChange={(e) => setSpecialLeaveForm({ ...specialLeaveForm, action: e.target.value })}
                    required
                  >
                    <MenuItem value="ADD">Add Leaves</MenuItem>
                    <MenuItem value="REMOVE">Remove Leaves</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={1.2}>
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
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Comments"
                    value={specialLeaveForm.comments}
                    onChange={(e) => setSpecialLeaveForm({ ...specialLeaveForm, comments: e.target.value })}
                    required
                    placeholder="Enter reason"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
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
          </Box>
        )}

        {/* Bulk Update Tab */}
        {specialActionsTab === 1 && (
          <Box>
            {/* Bulk Filters */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Filter Employees
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Employee IDs (comma-separated)"
                    value={bulkFilters.employeeIds}
                    onChange={(e) => setBulkFilters({ ...bulkFilters, employeeIds: e.target.value })}
                    placeholder="e.g., EMP001, EMP002"
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    select
                    label="Location"
                    value={bulkFilters.location}
                    onChange={(e) => setBulkFilters({ ...bulkFilters, location: e.target.value })}
                  >
                    <MenuItem value="All">All</MenuItem>
                    <MenuItem value="IND">India</MenuItem>
                    <MenuItem value="US">United States</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    select
                    label="Employment Type"
                    value={bulkFilters.employmentType}
                    onChange={(e) => setBulkFilters({ ...bulkFilters, employmentType: e.target.value })}
                  >
                    <MenuItem value="All">All</MenuItem>
                    {EMPLOYMENT_TYPES.map((et) => (
                      <MenuItem key={et.value} value={et.value}>
                        {et.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    select
                    label="Gender"
                    value={bulkFilters.gender}
                    onChange={(e) => setBulkFilters({ ...bulkFilters, gender: e.target.value })}
                  >
                    <MenuItem value="All">All</MenuItem>
                    <MenuItem value="M">Male</MenuItem>
                    <MenuItem value="F">Female</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={handleBulkSearch}
                    disabled={bulkSearchMutation.isPending}
                    sx={{
                      height: 56,
                      bgcolor: '#1976d2 !important',
                      '&:hover': {
                        bgcolor: '#115293 !important',
                      },
                    }}
                  >
                    Search
                  </Button>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Date of Joining From"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={bulkFilters.dateOfJoiningFrom}
                    onChange={(e) => setBulkFilters({ ...bulkFilters, dateOfJoiningFrom: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Date of Joining To"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={bulkFilters.dateOfJoiningTo}
                    onChange={(e) => setBulkFilters({ ...bulkFilters, dateOfJoiningTo: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Bulk Employees Grid */}
            {bulkEmployees.length > 0 && (
              <Box>
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedBulkEmployees.length === bulkEmployees.length}
                            indeterminate={selectedBulkEmployees.length > 0 && selectedBulkEmployees.length < bulkEmployees.length}
                            onChange={handleSelectAllBulk}
                          />
                        </TableCell>
                        <TableCell><strong>Employee ID</strong></TableCell>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell><strong>Gender</strong></TableCell>
                        <TableCell><strong>Location</strong></TableCell>
                        <TableCell><strong>Employment Type</strong></TableCell>
                        <TableCell><strong>Designation</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bulkEmployees.map((emp) => (
                        <TableRow key={emp.employeeId} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedBulkEmployees.includes(emp.employeeId)}
                              onChange={() => handleSelectBulkEmployee(emp.employeeId)}
                            />
                          </TableCell>
                          <TableCell>{emp.employeeId}</TableCell>
                          <TableCell>{emp.firstName} {emp.lastName}</TableCell>
                          <TableCell>{emp.gender === 'M' ? 'Male' : emp.gender === 'F' ? 'Female' : 'N/A'}</TableCell>
                          <TableCell>{emp.region || 'N/A'}</TableCell>
                          <TableCell>{emp.employmentType || 'N/A'}</TableCell>
                          <TableCell>{emp.designation || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Bulk Processing Form */}
                <Paper variant="outlined" sx={{ p: 3, bgcolor: '#f5f5f5' }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Process Leaves for Selected Employees ({selectedBulkEmployees.length} selected)
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={2.4}>
                      <TextField
                        fullWidth
                        select
                        label="Leave Type"
                        value={bulkLeaveForm.leaveType}
                        onChange={(e) => setBulkLeaveForm({ ...bulkLeaveForm, leaveType: e.target.value })}
                        required
                      >
                        {leaveTypes.map((type) => (
                          <MenuItem key={type.leaveTypeCode} value={type.leaveTypeCode}>
                            {type.name} ({type.leaveTypeCode})
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={2.4}>
                      <TextField
                        fullWidth
                        select
                        label="Action"
                        value={bulkLeaveForm.action}
                        onChange={(e) => setBulkLeaveForm({ ...bulkLeaveForm, action: e.target.value })}
                        required
                      >
                        <MenuItem value="ADD">Add Leaves</MenuItem>
                        <MenuItem value="REMOVE">Remove Leaves</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={1.2}>
                      <TextField
                        fullWidth
                        label="Number of Leaves"
                        type="number"
                        inputProps={{ step: 0.5, min: 0 }}
                        value={bulkLeaveForm.numberOfLeaves}
                        onChange={(e) => setBulkLeaveForm({ ...bulkLeaveForm, numberOfLeaves: e.target.value })}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Comments"
                        value={bulkLeaveForm.comments}
                        onChange={(e) => setBulkLeaveForm({ ...bulkLeaveForm, comments: e.target.value })}
                        required
                        placeholder="Enter reason"
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<PlayArrowIcon />}
                        onClick={handleProcessBulkLeave}
                        disabled={bulkProcessMutation.isPending || selectedBulkEmployees.length === 0}
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
              </Box>
            )}

            {bulkEmployees.length === 0 && !bulkSearchMutation.isPending && (
              <Alert severity="info">
                Use the filters above and click "Search" to find employees for bulk leave processing
              </Alert>
            )}

            {bulkSearchMutation.isPending && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Confirmation Dialog for India/US Processing */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, region: 'IND', data: null })}>
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
          <Button onClick={() => setConfirmDialog({ open: false, region: 'IND', data: null })}>Cancel</Button>
          <Button
            onClick={handleConfirmProcess}
            variant="contained"
            disabled={processLeavesMutation.isPending || processUSLeavesMutation.isPending}
          >
            {(processLeavesMutation.isPending || processUSLeavesMutation.isPending) ? 'Processing...' : 'Confirm & Process'}
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

      {/* Special Leave Confirmation Dialog (Single User) */}
      <Dialog
        open={specialConfirmDialog.open}
        onClose={() => setSpecialConfirmDialog({ open: false, data: null })}
      >
        <DialogTitle>Confirm Special Leave Processing</DialogTitle>
        <DialogContent>
          {specialConfirmDialog.data && (
            <Box>
              {specialConfirmDialog.data.warnings && specialConfirmDialog.data.warnings.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600}>Warning:</Typography>
                  {specialConfirmDialog.data.warnings.map((warning: string, idx: number) => (
                    <Typography key={idx} variant="body2">{warning}</Typography>
                  ))}
                </Alert>
              )}
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to process special leave with the following details?
              </Typography>
              <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Employee:</strong> {specialConfirmDialog.data.employeeName} ({specialConfirmDialog.data.employeeId})
                </Typography>
                <Typography variant="body2">
                  <strong>Leave Type:</strong> {specialConfirmDialog.data.leaveTypeName}
                </Typography>
                <Typography variant="body2">
                  <strong>Action:</strong> {specialConfirmDialog.data.action === 'ADD' ? 'Add Leaves' : 'Remove Leaves'}
                </Typography>
                <Typography variant="body2">
                  <strong>Number of Leaves:</strong> {specialConfirmDialog.data.numberOfLeaves} days
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Comments:</strong> {specialConfirmDialog.data.comments}
                </Typography>
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                This will {specialConfirmDialog.data.action === 'ADD' ? 'add' : 'remove'} {specialConfirmDialog.data.numberOfLeaves} days {specialConfirmDialog.data.action === 'ADD' ? 'to' : 'from'} the employee's leave balance.
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

      {/* Bulk Leave Confirmation Dialog */}
      <Dialog
        open={bulkConfirmDialog.open}
        onClose={() => setBulkConfirmDialog({ open: false, data: null })}
      >
        <DialogTitle>Confirm Bulk Leave Processing</DialogTitle>
        <DialogContent>
          {bulkConfirmDialog.data && (
            <Box>
              {bulkConfirmDialog.data.warnings && bulkConfirmDialog.data.warnings.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600}>Warning:</Typography>
                  {bulkConfirmDialog.data.warnings.map((warning: string, idx: number) => (
                    <Typography key={idx} variant="body2" sx={{ wordBreak: 'break-word' }}>{warning}</Typography>
                  ))}
                </Alert>
              )}
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to process leave for multiple employees?
              </Typography>
              <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Number of Employees:</strong> {bulkConfirmDialog.data.employeeCount}
                </Typography>
                <Typography variant="body2">
                  <strong>Leave Type:</strong> {bulkConfirmDialog.data.leaveTypeName}
                </Typography>
                <Typography variant="body2">
                  <strong>Action:</strong> {bulkConfirmDialog.data.action === 'ADD' ? 'Add Leaves' : 'Remove Leaves'}
                </Typography>
                <Typography variant="body2">
                  <strong>Number of Leaves:</strong> {bulkConfirmDialog.data.numberOfLeaves} days
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Comments:</strong> {bulkConfirmDialog.data.comments}
                </Typography>
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                This will {bulkConfirmDialog.data.action === 'ADD' ? 'add' : 'remove'} {bulkConfirmDialog.data.numberOfLeaves} days {bulkConfirmDialog.data.action === 'ADD' ? 'to' : 'from'} each selected employee's leave balance.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkConfirmDialog({ open: false, data: null })}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmBulkLeave}
            variant="contained"
            disabled={bulkProcessMutation.isPending}
          >
            {bulkProcessMutation.isPending ? 'Processing...' : 'Confirm & Process'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Processing Result Dialog */}
      <Dialog
        open={bulkResultDialog.open}
        onClose={() => setBulkResultDialog({ open: false, data: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Bulk Processing Results</DialogTitle>
        <DialogContent>
          {bulkResultDialog.data && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Successfully processed {bulkResultDialog.data.data?.processed || 0} employee(s)
                </Typography>
              </Alert>

              {bulkResultDialog.data.data?.details?.processedEmployees?.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                    Processed Successfully:
                  </Typography>
                  <Box sx={{ bgcolor: '#e8f5e9', p: 2, borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                    {bulkResultDialog.data.data.details.processedEmployees.map((emp: string, idx: number) => (
                      <Typography key={idx} variant="body2">• {emp}</Typography>
                    ))}
                  </Box>
                </Box>
              )}

              {bulkResultDialog.data.data?.details?.errorMessages?.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} color="error" sx={{ mb: 1 }}>
                    Errors ({bulkResultDialog.data.data.errors} employee(s)):
                  </Typography>
                  <Box sx={{ bgcolor: '#ffebee', p: 2, borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                    {bulkResultDialog.data.data.details.errorMessages.map((error: string, idx: number) => (
                      <Typography key={idx} variant="body2" color="error">• {error}</Typography>
                    ))}
                  </Box>
                </Box>
              )}

              {bulkResultDialog.data.data?.details?.warningMessages?.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} color="warning.main" sx={{ mb: 1 }}>
                    Warnings:
                  </Typography>
                  <Box sx={{ bgcolor: '#fff3e0', p: 2, borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                    {bulkResultDialog.data.data.details.warningMessages.map((warning: string, idx: number) => (
                      <Typography key={idx} variant="body2" color="warning.main">• {warning}</Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkResultDialog({ open: false, data: null })} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

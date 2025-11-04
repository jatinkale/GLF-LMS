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
    data: EmploymentTypeData | null;
  }>({ open: false, data: null });

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
      setConfirmDialog({ open: false, data: null });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process leaves');
      setConfirmDialog({ open: false, data: null });
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
        setConfirmDialog({ open: true, data });
      } else {
        // Process directly
        setConfirmDialog({ open: true, data });
      }
    } catch (error) {
      toast.error('Error checking processing history');
    }
  };

  const handleConfirmProcess = () => {
    if (confirmDialog.data) {
      processLeavesMutation.mutate(confirmDialog.data);
    }
  };

  const getMonthYearLabel = (month: number, year: number) => {
    const monthLabel = MONTHS.find((m) => m.value === month)?.label || '';
    return `${monthLabel} ${year}`;
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

      {/* US Section - Placeholder */}
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: '#1976d2' }}>
          US
        </Typography>
        <Alert severity="info">This section will be developed in the future.</Alert>
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
                  <strong>Region:</strong> India
                </Typography>
                <Typography variant="body2">
                  <strong>Employment Type:</strong>{' '}
                  {EMPLOYMENT_TYPES.find((et) => et.value === confirmDialog.data!.employmentType)?.label}
                </Typography>
                <Typography variant="body2">
                  <strong>Period:</strong> {getMonthYearLabel(confirmDialog.data.month, confirmDialog.data.year)}
                </Typography>
                <Typography variant="body2">
                  <strong>Casual Leave:</strong> {confirmDialog.data.casualLeave} days
                </Typography>
                <Typography variant="body2">
                  <strong>Privilege Leave:</strong> {confirmDialog.data.privilegeLeave} days
                </Typography>
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
    </Box>
  );
}

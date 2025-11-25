import { useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Grid,
  MenuItem,
  CircularProgress,
  Chip,
  Alert,
  InputAdornment,
} from '@mui/material';
import { Download, Refresh, FilterAlt, Clear, Assessment } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../config/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

// Audit Logs Page - Admin only
interface AuditLog {
  id: string;
  action: string;
  description: string;
  employeeId: string;
  entityId?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  user?: {
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const AuditLogsPage = () => {
  const [filters, setFilters] = useState({
    userId: '',
    userName: '',
    eventType: '',
    fromDate: '',
    toDate: '',
  });

  // Column-level filters (client-side)
  const [columnFilters, setColumnFilters] = useState({
    timestamp: '',
    userId: '',
    userName: '',
    eventType: '',
    description: '',
    ipAddress: '',
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch audit logs
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['audit-logs', filters, page, rowsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.userName && { userName: filters.userName }),
        ...(filters.eventType && { eventType: filters.eventType }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
      });

      const response = await api.get(`/admin/audit-logs?${params.toString()}`);
      return response.data;
    },
    retry: 1,
    staleTime: 30000,
  });

  const rawAuditLogs: AuditLog[] = data?.data || [];
  const pagination: PaginationData = data?.pagination || {
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  };

  // Apply column-level filters (client-side filtering on top of server-side filters)
  const auditLogs = useMemo(() => {
    return rawAuditLogs.filter((log) => {
      // Timestamp filter
      if (columnFilters.timestamp) {
        const logDate = new Date(log.timestamp).toLocaleString().toLowerCase();
        if (!logDate.includes(columnFilters.timestamp.toLowerCase())) return false;
      }

      // User ID filter
      if (columnFilters.userId) {
        if (!log.employeeId?.toLowerCase().includes(columnFilters.userId.toLowerCase())) return false;
      }

      // User Name filter
      if (columnFilters.userName) {
        const userName = log.user ? `${log.user.firstName} ${log.user.lastName}`.toLowerCase() : '';
        if (!userName.includes(columnFilters.userName.toLowerCase())) return false;
      }

      // Event Type filter
      if (columnFilters.eventType) {
        if (!log.action?.toLowerCase().includes(columnFilters.eventType.toLowerCase())) return false;
      }

      // Description filter
      if (columnFilters.description) {
        if (!log.description?.toLowerCase().includes(columnFilters.description.toLowerCase())) return false;
      }

      // IP Address filter
      if (columnFilters.ipAddress) {
        if (!log.ipAddress?.toLowerCase().includes(columnFilters.ipAddress.toLowerCase())) return false;
      }

      return true;
    });
  }, [rawAuditLogs, columnFilters]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0); // Reset to first page when filters change
  };

  const handleColumnFilterChange = (field: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      userId: '',
      userName: '',
      eventType: '',
      fromDate: '',
      toDate: '',
    });
    setColumnFilters({
      timestamp: '',
      userId: '',
      userName: '',
      eventType: '',
      description: '',
      ipAddress: '',
    });
    setPage(0);
  };

  const handleRefresh = () => {
    refetch(); // Refetch data while keeping all filters intact
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExportToExcel = async () => {
    try {
      setIsExporting(true);

      // Build query params with current filters
      const params = new URLSearchParams({
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.userName && { userName: filters.userName }),
        ...(filters.eventType && { eventType: filters.eventType }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
      });

      // Fetch data for export (limited to 1500 if no filters)
      const response = await api.get(`/admin/audit-logs/export?${params.toString()}`);
      const exportData: AuditLog[] = response.data.data || [];

      if (exportData.length === 0) {
        toast.success('No data to export');
        return;
      }

      // Prepare data for Excel
      const excelData = exportData.map((log) => ({
        Timestamp: new Date(log.timestamp).toLocaleString(),
        'User ID': log.employeeId,
        'User Name': log.user
          ? `${log.user.firstName} ${log.user.lastName}`
          : 'N/A',
        'Event Type': log.action,
        Description: log.description,
        'Entity ID': log.entityId || 'N/A',
        'IP Address': log.ipAddress || 'N/A',
        'User Agent': log.userAgent || 'N/A',
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Logs');

      // Set column widths
      const colWidths = [
        { wch: 20 }, // Timestamp
        { wch: 15 }, // User ID
        { wch: 25 }, // User Name
        { wch: 30 }, // Event Type
        { wch: 50 }, // Description
        { wch: 20 }, // Entity ID
        { wch: 15 }, // IP Address
        { wch: 40 }, // User Agent
      ];
      worksheet['!cols'] = colWidths;

      // Generate filename with current date
      const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      toast.success(`Exported ${exportData.length} records to Excel`);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.message || 'Failed to export audit logs');
    } finally {
      setIsExporting(false);
    }
  };

  const getEventTypeColor = (action: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    if (!action) return 'default';

    // Specific color mapping for each event type
    switch (action) {
      // Authentication & Login (info - blue)
      case 'USER_LOGIN':
        return 'info';

      // Password operations (secondary - purple)
      case 'PASSWORD_CHANGED':
      case 'LMS_USER_PASSWORD_RESET':
        return 'secondary';

      // Creation operations (success - green)
      case 'EMPLOYEE_CREATED':
      case 'LMS_USER_CREATED':
      case 'HOLIDAY_CREATED':
        return 'success';

      // Import operations (info - blue)
      case 'EMPLOYEES_IMPORTED':
        return 'info';

      // Update/Edit operations (warning - orange)
      case 'EMPLOYEE_UPDATED':
      case 'LMS_USER_ROLE_CHANGED':
      case 'LMS_USER_STATUS_CHANGED':
      case 'LEAVE_UPDATED':
        return 'warning';

      // Delete operations (error - red)
      case 'EMPLOYEE_DELETED':
      case 'LMS_USER_DELETED':
      case 'HOLIDAY_DELETED':
        return 'error';

      // Balance operations (primary - dark blue)
      case 'LEAVE_BALANCE_ALLOCATED':
      case 'LEAVE_BALANCE_ADJUSTED':
        return 'primary';

      // Leave application (info - blue)
      case 'LEAVE_APPLIED':
        return 'info';

      // Leave approval (success - green)
      case 'LEAVE_APPROVED':
        return 'success';

      // Leave rejection/cancellation (error - red)
      case 'LEAVE_REJECTED':
      case 'LEAVE_CANCELLED':
        return 'error';

      // Default for unknown types
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Assessment sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Audit Logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View comprehensive logs of all system activities and user actions
          </Typography>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load audit logs. {(error as any)?.message || 'Please try again.'}
        </Alert>
      )}

      {/* Filters Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              fullWidth
              label="User ID"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              size="small"
              placeholder="Search by User ID"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              fullWidth
              label="User Name"
              value={filters.userName}
              onChange={(e) => handleFilterChange('userName', e.target.value)}
              size="small"
              placeholder="Search by name"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              fullWidth
              select
              label="Event Type"
              value={filters.eventType}
              onChange={(e) => handleFilterChange('eventType', e.target.value)}
              size="small"
            >
              <MenuItem value="">All Events</MenuItem>
              <MenuItem value="USER_LOGIN">User Login</MenuItem>
              <MenuItem value="PASSWORD_CHANGED">Password Changed</MenuItem>
              <MenuItem value="EMPLOYEE_CREATED">Employee Created</MenuItem>
              <MenuItem value="EMPLOYEE_UPDATED">Employee Updated</MenuItem>
              <MenuItem value="EMPLOYEE_DELETED">Employee Deleted</MenuItem>
              <MenuItem value="EMPLOYEES_IMPORTED">Employees Imported</MenuItem>
              <MenuItem value="LMS_USER_CREATED">LMS User Created</MenuItem>
              <MenuItem value="LMS_USER_ROLE_CHANGED">User Role Updated</MenuItem>
              <MenuItem value="LMS_USER_STATUS_CHANGED">User Status Changed</MenuItem>
              <MenuItem value="LMS_USER_PASSWORD_RESET">Password Reset</MenuItem>
              <MenuItem value="LMS_USER_DELETED">User Deleted</MenuItem>
              <MenuItem value="LEAVE_BALANCE_ALLOCATED">Leave Balance Allocated</MenuItem>
              <MenuItem value="LEAVE_BALANCE_ADJUSTED">Leave Balance Adjusted</MenuItem>
              <MenuItem value="HOLIDAY_CREATED">Holiday Created</MenuItem>
              <MenuItem value="HOLIDAY_DELETED">Holiday Deleted</MenuItem>
              <MenuItem value="LEAVE_APPLIED">Leave Applied</MenuItem>
              <MenuItem value="LEAVE_UPDATED">Leave Updated</MenuItem>
              <MenuItem value="LEAVE_CANCELLED">Leave Cancelled</MenuItem>
              <MenuItem value="LEAVE_APPROVED">Leave Approved</MenuItem>
              <MenuItem value="LEAVE_REJECTED">Leave Rejected</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              fullWidth
              label="From Date"
              type="date"
              value={filters.fromDate}
              onChange={(e) => handleFilterChange('fromDate', e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              fullWidth
              label="To Date"
              type="date"
              value={filters.toDate}
              onChange={(e) => handleFilterChange('toDate', e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Clear />}
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={isLoading}
            >
              Data Refresh
            </Button>
          </Box>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExportToExcel}
            disabled={isExporting || isLoading}
            sx={{
              bgcolor: '#388e3c !important',
              background: '#388e3c !important',
              backgroundImage: 'none !important',
              color: '#ffffff !important',
              fontWeight: 700,
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
            {isExporting ? 'Exporting...' : 'Export Excel'}
          </Button>
        </Box>
      </Paper>

      {/* Audit Logs Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">Timestamp</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>User Name</TableCell>
                <TableCell>Event Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>IP Address</TableCell>
              </TableRow>
              <TableRow>
                <TableCell align="center" sx={{ py: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Filter timestamp..."
                    value={columnFilters.timestamp}
                    onChange={(e) => handleColumnFilterChange('timestamp', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FilterAlt fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ minWidth: 150 }}
                  />
                </TableCell>
                <TableCell sx={{ py: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Filter user ID..."
                    value={columnFilters.userId}
                    onChange={(e) => handleColumnFilterChange('userId', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FilterAlt fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    fullWidth
                  />
                </TableCell>
                <TableCell sx={{ py: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Filter name..."
                    value={columnFilters.userName}
                    onChange={(e) => handleColumnFilterChange('userName', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FilterAlt fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    fullWidth
                  />
                </TableCell>
                <TableCell sx={{ py: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Filter event..."
                    value={columnFilters.eventType}
                    onChange={(e) => handleColumnFilterChange('eventType', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FilterAlt fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    fullWidth
                  />
                </TableCell>
                <TableCell sx={{ py: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Filter description..."
                    value={columnFilters.description}
                    onChange={(e) => handleColumnFilterChange('description', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FilterAlt fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    fullWidth
                  />
                </TableCell>
                <TableCell sx={{ py: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Filter IP..."
                    value={columnFilters.ipAddress}
                    onChange={(e) => handleColumnFilterChange('ipAddress', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FilterAlt fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    fullWidth
                  />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : auditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                    <Typography variant="body1" color="text.secondary">
                      No audit logs found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                auditLogs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell align="center">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>{log.employeeId}</TableCell>
                    <TableCell>
                      {log.user
                        ? `${log.user.firstName} ${log.user.lastName}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.action}
                        color={getEventTypeColor(log.action)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{log.description}</TableCell>
                    <TableCell>{log.ipAddress || 'N/A'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {!isLoading && auditLogs.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[25, 50, 100]}
            component="div"
            count={pagination.total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </Paper>
    </Container>
  );
};

export default AuditLogsPage;

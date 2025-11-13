import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  ButtonGroup,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  InputAdornment,
  Checkbox,
  Alert,
} from '@mui/material';
import { CheckCircle, Cancel, Search, Download } from '@mui/icons-material';
import { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import api from '../config/api';
import { useAuth } from '../contexts/AuthContext';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [rejectionDialog, setRejectionDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [bulkRejectDialog, setBulkRejectDialog] = useState(false);
  const [bulkRejectionReason, setBulkRejectionReason] = useState('');
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Filter states
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch approvals - use different endpoint for admin vs manager
  const { data: approvals, isLoading } = useQuery({
    queryKey: ['approvals', regionFilter, statusFilter, isAdmin ? debouncedSearch : ''],
    queryFn: async () => {
      if (isAdmin) {
        // Admin: fetch all leaves with filters
        const params = new URLSearchParams();
        if (regionFilter !== 'All') params.append('region', regionFilter);
        if (statusFilter !== 'All') params.append('status', statusFilter);
        if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());

        const response = await api.get(`/admin/all-leaves?${params.toString()}`);
        return response.data.data;
      } else {
        // Manager: fetch team leave requests with filters
        const params = new URLSearchParams();
        if (statusFilter !== 'All') params.append('status', statusFilter);

        const response = await api.get(`/leaves/team/all?${params.toString()}`);
        return response.data.data;
      }
    },
    placeholderData: (previousData) => previousData, // Keep previous data while fetching to maintain focus
  });

  // Filter approvals for managers (client-side search)
  const filteredApprovals = useMemo(() => {
    if (!approvals) return [];

    // For managers, apply search filter client-side
    if (!isAdmin && debouncedSearch.trim()) {
      const searchLower = debouncedSearch.trim().toLowerCase();
      return approvals.filter((leave: any) => {
        const employeeId = leave.user?.employeeId?.toLowerCase() || '';
        const firstName = leave.user?.firstName?.toLowerCase() || '';
        const lastName = leave.user?.lastName?.toLowerCase() || '';
        return employeeId.includes(searchLower) ||
               firstName.includes(searchLower) ||
               lastName.includes(searchLower);
      });
    }

    return approvals;
  }, [approvals, isAdmin, debouncedSearch]);

  // Get pending leaves that can be selected
  const pendingLeaves = useMemo(() => {
    if (!filteredApprovals) return [];
    return filteredApprovals.filter((leave: any) => {
      return leave.status === 'PENDING';
    });
  }, [filteredApprovals]);

  // Check if all pending leaves are selected
  const allPendingSelected = useMemo(() => {
    if (pendingLeaves.length === 0) return false;
    return pendingLeaves.every((leave: any) => {
      return selectedIds.has(leave.id);
    });
  }, [pendingLeaves, selectedIds]);

  // Export to Excel function
  const handleExportToExcel = () => {
    try {
      if (!filteredApprovals || filteredApprovals.length === 0) {
        toast.error('No data to export');
        return;
      }

      // Prepare data for export
      const exportData = filteredApprovals.map((leave: any) => {
        // Get approver - check approvals array first, then fall back to manager
        let approver = '-';

        // Check if there's an approval record with an approver
        if (leave.approvals && leave.approvals.length > 0) {
          const latestApproval = leave.approvals[0];
          if (latestApproval.approver) {
            approver = `${latestApproval.approver.firstName} ${latestApproval.approver.lastName}`;
          }
        }

        // Fall back to reporting manager if no approver found
        if (approver === '-' && leave.user?.manager) {
          approver = `${leave.user.manager.firstName} ${leave.user.manager.lastName}`;
        }

        return {
          'Employee ID': leave.user?.employeeId || '-',
          'Employee Name': `${leave.user?.firstName || ''} ${leave.user?.lastName || ''}`.trim() || '-',
          'Region': leave.user?.region || '-',
          'Leave Type': leave.leaveType?.name || '-',
          'Start Date': leave.startDate ? new Date(leave.startDate).toLocaleDateString() : '-',
          'End Date': leave.endDate ? new Date(leave.endDate).toLocaleDateString() : '-',
          'Days': leave.totalDays || 0,
          'Status': leave.status || '-',
          'Applied On': leave.appliedDate ? new Date(leave.appliedDate).toLocaleDateString() : '-',
          'Approver': approver,
          'Reason': leave.reason || '-',
        };
      });

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 15 }, // Employee ID
        { wch: 25 }, // Employee Name
        { wch: 10 }, // Region
        { wch: 20 }, // Leave Type
        { wch: 15 }, // Start Date
        { wch: 15 }, // End Date
        { wch: 8 },  // Days
        { wch: 12 }, // Status
        { wch: 15 }, // Applied On
        { wch: 25 }, // Approver
        { wch: 40 }, // Reason
      ];
      worksheet['!cols'] = columnWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Leave Requests');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Leave_Requests_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      toast.success(`Exported ${filteredApprovals.length} leave request(s) to Excel`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data to Excel');
    }
  };

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (leaveId: string) => {
      const response = await api.post(`/leaves/${leaveId}/approve`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Leave request approved successfully!');
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve leave');
    },
  });

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: async (leaveIds: string[]) => {
      const results = await Promise.allSettled(
        leaveIds.map(id => api.post(`/leaves/${id}/approve`))
      );
      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;

      if (failCount === 0) {
        toast.success(`${successCount} leave request(s) approved successfully!`);
      } else {
        toast.warning(`${successCount} approved, ${failCount} failed`);
      }

      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      setSelectedIds(new Set());
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve leaves');
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
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      setRejectionDialog(false);
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject leave');
    },
  });

  // Bulk reject mutation
  const bulkRejectMutation = useMutation({
    mutationFn: async ({ leaveIds, reason }: { leaveIds: string[]; reason: string }) => {
      const results = await Promise.allSettled(
        leaveIds.map(id => api.post(`/leaves/${id}/reject`, { rejectionReason: reason }))
      );
      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;

      if (failCount === 0) {
        toast.success(`${successCount} leave request(s) rejected successfully!`);
      } else {
        toast.warning(`${successCount} rejected, ${failCount} failed`);
      }

      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      setSelectedIds(new Set());
      setBulkRejectDialog(false);
      setBulkRejectionReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject leaves');
    },
  });

  // Cancel mutation (for approved leaves where start date hasn't elapsed)
  const cancelMutation = useMutation({
    mutationFn: async ({ leaveId, reason }: { leaveId: string; reason: string }) => {
      const response = await api.post(`/leaves/${leaveId}/cancel`, {
        reason,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Leave request cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      setCancelDialog(false);
      setCancelReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel leave');
    },
  });

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

  const handleSelectAll = () => {
    if (allPendingSelected) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(
        pendingLeaves.map((leave: any) => leave.id)
      );
      setSelectedIds(allIds);
    }
  };

  const handleSelectOne = (leaveId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(leaveId)) {
      newSelected.delete(leaveId);
    } else {
      newSelected.add(leaveId);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkApprove = () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one leave request');
      return;
    }
    bulkApproveMutation.mutate(Array.from(selectedIds));
  };

  const handleBulkReject = () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one leave request');
      return;
    }
    setBulkRejectDialog(true);
  };

  const handleBulkRejectSubmit = () => {
    if (!bulkRejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    bulkRejectMutation.mutate({
      leaveIds: Array.from(selectedIds),
      reason: bulkRejectionReason,
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

  // Check if leave can be cancelled (approved and start date hasn't elapsed)
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
        return { color: 'success' as const };  // #11998e (teal)
      case 'REJECTED':
        return { color: 'error' as const };    // #f857a6 (pink)
      case 'PENDING':
        // Use original orange
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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isAdmin ? 'All Leave Requests' : 'Team Leave Requests'}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {isAdmin
          ? 'View and manage all employee leave requests'
          : 'Review and approve leave requests from your team'
        }
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mt: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Region Filter - Admin only */}
          {isAdmin && (
            <Box>
              <Typography variant="caption" display="block" sx={{ mb: 0.5, fontWeight: 600 }}>
                Region
              </Typography>
              <ToggleButtonGroup
                value={regionFilter}
                exclusive
                onChange={(e, value) => value && setRegionFilter(value)}
                size="small"
              >
                <ToggleButton value="All">All</ToggleButton>
                <ToggleButton value="IND">IND</ToggleButton>
                <ToggleButton value="US">US</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}

          {/* Status Filter */}
          <Box>
            <Typography variant="caption" display="block" sx={{ mb: 0.5, fontWeight: 600 }}>
              Status
            </Typography>
            <ToggleButtonGroup
              value={statusFilter}
              exclusive
              onChange={(e, value) => value && setStatusFilter(value)}
              size="small"
            >
              <ToggleButton value="All">All</ToggleButton>
              <ToggleButton value="PENDING">Pending</ToggleButton>
              <ToggleButton value="APPROVED">Approved</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Search Filter */}
          <Box sx={{ flexGrow: 1, minWidth: 250 }}>
            <Typography variant="caption" display="block" sx={{ mb: 0.5, fontWeight: 600 }}>
              Search
            </Typography>
            <TextField
              size="small"
              placeholder="Search by Employee ID or Name"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Bulk Actions */}
      <Box sx={{ mt: 2, mb: 2, display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleExportToExcel}
          disabled={!filteredApprovals || filteredApprovals.length === 0}
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
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {selectedIds.size > 0 && (
            <Typography variant="body2" color="text.secondary">
              {selectedIds.size} leave request(s) selected
            </Typography>
          )}
        <ButtonGroup size="small">
          <Button
            variant="contained"
            startIcon={<CheckCircle />}
            onClick={handleBulkApprove}
            disabled={selectedIds.size === 0 || bulkApproveMutation.isPending}
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
            Approve {selectedIds.size > 0 && `(${selectedIds.size})`}
          </Button>
          <Button
            variant="contained"
            startIcon={<Cancel />}
            onClick={handleBulkReject}
            disabled={selectedIds.size === 0 || bulkRejectMutation.isPending}
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
            Reject {selectedIds.size > 0 && `(${selectedIds.size})`}
          </Button>
        </ButtonGroup>
        </Box>
      </Box>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {pendingLeaves.length > 0 && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={allPendingSelected}
                        indeterminate={selectedIds.size > 0 && !allPendingSelected}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                  )}
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Employee</TableCell>
                  {isAdmin && <TableCell>Region</TableCell>}
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
                {filteredApprovals?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 13 : 12} align="center">
                      {isAdmin ? 'No leave requests found' : 'No team leave requests found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApprovals?.map((leave: any) => {
                    const isPending = leave.status === 'PENDING';
                    const isSelected = selectedIds.has(leave.id);

                    return (
                      <TableRow key={leave.id} selected={isSelected}>
                        {pendingLeaves.length > 0 && (
                          <TableCell padding="checkbox">
                            {isPending ? (
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleSelectOne(leave.id)}
                              />
                            ) : (
                              <Box sx={{ width: 42 }} />
                            )}
                          </TableCell>
                        )}
                        <TableCell>{leave.user.employeeId}</TableCell>
                        <TableCell>
                          {leave.user.firstName} {leave.user.lastName}
                        </TableCell>
                        {isAdmin && <TableCell>{leave.user.region}</TableCell>}
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
                          <Chip
                            label={leave.status}
                            {...getStatusColor(leave.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {isPending ? (
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
                          ) : canCancelLeave(leave) ? (
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
                            <Typography variant="body2" color="text.secondary">
                              {leave.status === 'APPROVED' && 'Approved'}
                              {leave.status === 'REJECTED' && 'Rejected'}
                              {leave.status === 'CANCELLED' && 'Cancelled'}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Single Rejection Dialog */}
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

      {/* Bulk Rejection Dialog */}
      <Dialog open={bulkRejectDialog} onClose={() => setBulkRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Reject Leave Requests</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
            You are about to reject {selectedIds.size} leave request(s)
          </Alert>
          <TextField
            label="Rejection Reason"
            value={bulkRejectionReason}
            onChange={(e) => setBulkRejectionReason(e.target.value)}
            multiline
            rows={4}
            fullWidth
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkRejectDialog(false)}>Cancel</Button>
          <Button
            onClick={handleBulkRejectSubmit}
            variant="contained"
            color="error"
            disabled={bulkRejectMutation.isPending}
          >
            {bulkRejectMutation.isPending ? 'Rejecting...' : `Reject ${selectedIds.size} Request(s)`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Leave Dialog */}
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

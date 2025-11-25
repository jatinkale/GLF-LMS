import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Upload as UploadIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  CloudUpload,
  Close as CloseIcon,
  CheckCircle,
  Cancel,
  GroupAdd as GroupAddIcon,
  ManageAccounts as ManageAccountsIcon,
  Download,
  People,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowSelectionModel } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import api from '../config/api';
import toast from 'react-hot-toast';

interface Employee {
  employeeId: string;
  firstName: string;
  lastName: string;
  gender?: string;
  email: string;
  phoneNumber?: string;
  dateOfJoining: string;
  exitDate?: string;
  location?: string;
  designation?: string;
  department?: string;
  employmentType?: 'FTE' | 'FTDC' | 'CONSULTANT';
  reportingManager: string;
  reportingManagerId: string;
  lmsAccess: 'EMP' | 'MGR';
  isActive: boolean;
  lmsUserCreated: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EmployeeFormData {
  employeeId: string;
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  phoneNumber: string;
  dateOfJoining: string;
  exitDate: string;
  location: string;
  designation: string;
  department: string;
  employmentType: string;
  reportingManager: string;
  reportingManagerId: string;
  lmsAccess: 'EMP' | 'MGR';
  isActive: boolean;
}

interface LMSUser {
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'EMPLOYEE' | 'MANAGER';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

const initialFormData: EmployeeFormData = {
  employeeId: '',
  firstName: '',
  lastName: '',
  gender: '',
  email: '',
  phoneNumber: '',
  dateOfJoining: '',
  exitDate: '',
  location: '',
  designation: '',
  department: '',
  employmentType: '',
  reportingManager: '',
  reportingManagerId: '',
  lmsAccess: 'EMP',
  isActive: true,
};

export default function EmployeeDetailsPage() {
  const queryClient = useQueryClient();
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openLMSUserModal, setOpenLMSUserModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [lmsUserRole, setLmsUserRole] = useState<'EMPLOYEE' | 'MANAGER'>('EMPLOYEE');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'reset' | 'toggle' | 'delete' | null>(null);

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [locationFilter, setLocationFilter] = useState<string>('All');
  const [reportingManagerFilter, setReportingManagerFilter] = useState<string>('All');
  const [lmsUserCreatedFilter, setLmsUserCreatedFilter] = useState<string>('All');

  // Fetch all employees
  const { data: employeesData, isLoading, error, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/employees');
      return response.data.data;
    },
    retry: 2,
  });

  // Create employee mutation
  const createMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const response = await api.post('/employees', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Employee created successfully');
      setOpenAddModal(false);
      setFormData(initialFormData);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create employee');
    },
  });

  // Update employee mutation
  const updateMutation = useMutation({
    mutationFn: async ({ employeeId, data }: { employeeId: string; data: Partial<EmployeeFormData> }) => {
      const response = await api.put(`/employees/${employeeId}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Employee updated successfully');
      setOpenEditModal(false);
      setSelectedEmployee(null);
      setFormData(initialFormData);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update employee');
    },
  });

  // Import Excel mutation
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/employees/import/excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setImportDialogOpen(false);
      setImportFile(null);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to import employees';
      const errors = error.response?.data?.errors;

      if (errors && errors.length > 0) {
        toast.error(`${errorMessage}: ${errors.slice(0, 3).join(', ')}`);
      } else {
        toast.error(errorMessage);
      }
    },
  });

  // Create LMS Users mutation
  const createLMSUsersMutation = useMutation({
    mutationFn: async (employeeIds: string[]) => {
      const response = await api.post('/employees/create-lms-users', { employeeIds });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setSelectedRows([]);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create LMS users';
      toast.error(errorMessage);
    },
  });

  // Fetch LMS user by employee ID
  const { data: lmsUserData, isLoading: isLoadingLMSUser } = useQuery({
    queryKey: ['lmsUser', selectedEmployee?.employeeId],
    queryFn: async () => {
      if (!selectedEmployee?.employeeId) return null;
      const response = await api.get(`/users/by-employee/${selectedEmployee.employeeId}`);
      return response.data.data as LMSUser;
    },
    enabled: openLMSUserModal && !!selectedEmployee?.employeeId,
    retry: 1,
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const response = await api.post(`/users/${employeeId}/reset-password`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password reset successfully to Password-123');
      setConfirmDialogOpen(false);
      setConfirmAction(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    },
  });

  // Toggle user status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ employeeId, isActive }: { employeeId: string; isActive: boolean }) => {
      const response = await api.patch(`/users/${employeeId}/toggle-status`, { isActive });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setConfirmDialogOpen(false);
      setConfirmAction(null);
      queryClient.invalidateQueries({ queryKey: ['lmsUser', selectedEmployee?.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ employeeId, role }: { employeeId: string; role: 'EMPLOYEE' | 'MANAGER' }) => {
      const response = await api.patch(`/users/${employeeId}/role`, { role });
      return response.data;
    },
    onSuccess: () => {
      toast.success('User role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['lmsUser', selectedEmployee?.employeeId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user role');
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const response = await api.delete(`/users/${employeeId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('User deleted successfully');
      setConfirmDialogOpen(false);
      setConfirmAction(null);
      setOpenLMSUserModal(false);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });

  const handleCreateLMSUsers = () => {
    console.log('Button clicked! Selected rows:', selectedRows);

    // Extract IDs from the selection model
    let employeeIds: string[] = [];
    if (Array.isArray(selectedRows)) {
      employeeIds = selectedRows.map(id => String(id));
    } else if (selectedRows && typeof selectedRows === 'object' && 'ids' in selectedRows) {
      // Handle the {type: 'include', ids: Set(...)} structure
      employeeIds = Array.from(selectedRows.ids as Set<any>).map(id => String(id));
    }

    if (employeeIds.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }

    console.log('Creating LMS users for:', employeeIds);
    createLMSUsersMutation.mutate(employeeIds);
  };

  const handleAddEmployee = () => {
    setFormData(initialFormData);
    setOpenAddModal(true);
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setOpenViewModal(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      gender: employee.gender || '',
      email: employee.email,
      phoneNumber: employee.phoneNumber || '',
      dateOfJoining: employee.dateOfJoining ? new Date(employee.dateOfJoining).toISOString().split('T')[0] : '',
      exitDate: employee.exitDate ? new Date(employee.exitDate).toISOString().split('T')[0] : '',
      location: employee.location || '',
      designation: employee.designation || '',
      department: employee.department || '',
      employmentType: employee.employmentType ? employee.employmentType : '',
      reportingManager: employee.reportingManager || '',
      reportingManagerId: employee.reportingManagerId || '',
      lmsAccess: employee.lmsAccess,
      isActive: employee.isActive,
    });
    setOpenEditModal(true);
  };

  const handleManageLMSUser = (employee: Employee) => {
    setSelectedEmployee(employee);
    setOpenLMSUserModal(true);
  };

  const handleResetPassword = () => {
    setConfirmAction('reset');
    setConfirmDialogOpen(true);
  };

  const handleToggleUserStatus = () => {
    setConfirmAction('toggle');
    setConfirmDialogOpen(true);
  };

  const handleDeleteUser = () => {
    setConfirmAction('delete');
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (!lmsUserData?.employeeId) return;

    switch (confirmAction) {
      case 'reset':
        resetPasswordMutation.mutate(lmsUserData.employeeId);
        break;
      case 'toggle':
        toggleUserStatusMutation.mutate({
          employeeId: lmsUserData.employeeId,
          isActive: !lmsUserData.isActive,
        });
        break;
      case 'delete':
        deleteUserMutation.mutate(lmsUserData.employeeId);
        break;
    }
  };

  const handleUpdateUserRole = (newRole: 'EMPLOYEE' | 'MANAGER') => {
    if (!lmsUserData?.employeeId) return;
    setLmsUserRole(newRole);
    updateUserRoleMutation.mutate({
      employeeId: lmsUserData.employeeId,
      role: newRole,
    });
  };

  const handleSubmitAdd = () => {
    // Validation - All fields are mandatory except Exit Date
    const requiredFields = [
      { value: formData.employeeId, name: 'Employee ID' },
      { value: formData.firstName, name: 'First Name' },
      { value: formData.lastName, name: 'Last Name' },
      { value: formData.gender, name: 'Gender' },
      { value: formData.email, name: 'Email ID' },
      { value: formData.phoneNumber, name: 'Phone Number' },
      { value: formData.dateOfJoining, name: 'Date of Joining' },
      { value: formData.location, name: 'Location' },
      { value: formData.designation, name: 'Designation' },
      { value: formData.department, name: 'Department' },
      { value: formData.employmentType, name: 'Employment Type' },
      { value: formData.reportingManager, name: 'Reporting Manager' },
      { value: formData.reportingManagerId, name: 'Reporting Manager ID' },
    ];

    const emptyFields = requiredFields.filter(field => !field.value || field.value.trim() === '');

    if (emptyFields.length > 0) {
      const fieldNames = emptyFields.map(field => field.name).join(', ');
      toast.error(`Please fill in all mandatory fields: ${fieldNames}`);
      return;
    }

    createMutation.mutate(formData);
  };

  const handleSubmitEdit = () => {
    if (!selectedEmployee) return;

    // Validation - All fields are mandatory except Exit Date
    const requiredFields = [
      { value: formData.firstName, name: 'First Name' },
      { value: formData.lastName, name: 'Last Name' },
      { value: formData.gender, name: 'Gender' },
      { value: formData.email, name: 'Email ID' },
      { value: formData.phoneNumber, name: 'Phone Number' },
      { value: formData.dateOfJoining, name: 'Date of Joining' },
      { value: formData.location, name: 'Location' },
      { value: formData.designation, name: 'Designation' },
      { value: formData.department, name: 'Department' },
      { value: formData.employmentType, name: 'Employment Type' },
      { value: formData.reportingManager, name: 'Reporting Manager' },
      { value: formData.reportingManagerId, name: 'Reporting Manager ID' },
    ];

    const emptyFields = requiredFields.filter(field => !field.value || field.value.trim() === '');

    if (emptyFields.length > 0) {
      const fieldNames = emptyFields.map(field => field.name).join(', ');
      toast.error(`Please fill in all mandatory fields: ${fieldNames}`);
      return;
    }

    updateMutation.mutate({
      employeeId: selectedEmployee.employeeId,
      data: formData,
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('Please select a valid Excel file (.xls or .xlsx)');
        return;
      }

      setImportFile(file);
    }
  };

  const handleImport = () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    importMutation.mutate(importFile);
  };

  const columns: GridColDef[] = [
    {
      field: 'employeeId',
      headerName: 'Employee ID',
      width: 130,
      headerClassName: 'datagrid-header',
    },
    {
      field: 'firstName',
      headerName: 'First Name',
      width: 140,
      headerClassName: 'datagrid-header',
    },
    {
      field: 'lastName',
      headerName: 'Last Name',
      width: 140,
      headerClassName: 'datagrid-header',
    },
    {
      field: 'gender',
      headerName: 'Gender',
      width: 100,
      headerClassName: 'datagrid-header',
    },
    {
      field: 'email',
      headerName: 'Email ID',
      width: 220,
      headerClassName: 'datagrid-header',
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 130,
      headerClassName: 'datagrid-header',
    },
    {
      field: 'reportingManager',
      headerName: 'Reporting Manager',
      width: 180,
      headerClassName: 'datagrid-header',
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      headerClassName: 'datagrid-header',
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
          icon={params.value ? <CheckCircle /> : <Cancel />}
        />
      ),
    },
    {
      field: 'lmsUserCreated',
      headerName: 'LMS User Created',
      width: 150,
      headerClassName: 'datagrid-header',
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          color={params.value ? 'success' : 'warning'}
          size="small"
          variant={params.value ? 'filled' : 'outlined'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Action',
      width: 160,
      headerClassName: 'datagrid-header',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              color="info"
              onClick={() => handleViewEmployee(params.row as Employee)}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Employee">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleEditEmployee(params.row as Employee)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Manage LMS User">
            <span>
              <IconButton
                size="small"
                color="secondary"
                onClick={() => handleManageLMSUser(params.row as Employee)}
                disabled={!(params.row as Employee).lmsUserCreated}
              >
                <ManageAccountsIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load employee data. Please try refreshing the page.
        </Alert>
      </Box>
    );
  }

  const employees = employeesData || [];

  // Get unique values for filter dropdowns
  const locations = employees.map((emp: Employee) => emp.location).filter(Boolean) as string[];
  const uniqueLocations = ['All', ...Array.from(new Set(locations)).sort()];

  const managers = employees.map((emp: Employee) => emp.reportingManager).filter(Boolean) as string[];
  const uniqueReportingManagers = ['All', ...Array.from(new Set(managers)).sort()];

  // Apply filters to employees
  const filteredEmployees = employees.filter((emp: Employee) => {
    // Search filter (Employee Name or Employee ID)
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchLower) ||
        emp.employeeId.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'Active' && !emp.isActive) return false;
      if (statusFilter === 'Inactive' && emp.isActive) return false;
    }

    // Location filter
    if (locationFilter !== 'All' && emp.location !== locationFilter) {
      return false;
    }

    // Reporting Manager filter
    if (reportingManagerFilter !== 'All' && emp.reportingManager !== reportingManagerFilter) {
      return false;
    }

    // LMS User Created filter
    if (lmsUserCreatedFilter !== 'All') {
      if (lmsUserCreatedFilter === 'Yes' && !emp.lmsUserCreated) return false;
      if (lmsUserCreatedFilter === 'No' && emp.lmsUserCreated) return false;
    }

    return true;
  });

  // Export to Excel function
  const handleExportToExcel = () => {
    try {
      if (!employees || employees.length === 0) {
        toast.error('No employees to export');
        return;
      }

      // Prepare data for export
      const exportData = employees.map((emp: Employee) => ({
        'Employee ID': emp.employeeId,
        'First Name': emp.firstName,
        'Last Name': emp.lastName,
        'Gender': emp.gender || '-',
        'Email': emp.email,
        'Phone Number': emp.phoneNumber || '-',
        'Date of Joining': emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : '-',
        'Exit Date': emp.exitDate ? new Date(emp.exitDate).toLocaleDateString() : '-',
        'Location': emp.location || '-',
        'Designation': emp.designation || '-',
        'Department': emp.department || '-',
        'Employment Type': emp.employmentType || '-',
        'Reporting Manager': emp.reportingManager || '-',
        'Reporting Manager ID': emp.reportingManagerId || '-',
        'LMS Access': emp.lmsAccess || '-',
        'LMS User Created': emp.lmsUserCreated ? 'Yes' : 'No',
        'Active': emp.isActive ? 'Yes' : 'No',
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 15 }, // Employee ID
        { wch: 15 }, // First Name
        { wch: 15 }, // Last Name
        { wch: 10 }, // Gender
        { wch: 30 }, // Email
        { wch: 15 }, // Phone Number
        { wch: 15 }, // Date of Joining
        { wch: 15 }, // Exit Date
        { wch: 15 }, // Location
        { wch: 20 }, // Designation
        { wch: 20 }, // Department
        { wch: 18 }, // Employment Type
        { wch: 25 }, // Reporting Manager
        { wch: 20 }, // Reporting Manager ID
        { wch: 12 }, // LMS Access
        { wch: 18 }, // LMS User Created
        { wch: 10 }, // Active
      ];
      worksheet['!cols'] = columnWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Employees_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      toast.success(`Exported ${employees.length} employee(s) to Excel`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data to Excel');
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <People sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Employee Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage employee records and import data
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setImportDialogOpen(true)}
            sx={{
              bgcolor: '#4caf50 !important',
              background: '#4caf50 !important',
              backgroundImage: 'none !important',
              color: '#ffffff !important',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              border: '2px solid #4caf50',
              px: 3,
              py: 1,
              '&:hover': {
                bgcolor: '#388e3c !important',
                background: '#388e3c !important',
                backgroundImage: 'none !important',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              },
            }}
          >
            Import Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExportToExcel}
            disabled={employees.length === 0}
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
            Export Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddEmployee}
            sx={{
              bgcolor: '#2196f3 !important',
              background: '#2196f3 !important',
              backgroundImage: 'none !important',
              color: '#ffffff !important',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              border: '2px solid #2196f3',
              px: 3,
              py: 1,
              '&:hover': {
                bgcolor: '#1976d2 !important',
                background: '#1976d2 !important',
                backgroundImage: 'none !important',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              },
            }}
          >
            Add Employee
          </Button>
        </Box>
      </Box>

      {/* Data Grid Section */}
      <Paper
        sx={{
          p: 2,
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        {/* Quick Filters */}
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Quick Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Search Employee Name or ID"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Enter name or employee ID"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="All">All</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Location</InputLabel>
                <Select
                  value={locationFilter}
                  label="Location"
                  onChange={(e) => setLocationFilter(e.target.value)}
                >
                  {uniqueLocations.map((loc) => (
                    <MenuItem key={loc} value={loc}>
                      {loc}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Reporting Manager</InputLabel>
                <Select
                  value={reportingManagerFilter}
                  label="Reporting Manager"
                  onChange={(e) => setReportingManagerFilter(e.target.value)}
                >
                  {uniqueReportingManagers.map((mgr) => (
                    <MenuItem key={mgr} value={mgr}>
                      {mgr}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>LMS User Created</InputLabel>
                <Select
                  value={lmsUserCreatedFilter}
                  label="LMS User Created"
                  onChange={(e) => setLmsUserCreatedFilter(e.target.value)}
                >
                  <MenuItem value="All">All</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Showing {filteredEmployees.length} of {employees.length} employees
            </Typography>
            <Button
              size="small"
              onClick={() => {
                setSearchText('');
                setStatusFilter('All');
                setLocationFilter('All');
                setReportingManagerFilter('All');
                setLmsUserCreatedFilter('All');
              }}
              sx={{ textTransform: 'none' }}
            >
              Clear All Filters
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<GroupAddIcon />}
            onClick={handleCreateLMSUsers}
            disabled={
              (Array.isArray(selectedRows)
                ? selectedRows.length === 0
                : !selectedRows || !selectedRows.ids || selectedRows.ids.size === 0)
              || createLMSUsersMutation.isPending
            }
            sx={{
              bgcolor: '#f57c00 !important',
              background: '#f57c00 !important',
              backgroundImage: 'none !important',
              color: '#ffffff !important',
              fontWeight: 600,
              px: 3,
              py: 1,
              '&:hover': {
                bgcolor: '#e65100 !important',
                background: '#e65100 !important',
                backgroundImage: 'none !important',
              },
              '&:disabled': {
                bgcolor: '#bdbdbd !important',
                background: '#bdbdbd !important',
                backgroundImage: 'none !important',
                color: '#757575 !important',
              },
            }}
          >
            {createLMSUsersMutation.isPending
              ? 'Creating...'
              : (() => {
                  const count = Array.isArray(selectedRows)
                    ? selectedRows.length
                    : selectedRows?.ids?.size || 0;
                  return `Create/Update LMS Logins${count > 0 ? ` (${count})` : ''}`;
                })()
            }
          </Button>
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
          pageSizeOptions={[5, 10, 25, 50]}
          checkboxSelection
          disableColumnFilter
          onRowSelectionModelChange={(newSelection) => {
            console.log('Selection changed:', newSelection);
            setSelectedRows(newSelection);
          }}
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

      {/* Add Employee Modal */}
      <Dialog
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1, fontSize: '1.5rem', fontWeight: 600 }}>
          Add New Employee
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Employee ID"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={formData.gender}
                  label="Gender"
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="M">Male (M)</MenuItem>
                  <MenuItem value="F">Female (F)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Email ID"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Date of Joining"
                type="date"
                value={formData.dateOfJoining}
                onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Exit Date"
                type="date"
                value={formData.exitDate}
                onChange={(e) => setFormData({ ...formData, exitDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Designation"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Employment Type</InputLabel>
                <Select
                  value={formData.employmentType}
                  label="Employment Type"
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="FTE">FTE</MenuItem>
                  <MenuItem value="FTDC">FTDC</MenuItem>
                  <MenuItem value="CONSULTANT">Consultant</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Reporting Manager"
                placeholder="Enter 'NA' if no manager"
                value={formData.reportingManager}
                onChange={(e) => setFormData({ ...formData, reportingManager: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Reporting Manager ID"
                placeholder="Enter 'NA' if no manager"
                value={formData.reportingManagerId}
                onChange={(e) => setFormData({ ...formData, reportingManagerId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>LMS Access</InputLabel>
                <Select
                  value={formData.lmsAccess}
                  label="LMS Access"
                  onChange={(e) => setFormData({ ...formData, lmsAccess: e.target.value as 'EMP' | 'MGR' })}
                >
                  <MenuItem value="EMP">Employee (EMP)</MenuItem>
                  <MenuItem value="MGR">Manager (MGR)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenAddModal(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmitAdd}
            variant="contained"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Employee Modal */}
      <Dialog
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1, fontSize: '1.5rem', fontWeight: 600 }}>
          Edit Employee
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                disabled
                label="Employee ID"
                value={formData.employeeId}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={formData.gender}
                  label="Gender"
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="M">Male (M)</MenuItem>
                  <MenuItem value="F">Female (F)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Email ID"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Date of Joining"
                type="date"
                value={formData.dateOfJoining}
                onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Exit Date"
                type="date"
                value={formData.exitDate}
                onChange={(e) => setFormData({ ...formData, exitDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Designation"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Employment Type</InputLabel>
                <Select
                  value={formData.employmentType}
                  label="Employment Type"
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="FTE">FTE</MenuItem>
                  <MenuItem value="FTDC">FTDC</MenuItem>
                  <MenuItem value="CONSULTANT">Consultant</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Reporting Manager"
                placeholder="Enter 'NA' if no manager"
                value={formData.reportingManager}
                onChange={(e) => setFormData({ ...formData, reportingManager: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Reporting Manager ID"
                placeholder="Enter 'NA' if no manager"
                value={formData.reportingManagerId}
                onChange={(e) => setFormData({ ...formData, reportingManagerId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>LMS Access</InputLabel>
                <Select
                  value={formData.lmsAccess}
                  label="LMS Access"
                  onChange={(e) => setFormData({ ...formData, lmsAccess: e.target.value as 'EMP' | 'MGR' })}
                >
                  <MenuItem value="EMP">Employee (EMP)</MenuItem>
                  <MenuItem value="MGR">Manager (MGR)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenEditModal(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmitEdit}
            variant="contained"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Updating...' : 'Update Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Employee Modal */}
      <Dialog
        open={openViewModal}
        onClose={() => setOpenViewModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1, fontSize: '1.5rem', fontWeight: 600 }}>
          View Employee Details
        </DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Employee ID
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedEmployee.employeeId}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={selectedEmployee.isActive ? 'Active' : 'Inactive'}
                  color={selectedEmployee.isActive ? 'success' : 'default'}
                  size="small"
                  icon={selectedEmployee.isActive ? <CheckCircle /> : <Cancel />}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  First Name
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedEmployee.firstName}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Last Name
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedEmployee.lastName}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Gender
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedEmployee.gender || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedEmployee.email}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Phone Number
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedEmployee.phoneNumber || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Date of Joining
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedEmployee.dateOfJoining ? new Date(selectedEmployee.dateOfJoining).toLocaleDateString() : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Exit Date
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedEmployee.exitDate ? new Date(selectedEmployee.exitDate).toLocaleDateString() : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedEmployee.location || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Designation
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedEmployee.designation || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Department
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedEmployee.department || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Employment Type
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedEmployee.employmentType || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Reporting Manager
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedEmployee.reportingManager}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Manager ID
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedEmployee.reportingManagerId}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  LMS Access
                </Typography>
                <Chip
                  label={selectedEmployee.lmsAccess === 'MGR' ? 'Manager' : 'Employee'}
                  color={selectedEmployee.lmsAccess === 'MGR' ? 'primary' : 'default'}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  LMS User Created
                </Typography>
                <Chip
                  label={selectedEmployee.lmsUserCreated ? 'Yes' : 'No'}
                  color={selectedEmployee.lmsUserCreated ? 'success' : 'warning'}
                  size="small"
                  variant={selectedEmployee.lmsUserCreated ? 'filled' : 'outlined'}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenViewModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Import Excel Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1, fontSize: '1.5rem', fontWeight: 600 }}>
          Import Employees from Excel
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Please ensure your Excel file has the following headers in order:
              <br />
              Employee ID, First Name, Last Name, Gender, Email ID, Phone Number, Date of Joining, Exit Date, Location,
              Designation, Department, Employment Type, Reporting Manager, Reporting Manager ID, LMS Access, Active
            </Alert>

            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<CloudUpload />}
              sx={{ mb: 2, py: 1.5 }}
            >
              Select Excel File
              <input
                type="file"
                hidden
                accept=".xlsx,.xls"
                onChange={handleFileChange}
              />
            </Button>

            {importFile && (
              <Alert severity="success" icon={<CheckCircle />}>
                Selected file: {importFile.name}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setImportDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={!importFile || importMutation.isPending}
            startIcon={<UploadIcon />}
          >
            {importMutation.isPending ? 'Importing...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* LMS User Management Modal */}
      <Dialog
        open={openLMSUserModal}
        onClose={() => setOpenLMSUserModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1, fontSize: '1.5rem', fontWeight: 600 }}>
          LMS User Management
        </DialogTitle>
        <DialogContent>
          {isLoadingLMSUser ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : !lmsUserData ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              LMS user not found for this employee
            </Alert>
          ) : (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {!lmsUserData.isActive && !selectedEmployee?.isActive && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    This user is disabled because the employee is marked as Inactive.
                    To enable this user, first mark the employee as Active in Employee Management.
                  </Alert>
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="User Name"
                  value={`${lmsUserData.firstName} ${lmsUserData.lastName}`}
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Login ID"
                  value={lmsUserData.email}
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>User Access</InputLabel>
                  <Select
                    value={lmsUserData.role}
                    label="User Access"
                    onChange={(e) => handleUpdateUserRole(e.target.value as 'EMPLOYEE' | 'MANAGER')}
                  >
                    <MenuItem value="EMPLOYEE">Employee (EMP)</MenuItem>
                    <MenuItem value="MANAGER">Manager (MGR)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="User Status"
                  value={lmsUserData.isActive ? 'Enabled' : 'Disabled'}
                  disabled
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <Chip
                        label={lmsUserData.isActive ? 'Enabled' : 'Disabled'}
                        color={lmsUserData.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    ),
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={() => setOpenLMSUserModal(false)} color="inherit">
            Close
          </Button>
          {lmsUserData && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleResetPassword}
                disabled={resetPasswordMutation.isPending}
                sx={{
                  bgcolor: '#2196f3 !important',
                  background: '#2196f3 !important',
                  backgroundImage: 'none !important',
                  color: '#ffffff !important',
                  '&:hover': {
                    bgcolor: '#1976d2 !important',
                    background: '#1976d2 !important',
                    backgroundImage: 'none !important',
                  },
                }}
              >
                Reset Password
              </Button>
              <Tooltip
                title={
                  !lmsUserData.isActive && !selectedEmployee?.isActive
                    ? 'Cannot enable user - Employee is marked as Inactive'
                    : ''
                }
              >
                <span>
                  <Button
                    variant="contained"
                    onClick={handleToggleUserStatus}
                    disabled={
                      toggleUserStatusMutation.isPending ||
                      (!lmsUserData.isActive && !selectedEmployee?.isActive)
                    }
                    sx={{
                      bgcolor: lmsUserData.isActive ? '#ff9800 !important' : '#4caf50 !important',
                      background: lmsUserData.isActive ? '#ff9800 !important' : '#4caf50 !important',
                      backgroundImage: 'none !important',
                      color: '#ffffff !important',
                      '&:hover': {
                        bgcolor: lmsUserData.isActive ? '#f57c00 !important' : '#388e3c !important',
                        background: lmsUserData.isActive ? '#f57c00 !important' : '#388e3c !important',
                        backgroundImage: 'none !important',
                      },
                      '&:disabled': {
                        bgcolor: '#bdbdbd !important',
                        background: '#bdbdbd !important',
                        backgroundImage: 'none !important',
                        color: '#757575 !important',
                      },
                    }}
                  >
                    {lmsUserData.isActive ? 'Disable User' : 'Enable User'}
                  </Button>
                </span>
              </Tooltip>
              <Button
                variant="contained"
                onClick={handleDeleteUser}
                disabled={deleteUserMutation.isPending}
                sx={{
                  bgcolor: '#f44336 !important',
                  background: '#f44336 !important',
                  backgroundImage: 'none !important',
                  color: '#ffffff !important',
                  '&:hover': {
                    bgcolor: '#d32f2f !important',
                    background: '#d32f2f !important',
                    backgroundImage: 'none !important',
                  },
                }}
              >
                Delete User
              </Button>
            </Box>
          )}
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {confirmAction === 'reset' && 'Confirm Password Reset'}
          {confirmAction === 'toggle' && `Confirm ${lmsUserData?.isActive ? 'Disable' : 'Enable'} User`}
          {confirmAction === 'delete' && 'Confirm Delete User'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmAction === 'reset' &&
              'Are you sure you want to reset this user\'s password to "Password-123"?'}
            {confirmAction === 'toggle' &&
              `Are you sure you want to ${lmsUserData?.isActive ? 'disable' : 'enable'} this user?`}
            {confirmAction === 'delete' &&
              'Are you sure you want to delete this user? This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            color={confirmAction === 'delete' ? 'error' : 'primary'}
            disabled={
              resetPasswordMutation.isPending ||
              toggleUserStatusMutation.isPending ||
              deleteUserMutation.isPending
            }
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

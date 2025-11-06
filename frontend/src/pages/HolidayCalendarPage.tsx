import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Add, Delete, Save, Cancel, CalendarMonth } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../config/api';

interface Holiday {
  id: string;
  year: number;
  date: string;
  description: string;
  location: 'IND' | 'US';
  createdAt: string;
  updatedAt: string;
}

interface NewHoliday {
  year: number;
  date: Dayjs | null;
  description: string;
  location: 'IND' | 'US' | '';
}

export default function HolidayCalendarPage() {
  const currentYear = new Date().getFullYear();
  const queryClient = useQueryClient();

  const [isAdding, setIsAdding] = useState(false);
  const [newHoliday, setNewHoliday] = useState<NewHoliday>({
    year: currentYear,
    date: null,
    description: '',
    location: '',
  });

  const [filters, setFilters] = useState({
    year: currentYear.toString(),
    location: 'All',
  });

  // Fetch holidays
  const { data: holidays, isLoading } = useQuery({
    queryKey: ['holidays', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.year && filters.year !== 'All') params.append('year', filters.year);
      if (filters.location && filters.location !== 'All') params.append('location', filters.location);

      const response = await api.get(`/holidays?${params.toString()}`);
      return response.data.data as Holiday[];
    },
  });

  // Create holiday mutation
  const createMutation = useMutation({
    mutationFn: async (data: { year: number; date: string; description: string; location: string }) => {
      const response = await api.post('/holidays', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Holiday added successfully');
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      setIsAdding(false);
      setNewHoliday({ year: currentYear, date: null, description: '', location: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add holiday');
    },
  });

  // Delete holiday mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/holidays/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Holiday deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete holiday');
    },
  });

  const handleAddClick = () => {
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!newHoliday.date || !newHoliday.description || !newHoliday.location) {
      toast.error('Please fill in all fields');
      return;
    }

    createMutation.mutate({
      year: newHoliday.year,
      date: newHoliday.date.format('YYYY-MM-DD'),
      description: newHoliday.description,
      location: newHoliday.location,
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewHoliday({ year: currentYear, date: null, description: '', location: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this holiday?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CalendarMonth sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Holiday Calendar
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage public holidays for different locations
              </Typography>
            </Box>
          </Box>

          {/* Add Holiday Button */}
          {!isAdding && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddClick}
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
              Add Holiday
            </Button>
          )}
        </Box>

        {/* Quick Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {/* Year Filter */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
                Year
              </Typography>
              <ToggleButtonGroup
                value={filters.year}
                exclusive
                onChange={(e, newValue) => {
                  if (newValue !== null) {
                    setFilters({ ...filters, year: newValue });
                  }
                }}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    px: 2,
                    py: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: '#677eea',
                      color: '#fff',
                      '&:hover': {
                        backgroundColor: '#5568d3',
                      },
                    },
                  },
                }}
              >
                <ToggleButton value={(currentYear - 1).toString()}>
                  {currentYear - 1}
                </ToggleButton>
                <ToggleButton value={currentYear.toString()}>{currentYear}</ToggleButton>
                <ToggleButton value={(currentYear + 1).toString()}>
                  {currentYear + 1}
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Location Filter */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
                Location
              </Typography>
              <ToggleButtonGroup
                value={filters.location}
                exclusive
                onChange={(e, newValue) => {
                  if (newValue !== null) {
                    setFilters({ ...filters, location: newValue });
                  }
                }}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    px: 2,
                    py: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: '#677eea',
                      color: '#fff',
                      '&:hover': {
                        backgroundColor: '#5568d3',
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="All">All</ToggleButton>
                <ToggleButton value="IND">India</ToggleButton>
                <ToggleButton value="US">United States</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </Paper>

        {/* Holidays Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>Year</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Holiday Description</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* New Holiday Row (when adding) */}
              {isAdding && (
                <TableRow>
                  <TableCell>
                    <TextField
                      select
                      value={newHoliday.year}
                      onChange={(e) => setNewHoliday({ ...newHoliday, year: Number(e.target.value) })}
                      size="small"
                      fullWidth
                      sx={{ bgcolor: 'white' }}
                    >
                      <MenuItem value={currentYear}>{currentYear}</MenuItem>
                      <MenuItem value={currentYear + 1}>{currentYear + 1}</MenuItem>
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <DatePicker
                      value={newHoliday.date}
                      onChange={(newValue) => setNewHoliday({ ...newHoliday, date: newValue })}
                      format="DD-MMM-YYYY"
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          sx: { bgcolor: 'white' },
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={newHoliday.description}
                      onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
                      placeholder="Enter holiday description"
                      size="small"
                      fullWidth
                      sx={{ bgcolor: 'white' }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      value={newHoliday.location}
                      onChange={(e) =>
                        setNewHoliday({ ...newHoliday, location: e.target.value as 'IND' | 'US' })
                      }
                      size="small"
                      fullWidth
                      sx={{ bgcolor: 'white' }}
                    >
                      <MenuItem value="IND">India (IND)</MenuItem>
                      <MenuItem value="US">United States (US)</MenuItem>
                    </TextField>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Save />}
                        onClick={handleSave}
                        disabled={createMutation.isPending}
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
                        Save
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Cancel />}
                        onClick={handleCancel}
                        disabled={createMutation.isPending}
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
                        Cancel
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {/* Existing Holidays */}
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Loading holidays...
                  </TableCell>
                </TableRow>
              ) : holidays && holidays.length > 0 ? (
                holidays.map((holiday) => (
                  <TableRow key={holiday.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {holiday.year}
                      </Typography>
                    </TableCell>
                    <TableCell>{dayjs(holiday.date).format('DD-MMM-YYYY')}</TableCell>
                    <TableCell>{holiday.description}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {holiday.location === 'IND' ? 'India (IND)' : 'United States (US)'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDelete(holiday.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary">
                      No holidays found for the selected criteria
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </LocalizationProvider>
  );
}

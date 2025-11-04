import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Divider,
  Chip,
} from '@mui/material';
import { Person, Email, Work, Badge, CalendarToday, Business } from '@mui/icons-material';

export default function ProfilePage() {
  const { user } = useAuth();

  const profileItems = [
    { icon: <Email />, label: 'Email', value: user?.email },
    { icon: <Badge />, label: 'Employee ID', value: user?.employeeId },
    { icon: <Work />, label: 'Role', value: user?.role },
    { icon: <Business />, label: 'Department', value: user?.department?.name || 'N/A' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
            <Avatar sx={{ width: 100, height: 100, fontSize: '2.5rem' }}>
              {user?.firstName[0]}
              {user?.lastName[0]}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {user?.firstName} {user?.lastName}
              </Typography>
              <Chip label={user?.role} color="primary" size="small" sx={{ mt: 1 }} />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Personal Information
          </Typography>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            {profileItems.map((item, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      bgcolor: 'primary.light',
                      color: 'white',
                      p: 1,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {item.value}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>

          {user?.manager && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Reporting Manager
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body1" fontWeight="medium">
                  {user.manager.firstName} {user.manager.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.manager.email}
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

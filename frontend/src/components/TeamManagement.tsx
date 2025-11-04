import { Box, Typography, Grid, alpha, Avatar, Chip } from '@mui/material';
import { People, CheckCircle, HourglassEmpty, Cancel } from '@mui/icons-material';
import GlassCard from './GlassCard';
import { gradients } from '../theme/theme';

interface TeamMember {
  id: string;
  name: string;
  pendingLeaves?: number;
  approvedLeaves?: number;
  totalLeaves?: number;
}

interface TeamManagementProps {
  teamData?: any;
  loading?: boolean;
}

export default function TeamManagement({ teamData, loading }: TeamManagementProps) {
  // Use real team data only - no mock data
  const teamMembers = teamData?.data || [];

  const stats = [
    {
      title: 'Total Team Members',
      value: teamMembers.length,
      icon: <People />,
      gradient: gradients.orange,
    },
    {
      title: 'Pending Approvals',
      value: teamMembers.reduce((sum: number, m: any) => sum + (m.pendingLeaves || 0), 0),
      icon: <HourglassEmpty />,
      gradient: gradients.pink,
    },
    {
      title: 'Approved This Month',
      value: teamMembers.reduce((sum: number, m: any) => sum + (m.approvedLeaves || 0), 0),
      icon: <CheckCircle />,
      gradient: gradients.green,
    },
  ];

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <People fontSize="small" />
        Team Management
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} md={4} key={index}>
            <GlassCard
              sx={{
                p: 2.5,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
                '@keyframes fadeIn': {
                  '0%': { opacity: 0, transform: 'translateY(10px)' },
                  '100%': { opacity: 1, transform: 'translateY(0)' },
                },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: stat.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: `0 4px 12px ${alpha('#000', 0.15)}`,
                }}
              >
                {stat.icon}
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {stat.title}
                </Typography>
              </Box>
            </GlassCard>
          </Grid>
        ))}
      </Grid>

      <GlassCard sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Team Members
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {teamMembers.map((member: any, index: number) => (
            <Box
              key={member.id}
              sx={{
                p: 2,
                background: alpha('#f5f7fa', 0.5),
                borderRadius: 2,
                border: '1px solid',
                borderColor: alpha('#667eea', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.3s',
                animation: `slideIn 0.4s ease-out ${index * 0.05}s both`,
                '@keyframes slideIn': {
                  '0%': { opacity: 0, transform: 'translateX(-20px)' },
                  '100%': { opacity: 1, transform: 'translateX(0)' },
                },
                '&:hover': {
                  borderColor: alpha('#667eea', 0.3),
                  transform: 'translateX(4px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    background: gradients.primary,
                    fontWeight: 600,
                  }}
                >
                  {member.name?.charAt(0) || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {member.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {member.totalLeaves || 0} total leave{member.totalLeaves !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {member.pendingLeaves > 0 && (
                  <Chip
                    size="small"
                    label={`${member.pendingLeaves} pending`}
                    sx={{
                      background: alpha('#fa709a', 0.15),
                      color: '#fa709a',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    }}
                  />
                )}
                {member.approvedLeaves > 0 && (
                  <Chip
                    size="small"
                    label={`${member.approvedLeaves} approved`}
                    sx={{
                      background: alpha('#11998e', 0.15),
                      color: '#11998e',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    }}
                  />
                )}
              </Box>
            </Box>
          ))}
        </Box>

        {teamMembers.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <People sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.3 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No team members found
            </Typography>
          </Box>
        )}
      </GlassCard>
    </Box>
  );
}

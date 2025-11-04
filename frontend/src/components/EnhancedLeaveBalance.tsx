import { Box, Typography, LinearProgress, alpha, Chip } from '@mui/material';
import { gradients } from '../theme/theme';

interface LeaveBalance {
  id: string;
  leaveType: {
    id: string;
    name: string;
    code: string;
    color?: string;
  };
  allocated: number;
  used: number;
  available: number;
}

interface EnhancedLeaveBalanceProps {
  balances: LeaveBalance[];
  onRefresh?: () => void;
}

export default function EnhancedLeaveBalance({ balances, onRefresh }: EnhancedLeaveBalanceProps) {
  const getGradientForCode = (code: string): string => {
    const gradientMap: Record<string, string> = {
      CL: gradients.blue,
      SL: gradients.pink,
      PL: gradients.green,
      ML: gradients.purple,
      PAT: gradients.orange,
    };
    return gradientMap[code] || gradients.primary;
  };

  const getColorForCode = (code: string): string => {
    const colorMap: Record<string, string> = {
      CL: '#4facfe',
      SL: '#f093fb',
      PL: '#11998e',
      ML: '#667eea',
      PAT: '#fa709a',
    };
    return colorMap[code] || '#667eea';
  };

  const getPercentage = (used: number, allocated: number): number => {
    if (allocated === 0) return 0;
    return Math.min((used / allocated) * 100, 100);
  };

  return (
    <Box
      sx={{
        background: alpha('#fff', 0.9),
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 3,
        p: 3,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Enhanced Leave Balance
        </Typography>
        {onRefresh && (
          <Typography
            variant="body2"
            sx={{
              color: 'primary.main',
              cursor: 'pointer',
              fontWeight: 600,
              '&:hover': { textDecoration: 'underline' },
            }}
            onClick={onRefresh}
          >
            Refresh
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {balances.map((balance, index) => {
          const percentage = getPercentage(balance.used, balance.allocated);
          const gradient = getGradientForCode(balance.leaveType.code);
          const color = getColorForCode(balance.leaveType.code);

          return (
            <Box
              key={balance.id}
              sx={{
                animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
                '@keyframes fadeIn': {
                  '0%': { opacity: 0, transform: 'translateX(-20px)' },
                  '100%': { opacity: 1, transform: 'translateX(0)' },
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      boxShadow: `0 4px 12px ${alpha('#000', 0.15)}`,
                    }}
                  >
                    {balance.leaveType.code}
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {balance.leaveType.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {balance.available} of {balance.allocated} days
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={`${percentage.toFixed(0)}% used`}
                  size="small"
                  sx={{
                    background: alpha(color, 0.1),
                    color: 'text.primary',
                    fontWeight: 600,
                  }}
                />
              </Box>

              <Box sx={{ position: 'relative' }}>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: alpha('#000', 0.05),
                    '& .MuiLinearProgress-bar': {
                      background: gradient,
                      borderRadius: 4,
                      transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
                    },
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>

      {balances.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No leave balances found
          </Typography>
        </Box>
      )}
    </Box>
  );
}

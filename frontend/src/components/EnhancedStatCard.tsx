import { Box, Typography, alpha } from '@mui/material';
import { ReactNode } from 'react';
import AnimatedCounter from './AnimatedCounter';
import { gradients } from '../theme/theme';

interface EnhancedStatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: ReactNode;
  gradientType?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'blue' | 'pink' | 'green' | 'purple' | 'orange' | 'red' | 'teal';
  iconColor?: string;
  delay?: number;
  compact?: boolean;
}

export default function EnhancedStatCard({
  title,
  value,
  subtitle,
  icon,
  gradientType = 'primary',
  iconColor = '#fff',
  delay = 0,
  compact = false
}: EnhancedStatCardProps) {
  return (
    <Box
      sx={{
        background: alpha('#fff', 0.9),
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: compact ? 2 : 3,
        p: compact ? 2 : 3,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: `slideUp 0.6s ease-out ${delay}s both`,
        '@keyframes slideUp': {
          '0%': {
            opacity: 0,
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
        '&:hover': {
          transform: compact ? 'translateY(-4px)' : 'translateY(-8px)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
          border: `1px solid ${alpha('#667eea', 0.3)}`,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: compact ? 1 : 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              mb: compact ? 0.5 : 1,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: compact ? '0.65rem' : '0.75rem',
            }}
          >
            {title}
          </Typography>
          <AnimatedCounter
            end={value}
            sx={{
              fontSize: compact ? '1.5rem' : '2rem',
              color: 'text.primary',
              fontWeight: 700
            }}
          />
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: 'block',
                mt: 0.5,
                fontSize: compact ? '0.65rem' : '0.75rem',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: compact ? 40 : 56,
            height: compact ? 40 : 56,
            borderRadius: '50%',
            background: gradients[gradientType],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 8px 24px ${alpha(iconColor, 0.3)}`,
            color: '#fff',
            fontSize: compact ? '1.25rem' : '1.75rem',
            flexShrink: 0,
            ml: 1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'rotate(10deg) scale(1.1)',
            },
          }}
        >
          {icon}
        </Box>
      </Box>
    </Box>
  );
}

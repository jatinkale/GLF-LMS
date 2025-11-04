import { Box, alpha } from '@mui/material';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  gradient?: boolean;
  blur?: number;
  opacity?: number;
  sx?: any;
}

export default function GlassCard({
  children,
  gradient = false,
  blur = 10,
  opacity = 0.7,
  sx = {}
}: GlassCardProps) {
  return (
    <Box
      sx={{
        background: gradient
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)'
          : alpha('#fff', opacity),
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 2,
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.15)',
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

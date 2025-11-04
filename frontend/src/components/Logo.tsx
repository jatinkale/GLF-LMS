import { Box, Typography } from '@mui/material';

interface LogoProps {
  variant?: 'full' | 'compact' | 'icon';
  size?: 'small' | 'medium' | 'large';
  color?: 'default' | 'white' | 'primary';
}

export default function Logo({ variant = 'full', size = 'medium', color = 'default' }: LogoProps) {
  const sizes = {
    small: { icon: 24, text: '1rem', subtitle: '0.65rem' },
    medium: { icon: 32, text: '1.25rem', subtitle: '0.75rem' },
    large: { icon: 40, text: '1.5rem', subtitle: '0.875rem' },
  };

  const colors = {
    default: { main: '#2D5A3D', text: '#2D5A3D', arrow: '#FF4444' },
    white: { main: '#FFFFFF', text: '#FFFFFF', arrow: '#FF4444' },
    primary: { main: '#1976d2', text: '#1976d2', arrow: '#FF4444' },
  };

  const currentSize = sizes[size];
  const currentColor = colors[color];

  const ChevronIcon = () => (
    <svg
      width={currentSize.icon}
      height={currentSize.icon}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M9 18l6-6-6-6" stroke={currentColor.arrow} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 18l6-6-6-6" stroke={currentColor.arrow} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <path d="M13 18l6-6-6-6" stroke={currentColor.arrow} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronIcon />
      </Box>
    );
  }

  if (variant === 'compact') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography
          sx={{
            fontSize: currentSize.text,
            fontWeight: 800,
            color: currentColor.text,
            letterSpacing: '0.5px',
            textShadow: color !== 'white' ? '2px 2px 4px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          GO
        </Typography>
        <ChevronIcon />
        <Typography
          sx={{
            fontSize: currentSize.text,
            fontWeight: 800,
            color: currentColor.text,
            letterSpacing: '0.5px',
            textShadow: color !== 'white' ? '2px 2px 4px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          LIVE
        </Typography>
        <ChevronIcon />
        <Typography
          sx={{
            fontSize: currentSize.text,
            fontWeight: 800,
            color: currentColor.text,
            letterSpacing: '0.5px',
            textShadow: color !== 'white' ? '2px 2px 4px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          FASTER
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <ChevronIcon />
        <Box>
          <Typography
            sx={{
              fontSize: currentSize.text,
              fontWeight: 800,
              color: currentColor.text,
              letterSpacing: '1px',
              lineHeight: 1,
              textShadow: color !== 'white' ? '2px 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            GO LIVE FASTER
          </Typography>
          <Typography
            sx={{
              fontSize: currentSize.subtitle,
              fontWeight: 600,
              color: currentColor.text,
              letterSpacing: '0.5px',
              lineHeight: 1,
              mt: 0.5,
              opacity: 0.8,
            }}
          >
            Leave Management System
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

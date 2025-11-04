import { Button, ButtonProps } from '@mui/material';
import { gradients } from '../theme/theme';

interface GradientButtonProps extends Omit<ButtonProps, 'variant'> {
  gradientType?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';
}

export default function GradientButton({
  gradientType = 'primary',
  children,
  sx = {},
  ...props
}: GradientButtonProps) {
  return (
    <Button
      variant="contained"
      sx={{
        background: gradients[gradientType],
        color: '#ffffff',
        fontWeight: 600,
        borderRadius: 2.5,
        padding: '10px 24px',
        textTransform: 'none',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
          transition: 'left 0.5s',
        },
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          '&::before': {
            left: '100%',
          },
        },
        '&:active': {
          transform: 'translateY(0)',
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

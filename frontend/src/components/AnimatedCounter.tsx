import { Typography } from '@mui/material';
import { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  sx?: any;
}

export default function AnimatedCounter({
  end,
  duration = 1000,
  suffix = '',
  prefix = '',
  sx = {}
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuad = (t: number) => t * (2 - t);
      // Support decimal values for leave balances (e.g., 1.5, 2.5 days)
      // Round to 1 decimal place to handle fractional days
      const currentCount = Math.round(easeOutQuad(progress) * end * 10) / 10;

      setCount(currentCount);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [end, duration]);

  return (
    <Typography
      sx={{
        fontWeight: 700,
        fontSize: '2rem',
        ...sx,
      }}
    >
      {prefix}{count}{suffix}
    </Typography>
  );
}

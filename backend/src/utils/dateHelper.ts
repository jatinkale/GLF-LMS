/**
 * Calculate total days between two dates
 */
export function calculateDays(startDate: Date, endDate: Date, isHalfDay: boolean = false): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Set time to midnight for accurate day calculation
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end date

  if (isHalfDay && diffDays === 1) {
    return 0.5;
  }

  return diffDays;
}

/**
 * Calculate business days (excluding weekends)
 */
export function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Check if date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Calculate business days (excluding weekends and holidays)
 */
export function calculateBusinessDaysExcludingHolidays(
  startDate: Date,
  endDate: Date,
  holidays: Date[] = []
): number {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);

  // Normalize holiday dates to midnight for comparison
  const normalizedHolidays = holidays.map(h => {
    const d = new Date(h);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  while (current <= end) {
    const dayOfWeek = current.getDay();
    const currentTime = new Date(current).setHours(0, 0, 0, 0);

    // Count if not weekend and not a holiday
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !normalizedHolidays.includes(currentTime)) {
      count++;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format date to readable format (e.g., "Jan 15, 2024")
 */
export function formatReadableDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get current fiscal year (April to March for India)
 */
export function getFiscalYear(region: 'INDIA' | 'USA' = 'INDIA'): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  if (region === 'INDIA') {
    // Fiscal year starts in April (month 3)
    return currentMonth >= 3 ? currentYear : currentYear - 1;
  } else {
    // USA: Fiscal year is same as calendar year
    return currentYear;
  }
}

/**
 * Get fiscal year start date
 */
export function getFiscalYearStart(year: number, region: 'INDIA' | 'USA' = 'INDIA'): Date {
  if (region === 'INDIA') {
    return new Date(year, 3, 1); // April 1st
  } else {
    return new Date(year, 0, 1); // January 1st
  }
}

/**
 * Get fiscal year end date
 */
export function getFiscalYearEnd(year: number, region: 'INDIA' | 'USA' = 'INDIA'): Date {
  if (region === 'INDIA') {
    return new Date(year + 1, 2, 31); // March 31st next year
  } else {
    return new Date(year, 11, 31); // December 31st
  }
}

/**
 * Calculate pro-rata leave allocation based on joining date
 */
export function calculateProRataAllocation(
  annualAllocation: number,
  joiningDate: Date,
  region: 'INDIA' | 'USA' = 'INDIA'
): number {
  const fiscalYear = getFiscalYear(region);
  const fiscalYearStart = getFiscalYearStart(fiscalYear, region);
  const fiscalYearEnd = getFiscalYearEnd(fiscalYear, region);

  // If joined before fiscal year start, give full allocation
  if (joiningDate <= fiscalYearStart) {
    return annualAllocation;
  }

  // If joined after fiscal year end, give 0
  if (joiningDate > fiscalYearEnd) {
    return 0;
  }

  // Calculate remaining months
  const totalDays = (fiscalYearEnd.getTime() - fiscalYearStart.getTime()) / (1000 * 60 * 60 * 24);
  const remainingDays = (fiscalYearEnd.getTime() - joiningDate.getTime()) / (1000 * 60 * 60 * 24);

  const proRataAllocation = (annualAllocation * remainingDays) / totalDays;

  return Math.round(proRataAllocation * 100) / 100; // Round to 2 decimal places
}

/**
 * Add months to date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Add days to date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Check if two date ranges overlap
 */
export function doDateRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 <= end2 && start2 <= end1;
}

/**
 * Get month name
 */
export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month];
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date): boolean {
  return date < new Date();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date): boolean {
  return date > new Date();
}

import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Region } from '@prisma/client';
import logger from '../utils/logger';

interface CreateHolidayData {
  year: number;
  date: Date;
  description: string;
  location: Region;
}

export class HolidayService {
  // Get all holidays with optional filters
  async getHolidays(filters?: {
    year?: number;
    location?: Region;
  }) {
    const where: any = {};

    if (filters?.year) {
      where.year = filters.year;
    }

    if (filters?.location) {
      where.location = filters.location;
    }

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: {
        date: 'asc',
      },
    });

    return holidays;
  }

  // Get holiday by ID
  async getHolidayById(id: string) {
    const holiday = await prisma.holiday.findUnique({
      where: { id },
    });

    if (!holiday) {
      throw new AppError('Holiday not found', 404);
    }

    return holiday;
  }

  // Create a new holiday
  async createHoliday(data: CreateHolidayData) {
    const { year, date, description, location } = data;

    // Validate date is in the specified year
    const dateYear = new Date(date).getFullYear();
    if (dateYear !== year) {
      throw new AppError('Date must be in the specified year', 400);
    }

    // Check for duplicate holiday (same date and location)
    const existing = await prisma.holiday.findFirst({
      where: {
        date: new Date(date),
        location,
      },
    });

    if (existing) {
      throw new AppError('Holiday already exists for this date and location', 400);
    }

    const holiday = await prisma.holiday.create({
      data: {
        year,
        date: new Date(date),
        description,
        location,
      },
    });

    logger.info('Holiday created', {
      holidayId: holiday.id,
      date: holiday.date,
      location: holiday.location,
    });

    return holiday;
  }

  // Delete a holiday
  async deleteHoliday(id: string) {
    const holiday = await prisma.holiday.findUnique({
      where: { id },
    });

    if (!holiday) {
      throw new AppError('Holiday not found', 404);
    }

    await prisma.holiday.delete({
      where: { id },
    });

    logger.info('Holiday deleted', {
      holidayId: id,
      date: holiday.date,
      location: holiday.location,
    });

    return { message: 'Holiday deleted successfully' };
  }

  // Get holidays by date range and location (for leave calculation)
  async getHolidaysByDateRange(startDate: Date, endDate: Date, location: Region) {
    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        location,
      },
      select: {
        date: true,
      },
    });

    return holidays.map(h => h.date);
  }
}

export default new HolidayService();

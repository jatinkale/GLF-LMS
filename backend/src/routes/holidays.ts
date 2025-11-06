import express from 'express';
import holidayService from '../services/holidayService';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { Region } from '@prisma/client';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all holidays (with optional filters)
router.get('/', async (req, res, next) => {
  try {
    const { year, location } = req.query;

    const filters: any = {};
    if (year) filters.year = parseInt(year as string);
    if (location) filters.location = location as Region;

    const holidays = await holidayService.getHolidays(filters);

    res.json({
      success: true,
      data: holidays,
    });
  } catch (error) {
    next(error);
  }
});

// Get holiday by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const holiday = await holidayService.getHolidayById(id);

    res.json({
      success: true,
      data: holiday,
    });
  } catch (error) {
    next(error);
  }
});

// Create a new holiday (Admin only)
router.post('/', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { year, date, description, location } = req.body;

    if (!year || !date || !description || !location) {
      throw new AppError('All fields are required', 400);
    }

    const holiday = await holidayService.createHoliday({
      year: parseInt(year),
      date: new Date(date),
      description,
      location,
    });

    res.status(201).json({
      success: true,
      message: 'Holiday created successfully',
      data: holiday,
    });
  } catch (error) {
    next(error);
  }
});

// Delete a holiday (Admin only)
router.delete('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await holidayService.deleteHoliday(id);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
});

// Get holidays by date range (for leave calculation)
router.get('/range/:startDate/:endDate', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.params;
    const { location } = req.query;

    if (!location) {
      throw new AppError('Location is required', 400);
    }

    const holidays = await holidayService.getHolidaysByDateRange(
      new Date(startDate),
      new Date(endDate),
      location as Region
    );

    res.json({
      success: true,
      data: holidays,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

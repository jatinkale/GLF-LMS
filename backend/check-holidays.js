const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHolidays() {
  try {
    const holidays = await prisma.holiday.findMany({
      where: {
        year: 2025,
        location: 'IND',
      },
      orderBy: {
        date: 'asc',
      },
    });

    console.log(`Found ${holidays.length} holidays for IND in 2025:`);
    holidays.forEach((h) => {
      console.log(`- ${h.date.toISOString().split('T')[0]}: ${h.description} (${h.location})`);
    });

    // Check holidays in the range 18-21 Nov
    const novHolidays = holidays.filter(h => {
      const date = new Date(h.date);
      return date >= new Date('2025-11-18') && date <= new Date('2025-11-21');
    });

    console.log(`\nHolidays between 18-21 Nov 2025:`);
    if (novHolidays.length === 0) {
      console.log('No holidays found in this range');
    } else {
      novHolidays.forEach((h) => {
        console.log(`- ${h.date.toISOString().split('T')[0]}: ${h.description}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkHolidays();

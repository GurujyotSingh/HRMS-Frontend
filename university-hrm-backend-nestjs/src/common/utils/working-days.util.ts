import { PrismaService } from '../../prisma/prisma.service';

/**
 * Check if a given date is a weekend (Saturday=6, Sunday=0)
 */
export function isWeekend(date: Date, workingDays: number[] = [1, 2, 3, 4, 5]): boolean {
  return !workingDays.includes(date.getDay());
}

/**
 * Calculate working days between two dates, excluding weekends and holidays
 */
export async function calculateWorkingDays(
  prisma: PrismaService,
  fromDate: Date,
  toDate: Date,
  workingDays: number[] = [1, 2, 3, 4, 5],
): Promise<number> {
  // Fetch holidays in range
  const holidays = await prisma.holiday.findMany({
    where: {
      date: {
        gte: fromDate,
        lte: toDate,
      },
    },
    select: { date: true },
  });

  const holidayDates = new Set(
    holidays.map((h) => h.date.toISOString().split('T')[0]),
  );

  let count = 0;
  const current = new Date(fromDate);
  while (current <= toDate) {
    const dayOfWeek = current.getDay();
    const dateStr = current.toISOString().split('T')[0];

    if (workingDays.includes(dayOfWeek) && !holidayDates.has(dateStr)) {
      count++;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Get all dates between two dates (inclusive)
 */
export function getDateRange(from: Date, to: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(from);
  while (current <= to) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

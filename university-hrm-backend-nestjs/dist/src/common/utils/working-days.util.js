"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWeekend = isWeekend;
exports.calculateWorkingDays = calculateWorkingDays;
exports.getDateRange = getDateRange;
function isWeekend(date, workingDays = [1, 2, 3, 4, 5]) {
    return !workingDays.includes(date.getDay());
}
async function calculateWorkingDays(prisma, fromDate, toDate, workingDays = [1, 2, 3, 4, 5]) {
    const holidays = await prisma.holiday.findMany({
        where: {
            date: {
                gte: fromDate,
                lte: toDate,
            },
        },
        select: { date: true },
    });
    const holidayDates = new Set(holidays.map((h) => h.date.toISOString().split('T')[0]));
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
function getDateRange(from, to) {
    const dates = [];
    const current = new Date(from);
    while (current <= to) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}
//# sourceMappingURL=working-days.util.js.map
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SystemRole, AttendanceStatus, Prisma } from '@prisma/client';
import { paginate } from '../../common/utils/pagination.util';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: Record<string, unknown>, currentUser: { sub: string; role: SystemRole; departmentId: string | null }) {
    const where: Prisma.AttendanceWhereInput = {};

    if (currentUser.role === 'FACULTY' || currentUser.role === 'STAFF') {
      where.employeeId = currentUser.sub;
    } else if (currentUser.role === 'DIRECTOR') {
      where.employee = { departmentId: currentUser.departmentId };
    }

    if (query.employeeId) where.employeeId = query.employeeId as string;
    if (query.departmentId) where.employee = { departmentId: query.departmentId as string };
    if (query.status) where.status = query.status as AttendanceStatus;
    if (query.month && query.year) {
      const m = Number(query.month) - 1;
      const y = Number(query.year);
      where.date = { gte: new Date(y, m, 1), lt: new Date(y, m + 1, 1) };
    } else {
      if (query.fromDate) where.date = { ...where.date as object, gte: new Date(query.fromDate as string) };
      if (query.toDate) where.date = { ...where.date as object, lte: new Date(query.toDate as string) };
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true, department: { select: { name: true } } } } },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async getCalendar(employeeId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [records, holidays] = await Promise.all([
      this.prisma.attendance.findMany({
        where: { employeeId, date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
      }),
      this.prisma.holiday.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
      }),
    ]);

    return { records, holidays };
  }

  async getSummary(employeeId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await this.prisma.attendance.findMany({
      where: { employeeId, date: { gte: startDate, lte: endDate } },
    });

    const summary = {
      presentCount: 0, absentCount: 0, halfDayCount: 0,
      lateCount: 0, holidayCount: 0, onLeaveCount: 0,
      weekendCount: 0, totalWorkingDays: 0, attendanceRate: 0,
    };

    for (const r of records) {
      switch (r.status) {
        case 'PRESENT': summary.presentCount++; break;
        case 'ABSENT': summary.absentCount++; break;
        case 'HALF_DAY': summary.halfDayCount++; break;
        case 'HOLIDAY': summary.holidayCount++; break;
        case 'ON_LEAVE': summary.onLeaveCount++; break;
        case 'WEEKEND': summary.weekendCount++; break;
      }
      if (r.isLate) summary.lateCount++;
    }

    summary.totalWorkingDays = summary.presentCount + summary.absentCount + summary.halfDayCount + summary.onLeaveCount;
    summary.attendanceRate = summary.totalWorkingDays > 0
      ? Math.round(((summary.presentCount + summary.halfDayCount * 0.5) / summary.totalWorkingDays) * 100)
      : 0;

    return summary;
  }

  async bulkUpsert(date: string, records: Array<{ employeeId: string; checkIn?: string; checkOut?: string; status: AttendanceStatus; isLate?: boolean; notes?: string }>) {
    const dateObj = new Date(date);
    const results = [];

    for (const rec of records) {
      const checkIn = rec.checkIn ? new Date(rec.checkIn) : null;
      const checkOut = rec.checkOut ? new Date(rec.checkOut) : null;
      let totalHours: number | null = null;
      if (checkIn && checkOut) {
        totalHours = Math.round(((checkOut.getTime() - checkIn.getTime()) / 3600000) * 100) / 100;
      }

      const result = await this.prisma.attendance.upsert({
        where: { employeeId_date: { employeeId: rec.employeeId, date: dateObj } },
        create: { employeeId: rec.employeeId, date: dateObj, checkIn, checkOut, totalHours, status: rec.status, isLate: rec.isLate || false, notes: rec.notes },
        update: { checkIn, checkOut, totalHours, status: rec.status, isLate: rec.isLate || false, notes: rec.notes },
      });
      results.push(result);
    }

    return results;
  }

  async correct(id: string, data: { checkIn?: string; checkOut?: string; status?: AttendanceStatus; notes?: string }, correctedBy: string) {
    const record = await this.prisma.attendance.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Attendance record not found');

    const checkIn = data.checkIn ? new Date(data.checkIn) : record.checkIn;
    const checkOut = data.checkOut ? new Date(data.checkOut) : record.checkOut;
    let totalHours = record.totalHours;
    if (checkIn && checkOut) {
      totalHours = Math.round(((checkOut.getTime() - checkIn.getTime()) / 3600000) * 100) / 100;
    }

    return this.prisma.attendance.update({
      where: { id },
      data: { checkIn, checkOut, totalHours, status: data.status || record.status, notes: data.notes, correctedBy, correctedAt: new Date() },
    });
  }
}

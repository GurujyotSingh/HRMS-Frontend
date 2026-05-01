import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async attendanceReport(query: Record<string, unknown>) {
    const where: Record<string, unknown> = {};
    if (query.departmentId) where.employee = { departmentId: query.departmentId };
    if (query.fromDate) where.date = { gte: new Date(query.fromDate as string) };
    if (query.toDate) where.date = { ...where.date as object, lte: new Date(query.toDate as string) };

    const data = await this.prisma.attendance.findMany({
      where: where as never,
      include: { employee: { select: { firstName: true, lastName: true, employeeId: true, department: { select: { name: true } } } } },
      orderBy: { date: 'desc' },
    });
    return { data, generatedAt: new Date() };
  }

  async leaveReport(query: Record<string, unknown>) {
    const where: Record<string, unknown> = {};
    if (query.departmentId) where.employee = { departmentId: query.departmentId };
    if (query.year) {
      const y = Number(query.year);
      where.fromDate = { gte: new Date(y, 0, 1) };
      where.toDate = { lte: new Date(y, 11, 31) };
    }

    const data = await this.prisma.leaveRequest.findMany({
      where: where as never,
      include: { employee: { select: { firstName: true, lastName: true, employeeId: true, department: { select: { name: true } } } } },
      orderBy: { appliedAt: 'desc' },
    });
    return { data, generatedAt: new Date() };
  }

  async headcountReport(query: Record<string, unknown>) {
    const departments = await this.prisma.department.findMany({
      include: { _count: { select: { employees: true } } },
    });

    const byType = await this.prisma.user.groupBy({
      by: ['employmentType'],
      where: { status: 'ACTIVE' },
      _count: true,
    });

    const byRole = await this.prisma.user.groupBy({
      by: ['role'],
      where: { status: 'ACTIVE' },
      _count: true,
    });

    return {
      departments: departments.map(d => ({ name: d.name, code: d.code, headCount: d._count.employees })),
      byEmploymentType: byType.map(t => ({ type: t.employmentType, count: t._count })),
      byRole: byRole.map(r => ({ role: r.role, count: r._count })),
      totalActive: await this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      generatedAt: new Date(),
    };
  }

  async payrollReport(query: Record<string, unknown>) {
    const where: Record<string, unknown> = {};
    if (query.month) where.month = Number(query.month);
    if (query.year) where.year = Number(query.year);
    if (query.departmentId) where.employee = { departmentId: query.departmentId };

    const data = await this.prisma.payslip.findMany({
      where: where as never,
      include: { employee: { select: { firstName: true, lastName: true, employeeId: true, department: { select: { name: true } } } } },
    });

    const totalNet = data.reduce((sum, p) => sum + p.netSalary, 0);
    const totalBasic = data.reduce((sum, p) => sum + p.basicSalary, 0);
    return { data, summary: { totalNet, totalBasic, count: data.length }, generatedAt: new Date() };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SystemRole } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getAdminDashboard() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalEmployees, activeEmployees, onLeaveToday,
      pendingLeaves, recentHires, departmentCount,
      totalPayrollThisMonth, todayPresent, todayAbsent,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.leaveRequest.count({
        where: { status: 'APPROVED', fromDate: { lte: now }, toDate: { gte: now } },
      }),
      this.prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.user.findMany({
        where: { joinDate: { gte: new Date(now.getFullYear(), now.getMonth() - 1, 1) } },
        select: { id: true, firstName: true, lastName: true, joinDate: true, department: { select: { name: true } }, profilePhoto: true },
        orderBy: { joinDate: 'desc' }, take: 5,
      }),
      this.prisma.department.count(),
      this.prisma.payslip.aggregate({
        where: { month: now.getMonth() + 1, year: now.getFullYear(), status: 'PUBLISHED' },
        _sum: { netSalary: true },
      }),
      this.prisma.attendance.count({
        where: { date: { gte: new Date(now.toISOString().split('T')[0]) }, status: 'PRESENT' },
      }),
      this.prisma.attendance.count({
        where: { date: { gte: new Date(now.toISOString().split('T')[0]) }, status: 'ABSENT' },
      }),
    ]);

    // Department headcount
    const departments = await this.prisma.department.findMany({
      include: { _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });

    // Leave trend (last 6 months)
    const leaveTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const count = await this.prisma.leaveRequest.count({
        where: { status: 'APPROVED', appliedAt: { gte: d, lte: end } },
      });
      leaveTrend.push({ month: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear(), count });
    }

    return {
      stats: {
        totalEmployees, activeEmployees, onLeaveToday, pendingLeaves,
        departmentCount, totalPayrollThisMonth: totalPayrollThisMonth._sum.netSalary || 0,
        todayPresent, todayAbsent,
      },
      recentHires,
      departments: departments.map(d => ({ id: d.id, name: d.name, code: d.code, headCount: d._count.employees })),
      leaveTrend,
    };
  }

  async getDirectorDashboard(departmentId: string) {
    const now = new Date();
    const [teamSize, onLeave, pending, todayPresent] = await Promise.all([
      this.prisma.user.count({ where: { departmentId, status: 'ACTIVE' } }),
      this.prisma.leaveRequest.count({
        where: { employee: { departmentId }, status: 'APPROVED', fromDate: { lte: now }, toDate: { gte: now } },
      }),
      this.prisma.leaveRequest.count({ where: { employee: { departmentId }, status: 'PENDING' } }),
      this.prisma.attendance.count({
        where: { employee: { departmentId }, date: { gte: new Date(now.toISOString().split('T')[0]) }, status: 'PRESENT' },
      }),
    ]);

    const team = await this.prisma.user.findMany({
      where: { departmentId, status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, designation: true, profilePhoto: true, role: true },
      orderBy: { firstName: 'asc' },
    });

    return { stats: { teamSize, onLeave, pending, todayPresent }, team };
  }

  async getEmployeeDashboard(userId: string) {
    const now = new Date();
    const year = now.getFullYear();

    const [leaveBalance, pendingLeaves, recentAttendance, unreadNotifications, onboarding] = await Promise.all([
      this.prisma.leaveBalance.findUnique({ where: { employeeId_year: { employeeId: userId, year } } }),
      this.prisma.leaveRequest.count({ where: { employeeId: userId, status: 'PENDING' } }),
      this.prisma.attendance.findMany({
        where: { employeeId: userId },
        orderBy: { date: 'desc' }, take: 7,
      }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
      this.prisma.onboardingEmployee.findUnique({
        where: { employeeId: userId },
        include: { tasks: { where: { status: { not: 'COMPLETED' } }, orderBy: { order: 'asc' }, take: 3 } },
      }),
    ]);

    return { leaveBalance, pendingLeaves, recentAttendance, unreadNotifications, onboarding };
  }
}

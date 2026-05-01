import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SystemRole, LeaveStatus, LeaveType, Prisma } from '@prisma/client';
import { calculateWorkingDays } from '../../common/utils/working-days.util';
import { paginate, paginationArgs } from '../../common/utils/pagination.util';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: Record<string, unknown>, currentUser: { sub: string; role: SystemRole; departmentId: string | null }) {
    const where: Prisma.LeaveRequestWhereInput = {};

    // Role-based scoping
    if (currentUser.role === 'FACULTY' || currentUser.role === 'STAFF') {
      where.employeeId = currentUser.sub;
    } else if (currentUser.role === 'DIRECTOR') {
      where.employee = { departmentId: currentUser.departmentId };
    }

    if (query.employeeId) where.employeeId = query.employeeId as string;
    if (query.status) where.status = query.status as LeaveStatus;
    if (query.leaveType) where.leaveType = query.leaveType as LeaveType;
    if (query.departmentId) where.employee = { ...where.employee as object, departmentId: query.departmentId as string };
    if (query.fromDate) where.fromDate = { gte: new Date(query.fromDate as string) };
    if (query.toDate) where.toDate = { lte: new Date(query.toDate as string) };

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const [data, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, employeeId: true, department: { select: { name: true } }, profilePhoto: true } },
          reviewedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ status: 'asc' }, { appliedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async apply(userId: string, dto: { leaveType: LeaveType; fromDate: string; toDate: string; reason: string; attachmentUrl?: string }) {
    const from = new Date(dto.fromDate);
    const to = new Date(dto.toDate);

    if (from > to) throw new BadRequestException('From date must be before to date');

    // Calculate working days
    const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'singleton' } });
    const totalDays = await calculateWorkingDays(this.prisma, from, to, settings?.workingDays);

    if (totalDays === 0) throw new BadRequestException('No working days in the selected range');

    // Check balance
    const year = from.getFullYear();
    const balance = await this.prisma.leaveBalance.findUnique({
      where: { employeeId_year: { employeeId: userId, year } },
    });

    if (!balance) throw new BadRequestException('Leave balance not found for this year');

    const typeKey = dto.leaveType.toLowerCase();
    if (dto.leaveType !== 'UNPAID') {
      const totalField = `${typeKey}Total` as keyof typeof balance;
      const usedField = `${typeKey}Used` as keyof typeof balance;
      const remaining = (balance[totalField] as number) - (balance[usedField] as number);
      if (totalDays > remaining) {
        throw new BadRequestException(`Insufficient ${dto.leaveType} leave balance. Remaining: ${remaining} days`);
      }
    }

    // Check overlapping approved leave
    const overlap = await this.prisma.leaveRequest.findFirst({
      where: {
        employeeId: userId,
        status: 'APPROVED',
        OR: [
          { fromDate: { lte: to }, toDate: { gte: from } },
        ],
      },
    });
    if (overlap) throw new BadRequestException('You have an overlapping approved leave for this period');

    return this.prisma.leaveRequest.create({
      data: {
        employeeId: userId,
        leaveType: dto.leaveType,
        fromDate: from,
        toDate: to,
        totalDays,
        reason: dto.reason,
        attachmentUrl: dto.attachmentUrl,
      },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeId: true } },
      },
    });
  }

  async approve(id: string, reviewerId: string, remarks?: string) {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!leave) throw new NotFoundException('Leave request not found');
    if (leave.status !== 'PENDING') throw new BadRequestException('Only pending requests can be approved');

    // Deduct leave balance
    const year = leave.fromDate.getFullYear();
    const typeKey = leave.leaveType.toLowerCase();

    if (leave.leaveType !== 'UNPAID') {
      const usedField = `${typeKey}Used`;
      await this.prisma.leaveBalance.update({
        where: { employeeId_year: { employeeId: leave.employeeId, year } },
        data: { [usedField]: { increment: leave.totalDays } },
      });
    } else {
      await this.prisma.leaveBalance.update({
        where: { employeeId_year: { employeeId: leave.employeeId, year } },
        data: { unpaidUsed: { increment: leave.totalDays } },
      });
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        remarks,
      },
    });
  }

  async reject(id: string, reviewerId: string, remarks: string) {
    const leave = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) throw new NotFoundException('Leave request not found');
    if (leave.status !== 'PENDING') throw new BadRequestException('Only pending requests can be rejected');
    if (!remarks) throw new BadRequestException('Remarks are required for rejection');

    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'REJECTED', reviewedById: reviewerId, reviewedAt: new Date(), remarks },
    });
  }

  async cancel(id: string, userId: string, role: SystemRole) {
    const leave = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) throw new NotFoundException('Leave request not found');

    // Permission check
    if (role === 'FACULTY' || role === 'STAFF') {
      if (leave.employeeId !== userId) throw new ForbiddenException('You can only cancel your own leave');
      if (leave.status !== 'PENDING') throw new BadRequestException('You can only cancel pending requests');
    }

    // If cancelling an approved leave, restore balance
    if (leave.status === 'APPROVED') {
      const year = leave.fromDate.getFullYear();
      const typeKey = leave.leaveType.toLowerCase();

      if (leave.leaveType !== 'UNPAID') {
        const usedField = `${typeKey}Used`;
        await this.prisma.leaveBalance.update({
          where: { employeeId_year: { employeeId: leave.employeeId, year } },
          data: { [usedField]: { decrement: leave.totalDays } },
        });
      } else {
        await this.prisma.leaveBalance.update({
          where: { employeeId_year: { employeeId: leave.employeeId, year } },
          data: { unpaidUsed: { decrement: leave.totalDays } },
        });
      }

      // Remove ON_LEAVE attendance records
      await this.prisma.attendance.deleteMany({
        where: {
          employeeId: leave.employeeId,
          date: { gte: leave.fromDate, lte: leave.toDate },
          status: 'ON_LEAVE',
        },
      });
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async getBalance(employeeId: string, year?: number) {
    const y = year || new Date().getFullYear();
    const balance = await this.prisma.leaveBalance.findUnique({
      where: { employeeId_year: { employeeId, year: y } },
    });
    if (!balance) throw new NotFoundException('Leave balance not found');
    return balance;
  }
}

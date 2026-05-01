import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GoalStatus, CycleStatus } from '@prisma/client';

@Injectable()
export class PerformanceService {
  constructor(private prisma: PrismaService) {}

  // ── Appraisal Cycles ────────────────────────────────────────────────

  async createCycle(data: Record<string, unknown>) {
    return this.prisma.appraisalCycle.create({
      data: {
        title: data.title as string,
        year: Number(data.year),
        startDate: new Date(data.startDate as string),
        endDate: new Date(data.endDate as string),
        status: CycleStatus.ACTIVE,
      },
    });
  }

  async getAllCycles() {
    return this.prisma.appraisalCycle.findMany({
      orderBy: { year: 'desc' },
      include: { _count: { select: { goals: true } } },
    });
  }

  async getActiveCycle() {
    return this.prisma.appraisalCycle.findFirst({
      where: { status: CycleStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
    });
  }

  async closeCycle(id: string) {
    const cycle = await this.prisma.appraisalCycle.findUnique({ where: { id } });
    if (!cycle) throw new NotFoundException('Appraisal cycle not found');
    return this.prisma.appraisalCycle.update({
      where: { id },
      data: { status: CycleStatus.CLOSED },
    });
  }

  // ── Employee: set / submit goals ────────────────────────────────────

  async createGoal(employeeId: string, data: Record<string, unknown>) {
    const cycle = await this.prisma.appraisalCycle.findUnique({
      where: { id: data.cycleId as string },
    });
    if (!cycle) throw new NotFoundException('Appraisal cycle not found');
    if (cycle.status !== CycleStatus.ACTIVE) {
      throw new BadRequestException('Cannot set goals for a closed appraisal cycle');
    }

    const existing = await this.prisma.performanceGoal.findUnique({
      where: { employeeId_cycleId: { employeeId, cycleId: data.cycleId as string } },
    });
    if (existing) throw new BadRequestException('Goals already submitted for this cycle');

    return this.prisma.performanceGoal.create({
      data: {
        employeeId,
        cycleId: data.cycleId as string,
        goalsText: data.goalsText as string,
        status: GoalStatus.DRAFT,
      },
      include: { cycle: true, employee: { select: { firstName: true, lastName: true, employeeId: true } } },
    });
  }

  async submitGoal(goalId: string, employeeId: string) {
    const goal = await this.prisma.performanceGoal.findFirst({
      where: { id: goalId, employeeId },
    });
    if (!goal) throw new NotFoundException('Goal not found');
    if (goal.status !== GoalStatus.DRAFT) {
      throw new BadRequestException('Only draft goals can be submitted');
    }
    return this.prisma.performanceGoal.update({
      where: { id: goalId },
      data: { status: GoalStatus.SUBMITTED, updatedAt: new Date() },
    });
  }

  async selfReview(goalId: string, employeeId: string, data: Record<string, unknown>) {
    const goal = await this.prisma.performanceGoal.findFirst({
      where: { id: goalId, employeeId },
    });
    if (!goal) throw new NotFoundException('Goal not found');
    return this.prisma.performanceGoal.update({
      where: { id: goalId },
      data: {
        selfRating: Number(data.selfRating),
        selfComments: data.selfComments as string,
        updatedAt: new Date(),
      },
    });
  }

  async getMyGoals(employeeId: string) {
    return this.prisma.performanceGoal.findMany({
      where: { employeeId },
      include: { cycle: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Director: review goals ──────────────────────────────────────────

  async getDirectorPendingGoals(departmentId: string) {
    return this.prisma.performanceGoal.findMany({
      where: {
        status: GoalStatus.SUBMITTED,
        employee: { departmentId },
      },
      include: {
        cycle: true,
        employee: { select: { id: true, firstName: true, lastName: true, employeeId: true, designation: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async directorReview(goalId: string, reviewerId: string, departmentId: string, data: Record<string, unknown>) {
    const goal = await this.prisma.performanceGoal.findFirst({
      where: {
        id: goalId,
        status: GoalStatus.SUBMITTED,
        employee: { departmentId },
      },
    });
    if (!goal) throw new NotFoundException('Goal not found or not in your department');

    return this.prisma.performanceGoal.update({
      where: { id: goalId },
      data: {
        directorRating: Number(data.directorRating),
        directorComments: data.directorComments as string,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        status: GoalStatus.DIRECTOR_REVIEWED,
        updatedAt: new Date(),
      },
    });
  }

  async assignGoal(directorId: string, departmentId: string, data: Record<string, unknown>) {
    // Verify target employee is in director's department
    const targetEmp = await this.prisma.user.findFirst({
      where: { id: data.employeeId as string, departmentId },
    });
    if (!targetEmp) throw new BadRequestException('Employee not in your department');

    return this.createGoal(data.employeeId as string, { cycleId: data.cycleId, goalsText: data.goalsText });
  }

  // ── HR: view all + finalize ─────────────────────────────────────────

  async getAllGoals(cycleId?: string) {
    return this.prisma.performanceGoal.findMany({
      where: cycleId ? { cycleId } : undefined,
      include: {
        cycle: true,
        employee: { select: { id: true, firstName: true, lastName: true, employeeId: true, department: { select: { name: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async hrFinalize(goalId: string, hrId: string, data: Record<string, unknown>) {
    const goal = await this.prisma.performanceGoal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException('Goal not found');
    if (goal.status !== GoalStatus.DIRECTOR_REVIEWED) {
      throw new BadRequestException('Goal must be Director-reviewed before HR can finalize');
    }

    return this.prisma.performanceGoal.update({
      where: { id: goalId },
      data: {
        finalRating: Number(data.finalRating),
        hrComments: data.hrComments as string,
        finalizedById: hrId,
        finalizedAt: new Date(),
        status: GoalStatus.FINALIZED,
        updatedAt: new Date(),
      },
    });
  }
}

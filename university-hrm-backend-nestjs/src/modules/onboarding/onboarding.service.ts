import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OnboardingStatus, TaskStatus, Prisma } from '@prisma/client';
import { paginate } from '../../common/utils/pagination.util';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: Record<string, unknown>) {
    const where: Prisma.OnboardingEmployeeWhereInput = {};
    if (query.status) where.status = query.status as OnboardingStatus;
    if (query.departmentId) where.employee = { departmentId: query.departmentId as string };
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.onboardingEmployee.findMany({
        where, include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true, department: { select: { name: true } }, profilePhoto: true } }, tasks: { orderBy: { order: 'asc' } } },
        orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.onboardingEmployee.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const ob = await this.prisma.onboardingEmployee.findUnique({
      where: { id },
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true, department: { select: { name: true } } } }, tasks: { include: { assignedTo: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { order: 'asc' } } },
    });
    if (!ob) throw new NotFoundException('Onboarding record not found');
    return ob;
  }

  async findByEmployee(employeeId: string) {
    return this.prisma.onboardingEmployee.findUnique({
      where: { employeeId },
      include: { tasks: { include: { assignedTo: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { order: 'asc' } } },
    });
  }

  async create(data: { employeeId: string; startDate: string; expectedCompletionDate: string; tasks?: Array<{ title: string; description?: string; assignedToId: string; dueDate: string; priority?: string }> }) {
    return this.prisma.onboardingEmployee.create({
      data: {
        employeeId: data.employeeId,
        startDate: new Date(data.startDate),
        expectedCompletionDate: new Date(data.expectedCompletionDate),
        status: 'IN_PROGRESS',
        tasks: data.tasks ? {
          create: data.tasks.map((t, i) => ({
            title: t.title, description: t.description, assignedToId: t.assignedToId,
            dueDate: new Date(t.dueDate), priority: (t.priority as 'LOW' | 'MEDIUM' | 'HIGH') || 'MEDIUM', order: i,
          })),
        } : undefined,
      },
      include: { tasks: true },
    });
  }

  async addTask(onboardingId: string, data: { title: string; description?: string; assignedToId: string; dueDate: string; priority?: string }) {
    const maxOrder = await this.prisma.onboardingTask.aggregate({ where: { onboardingId }, _max: { order: true } });
    return this.prisma.onboardingTask.create({
      data: { onboardingId, title: data.title, description: data.description, assignedToId: data.assignedToId, dueDate: new Date(data.dueDate), priority: (data.priority as 'LOW' | 'MEDIUM' | 'HIGH') || 'MEDIUM', order: (maxOrder._max.order || 0) + 1 },
    });
  }

  async updateTask(taskId: string, data: Record<string, unknown>) {
    const task = await this.prisma.onboardingTask.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'COMPLETED') updateData.completedAt = new Date();
    }
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate as string);

    const updated = await this.prisma.onboardingTask.update({ where: { id: taskId }, data: updateData });

    // Check if all tasks complete
    const allTasks = await this.prisma.onboardingTask.findMany({ where: { onboardingId: task.onboardingId } });
    const allComplete = allTasks.every((t) => t.id === taskId ? data.status === 'COMPLETED' : t.status === 'COMPLETED');
    if (allComplete) {
      await this.prisma.onboardingEmployee.update({ where: { id: task.onboardingId }, data: { status: 'COMPLETED', completedAt: new Date() } });
    }

    return updated;
  }

  async reorderTasks(taskIds: string[]) {
    const updates = taskIds.map((id, index) => this.prisma.onboardingTask.update({ where: { id }, data: { order: index } }));
    await this.prisma.$transaction(updates);
    return { reordered: taskIds.length };
  }

  async deleteTask(taskId: string) {
    return this.prisma.onboardingTask.delete({ where: { id: taskId } });
  }
}

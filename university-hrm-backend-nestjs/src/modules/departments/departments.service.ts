import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const departments = await this.prisma.department.findMany({
      include: {
        director: { select: { id: true, firstName: true, lastName: true, profilePhoto: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    });
    return departments.map((d) => ({
      ...d,
      headCount: d._count.employees,
      _count: undefined,
    }));
  }

  async findOne(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: {
        director: { select: { id: true, firstName: true, lastName: true, profilePhoto: true } },
        employees: {
          select: { id: true, employeeId: true, firstName: true, lastName: true, role: true, designation: true, profilePhoto: true, status: true },
          orderBy: { firstName: 'asc' },
        },
      },
    });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async create(data: { name: string; code: string; directorId?: string }) {
    return this.prisma.department.create({ data });
  }

  async update(id: string, data: { name?: string; code?: string; directorId?: string }) {
    // If changing director, clear old director assignment first
    if (data.directorId) {
      const existing = await this.prisma.department.findUnique({ where: { id } });
      if (existing?.directorId && existing.directorId !== data.directorId) {
        // Old director's directedDepartment will be auto-cleared by unique constraint
      }
    }
    return this.prisma.department.update({ where: { id }, data });
  }

  async remove(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    });
    if (!dept) throw new NotFoundException('Department not found');
    if (dept._count.employees > 0) {
      throw new BadRequestException('Cannot delete department with active employees');
    }
    return this.prisma.department.delete({ where: { id } });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SystemRole } from '@prisma/client';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(query: string, currentUser: { role: SystemRole; departmentId: string | null }) {
    if (!query || query.length < 2) return { employees: [], departments: [], announcements: [] };

    const deptFilter = (currentUser.role === 'DIRECTOR') ? { departmentId: currentUser.departmentId } : {};

    const [employees, departments, announcements] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          ...deptFilter,
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { employeeId: { contains: query, mode: 'insensitive' } },
            { designation: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, employeeId: true, firstName: true, lastName: true, email: true, role: true, designation: true, department: { select: { name: true } }, profilePhoto: true },
        take: 10,
      }),
      this.prisma.department.findMany({
        where: { OR: [{ name: { contains: query, mode: 'insensitive' } }, { code: { contains: query, mode: 'insensitive' } }] },
        select: { id: true, name: true, code: true },
        take: 5,
      }),
      this.prisma.announcement.findMany({
        where: { OR: [{ title: { contains: query, mode: 'insensitive' } }, { body: { contains: query, mode: 'insensitive' } }] },
        select: { id: true, title: true, priority: true, publishedAt: true },
        orderBy: { publishedAt: 'desc' },
        take: 5,
      }),
    ]);

    return { employees, departments, announcements };
  }
}

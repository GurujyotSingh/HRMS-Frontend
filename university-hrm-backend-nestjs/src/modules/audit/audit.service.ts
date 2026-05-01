import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, Prisma } from '@prisma/client';
import { paginate } from '../../common/utils/pagination.util';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: Record<string, unknown>) {
    const where: Prisma.AuditLogWhereInput = {};
    if (query.userId) where.userId = query.userId as string;
    if (query.action) where.action = query.action as AuditAction;
    if (query.targetType) where.targetType = query.targetType as string;
    if (query.fromDate) where.createdAt = { gte: new Date(query.fromDate as string) };
    if (query.toDate) where.createdAt = { ...where.createdAt as object, lte: new Date(query.toDate as string) };
    if (query.search) {
      where.OR = [
        { user: { firstName: { contains: query.search as string, mode: 'insensitive' } } },
        { user: { lastName: { contains: query.search as string, mode: 'insensitive' } } },
        { user: { email: { contains: query.search as string, mode: 'insensitive' } } },
      ];
    }
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { firstName: true, lastName: true, email: true, role: true, profilePhoto: true } } },
        orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }
}

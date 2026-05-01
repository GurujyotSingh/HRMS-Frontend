import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SystemRole, Prisma } from '@prisma/client';
import { paginate } from '../../common/utils/pagination.util';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: Record<string, unknown>, currentUser: { sub: string; role: SystemRole; departmentId: string | null }) {
    const where: Prisma.AnnouncementWhereInput = {
      OR: [
        { targetRoles: { has: currentUser.role } },
        { targetRoles: { isEmpty: true } },
      ],
    };

    if (query.priority) {
      where.priority = query.priority as Prisma.EnumAnnouncementPriorityFilter['equals'];
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        include: {
          author: { select: { firstName: true, lastName: true, profilePhoto: true } },
          reads: { where: { userId: currentUser.sub }, select: { id: true } },
        },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.announcement.count({ where }),
    ]);

    const mapped = data.map(a => ({ ...a, isRead: a.reads.length > 0, reads: undefined }));
    return paginate(mapped, total, page, limit);
  }

  async create(data: Record<string, unknown>, authorId: string) {
    return this.prisma.announcement.create({
      data: {
        title: data.title as string, body: data.body as string, authorId,
        targetRoles: (data.targetRoles as SystemRole[]) || [],
        targetDepartments: (data.targetDepartments as string[]) || [],
        priority: (data.priority as 'NORMAL' | 'IMPORTANT' | 'URGENT') || 'NORMAL',
        expiresAt: data.expiresAt ? new Date(data.expiresAt as string) : null,
      },
    });
  }

  async markRead(announcementId: string, userId: string) {
    return this.prisma.announcementRead.upsert({
      where: { announcementId_userId: { announcementId, userId } },
      create: { announcementId, userId },
      update: {},
    });
  }

  async remove(id: string) { return this.prisma.announcement.delete({ where: { id } }); }
}

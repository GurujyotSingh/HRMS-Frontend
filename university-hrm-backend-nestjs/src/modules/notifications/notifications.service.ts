import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType, Prisma } from '@prisma/client';
import { paginate } from '../../common/utils/pagination.util';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService, private gateway: NotificationsGateway) {}

  async findAll(userId: string, query: Record<string, unknown>) {
    const where: Prisma.NotificationWhereInput = { userId };
    if (query.isRead !== undefined) where.isRead = query.isRead === 'true';
    if (query.type) where.type = query.type as NotificationType;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.notification.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  async create(userId: string, type: NotificationType, title: string, message: string, link?: string) {
    const notification = await this.prisma.notification.create({
      data: { userId, type, title, message, link },
    });
    // Push via WebSocket
    this.gateway.sendToUser(userId, notification);
    return notification;
  }

  async markRead(id: string) { return this.prisma.notification.update({ where: { id }, data: { isRead: true } }); }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    return { message: 'All notifications marked as read' };
  }

  async remove(id: string) { return this.prisma.notification.delete({ where: { id } }); }

  async getUnreadCount(userId: string) {
    return { count: await this.prisma.notification.count({ where: { userId, isRead: false } }) };
  }
}

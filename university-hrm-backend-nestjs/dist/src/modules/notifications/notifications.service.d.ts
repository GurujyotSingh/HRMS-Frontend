import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { NotificationsGateway } from './notifications.gateway';
export declare class NotificationsService {
    private prisma;
    private gateway;
    constructor(prisma: PrismaService, gateway: NotificationsGateway);
    findAll(userId: string, query: Record<string, unknown>): Promise<import("../../common/utils/pagination.util").PaginatedResult<{
        id: string;
        link: string | null;
        createdAt: Date;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        userId: string;
        message: string;
        isRead: boolean;
    }>>;
    create(userId: string, type: NotificationType, title: string, message: string, link?: string): Promise<{
        id: string;
        link: string | null;
        createdAt: Date;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        userId: string;
        message: string;
        isRead: boolean;
    }>;
    markRead(id: string): Promise<{
        id: string;
        link: string | null;
        createdAt: Date;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        userId: string;
        message: string;
        isRead: boolean;
    }>;
    markAllRead(userId: string): Promise<{
        message: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        link: string | null;
        createdAt: Date;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        userId: string;
        message: string;
        isRead: boolean;
    }>;
    getUnreadCount(userId: string): Promise<{
        count: number;
    }>;
}

import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private svc;
    constructor(svc: NotificationsService);
    findAll(userId: string, q: Record<string, string>): Promise<import("../../common/utils/pagination.util").PaginatedResult<{
        id: string;
        link: string | null;
        createdAt: Date;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        userId: string;
        message: string;
        isRead: boolean;
    }>>;
    unreadCount(userId: string): Promise<{
        count: number;
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
}

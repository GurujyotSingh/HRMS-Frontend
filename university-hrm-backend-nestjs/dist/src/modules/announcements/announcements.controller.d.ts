import { AnnouncementsService } from './announcements.service';
export declare class AnnouncementsController {
    private svc;
    constructor(svc: AnnouncementsService);
    findAll(q: Record<string, string>, u: Record<string, unknown>): Promise<import("../../common/utils/pagination.util").PaginatedResult<{
        isRead: boolean;
        reads: undefined;
        author: {
            firstName: string;
            lastName: string;
            profilePhoto: string | null;
        };
        id: string;
        createdAt: Date;
        title: string;
        body: string;
        targetRoles: import(".prisma/client").$Enums.SystemRole[];
        targetDepartments: string[];
        priority: import(".prisma/client").$Enums.AnnouncementPriority;
        publishedAt: Date;
        expiresAt: Date | null;
        authorId: string;
    }>>;
    create(body: Record<string, unknown>, userId: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        body: string;
        targetRoles: import(".prisma/client").$Enums.SystemRole[];
        targetDepartments: string[];
        priority: import(".prisma/client").$Enums.AnnouncementPriority;
        publishedAt: Date;
        expiresAt: Date | null;
        authorId: string;
    }>;
    markRead(id: string, userId: string): Promise<{
        id: string;
        userId: string;
        announcementId: string;
        readAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        body: string;
        targetRoles: import(".prisma/client").$Enums.SystemRole[];
        targetDepartments: string[];
        priority: import(".prisma/client").$Enums.AnnouncementPriority;
        publishedAt: Date;
        expiresAt: Date | null;
        authorId: string;
    }>;
}

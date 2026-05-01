import { PrismaService } from '../../prisma/prisma.service';
import { SystemRole } from '@prisma/client';
export declare class AnnouncementsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: Record<string, unknown>, currentUser: {
        sub: string;
        role: SystemRole;
        departmentId: string | null;
    }): Promise<import("../../common/utils/pagination.util").PaginatedResult<{
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
    create(data: Record<string, unknown>, authorId: string): Promise<{
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
    markRead(announcementId: string, userId: string): Promise<{
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
